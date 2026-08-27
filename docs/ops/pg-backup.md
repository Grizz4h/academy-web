# Postgres nightly dump (cheap backup without Supabase Pro)

Logical dumps via `backend/scripts/pg_dump_nightly.sh`.  
**Not** Point-in-Time Recovery — worst case you lose everything since the last successful dump (~1 day with nightly cron).

Enough until the first real customers; then reconsider Supabase Pro (€25) daily backups.

## What it does

1. Reads `DATABASE_URL` from `/opt/academy-web/.env.local` (never logs the URL)
2. Runs `pg_dump --format=custom` → `data/backups/pg/academy-<UTC>.dump`
3. Keeps files for **14 days** (`ACADEMY_PG_BACKUP_KEEP_DAYS`)
4. File mode `600`, directory `700`

## Status (this host)

| Item | Value |
|------|--------|
| First dump | 2026-08-27 — `academy-20260827T171343Z.dump` (~358KB) |
| Cron | `15 3 * * *` (server local = Europe/Berlin) as user `highspeed` |
| Client | PG **17** under `tools/pg-client/` (matches Supabase server 17.x) |
| Log | `data/backups/pg/cron.log` |

## Requirements

`pg_dump` major version must match the server (currently **17**). Local extracted client (gitignored):

```text
/opt/academy-web/tools/pg-client/usr/lib/postgresql/17/bin/pg_dump
```

Re-bootstrap without root (PGDG noble):

```bash
BASE=https://apt.postgresql.org/pub/repos/apt
curl -fsSL "$BASE/dists/noble-pgdg/main/binary-amd64/Packages.gz" | gzip -dc >/tmp/pgdg.pkg
CLIENT=$(awk '/^Package: postgresql-client-17$/{p=1} p&&/^Filename:/{print $2; exit}' /tmp/pgdg.pkg)
LIBPQ=$(awk '/^Package: libpq5$/{p=1} p&&/^Filename:/{print $2; exit}' /tmp/pgdg.pkg)
curl -fL -o /tmp/pg17-client.deb "$BASE/$CLIENT"
curl -fL -o /tmp/libpq5-pgdg.deb "$BASE/$LIBPQ"
rm -rf /opt/academy-web/tools/pg-client && mkdir -p /opt/academy-web/tools/pg-client
cd /opt/academy-web/tools/pg-client
dpkg-deb -x /tmp/libpq5-pgdg.deb .
dpkg-deb -x /tmp/pg17-client.deb .
./usr/lib/postgresql/17/bin/pg_dump --version
```

Prefer a **direct** DB URL (port `5432`), not the transaction pooler (`6543`).

## Cron

```bash
crontab -l
# expected:
# 15 3 * * * /opt/academy-web/backend/scripts/pg_dump_nightly.sh >>/opt/academy-web/data/backups/pg/cron.log 2>&1
```

Manual run:

```bash
/opt/academy-web/backend/scripts/pg_dump_nightly.sh
ls -lh /opt/academy-web/data/backups/pg/
```

## Restore (emergency)

Into a **new** empty database (never casually overwrite prod):

```bash
export LD_LIBRARY_PATH=/opt/academy-web/tools/pg-client/usr/lib/x86_64-linux-gnu
PG=/opt/academy-web/tools/pg-client/usr/lib/postgresql/17/bin
# $TARGET_URL = fresh empty DB connection string
"$PG/pg_restore" --dbname="$TARGET_URL" --no-owner --no-acl \
  /opt/academy-web/data/backups/pg/academy-YYYYMMDD….dump
```

Then point a staging env at `$TARGET_URL`, verify row counts, only then consider prod cutover.

Full launch context: [launch-ops.md](launch-ops.md) §1.
