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

| Domain | Contract | JSON impl | On disk |
|--------|----------|-----------|---------|
| Identities + auth_links | `IdentityRepository` | `JsonIdentityRepository` → `IdentityStore` | `identity_store.json` (+ flock) |
| Legacy passwords | `UserCredentialRepository` | `JsonUserCredentialRepository` | `users.json` |
| Profiles | `ProfileRepository` | `JsonProfileRepository` | `profiles/{rinq_user_id}.json` |
| Rewards | `RewardRepository` | `JsonRewardRepository` | `rewards/{rinq_user_id}.json` |
| Sessions | `SessionRepository` | `JsonSessionRepository` | `sessions/YYYY/MM/{id}.json` |

Shared helpers: `repositories/json_io.py` (exclusive lock + atomic tmp/replace).

Ownership remains **server-side** via `AuthContext.rinq_user_id` (never client-supplied user id, never email as app key).

## Reward race fix

`POST /api/rewards/apply` no longer does unlocked RMW in the route. Business logic runs inside:

```text
RewardRepository.apply_reward_delta(user, mutator)
```

JSON impl: load + mutator + optional write under one per-user flock. Concurrent deltas cannot drop updates. Mutator may return `new_state=None` to skip persist (idempotent / rejected apply) while still holding the lock for the check.

## Future Postgres

Same contracts; swap in `wiring.py` only. No dual-write in 4B.

Methods that should become SQL transactions (or row locks):

- `IdentityRepository.create_auth_link` / ensure_* (UNIQUE `(provider, provider_subject)`)
- `RewardRepository.apply_reward_delta`
- Session create/update/delete under ownership predicates
- Credential upsert/delete

Constraints / FKs to design in 4C:

- `identities.rinq_user_id` PK
- `auth_links` UNIQUE `(provider, provider_subject)`, FK → identities
- `profiles`, `rewards`, `sessions.user` → `rinq_user_id`
- Legacy credentials optional table keyed by username, linked to identity

## Abstractions already vs later

**Done (4B):** identities, auth_links, legacy credentials, profiles, rewards, sessions.

**Later:** scenes, observations, other non-payment runtime domains.

**Out of scope forever for this layer (static content):** curriculum, foundation, teams, rosters, games, sidequests — stay file/catalog based unless product needs otherwise.

## Security notes

- No runtime user data in Git.
- No secrets in repository config (paths only).
- Storage layer raises domain errors (`NotFoundError`, `DuplicateAuthLinkError`, …); HTTP mapping stays in the API.
- JSON remains source of truth until a later migration cutover (4C+).
