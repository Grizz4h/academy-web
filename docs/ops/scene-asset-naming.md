# Canonical Scene Asset Naming

**Tank owns the naming rule.** Board Studio and other clients consume the result. They must not copy the convention, reconstruct team shorts, format period/clock, or look up curriculum slugs just to build a filename.

## Schema (source of truth)

```text
{SCENE_CODE}_{HOME}-{AWAY}_{PERIOD}_{Tmm-ss}_{SLUG}
```

Examples:

```text
SC035_STR-AEV_P2_T09-15_Center-Reads
SC041_ING-MUC_P3_T04-28_Manual
SC100_BOS-TOR_OT_T00-07_Manual
```

`SCENE_CODE` is `scene_code` (`SC` + digits, `SC1000+` allowed). `scene.id` is never used.

Observed team and rating are metadata only. They are **not** part of the name.

## Derived, not persisted

`GET /api/scenes` (authenticated, owner-filtered) attaches:

| Field | Type | Meaning |
|---|---|---|
| `asset_name` | `string \| null` | Canonical name, or `null` if it cannot be built |
| `asset_name_missing` | `string[]` | Human-readable missing inputs (German labels) |

These fields are **derived at read time**. They are stripped before every scene JSON write. Existing scene files are not migrated. Do not treat a stored filename as a second truth.

Canonical implementation: `backend/scene_asset_name.py`.

## Inputs

| Slot | Source | Notes |
|---|---|---|
| Scene code | `scene_code` (fallback `internal_scene_id` only) | Never `scene.id` |
| Home / Away shorts | `league` + `season` + `team_home` / `team_away` | Prefer `team_home_id` / `home_team_id` (and away equivalents) when present |
| Period | `period` | Whitelist: `P1`, `P2`, `P3`, `OT`, `SO` (`ot` → `OT`) |
| Clock | `game_time` | `9:15` → `T09-15` |
| Slug | Manual → `Manual`; Drill → curriculum `drill.id` → `sceneSlug` | Server resolves curriculum so Board Studio does not need `GET /api/curriculum` |

Team identity is the catalog team id (`snake_case`), scoped to one league catalog. Shorts are display tokens inside that league — never global IDs. Overlap example: Eisbären Berlin is **EBB** in DEL and **BER** in CHL; Kölner Haie is **KEC** / **KOL**. Catalogs: `docs/content/team-codes-by-league.md`.

## Fail-closed

If any required slot cannot be resolved:

- `asset_name` is `null`
- `asset_name_missing` lists the gap (`Szenen-ID`, `Paarung`, `Drittel`, `Spielzeit`, `Quelle` / `Drill-Slug`)
- no invented shorts, no `UNKNOWN`, no padded fake codes

## Frontend

The Scene Pool copy button prefers `scene.asset_name` from `GET /api/scenes`. `frontend/src/utils/sceneAssetName.ts` is a fallback for older payloads / local fixtures and must stay aligned with the backend tests (same golden examples). It is not the source of truth.

## Clients (Board Studio)

```text
Supabase Auth → Bearer access token → GET /api/scenes → scene.asset_name
```

Auth, ownership, existing scene fields, and `scene_code` are unchanged. Additive read only.
