#!/bin/bash
# Startet Backend und Frontend gemeinsam

# Backend stoppen, falls noch aktiv
pkill -f "python3 main.py" 2>/dev/null
sleep 1

# Backend starten
cd backend && nohup python3 main.py > ../backend.log 2>&1 &
cd ..
sleep 2

# Frontend starten
cd frontend && nohup npm run dev > ../frontend.log 2>&1 &
cd ..

echo "Backend und Frontend wurden gestartet. Logs: backend.log, frontend.log"
