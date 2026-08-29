# Competency Profile API V1

Phase 4C.2 — read cached competency projection and on-demand recompute.  
No evidence history endpoint, no client-writable scores.

## Endpoints

### `GET /api/me/competencies`

Returns the **derived** competency profile for the authenticated user.

- Auth: required (`Bearer` token → server `AuthContext` → `rinq_user_id`)
- No `user_id` query parameter — ownership is always the logged-in user
- Reads from `user_competency_states` (cache). Does **not** recompute on every GET

### `POST /api/me/competencies/recompute`

Recomputes all eight competencies from immutable `evidence_events` via Engine V1, replaces cached states, returns the same response shape as GET.

- Auth: required (same user only)
- Rate limit: **10 requests / minute / user** (`competency_recompute` scope)

## Response contract

```json
{
  "engineVersion": "competency-engine-v1",
  "mapHash": "<evidence_map_sha256>",
  "stale": false,
  "competencies": [
    {
      "competencyId": "scanning_identification",
      "label": "Scanning",
      "score": 0,
      "confidence": 0,
      "breadth": 0,
      "evidenceCount": 0,
      "highestEvidenceLevel": 0,
      "lastEvidenceAt": null,
      "status": "unrated"
    }
  ]
}
```

- Always **eight** competencies in taxonomy order (`data/academy/competency/taxonomy.json`)
- Labels come from taxonomy — not duplicated in the API layer
- `engineVersion` from runtime constant `ENGINE_VERSION`
- `mapHash` from server-side `evidence_map_sha256()` — never client-supplied

## Null state

Users with no evidence (and no cached states) receive all eight axes as:

```text
score = 0, confidence = 0, breadth = 0, highestEvidenceLevel = 0, status = "unrated"
```

`score = 0` with `status = "unrated"` must **not** be shown as “Skill 0” in UI — display as empty / not yet assessed.

## Status (V1)

| Condition | `status` |
|-----------|----------|
| `confidence == 0` | `unrated` |
| `confidence > 0` | `rated` |

## Stale projection

`stale: true` when cached projection metadata differs from current runtime:

```text
stored engine_version != ENGINE_VERSION
OR stored map_hash != current evidence_map_sha256()
```

If no cached states exist: `stale = false` (null-state semantics).

GET does **not** auto-recompute when stale — client may call `POST .../recompute` explicitly.

## Server-authoritative guarantees

Clients cannot set or PATCH:

- `score`, `confidence`, `breadth`, `highestEvidenceLevel`
- `engineVersion`, `mapHash`
- map-derived fields (`evidenceLevel`, `strength`, weights)

Evidence events are append-only (Phase 4C.1); competency state is always derived.

## Storage backends

API uses repository contracts only — works with `STORAGE_BACKEND=json` and `STORAGE_BACKEND=postgres` without endpoint duplication.

## Not in V1

- `GET /api/me/evidence-events`
- AI evidence generation
- User-editable skill values

Frontend radar read-wiring: see `docs/competency/radar-ui-v1.md`.
