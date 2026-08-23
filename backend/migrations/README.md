# Database migrations (Phase 4C+)

Versioned SQL for Supabase Postgres. **Do not auto-apply to production.**

| File | Purpose |
|------|---------|
| `001_runtime_schema.sql` | Wave 1 runtime tables + entitlement/payment prep + RLS enabled (no client policies) |
| `002_entitlement_grants.sql` | Phase 5A — flexible feature grants (`entitlement_grants`) |

## How to apply (manual / staging only)

```bash
# Example with psql + DATABASE_URL from server env (never commit secrets)
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f backend/migrations/001_runtime_schema.sql
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f backend/migrations/002_entitlement_grants.sql
```

Or paste into Supabase SQL editor on a **non-production** project after review.

## Verification

```bash
cd backend && python3 test_schema_4c.py
cd backend && python3 test_schema_5a.py
```

## Notes

- **`entitlements` (001)** — one row per user / Stripe plan snapshot prep; unchanged in 5A.
- **`entitlement_grants` (002)** — product authorization source of truth for feature keys (`academy_premium`, …).
