# Crease geometry audit (Detailed rink)

**Status:** corrected in shared `rinkGeometry` (2026-10-17).  
**Scope:** `getDetailedRinkMetrics()` / `DetailedHockeyRinkLayers` semicircle crease.

## Rule reference (NHL / IIHF)

- Goal crease: **semicircle of radius 6 ft (1.83 m)** measured from the center of the goal line into the playing surface.
- Goal mouth width: also 6 ft — crease diameter along the goal line matches the posts.

## Board scale

The Detailed rink is a **tactical board**, not a literal NHL aspect ratio:

- Real NHL ice ≈ 200×85 ft → aspect ≈ **2.35**
- Detailed ice 840×540 → aspect ≈ **1.56** (compressed length vs width)

Authoritative length scale for crease: **short axis** (ice height ↔ 85 ft rink width), consistent with how radius was derived as a fraction of `rinkHeight`.

- `540 / 85 ≈ 6.353` SVG units per foot  
- Rule crease 6 ft → `540 × (6/85)` ≈ **38.1176** units

## Old vs new metrics

| Quantity | Old | New |
| --- | ---: | ---: |
| Formula | `rinkHeight * 0.100` | `rinkHeight * (6/85)` (`DETAILED_CREASE_RADIUS_OF_HEIGHT`) |
| Radius (SVG) | **54** | **≈ 38.1176** |
| Implied feet (height scale) | ≈ 8.5 ft | **6 ft** |
| Oversized factor | ≈ **1.42×** | **1.0×** (rule) |
| Depth into ice | = radius (semicircle) | = radius (unchanged contour type) |
| Width on goal line | = 2 × radius | = 2 × radius |
| Position | Semicircle from each goal line into ice | Unchanged attachment to goal line |
| Faceoff circle radius | 54 (`rinkHeight * 0.100`) | **Unchanged** 54 |

Source: `frontend/src/features/rinkGeometry/detailedMetrics.ts`.  
Paint: both ends share the same `creaseRadius` in `DetailedHockeyRinkLayers` (no Style Lab fork, no CSS scale).

## Contour note

The crease remains a **true semicircle** (depth = radius, width = diameter). Correcting the single shared radius fixes depth, width, and contour together. Goal-line attachment points (`leftGoalLineX` / `rightGoalLineX`) were already correct and are unchanged.
