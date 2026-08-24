# Human Review — D2

**Status:** Human-Entscheidungen dokumentiert · Umsetzung 2026-08-24 · finale Freigabe offen  
**Datum:** 2026-08-24  
**AI-Evidence:** [`d2-content-review.md`](../reviews/d2-content-review.md) · [`d2-sources.md`](../sources/d2-sources.md)  
**Glossar:** [`docs/content/hockey-glossary.md`](../../content/hockey-glossary.md) § D2

**Regel:** AI setzt **niemals** `human_status` auf CONFIRMED / CONFIRMED_AS_RINQ_MODEL / REJECTED.

**Track-Status:** `CONTENT + EVIDENCE APPROVED` · Curriculum/Theorie/Glossar nach HR geschärft · Human-Abnahme offen

**Priorität:** alle Kerntaxonomien REQUIRED.

**Umsetzungsnotiz (technisch):** D2_D1–D5, `theoryData` D2, Hover-Glossar und `d2Polish.test.ts` angepasst. `immediateEffect` (D2_D3) und `riskProfile` (D2_D5) migrationssicher (`required: false`, `hidden`/`legacy`). Progressive Felder für D1–D4. Slot/Point als etablierte Begriffe beibehalten (nicht künstlich „Zentraler Abschlussraum“ / „Hoher Raum“). `human_status` bleibt bis zur menschlichen Abnahme `NEEDS_CHANGE`.

---

## HUMAN_REVIEW_REQUIRED

### HR-D2-C1 — Raumpriorität

| Feld | Wert |
|------|------|
| **claim_id** | D2-C1 |
| **Ort** | D2_D1 |
| **Claim** | PK schützt zuerst bestimmte Räume und lässt andere eher zu |
| **Warum HR** | Einstieg PK; Prioritäts-Set prägt Lesart |
| **Was prüfen** | Zonen-Set + Signals ausreichend? |
| **AI-Evidence** | MODERATE — slot/net-front first |
| **Offene Frage** | Systemnamen später optional oder nie in D2? |
| **human_status** | `NEEDS_CHANGE` |
| **human_notes** | Entscheidung: Räumliche Priorität bleibt als RinQ-Beobachtungsmodell (IDs stabil). Zonen DE-first: Schussbahn vom Point, Zentrale Kurzoption, Slot, Direkt vor dem Tor, Passlinien durch die Unterzahlstruktur, tiefe Optionen an/hinter Torlinie, Puckseite / puckferne Seite, Mehrere / Nicht sicher. Bewusste Freigabe → weniger stark kontrolliert / mit größerem Abstand. Keine sichere taktische Absicht. Systemnamen (Box/Diamond/…) außerhalb Pflichtklassifikation; optionaler Glossarhinweis zur Raumwirkung. Theorie, Drill, Feedback und Glossar angeglichen. Nach geprüfter Umsetzung → `CONFIRMED_AS_RINQ_MODEL`. |
| **human_source_refs** | DEB-RAHMENRICHTLINIEN-TRAINERAUSBILDUNG-2020 — individuelles/kollektives Abwehrverhalten, gruppentaktische Abwehraufgaben: https://www.deb-online.de/download/402/trainer/32893/rahmenrichtlinien-fuer-die-traineraus-fort-und-weiterbildung-fortschreibung-2020.pdf · IIHF-2V2-SHOOTING-BOARD — zwischen Gegner und Tor, Passwege, Schlägerdruck: https://www.iihf.com/en/coaching/18952/2vs2-shooting-board · IIHF-DEFEND-THE-GATE — Anwinkeln, Gegner außen: https://www.iihf.com/en/coaching/18781/defend-the-gate · RINQ-PK-SPACE-PRIORITY-MODEL · RINQ-TERMINOLOGY-DECISION-DEUTSCH-FIRST · RINQ-CURRICULUM-BOUNDARY-D1-D2-D3 — offizielle Quellen stützen Raumpriorität/Passwegkontrolle; konkrete D2-Taxonomie ist RinQ-Modell |

---

### HR-D2-C2 — Staffelung

| Feld | Wert |
|------|------|
| **claim_id** | D2-C2 |
| **Ort** | D2_D2 |
| **Claim** | Tiefe × Kompaktheit × Puckshift × High↔Low |
| **Warum HR** | Vier Dimensionen; „sehr kompakt/weit“ leicht wertend |
| **Was prüfen** | Zu granular für Live-Beobachtung? |
| **AI-Evidence** | MODERATE partial |
| **Offene Frage** | Dimensionen reduzieren? |
| **human_status** | `NEEDS_CHANGE` |
| **human_notes** | Entscheidung: Vier Dimensionen bleiben fachlich erhalten; progressive Anzeige reduziert Live-Last. Wertende Kompaktheit → geometrische Abstände (sehr kurz … sehr groß). High/Low → hohe/tiefe Ebene; „Sehr gut verbunden“ → „Direkt verbunden“. Bubble-Rekonstruktion (P1–P4) bleibt; relative Abstände > exakte Koordinaten. Jede Dimension: Nicht sicher beurteilbar. Notiz ohne „Lücke als Defizit“. Nach Abnahme → `CONFIRMED_AS_RINQ_MODEL`. |
| **human_source_refs** | DEB-RAHMENRICHTLINIEN-TRAINERAUSBILDUNG-2020: https://www.deb-online.de/download/402/trainer/32893/rahmenrichtlinien-fuer-die-traineraus-fort-und-weiterbildung-fortschreibung-2020.pdf · IIHF-1V1-PLUS-OUTLETS — defensive Position, nicht nur Puck folgen: https://www.iihf.com/en/coaching/18787/1vs1-plus-outlets · RINQ-PK-STRUCTURE-MODEL · RINQ-METHODOLOGY-DECISION |

---

### HR-D2-C3 — Zugriffssignal

| Feld | Wert |
|------|------|
| **claim_id** | D2-C3 |
| **Ort** | D2_D3 |
| **Claim** | Trigger × Ausführung × Strukturwirkung × unmittelbarer Effekt |
| **Warum HR** | Dichtestes Raster; immediateEffect kann Outcome-Bias erzeugen |
| **Was prüfen** | Vier Felder behalten? Hint „gutes PK“? |
| **AI-Evidence** | MODERATE |
| **Offene Frage** | immediateEffect als optionale Notiz statt Pflicht? |
| **human_status** | `NEEDS_CHANGE` |
| **human_notes** | Entscheidung: D2_D3 auf Ort + Zugriffssignal + Zugriffsform + Strukturveränderung reduziert. `immediateEffect` als redundantes Outcome-Feld entfernt (nicht anzeigen, nicht verpflichtend; Altdaten lesbar; keine Auto-Migration nach D2_D4). Trigger sichtbar → Zugriffssignal. EN-Zugriffsbegriffe eingedeutscht/neutralisiert. „gutes PK“ entfernt. Keine sichere Ursache oder Qualitätsnote. Aktiver Fokus: Zugriffssignal → Zugriff → Strukturveränderung. Nach Abnahme → `CONFIRMED_AS_RINQ_MODEL`. |
| **human_source_refs** | IIHF-2V2-WITH-OUTLETS — Druck, Schlägerdruck, Pass unterbrechen: https://www.iihf.com/en/coaching/19085/2vs2-with-outlets · IIHF-2V2-SHOOTING-BOARD: https://www.iihf.com/en/coaching/18952/2vs2-shooting-board · RINQ-PK-PRESSURE-SIGNAL-MODEL · RINQ-TERMINOLOGY-DECISION-DEUTSCH-FIRST · RINQ-METHODOLOGY-DECISION |

---

### HR-D2-C4 — Sequenzlösung

| Feld | Wert |
|------|------|
| **claim_id** | D2-C4 |
| **Ort** | D2_D4 |
| **Claim** | Clear / 2nd puck / Freeze etc. mit Kontrollgrad — ohne gut/schlecht |
| **Warum HR** | „riskanter Clear“, „gutes Drucktiming“ in Enabling-Labels |
| **Was prüfen** | Labels neutraler? Boundary zu D3 Clears? |
| **AI-Evidence** | MODERATE |
| **Offene Frage** | Enabling „good_pressure_timing“ umbenennen? |
| **human_status** | `NEEDS_CHANGE` |
| **human_notes** | Entscheidung: Sequenzlösung bleibt getrennt vom ersten Zugriff. Clear → Befreiung; Riskanter Clear → Befreiung unter starkem Druck. Ermöglicht durch → Sichtbarer Begleitfaktor (keine alleinige Ursache). Gutes Drucktiming → Zugriff beginnt gleichzeitig mit dem sichtbaren Signal. Kontrollgrad beobachtbar (nächste Aktion / Gefahr unterbrochen / PP behält Druck). Zweiter Puck bleibt (Glossar). Grenze zu D3 ausdrücklich in Didaktik/Theorie/Glossar: Befreiung als Sequenzende ja; Befreiungsentscheidung an der blauen Linie → D3. Nach Abnahme → `CONFIRMED_AS_RINQ_MODEL`. |
| **human_source_refs** | IIHF-2V2-SHOOTING-BOARD — nächsten freien Puck kontrollieren: https://www.iihf.com/en/coaching/18952/2vs2-shooting-board · IIHF-2V2-WITH-OUTLETS: https://www.iihf.com/en/coaching/19085/2vs2-with-outlets · RINQ-PK-SEQUENCE-RESOLUTION-MODEL · RINQ-CURRICULUM-BOUNDARY-D1-D2-D3 |

---

### HR-D2-C5 — Unterzahlbeobachtung

| Feld | Wert |
|------|------|
| **claim_id** | D2-C5 |
| **Ort** | D2_D5 |
| **Claim** | Mehrdimensionales Profil ohne Systemlabel / ohne Quote |
| **Warum HR** | „Profil“ + riskProfile-Werte |
| **Was prüfen** | Copy vs. Disclaimer; Goal „Formationen“ |
| **AI-Evidence** | Didaktik MODERATE |
| **Offene Frage** | Goal-Wording „Formationen“ → „Organisation“? |
| **human_status** | `NEEDS_CHANGE` |
| **human_notes** | Entscheidung: Mehrdimensionale Zusammenfassung bleibt. Penalty-Kill-/PK-Profil → Heutige Unterzahlbeobachtung / Beobachtete Unterzahlprinzipien. `riskProfile` als interpretative Pflichtdimension entfernt (hidden/legacy; Altdaten lesbar; nicht neu berechnen). Formationen → Raum- und Organisationsprinzipien. Keine Team-/Coach-/Formations-/Systemidentität. Stichprobe/Abschnitt im Disclaimer. Terminologie mit D2_D1–D4 abgeglichen. Nach Abnahme → `CONFIRMED_AS_RINQ_MODEL`. |
| **human_source_refs** | DEB-RAHMENRICHTLINIEN-TRAINERAUSBILDUNG-2020: https://www.deb-online.de/download/402/trainer/32893/rahmenrichtlinien-fuer-die-traineraus-fort-und-weiterbildung-fortschreibung-2020.pdf · RINQ-PK-OBSERVATION-MODEL · RINQ-METHODOLOGY-DECISION · RINQ-TERMINOLOGY-DECISION-DEUTSCH-FIRST |

---

## HUMAN_REVIEW_OPTIONAL

### HR-D2-MIN-001 — „gutes PK“ Hint

| Feld | Wert |
|------|------|
| **claim_id** | D2-MIN-001 |
| **Ort** | D2_D3 Didaktik |
| **Claim** | „Ein gutes PK …“ |
| **human_status** | `NEEDS_CHANGE` |
| **human_notes** | Ersetzt durch neutrale Beschreibung: Unterzahl kann Grundordnung halten oder nach sichtbarem Signal zugreifen; beobachtet werden Signal, Zugriff und Strukturveränderung — keine allgemeine Qualitätsnote. Nach menschlicher Prüfung → `CONFIRMED`. |
| **human_source_refs** | RINQ-METHODOLOGY-DECISION · RINQ-TERMINOLOGY-DECISION-DEUTSCH-FIRST |

---

### HR-D2-MIN-002 — „gute Sequenz muss“

| Feld | Wert |
|------|------|
| **claim_id** | D2-MIN-002 |
| **Ort** | D2_D4 |
| **Claim** | „Eine gute PK-Sequenz muss …“ |
| **human_status** | `NEEDS_CHANGE` |
| **human_notes** | Ersetzt durch: „Nach einem Zugriff bleibt zu beobachten, ob die unmittelbare Gefahr endet, nur kurz unterbrochen wird oder bestehen bleibt.“ Nach menschlicher Prüfung → `CONFIRMED`. |
| **human_source_refs** | RINQ-PK-SEQUENCE-RESOLUTION-MODEL · RINQ-METHODOLOGY-DECISION |

---

### HR-D2-MIN-003 — Goal „Formationen“

| Feld | Wert |
|------|------|
| **claim_id** | D2-MIN-003 |
| **Ort** | Track learningGoals |
| **Claim** | „Erkenne grundlegende PK-Formationen“ |
| **human_status** | `NEEDS_CHANGE` |
| **human_notes** | Ersetzt durch: „Erkenne grundlegende Raum- und Organisationsprinzipien im Unterzahlspiel“. Systemnamen bleiben optionaler Transfer, keine Pflichtklassifikation. Nach menschlicher Prüfung → `CONFIRMED`. |
| **human_source_refs** | RINQ-PK-OBSERVATION-MODEL · RINQ-TERMINOLOGY-DECISION-DEUTSCH-FIRST |

---

## Quellenhinweis

Die offiziellen Quellen (DEB, IIHF) stützen Raumpriorität, Torraumverteidigung, Passwegkontrolle, Schlägerdruck, Lenken und Puckrückgewinn. Die konkrete D2-Taxonomie ist ein RinQ-Modell und kein offizieller DEB- oder IIHF-Standard.

---

## Zusammenfassung

| Priorität | Anzahl |
|-----------|--------|
| **REQUIRED** | **5** (C1–C5) · alle `NEEDS_CHANGE` nach Umsetzung |
| **OPTIONAL** | **3** (MIN-001–003) · alle `NEEDS_CHANGE` |
