#!/bin/bash

echo "====================================="
echo " QueueScan Dev Environment Reset"
echo "====================================="

echo "[1/6] Stopping containers..."
docker compose -f docker-compose.dev.yml down --remove-orphans

echo "[2/6] Removing dev containers..."
docker rm -f queuescan-backend-dev queuescan-frontend-dev 2>/dev/null

echo "[3/6] Removing Vite cache..."
rm -rf frontend/node_modules/.vite

echo "[4/6] Pruning unused Docker build cache..."
docker builder prune -f

echo "[5/6] Rebuilding images without cache..."
docker compose -f docker-compose.dev.yml build --no-cache

echo "[6/6] Starting fresh dev environment..."
docker compose -f docker-compose.dev.yml up

echo "====================================="
echo " QueueScan Dev Started"
echo "====================================="
