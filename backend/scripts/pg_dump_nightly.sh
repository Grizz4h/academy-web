#!/usr/bin/env bash
# Nightly logical dump of academy Postgres (Supabase) — no paid PITR required.
# Retention: KEEP_DAYS (default 14). Worst-case recovery point ≈ last successful dump.
#
# Cron example (user highspeed):
#   15 3 * * * /opt/academy-web/backend/scripts/pg_dump_nightly.sh >>/opt/academy-web/data/backups/pg/cron.log 2>&1
#
# Prefer DATABASE_URL that hits the direct Postgres port (5432), not transaction pooler (6543).

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
ENV_FILE="${ACADEMY_ENV_FILE:-$ROOT/.env.local}"
OUT_DIR="${ACADEMY_PG_BACKUP_DIR:-$ROOT/data/backups/pg}"
KEEP_DAYS="${ACADEMY_PG_BACKUP_KEEP_DAYS:-14}"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
TMP=""
DUMP_PATH=""

log() { printf '%s %s\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$*"; }

die() { log "ERROR: $*"; exit 1; }

cleanup() {
  if [[ -n "${TMP}" && -f "${TMP}" ]]; then
    rm -f "${TMP}"
  fi
}
trap cleanup EXIT

find_pg_dump() {
  local root_bin
  # Prefer newest extracted client under tools/pg-client (must match server major).
  if [[ -d "$ROOT/tools/pg-client/usr/lib/postgresql" ]]; then
    export LD_LIBRARY_PATH="$ROOT/tools/pg-client/usr/lib/x86_64-linux-gnu${LD_LIBRARY_PATH:+:$LD_LIBRARY_PATH}"
    root_bin="$(ls -1d "$ROOT"/tools/pg-client/usr/lib/postgresql/*/bin/pg_dump 2>/dev/null | sort -V | tail -n1 || true)"
    if [[ -n "$root_bin" && -x "$root_bin" ]]; then
      printf '%s' "$root_bin"
      return 0
    fi
  fi
  if command -v pg_dump >/dev/null 2>&1; then
    if pg_dump --version >/dev/null 2>&1; then
      command -v pg_dump
      return 0
    fi
  fi
  return 1
}

[[ -f "$ENV_FILE" ]] || die "missing env file: $ENV_FILE"

# Load only DATABASE_URL (never print it).
DATABASE_URL="$(
  python3 - "$ENV_FILE" <<'PY'
import sys
from pathlib import Path
path = Path(sys.argv[1])
for raw in path.read_text(encoding="utf-8").splitlines():
    line = raw.strip()
    if not line or line.startswith("#") or "=" not in line:
        continue
    key, _, val = line.partition("=")
    if key.strip() != "DATABASE_URL":
        continue
    val = val.strip().strip("'").strip('"')
    print(val, end="")
    break
else:
    raise SystemExit("DATABASE_URL not set in env file")
PY
)"
[[ -n "$DATABASE_URL" ]] || die "DATABASE_URL empty"

PG_DUMP="$(find_pg_dump)" || die "pg_dump not found — install postgresql-client-16 or extract into tools/pg-client (see docs/ops/pg-backup.md)"

mkdir -p "$OUT_DIR"
chmod 700 "$OUT_DIR" 2>/dev/null || true

DUMP_PATH="$OUT_DIR/academy-${STAMP}.dump"
TMP="$DUMP_PATH.partial"

log "dump start → $DUMP_PATH"
# Custom format: compact + pg_restore friendly.
"$PG_DUMP" \
  --dbname="$DATABASE_URL" \
  --format=custom \
  --no-owner \
  --no-acl \
  --file="$TMP"

mv -f "$TMP" "$DUMP_PATH"
chmod 600 "$DUMP_PATH"
TMP=""
SIZE="$(wc -c <"$DUMP_PATH" | tr -d ' ')"
log "dump ok bytes=$SIZE file=$(basename "$DUMP_PATH")"

# Prune old dumps (files only).
find "$OUT_DIR" -maxdepth 1 -type f -name 'academy-*.dump' -mtime +"$KEEP_DAYS" -print -delete \
  | while read -r old; do log "pruned $old"; done || true

log "dump done keep_days=$KEEP_DAYS"
