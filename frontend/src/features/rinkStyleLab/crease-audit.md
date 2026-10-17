# Crease geometry audit (Style Lab / Detailed rink)

**Status:** documentation only — no geometry change in this phase.  
**Date:** 2026-10-17  
**Scope:** `getDetailedRinkMetrics()` / `DetailedHockeyRinkLayers` semicircle crease.

## Current implementation

| Quantity | Value |
| --- | --- |
| Ice surface | `DETAILED_RINK_SURFACE` 840×540 (viewBox 900×620) |
| Crease formula | `creaseRadius = rinkHeight * 0.100` → **54** SVG units |
| Paint | Semicircle from each goal line into the ice (`DetailedHockeyRinkLayers`) |
| Faceoff circle | Same `rinkHeight * 0.100` (54) — shared constant |

Source: `frontend/src/features/rinkGeometry/detailedMetrics.ts`.

## Rule reference (NHL / IIHF)

- Goal crease: **semicircle of radius 6 ft (1.83 m)** measured from the center of the goal line into the playing surface.
- Goal mouth width: also 6 ft — crease diameter along the goal line matches the posts.

## Proportional check on this board

The Detailed rink is a **tactical board**, not a literal NHL aspect ratio:

- Real NHL ice ≈ 200×85 ft → aspect ≈ **2.35**
- Detailed ice 840×540 → aspect ≈ **1.56** (compressed length vs width)

Using the **short axis** (ice height ↔ 85 ft rink width) as a length scale:

- `540 / 85 ≈ 6.35` SVG units per foot  
- Rule crease 6 ft → ≈ **38.1** units  
- Drawn crease 54 units → ≈ **8.5 ft** ≈ **1.42×** the rule radius

So on this height-based reading, the crease is **proportionally larger than a 6 ft rule crease** (about +42%).

A length-axis scale (`840 / 200 = 4.2` u/ft) would make 6 ft ≈ 25 units — then 54 would look even larger. Because the board aspect is non-uniform, a single “true feet” claim is ambiguous; the height-based estimate is the one consistent with how `creaseRadius` is derived today (`rinkHeight * …`).

## Conclusion

| Question | Finding |
| --- | --- |
| Is the crease likely oversized vs rule geometry? | **Yes**, ~1.4× on the height-proportional reading. |
| Style Lab special crease? | **No** — must stay on shared `rinkGeometry`. |
| Fix in this phase? | **No** — document only; any correction is a shared Detailed-metrics change (product decision). |

## Recommended next step (later)

Decide whether Detailed metrics should target rule-true feet on one axis, or keep a deliberately enlarged crease for readability on a compressed board — then adjust **one** shared `creaseRadius` (and review faceoff radius coupling) without a lab fork.
