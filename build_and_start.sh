#!/bin/bash
set -e

# Build frontend
cd "$(dirname "$0")/frontend"
echo "Building frontend..."
npm run build

# Start backend
cd "../backend"
echo "Starting backend..."
nohup python3 main.py > ../backend.log 2>&1 &
echo "Backend started (PID: $!)"

# Optional: Serve frontend build (dist) via simple server

cd "../frontend/dist"
echo "Serving frontend build on http://localhost:8000 ..."
nohup python3 -m http.server 8000 > ../../frontend_build.log 2>&1 &
echo "Frontend build served (PID: $!)"

echo "Fertig!"
echo "Backend: http://localhost:... (siehe backend.log)"
echo "Frontend: http://localhost:8000 (siehe frontend_build.log)"