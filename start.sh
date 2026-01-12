#!/bin/bash
echo "Starting Academy-Web..."

# Kill any existing processes
pkill -f "python3 main.py" || true
pkill -f "vite" || true

# Start backend
cd "$(dirname "$0")/backend"
nohup python3 main.py > backend.log 2>&1 &
echo "Backend started (PID: $!)"

# Start frontend
cd "../frontend"
npm run dev &
echo "Frontend started"

echo "App running at http://localhost:5173"
echo "Backend log: backend.log"