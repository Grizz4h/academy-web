#!/bin/bash
# Startet Backend (Port 8000) und Frontend (Port 5173) jeweils neu
# und beendet ggf. laufende Instanzen

# Backend stoppen (uvicorn + python main.py)
pkill -f "uvicorn.*main:app" 2>/dev/null
pkill -f "python3 main.py" 2>/dev/null
pkill -f "python main.py" 2>/dev/null
sleep 1

# Frontend stoppen (vite)
pkill -f "vite" 2>/dev/null
sleep 1

# Backend starten (Port 8000)
cd backend
nohup ~/.local/bin/uvicorn main:app --host 0.0.0.0 --port 8000 > backend.log 2>&1 &
cd ..
echo "Backend gestartet auf Port 8000."
sleep 2

# Frontend starten (Port 5174)
cd frontend
nohup npm run dev -- --port 5174 > ../frontend.log 2>&1 &
echo "Frontend gestartet auf Port 5174."
cd ..

echo "Backend und Frontend wurden gestartet. Logs: backend/backend.log, frontend.log"
