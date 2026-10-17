# Board Studio player marker — provenance (Phase 3)

| Field | Value |
| --- | --- |
| Source repository | local `/Users/christoph/Development/rinq-board-studio` (`Grizz4h/rinq-board-studio`) |
| Source commit | `053d7bee7bba4c32d61923ea89fca385d0520fd1` |
| Commit subject | Merge pull request #413 from Grizz4h/fix/s417-presentation-take-toolbar-compact |
| Extracted at | 2026-10-17T14:35Z |
| Working tree note | Player rendering paths matched this commit (S408 timeline WIP elsewhere was **not** used). |

## Files taken / adapted from Board Studio

| Board Studio path | Tank path | Notes |
| --- | --- | --- |
| `packages/renderer/src/player/playerVisualGeometry.ts` | `boardStudio/playerVisualGeometry.ts` | `PLAYER_RADIUS` inlined (no interaction/rink deps) |
| `packages/renderer/src/player/playerMarkerPaints.ts` | `boardStudio/playerMarkerPaints.ts` | unchanged logic |
| `packages/renderer/src/player/playerPrimitives.ts` | `boardStudio/playerPrimitives.ts` | deps → local stubs; no possession/stride motion |
| `packages/renderer/src/player/playerRenderAppearance.ts` | `boardStudio/playerRenderAppearance.ts` | no `@rinq/core` |
| `packages/core/src/playerVisual.ts` (palette/types) | `boardStudio/playerVisual.ts` | slice only |
| `packages/core/src/hexColor.ts` | `boardStudio/hexColor.ts` | unchanged |
| `packages/renderer/src/PlayerView.tsx` (primitive→SVG) | `boardStudio/renderPlayerPrimitive.tsx` + `HockeyPlayer.tsx` | no editor chrome |

## Explicitly **not** vendored

- `@rinq/core` / `@rinq/renderer` packages
- Scene, tracks, possession stick flick resolution, skate stride motion
- Hit area, selection halo defaults for playground (optional via props)
- Desktop editor, Stage, Camera

## Integration (Phase 3 onto Phase 1+2)

- Rebased onto `origin/main` including PR #14 (`feat/rink-style-lab-phase2`).
- Single lab route remains `/dev/rink-style` (no `/dev/rink-style-lab`).
- Player slice lives under this same `rinkStyleLab` feature; Track-0 scenes use
  `SceneMarkers` with `playerFigureStyle` Legacy | Board Studio.
- Player Playground is a panel inside `RinkStyleLab`, not a second page.

## Phase 3 tuning (lab-only)

- Scene **Scale** (0.2–1.5, default 1) multiplies footprint `radius/12`.
- Scene **Rotation** applies to all Board Studio scene players; jersey label stays upright (overlay).
- **Puck-Lage** `body` | `blade` | `compare` — local design-space → transform (rotation × bodyScale × outerScale × handedness). No fixed world offsets.
- Legacy circle markers ignore scale/rotation/puck lab controls.

## Known visual deviations vs Board Studio Preview

| Topic | Lab behavior vs Board Studio |
| --- | --- |
| Label | Jersey number from scene `label`; Board Studio keeps label **world-upright** (does not rotate with body). Scene captions under legacy circles are omitted for Board Studio (number on jersey). |
| Rotation | Lab slider drives scene players (default 0). No attack-direction auto-facing. |
| Scale | Base ≈ `marker.radius / 12`, then lab multiplier (default 1). Not pixel-identical to Board Studio rink scale. |
| Stick flick / skate stride | Omitted (static rest pose). |
| Selection halo / hit area | Off in lab. |
| Puck attachment | Style Lab circle at body-local or stick-blade tip (vendored blade geom); not Board Studio puck asset. |
| Goalie | Playground only; Track-0 scenes do not switch marker kind from region data. |
| Foundation compare pane | Always Legacy circles (`FoundationRink` unchanged). |
