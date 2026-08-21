#!/usr/bin/env bash
# Apply /uploads/ proxy to the Academy nginx site. Run once with sudo password.
set -euo pipefail
TARGET=/etc/nginx/sites-available/academy.conf

if grep -qE 'location (\^~ )?\/uploads\/' "$TARGET"; then
  echo "uploads location already present in $TARGET"
  exit 0
fi

python3 - "$TARGET" <<'PY'
from pathlib import Path
import sys
path = Path(sys.argv[1])
text = path.read_text()
marker = "    # Frontend SPA\n    location / {"
block = """    # Avatar / account uploads (FastAPI StaticFiles mount)
    # ^~ prevents the static asset regex below from intercepting /uploads/*.jpg etc.
    location ^~ /uploads/ {
        proxy_pass http://127.0.0.1:8000/uploads/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

"""
if marker not in text:
    raise SystemExit("SPA marker not found — abort")
path.write_text(text.replace(marker, block + marker, 1))
print("patched", path)
PY

nginx -t
systemctl reload nginx
echo "nginx reloaded OK"

AVATAR=$(ls /opt/academy-web/data/academy/uploads/avatars/*.{jpg,jpeg,png,webp,gif} 2>/dev/null | head -1 || true)
if [[ -n "${AVATAR:-}" ]]; then
  name=$(basename "$AVATAR")
  echo "testing https://academy.highspeed-novadelta.de/uploads/avatars/${name}"
  curl -s -o /dev/null -w "nginx_uploads=%{http_code} content_type=%{content_type} size=%{size_download}\n" \
    "https://academy.highspeed-novadelta.de/uploads/avatars/${name}"
fi
