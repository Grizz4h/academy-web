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

## Known visual deviations vs Board Studio Preview

| Topic | Lab behavior vs Board Studio |
| --- | --- |
| Label | Jersey number from scene `label`; Board Studio keeps label **world-upright** (does not rotate with body). Scene captions under legacy circles are omitted for Board Studio (number on jersey). |
| Rotation | Scene markers use `rotation={0}`; Playground exposes free rotation. No attack-direction auto-facing yet. |
| Scale | Scene scale ≈ `marker.radius / 12` to match prior circle footprint — approximate, not pixel-identical to Board Studio rink scale. |
| Stick flick / skate stride | Omitted (static rest pose). |
| Selection halo / hit area | Off in lab. |
| Puck attachment | Still the Style Lab puck circle overlay, not Board Studio puck geometry. |
| Goalie | Playground only; Track-0 scenes do not switch marker kind from region data. |
| Foundation compare pane | Always Legacy circles (`FoundationRink` unchanged). |
