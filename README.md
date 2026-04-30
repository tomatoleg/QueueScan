# QueueScan
<img width="1627" height="879" alt="image" src="https://github.com/user-attachments/assets/e63d778b-0064-4575-b1ce-773dc08fe177" />
<img width="1629" height="941" alt="image" src="https://github.com/user-attachments/assets/de53e592-72c2-4fab-be7d-4c15508468d1" />
<img width="1604" height="566" alt="image" src="https://github.com/user-attachments/assets/b43070de-f619-40f2-8596-e1b7f8878b92" />
 # QueueScan

> Real-time P25 scanner monitoring platform with replay, grouped conversations, live WebSocket updates, queue intelligence, Docker deployment, and TV-mode monitoring.


# Overview

QueueScan is a full-stack scanner monitoring application designed to provide a modern interface for radio traffic monitoring.

The system combines:

* **FastAPI backend**
* **React + Vite frontend**
* **WebSocket live updates**
* **Replay queue engine**
* **Talkgroup metadata integration**
* **Docker + Nginx deployment**
* **TV / kiosk display mode**
* **Priority-aware playback**
* **Conversation grouping by talkgroup**

QueueScan is designed to work alongside SDRTrunk / OP25-style workflows and can ingest call metadata and recordings for playback and monitoring.

---

# Features

## Live Monitoring

* Real-time call queue
* WebSocket updates from backend
* Live call playback
* Active call tracking
* Queue health monitoring

## Replay Engine

* Replay by talkgroup
* Replay history panel
* Replay queue injection
* Audio replay sequencing
* Token-authenticated playback

## Queue Intelligence

* Priority-aware queue ordering
* Talkgroup grouping
* Queue aging
* Delay tracking
* Critical queue visibility

## TV Mode

* Large-font display mode
* Passive monitoring dashboard
* Chromium kiosk compatible
* Optimized for mounted displays

## Deployment Ready

* Docker support
* Docker Compose
* Nginx reverse proxy
* API proxy routing
* WebSocket proxy support

---

# Architecture

```text
Browser
   ↓
Nginx Reverse Proxy
   ├── / → React Frontend
   ├── /api → FastAPI Backend
   └── /ws → WebSocket Proxy

FastAPI Backend
   ├── REST API
   ├── WebSocket Events
   ├── Replay Engine
   ├── Talkgroup Metadata
   └── Audio Queue
```

---

# Project Structure

```text
QueueScan/
├── backend/
│   ├── QueueScan.py
│   ├── requirements.txt
│   ├── Dockerfile
│   ├── config/
│   ├── logs/
│   └── static/
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── services/
│   │   ├── store/
│   │   ├── utils/
│   │   └── config.js
│   │
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── rebuild.sh
│   └── package.json
│
├── docker-compose.yml
├── docker-compose.dev.yml
├── README.md
└── .gitignore
```

---

# Frontend Stack

* React
* Vite
* Zustand
* TailwindCSS
* WebSockets

---

# Backend Stack

* FastAPI
* Uvicorn
* PyYAML
* WebSockets
* JWT Authentication
* File-backed metadata

---

# Screenshots

## Dashboard

![Dashboard](./docs/screenshots/dashboard-overview.png)

## Queue Timeline

![Queue Timeline](./docs/screenshots/queue-panel.png)

## History Replay

![History Replay](./docs/screenshots/history-panel.png)

## TV Mode

![TV Mode](./docs/screenshots/tv-mode.png)

---

# Backend Configuration

Configuration is YAML-driven.

Location:

```text
backend/config/config.yaml
```

Example:

```yaml
app:
  name: QueueScan
  version: 1.0

network:
  lan_prefix: "192.168.1"
  require_lan_login: false

paths:
  talkgroups: config/talkgroups.json
  users: config/users.json
  logs: logs/queuescan.log
```

---

# Docker Deployment

## Start QueueScan With Docker

From the QueueScan project root:

```bash
cd QueueScan
```

---

## First-Time Build

Build frontend, backend, nginx, and supporting containers:

```bash
docker compose up --build -d
```

This will:

* Build the backend container
* Build the frontend container
* Start nginx reverse proxy
* Start QueueScan API + WebSocket services
* Connect services through Docker networking

---

## Verify Containers

Check running containers:

```bash
docker compose ps
```

Expected services:

```text
queuescan-backend
queuescan-frontend
queuescan-nginx
```

---

## View Logs

View all logs:

```bash
docker compose logs -f
```

View backend only:

```bash
docker compose logs -f backend
```

View frontend only:

```bash
docker compose logs -f frontend
```

---

## Restart Containers

```bash
docker compose restart
```

Restart a single service:

```bash
docker compose restart backend
```

---

## Stop QueueScan

```bash
docker compose down
```

---

## Full Rebuild

Use when dependencies or Dockerfiles change:

```bash
docker compose down
docker compose up --build -d
```

---

## Remove Old Containers + Volumes

Use only when you want a clean reset:

```bash
docker compose down -v
```

---

## Access QueueScan

Once containers are running:

```text
http://localhost
```

LAN example:

```text
http://192.168.1.20
```

Tailscale example:

```text
https://your-host.tailnet.ts.net
```

---

## Typical Docker Workflow

```bash
docker compose up --build -d
docker compose logs -f
docker compose restart backend
docker compose down
```

---

# Nginx Proxy Routing

QueueScan uses reverse proxy routing.

## Routes

| Route    | Target          |
| -------- | --------------- |
| `/`      | Frontend        |
| `/api/*` | FastAPI Backend |
| `/ws`    | WebSocket       |

---

# Frontend Build + Deploy

QueueScan includes a rebuild helper.

```bash
cd frontend
./rebuild.sh
```

Typical rebuild script:

```bash
npm run build
sudo rm -rf /usr/share/nginx/html/*
sudo cp -r dist/* /usr/share/nginx/html/
sudo systemctl restart nginx
```

---

# Development

## Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend default:

```text
http://localhost:5173
```

---

## Backend

```bash
cd backend
python QueueScan.py
```

Backend default:

```text
http://localhost:8080
```

---

# Environment Variables

Frontend `.env`

```env
VITE_APP_NAME=QueueScan
VITE_DEFAULT_VOLUME=1.0
```

---

# API Structure

## REST

```text
/api/talkgroups
/api/history
/api/replay/{tgid}
/api/call/{filename}
```

---

## WebSocket

```text
/ws?token=JWT_TOKEN
```

---

# Queue Flow

```text
Incoming Call
      ↓
WebSocket Event
      ↓
Queue Store
      ↓
Grouped Queue
      ↓
Audio Player
      ↓
History Storage
```

---

# Security

QueueScan supports:

* JWT token authentication
* LAN login restriction
* Token-authenticated replay
* Config-driven access control

---

# Git Ignore Recommendations

Do NOT commit:

```text
backend/config/config.yaml
backend/config/users.json
backend/config/talkgroups.json
backend/logs/
backend/recordings/
frontend/node_modules/
frontend/dist/
```

---

# Recommended Future Enhancements

* Conversation locking by TGID
* Queue virtualization
* Analytics dashboard
* Multi-node ingest
* VPS deployment templates
* User roles / permissions
* Database-backed history
* Multi-scanner federation

---

# License

Add your preferred license here.

Examples:

* MIT
* GPLv3
* Apache 2.0

---

# Author

**QueueScan**

Designed for real-time SDR / scanner monitoring workflows.

