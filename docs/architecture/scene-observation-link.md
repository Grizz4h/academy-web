# Scene ↔ Observation (Sample) Link

Tank-S2. Complements [`scene-pool-api.md`](./scene-pool-api.md).

## Canonical relationship

No new Observation entity and no join table.

| Side | Field | Equals |
|------|-------|--------|
| Scene | `source.observation_id` | check-in **sample.id** |
| Sample | `sceneId` | **Scene.id** |
| Scene | `session_id` / `source.session_id` | owning Session |
| Scene | `drill_id` / `source.drill_id` | Drill context |

Board Studio continues to address Scenes via `Scene.id` (`poolDocumentId`).

## Identity scope

`sample.id` is generated in the client (`createObservationId`, e.g. `sample_<uuid>` / `event_<uuid>`). It is **unique within a Session** in practice (UUID). Resolution always uses:

```text
(session_id, observation_id) → sample
```

`Scene.session_id` + `Scene.source.observation_id` is the unambiguous Scene→sample key.

## Capture / link-loss point (historical)

```text
open sample form → draft.id created
  → create Scene(source.observation_id = draft.id)     ← Scene persisted
  → local draft.sceneId = Scene.id                     ← often only local / drafts
  → save sample (copies sceneId)                       ← only if form saved
```

**First loss:** Scene was durable immediately; sample backlink lived only in phase answers / drafts and was easy to miss if the form was discarded or drafts never synced.

## Link creation flow (current)

1. **Preflight** conflicts (sample already linked elsewhere, drill/session mismatch, another Scene owns the observation).
2. **Persist Scene** with `source.observation_id`.
3. **Backlink** sample/draft `sceneId` on the Session document when the sample/draft is already present.
4. If step 3 fails: Scene remains valid with `source.observation_id` (`pending_sample` / `backlink_failed`); repair via link endpoint.

Not a distributed transaction.

## APIs

| Method | Path | Role |
|--------|------|------|
| `POST` | `/api/scenes` | When `source.observation_id` set → preflight + create + backlink; response may include `observation_link` |
| `POST` | `/api/scenes/{scene_id}/observation-link` | Idempotent link / repair |
| `PUT` | `/api/scenes/{id}` + `clear_observation_link` | Clears Scene observation fields and best-effort sample backlinks |

Internal helper: `find_observation_sample(session, observation_id)` in `backend/scene_observation_link.py`.

## Idempotency & conflicts

| Case | Behavior |
|------|----------|
| Same Scene ↔ same sample | `already_linked` / no-op |
| Missing sample.sceneId, Scene already correct | repair sample |
| Missing Scene.observation_id, sample already correct | repair Scene |
| sample.sceneId → other Scene | **409** `sample_scene_conflict` |
| Scene.observation_id → other sample | **409** `scene_observation_conflict` |
| Another Scene already owns observation | **409** `observation_already_linked` |
| drill / session mismatch | **409** |
| Sample not in session yet | `pending_sample` (allowed on create) |

No silent overwrite of historical links. No heuristic matching by note/time/title.

## Manual & legacy Scenes

- Manual Scenes without `observation_id` remain first-class.
- Legacy Scenes/samples without the link remain valid; no bulk migration.
- Explicit link/repair only when IDs are known.

## Analysis context (Tank-S3)

Read join over this link: [`scene-analysis-context.md`](./scene-analysis-context.md).

## Out of scope (later)

- Context Package / Board Studio S327b
- Source-video provenance
