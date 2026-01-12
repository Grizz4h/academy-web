# Academy A2 Enhancement – Observation-Guided Learning

## What Changed

### 1. Enhanced Didactic Structure
Extended every A2 drill with:
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
- Better visual hierarchy in Breakout drills
- Highlighted selected answers
- Current value display for sliders
- Improved progress tracking for Exit drills
- Focus-driven help (help follows your cursor)

## Example: A2.1 - Erste Passoption

**Before:** User saw questions, had to guess what to look for.

**Now:** User clicks on "Passoption" field and sees:
```
👀 Beobachtungsanleitung

Passoption beobachten
Wo befindet sich die erste Passoption, wenn der Verteidiger die Scheibe kontrolliert?

• Aktiv frei oder statisch wartend?
• Passweg offen oder zugestellt?
• Struktur vor dem Pass erkennbar?

"Gab es eine klare erste Passoption?"

[Wie entscheiden? ▼]
[Was ignorieren? ▼]
```

## Files Modified
- `/data/academy/curriculum_A2.json` – Added full didactic metadata to A2.1–A2.4
- `/frontend/src/api.ts` – Extended Drill interface
- `/frontend/src/components/DrillRenderer.tsx` – Added ObservationGuide + improved layouts
- `/frontend/src/pages/SessionSetup.tsx` – Removed redundant "Fokus" field

## Test
```bash
cd /opt/academy-web/frontend
npm run build  # ✓ 300 KB bundle
```

Visit: https://academy.highspeed-novadelta.de/curriculum
1. Select A2
2. Pick any drill
3. Start session
4. Click into a question → see observation guide appear

## Philosophy
**"Der Drill erklärt dem Nutzer wie er schauen soll, nicht nur was er eintragen soll."**

No user should need to open Google. Every term, every decision, every focus point is explained in-context.