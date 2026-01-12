# Academy A3 Enhancement – Observation-Guided Learning

## What Changed

### 1. Enhanced Didactic Structure
Extended every A3 drill with:
- **observation_rules**: Question-specific guidance with examples
- **decision_help**: Practical heuristics for decision-making
- **ignore_list**: What NOT to focus on
- **glossary**: Term definitions (prepared for tooltips)

### 2. UI During Drills
Added **ObservationGuide** component that appears during drill execution:
- Shows context-specific guidance when focusing on a question
- Collapsible "Wie entscheiden?" and "Was ignorieren?" sections
- Clean, non-intrusive design with subtle highlighting

### 3. Drill Improvements
- Better visual hierarchy in Transition drills
- Highlighted selected answers
- Current value display for sliders
- Improved progress tracking for Neutral Zone drills
- Focus-driven help (help follows your cursor)

## Example: A3.1 - Turnover-Moment erkennen

**Before:** User saw questions, had to guess what to look for.

**Now:** User clicks on "Turnover" field and sees:
```
👀 Beobachtungsanleitung

Turnover-Moment beobachten
Beobachte 2–3 Sekunden vor dem Turnover.

• Umgebung statt nur den Puck verfolgen
• War der Turnover vorbereitet?
• Struktur instabil oder stabil?

"Gab es anspielbare Optionen?"

[Wie entscheiden? ▼]
[Was ignorieren? ▼]
```

## Files Modified
- `/data/academy/curriculum_A3.json` – Added full didactic metadata to A3.1–A3.4
- `/frontend/src/api.ts` – Extended Drill interface
- `/frontend/src/components/DrillRenderer.tsx` – Added ObservationGuide + improved layouts
- `/frontend/src/pages/SessionSetup.tsx` – Removed redundant "Fokus" field

## Test
```bash
cd /opt/academy-web/frontend
npm run build  # ✓ 300 KB bundle
```

Visit: https://academy.highspeed-novadelta.de/curriculum
1. Select A3
2. Pick any drill
3. Start session
4. Click into a question → see observation guide appear

## Philosophy
**"Der Drill erklärt dem Nutzer wie er schauen soll, nicht nur was er eintragen soll."**

No user should need to open Google. Every term, every decision, every focus point is explained in-context.