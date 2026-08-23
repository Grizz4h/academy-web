# Postgres migration (Phase 4D)

**Status:** tooling + repositories in repo. **JSON remains source of truth** until you explicitly cut over.  
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
| 5 | Approve import to **staging** first | `python -m migration.cli import --confirm` |
| 6 | Review `verify` anchors | Christoph / Martin / Tobi |
| 7 | Only then consider `STORAGE_BACKEND=postgres` on a chosen environment | `.env.local` on server |
| 8 | Production cutover | **separate explicit approval** — not part of “run the tool once” |

Never put `DATABASE_URL` in `VITE_*`, frontend, or Git.

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

## 7. Rollback

- **Runtime:** set `STORAGE_BACKEND=json` and restart. JSON files were not deleted by import.
- **DB:** optional `TRUNCATE` of Wave-1 tables on staging only (never casually on production).
- Restore JSON from `data/backups/pre_pg_migrate_*` if something overwrote files (import itself does not delete sources).

---

## 8. Tests

```bash
cd /opt/academy-web/backend
.venv/bin/python test_repositories_4d.py          # no DB required
.venv/bin/python test_schema_4c.py
# Live Postgres (staging/local only):
TEST_DATABASE_URL=postgresql://… .venv/bin/python test_repositories_4d.py
```

---

## What this phase does **not** do

- Production cutover
- Delete JSON
- Dual-write
- Stripe / entitlements / webhooks
- Scenes / observations tables
