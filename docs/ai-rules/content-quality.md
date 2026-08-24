# RinQ Tank — Content Quality & Didactic QA

**Status:** verbindliche Content-Rule (lebendes Dokument)  
**Gilt für:** Curriculum, Theorie, Drill-Texte, Beobachtungsmasken, Reflexionsfragen, KI-Feedback, Coaching-Hinweise, Lernziele, Assessments, Premium-Lerninhalte

Dieses Dokument ist die fachliche und didaktische Haltung für Lerninhalte. Vor Implementierung oder Änderung in den genannten Bereichen **zuerst dieses Dokument lesen** und die geplante Änderung dagegen prüfen.

**Nicht Ziel:** Jede Aussage mit wissenschaftlicher Fußnote belegen.  
**Ziel:** Klare Trennung zwischen Fakt, Konvention, RinQ-Modell und Grauzone — plus intakte Curriculum-Kette und konsistente Theory↔Drill-Paare.

Verwandte Rules (bewusst getrennt):

| Bereich | Dokument |
|--------|----------|
| Track-Rework, Capabilities, Phasen | `docs/ai-rules/curriculum-rework.md` |
| Previous / Current / Next Boundary | `docs/ai-rules/curriculum-boundaries.md` |
| **Content QA Reviews (Track-Audits)** | `docs/qa/content-review-template.md` · `docs/qa/reviews/` |
| **Human Review (fachliche Freigabe)** | `docs/qa/human-review/` |
| **Hockey-Glossar (RinQ vs. Standard)** | `docs/content/hockey-glossary.md` |
| Mechanik-Renderer, Drill-UI | `docs/ai-rules/mechanic-design.md` |
| Auth, Payments, Userdaten | `docs/ai-rules/security-and-privacy.md` |

---

## Leitprinzip

RinQ Tank lehrt **Hockey sehen und verstehen** — nicht „plausible Antworten raten“.

Inhalte müssen:

- fachlich vertretbar sein,
- didaktisch an der richtigen Stelle im Track stehen,
- zwischen Theorie und Drill dasselbe trainieren,
- dort, wo Kontext entscheidet, keine künstliche Eindeutigkeit erzeugen.

Bei Konflikt: **nicht still ändern** — Konflikt benennen, Kategorie klären, Lösung vorschlagen.

---

## 1. Claim Classification

Jede fachliche Aussage ist gedanklich **einer Kategorie** zuzuordnen:

| Kategorie | Bedeutung | Kurz |
|-----------|-----------|------|
| **FACT** | Objektiv bzw. belastbar belegbare Aussage | Regeln, Definitionen, nachprüfbare Sachverhalte |
| **COACHING_CONVENTION** | Verbreitete Hockey-/Coachingpraxis, kein Naturgesetz | Typische Systeme, übliche Rollenlogik, gängige Lehrformeln |
| **RINQ_MODEL** | Bewusstes Analyse-, Bewertungs- oder Didaktikmodell von RinQ | Beobachtungsschichten, Track-Logik, vereinfachte Muster |
| **INTERPRETATION** | Situationsabhängige Einschätzung / fachliche Grauzone | Mehrere plausible Lesarten, kontextabhängige Bewertung |

**Umgang:**

- **FACT** → muss fachlich belastbar sein; wichtige Aussagen brauchen Quelle (siehe §2).
- **COACHING_CONVENTION** → als typische/übliche Praxis formulieren, nicht als universelles Gesetz.
- **RINQ_MODEL** → ausdrücklich als unser Lern-/Analysemodell behandeln (nicht als offizielle Eishockey-Wahrheit).
- **INTERPRETATION** → keine absolute Sprache, wenn mehrere sinnvolle Lösungen existieren.

---

## 2. Evidence Rule

Nicht jeder Satz braucht eine Quelle.

**Quellen sind insbesondere erforderlich oder zu prüfen bei:**

- zentralen taktischen Lehrsätzen,
- Regel-, Positions- und Systemaussagen,
- physiologischen, technischen oder trainingswissenschaftlichen Behauptungen,
- Zahlen, Wahrscheinlichkeiten und Wirkungsbehauptungen,
- Aussagen, die als objektiv oder universell formuliert werden.

**Bevorzugte Quellenhierarchie:**

1. Offizielle Regelwerke / Verbände (IIHF, nationaler Verband, Liga-Regelwerk)
2. Etablierte Coaching-/Trainingsliteratur
3. Fachliteratur / Forschung (Sportwissenschaft, Motorik, Kognition)
4. Seriöse professionelle Coachingquellen (klar benannt, nachvollziehbar)

**Nicht:** schwache Webquelle, wenn Primärquelle verfügbar ist.  
**Nicht:** Quelle erfinden oder vage „Experten sagen“ ohne Bezug.

**Evidence muss zur Sprache passen:** Eine Quelle für ein Grundkonzept (z. B. Transition bei Besitzwechsel) legitimiert **keine** unbelegten Superlative (*wichtigste*, *immer*, *muss*) oder Universalitätsaussagen. Formulierung entschärfen oder Claim-Kategorie anpassen — nicht Quelle überinterpretieren.

**MODERATE Evidence** reicht für `COACHING_CONVENTION` und `RINQ_MODEL`, wenn:

- keine stärkere Tatsachenbehauptung gemacht wird,
- Terminologie sauber gekennzeichnet ist (Glossar / Metadaten),
- keine unbelegte Universalität suggeriert wird.

Nicht künstlich auf STRONG hochstufen.

---

## 3. Language Rule

Formulierung muss zur Claim-Kategorie passen.

### FACT

Darf klar formuliert werden — **wenn** belastbar.

### COACHING_CONVENTION

Bevorzugte Formulierungen:

- häufig
- typischerweise
- oft
- in vielen Systemen
- je nach System / je nach Coach

### RINQ_MODEL

Klar als Lern-/Analysemodell von RinQ kennzeichnen, z. B.:

- „In RinQ lesen wir …“
- „Dieser Track trainiert …“
- „Unser Beobachtungsmodell …“

### INTERPRETATION

Keine unnötigen Absolutheiten.

**Vermeiden bei taktisch kontextabhängigen Aussagen:**

- immer
- niemals
- muss (zwingend)
- eindeutig falsch
- die einzig richtige Lösung

**Erlaubt stattdessen:**

- kann
- oft sinnvoll
- in dieser Situation eher …
- eine plausible Lesart ist …

---

## 4. Curriculum Boundary Rule

Bei **jeder** inhaltlichen Änderung prüfen (Details: `docs/ai-rules/curriculum-boundaries.md`):

```text
Previous Track → Current Track → Next Track
```

| Frage | Prüfung |
|-------|---------|
| **Previous Track** | Ist die aktuelle Voraussetzung noch vorhanden? |
| **Current Track** | Welches konkrete Lernziel wird trainiert? |
| **Next Track** | Wird Inhalt vorweggenommen oder entsteht eine Lücke? |

**Regel:** Vereinfachung oder Entfernung darf **nicht isoliert** erfolgen.  
Wird notwendiges Wissen entfernt → dokumentieren, **wo** es stattdessen vermittelt wird (Track, Drill, Theorie).

Track-Rework mit Capabilities, Phasen und Complexity Budget: `docs/ai-rules/curriculum-rework.md`.

---

## 5. Theory ↔ Drill Consistency

RinQ hat **zwei Theorie-Layer**. Beide gehören in jedes Track-QA — nicht nur Drills.

| Layer | Quelle | UI |
|-------|--------|-----|
| **Drill-Didaktik** | `data/academy/curriculum.json` → `drills[].didactics` (+ Modul-`description` / `learningGoals`) | Session / Drill |
| **Theorie-Seite** | `frontend/src/data/theoryData.json` → Key = Modul-ID (`A1`, `A2`, …) | Curriculum → „Theorie lesen“ → `/theory/:moduleId` |

Bei **jedem** Track-Review und bei Änderungen an Curriculum **oder** `theoryData` prüfen:

### 5.1 Drill-Didaktik ↔ Drill

- Stimmt die Theorie mit der Beobachtungsaufgabe überein?
- Trainiert die Mechanik tatsächlich das Lernziel?
- Verlangt der Drill Wissen, das noch nicht vermittelt wurde?
- Widerspricht Feedback- oder Erklärungstext früheren Aussagen im Track?
- Ist der Beobachtungsumfang für das Niveau passend (nicht zu viele gleichzeitige Layer)?

**Fail:** Theorie erklärt X, Drill beobachtet Y, Reflexion bewertet Z.

### 5.2 Theorie-Seite ↔ Track (verbindlich)

| Prüfung | Frage |
|---------|--------|
| **Titel/Overview** | Passt `theoryData[moduleId].title` / `subtitle` / `overview` zu Modul-Titel und `learningGoals`? |
| **Scope** | Behandelt die Theorie dasselbe Lernziel wie der Track — nicht den Legacy-Phasennamen? |
| **Boundary** | Keine Vorwegnahme späterer Tracks (z. B. Transition in A1, Breakout-Analyse in A2)? |
| **Coverage** | Deckt die Theorie die tatsächlichen Drill-Themen ab (nicht nur ein altes Framing)? |
| **Language** | Observation-before-Evaluation und Claim-Kategorie wie im Curriculum? |
| **Drift nach Rework** | Nach Track-Umbau: wurde `theoryData` mitgezogen? |

**Fail:** Curriculum-Track und „Theorie lesen“ erzählen unterschiedliche Module (Titel, Phase, Lernziel).  
**Fail:** Theorie-Seite nimmt Folgetrack-Inhalt vorweg oder bewertet, wo der Track nur beobachten lässt.

**Release:** `CONTENT + EVIDENCE APPROVED` für Drills allein reicht **nicht** für Produkt-Freeze, wenn `theoryData` für denselben Modul-Key klar driftet. Dann Status explizit: **Theory CHANGES REQUIRED** (siehe Review-Template § Theory Alignment).

---

## 6. Observation Before Evaluation

Insbesondere in **frühen Tracks** (Foundation, A1, A2):

```text
Sehen → Benennen → Muster → (später) Bewerten
```

- Beobachtung, Beschreibung und Mustererkennung **vor** Coaching-Bewertung.
- Ein Ergebnis allein (Tor, Chance, Turnover) beweist nicht, dass eine Entscheidung gut oder schlecht war.
- Qualitätsurteile und „besser/schlechter“-Fragen gehören in passende spätere Tracks — nicht vorweggenommen.

Siehe auch: Observation-first in `docs/ai-rules/curriculum-rework.md` §8.

---

## 7. No Fake Certainty

Wenn Fachleute unterschiedliche Ansätze vertreten oder Kontext entscheidend ist:

- Grauzone kennzeichnen (INTERPRETATION),
- mehrere plausible Interpretationen zulassen,
- keine künstliche Eindeutigkeit für didaktische Bequemlichkeit erzeugen.

**Fail:** Multiple-Choice mit einer „offiziellen“ Antwort, obwohl Coaches die Situation unterschiedlich lesen.

---

## 8. Source Metadata (Zielmodell)

Für wichtige Claims soll Curriculum bzw. QA-Struktur perspektivisch Metadaten ermöglichen:

| Feld | Zweck |
|------|--------|
| `claim_type` | FACT \| COACHING_CONVENTION \| RINQ_MODEL \| INTERPRETATION |
| `evidence_status` | verified \| needs_review \| convention_only \| model |
| `source_refs` | Kurzliste / Links / Literatur |
| `confidence` | high \| medium \| low |
| `qa_status` | draft \| reviewed \| approved |
| `notes` | Kontext, Grauzone, bewusste Vereinfachung |

**RinQ-Taxonomien und Operationslabels** (z. B. `Pass/Carry/Dump/Reset`, `Anschlussoption`, `Sichern/Verbinden/Mit nach vorne`) müssen als solche gekennzeichnet werden — in Glossar (`docs/content/hockey-glossary.md`) und QA-Metadaten. Sie dürfen **nicht** wie etablierte Standardterminologie (IIHF/DEB) erscheinen, wenn sie es nicht sind.

**Noch nicht zwingend** jedes Feld sofort ins Produkt-JSON.  
Zunächst als Zielmodell dokumentieren; bei größeren Reworks und QA-Audits schrittweise nutzen.

---

## 9. Mandatory Content QA Check

Vor Änderungen an:

- Curriculum (`data/academy/curriculum.json`, Foundation-Tracks)
- **Theorie-Seiten** (`frontend/src/data/theoryData.json`)
- Drill-Texten, Prompts, Beobachtungsmasken
- Reflexionsfragen
- KI-Feedback / Reflection-Prompts
- Coaching-Hinweisen
- Lernzielen und Assessments

**Checkliste:**

| # | Frage |
|---|--------|
| A | Fachlich korrekt (für die gewählte Kategorie)? |
| B | Fakt / Konvention / Modell / Grauzone klar zugeordnet? |
| C | Quelle erforderlich — und vorhanden oder markiert? |
| D | Drill-Didaktik ↔ Drill **und** `theoryData` ↔ Track konsistent? |
| E | Previous / Current / Next Boundary intakt (beide Layer)? |
| F | Keine unnötige Absolutheit? |
| G | Bestehende Rules eingehalten (Mechanic, UI, Security falls API)? |

**Bei Konflikt:** nicht still mergen — Konflikt melden, Kategorie und Fix vorschlagen.

---

## 10. Living Document

- Neue fachliche oder didaktische Grundentscheidungen → dieses Dokument aktualisieren.
- Wiederkehrende Fehlertypen aus QA-Reviews → prüfen, ob daraus eine permanente Rule wird.
- Track-Rework-Abschlussberichte sollen Content-QA explizit bestätigen (nicht nur Boundary-Check).

---

## 11. Human Review Layer

**AI evidence review is not equivalent to human approval.**

Fachlich relevante oder unsichere Claims dürfen für Premium-/Kern-Lerninhalte **nicht ausschließlich** durch AI/automatisierte QA freigegeben werden. Für ausgewählte Punkte ist eine **dokumentierte menschliche Prüfung** erforderlich.

| Review-Priorität | Wann |
|------------------|------|
| **HUMAN_REVIEW_REQUIRED** | Claim zentral für Lernmodell · Terminologie nicht eindeutig Standard · Evidence MODERATE oder schwächer · mehrere Coach-Schulen denkbar · Auswirkung auf Nutzer-Feedback/Bewertung · Reputationsrisiko bei Fehler |
| **HUMAN_REVIEW_OPTIONAL** | Didaktisch sinnvoll, nicht fachlich kritisch · nur Formulierung/Begriffsschärfe |
| **Kein Human Review** | Triviale UI-/Navigationstexte |

**Workflow:** `docs/qa/human-review/` — pro Claim: `human_status`, `human_notes`, `human_source_refs`.

**Erlaubte `human_status`-Werte (nur Mensch setzt):** `NOT_REVIEWED` · `IN_REVIEW` · `CONFIRMED` · `CONFIRMED_AS_RINQ_MODEL` · `NEEDS_CHANGE` · `REJECTED`

**AI darf `human_status` niemals** auf `CONFIRMED`, `CONFIRMED_AS_RINQ_MODEL` oder `REJECTED` setzen.

**Track-Release:**

| Status | Bedingung |
|--------|-----------|
| `CONTENT + EVIDENCE APPROVED` | AI Evidence-Pass + Glossar/Metadaten; Sprache zur Evidence passend |
| `CONTENT + EVIDENCE + HUMAN APPROVED` | Zusätzlich alle **HUMAN_REVIEW_REQUIRED**-Punkte menschlich abgeschlossen |

---

## Schnellreferenz für Agents

```text
Drill / Track / Theorie ändern
  → content-quality.md (dieses Dokument)
  → curriculum-boundaries.md + curriculum-rework.md
  → mechanic-design.md (wenn Renderer/Mechanik)

Login / Payment / Userdaten
  → security-and-privacy.md

UI-Komponenten
  → .cursor/rules/ui-catalog.mdc
```
