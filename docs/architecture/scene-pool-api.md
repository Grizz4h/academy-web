# Scene Pool API

Authoritative Scene Pool storage remains **JSON files** under `data/scenes/{YYYY}/{MM}/{scene_id}.json` (not Postgres/Supabase). The file basename equals `Scene.id`.

## Identities

| Field | Role |
|-------|------|
| `id` | **Durable document identity** (filename + primary API key). Board Studio `sourceSnapshot.poolDocumentId` **must** store this value. |
| `scene_code` | Human/canonical code (`SCxxx`). Useful for UI and asset naming. Not the primary foreign key for Studio. |

Do not derive `id` from `scene_code`. Do not invent synthetic IDs on read.

## Routes

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/api/scenes` | Owner-filtered list (+ filters) |
| `GET` | `/api/scenes/{scene_id}` | **Single document** by `Scene.id` (also accepts `scene_code`, same resolver as PUT/DELETE) |
| `POST` | `/api/scenes` | Create (creator mode) |
| `PUT` | `/api/scenes/{scene_id}` | Update owned scene |
| `DELETE` | `/api/scenes/{scene_id}` | Delete owned scene |

### `GET /api/scenes/{scene_id}`

- Auth: Bearer / current user (same as list).
- Owned scene → `200` with the **same Scene DTO** as list items (including derived `asset_name` / `asset_name_missing`).
- Missing id/code → `404`.
- Other owner's scene → `403` (no content leak; matches PUT/DELETE).
- Read-only: does not rewrite the JSON file.
- Returns only fields the Scene already owns (incl. `source.observation_id` when present).
- **No** join to session checkins, curriculum, microfeedback, or AI reflection.

Lookup helper: `_find_scene_path_by_identifier` (id first, then `scene_code`).  
Enrichment helper: `_enrich_scene_for_response` (shared with list).

## Observation link

Durable Scene ↔ check-in sample relationship (Tank-S2): see
[`scene-observation-link.md`](./scene-observation-link.md).

## Analysis context

Read join for Board Studio (Tank-S3): see
[`scene-analysis-context.md`](./scene-analysis-context.md).

```http
GET /api/scenes/{scene_id}/analysis-context
```

## Out of scope (later Tank slices)

- Context Package / Board Studio S327b consumption
- Source-video / clip provenance
- Cross-user / coach read access

## League / competition

Canonical external value is **`DNL`** (not `U20_DNL`). List/detail/analysis-context
normalize legacy stored `U20_DNL` on read. Scene identity is unchanged. Details:
[`league-identity.md`](./league-identity.md).
