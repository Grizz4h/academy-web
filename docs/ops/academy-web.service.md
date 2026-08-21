# Academy backend — proposed systemd unit (not installed yet)

## Why

Today the API is started with `./start_backend.sh` (`nohup … main.py &`).
That survives SSH logout, but **not** a reboot, and there is no systemd/supervisor/pm2 unit.

## Proposed unit

Save as `/etc/systemd/system/academy-web.service` (requires root/sudo):

```ini
[Unit]
Description=RINK Tank Academy API (FastAPI)
After=network.target

[Service]
Type=simple
User=highspeed
Group=highspeed
WorkingDirectory=/opt/academy-web/backend
EnvironmentFile=-/opt/academy-web/.env
EnvironmentFile=-/opt/academy-web/.env.local
ExecStart=/opt/academy-web/backend/.venv/bin/python main.py
Restart=on-failure
RestartSec=3

# Logs: journalctl -u academy-web -f
# (optional file log: StandardOutput=append:/opt/academy-web/backend/backend.log)

[Install]
WantedBy=multi-user.target
```

Notes:

- Reuses the existing `main.py` entrypoint (binds `127.0.0.1:8000`).
- Loads JWT/OpenAI secrets from the same `.env` / `.env.local` as today.
- Does **not** call `start_backend.sh` (that script `pkill`s other processes; awkward under systemd).
- `EnvironmentFile=-…` (leading `-`) means “optional if missing”.

## Install commands (sudo — run manually)

```bash
# 1) Stop the current nohup process to avoid port conflict
pkill -f '/opt/academy-web/backend/.venv/bin/python main.py' || true
# or: /opt/academy-web/start_backend.sh's kill patterns, carefully

# 2) Install unit
sudo cp /opt/academy-web/docs/ops/academy-web.service /etc/systemd/system/academy-web.service
# (or paste the unit above into that path)

sudo systemctl daemon-reload
sudo systemctl enable --now academy-web.service
sudo systemctl status academy-web.service --no-pager

# 3) Verify
ss -tlnp | grep 8000
curl -s http://127.0.0.1:8000/api/health
curl -sI https://academy.highspeed-novadelta.de/uploads/avatars/christoph_f270ea7f.jpg
```

Do **not** enable until the unit file is reviewed. This doc alone does not install anything.
