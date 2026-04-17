# QueueScan

QueueScan is a real-time P25 scanner dashboard that transforms SDRTrunk call recordings into a live, interactive web-based listening experience.

It provides intelligent audio queuing, talkgroup filtering, replay functionality, and activity visualization through a modern FastAPI + WebSocket backend and responsive frontend.

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

## ☕ Support

If you find this useful, consider adding a tip jar or GitHub Sponsors.

---

## 📜 License

MIT (or your preferred license)
