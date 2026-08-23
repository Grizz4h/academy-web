# Database Schema (Phase 4C)

**Status:** schema (4C) + repositories/migration tooling (4D) in repo.  
**Runtime default:** JSON until `STORAGE_BACKEND=postgres` is explicitly enabled.  
**Ops:** `docs/ops/postgres-migration.md`

---

## Access architecture

```text
Browser
  ↓  HTTPS / JWT
FastAPI (127.0.0.1)
  ↓  server-side DATABASE_URL only
Postgres (Supabase)
```

- No frontend writes to business tables.
- No service-role / DB password in `VITE_*` or client bundles.
- Supabase Auth stays Managed Auth; app ownership stays `rinq_user_id`.

---

## Table overview

| Table | Maps from 4B | Role |
|-------|--------------|------|
| `app_users` | Identity / `identities` | Canonical RinQ identity |
| `auth_links` | `auth_links` | Provider subject → UUID |
| `legacy_credentials` | `users.json` | Legacy password hashes |
| `profiles` | `profiles/{uuid}.json` | Display name + cosmetics payload |
| `reward_states` | `rewards/{uuid}.json` | XP/PUX + progression payload |
| `sessions` | `sessions/…/{id}.json` | Ownership + list fields + body JSONB |
| `entitlements` | *(prep)* | Plan view per user |
| `subscriptions` | *(prep)* | External subscription rows |
| `processed_webhook_events` | *(prep)* | Webhook idempotency |

Scenes / observations are **out of Wave 1** (still JSON until a later wave).

---

## Relationships

```text
app_users (rinq_user_id)
   ├── auth_links          ON DELETE CASCADE
   ├── legacy_credentials  ON DELETE CASCADE
   ├── profiles            ON DELETE CASCADE
   ├── reward_states       ON DELETE CASCADE
   ├── sessions            ON DELETE CASCADE
   ├── entitlements        ON DELETE CASCADE
   ├── subscriptions       ON DELETE CASCADE
   └── processed_webhook_events.rinq_user_id  ON DELETE SET NULL
```

### Key constraints

| Table | PK | Important UNIQUE / CHECK |
|-------|----|---------------------------|
| `app_users` | `rinq_user_id` | `legacy_username` UNIQUE; `status ∈ {active,disabled,pending_delete}` |
| `auth_links` | `id` | **UNIQUE(provider, provider_subject)**; UNIQUE(rinq_user_id, provider, provider_subject); provider enum |
| `legacy_credentials` | — / `rinq_user_id` UNIQUE | `username` UNIQUE; nonempty hash |
| `profiles` | `rinq_user_id` | nonempty `display_name` |
| `reward_states` | `rinq_user_id` | `xp ≥ 0`, `pux ≥ 0`, `progression_pux_granted ≥ 0` |
| `sessions` | `session_id` | `state` enum; FK owner |
| `entitlements` | `rinq_user_id` | `external_customer_id` UNIQUE |
| `subscriptions` | `id` | `external_subscription_id` UNIQUE |
| `processed_webhook_events` | `webhook_event_id` | primary uniqueness for idempotency |

`provider_subject` must never map to two RinQ UUIDs — enforced by global UNIQUE `(provider, provider_subject)`.

---

## JSONB decisions

Keep relational only what list/filter/ownership needs. Everything variable or nested stays JSONB:

| Table | Relational | JSONB (`payload` / `raw`) |
|-------|------------|---------------------------|
| `profiles` | `display_name`, `display_name_chosen`, `updated_at` | avatar, banner, stickers, preferences, hockeyExperience, … |
| `reward_states` | `xp`, `pux`, `progression_pux_granted`, timestamps | achievements, cosmetics, processedEvents, activityLog, challenges, … |
| `sessions` | owner, state, module/drill ids, dummy flag, timestamps, a few filters | checkins, drafts, drills[], game_info, microfeedback, post, reflection, … |
| `subscriptions` | ids, status, period | provider `raw` snapshot |

**Why not normalize drills/checkins:** shapes change per mechanic; 4B contracts treat the session as one document. Splitting into many tables would block 4D for little query gain.

**Rewards / `apply_reward_delta`:** one row per user → `SELECT … FOR UPDATE` (or upsert) inside a DB transaction updates `xp`/`pux` and `payload` atomically. Matches the JSON flock semantics from 4B.

---

## Delete / account lifecycle

Aligned with Phase 3G (export + full delete):

**Cascade with account (deleted when `app_users` row is removed):**

- auth_links, legacy_credentials, profiles, reward_states, sessions, entitlements, subscriptions

**Separately retained (FK SET NULL):**

- `processed_webhook_events` — keep event id for idempotency / audit; clear user pointer

**Outside this schema (still file-based until later waves):**

- scenes, observation runs/entries, uploads — continue to be deleted by lifecycle code on disk; add tables later if needed

**Supabase Auth user:** deleted via Admin API with service role (not a row in this schema).

---

## Indexes (early, minimal)

- `auth_links (provider, provider_subject)` — login resolve
- `auth_links (rinq_user_id)` — list providers / unlink
- `sessions (rinq_user_id)`
- `sessions (rinq_user_id, created_at DESC)` — history
- `sessions (rinq_user_id, state)` — filtered lists
- partial `sessions (is_dummy) WHERE is_dummy` — dev cleanup
- `subscriptions (rinq_user_id)`

No index explosion; add later from real query plans.

---

## RLS recommendation

**Enable RLS on all Wave-1 (+ prep) tables with zero policies for `anon` / `authenticated`.**

Effect: PostgREST / browser JWT cannot read or write business tables even if a table is exposed by mistake.

Backend connects with a **privileged** role:

1. **Preferred for MVP:** Supabase `service_role` connection string (bypasses RLS), only on the server, never in the client.
2. **Hardening later:** dedicated `rinq_backend` role with `GRANT` on tables (and optionally `BYPASSRLS`), still server-only.

Do **not** invent complex per-user RLS policies while the client never talks to Postgres.

---

## Backend DB credentials (later, 4D+)

Server env only (examples — names indicative):

```text
DATABASE_URL=postgresql://…          # or SUPABASE_DB_URL
# optional pooler URL for serverless
```

Rules:

- Never commit secrets.
- Never put DB URLs in frontend env.
- Prefer least privilege: DML on app schema only; no need for superuser in app process.
- Migrations: apply with a migration role that can DDL; runtime app role may stay DML-only after schema is stable.

---

## Entitlement / payment prep

Tables exist but **product code must not use them in 4C**:

| Requirement | Column / table |
|-------------|----------------|
| `external_customer_id UNIQUE` | `entitlements.external_customer_id` |
| `external_subscription_id UNIQUE` | `subscriptions.external_subscription_id` |
| `webhook_event_id UNIQUE` | `processed_webhook_events.webhook_event_id` (PK) |
| Entitlement on `rinq_user_id` | `entitlements.rinq_user_id` PK/FK |

Stripe / Checkout / Apple Pay remain out of scope until a dedicated payment phase.

---

## Timestamps

All timestamp columns use **`timestamptz`** (UTC). Defaults `now()` where creation time is always set server-side.

---

## What 4C deliberately does not do

- No psycopg / SQLAlchemy wiring
- No Postgres repository implementations
- No dual-write / JSON import
- No production migrate
- No Stripe
- No scenes/observations tables

---

## Open questions before 4D

1. Staging Supabase project + who applies `001_runtime_schema.sql` manually?
2. Runtime connection: service_role vs dedicated `rinq_backend` from day one?
3. Session `session_id` stays opaque string (current JSON ids) — confirm no UUID rewrite on import.
4. Should `legacy_credentials.username` be forced lowercase at DB level (`CHECK` / trigger) to match `normalize_subject`?
5. Scenes/observations wave timing relative to payment entitlements?
