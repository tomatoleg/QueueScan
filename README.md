# QueueScan
<img width="1627" height="879" alt="image" src="https://github.com/user-attachments/assets/e63d778b-0064-4575-b1ce-773dc08fe177" />

QueueScan is a real-time P25 scanner dashboard that transforms SDRTrunk call recordings into a live, interactive web-based listening experience.

It provides intelligent audio queuing, talkgroup filtering, replay functionality, and activity visualization through a modern Python FastAPI + WebSocket backend and responsive frontend.

---

## 🚀 Features

* 🎧 Live + queued audio playback
* 🔒 Talkgroup-based audio filtering (lock mode)
* 🔁 Replay individual calls or entire talkgroups
* ⚡ Priority-based call handling
* 📊 Real-time activity tracking
* 🌐 WebSocket-driven low-latency updates
* 🔐 Token-based authentication

---

## 🏗️ Architecture

```
SDRTrunk → MP3 Recordings → FastAPI Backend → WebSocket → Browser UI
```

* **SDRTrunk** generates call recordings
* **Backend** watches recordings and streams metadata
* **Frontend** manages queue, playback, filtering, and UI

---

## 📦 Requirements

* Python 3.10+
* SDRTrunk (recording enabled) https://github.com/Dsheirer/sdrtrunk/releases
* Linux (recommended)

Python dependencies:

```
fastapi
uvicorn
python-jose
pyyaml
mutagen
inotify-simple
```

---

## ⚙️ Installation

### 1. Clone the repository

```
git clone https://github.com/tomatoleg/QueueScan.git
cd QueueScan
```

### 2. Install dependencies

```
pip install -r requirements.txt
```

### 3. Configure the application

Copy the example config:

```
cp config/config.example.yaml config/config.yaml
```

Edit the config file:

* Set your SDRTrunk recordings path
* Generate a secure secret key

### Generate a secret key

```
python -c "import secrets; print(secrets.token_hex(32))"
or from the command line:  openssl rand -hex 32
```

---

## ▶️ Running the App

```
python backend/QueueScan.py
```

Then open:

```
http://localhost:8080
```

---

## 🔧 Configuration Overview

Key settings in `config.yaml`:

* `paths.recordings` → SDRTrunk recordings directory
* `auth.secret_key` → JWT signing key
* `limits.max_history` → number of calls stored
* `limits.max_active` → active talkgroups displayed

---

## 📡 talkgroups.json

`talkgroups.json` defines how numeric talkgroup IDs (TGIDs) are translated into meaningful, structured data within QueueScan.

### 🧠 Purpose

SDRTrunk outputs activity using **raw talkgroup IDs only**. These IDs (e.g., `101`, `3021`) are not human-friendly and contain no inherent context.

`talkgroups.json` provides a lightweight mapping layer that enriches those IDs with:

- A **display name**
- A **category** (`law`, `fire`, `ems`, `other`)

---

### ⚙️ How it works

When a call is processed, QueueScan:

1. Extracts the TGID from the recording filename  
2. Looks up the TGID in `talkgroups.json`  
3. Applies the mapped metadata to the call  

This enriched data is then used throughout the application.

---

### 🎯 What it affects

The data in `talkgroups.json` drives multiple parts of the system:

- **UI display** — human-readable talkgroup names  
- **Color coding** — category-based styling (law/fire/EMS/etc.)  
- **Filtering** — talkgroup lock/filter behavior  
- **Priority logic** — playback ordering  
- **Activity tracking** — grouping and counters  

---

### 📄 Example

```json
{
  "101": {
    "name": "Sheriff Dispatch",
    "category": "law"
  },
  "102": {
    "name": "Fire Dispatch",
    "category": "fire"
  }
}
---

## 📁 Project Structure

```
QueueScan/
├── backend/
│   └── QueueScan.py
├── frontend/
│   └── QueueScan.html
├── config/
│   ├── config.example.yaml
│   ├── talkgroups.json
│   └── users.json
├── static/
├── logs/
```

---

## ⚠️ Disclaimer

This is a personal project provided as-is. No guarantees, no support, but feel free to experiment and improve it.

---

## 💡 Future Ideas


* Mobile UI improvements
* Cloud deployment options
* Public demo mode

---
# QueueScan — High-Level System Overview

> QueueScan is a full-stack scanner monitoring platform that combines SDR radio systems, backend processing, metadata enrichment, live audio streaming, and a React frontend into a real-time situational awareness console.

---

# 🧠 What QueueScan Does

QueueScan receives scanner calls from a radio monitoring system and transforms them into a live operator experience.

Instead of simply playing audio, QueueScan provides:

* 🎧 Intelligent audio playback
* 📡 Talkgroup awareness
* 🧠 Priority handling
* 🔁 Replay capability
* 📺 TV mode monitoring
* 🔐 Authentication
* 📊 Queue visualization
* 🛰 Metadata enrichment

---

# 🏗 Full System Architecture

```text
┌─────────────────────────────┐
│        Radio System         │
│ SDRTrunk / OP25 / P25 Feed │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│      Scanner Recordings     │
│  MP3 Calls + Event Metadata │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│      QueueScan Backend      │
│           FastAPI           │
└──────────────┬──────────────┘
               │
      ┌────────┴─────────┐
      │                  │
      ▼                  ▼
 REST API          WebSocket Updates
      │                  │
      └────────┬─────────┘
               ▼
┌─────────────────────────────┐
│     QueueScan Frontend      │
│        React + Vite         │
└─────────────────────────────┘
```

---

# 📡 Radio Layer

QueueScan begins with radio monitoring.

Supported sources:

* SDRTrunk
* OP25
* P25 systems
* trunked radio systems

The radio system generates:

* MP3 call recordings
* Talkgroup IDs
* Radio IDs
* Frequency
* Time
* Encryption status

---

# 🎙 Scanner Recording Layer

Each scanner call becomes a recording.

Example:

```text
20260426_160436_Palmetto-800_Richland_T-Control__TO_25667_FROM_2405422.mp3
```

This contains:

* time
* source
* talkgroup
* radio ID
* system

QueueScan uses recordings as the source of truth.

---

# ⚙️ QueueScan Backend

The backend is built with FastAPI.

Primary role:

> Convert raw scanner events into structured live data.

---

# Backend Responsibilities

## 1️⃣ Monitor Scanner Activity

Backend watches for:

* new recordings
* metadata changes
* call completion

---

## 2️⃣ Parse Calls

Extracts:

* TGID
* radio ID
* timestamps
* frequency
* encryption

---

## 3️⃣ Metadata Enrichment

Backend loads:

```text
backend/config/talkgroups.json
```

This provides:

* label
* agency
* category
* priority
* TV eligibility
* filtering defaults

---

# Example Metadata

```json
{
  "25667": {
    "label": "Columbia Police North",
    "agency": "Columbia Police",
    "priority": 4,
    "listen": true,
    "tv": false
  }
}
```

---

# 4️⃣ Build Live Call Object

Backend creates a normalized object.

Example:

```json
{
  "tgid": "25667",
  "label": "Columbia Police North",
  "agency": "Columbia Police",
  "priority": 4,
  "radio": "2405422",
  "time": "16:04:36",
  "file": "recording.mp3"
}
```

---

# 5️⃣ Serve API

Backend exposes REST endpoints.

Examples:

```text
/login
/api/talkgroups
/api/history
/api/queue
```

---

# 6️⃣ Push WebSocket Updates

QueueScan uses WebSockets for real-time events.

```text
ws://HOST:8080/ws
```

This pushes:

* new calls
* queue changes
* playback updates
* metadata updates

---

# 🌐 REST API Layer

Used for:

* login
* metadata
* talkgroups
* queue history
* replay

---

# 📡 WebSocket Layer

WebSocket is the heartbeat of QueueScan.

Without WebSocket:

```text
no live updates
no queue updates
no playback synchronization
```

---

# 🖥 Frontend Layer

Frontend is built using:

* React
* Vite
* Zustand
* Tailwind

Primary role:

> Turn backend events into an operator experience.

---

# Frontend Responsibilities

## Queue Management

Stores:

* active queue
* replay queue
* playback state
* history

---

## Audio Playback

Frontend controls:

* playback queue
* replay playback
* autoplay
* live audio

---

## TV Mode

Large-format monitoring layout.

Features:

* large text
* simplified layout
* readability from distance
* auto-login support

---

## Authentication

Login flow:

```text
Login
 ↓
JWT Token
 ↓
Stored locally
 ↓
Used for backend access
```

---

# 🧠 Zustand Store

QueueScan uses Zustand as the central state manager.

File:

```text
frontend/src/store/useScannerStore.js
```

Handles:

* queue
* audio
* filters
* priorities
* replay
* talkgroups
* TV mode

---

# 🔁 Queue Lifecycle

```text
Scanner call occurs
        ↓
Backend enriches metadata
        ↓
WebSocket push
        ↓
Frontend receives update
        ↓
Call enters queue
        ↓
Priority sorting
        ↓
Audio playback
        ↓
Call removed
```

---

# 🎯 Priority System

QueueScan determines priority using:

```text
Local Override
      ↓
Talkgroup Metadata
      ↓
Backend Priority
      ↓
Fallback Default
```

---

# 🎯 Filtering System

QueueScan can filter based on:

* manual selection
* metadata
* TV mode
* listen flags

---

# 📺 TV Mode Flow

```text
TV Browser
      ↓
Auto-login guest
      ↓
TV layout
      ↓
Large audio player
      ↓
Queue visibility
```

Launch:

```text
http://HOST:5173?mode=tv
```

---

# 🧩 File Relationships

```text
backend/QueueScan.py
        ↓
backend/config/talkgroups.json
        ↓
/api/talkgroups
        ↓
frontend/useScannerStore
        ↓
AudioPlayer + QueuePanel
```

---

# 📁 Repository Structure

```text
QueueScan/
├── backend/
│   ├── QueueScan.py
│   ├── config/
│   ├── logs/
│   └── static/
│
├── frontend/
│   ├── src/
│   ├── public/
│   └── vite.config.js
│
├── utilities/
├── backups/
└── README.md
```

---

# 🔄 Full Data Flow

```text
Scanner → Recording → Backend → Metadata → WebSocket → Frontend → Queue → Audio
```

---

# 🚀 Why QueueScan Is Different

Traditional scanner apps:

* passive listening
* minimal metadata
* no prioritization

QueueScan provides:

* live awareness
* intelligent queueing
* replay
* metadata enrichment
* TV mode
* persistence

---

# 🧠 QueueScan Philosophy

QueueScan is not a media player.

QueueScan is:

> A live scanner operations console.

Designed for:

* monitoring stations
* radio hobbyists
* command centers
* passive surveillance
* situational awareness

---

# ✅ System Summary

QueueScan combines:

* SDR radio monitoring
* FastAPI backend
* metadata engine
* WebSocket synchronization
* React frontend
* queue playback
* authentication
* TV mode

Into one real-time monitoring platform.



---

## 📜 License

MIT (or your preferred license)
