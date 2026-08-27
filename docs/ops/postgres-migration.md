# Postgres migration & production ops (Phase 4D–4F)

**Status (2026-08-23):** Wave 1 **cut over to Postgres** on production server (`STORAGE_BACKEND=postgres`). JSON retained as rollback snapshot only.  
**Schema:** `backend/migrations/001_runtime_schema.sql`  
**Repos:** `STORAGE_BACKEND=json|postgres` (default `json`)

---

## MANUAL ACTION REQUIRED — overview

Cursor prepares code only. You (or ops) do these outside the repo:

| # | Action | Where |
|---|--------|--------|
| 1 | Create / open Supabase project (EU preferred) | Supabase Dashboard |
| 2 | Copy Database connection string → set `DATABASE_URL` on server | Project Settings → Database → Connection string |
| 3 | Apply `001_runtime_schema.sql` once | SQL Editor **or** `psql "$DATABASE_URL" -f …` |
| 4 | Approve dry-run report | after `python -m migration.cli dry-run` |
| 5 | Approve import | `python -m migration.cli import --confirm` |
| 6 | Review `verify` anchors | Christoph / Martin / Tobi |
| 7 | Cutover | `STORAGE_BACKEND=postgres` + restart (`academy-web.service`) |
| 8 | Ongoing ops | health + `db.healthcheck` + Supabase backups (Dashboard) |

Never put `DATABASE_URL` in `VITE_*`, frontend, or Git.

---

## Phase 4F — Production hardening (Wave 1 on Postgres)

### Startup / fail-fast

- `STORAGE_BACKEND=postgres` + missing/invalid `DATABASE_URL` → **startup fails** (no JSON fallback).
- Pool opens with a `SELECT 1` ping; failure aborts startup.
- Pool closes on app shutdown (`close_pool`).

### Health endpoints

```bash
curl -s http://127.0.0.1:8000/api/health
```

JSON backend:

```json
{"status":"ok","storage":"json"}
```

Postgres backend (healthy):

```json
{"status":"ok","storage":"postgres","database":"ok"}
```

Postgres backend (DB down) → HTTP **503**:

```json
{"status":"degraded","storage":"postgres","database":"error"}
```

No secrets or connection strings in responses.

### Read-only ops check

```bash
cd /opt/academy-web/backend
set -a && source ../.env.local && set +a
.venv/bin/python -m db.healthcheck
```

Reports: DB ping, Wave-1 table presence, row counts. **No writes.**

Full JSON↔Postgres parity (anchors):

```bash
.venv/bin/python -m migration.cli verify
```

### Connection pool defaults

| Setting | Env | Default | Notes |
|---------|-----|---------|-------|
| Min connections | `ACADEMY_PG_POOL_MIN` | `1` | Single worker API |
| Max connections | `ACADEMY_PG_POOL_MAX` | `5` | Keep small with Supabase Session pooler |
| Connect timeout (s) | `ACADEMY_PG_CONNECT_TIMEOUT` | `10` | Fail fast on network issues |

Override only after measuring — no premature tuning.

### Logging (server logs)

- `[storage] backend=…` at startup
- `[storage] selected backend=…` when repositories bind
- `[db] pool ready …` / `[db] pool startup failed` / `[db] pool closed`
- `[db] connection error` / `[db] transaction failed` (exception **type only**, no SQL/URLs/tokens)

### Transactions & locking (Wave 1)

| Operation | Pattern |
|-----------|---------|
| `apply_reward_delta` | `FOR UPDATE` + single transaction |
| `create_auth_link` / `remove_auth_link` | transaction + row locks where needed |
| credential upsert / `save_bundle` | single transaction |
| session create/delete | transaction; delete scoped by `rinq_user_id` |
| profile save/delete | transaction |

DB constraints enforce FK, auth-link global uniqueness, non-negative XP/PUX, session ownership via `rinq_user_id`.

---

## 1. Connection string (MANUAL ACTION REQUIRED)

1. Supabase Dashboard → your project  
2. **Project Settings → Database**  
3. **Connection string** → URI  
4. Prefer:
   - **Session or Transaction pooler** for the FastAPI app (`STORAGE_BACKEND=postgres`)
   - **Direct** connection for one-off `migration.cli` from the app server if pooler SSL/options differ
5. On the server only:

```bash
# edit /opt/academy-web/.env.local (gitignored)
DATABASE_URL=postgresql://…
STORAGE_BACKEND=json   # keep json until cutover is approved
```

6. Restart API after env change (`sudo systemctl restart academy-web`).

---

## 2. Apply schema (MANUAL ACTION REQUIRED)

Review file: `backend/migrations/001_runtime_schema.sql`

Option A — Supabase SQL Editor: paste contents, run once.

Option B — from server:

```bash
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f /opt/academy-web/backend/migrations/001_runtime_schema.sql
```

Confirm tables exist: `app_users`, `auth_links`, `legacy_credentials`, `profiles`, `reward_states`, `sessions`, …

---

## 3. Dry run (no writes)

```bash
cd /opt/academy-web/backend
export DATABASE_URL=…   # or rely on .env.local via dotenv in CLI
.venv/bin/python -m migration.cli dry-run
```

Inspect `planned` counts. Fix errors before import.

---

## 4. Import (writes + JSON backup)

```bash
.venv/bin/python -m migration.cli import --confirm
```

Behavior:

- Copies `identity_store.json`, `users.json`, `profiles/`, `rewards/`, `sessions/` under `data/backups/pre_pg_migrate_<UTC>/`
- Upserts in FK order: app_users → auth_links → legacy_credentials → profiles → reward_states → sessions
- **Does not mint new `rinq_user_id` values**
- Idempotent (`ON CONFLICT` upserts)

---

## 5. Verify

```bash
.venv/bin/python -m migration.cli verify
```

Checks:

- Domain counts (JSON vs Postgres)
- Stable UUIDs for every identity
- Anchors (default `christoph,martin,tobi`): same UUID, XP, PUX, achievement count, session count

---

## 6. Runtime switch (later — MANUAL ACTION REQUIRED)

Only after staging verify is green and cutover is approved:

```bash
# .env.local
STORAGE_BACKEND=postgres
DATABASE_URL=…
```

- Default remains `json` if unset.
- If Postgres is unreachable with `STORAGE_BACKEND=postgres`, startup/configure **fails** — no silent JSON fallback (no split-brain).

---

## 7. Rollback & backup

### Runtime rollback (instant)

```bash
# .env.local
STORAGE_BACKEND=json
sudo systemctl restart academy-web
```

JSON under `data/academy/` was not deleted by import or cutover.

### JSON snapshots (app-level)

| Path | When |
|------|------|
| `data/backups/pre_pg_migrate_*` | Before each `migration.cli import` |
| `data/backups/pre_cutover_4e_*` | Before Phase 4E cutover |

Restore files from a snapshot only if JSON was corrupted — not needed for normal Postgres rollback.

### Supabase backup (MANUAL ACTION REQUIRED)

Enable **Point-in-Time Recovery** / scheduled backups in Supabase Dashboard when paying for Pro — optional until then.

**Until Pro:** nightly logical dump on Hetzner — [pg-backup.md](pg-backup.md) / [launch-ops.md](launch-ops.md) §1.  
App-level JSON snapshots do **not** replace Postgres dumps.

### DB reset (staging only)

Optional `TRUNCATE` of Wave-1 tables on staging — never casually on production.

---

## 8. Tests

```bash
cd /opt/academy-web/backend
.venv/bin/python test_repositories_4d.py     # no DB required
.venv/bin/python test_schema_4c.py
.venv/bin/python test_db_hardening_4f.py     # pool/health unit tests; live constraints if DATABASE_URL set
# Live Postgres constraint probes (optional):
TEST_DATABASE_URL=postgresql://… .venv/bin/python test_db_hardening_4f.py
```

---

## What is **not** in scope yet

- Delete JSON source files
- Dual-write
- Stripe / entitlements / webhooks
- Scenes / observations Postgres migration
