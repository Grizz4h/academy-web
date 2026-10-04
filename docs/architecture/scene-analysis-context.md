# Scene Analysis Context Read Contract

Tank-S3. Complements [`scene-pool-api.md`](./scene-pool-api.md) and
[`scene-observation-link.md`](./scene-observation-link.md).

Tank Analysis Context is **authoritative for Tank-owned learning context**.
It is **not** authoritative for Board Studio’s reconstructed geometry or local
source-video timing.

## Endpoint

```http
GET /api/scenes/{scene_id}/analysis-context
```

Authenticated. Same ownership semantics as `GET /api/scenes/{scene_id}`:

| Case | HTTP |
|------|------|
| Missing Scene | `404` |
| Other owner | `403` (no content leak) |
| Owned Scene (any partial join) | `200` |

## Lookup identity

| Contract | Value |
|----------|-------|
| Board Studio FK | **`Scene.id`** (`sourceSnapshot.poolDocumentId`) |
| Path param | Same Scene Pool resolver as GET/PUT/DELETE |
| Compatibility | Resolver may also accept `scene_code`; do **not** use `scene_code` as the Studio foreign key |

`provenance.lookupIdentity` is always `"scene.id"`. `provenance.resolvedVia` is `"id"` or `"scene_code"`.

## Response model

Computed read model. Nothing is persisted.

```json
{
  "scene": { "...Scene-owned fields..." },
  "observation": { "...sample/draft fields..." } | null,
  "drill": {
    "id": "B1W_D3",
    "sessionSnapshot": { "...curated Drill fields..." } | null,
    "currentCurriculum": { "...curated Drill fields..." } | null
  } | null,
  "curriculum": {
    "contentHash": "sha256:<hex>",
    "contentHashAlgorithm": "sha256",
    "contentHashScope": "merged_curriculum"
  },
  "linkStatus": {
    "code": "unlinked | linked | pending_or_broken | inconsistent",
    "observationId": "...",
    "sessionId": "...",
    "reasons": ["..."]
  },
  "provenance": { "...join diagnostics..." }
}
```

## Scene-owned fields

From the enriched Scene DTO (same enrichment as list/single GET):

- identity: `id`, `scene_code`
- learning pointers: `drill_id`, `session_id`, `source` (incl. `observation_id`)
- user-authored: `note` (not an objective fact), `rating`
- match / team / period / game time / competition metadata when present
- derived read fields already on Scene GET: `asset_name`, `asset_name_missing`

Do not reinterpret `note` as ground truth.

## Observation / sample fields

Resolved via S2 helper `find_observation_sample(session, observation_id)` and
optional active draft.

Returned when found:

- `id`, `sceneId`, `sceneCode`
- `answers` — remaining sample keys **verbatim** (e.g. choice values, `note`)
- location/phase/collectionKey when known
- `samplePresent` / `draftPresent`

Not fabricated: transcript, spoken observation, comparison timestamps, observation
windows, reflection, session-level microfeedback / AI reflection.

## Drill / Curriculum-owned fields

Drill is resolved **by ID**, never by title.

Each of `sessionSnapshot` / `currentCurriculum` (when present) may include:

- `id`, `title`, `description`, `drill_type`
- `didactics.explanation`
- `didactics.observation_guide.{what_to_watch,how_to_decide,ignore}`
- `didactics.learning_hint`, `inline_explanations` when present
- curated `config` (questions, options/state_options, labels, observation_fields, …)
- `miniFeedback`, `sceneSlug` when present

Answer options are returned as stored (strings/values). No invented “option meaning” text.

## Session snapshot vs current Curriculum

| Block | Source | Meaning |
|-------|--------|---------|
| `drill.sessionSnapshot` | `session.drills[]` entry with matching `id` | Drill text as experienced during the Session |
| `drill.currentCurriculum` | Merged `curriculum.json` (+ foundation) by `id` | Current Curriculum wording |

Both may be present. Neither silently overwrites the other. Either may be `null`
independently (historical-only, current-only, or neither).

## Curriculum content marker

```text
contentHash = "sha256:" + hex(SHA-256(canonical_json(merged_curriculum)))
```

Canonicalization:

- UTF-8 JSON
- `sort_keys=True`
- compact separators `(",", ":")`
- `ensure_ascii=False`

Scope: **merged** Curriculum (main file + foundation tracks), **before** entitlement
filtering. Same content → same marker across restarts. No timestamps, random UUIDs,
or hand-maintained version strings.

Also exposed additively on `GET /api/curriculum` as
`contentHash` / `contentHashAlgorithm` / `contentHashScope`.

Implementation: `backend/curriculum_content_hash.py`.

## Link statuses

| `linkStatus.code` | Meaning |
|-------------------|---------|
| `unlinked` | No `source.observation_id` (manual / legacy Scene) |
| `linked` | Observation id present and sample/draft resolves; no inconsistency |
| `pending_or_broken` | Observation id present but sample/session unavailable |
| `inconsistent` | Resolved data contradicts S2 provenance (e.g. `sample.sceneId` ≠ `Scene.id`) |

`reasons` lists machine-readable details (`observation_not_found`,
`session_not_found`, `sample_scene_mismatch`, `drill_mismatch`, …).

Absent `sample.sceneId` on a resolved sample is **legacy-compatible** (`linked` with
honest `null`), not inconsistent.

## Authorization

Owner-only, matching Scene GET. Does not leak another user’s Session, answers,
notes, or drill–session relationship.

## Partial-context behavior

`200` with nullable blocks / status codes for:

- manual Scene (no Drill, no Observation)
- Drill present, Observation absent
- Observation id pending / sample missing
- Session missing
- current Curriculum Drill missing but Session snapshot present (and vice versa)

## Failure behavior

| Situation | Behavior |
|-----------|----------|
| Scene missing / unauthorized | `404` / `403` |
| Curriculum file missing/malformed | `200` + `curriculum.error` + partial Drill/Scene |
| Hash failure | `200` + `curriculum.error = hash_failed` |
| Transport/server crash | normal FastAPI 5xx |

Legacy Scene without Observation must not produce `500`.

## No-write guarantee

GET does **not**:

- mutate Scene JSON
- mutate Session / samples
- repair `sample.sceneId` backlinks
- persist joined Drill text or content hashes onto Scenes

## Intentionally unavailable fields

Tank does not currently own:

- source clip UUID / URL
- clip A/B
- source-media timestamps
- transcript / spoken observation
- comparison timestamps / observation windows
- Board Studio geometry

Board Studio S327a owns local Reference/Scene-Time mapping. A later package
combines both systems.

## Intended consumer

Board Studio S327b (and later Context Package) calls this endpoint with
`poolDocumentId = Scene.id` to obtain Tank-owned analysis context.

## Implementation

- `backend/scene_analysis_context.py` — read model builder
- `backend/curriculum_content_hash.py` — deterministic marker
- `GET /api/scenes/{scene_id}/analysis-context` in `backend/main.py`
