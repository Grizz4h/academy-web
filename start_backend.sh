#!/bin/bash
cd "$(dirname "$0")"
# Alte Backend-Instanz beenden, damit neue Routes geladen werden
pkill -f "uvicorn.*main:app" 2>/dev/null
pkill -f "python3 main.py" 2>/dev/null
pkill -f "python main.py" 2>/dev/null
sleep 1
cd backend
PYTHON_BIN="python3"
if [ -x .venv/bin/python ]; then
	PYTHON_BIN=".venv/bin/python"
elif [ -x venv/bin/python ]; then
	PYTHON_BIN="venv/bin/python"
fi
# main.py binds 127.0.0.1:8000 (loopback only; Nginx proxies publicly)
# Requires ACADEMY_JWT_SECRET in ../.env or ../.env.local (min 32 chars).
nohup "$PYTHON_BIN" main.py >> backend.log 2>&1 &
echo "Backend started in background on 127.0.0.1:8000 (PID: $!)"
