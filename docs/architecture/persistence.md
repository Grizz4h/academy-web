# Persistence & Repository Layer

## Why a repository layer

Business/API code used to call `json.load` / `json.dump` / `open(...)` directly on runtime files. That couples domain rules to a storage format and makes Lost Updates easy (read → modify → write without a critical section).

Phase **4B** inserts a thin repository layer so:

```text
API / Business Logic
        ↓
Repository contracts (Protocols)
        ↓
JSON repositories (today)
        ↓
files under data/academy/…
```

Later the same contracts can be implemented by Postgres without rewriting route handlers.

## Current implementation (JSON)

Central wiring: `backend/repositories/wiring.py` (`configure_repositories` / `get_repos`).

`STORAGE_BACKEND=json` (default) or `postgres`. No silent fallback between backends.

| Domain | Contract | JSON impl | Postgres impl (4D) | On disk / table |
|--------|----------|-----------|--------------------|-----------------|
| Identities + auth_links | `IdentityRepository` | `JsonIdentityRepository` | `PostgresIdentityRepository` | `identity_store.json` / `app_users`+`auth_links` |
| Legacy passwords | `UserCredentialRepository` | `JsonUserCredentialRepository` | `PostgresUserCredentialRepository` | `users.json` / `legacy_credentials` |
| Profiles | `ProfileRepository` | `JsonProfileRepository` | `PostgresProfileRepository` | `profiles/…` / `profiles` |
| Rewards | `RewardRepository` | `JsonRewardRepository` | `PostgresRewardRepository` | `rewards/…` / `reward_states` |
| Sessions | `SessionRepository` | `JsonSessionRepository` | `PostgresSessionRepository` | `sessions/…` / `sessions` |
| Feature grants | `EntitlementRepository` | `JsonEntitlementRepository` | `PostgresEntitlementRepository` | `entitlement_grants.json` / `entitlement_grants` |

Shared helpers: `repositories/json_io.py` (exclusive lock + atomic tmp/replace); `db/pool.py` (psycopg3 pool).

Migration tooling: `python -m migration.cli` — see `docs/ops/postgres-migration.md`.

Ownership remains **server-side** via `AuthContext.rinq_user_id` (never client-supplied user id, never email as app key).

## Reward race fix

`POST /api/rewards/apply` no longer does unlocked RMW in the route. Business logic runs inside:

```text
RewardRepository.apply_reward_delta(user, mutator)
```

JSON impl: load + mutator + optional write under one per-user flock. Concurrent deltas cannot drop updates. Mutator may return `new_state=None` to skip persist (idempotent / rejected apply) while still holding the lock for the check.

## Future Postgres

Same contracts; swap in `wiring.py` only. No dual-write in 4B.

**Phase 4C (this branch):** relational schema + versioned SQL migration prepared — see `docs/architecture/database-schema.md` and `backend/migrations/001_runtime_schema.sql`.

**Phase 4D (this branch):** Postgres repository implementations + migration CLI + `STORAGE_BACKEND` switch. Runtime default remains JSON until explicit cutover. Ops: `docs/ops/postgres-migration.md`.

Methods that should become SQL transactions (or row locks):

- `IdentityRepository.create_auth_link` / ensure_* (UNIQUE `(provider, provider_subject)`)
- `RewardRepository.apply_reward_delta`
- Session create/update/delete under ownership predicates
- Credential upsert/delete

Constraints / FKs designed in 4C:

- `app_users.rinq_user_id` PK
- `auth_links` UNIQUE `(provider, provider_subject)`, FK → `app_users`
- `profiles`, `reward_states`, `sessions.rinq_user_id` → `app_users`
- `legacy_credentials` keyed by username + `rinq_user_id`

## Abstractions already vs later

**Done (4B):** identities, auth_links, legacy credentials, profiles, rewards, sessions.

**Done (4C design):** Postgres schema + migration SQL + docs.

**Done (4D code):** Postgres repositories + migration CLI + verification; default runtime still JSON.

**Done (5A):** Entitlement domain — `entitlement_grants` table + `EntitlementRepository` + `can_access()` access service. Manual admin grants only (no Stripe).

**Done (5B):** Route gates — `POST /api/sessions`, filtered `GET /api/curriculum`, defense-in-depth on `GET /api/sessions/{id}`, download + reflection. Lab sessions exempt.

**Done (5C):** Frontend premium UX — `premium_locked` in Curriculum/SessionSetup, `GET /api/me/entitlements` hook (display only; no checkout).

**Done (5D):** Stripe Checkout + verified webhooks → `subscriptions` + `entitlement_grants` (`source=subscription`). Env: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_ID`.

**Later:** scenes/observations tables.

**Out of scope forever for this layer (static content):** curriculum, foundation, teams, rosters, games, sidequests — stay file/catalog based unless product needs otherwise.

## Security notes

- No runtime user data in Git.
- No secrets in repository config (paths only).
- Storage layer raises domain errors (`NotFoundError`, `DuplicateAuthLinkError`, …); HTTP mapping stays in the API.
- JSON remains source of truth until a later migration cutover (4C+).

## Entitlement domain (Phase 5A)

```text
Authentication (who)     → AuthContext / JWT / auth_links
Authorization (what)     → entitlement_grants + can_access()
Subscription (billing)   → subscriptions + entitlements (001 prep) — not product gates yet
```

- **Authentication ≠ Authorization** — a valid session does not imply premium.
- **Subscription ≠ Entitlement** — Stripe/subscription rows are billing state; product access uses `entitlement_grants` (grant/revoke, expiry, source).
- Feature keys are server-defined (`backend/entitlements/feature_keys.py`); no free client strings.
- Module mapping: free `T0`/`A1`; premium `A2+` via `academy_premium` (`access_config.py`).
- Admin manual grants: `POST /api/admin/entitlements/grant|revoke` (`require_admin`).
- User read-only: `GET /api/me/entitlements` (active grants only).
- Apply migration `002_entitlement_grants.sql` before Postgres entitlement checks.

**Phase 5B (route gates):**

| Route | Gate |
|-------|------|
| `GET /api/curriculum` | Premium module `drills[]` stripped; `premium_locked: true` without grant |
| `POST /api/sessions` | `require_access` on `module_id` before drill embed |
| `GET /api/sessions/{id}` | Re-check module entitlement (revoked grant → 403) |
| `GET /api/sessions/{id}/download` | Same |
| `POST /api/sessions/{id}/reflection` | Same |
| Lab (`learning_area=lab`) | Exempt from `academy_premium` |

HTTP mapping: entitlement denial → **403** `"Premium access required"` (session cross-owner remains **404**).
