#!/bin/bash
cd /opt/academy-web/backend
source venv/bin/activate
python3 main.py &
echo "Backend started in background (PID: $!)"