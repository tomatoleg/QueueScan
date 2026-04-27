# QueueScan Frontend

QueueScan Frontend is the React + Vite web interface for the QueueScan monitoring platform.

It connects to the FastAPI backend to provide:

* Live scanner queue monitoring
* Audio playback
* Talkgroup metadata display
* TV mode display
* Authentication
* Queue replay
* WebSocket live updates
* Smart filtering and priority handling

---

# Frontend Architecture

```text
frontend/
├── public/
├── src/
│   ├── components/
│   ├── hooks/
│   ├── layouts/
│   ├── pages/
│   ├── services/
│   ├── store/
│   ├── App.jsx
│   └── main.jsx
├── package.json
├── package-lock.json
├── vite.config.js
├── eslint.config.js
├── index.html
└── README.md
```

---

# Requirements

Install the following before running QueueScan Frontend:

## Required Software

* Node.js 20+
* npm 10+
* Git

Verify installation:

```bash
node -v
npm -v
```

---

# Install Node.js (Fedora)

```bash
sudo dnf install nodejs npm
```

Verify:

```bash
node -v
npm -v
```

---

# Frontend Installation

Navigate into frontend:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

This creates:

```text
frontend/node_modules/
```

---

# Frontend Dependencies

QueueScan uses the following core packages.

## Core React

```text
react
react-dom
```

Used for UI rendering.

---

## Vite

```text
vite
@vitejs/plugin-react
```

Used for:

* fast development server
* hot module replacement
* optimized production build

---

## Routing

```text
react-router-dom
```

Used for:

* page navigation
* TV mode URL routing
* login flow

---

## State Management

```text
zustand
```

Used for:

* scanner state
* playback queue
* authentication state
* filters
* priorities
* TV mode

---

## Animation

```text
framer-motion
```

Used for:

* smooth transitions
* panel animations
* visual movement

---

## Icons

```text
lucide-react
```

Used for:

* icons
* player controls
* visual UI elements

---

## Tailwind CSS

Used for:

* responsive layout
* TV mode scaling
* utility-first styling

Installed packages:

```text
tailwindcss
@tailwindcss/vite
```

---

# Install Packages Manually

If rebuilding from scratch:

```bash
npm install react react-dom
npm install vite @vitejs/plugin-react --save-dev
npm install react-router-dom
npm install zustand
npm install framer-motion
npm install lucide-react
npm install tailwindcss @tailwindcss/vite
```

---

# Vite Configuration

File:

```text
frontend/vite.config.js
```

Example:

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],

  server: {
    host: true,
    port: 5173,
  },
})
```

---

# Start Frontend Development Server

```bash
cd frontend
npm run dev
```

Vite default URL:

```text
http://localhost:5173
```

LAN example:

```text
http://192.168.1.20:5173
```

---

# Frontend Build

Build production frontend:

```bash
npm run build
```

Output:

```text
frontend/dist/
```

Preview production build:

```bash
npm run preview
```

---

# Backend Integration

QueueScan Frontend connects to FastAPI backend.

Architecture:

```text
Frontend (React + Vite)
        ↓
REST API
        ↓
FastAPI Backend
        ↓
Scanner Data + Metadata
```

---

# Backend URL Configuration

File:

```text
frontend/src/config.js
```

Example:

```js
export const config = {
  backendUrl: "http://192.168.1.20:8080",
};
```

---

# Backend Communication

QueueScan uses:

## REST API

Used for:

* login
* talkgroups
* replay queue
* metadata
* filters

Examples:

```text
GET /api/talkgroups
POST /login
GET /api/queue
GET /api/history
```

---

## WebSocket

Used for:

* live scanner updates
* queue insertion
* real-time playback updates

WebSocket example:

```text
ws://192.168.1.20:8080/ws
```

---

# Authentication Flow

```text
Login Screen
      ↓
POST /login
      ↓
JWT token
      ↓
Stored in Zustand + localStorage
      ↓
WebSocket connection authenticated
```

---

# Queue Flow

```text
Backend receives scanner call
            ↓
Backend enriches metadata
            ↓
WebSocket push
            ↓
Frontend receives update
            ↓
Queue stored in Zustand
            ↓
Audio playback
```

---

# TV Mode

QueueScan supports a TV-specific interface.

Launch:

```text
http://HOST:5173?mode=tv
```

TV mode features:

* oversized typography
* queue visibility
* kiosk usage
* large player layout
* optional guest auto-login

---

# Frontend State Store

File:

```text
frontend/src/store/useScannerStore.js
```

Manages:

* queue
* playback
* priorities
* filters
* metadata
* talkgroups
* replay queue
* audio state

---

# Common Commands

## Install dependencies

```bash
npm install
```

## Run development server

```bash
npm run dev
```

## Build production

```bash
npm run build
```

## Preview build

```bash
npm run preview
```

---

# Common Development Workflow

```bash
cd frontend
npm run dev
```

Backend running separately:

```bash
cd backend
python QueueScan.py
```

Open:

```text
http://localhost:5173
```

---

# Troubleshooting

## Vite Won't Start

Delete node_modules and reinstall:

```bash
rm -rf node_modules
rm package-lock.json
npm install
```

---

## Backend Connection Failed

Check:

```text
frontend/src/config.js
```

Verify backend URL.

---

## WebSocket Not Connecting

Verify backend WebSocket endpoint:

```text
/ws
```

Check browser console.

---

## Audio Playback Issues

Possible causes:

* autoplay restrictions
* stale queue
* missing WebSocket updates
* authentication token mismatch

---

# Recommended Development Order

1. Start backend
2. Start frontend
3. Login
4. Verify WebSocket connection
5. Verify queue updates
6. Verify audio playback
7. Verify TV mode

---

# QueueScan Frontend Design Philosophy

QueueScan frontend is designed around:

* live monitoring
* readable scanner visibility
* TV mode operation
* persistent queue awareness
* low-latency updates
* metadata-driven display

---

# Future Enhancements

Planned frontend expansion:

* transcription display
* live waveform overlay
* map integration
* radio ID lookup
* alert rules
* admin configuration panel
* incident clustering
* queue analytics
* browser notifications

---

# Repository Structure

```text
QueueScan/
├── backend/
├── frontend/
├── utilities/
├── README.md
└── .gitignore
```

---

# QueueScan Frontend Summary

QueueScan Frontend provides:

* real-time monitoring
* audio playback
* talkgroup metadata
* TV mode
* replay
* filtering
* priorities
* authentication
* FastAPI integration

This frontend is designed to operate as a live scanner console rather than a traditional dashboard.

