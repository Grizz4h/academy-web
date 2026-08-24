# Content QA Review — A1 & A2

**Status:** `CONTENT + EVIDENCE APPROVED` · Human Layer **offen** (`NOT_REVIEWED`)  
**Datum:** 2026-08-23 · **Fix-Pass:** 2026-08-23 · **Evidence-Closeout:** 2026-08-23  
**Reviewer:** Content QA (Cursor)  
**Quelle:** `data/academy/curriculum.json` · Module `A1`, `A2`  
**Template:** [`content-review-template.md`](../content-review-template.md)

### Fix-Pass Log (A1 MAJOR)

| ID | Status | Änderung |
|----|--------|----------|
| A1-MAJ-001 | **resolved** | `A1_D5` config `handoffText` — Breakout entfernt, A2-Frame (Struktur/Optionen/Unterstützung) |
| A1-MAJ-002 | **resolved** | A1 `learningGoals[4]` präzisiert; **Outlet** didaktisch nach **B1** (`learningGoals`: „Center als Outlet…“) — nicht in A1 neu erfunden |

**Re-Check Theory↔Drill / Boundary (nach Fix):** A1_D5-Handoff ↔ A2-Intro/Ignore konsistent. A1-Lernziele decken A1_D1–D5 ab (Support/Absicherung in D1/D4). **Keine neuen Boundary-Probleme.**

---

## Executive Summary

| Metrik | A1 | A2 | Gesamt |
|--------|----|----|--------|
| BLOCKER | 0 | 0 | **0** |
| MAJOR | 0 *(2 resolved)* | 0 | **0 offen** |
| MINOR | 2 | 2 | **4** *(unverändert)* |
| NOTE | 3 | 4 | **7** *(unverändert)* |
| Claims `source_needed=yes` | 5 | 4 | **9** *(analysiert §11)* |

### Evidence-Pass Summary (2026-08-23)

| evidence_requirement | Anzahl |
|---------------------|--------|
| **REQUIRED** | **0** |
| **RECOMMENDED** | **5** |
| **OPTIONAL** | **2** |
| **NOT_NEEDED** | **2** |

Keine Curriculum-Änderungen in Analyse-Pass. **Recherche-Pass abgeschlossen** (§12) — 5× MODERATE; volle Evidence-Freigabe pending Sprach/Glossar.

**Quellen:** [`docs/qa/sources/a1-a2-sources.md`](../sources/a1-a2-sources.md)

---

# Track A1 — Rink IQ & Rollenverständnis

## Meta

| Feld | Wert |
|------|------|
| **Track-ID** | A1 |
| **Vorgänger** | T0 (optional Foundation) · Track A Phase „Rollen/Beziehungen“ |
| **Nachfolger** | A2 — Struktur & Optionen lesen |

## 1. Track-Ziel

### Outcome

Nutzer kann den **Center** im Live-Spiel wiederfinden, **Low/Middle/High** grob einordnen, **Funktionen** (Sichern, Verbinden, Mit nach vorne) lesen, **Beziehungen** (Passoption, Anschluss, Absicherung) erkennen und daraus **einfache Strukturen** (Option, mehrere Optionen, Dreieck, Absicherungsstruktur) wahrnehmen — **ohne Qualitätsurteil**.

### Voraussetzungen (Previous)

| Incoming Skill | Vorhanden? | Nachweis |
|----------------|------------|----------|
| Zonen / Grundrollen (T0) | optional, nicht erzwungen | T0 optional; A1 führt Center neu ein |
| Puck vs. Spieler unterscheiden | teilweise implizit | A1_D1 explizit |
| Academy-Beobachtungssprache | RINQ_MODEL | Low/Middle/High in A1_D2 |

### Bewusst noch nicht behandelt

Breakout-Analyse, Teamtaktik, Dreiecks-Geometrie als Pflicht, Qualitätsurteile, Transition/Tempo, Systeme, mehrere Rollen gleichzeitig als Pflicht (laut Ignore-Listen D1–D4).

---

## 2. Theory Inventory (A1)

| # | Claim | Ort | claim_type | evidence_status | source_needed | confidence | notes |
|---|-------|-----|------------|-----------------|---------------|------------|-------|
| A1-C1 | Center ist guter Einstieg, pendelt zwischen Aufgaben/Räumen | A1_D1 didactics | COACHING_CONVENTION | needs_review | **yes** | medium | verbreitet, nicht universal |
| A1-C2 | Center an Verhalten/Beziehungen erkennen, nicht nur Lineup | A1_D1 | RINQ_MODEL | model | no | high | didaktische Methode |
| A1-C3 | Low / Middle / High räumliche Höhe | A1_D2 | RINQ_MODEL | model | no | high | RinQ-Labels, nicht IIHF |
| A1-C4 | Funktionen: Sichern, Verbinden, Mit nach vorne | A1_D3 | **RINQ_MODEL** + COACHING_CONVENTION | **verified** | **yes** | medium | **MODERATE** · SRC-01, SRC-02 · Glossar: `docs/content/hockey-glossary.md` · HR REQUIRED |
| A1-C5 | Beziehungen: direkte Passoption, Anschlussoption, Absicherung | A1_D4 | **RINQ_MODEL** + COACHING_CONVENTION | **verified** | **yes** | medium | **MODERATE** · SRC-03, SRC-01, SRC-02 · Anschlussoption=RinQ-Label · HR REQUIRED |
| A1-C6 | Einfache Strukturen: Option / mehrere Optionen / Dreieck / Absicherung | A1_D5 | **RINQ_MODEL** + COACHING_CONVENTION | **verified** | **yes** | medium | **MODERATE** · SRC-02, SRC-05, SRC-06 · HR REQUIRED |
| A1-C7 | Support/Absicherung als Grundrollen ohne Puck | `learningGoals[4]` · A1_D1/D4 | COACHING_CONVENTION | convention_only | **yes** | medium | ~~Outlet~~ → B1; Ziel an Drills angeglichen |
| A1-C8 | Dreieck muss nicht geometrisch perfekt sein | A1_D5 config/reflection | RINQ_MODEL | model | no | high | bewusste Vereinfachung |

---

## 3. Drill Alignment (A1)

| Drill | Lernziel | Theorie | Vorwissen | Mechanik | Feedback | Absolut? |
|-------|----------|---------|-----------|----------|----------|----------|
| A1_D1 | Rolle Center finden | A1-C1, C2 | ok (Start) | role_identification ✓ | passt (kein r/f) | nein |
| A1_D2 | Position Low/M/H | A1-C3 | D1 ✓ | shift_tracker ✓ | passt | nein |
| A1_D3 | Funktion der Position | A1-C4 | D1–2 ✓ | shift_tracker ✓ | passt | nein |
| A1_D4 | Beziehung Puckführer–Center | A1-C5 | D1–3 ✓ | player_relation ✓ | passt | nein |
| A1_D5 | Erste Struktur um Center | A1-C6, C8 | D1–4 ✓ | simple_structure ✓ | passt | nein (neg. „muss nicht“) |

**Abweichung:** ~~A1_D5 `handoffText` (Breakout-Vorschau) ↔ A2-Modulbeschreibung~~ → **resolved** (Fix-Pass 2026-08-23).

---

## 4. Boundary A1

| Richtung | Inhalt |
|----------|--------|
| **Previous (T0)** | A1 funktioniert ohne T0; Center-Rolle tiefer als T0-Grundrollen |
| **Current** | Rolle → Position → Funktion → Beziehung → Struktur (saubere D1–D5-Kette) |
| **Next (A2)** | Generische Situationsstruktur vorbereitet — Handoff aligned ✓ |
| **Lücke** | ~~Lernziel **Outlet**~~ → resolved; Outlet-Ziel in **B1** |
| **Vorwegnahme** | ~~Handoff „Breakout“~~ → resolved |

---

## 5–7. A1 Language / Consistency (Kurz)

| Ort | Befund | Einschätzung |
|-----|--------|--------------|
| A1_D1 „nicht richtig oder falsch“ | Meta: Bewertung ausgeschlossen | Kontext ok |
| A1_D5 „Du musst noch nicht…“ / „Dreieck muss nicht…“ | Didaktische Entschärfung | Kontext ok |
| A1_D3 ignore „Richtig oder falsch positioniert“ | Negationsliste | ok |

**Internal consistency:** Drills D1→D5 stimmig; **Modul-Lernziele vs. D4/D5 Vokabular (Outlet)** schwach.

---

## 8. QA-Findings A1

### MAJOR

| ID | Ort | Problem | Status | Korrektur (umgesetzt) | Rule |
|----|-----|---------|--------|----------------------|------|
| **A1-MAJ-001** | `A1_D5` `handoffText` | Breakout-Versprechen | **resolved** | Handoff auf A2-Frame (Struktur, Unterstützung, Optionen; kein Breakout/Qualität) | Boundary · Theory↔Drill |
| **A1-MAJ-002** | `learningGoals[4]` | **Outlet** ohne Drill-Nachweis | **resolved** | Ziel → Support/Absicherung relational; Outlet bleibt **B1**-Lernziel | Boundary Displacement |

### MINOR

| ID | Ort | Problem | Korrektur | Rule |
|----|-----|---------|-----------|------|
| A1-MIN-001 | A1_D2 `shift_marker_explanation` | „Du **musst** den Marker nicht jedes Mal benennen“ | Optional zu „musst nicht“ → „brauchst nicht“ | Language §3 |
| A1-MIN-002 | A1 vs T0 | Center-Fokus ohne expliziten Hinweis „T0 optional“ im Modul-Intro | Ein Satz im Modul-`description` oder Curriculum-UI | Boundary |

### NOTE

| ID | Beobachtung |
|----|-------------|
| A1-NOT-001 | Starke Progression D1–D5; Ignore-Listen schützen Complexity Budget |
| A1-NOT-002 | `reflectionGuidance` betont Lernprogression — gut für KI-Coaching |
| A1-NOT-003 | „Unklar“ durchgängig als valide Antwort |

---

# Track A2 — Struktur & Optionen lesen

## Meta

| Feld | Wert |
|------|------|
| **Track-ID** | A2 |
| **Vorgänger** | A1 |
| **Nachfolger** | A3 — Transition & Tempo |
| **Premium** | ja (`premium_locked` ab A2) |

## 1. Track-Ziel

### Outcome

Spielsituation als **Zusammenspiel** lesen: Struktur → **Optionen** → **Entscheidung** → **Raum/Zeit** → **Strukturentwicklung** — durchgängig **ohne Qualitätsurteil**, ohne Transition/Tempo.

### Voraussetzungen (A1)

| Incoming Skill | Vorhanden? | Nachweis |
|----------------|------------|----------|
| Rollen, Beziehungen, einfache Strukturen | ja | A2_D1 explanation verweist auf A1 |
| Center-Lesen | ja, erweitert auf mehrere Spieler | A2 „nicht nur Center“ |
| Low/M/H | implizit, nicht Fokus | ok für A2 |

### Bewusst noch nicht behandelt

Transition, Tempo, Umschalten, Breakout-Fehlerdiagnose, beste Option, Coaching-Urteile (Ignore-Listen D1–D5 konsistent).

---

## 2. Theory Inventory (A2)

| # | Claim | Ort | claim_type | evidence_status | source_needed | confidence | notes |
|---|-------|-----|------------|-----------------|---------------|------------|-------|
| A2-C1 | Struktur = geordnete Rollen/Abstände (nicht „gut“) | A2_D1 | RINQ_MODEL | model | no | high | |
| A2-C2 | Optionen entstehen aus Struktur | A2_D2 | RINQ_MODEL | model | no | high | |
| A2-C3 | Entscheidung = genutzte Option (Pass/Carry/Dump/Reset) | A2_D3 | **RINQ_TAXONOMY** + COACHING_CONVENTION | **verified** | **yes** | medium | **MODERATE** · SRC-08, SRC-10, SRC-01 · HR REQUIRED |
| A2-C4 | Carry = Spieler führt selbst weiter | A2_D3 miniFeedback | FACT-ish | needs_review | **yes** | medium | Begriffsdefinition |
| A2-C5 | Raum/Zeit/Gegnerdruck erklären Möglichkeiten | A2_D4 | COACHING_CONVENTION | needs_review | **yes** | medium | |
| A2-C6 | Strukturentwicklung über Aktion, ohne Qualität | A2_D5 | RINQ_MODEL | model | no | high | |
| A2-C7 | Puckbesitzwechsel = häufig zentraler Moment für Strukturveränderung (Teaser A3) | A2_D5 handoff | COACHING_CONVENTION | **verified** | **yes** | medium | **MODERATE** · SRC-07, SRC-01, SRC-09 · Micro-Pass §13 · HR REQUIRED |

---

## 3. Drill Alignment (A2)

| Drill | Lernziel | Theorie | Vorwissen | Mechanik | Feedback | Absolut? |
|-------|----------|---------|-----------|----------|----------|----------|
| A2_D1 | Struktur vor Aktion | A2-C1 | A1 ✓ | tactical_observation ✓ | passt | nein |
| A2_D2 | Optionen aus Struktur | A2-C2 | D1 ✓ | tactical_observation ✓ | passt | nein |
| A2_D3 | Genutzte Entscheidung | A2-C3, C4 | D1–2 ✓ | tactical_observation ✓ | passt | nein |
| A2_D4 | Raum & Zeit | A2-C5 | D3 ✓ | tactical_observation ✓ | passt | nein |
| A2_D5 | Strukturentwicklung | A2-C6 | D1–4 ✓ | tactical_observation ✓ | passt | nein |

**Mechanik-Hinweis:** Ein Mechaniker (`tactical_observation`) für alle Drills — beabsichtigte Schichtung über Config/Prompts (NOTE, kein Defekt).

---

## 4. Boundary A2

| Richtung | Inhalt |
|----------|--------|
| **Previous (A1)** | Referenzen in Explanations konsistent; **A1_D5-Handoff aligned** ✓ |
| **Current** | Klare D1–D5-Kette Struktur→…→Entwicklung |
| **Next (A3)** | A2_D5 handoff + reflectionGuidance bereiten Transition vor **ohne A3-Inhalt vorwegzunehmen** ✓ |
| **Lücken** | keine schweren fachlichen Lücken identifiziert |
| **Vorwegnahme** | Transition nur als Teaser — akzeptabel |

---

## 5. Evidence Review (A1 + A2, source_needed=yes)

**Status:** Analyse abgeschlossen (2026-08-23). **Keine Webrecherche, keine erfundenen Quellen, keine Curriculum-Änderungen.**

Vollständige Claim-Tabelle: **§11 Evidence Review Pass**.

| # | Claim (Kurz) | evidence_requirement | preferred_source_type |
|---|--------------|---------------------|------------------------|
| A1-C1 | Center-Einstieg / pendelt | OPTIONAL | Coaching-Literatur |
| A1-C4 | Sichern / Verbinden / Mit nach vorne | RECOMMENDED | Coaching-Literatur |
| A1-C5 | Passoption / Anschluss / Absicherung | RECOMMENDED | Coaching-Literatur |
| A1-C6 | Strukturformen (Dreieck …) | RECOMMENDED | Coaching-Literatur |
| A1-C7 | Support / Absicherung ohne Puck | NOT_NEEDED | — |
| A2-C3 | Pass / Carry / Dump / Reset | RECOMMENDED | Coaching-Literatur |
| A2-C4 | Carry = führt selbst weiter | NOT_NEEDED | — |
| A2-C5 | Raum / Zeit / Gegnerdruck | OPTIONAL | Coaching-Lit. · Sportwissenschaft |
| A2-C7 | Puckbesitzwechsel / wichtigste Strukturveränderung | RECOMMENDED | Coaching-Literatur |

**Offene Recherche:** abgeschlossen — siehe §12 · Quellen: [`a1-a2-sources.md`](../sources/a1-a2-sources.md)

---

## 6. Language / Fake Certainty (A1 + A2)

| Ort | Zitat | Gerechtfertigt? | Empfehlung |
|-----|-------|-----------------|------------|
| A2_D2 hints | „nicht eindeutig“ (Option angedeutet) | ja (INTERPRETATION) | behalten |
| A2_D1–D5 ignore | „richtige/falsche Entscheidung“ | ja (Negation) | behalten |
| A1_D5 | „muss nicht geometrisch perfekt“ | ja | behalten |
| A2-C7 / A3 teaser | ~~„wichtigste Strukturveränderung“~~ | **resolved** (A2_D5 Micro-Pass §13) · A3_D1-Echo → A3-Review |

Keine harten Fake-Certainty-Funde in Bewertungsrichtung — **Observation-before-Evaluation** in A2 gut umgesetzt.

---

## 7. Internal Consistency (cross-track)

| Prüfung | Status | Details |
|---------|--------|---------|
| A1 Drills untereinander | ok | |
| A2 Drills untereinander | ok | |
| A1 → A2 Narrativ | ok | Handoff + Lernziele aligned |
| A2 → A3 Narrativ | ok | D5 handoff aligned mit A3_D1 |
| Begriffe | ok | Outlet in B1; A1 Support/Absicherung |

---

## 8. Combined QA-Findings (priorisiert)

### MAJOR (gesamt)

| ID | Track | Status |
|----|-------|--------|
| A1-MAJ-001 | A1 | **resolved** |
| A1-MAJ-002 | A1 | **resolved** |

### MINOR (gesamt)

| ID | Track | Ort | Problem |
|----|-------|-----|---------|
| A1-MIN-001 | A1 | shift_marker copy | „musst“ |
| A1-MIN-002 | A1 | T0-Bezug | optionaler Foundation-Hinweis fehlt |
| A2-MIN-001 | A2 | A2_D5 handoff | ~~„wichtigste“ Strukturveränderung~~ | **resolved** (Closeout §13) |
| A2-MIN-002 | A2 | Aktionslabels | Dump/Reset ohne Glossar im Track | **resolved** (extern: `docs/content/hockey-glossary.md`) |

### NOTE (gesamt)

| ID | Beobachtung |
|----|-------------|
| A2-NOT-001 | Ignore-Listen blockieren Transition/Tempo konsequent |
| A2-NOT-002 | „Unklar“ / „unter Druck ≠ schlecht“ — gute Language Rule |
| A2-NOT-003 | reflectionGuidance trennt Struktur vs. Bewertung |
| A2-NOT-004 | D1–D5 baut intern logisch auf (explanation chains) |
| A1-NOT-001 ff. | siehe oben |

---

## 9. Track Release Status

| Track | Content | Evidence | Human |
|-------|---------|----------|-------|
| **A1** | APPROVED | **+ EVIDENCE APPROVED** | **offen** (3× HR REQUIRED) |
| **A2** | APPROVED | **+ EVIDENCE APPROVED** | **offen** (2× HR REQUIRED) |
| **Gesamt A1+A2** | **`CONTENT + EVIDENCE APPROVED`** | §13 | Human: `docs/qa/human-review/a1-a2-human-review.md` |

**Nächste Stufe:** `CONTENT + EVIDENCE + HUMAN APPROVED` nach menschlicher Prüfung aller **HUMAN_REVIEW_REQUIRED**-Punkte.

### A1-MAJ-002 — Entscheidungsdokumentation

**Prüfung:** „Outlet“ kommt in A1-Drills (D1–D5) **nicht** als Begriff vor. Vermittelt werden Support, Absicherung, Anschlussoption, Passoption (v. a. D1, D4).

**Entscheidung:** Lernziel präzisiert auf vermittelten Inhalt (Support/Absicherung relational). **Outlet** bleibt bewusst in **B1** (`learningGoals`: „Center als Outlet und Anschlussoption sehen“, Drill „Center als Outlet & Anschlussoption“) — kein neuer A1-Inhalt erfunden.

---

## 10. Governance Feedback

| RULE_CANDIDATE | Begründung | Ziel |
|----------------|------------|------|
| **ja** | `handoffText` muss mit **nächstem Modul** (`description` + Phase Boundary) übereinstimmen — keine Legacy-Phasennamen (Breakout) | `curriculum-boundaries.md` § Handoff-Check |
| **ja** | Jedes `learningGoals`-Item braucht **Nachweis in ≥1 Drill oder Theorieblock** | `content-quality.md` §9 Ergänzung |
| **ja** | RinQ-Taxonomien/Operationslabels kennzeichnen; Evidence ↔ Sprachstärke | `content-quality.md` §2, §8, §11 *(umgesetzt 2026-08-23)* |
| **ja** | Human Review Layer für fachlich kritische Claims | `content-quality.md` §11 · `docs/qa/human-review/` |
| prüfen | Modul-Lernziele vs. Glossar zentral pflegen | `docs/content/hockey-glossary.md` |

---

## Anhang: Modul-Lernziele (Referenz)

**A1:** Center finden · Low/M/H · Funktionen · Beziehungen · Grundrollen ohne Puck · einfache Strukturen  
**A2:** Zusammenspiel lesen · Optionen · Entscheidungen · Raum/Zeit · Strukturentwicklung ohne Qualitätsurteil

**Drill-Count:** A1 ×5 · A2 ×5 · Mechaniken: `role_identification`, `shift_tracker`×2, `player_relation`, `simple_structure` | A2: `tactical_observation`×5

---

## 11. Evidence Review Pass (2026-08-23)

**Scope:** 9 Claims mit ursprünglich `source_needed=yes` · **Keine Inhaltsänderungen**

### 11.1 Claim-Analyse (vollständig)

| ID | Claim (wortnah aus Curriculum) | Ort | claim_type | evidence_requirement | preferred_source_type | confidence | language_risk | reasoning_note |
|----|-------------------------------|-----|------------|---------------------|----------------------|------------|---------------|----------------|
| **A1-C1** | „Der Center ist ein **guter Einstieg** ins Lesen von Hockey, weil er **häufig** zwischen verschiedenen Aufgaben und Räumen **pendelt**.“ | A1_D1 `didactics.explanation`, `config.whyThisRole` | **COACHING_CONVENTION** + **RINQ_MODEL** (didaktischer Einstieg) | **OPTIONAL** | Etablierte Coaching-Literatur (Center-Rolle, Mobilität) | high | **low** | „Häufig“ entschärft bereits. Einstiegswahl ist RinQ-Didaktik, kein Naturgesetz. Keine harte Evidenz nötig; optionale Coach-Lit.-Stütze für Center als multi-task-Rolle. |
| **A1-C4** | „**Sichern:** hinter oder neben der Aktion entsteht Sicherheit · **Verbinden:** Puckführer und nächste Option / nächster Raum werden spielbar verbunden · **Mit nach vorne:** Bewegung öffnet Raum oder eine nächste offensive Option“ | A1_D3 `observation_guide.what_to_watch`; Modul-`learningGoals[2]` | **RINQ_MODEL** (Beobachtungskategorien) + **COACHING_CONVENTION** (Begriffsnähe) | **RECOMMENDED** | Etablierte Coaching-Literatur / Trainer-Glossar (DE) | medium | **low** | Curriculum warnt selbst: „Feste Regeln wie Low = Sichern …“ (ignore). Kategorien sind Leselinsen, keine Regeln. Recherche: Terminologie gegen Coaching-Standard abgleichen, nicht „beweisen“. |
| **A1-C5** | „**Direkte Passoption:** unmittelbar anspielbar … · **Anschlussoption:** nicht unbedingt der erste Pass, aber die nächste spielbare Verbindung · **Absicherung:** hinter oder neben der Aktion entsteht Sicherheit“ | A1_D4 `observation_guide.what_to_watch`, `config.relationOptions` | **COACHING_CONVENTION** + **RINQ_MODEL** (operationale Beobachtungsdefinitionen) | **RECOMMENDED** | Etablierte Coaching-Literatur | medium | **low** | Klare Arbeitsdefinitionen für Beobachtung. Kein Regelwerk-Fakt. Glossar-Abgleich (support / outlet / safety) empfohlen, damit Begriffe nicht wie IIHF-Fakten wirken. |
| **A1-C6** | „**Dreieck:** drei Spieler mit mehreren spielbaren Verbindungen – **keine Geometrieprüfung** · Mehrere Anschlussoptionen … · Absicherungsstruktur …“ | A1_D5 `observation_guide.how_to_decide`, `didactics.explanation` | **RINQ_MODEL** + **COACHING_CONVENTION** (Triangle als Taktikmetapher) | **RECOMMENDED** | Etablierte Coaching-Literatur | medium | **low** | „Keine Geometrieprüfung“ markiert Modellcharakter. Recherche: ob „Triangle“ in Coach-Lit. vergleichbar verwendet wird — Konvention dokumentieren, nicht mathematisieren. |
| **A1-C7** | „Erkenne **Support und Absicherung** als Grundrollen ohne Puck (relationale Anschlussmöglichkeiten)“ | A1 `learningGoals[4]`; operational in A1_D1/D4 | **COACHING_CONVENTION** | **NOT_NEEDED** | — | high | **low** | Begriffe in Drills verankert (Support, Absicherung, Anschluss). Kein Outlet mehr. Standard-Coaching-Sprache; keine externe Belegpflicht, solange als Konvention verstanden. |
| **A2-C3** | „Welche Aktion wurde ausgeführt: **Pass, Carry, Dump, Reset**, unklar?“ · „Spieler erzeugen Optionen. Aus Optionen entstehen Entscheidungen.“ | A2_D3 `observation_guide`; `didactics.explanation` | **COACHING_CONVENTION** + **RINQ_MODEL** (Aktions-Taxonomie) | **RECOMMENDED** | Etablierte Coaching-Literatur | medium | **medium** | Pass/Carry allgemein etabliert. **Dump/Reset** im Track ohne Glossar (vgl. A2-MIN-002) — Recherche für einheitliche Aktionslabels + ggf. späteres RinQ-Glossar, nicht Naturgesetz. |
| **A2-C4** | „**Carry heißt:** der Spieler führt selbst weiter — nicht ‚mutig‘ oder ‚falsch‘.“ | A2_D3 `miniFeedback` hint | **COACHING_CONVENTION** (Lexikdefinition) | **NOT_NEEDED** | — | high | **low** | Explizite Begriffsdefinition, kein taktisches Urteil. Entspricht üblichem Hockey-Englisch „carry the puck“. Kein IIHF-Fakt; keine Forschungsbelegpflicht. |
| **A2-C5** | „Optionen entstehen **nicht zufällig**. **Raum, Zeit und Gegnerdruck** beeinflussen, was möglich ist.“ | A2_D4 `didactics.explanation`; `decisionRule` | **COACHING_CONVENTION** + **INTERPRETATION** (constraints framework) | **OPTIONAL** | Coaching-Literatur · optional Sportwissenschaft (constraints-led) | medium | **medium** | Didaktisch plausibel für Beobachtungsschicht. „Nicht zufällig“ leicht absolut — inhaltlich Konvention, nicht empirischer Einzelfakt. Sportwissenschaft optional, nicht blocking. |
| **A2-C7** | „**Eine der wichtigsten Strukturveränderungen** entsteht durch einen **Wechsel des Puckbesitzes**.“ | A2_D5 `learning_hint`, `handoffText` | **COACHING_CONVENTION** (Transition-Teaser → A3) | **RECOMMENDED** | Etablierte Coaching-Literatur · ggf. Verband (Spielphasen) | medium | **high** | Inhaltlich üblich (Turnover → Phase change), aber „wichtigsten“ klingt wie harter Fakt. **Recherche:** Coaching-Quelle für Besitzwechsel als Phasentrigger; **späterer Sprach-Pass** (nicht in diesem Pass): „häufig“ statt „wichtigsten“. |

### 11.2 Claims, die fälschlich wie harte Fakten wirken

| ID | Warum riskant | Empfehlung (nur für künftigen Content-Pass) |
|----|---------------|---------------------------------------------|
| **A2-C7** | „Eine der **wichtigsten** …“ — Superlativ | Als **COACHING_CONVENTION** dokumentieren; Sprache „häufig zentral“ |
| **A2-C5** | „**nicht zufällig**“ — leicht deterministisch | Als constraints-Konvention belassen; optional abschwächen |
| **A1-C1** | „**guter Einstieg**“ — wirkt wie objektive Wahrheit | Ist **RINQ_MODEL**-Didaktik; in Metadaten/Glossar kennzeichnen |
| **A1-C4/C5/C6** | Operationsdefinitionen können wie Regeln gelesen werden | Bereits durch ignore-Listen und „keine Geometrieprüfung“ abgesichert — **Metadaten** `claim_type` nutzen |

**Nicht als FACT behandeln:** A1-C4, A1-C5, A1-C6, A2-C3, A2-C5, A2-C7 — alles Beobachtungs- oder Coaching-Rahmen, keine IIHF-Regeln.

### 11.3 Priorisierte Rechercheliste

#### Priorität 1 — echte Quellen sinnvoll (RECOMMENDED, zuerst)

| Prio | ID | Recherche-Ziel | Quellenart |
|------|-----|----------------|------------|
| 1 | **A2-C3** | Einheitliche DE/EN-Labels: Pass, Carry, Dump, Reset — Synonyme, Abgrenzung | Coaching-Literatur |
| 2 | **A1-C5** | Passoption / Anschlussoption / Absicherung vs. Support / Outlet (B1-Vorbereitung) | Coaching-Literatur |
| 3 | **A1-C4** | Sichern / Verbinden / offensive Mitnahme — vergleichbare Coach-Terminologie | Coaching-Literatur |
| 4 | **A2-C7** | Puckbesitzwechsel als Phasentrigger — „central“ vs. „one of the most important“ | Coaching-Literatur · optional Verband |
| 5 | **A1-C6** | „Triangle“ / kleine Strukturen in Breakout-/Small-Area-Coaching | Coaching-Literatur |

#### Priorität 2 — Coaching-Literatur ausreichend (OPTIONAL)

| ID | Recherche-Ziel |
|----|----------------|
| **A1-C1** | Center-Mobilität / Multi-Role — stützt didaktische Wahl, nicht Pflicht |
| **A2-C5** | Raum-Zeit-Druck als Entscheidungsrahmen — optional 1 constraints-led Referenz |

#### Priorität 3 — nur Kennzeichnung, keine Quellenjagd (NOT_NEEDED)

| ID | Maßnahme |
|----|----------|
| **A1-C7** | Als COACHING_CONVENTION in Metadaten/Glossar führen |
| **A2-C4** | Carry-Definition als internes Glossar-Eintrag (`claim_type=COACHING_CONVENTION`) |

### 11.4 Nächster Recherche-Pass (Empfehlung)

1. **Ein RinQ-Glossar-Draft** (extern, `docs/qa/` oder später `content-quality` §8) für A1-C4/C5/C6 + A2-C3/C4 — claim_type pro Eintrag.
2. **5 RECOMMENDED-Claims** mit je 1–2 Coaching-Referenzen belegen (DE bevorzugt, sonst EN Standardwerke).
3. **A2-C7** separat: Quelle + Sprach-Entschärfung in separatem Content-Micro-Pass (nicht Evidence allein).
4. Nach Recherche: `evidence_status=verified` setzen → Track-Status **`CONTENT + EVIDENCE APPROVED`**.

---

## 12. External Evidence Research Pass (2026-08-23)

**Scope:** 5× RECOMMENDED (A1-C4, A1-C5, A1-C6, A2-C3, A2-C7) · **Keine Curriculum-Änderungen**  
**Quellenliste:** [`docs/qa/sources/a1-a2-sources.md`](../sources/a1-a2-sources.md)

### 12.1 evidence_strength — Verteilung

| Stärke | Anzahl (5 Claims) |
|--------|-------------------|
| **STRONG** | **0** |
| **MODERATE** | **5** |
| **WEAK** | **0** *(Claim-gesamt; A2-C7-Superlativ intern WEAK)* |
| **NOT_FOUND** | **0** *(Claim-gesamt)* |

### 12.2 Claim-Ergebnisse (Kurz)

| ID | evidence_strength | Hauptquellen | Fit | Sprache? |
|----|-------------------|--------------|-----|----------|
| **A1-C4** | MODERATE | IIHF Level I (Support, Backman); Weiss Attack Triangle | Teilweise — RinQ-Triade ≠ Standardterminologie | Metadaten/Glossar |
| **A1-C5** | MODERATE | SIHF Good Practice F3 (Passoption); IIHF Support; mobilesport Support/Triangle | Teilweise — Anschlussoption RinQ | Glossar empfohlen |
| **A1-C6** | MODERATE | Weiss Attack Triangle; Coaches Site Triangulation; Belfry „handwritten L“ | Gut — Metapher, nicht Universalprinzip | Nein (bereits entschärft) |
| **A2-C3** | MODERATE | Karlsson et al. (Pass/Carry/Dump); BVHS Regroup=Reset; IIHF | Teilweise — Reset/4er-Taxonomie RinQ | Glossar Dump/Reset |
| **A2-C7** | MODERATE *(Superlativ WEAK)* | USA Hockey Transition; IIHF; Rollins/Perron | Teilweise — Transition ja, „wichtigsten“ nein | **Ja — Superlativ** |

### 12.3 RinQ-Begriffe — nicht als Standardterminologie belegt

| Begriff | Etablierte Nähe |
|---------|-----------------|
| Sichern / Verbinden / Mit nach vorne | Support, passing option, back-side support (EN/IIHF) |
| Anschlussoption | — (RinQ-Operationsdefinition) |
| Absicherung (relational) | back-side support, Support (S) |
| Reset (A2) | Regroup, Reverse, Backman pass |
| „wichtigste Strukturveränderung“ | Transition bei Besitzwechsel (ohne Superlativ) |

### 12.4 Freigabe-Empfehlung

| Status | Begründung |
|--------|------------|
| **CONTENT APPROVED** | ✓ unverändert |
| **CONTENT + EVIDENCE APPROVED** | **Ja** (Closeout §13) — offen war: (1) A2-C7 Micro-Pass ✓, (2) Glossar ✓ |

**Erledigt Closeout 2026-08-23** — siehe §13.

---

## 13. Evidence Closeout Pass (2026-08-23)

**Scope:** A2-C7 Micro-Pass · Glossar · Evidence-Metadaten · Governance · Human-Review-Layer  
**Glossar:** [`docs/content/hockey-glossary.md`](../../content/hockey-glossary.md)  
**Human Review:** [`docs/qa/human-review/a1-a2-human-review.md`](../human-review/a1-a2-human-review.md)

### 13.1 A2-C7 — Curriculum-Änderung

| Feld | Wert |
|------|------|
| **Ort** | `A2_D5` · `didactics.learning_hint` · `config.handoffText` |
| **Vorher** | „Eine der **wichtigsten** Strukturveränderungen entsteht durch einen Wechsel des Puckbesitzes.“ |
| **Nachher** | „**Ein häufig zentraler Moment für Strukturveränderungen ist ein Wechsel des Puckbesitzes.**“ |
| **Begründung** | Transition bei Besitzwechsel MODERATE belegt (SRC-07, SRC-01, SRC-09); Superlativ nicht. |

**Hinweis Boundary:** `A3_D1.why_it_matters` enthält noch die alte Formulierung — bewusst **nicht** in diesem Pass geändert (Scope A2-C7 only). → A3-Review / Human Review HR-A2-C7.

### 13.2 Evidence-Metadaten (verified Claims)

| claim_id | claim_type (final) | evidence_status | evidence_strength | source_refs | RinQ-Label? |
|----------|-------------------|-----------------|-------------------|-------------|-------------|
| **A1-C4** | RINQ_MODEL + COACHING_CONVENTION | **verified** | MODERATE | SRC-01, SRC-02 | **Ja** — Triade Sichern/Verbinden/Mit nach vorne |
| **A1-C5** | RINQ_MODEL + COACHING_CONVENTION | **verified** | MODERATE | SRC-03, SRC-01, SRC-02 | **Ja** — Anschlussoption; Absicherung relational |
| **A1-C6** | RINQ_MODEL + COACHING_CONVENTION | **verified** | MODERATE | SRC-02, SRC-05, SRC-06 | **Ja** — Strukturformen; Dreieck = Metapher |
| **A2-C3** | RINQ_TAXONOMY + COACHING_CONVENTION | **verified** | MODERATE | SRC-08, SRC-10, SRC-01 | **Ja** — Vierer-Taxonomie; Reset operational |
| **A2-C7** | COACHING_CONVENTION | **verified** | MODERATE | SRC-07, SRC-01, SRC-09 | Teaser-Framing RinQ→A3 |

### 13.3 Finaler QA-Recheck

| Prüfpunkt | Ergebnis |
|-----------|----------|
| Claim-Klassifikation korrekt? | ✓ RinQ-Labels in Glossar + Metadaten |
| Quellen nicht überinterpretiert? | ✓ MODERATE, kein STRONG-Upgrading |
| RinQ-Begriffe erkennbar? | ✓ `hockey-glossary.md` |
| Keine Fake Certainty (A2-C7)? | ✓ Superlativ entfernt in A2_D5 |
| Theory↔Drill konsistent? | ✓ A2_D5 handoff = learning_hint |
| Keine neue Boundary? | ✓ A1→A2 unverändert; A2→A3 Teaser konsistent in A2 |

### 13.4 Release-Entscheidung

| Track | Status |
|-------|--------|
| **A1** | **`CONTENT + EVIDENCE APPROVED`** |
| **A2** | **`CONTENT + EVIDENCE APPROVED`** |
| **Human** | **offen** — 5× HUMAN_REVIEW_REQUIRED |

### 13.5 Governance

In [`docs/ai-rules/content-quality.md`](../../ai-rules/content-quality.md) ergänzt:

1. RinQ-Taxonomien/Operationslabels kennzeichnen (§8)
2. Evidence muss Sprachstärke abdecken — keine Superlative aus Grundkonzept-Quellen (§2)
3. Human Review Layer (§11) — AI ≠ Human Approval

---

*Ende Review — Fix 2026-08-23 · Evidence Analyse/Research 2026-08-23 · Closeout 2026-08-23.*
