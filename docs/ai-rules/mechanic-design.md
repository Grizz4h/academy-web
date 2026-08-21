# RINK Tank Mechanic Design Rules

These rules apply whenever a drill interaction is added or changed.

**Hard constraint.** Do not invent a one-off UI or scoring path for a single drill ID. Mechanics are product primitives. Curriculum JSON configures them.

Renderer note: Product drills render through V2 feature modules and `config.mechanic`. Do not add a new renderer version or track-letter branches in `pickRendererVersion`. V4 is parked for Meta-Scan only. V1/V3 are removed.

## 1. Mechanic vs drill

| Layer | Owns | Example |
|---|---|---|
| Curriculum | What to learn, when, which prompts | `A2_D3` in `curriculum.json` |
| Mechanic | How the user acts and what is stored | `cue_priority`, `anticipation_read` |
| Renderer | Which mechanic module to mount | V2 `DrillRenderer` |

A drill **selects** a mechanic via `config.mechanic` (and optional flags). A mechanic must not know drill IDs.

```text
❌ if (drill.id === 'A1_D3') { ... special UI ... }
✅ resolveCuePriorityConfig(drill.config) → CuePriorityPanel
```

## 2. Before adding a mechanic

1. Search `frontend/src/features/` and existing `config.mechanic` values.
2. Reuse if the interaction is the same job with different copy or options.
3. Extend the existing module if the job is a variant (extra field, optional step).
4. Only then create a **new generic** mechanic.

A new mechanic is justified when the user action is a new kind of observation, not when a track letter changes.

## 3. Shape of a mechanic module

Put new mechanics in `frontend/src/features/<name>/`:

```text
types.ts          config + result types
<name>Logic.ts    resolveConfig(raw), scoring, no React
<name>Logic.test.ts
Panel / Drill     UI, German product copy
Summary           session recap if needed
index.ts          public exports
```

`resolveXConfig(raw)` must treat the mechanic as **off** unless `config.mechanic` (or an explicit support flag) enables it. Other drills must not pick it up accidentally.

## 4. Config-driven

All of this lives on the drill `config` in JSON, not in code:

- prompts, options, labels
- required vs optional steps
- which roles / cues / sources
- whether a related mechanic is stacked (`supportsCuePriority`, `sourceDrillIds`, …)

Code supplies behavior. JSON supplies the instance.

## 5. Wiring

- Mount from V2 `DrillRenderer` by mechanic string, not by `A1` / `A2` / `E4`.
- Persist through the existing session answers / observation keys.
- If the mechanic should count for achievements or locker tasks, emit a stable `mechanicIds` value — reuse the mechanic name.
- Do not fork Session.tsx, reflection payloads, or progression for one drill.

## 6. What not to do

- No `A1_D2`-specific components.
- No second renderer “just for this track”.
- No copied mechanic folder with three lines changed and a new name.
- No scoring, Hockey IQ, or percentage dashboards unless the product already has that surface.
- No new button/card look; drill chrome stays Session-`.btn` / existing mechanic UI (see UI catalog).

## 7. Known reusable mechanics (excerpt)

| mechanic | UI | Notes |
|---|---|---|
| `decision_analysis` | PressureDiagnosisCheckin (D1–D4 modes) + PeriodCheckin (pattern synthesis) | Config via `observationLayers` + legacy `mode`; no drill-ID branches |
| `defensive_observation` | DraggableRink / ObservationLog / PatternReflection by layer | Layers: pressure_initiation, pressure_effect, support_structure, sequence_analysis, pattern_recognition |
| `system_observation` | Paintable / Corridor-Segment / DraggableRink / PressureDiagnosis / PeriodCheckin by layer | C1 own-zone, C2 NZ, C3 OZ layers; purpose/structure before labels |

## 8. Completion report

State: reused / extended / created, the mechanic id, and which drills can use it besides the one being edited.
