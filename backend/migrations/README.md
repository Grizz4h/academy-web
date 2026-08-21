# Database migrations (Phase 4C+)

Versioned SQL for Supabase Postgres. **Do not auto-apply to production.**

| File | Purpose |
|------|---------|
| `001_runtime_schema.sql` | Wave 1 runtime tables + entitlement/payment prep + RLS enabled (no client policies) |

## How to apply (manual / staging only)

```bash
# Example with psql + DATABASE_URL from server env (never commit secrets)
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f backend/migrations/001_runtime_schema.sql
```

Or paste into Supabase SQL editor on a **non-production** project after review.

## Verification

```bash
cd backend && python3 test_schema_4c.py
```

## Next

Phase **4D**: Postgres repository implementations + controlled JSON import (backup, counts, compare). Not in this folder until then.
