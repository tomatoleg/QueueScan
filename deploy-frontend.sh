#!/bin/bash

echo "====================================="
echo " QueueScan Frontend Deploy"
echo "====================================="

echo "[1/5] Entering frontend directory..."
cd frontend || exit 1

echo "[2/5] Installing dependencies..."
npm install

echo "[3/5] Building production frontend..."
npm run build

echo "[4/5] Copying build to nginx..."
sudo rm -rf /usr/share/nginx/html/*
sudo cp -r dist/* /usr/share/nginx/html/

echo "[5/5] Restarting nginx..."
sudo systemctl restart nginx

echo "====================================="
echo " Deploy Complete"
echo "====================================="
echo ""
echo "Production URL:"
echo "http://192.168.1.20"
