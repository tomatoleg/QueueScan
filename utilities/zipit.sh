#!/bin/bash
ts=$(date +"%m-%d-%y-%H:%M")
zip -r $ts-queuescan-lite.zip backend frontend utilities README.md \
  -x "frontend/node_modules/*" \
  -x "frontend/dist/*" \
  -x "backend/venv/*" \
  -x "backend/logs/*" \
  -x "backend/recordings/*" \
  -x "*.pyc" \
  -x "__pycache__/*"
