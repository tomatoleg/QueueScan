#!/bin/bash

echo "====================================="
echo " Stopping QueueScan Dev"
echo "====================================="

docker compose -f docker-compose.dev.yml down --remove-orphans

echo "====================================="
echo " Dev Environment Stopped"
echo "====================================="
