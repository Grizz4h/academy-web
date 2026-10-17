# Blue-line spacing preview (Detailed rink)

**Status:** moderate NZ widen preview (2026-10-17) — review before locking.  
**Scope:** shared `DETAILED_RINK_BLUE_LINE_FROM_END` / painted blues / `zone_boundaries`.  
**Not changed:** centre line, goal lines, crease, faceoff **radius**, NZ faceoff **length** offset, players/puck, curriculum.

## Intent

Make the neutral zone visibly, but only moderately, wider by moving both blue lines toward their goal lines.

## Change

| Quantity | Old | New (preview) |
| --- | ---: | ---: |
| `BLUE_LINE_FROM_END` | **0.38** | **0.374** |
| NZ width fraction | 0.24 | **0.252** (+5% of prior NZ) |
| NHL reference NZ | 50/200 = 0.25 | preview is slightly **wider** than NHL |
| Left blue X (SVG) | 30 + 840×0.38 = **349.2** | 30 + 840×0.374 = **344.16** |
| Right blue X (SVG) | 30 + 840×0.62 = **550.8** | 30 + 840×0.626 = **555.84** |
| Shift each blue toward goal | — | **5.04** SVG units |

Derived as:

```text
NZ_new = 0.24 × (1 + 0.05) = 0.252
FROM_END = (1 − NZ_new) / 2 = 0.374
```

## Dependencies (automatic)

| Consumer | Effect |
| --- | --- |
| `getDetailedRinkMetrics().left/rightBlueLineX` | Blues move |
| End-zone faceoff X (`goal ± depth × 20/64`) | Stays rule-based inside the **shorter** end zone; centres move slightly toward the goal with the blue |
| NZ faceoff dots (`± rinkWidth × 0.08` from centre) | Length positions unchanged; still inside wider NZ |
| `DETAILED_RINK_ZONE_BOUNDARIES` | Learning/hitbox zone fractions follow blues |
| Ice-ad chevron bands in `DetailedHockeyRinkLayers` | Bounded by blues — rescale with them |
| DrillRenderer simple-rink blues (imports same constant) | Follows shared value |

## Plausibility checks

- NZ dots at ±67.2 from centre; NZ half-width new ≈ 105.84 → dots remain inside NZ.
- End-zone faceoff centres remain between goal line and blue line (rule fraction of new depth).
- Blues stay symmetric about centre ice; centre + goal lines untouched.

## Didactic note

A wider NZ is not automatically better for space/position learning. Treat **0.374** as a visual preview until product review confirms it.
