# RINK Tank Curriculum Rework Rules

These rules apply whenever an existing Academy track or drill is reworked.

The goal is not to simplify a track in isolation. Improve the learning progression while keeping the curriculum a **connected system**.

**Hard constraint.** Read `docs/ai-rules/content-quality.md` and this file before editing Track 0, A1, A2, A3, or any later track. In the completion report, confirm Content QA (A–G) and these rules — including incoming skills, outgoing skills, displaced **capabilities**, and what was intentionally not taught.

Sources of truth:

- Track 0: `data/academy/foundation/t0-track.json`
- A1 onward: `data/academy/curriculum.json`
- **Content QA (fachlich + didaktisch):** `docs/ai-rules/content-quality.md`
- **Curriculum boundaries:** `docs/ai-rules/curriculum-boundaries.md`
- Mechanics: `docs/ai-rules/mechanic-design.md`

---

## Track Rework Checklist

Run this **before implementation**. Do not start D1–D5 until it is answered.

1. Identify **incoming skills** (what the previous track already taught).
2. Identify **outgoing skills** (what this track must create).
3. Map **displaced capabilities** (not just displaced drills).
4. Define the **cognitive complexity budget** for the track.
5. Define **one new observation layer per drill**.
6. Define what is **intentionally not taught yet**.
7. Verify **next-track prerequisites** so the follow-up still has a clean start.

A successful rework must answer:

- What does the user already know before this track?
- What new capability does this track create?
- What does the next track expect as a prerequisite?

---

## 1. Curriculum Boundary Check

Every track rework must evaluate three areas:

1. Prerequisites from the previous track
2. Learning progression inside the current track
3. Handoff requirements for the next track

Never optimize a track only internally.

A beautiful A2 that silently removes A3’s starting point is a failed rework.

Always think:

```text
Previous track → Current track → Next track
```

---

## 1b. Phase Boundary Rule

Tracks should not only differ by topic, but by **game phase**.

Each track owns a specific learning phase.

Example:

```text
Track A1:
Reading individual roles and relationships.

Track A2:
Reading organized structures and available options.

Track A3:
Reading transitions, tempo and structural changes.
```

A track may introduce concepts needed by later tracks,
but should not fully teach the next track's game phase.

Examples of violations:

- A2 teaching Transition / Umschalten / Tempo reaction as a core skill → that is A3
- A1 teaching breakout quality / exit judgement → that is A2 (or later)
- A2 re-explaining what a Center or Support is → that is A1

---

## 1c. Role Deep Dive Rule

After foundational tracks teach general game reading,
role-focused tracks should not repeat general tactics.

Role tracks should answer:

> How does this specific role influence the situation?

Progression:

1. Identify role responsibility
2. Identify role relationships
3. Identify role decisions / tasks
4. Identify role impact / connecting function
5. Identify timing and anticipation

Do not re-teach Transition, structure basics, or systems inside a role track.
Do not build role-specific renderers (`CenterRenderer`, `if (drill.id === 'B1_…')`).

---

## 1d. Decision Evaluation Rule

Advanced observation tracks should separate:

1. Situation
2. Available options
3. Chosen solution
4. Reason for the decision
5. Outcome

Do not judge decisions only by the result.

A failed action can be a reasonable decision under extreme pressure.
A successful action can still be a poor decision.

Early/mid tracks may **analyze** decisions under conditions without grading them as good/bad.
Quality scoring of decisions belongs later.

---

## 1e. System Understanding Rule

System tracks should teach purpose before labels.

Learning order:

1. Identify protected space
2. Identify player relationships
3. Identify responsibilities
4. Identify repeated structures
5. Introduce system terminology

The learner should understand why a system exists before learning its name.

---

## 1g. Offensive System Understanding Rule

Offensive system tracks should teach structure before plays.

Learning order:

1. Identify occupied and available space
2. Identify player relationships
3. Identify movement and rotation
4. Identify created advantages
5. Introduce tactical terminology

The learner should understand why an offensive structure works before learning its name.

Do not teach game plans, special teams, or coaching evaluation inside early offensive system tracks.

---

Defensive system tracks should separate:

**Own Zone Defense (C1):**

- protecting dangerous areas
- maintaining structure
- controlling scoring options

**Neutral Zone Defense (C2):**

- controlling entry routes
- guiding opponent movement
- managing speed before entry

Do not teach neutral zone concepts inside zone-defense tracks.
Do not teach own-zone system organization inside neutral-zone tracks.

---

Do not preserve drills.
Preserve learning outcomes.

A drill may disappear while the capability must remain somewhere else.

Bad framing:

> “Old A1_D3 (Winkel / Body Position) is missing.”

Better framing:

> Capability: recognize defensive body orientation / steering angle.  
> Where does this capability belong now? Same track later, next track, or explicitly unassigned with a destination.

Every displaced capability must be:

- retained later in the same track,
- prepared in the prerequisite track,
- explicitly introduced in a following track,
- or marked **displaced / unassigned** with a named later home.

Do not delete a learning outcome because it made an early drill too difficult.
Do not keep a weak old drill just to avoid moving the capability.

---

## 3. Complexity Budget

Each track has a cognitive complexity budget.

Beginner tracks should introduce **only one major new observation layer at a time**.

Do not introduce multiple new observation dimensions in a single drill.

Example (A1, after rework):

```text
Player → Position → Function → Relation → Structure
```

Example (intended A2 shape — not a mandate to copy titles):

```text
Structure in a game situation → Decision / option → Tactical outcome
```

A1 stayed inside one role and grew the layer.
A2 may apply that reading to a concrete situation (e.g. breakout), but still one new layer per drill.

Maximum simultaneous observation dimensions in an early drill: **three**. Prefer fewer.

---

## 4. Observation before Evaluation

Early curriculum tracks prioritize recognition over judgement.

First teach:

> What do I see?

Then:

> Why does it matter?

Then:

> Was it effective?

Do not jump from first sight to quality scoring.

Examples:

- A1_D5 recognizes a small structure. It does not grade the structure.
- A2 may teach seeing a breakout structure before judging a “good” or “bad” exit.
- A2_D2 must not become “guter/schlechter Exit” as the first new layer unless recognition of the exit type already exists.

`unclear` remains a valid observation. Do not force a rating.

### 4b. Observation Before Outcome Rule

Beginner tracks should follow this order:

1. Identify the situation change
2. Identify player reactions
3. Identify available options
4. Identify consequences
5. Evaluate quality only in later tracks

A3 owns steps 1–3 in the transition phase (change → reaction → continue vs control).  
It may name consequences as **observed follow-ons**, but must not grade transition quality.  
Systems, special teams, and full defensive schemes stay later.

---

## 5. Skill Dependency Graph

Every track should define:

- skills **required before entering**
- skills **created after completion**
- skills **required by following tracks**

Tracks form a connected learning graph, not isolated chapters.

Living sketch of Track A after the A1 rework (update this when a later track is reworked):

```text
Track 0  vocabulary, roles, support, rink geography
    |
    v
A1   find a role → position → function → relation → simple structure
    |
    |  outgoing: Center, LMH, support, direct/next/coverage,
    |            multiple options, small structure / triangle-as-connections
    v
A2   apply that reading to a concrete situation: structure → options → decision → …
    |
    |  should not re-teach: what is a Center, what is Support, what is an Option
    |  A2_D1 outgoing: read a situation as joint structure (initiator / support / structure)
    |  A2_D2 outgoing: recognize available options (option / type / count)
    |  A2_D3 outgoing: recognize executed decision (used option / action / visibility)
    |  A2_D4 outgoing: recognize space/time conditions (space / time / influencing factor)
    |  A2_D5 outgoing: recognize structure development (support / option continuity / state)
    |  should not teach: Transition, Tempo, Umschalten (A3 phase)
    |  outgoing (intended track): see what happens in a structured situation
    v
A3   recognize transition moments, first reactions, continue vs control,
    |  defensive return reaction, spacing / space control under tempo
    |
    |  should not re-teach: breakout structure / options (A2)
    |  should not teach: systems, forecheck schemes, special teams, full D concepts (later)
    |  outgoing (intended): see what happens when structure changes under transition & tempo
    v
B1   role deep dive (Center): support → connections → tasks → outlet/impact → timing
    |
    |  should not re-teach: Transition basics (A3), structure/options (A2), what is a Center (A1)
    |  should not teach: systems, special teams, team tactics, pressure diagnosis (B2)
    |  outgoing: how this role influences situations already readable from Track A
    v
B2   decisions under pressure: pressure → solution → cause → follow-up → patterns
    |
    |  should not re-teach: Center role (B1), Transition basics (A3)
    |  should not judge: gute/schlechte Entscheidung, richtig/falsch Lösung
    |  mechanic: decision_analysis (sample diagnosis modes + pattern synthesis)
    |  outgoing: decision patterns under conditions (not systems)
    v
B3   defensive team behavior: first pressure → effect → support → sequence → patterns
    |
    |  should not re-teach: decision analysis under pressure (B2)
    |  should not teach: forecheck schemes (1-2-2), Box+1, zone systems (Track C)
    |  mechanic: defensive_observation (layers; reuses rink / observation log / pattern reflection)
    |  outgoing: I recognize defensive patterns in behavior
    v
C1   own-zone systems: space priority → structure/spacing → pressure vs control → responsibility → stability
    |
    |  should not re-teach: B3 behavior sequences as the main goal
    |  should not teach: Neutral Zone entry / guiding / speed (C2)
    |  purpose before labels (no Box+1 as first answer)
    |  mechanic: system_observation (layers; reuses paint / rink / period checkin)
    |  outgoing: I understand why own-zone order exists
    v
C2   neutral-zone systems: entry routes → spacing → steering → recovery → profile
    |
    |  should not re-teach: own-zone protection (C1) or B3 access behavior as the main goal
    |  should not teach: offensive zone chance creation (C3)
    |  purpose before labels (space denial / guiding before system names)
    |  mechanic: system_observation (shared family with C1; different layers)
    |  outgoing: I understand how teams deny / guide before entry
    v
C3   offensive-zone systems: space → connections → movement/rotation → advantage → patterns
    |
    |  should not re-teach: Neutral Zone denial (C2)
    |  should not teach: game plans, special teams, full coaching decisions (later)
    |  structure before plays / names (no Umbrella-as-first-answer)
    |  mechanic: system_observation (shared family; OZ layers)
    |  outgoing: I understand how teams create space and structured attacks
```

This graph is a curriculum document. It does not need to be a runtime feature.
If a rework changes incoming or outgoing skills, update the graph in the completion report.

---

## 6. Internal progression

D1–D5 must build on each other. Avoid five unrelated exercises.

For every drill ask:

- What can the user do before this drill?
- What new capability does this drill add?
- Why is this capability needed for the next drill?
- What does D5 synthesize?

D5 is synthesis of the track, not a new mini-track and not a dump of leftover topics.

---

## 7. Prefer scaffolding over simplification

If a drill is too difficult:

Do not simply remove complexity.

Instead:

- introduce the prerequisite earlier,
- reduce the number of simultaneous tasks,
- provide guidance,
- reveal complexity progressively.

---

## 8. Observation-first principle

RINK Tank trains users to **see** hockey, not merely answer questions.

Many drill prompts are intentional observation hooks.

Example: “Where is the Center?” also trains finding and following a role.

Preserve these hooks, but explain the learning purpose clearly enough that beginners are not lost.

Do not re-ask every previous drill’s questions inside the next drill. Assume incoming skills. Focus the form on the **new** layer.

---

## 9. Mechanics stay modular

Do not hardcode new mechanics for individual drill IDs.

Follow `docs/ai-rules/mechanic-design.md`.

Before adding a mechanic:

1. reuse an existing mechanic if the user action is the same job,
2. extend it if the job is a variant,
3. only then create a new **generic** mechanic.

New mechanics must be reusable and config-driven.

---

## 10. Beginner experience

A beginner should never fail because the app assumes knowledge it has not taught.

If the user needs a concept to complete a task, either:

- it must have been introduced earlier,
- or the drill must provide enough scaffolding to discover it.

Conversely: do not re-explain a concept the previous track already made usable, unless a short reminder is needed as scaffolding.

---

## Current track boundaries (update when reworked)

These describe the **intended** boundaries. A later rework may change titles; it must not silently break the graph.

### Track 0

Provides orientation, basic hockey vocabulary, rink geography, basic player roles, and introductory concepts such as support, puck side, weak side, entry and exit.

Track 0 explains what the user may see.
It does not already run A1’s live observation training.

#### Beginner Visualization Rule

Track 0 visuals must prioritize recognition over hockey terminology.

Avoid unexplained abbreviations.

Every visual element should answer:
"What does this represent?"

before:
"What is the technical hockey name?"

Prefer full beginner labels (e.g. Verteidiger, Stürmer, Puck) over LD / S / P.
Optional glossary hints may surface known terms without turning Track 0 into a dictionary quiz.

**Do not spoil identify quizzes.** If the prompt asks for Puckführer / Support, markers must not already be labeled with those role names. Show a **player + attached puck** (recognition cue) and neutral labels (Blau / Rot). Teach the term in the explanation after the choice.

### A1

Teaches how to locate, track and interpret **one role** in real game situations.

Progression:

```text
identify the Center
→ follow position (Low / Middle / High)
→ interpret function
→ recognize a relationship
→ recognize a simple structure
```

A1 turns Track 0 vocabulary into active observation.
A1 does not teach full breakout / forecheck / zone systems.
Lenkung / Winkel / Body Position stay displaced until a later home is named.

### A2

**Phase:** Reading organized structures and available options in a concrete situation.

May assume after A1:

- recognize a player role
- find the Center
- understand Low / Middle / High
- recognize support
- recognize simple relationships (direct / next / coverage)
- recognize a small structure / several options at once

A2 should **not** re-explain what a Center, Support, or Option is.

Intended internal progression (rework in progress):

```text
Structure → Options → Decision → Space/Time → Structure change
```

A2_D1 teaches recognizing a situation as a joint structure of several players — not breakout analysis, not quality scoring.

A2_D2 teaches recognizing **available options** from an existing structure — not choosing the best option, not exit quality scoring.

A2_D3 teaches recognizing **which option was actually used** (decision recognition) — not judging whether the decision was good.

A2_D4 teaches recognizing **space and time conditions** that make an action possible — not judging whether the decision was right.

A2_D5 teaches recognizing **structure development** after an action (continuity of support/options, stable/changing/breaking down) — not structure quality scoring. Avoid the user-facing term “Strukturqualität”; prefer Strukturentwicklung / Stabilität / Veränderung.

A2 should still leave a clean start for A3. Do not pull A3’s Transition / Tempo / Umschalten layer into A2, and do not leave A3 without “I can already see a structured situation.”

### Displaced A2_D2 content (Exit-Qualität)

The former A2_D2 drill (“Exit-Qualität erkennen — Kontrolle vs. Befreiung”) was **evaluation-heavy** and belongs after option/decision recognition, not as the second A2 layer.

Preserve the intent for a later drill (e.g. exit outcome / structure quality in A2_D5 or a dedicated exit track):

- Exit types: kontrolliert / halbkontrolliert / befreiung
- Anschluss vorhanden ja/nein
- Focus: first 1–2 seconds after the blue line
- Rule: Observation before Evaluation — recognition of exit *type* before judging “good/bad exit”

### Displaced A2_D3 content (Blue-Line-Entscheidungen)

The former A2_D3 drill (“Blue-Line-Entscheidungen” — Sauber / Riskant / Unnötig) mixed **decision quality scoring** with tempo/gap judgment. That belongs after recognition of “what was done,” not as the third A2 layer.

Preserve for a later drill (space/time quality, entry evaluation, or a dedicated Blue-Line track):

- Entry ratings: Sauber / Riskant / Unnötig
- Cause factors (gap/timing, support, lane, tempo break, blind entry, …)
- Focus: offensive blue-line moment
- Rule: Observation before Evaluation — first recognize executed option/action, then judge preparation quality
- Tempo / Umschalten still stay with A3 unless a later A2 drill owns only recognition of space/time conditions

### Displaced A2_D4 content (Erste Passoption / Passqualität)

The former A2_D4 drill (“Erste Passoption lesen” — Option + Passqualität Klar/Unter Druck/Notlösung) mixed **first-pass recognition** with **pass quality scoring**. Option recognition already lives in D2/D3; quality scoring belongs after conditions are visible (later synthesis / D5 or a dedicated pass-quality drill).

Preserve for a later drill:

- First option labels: Center, Winger, Defense-Partner, Reverse/Drop, Rim/Bande
- Pass quality: Klar / Unter Druck / Notlösung
- Focus: only the first pass, ignore later outcome
- Rule: Observation before Evaluation — recognize option/action first, then judge pass quality
- Do not pull Transition / Backcheck / Turnover reaction into A2_D4

### Displaced A2_D5 content (Linien & Raumgefühl)

The former A2_D5 drill (“Linien & Raumgefühl” — offen / neutral / eng) mixed **space feel** with decision pressure language. Space/time recognition now lives in A2_D4; D5 owns structure development across an action.

Preserve for a later drill (or fold descriptive space-feel cues into A2_D4 reflection only):

- Space feel: offen / neutral / eng
- Focus: moment before the blue line, space as time
- Rule: Observation before Evaluation — do not use “Qualität” as the user-facing label
- Transition / Tempo / Umschalten remain A3

### A3 (polished)

Module: Transition & Tempo — dynamics of a changing situation.

Progression:

```text
A3_D1  Transitionsmoment erkennen (Puckbesitzwechsel als Haupttrigger)
A3_D2  Erste Reaktion erkennen (Puckführer / Mitspieler / Defense)
A3_D3  Transition fortsetzen oder kontrollieren
A3_D4  Defensive Rückreaktion lesen (Backchecking as observation)
A3_D5  Abstand und Raumkontrolle erkennen (Gap as beginner-friendly spacing)
```

Handoff from A2:

```text
A2  I can see how players build and keep structure.
A3  I recognize what happens when that structure changes — often via puck possession.
```

A2_D5 must name the bridge: structure change is not only “zerfällt”, and one of the most important triggers is a puck possession change.

A3 must not pull:

- complex systems / forecheck systems
- special teams
- detailed defensive concepts as coaching

Next neighbor in curriculum is **B1** (role detail), not A4.

Mechanics: reuse `event_log` / `period_checkin` via config. No `if (drill.id === 'A3_…')`.

### B1 (polished)

Module: Center role deep dive — how one role influences situations already readable from Track A.

Progression:

```text
B1_D1  Support unter dem Puck (spielbare Unterstützung)
B1_D2  Dreiecksstabilität (Verbindungen / Anspielbarkeit)
B1_D3  Center-Aufgaben erkennen
B1_D4  Center als Outlet & Anschlussoption
B1_D5  Timing & frühe Wahrnehmung
```

Handoff from A3:

```text
A3  I can see how situations change.
B1  I see how one role influences those situations.
```

B1 must not re-teach Transition, general structure reading, systems, or special teams.
Outbound neighbor is **B2** (decisions under pressure) — name it lightly, do not teach it.

Mechanics: reuse `sample_log` via config. No role-specific renderer.

### B2 (polished)

Module: decisions under pressure — analyze conditions, solutions, causes, follow-ups, patterns.

Progression:

```text
B2_D1  Druck erkennen (pressure_source)
B2_D2  Lösung unter Druck erkennen (solution_type)
B2_D3  Entscheidungsursache erkennen (decision_cause)
B2_D4  Erste Anschlussentscheidung erkennen (followup_decision)
B2_D5  Entscheidungsmuster erkennen (pattern_synthesis)
```

Mechanic: `decision_analysis` (reuses existing sample-diagnosis UI / PeriodCheckin for D5).
Modes remain for D1–D4 compatibility (`pressure_diagnosis`, `solution_type_diagnosis`, …).

Do not introduce good/bad decision scoring.
Outbound neighbor: **B3** (defensive team behavior / access).

### B3 (polished)

Module: how a team creates defensive control together — access, timing, support, sequences, patterns.

Progression:

```text
B3_D1  Ersten defensiven Druck erkennen (pressure_initiation)
B3_D2  Wirkung des Drucks erkennen (pressure_effect)
B3_D3  Teamunterstützung beim Zugriff erkennen (support_structure)
B3_D4  Defensive Sequenzen lesen (sequence_analysis)
B3_D5  Defensive Muster erkennen (pattern_recognition)
```

Mechanic: `defensive_observation` (family label; keeps existing drill_types / UIs via layers).

Boundary to **C**:

```text
B3: Was passiert defensiv? (Verhalten / Muster)
C:  Wie organisiert ein Team das systematisch? (Systeme / Zonen)
```

Do not explain forecheck schemes or Box+1 here.
Outbound neighbor: **C1** (own-zone systems — purpose before labels).

### C1 (polished)

Module: own-zone defensive systems — purpose before labels.

Progression:

```text
C1_D1  Welche Räume schützt die Defensive? (space_priority)
C1_D2  Wie organisiert die Struktur diese Räume? (structure_alignment, spacing)
C1_D3  Wie erzeugt die Struktur Druck oder Kontrolle? (pressure_vs_control)
C1_D4  Wie wechseln Verantwortlichkeiten? (responsibility_shift)
C1_D5  Wie stabil bleibt das System? (system_stability)
```

Mechanic: `system_observation` (family label; keeps existing drill_types / UIs via layers).

Boundaries:

```text
B3: Was macht die Defensive? (Verhalten)
C1: Warum ist die Defensive so organisiert? (eigene Zone)
C2: Wie wird der Zoneneintritt kontrolliert? (Neutral Zone)
```

Do not introduce system grading (gut/schlecht) or Neutral Zone teaching here.
Outbound neighbor: **C2** (neutral-zone systems — entry / guiding / speed).

### C2 (polished)

Module: Neutral Zone systems — space denial and guiding before entry; purpose before labels.

Progression:

```text
C2_D1  Neutral-Zone-Struktur erkennen (entry_route_control)
C2_D2  Staffelung und Raumkontrolle erkennen (neutral_zone_spacing)
C2_D3  Gegner lenken und Wege kontrollieren (steering_pattern)
C2_D4  Erste Struktur überwunden – Reaktion lesen (recovery_after_breakthrough)
C2_D5  Neutral-Zone-Profil erkennen (system_profile)
```

Mechanic: `system_observation` (same family as C1; different layers / UIs).

Boundaries:

```text
B3: Wie erzeugen Spieler defensiven Zugriff? (Verhalten)
C1: Welche Räume schützt ein Team in der eigenen Zone?
C2: Welche Wege/Räume werden vor der eigenen Zone kontrolliert?
C3: Wie erzeugt ein Team selbst Raum und Chancen?
```

Do not teach own-zone systems or offensive chance structure here.
No coaching grading of systems.
Outbound neighbor: **C3** (offensive-zone systems — create space / structure attacks).

### C3 (polished)

Module: Offensive Zone systems — structure before plays; purpose before labels.

Progression:

```text
C3_D1  Welche Räume hält die Offensive besetzt? (space_distribution)
C3_D2  Wie bleiben Spieler verbunden? (connection_structure, support_relationships)
C3_D3  Wie bewegt die Offensive die Defensive? (defensive_movement, rotation_effect)
C3_D4  Was macht die Offensive mit einem Vorteil? (advantage_conversion)
C3_D5  Welches offensive Muster entsteht? (offensive_profile)
```

Mechanic: `system_observation` (same family as C1/C2; OZ layers).

Boundaries:

```text
C2: Wie verhindert ein Team kontrollierte Angriffe?
C3: Wie erzeugt ein Team kontrollierte Angriffe?
Later: game plan / special teams / coaching decisions — not here
```

C-block summary:

```text
C1: Wie schützt ein Team Raum?
C2: Wie verweigert ein Team Raum?
C3: Wie erzeugt ein Team Raum?
```

---

## Rework output requirements

Before implementation, provide:

- incoming skills
- outgoing skills
- proposed drill progression (one new layer each)
- complexity budget
- what is intentionally **not** taught yet
- displaced capabilities and their destination
- next-track prerequisites (verified, not assumed)
- mechanic reuse / extension / new mechanic
- risks of creating a learning gap behind or ahead

Only then implement.

Do not start the next track’s D1–D5 until the boundary checklist for **that** track is complete.

---

## Completion report

After a curriculum rework, the final message must include:

1. Confirmation that this file was applied.
2. Previous track inspected and next track inspected (Boundary Check).
3. Incoming skills / outgoing skills.
4. Capability table: capability → stayed / moved to / newly introduced / unassigned (with destination).
5. Confirmation that no learning **outcome** was deleted without a destination.
6. Complexity budget and observation layers per drill.
7. What was intentionally not taught yet.
8. Next-track prerequisites: still covered, or named gap (do not silently fill it).
9. Mechanic decision: reused / extended / new (with id).
