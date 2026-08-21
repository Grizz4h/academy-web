#!/usr/bin/env bash
# Install parallel Nginx vhost for rinq-tank.de / www.rinq-tank.de.
# Does NOT modify academy.conf. Does NOT run Certbot (DNS must point here first).
# Requires root/sudo.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
SRC="${REPO_ROOT}/docs/ops/rinq-tank.de.nginx.conf"
TARGET=/etc/nginx/sites-available/rinq-tank.de
ENABLED=/etc/nginx/sites-enabled/rinq-tank.de
STAMP="$(date +%Y%m%d%H%M%S)"
BACKUP_DIR="/root/nginx-backups/rinq-domain-${STAMP}"

if [[ "$(id -u)" -ne 0 ]]; then
  echo "Run as root: sudo bash $0" >&2
  exit 1
fi

if [[ ! -f "$SRC" ]]; then
  echo "Missing template: $SRC" >&2
  exit 1
fi

if [[ ! -f /etc/nginx/sites-available/academy.conf ]]; then
  echo "Expected academy.conf — aborting to avoid wrong host layout." >&2
  exit 1
fi

mkdir -p "$BACKUP_DIR"
cp -a /etc/nginx/sites-available/academy.conf "$BACKUP_DIR/"
cp -a /etc/nginx/sites-enabled "$BACKUP_DIR/sites-enabled-listing" 2>/dev/null || true
if [[ -f "$TARGET" ]]; then
  cp -a "$TARGET" "$BACKUP_DIR/rinq-tank.de.prev"
fi
echo "Backup written to $BACKUP_DIR"

install -m 644 "$SRC" "$TARGET"
ln -sfn "$TARGET" "$ENABLED"

echo "Running nginx -t ..."
if ! nginx -t; then
  echo "nginx -t FAILED — restoring previous rinq config if any, removing enable link." >&2
  rm -f "$ENABLED"
  if [[ -f "$BACKUP_DIR/rinq-tank.de.prev" ]]; then
    cp -a "$BACKUP_DIR/rinq-tank.de.prev" "$TARGET"
  else
    rm -f "$TARGET"
  fi
  exit 1
fi

systemctl reload nginx
echo "nginx reloaded OK (HTTP vhost active)."
echo
echo "Academy vhost untouched. Next (only after DNS resolves to this server):"
echo "  certbot --nginx -d rinq-tank.de -d www.rinq-tank.de"
echo
echo "Verify DNS first:"
echo "  dig +short rinq-tank.de A"
echo "  dig +short www.rinq-tank.de A"
echo "Expected: 188.34.196.189"
