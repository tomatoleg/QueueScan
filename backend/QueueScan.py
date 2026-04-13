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

import uvicorn
from mutagen.mp3 import MP3
from inotify_simple import INotify, flags

# ============================================================
# CONFIGURATION & PATHS
# ============================================================
LAN_PREFIX = "192.168.1."
SESSION_TIMEOUT = 3600
MAX_HISTORY = 250
MAX_ACTIVE = 50
SECRET_KEY = "IEYFORT"
ALGORITHM = "HS256"
TOKEN_EXPIRE_HOURS = 24

RECORD_DIR = Path("/home/trey/SDRTrunk/recordings")
TG_FILE = Path(__file__).parent.parent / "config/talkgroups.json"
USER_FILE = Path(__file__).parent.parent / "config/users.json"
HTML_FILE = Path(__file__).parent.parent / "frontend/QueueScan.html"
LOG_FILE = Path(__file__).parent.parent / "logs/login.log"
# ============================================================
# GLOBAL STATE
# ============================================================
clients = []
users = {}
history = []
replay_buffer = deque(maxlen=20)
activity_counter = defaultdict(int)
activity_meta = {}
TG_MAP = {}
processed_files = set()

# ============================================================
# HELPERS & DATA LOADING
# ============================================================
def load_users():
    global users
    if USER_FILE.exists():
        users = json.load(open(USER_FILE)).get("users", {})

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
                    if not info["encrypted"]: replay_buffer.append(info["file"])
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

    return {
        "time": ts.strftime("%H:%M:%S"),
        "talkgroup": f"{tg_info['name']} ({tg_number})",
        "talkgroup_name": tg_info["name"],
        "category": tg_info["category"],
        "radio": radio,
        "frequency": frequency,
        "file": filename,
        "duration": duration,
        "tgid": tg_number,
        "encrypted": encrypted
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
app.mount("/static", StaticFiles(directory="static"), name="static")

# ============================================================
# ROUTES (Must come AFTER app = FastAPI)
# ============================================================
class LoginRequest(BaseModel):
    username: str
    password: str

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
        raise HTTPException(status_code=401)
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
    if any(path.startswith(p) for p in ["/", "/login", "/verify", "/static"]) or request.client.host.startswith(LAN_PREFIX):
        return await call_next(request)
    token = request.query_params.get("token")
    if token and verify_token(token): return await call_next(request)
    return Response(status_code=401)

@app.get("/")
async def root(): return HTMLResponse(HTML_FILE.read_text())

@app.get("/call/{f}")
async def serve_audio(f: str, token: str = Query(None)):
    path = RECORD_DIR / f
    return FileResponse(path, media_type="audio/mpeg")

if __name__ == "__main__":
    uvicorn.run("QueueScan:app", host="0.0.0.0", port=8080)
