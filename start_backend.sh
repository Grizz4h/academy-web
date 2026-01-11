#!/bin/bash
cd "$(dirname "$0")/backend"
if [ -d venv ]; then
	source venv/bin/activate
fi
nohup python3 main.py &
echo "Backend started in background (PID: $!)"