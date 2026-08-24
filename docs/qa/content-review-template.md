# Content QA Review — Track Template (RinQ Tank)

**Verwendung:** Pro Track (Modul) ein Review-Dokument unter `docs/qa/reviews/<track-id>-content-review.md` anlegen.  
**Rules:** `docs/ai-rules/content-quality.md`, `docs/ai-rules/curriculum-boundaries.md`, ggf. `docs/ai-rules/curriculum-rework.md`  
**Keine stillen Fixes:** Review dokumentiert; Korrekturen erst nach Freigabe / separatem Implementierungs-Task.

---

## Meta

| Feld | Wert |
|------|------|
| **Track-ID** | |
| **Titel** | |
| **Reviewer** | |
| **Datum** | |
| **Curriculum-Quelle** | z. B. `data/academy/curriculum.json` · Module `…` |
| **Theorie-Quelle** | `frontend/src/data/theoryData.json` · Key `…` |
| **Vorgänger-Track** | |
| **Nachfolger-Track** | |
| **Scope** | Drills · Didaktik · **theoryData** · Config · Reflection · KI-Guidance |

---

## 1. Track-Ziel

### Was soll der Nutzer nach diesem Track können?

_(Outcome in Beobachtungs-/Lesefähigkeiten, nicht in Coaching-Urteilen.)_

-

### Voraussetzungen aus dem vorherigen Track

| Incoming Skill | Im Curriculum noch vorhanden? | Nachweis (Drill/Theorie) |
|----------------|------------------------------|---------------------------|
| | ja / nein / teilweise | |

### Bewusst noch nicht behandelt

_(Phase Boundary — was gehört explizit in spätere Tracks.)_

-

---

## 2. Theory Inventory

Zentrale fachliche Aussagen und Lehrsätze des Tracks.  
_Nicht jede UI-Zeile — nur tragende Claims._

| # | Claim (Kurzform) | Ort | claim_type | evidence_status | source_needed | confidence | notes |
|---|------------------|-----|------------|-----------------|---------------|------------|-------|
| 1 | | | FACT / COACHING_CONVENTION / RINQ_MODEL / INTERPRETATION | verified / needs_review / convention_only / model | yes / no | high / medium / low | |
| 2 | | | | | | | |

**claim_type-Legende:** siehe `content-quality.md` §1.

Claims aus **beiden** Layern: `curriculum.json` Didaktik **und** `theoryData.json` Sections.

---

## 2b. Theory-Page Alignment (`theoryData`)

| Prüfung | Status | Details |
|---------|--------|---------|
| Titel / subtitle / overview ↔ Modul-Titel + `learningGoals` | ok / drift | |
| Sections decken aktuelle Drills ab | ok / lücke / zu weit | |
| Keine Boundary-Vorwegnahme | ok / finding | |
| Observation-before-Evaluation | ok / finding | |
| Nach Rework mitgezogen? | ja / nein / teilweise | |

**Severity bei Drift:** BLOCKER (komplett falsches Modul-Framing) · MAJOR (Themen/Boundary) · MINOR (Sprache/Formulierung)

---

## 3. Drill Alignment

Pro Drill:

| Drill | Lernziel (1 Satz) | Theoriebaustein | Vorwissen ok? | Mechanik passt? | Feedback ↔ Theorie? | Absolutheiten? | Anmerkung |
|-------|-------------------|-----------------|---------------|-----------------|---------------------|----------------|-----------|
| `_D1` | | | ja / nein / teilw. | ja / nein | ja / nein / n/a | ja / nein | |
| `_D2` | | | | | | | |
| … | | | | | | | |

**Zusatzfragen pro Drill (Freitext bei Abweichung):**

- Verlangt er Wissen, das vorher nicht vermittelt wurde?
- Widerspricht `handoffText` / `learning_hint` dem nächsten Drill oder Track?

---

## 4. Previous → Current → Next Boundary Check

### Aus dem vorherigen Track

-

### Neu in diesem Track

-

### Vorbereitung für den nächsten Track

-

### Lücken

| Lücke | Severity | Wo fehlt es? | Vorschlag |
|-------|----------|--------------|-----------|
| | | | |

### Vorwegnahmen

| Vorwegnahme | Severity | Ort | Konflikt mit Folgetrack |
|-------------|----------|-----|-------------------------|
| | | | |

### Durch frühere Reworks verdrängt?

| Capability | Status | Ersatz-Ort |
|------------|--------|------------|
| | blieb / verschoben / unassigned | |

---

## 5. Evidence Review

Nur Zeilen mit **source_needed = yes** aus §2.

| # | Claim | Bevorzugte Quellenart (Hierarchie 1–4) | Vorhandene Quelle | Qualität | Offene Recherche |
|---|-------|----------------------------------------|-------------------|----------|------------------|
| | 1 Regelwerk · 2 Coaching-Lit. · 3 Forschung · 4 Profi-Coaching | | strong / weak / none | |

**Quellenhierarchie:** `docs/ai-rules/content-quality.md` §2.

---

## 6. Language / Fake Certainty Review

Suchbegriffe (insbesondere in Didaktik, Feedback, Reflection-Guidance):

`immer` · `nie` · `muss` · `falsch` · `richtig` · `optimal` · `einzig`

| Ort | Zitat (Auszug) | Absolutheit gerechtfertigt? | Empfehlung |
|-----|----------------|----------------------------|------------|
| | | ja / nein / Kontext ok | |

---

## 7. Internal Consistency

| Prüfung | Status | Details |
|---------|--------|---------|
| Theoriebausteine widersprechen sich | ok / finding | |
| **theoryData ↔ curriculum** | ok / finding | |
| Drills widersprechen sich | ok / finding | |
| Feedback widerspricht früheren Tracks | ok / finding | |
| Begriffe uneinheitlich | ok / finding | |

---

## 8. QA-Findings

### BLOCKER

_(Falscher Fakt als FACT; kaputte Track-Kette; Drill trainiert etwas anderes als Theorie behauptet; irreführende Pflicht-Aussage.)_

| ID | Ort | Problem | Warum relevant | Vorgeschlagene Korrektur | Rule/Prinzip |
|----|-----|---------|----------------|-------------------------|--------------|
| | | | | | |

### MAJOR

| ID | Ort | Problem | Warum relevant | Vorgeschlagene Korrektur | Rule/Prinzip |
|----|-----|---------|----------------|-------------------------|--------------|
| | | | | | |

### MINOR

| ID | Ort | Problem | Warum relevant | Vorgeschlagene Korrektur | Rule/Prinzip |
|----|-----|---------|----------------|-------------------------|--------------|
| | | | | | |

### NOTE

| ID | Ort | Beobachtung | Rule/Prinzip |
|----|-----|-------------|--------------|
| | | | |

---

## 9. Track Release Status

**Genau einer:**

- [ ] `NOT REVIEWED`
- [ ] `REVIEW IN PROGRESS`
- [ ] `CHANGES REQUIRED`
- [ ] `CONTENT APPROVED`
- [ ] `CONTENT + EVIDENCE APPROVED`
- [ ] `CONTENT + EVIDENCE APPROVED` · **Theory CHANGES REQUIRED**
- [ ] `CONTENT + EVIDENCE + HUMAN APPROVED`

**Begründung (1–3 Sätze):**

---

## 10. Governance Feedback

Wiederkehrende Fehlertypen → permanente Rule?

| RULE_CANDIDATE | Begründung | Ziel-Dokument |
|----------------|------------|---------------|
| ja / nein | | `content-quality.md` / `curriculum-boundaries.md` / … |

---

## Anhang (optional)

- Diff-/Commit-Referenz
- Offene Fragen an Fachexpert:in
- Screenshots / Session-Notizen
