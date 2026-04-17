#!/usr/bin/env python3

import asyncio
import json
import re
from jose import jwt, JWTError
from datetime import datetime, timedelta
from pathlib import Path
from collections import deque, defaultdict
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, HTTPException, WebSocket, WebSocketDisconnect, Query
from fastapi.responses import HTMLResponse, FileResponse, Response
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

import yaml
import uvicorn
from mutagen.mp3 import MP3
from inotify_simple import INotify, flags

# ============================================================
# CONFIGURATION & PATHS
# ============================================================

BASE_DIR = Path(__file__).parent.parent
CONFIG_FILE = BASE_DIR / "config/config.yaml"

if not CONFIG_FILE.exists():
    raise RuntimeError("Missing config/config.yaml")

with open(CONFIG_FILE) as f:
    CONFIG = yaml.safe_load(f)


# ============================================================
# CONFIGURATION (from YAML)
# ============================================================

SECRET_KEY = CONFIG["auth"]["secret_key"]
TOKEN_EXPIRE_HOURS = CONFIG["auth"]["token_expire_hours"]
ALGORITHM = CONFIG["server"]["algorithm"]

RECORD_DIR = Path(CONFIG["paths"]["recordings"])

REQUIRE_LAN_LOGIN = CONFIG["network"].get("require_lan_login", False)
TG_FILE = BASE_DIR / CONFIG["paths"]["talkgroups"]
USER_FILE = BASE_DIR / CONFIG["paths"]["users"]
HTML_FILE = BASE_DIR / CONFIG["paths"]["html"]
LOG_FILE = BASE_DIR / CONFIG["paths"]["logs"]
STATIC_DIR = BASE_DIR / CONFIG["paths"]["static"]
APP_NAME = CONFIG.get("app", {}).get("name", "QueueScan")
APP_VERSION = CONFIG["app"]["version"]
LAN_PREFIX = CONFIG["network"]["lan_prefix"]
SESSION_TIMEOUT = CONFIG["session"]["timeout"]
MAX_HISTORY = CONFIG["limits"]["max_history"]
MAX_ACTIVE = CONFIG["limits"]["max_active"]


# ============================================================
# GLOBAL STATE
# ============================================================
clients = []
users = {}
history = []
replay_buffer = deque(maxlen=200)
activity_counter = defaultdict(int)
activity_meta = {}
TG_MAP = {}
processed_files = set()

# ============================================================
# HELPERS & DATA LOADING
# ============================================================
def log_event(msg):
    with open(LOG_FILE, "a") as f:
        f.write(msg + "\n")

def load_users():
    global users
    if USER_FILE.exists():
        users = json.load(open(USER_FILE)).get("users", {})


def format_call(filename, tg_map):
    parts = filename.replace(".mp3", "").split("_")

    date = parts[0]
    time = parts[1]
    tgid = parts[2]
    radio = parts[3] if len(parts) > 3 else "Unknown"

    tg = tg_map.get(tgid, {"name": f"TG {tgid}"})

    display = f"{time} | {tg['name']} | Unit {radio}"

    return display
def load_talkgroups():
    global TG_MAP
    if TG_FILE.exists():
        with open(TG_FILE) as f:
            TG_MAP = json.load(f)

def verify_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload.get("sub")
    except JWTError:
        return None

def get_tg_info(tg_number):
    key = str(int(tg_number)) if tg_number.isdigit() else str(tg_number)
    tg = TG_MAP.get(key, {"name": f"TG {key}", "category": "other"})
    raw = tg.get("category", "other").lower()
    if raw in ["police", "law", "sheriff"]: tg["category"] = "law"
    elif raw == "fire": tg["category"] = "fire"
    elif raw in ["ems", "medical"]: tg["category"] = "ems"
    else: tg["category"] = "other"
    return tg

def extract_tg_from_filename(filename):
    match = re.search(r"TO_(?:P)?(\d+)", filename)
    return match.group(1) if match else "0"

async def wait_for_complete_file(path, checks=6, delay=0.4):
    last_size = -1
    for _ in range(checks):
        try:
            size = path.stat().st_size
            if size == last_size and size > 0: return True
            last_size = size
        except FileNotFoundError: return False
        await asyncio.sleep(delay)
    return False

# ============================================================
# CORE ENGINE (WATCHER)
# ============================================================
async def watch_recordings():
    inotify = INotify()
    inotify.add_watch(str(RECORD_DIR), flags.CLOSE_WRITE)
    while True:
        for event in inotify.read(timeout=1000):
            if not event.name.endswith(".mp3") or event.name in processed_files:
                continue
            file_path = RECORD_DIR / event.name
            processed_files.add(event.name)
            try:
                if await wait_for_complete_file(file_path):
                    info = parse_call(file_path)
                    history.insert(0, info)
                    tg = info["talkgroup_name"]
                    activity_counter[tg] += 1
                    activity_meta[tg] = {"category": info["category"], "last_seen": info["time"], "tgid": info["tgid"]}
#                   if not info["encrypted"]: replay_buffer.append(info["file"])
                    if not info["encrypted"]: replay_buffer.append(info)
                    if len(history) > MAX_HISTORY: history.pop()
                    await broadcast({"type": "full_update", "metadata": info, "history": history[:MAX_HISTORY], 
                                     "activity": {tg: {"count": c, **activity_meta.get(tg, {})} 
                                     for tg, c in sorted(activity_counter.items(), key=lambda x: x[1], reverse=True)[:MAX_ACTIVE]}})
            except Exception as e: print(f"[ERROR] {e}")
        await asyncio.sleep(0.01)


def parse_call(file_path):
    filename = file_path.name
    tg_number = extract_tg_from_filename(filename)
    tg_info = get_tg_info(tg_number)

    audio = MP3(file_path)
    duration = audio.info.length
    encrypted = duration < 0.7

    tags = audio.tags or {}
    radio = tags.get("TPE1", ["Unknown"])[0]

    frequency = ""
    comment = str(tags.get("COMM::eng", ""))
    for part in comment.split(","):
        if "Frequency" in part:
            raw = part.split(":")[-1].strip().replace(";", "")
            if raw.isdigit():
                hz = int(raw)
                mhz = hz / 1_000_000
                frequency = f"{mhz:.4f} MHz"
            else:
                frequency = raw

    ts = datetime.fromtimestamp(file_path.stat().st_mtime)
    time_str = ts.strftime("%H:%M:%S")
    radio_str = f"Unit {radio}" if radio != "Unknown" else "Unknown Unit"
    return {
        "tgid": tg_number,
        "time": time_str,
        "talkgroup": f"{tg_info['name']} ({tg_number})",
        "talkgroup_name": tg_info["name"],
        "category": tg_info["category"],
        "radio": radio,
        "frequency": frequency,
        "file": filename,
        "encrypted": encrypted,
        "duration": duration,
        "display": f"{time_str} | {tg_info['name']} | {radio_str}"
        }


async def broadcast(event):
    dead = []
    for ws in clients:
        try: await ws.send_json(event)
        except: dead.append(ws)
    for d in dead: 
        if d in clients: clients.remove(d)

# ============================================================
# LIFESPAN & APP INIT
# ============================================================
@asynccontextmanager
async def lifespan(app: FastAPI):
    LOG_FILE.parent.mkdir(parents=True, exist_ok=True)
    load_users()
    load_talkgroups()
    watcher_task = asyncio.create_task(watch_recordings())
    yield
    watcher_task.cancel()

app = FastAPI(lifespan=lifespan)
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

# ============================================================
# ROUTES (Must come AFTER app = FastAPI)
# ============================================================
class LoginRequest(BaseModel):
    username: str
    password: str

@app.get("/replay/{tgid}")
def replay_talkgroup(tgid: str, limit: int = 25):

    # Filter matching TGID
    matches = [
        call for call in replay_buffer
        if str(call.get("tgid")) == str(tgid)
        and not call.get("encrypted")
    ]

    # Return newest first → reverse for playback order
    matches = matches[-limit:]

    return list(matches)

@app.get("/version")
def version():
    return {
        "name": APP_NAME,
        "version": APP_VERSION
    }

@app.get("/verify")
def verify(token: str = Query(None)):
    user = verify_token(token)

    if not user:
        raise HTTPException(status_code=401)

    return {"user": user}

@app.post("/login")
def login(data: LoginRequest, request: Request):
    ip = request.headers.get("x-forwarded-for", request.client.host)
    stored_pw = users.get(data.username)
    if not stored_pw or stored_pw != data.password:
        log_event(f"[LOGIN FAILED] {datetime.now()} user={data.username} ip={ip}")
        raise HTTPException(status_code=401)
    log_event(f"[LOGIN SUCCESS] {datetime.now()} user={data.username} ip={ip}")
    token = jwt.encode({"sub": data.username, "exp": datetime.utcnow() + timedelta(hours=24)}, SECRET_KEY, algorithm=ALGORITHM)
    return {"access_token": token}

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket, token: str = Query(None)):
    if not verify_token(token):
        await websocket.close()
        return
    await websocket.accept()
    clients.append(websocket)
    try:
        while True: await asyncio.sleep(10)
    except WebSocketDisconnect:
        if websocket in clients: clients.remove(websocket)


@app.middleware("http")
async def auth_middleware(request: Request, call_next):
    path = request.url.path

    client_ip = request.headers.get("x-forwarded-for", request.client.host)
    client_ip = client_ip.split(",")[0].strip()

    PUBLIC_PATHS = ["/login", "/verify", "/static"]

    is_public_path = (
        path == "/" or
        any(path.startswith(p) for p in PUBLIC_PATHS)
    )

    is_lan = client_ip.startswith(LAN_PREFIX)

#    print(f"[AUTH DEBUG] IP={client_ip} LAN={client_ip.startswith(LAN_PREFIX)} PATH={path}")

    # ✅ LAN auto-auth (DO THIS FIRST)
    if is_lan and not REQUIRE_LAN_LOGIN:
        has_cookie = "token" in request.cookies
        has_query_token = request.query_params.get("token") is not None

        guest_token = jwt.encode(
            {
                "sub": "guest",
                "exp": datetime.utcnow() + timedelta(hours=TOKEN_EXPIRE_HOURS)
            },
            SECRET_KEY,
            algorithm=ALGORITHM
        )

        response = await call_next(request)
    
        # Only create guest session if NO auth exists
        if not has_cookie and not has_query_token:
            log_event(f"[GUEST LOGIN] {datetime.now()} ip={client_ip}")
    
            response.set_cookie(
                key="token",
                value=guest_token,
                httponly=False,
                max_age=TOKEN_EXPIRE_HOURS * 3600
            )

        return response

    # 1. Always allow public routes
    if is_public_path:
        return await call_next(request)

    # 2. Require auth
    token = request.query_params.get("token") or request.cookies.get("token")
    if token and verify_token(token):
        return await call_next(request)

    return Response(status_code=401)



@app.api_route("/", methods=["GET", "HEAD"])
async def root(request: Request):
    if request.method == "HEAD":
        return HTMLResponse(status_code=200)
    return HTMLResponse(HTML_FILE.read_text())

@app.get("/call/{f}")
async def serve_audio(f: str, token: str = Query(None)):
    path = RECORD_DIR / f
    return FileResponse(path, media_type="audio/mpeg")

if __name__ == "__main__":
    uvicorn.run("QueueScan:app", host="0.0.0.0", port=8080)
