# Faceoff geometry correction (Detailed rink)

**Status:** applied in shared `rinkGeometry` (2026-10-17).  
**Scope:** end-zone faceoff circles + dots, neutral-zone faceoff dots.  
**Not changed:** crease, goals, blue lines, centre ice, faceoff **radius**, player/puck, curriculum.

## Rule references (NHL)

| Element | Rule |
| --- | --- |
| Lateral offset | Faceoff spots **22 ft** from the long centre line (same for end zones and NZ) |
| End-zone spot | **20 ft** from the goal line toward the blue line |
| End-zone depth | Goal line → blue line = **64 ft** (75 − 11) on a full NHL rink |
| NZ spot length | 5 ft inside each blue line — **not retuned** this pass (X kept) |

## Board mapping

- **Lateral (Y):** short axis — ice height 540 ↔ 85 ft (same scale as crease).
- **End-zone length (X):** fraction of the **painted** goal→blue span on this compressed board (`DETAILED_RINK_BLUE_LINE_FROM_END`, currently the NZ-widen preview — see `blue-line-audit.md`), not a literal 200 ft length scale. That keeps spots rule-proportional inside the painted end zones without inventing pixel offsets.

## Old vs new (SVG, surface origin in metrics)

Ice: `DETAILED_RINK_SURFACE` x=30,y=40,w=840,h=540 · centre Y = 310.

| Quantity | Old | New |
| --- | ---: | ---: |
| Lateral formula | `rinkHeight * 0.26` | `rinkHeight * (22/85)` |
| `topFaceoffY` / `bottomFaceoffY` | 169.6 / 450.4 | ≈ 170.235 / 449.765 |
| End-zone X formula | `rinkWidth * 0.26` from ends | `goalLine ± endZoneDepth * (20/64)` |
| `leftZoneFaceoffX` / `rightZoneFaceoffX` | 248.4 / 651.6 | ≈ 193.275 / 706.725 |
| NZ lateral (`neutralOffsetY`) | `rinkHeight * 0.22` → Y 191.2 / 428.8 | **same Y as end-zone centres** |
| NZ length (`neutralOffsetX`) | `rinkWidth * 0.08` | **unchanged** |
| `faceoffRadius` | 54 | **unchanged** 54 |

Source: `frontend/src/features/rinkGeometry/detailedMetrics.ts`.  
Paint: `DetailedHockeyRinkLayers` uses these centres for circles and dots as one geometric unit.

## Checks

- NZ dots share `topFaceoffY` / `bottomFaceoffY` with end-zone circle centres.
- Left/right end zones are mirror-symmetric about centre ice.
- Circles move with their centre dots; radius unchanged.
