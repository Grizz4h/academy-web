# Academy A1 Enhancement – Observation-Guided Learning

## What Changed

### 1. Enhanced Didactic Structure
Extended every A1 drill with:
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
- Better visual hierarchy in Period Check-in
- Highlighted selected answers
- Current value display for sliders
- Improved progress tracking for Shift Tracker
- Focus-driven help (help follows your cursor)

## Example: A1.1 - Period Check-in

**Before:** User saw questions, had to guess what to look for.

**Now:** User clicks on "Center-Position" field and sees:
```
👀 Beobachtungsanleitung

Center-Position beobachten
Stell dir das Spielfeld in drei horizontale Zonen vor. 
Wo ist der Center MEISTENS, wenn der Puck hinten ist?

• Low: Center ist tief im eigenen Drittel, hilft beim Spielaufbau...
• Middle: Center steht zwischen Defense und Wingern...
• High: Center steht hoch, wartet...

"Wo ist der Center MEISTENS, wenn er keinen Puck hat?"

[Wie entscheiden? ▼]
[Was ignorieren? ▼]
```

## Files Modified
- `/data/academy/curriculum.json` – Added full didactic metadata to A1.1–A1.4
- `/frontend/src/api.ts` – Extended Drill interface
- `/frontend/src/components/DrillRenderer.tsx` – Added ObservationGuide + improved layouts
- `/frontend/src/pages/SessionSetup.tsx` – Removed redundant "Fokus" field

## Test
```bash
cd /opt/academy-web/frontend
npm run build  # ✓ 300 KB bundle
```

Visit: https://academy.highspeed-novadelta.de/curriculum
1. Select A1
2. Pick any drill
3. Start session
4. Click into a question → see observation guide appear

## Philosophy
**"Der Drill erklärt dem Nutzer wie er schauen soll, nicht nur was er eintragen soll."**

No user should need to open Google. Every term, every decision, every focus point is explained in-context.
