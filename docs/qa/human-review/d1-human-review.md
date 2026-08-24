# Human Review — D1

**Status:** Human-Entscheidungen dokumentiert · Umsetzung 2026-08-24 · finale Freigabe offen  
**Datum:** 2026-08-24  
**AI-Evidence:** [`d1-content-review.md`](../reviews/d1-content-review.md) · [`d1-sources.md`](../sources/d1-sources.md)  
**Glossar:** [`docs/content/hockey-glossary.md`](../../content/hockey-glossary.md) § D1

**Regel:** AI setzt **niemals** `human_status` auf CONFIRMED / CONFIRMED_AS_RINQ_MODEL / REJECTED.

**Track-Status:** `CONTENT + EVIDENCE APPROVED` · Curriculum/Theorie/Glossar nach HR geschärft · Human-Abnahme offen

**Priorität:** alle Kerntaxonomien REQUIRED.

**Umsetzungsnotiz (technisch):** D1_D1–D5, `theoryData` D1, Hover-Glossar und `d1Polish.test.ts` angepasst. `timingReason` und `decisionProfile` migrationssicher (`required: false`, `hidden`/`legacy`). `immediateOutcome` bleibt. Sichtbar **Point** statt „Hoher Raum“ (Konsistenz mit C3-Korrektur). `human_status` bleibt bis zur menschlichen Abnahme `NEEDS_CHANGE`.

---

## HUMAN_REVIEW_REQUIRED

### HR-D1-C1 — Lokaler Überzahlvorteil

| Feld | Wert |
|------|------|
| **claim_id** | D1-C1 |
| **Ort** | D1_D1 |
| **Claim** | Vorteil entsteht in bestimmten Räumen mit erkennbaren Signalen |
| **Warum HR** | Einstieg Special Teams; Signal-Liste prägt Lesart |
| **Was prüfen** | Raum-Set + Signals ausreichend? „Was muss die Unterzahl tun?“-Frage zu deterministisch? |
| **AI-Evidence** | MODERATE — 2-on-1 / seams |
| **Offene Frage** | Systemnamen später optional oder nie in D1? |
| **human_status** | `NEEDS_CHANGE` |
| **human_notes** | Entscheidung: Lokaler räumlicher Überzahlvorteil bleibt als RinQ-Modell. Räume DE-first mit etablierten Fachbegriffen **Point** / **Zentrale Kurzoption** / Seitenraum / Direkt vor dem Tor / Tiefe Option / Puckferne Seite. Frage **Welche sichtbare Anpassung der Unterzahl folgt?** statt „Was muss die Unterzahl tun?“. Keine Pflicht/Absicht/sichere Kausalität. Systemnamen außerhalb Pflichtklassifikation. Theorie, Drill, Glossar angeglichen. Nach Abnahme → `CONFIRMED_AS_RINQ_MODEL`. |
| **human_source_refs** | DEB-RAHMENRICHTLINIEN-TRAINERAUSBILDUNG-2020 — Raum-/Pass-/Abschlussaufgaben: https://www.deb-online.de/download/402/trainer/32893/rahmenrichtlinien-fuer-die-traineraus-fort-und-weiterbildung-fortschreibung-2020.pdf · IIHF-2V2-TO-3V2 — freier zentraler Raum: https://www.iihf.com/en/coaching/18940/2vs2-to-3vs2 · IIHF-2V2-SHOOTING-BOARD — Passwege/Torraum: https://www.iihf.com/en/coaching/18952/2vs2-shooting-board · RINQ-LOCAL-POWERPLAY-ADVANTAGE-MODEL · RINQ-TERMINOLOGY-DECISION-DEUTSCH-FIRST · RINQ-CURRICULUM-BOUNDARY-C3-D1-D2 — Quellen stützen Raum/Passoptionen; konkrete D1-Taxonomie ist RinQ-Modell |

---

### HR-D1-C2 — Powerplay-Funktionen

| Feld | Wert |
|------|------|
| **claim_id** | D1-C2 |
| **Ort** | D1_D2 |
| **Claim** | High / Halfwall / Bumper / Net Front / Goal Line / Weak Side |
| **Warum HR** | Kernvokabular D1; EN-Labels |
| **Was prüfen** | Funktionsliste vs. echte Setups (Umbrella etc.) klar getrennt? |
| **AI-Evidence** | MODERATE |
| **Offene Frage** | DE-Übersetzungen in UI? |
| **human_status** | `NEEDS_CHANGE` |
| **human_notes** | Entscheidung: Funktionen klar von festen Setups getrennt. UI: **Hohe Verbindung / Seitenraum / Zentrale Kurzoption / Präsenz direkt vor dem Tor / Tiefe Option / Puckferne Option**. EN nur Glossarsynonyme. Spieler können Funktionen wechseln; kein Pflicht-Setup. Angriffsebenen: Tiefe/Zentrale/Hohe Ebene. „Größtes PK-Problem“ → **deutlichste Anpassung der Unterzahl**. Bubble-Rekonstruktion bleibt (P1–P5 Marker). Progressive Felder. Nach Abnahme → `CONFIRMED_AS_RINQ_MODEL`. |
| **human_source_refs** | IIHF-1V1-PLUS-OUTLETS — Passoptionen/Support: https://www.iihf.com/en/coaching/18787/1vs1-plus-outlets · IIHF-1V1-COACH-ACTIVATOR — Bewegung vor dem Tor: https://www.iihf.com/en/coaching/18778/1vs1-with-coach-activator · DEB-RAHMENRICHTLINIEN-TRAINERAUSBILDUNG-2020: https://www.deb-online.de/download/402/trainer/32893/rahmenrichtlinien-fuer-die-traineraus-fort-und-weiterbildung-fortschreibung-2020.pdf · RINQ-POWERPLAY-FUNCTION-MODEL · RINQ-METHODOLOGY-DECISION |

---

### HR-D1-C3 — PP bewegt PK

| Feld | Wert |
|------|------|
| **claim_id** | D1-C3 |
| **Ort** | D1_D3 |
| **Claim** | Bewegung → PK-Reaktion → neue Öffnung |
| **Warum HR** | Dichtes Raster; „box_compresses“ impliziert Box-System |
| **Was prüfen** | Label „Box“ ohne Systemlehre ok? |
| **AI-Evidence** | MODERATE |
| **Offene Frage** | „Struktur“ statt „Box“ in UI? |
| **human_status** | `NEEDS_CHANGE` |
| **human_notes** | Entscheidung: Bewegung → Unterzahlreaktion → sichtbare Öffnung bleibt. Sichtbar **Unterzahlstruktur** statt Box (`box_compresses` Key bleibt). Zwangssprache → „geht mit sichtbarer Anpassung einher“. Bewegungs-/Öffnungsbegriffe eingedeutscht (Passlinie durch die Unterzahlstruktur, direkter Zug zum Tor …). Keine Systemannahme, keine sichere Kausalität. Nach Abnahme → `CONFIRMED_AS_RINQ_MODEL`. |
| **human_source_refs** | IIHF-2V2-SHOOTING-BOARD: https://www.iihf.com/en/coaching/18952/2vs2-shooting-board · IIHF-3V3 — Zeit/Raum: https://www.iihf.com/en/coaching/18775/3vs3 · RINQ-PP-PK-MOVEMENT-MODEL · RINQ-METHODOLOGY-DECISION · RINQ-TERMINOLOGY-DECISION-DEUTSCH-FIRST |

---

### HR-D1-C4 — Attack-Trigger

| Feld | Wert |
|------|------|
| **claim_id** | D1-C4 |
| **Ort** | D1_D4 |
| **Claim** | Control→Attack bei Signal; Outcome separat |
| **Warum HR** | Zentrale Haltung; Hint „gutes Powerplay“; Outcome-Feld kann Bias erzeugen |
| **Was prüfen** | immediateOutcome behalten? Hint umformulieren? |
| **AI-Evidence** | MODERATE |
| **Offene Frage** | „Danach“-Feld entfernen oder als Beobachtung ohne Note halten? |
| **human_status** | `NEEDS_CHANGE` |
| **human_notes** | Entscheidung: D4 auf **drei Schritte** reduziert (Angriffssignal, Aktion, unmittelbare Folge). `Trigger` → **Angriffssignal**. Redundantes `timingReason`/`Warum jetzt?` entfernt (`hidden`/`legacy`, Altdaten lesbar). `immediateOutcome` bleibt als **Unmittelbare Folge – ohne Qualitätswertung**. Aktionslabels eingedeutscht (Direktabschluss nach Pass, Pass durch die Unterzahlstruktur, Abschluss vom Point …). „Gutes Powerplay“ entfernt; Framing **Puckkontrolle → direkter Angriff**. Tor/Save/Puckverlust vom Entscheidungsurteil getrennt. Nach Abnahme → `CONFIRMED_AS_RINQ_MODEL`. |
| **human_source_refs** | IIHF-2V2-TO-3V2: https://www.iihf.com/en/coaching/18940/2vs2-to-3vs2 · IIHF-1V1-COACH-ACTIVATOR: https://www.iihf.com/en/coaching/18778/1vs1-with-coach-activator · RINQ-POWERPLAY-ATTACK-SIGNAL-MODEL · RINQ-METHODOLOGY-DECISION |

---

### HR-D1-C5 — Powerplay-Profil

| Feld | Wert |
|------|------|
| **claim_id** | D1-C5 |
| **Ort** | D1_D5 |
| **Claim** | Mehrdimensionales Profil ohne Systemlabel / ohne Torquote |
| **Warum HR** | „Profil“ + decisionProfile-Werte (shot-first etc.) |
| **Was prüfen** | Copy vs. Disclaimer |
| **AI-Evidence** | Didaktik MODERATE |
| **Offene Frage** | Module-Goal „Setups“ umbenennen? |
| **human_status** | `NEEDS_CHANGE` |
| **human_notes** | Entscheidung: Mehrdimensionale Zusammenfassung bleibt. Framing **Heutige Powerplay-Beobachtung**; Satzstarter auf beobachteten Abschnitt. `decisionProfile` als interpretative Pflichtdimension entfernt (`hidden`/`legacy`). PK-Manipulation → **sichtbare Unterzahlbewegung**. Keine Team-/Coach-/Setup-Identität. Terminologie mit D1_D1–D4 abgeglichen. Track-Summary/Lernziele ohne „Setups“-Pflicht. Nach Abnahme → `CONFIRMED_AS_RINQ_MODEL`. |
| **human_source_refs** | DEB-RAHMENRICHTLINIEN-TRAINERAUSBILDUNG-2020: https://www.deb-online.de/download/402/trainer/32893/rahmenrichtlinien-fuer-die-traineraus-fort-und-weiterbildung-fortschreibung-2020.pdf · RINQ-POWERPLAY-OBSERVATION-MODEL · RINQ-METHODOLOGY-DECISION · RINQ-CURRICULUM-BOUNDARY-C3-D1-D2 |

---

## HUMAN_REVIEW_OPTIONAL

### HR-D1-MIN-001 — „gutes Powerplay“ Hint

| Feld | Wert |
|------|------|
| **claim_id** | D1-MIN-001 |
| **Ort** | D1_D4 |
| **Claim** | Qualitäts-Hint entfernen |
| **human_status** | `NEEDS_CHANGE` |
| **human_notes** | „Ein gutes Powerplay …“ durch neutrale Beobachtungsformulierung ersetzt (Puckkontrolle halten oder nach sichtbarer Öffnung angreifen). Nach Prüfung → `CONFIRMED`. |
| **human_source_refs** | RINQ-METHODOLOGY-DECISION |

---

### HR-D1-MIN-002 — Goal „Setups“

| Feld | Wert |
|------|------|
| **claim_id** | D1-MIN-002 |
| **Ort** | D1 Module |
| **Claim** | Lernziel Setups → Raum-/Funktionsstrukturen |
| **human_status** | `NEEDS_CHANGE` |
| **human_notes** | Lernziel jetzt **Erkenne grundlegende Raum- und Funktionsstrukturen im Powerplay**. Summary: Räume, Funktionen, Bewegungen und Angriffssignale. Systemnamen bleiben optionaler Transfer. Nach Prüfung → `CONFIRMED`. |
| **human_source_refs** | RINQ-METHODOLOGY-DECISION |

---

### HR-D1-MIN-003 — EN-Labels

| Feld | Wert |
|------|------|
| **claim_id** | D1-MIN-003 |
| **Ort** | D1_D1–D5 |
| **Claim** | Deutsch-first Funktions-/Aktionslabels |
| **human_status** | `NEEDS_CHANGE` |
| **human_notes** | High→Point/Hohe Verbindung; Halfwall→Seitenraum; Bumper→Zentrale Kurzoption; Net Front→Direkt vor dem Tor / Präsenz; Goal Line→Tiefe Option; Weak Side→Puckferne Seite; Seam→Passlinie durch die Unterzahlstruktur; One-Timer→Direktabschluss nach Pass; Downhill Drive→Direkter Zug zum Tor. EN nur Glossarsynonyme. Nach Prüfung → `CONFIRMED`. |
| **human_source_refs** | RINQ-TERMINOLOGY-DECISION-DEUTSCH-FIRST |

---

## Quellenhinweis (übergreifend)

Die offiziellen Quellen (DEB / IIHF) stützen Passoptionen, Raumgewinn, Unterstützung, Torraumpräsenz, Passwegkontrolle und spielnahe Entscheidungen. Die konkrete D1-Taxonomie der Räume, Funktionen, Angriffssignale und Öffnungen ist ein **RinQ-Modell** und kein offizieller DEB- oder IIHF-Standard.

---

## Zusammenfassung

| Claim | Status |
|-------|--------|
| HR-D1-C1 … C5 | `NEEDS_CHANGE` (umgesetzt, Abnahme offen) |
| HR-D1-MIN-001 … 003 | `NEEDS_CHANGE` (umgesetzt, Abnahme offen) |
