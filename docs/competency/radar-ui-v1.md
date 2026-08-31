# Competency Radar UI V1

Phase 5A — frontend is a **read consumer** of `GET /api/me/competencies`.  
No client-side score / confidence / breadth / evidence-level computation.

## Data source

- `GET /api/me/competencies` via existing `api` + Bearer auth
- Optional stale refresh: `POST /api/me/competencies/recompute`
- Mock scores are **not** used in Account; `COMPETENCY_PREVIEW_FIXTURE` / `preview` flag are Dev-only

## Radar shows

- **Score only** (0–100) on the filled polygon
- Confidence and breadth are secondary (detail panel / small list meta)
- Labels and axis order come from the API (taxonomy)

## Unrated ≠ skill 0

| Condition | Meaning in UI |
|-----------|----------------|
| `status === "unrated"` or `confidence === 0` | No load-bearing assessment yet |
| Not | Skill is zero |

Fully unrated profiles get an empty lead — **no** filled center polygon that reads as “everywhere 0”.

## Partial profiles — decision (Option A)

Spider geometry needs eight vertices. Plotting `unrated → 0` would fake a FIFA-style “weak” axis.

**Decision:** show the **score polygon only when all eight axes are `rated`**.

Until then:

- Keep the eight-axis grid + labels (structure)
- Show rated **nodes** at their score radius (honest points, no closed fill)
- Do **not** place unrated markers near the center
- Side list: rated scores + “Noch nicht bewertet”
- Copy explains that the radar fill appears once every axis has evidence

This prefers scientific honesty over an early incomplete polygon.

## Secondary metrics

| Field | UI label | Semantics |
|-------|----------|-----------|
| `confidence` | Confidence | Certainty of the estimate (not XP) |
| `breadth` | Evidenzbreite | Diversity of underlying evidence across drills/tracks/contexts — **not** “% learned” |
| `evidenceCount` | Evidence | Count of contributing events |
| `highestEvidenceLevel` | Höchstes Evidence-Level | Highest evidence level seen |

## Detail interaction

Scout cards use `AnchoredPopover` (exclusive) for Score / Confidence / Evidenzbreite.  
Axis labels only highlight the radar spoke; tapping a card opens the detail.

## Visual polish (Account)

- Progress pill (`n/8 bewertet` → `Profil vollständig`) + Schwerpunkt story line
- Capability-band rings (20/40/60/80/100); center Ø only when 8/8
- Polygon draw-in + ambient drift (`prefers-reduced-motion` respected)
- Scout cards: score bar, confidence ring, Evidenzbreite track; unrated dashed
- Desktop (≥720px): radar left, scout cards as **2×4 grid** on the right (not 8 stacked)
- Mobile: scout cards already 2-column; very narrow (<380px) single column
