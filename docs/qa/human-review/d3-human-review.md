# Human Review — D3

**Status:** Human-Entscheidungen dokumentiert · Umsetzung 2026-08-24 · finale Freigabe offen  
**Datum:** 2026-08-24  
**AI-Evidence:** [`d3-content-review.md`](../reviews/d3-content-review.md) · [`d3-sources.md`](../sources/d3-sources.md)  
**Glossar:** [`docs/content/hockey-glossary.md`](../../content/hockey-glossary.md) § D3

**Regel:** AI setzt **niemals** `human_status` auf CONFIRMED / CONFIRMED_AS_RINQ_MODEL / REJECTED.

**Track-Status:** `CONTENT + EVIDENCE APPROVED` · Curriculum/Theorie/Glossar nach HR geschärft · Human-Abnahme offen

**Priorität:** alle Kerntaxonomien REQUIRED.

**Umsetzungsnotiz (technisch):** D3_D1–D5, `theoryData` D3, Hover-Glossar und `d3Polish.test.ts` angepasst. `isolationLevel` (D3_D2), `primaryReason` (D3_D3) und `riskProfile` (D3_D5) migrationssicher (`required: false`, `hidden`/`legacy`). `immediateFollowup` in D3_D4 bleibt (neutral umbenannt). Progressive Felder für D1–D4. `human_status` bleibt bis zur menschlichen Abnahme `NEEDS_CHANGE`.

---

## HUMAN_REVIEW_REQUIRED

### HR-D3-C1 — Entry-Option / Gap

| Feld | Wert |
|------|------|
| **claim_id** | D3-C1 |
| **Ort** | D3_D1 |
| **Claim** | Verfügbare Lösung aus Lane + Gap + Enabling Factor |
| **Warum HR** | Einstieg Transitions; Carry/Dump-Bias historisch stark |
| **Was prüfen** | Optionenliste klar? „kontrollierter Dump“ vs. Hard Dump trennscharf? |
| **AI-Evidence** | MODERATE |
| **Offene Frage** | Controlled-entry-Stats in Theory erwähnen oder bewusst weglassen (wie jetzt)? |
| **human_status** | `NEEDS_CHANGE` |
| **human_notes** | Entscheidung: Korridor-/Abstands-/Lösungs-/Einflussfaktor-Modell bleibt als RinQ-Modell (IDs stabil). Gap → Abstand der Verteidigung zur blauen Linie (DE). Carry/Dump → Puck führen / tiefes Spiel; kontrolliertes vs. unkontrolliertes tiefes Spiel operational als vorbereitete Puckjagd vs. ohne Anschlusskontrolle — ohne „kontrollierter Dump“. Ursache → sichtbarer Einflussfaktor. Keine Entry-Statistik als normative Theorieaussage. Keine Carry-/Dump-Hierarchie. Theorie, Drill, Glossar angeglichen. Nach Abnahme → `CONFIRMED_AS_RINQ_MODEL`. |
| **human_source_refs** | DEB-RAHMENRICHTLINIEN-TRAINERAUSBILDUNG-2020 — Pass-/Puckführungs-/Raumaufgaben: https://www.deb-online.de/download/402/trainer/32893/rahmenrichtlinien-fuer-die-traineraus-fort-und-weiterbildung-fortschreibung-2020.pdf · IIHF-5V5-OFFENCE — Puck in freien Raum: https://www.iihf.com/en/coaching/18958/5vs5-offence · IIHF-2V2-TO-3V2: https://www.iihf.com/en/coaching/18940/2vs2-to-3vs2 · RINQ-ZONE-ENTRY-OPTION-MODEL · RINQ-TERMINOLOGY-DECISION-DEUTSCH-FIRST · RINQ-CURRICULUM-BOUNDARY-C2-C3-D2-D3 — konkrete D3-Taxonomie ist RinQ-Modell |

---

### HR-D3-C2 — Entry-Support

| Feld | Wert |
|------|------|
| **claim_id** | D3-C2 |
| **Ort** | D3_D2 |
| **Claim** | Support-Arten + Staffelung + Isolation |
| **Warum HR** | „Sehr gut unterstützt“ wertend; Forecheck-Support Boundary zu C/D2 |
| **Was prüfen** | Labels / Boundary „reiner Forecheck nach Dump“ |
| **AI-Evidence** | MODERATE |
| **Offene Frage** | Isolation-Skala neutraler? |
| **human_status** | `NEEDS_CHANGE` |
| **human_notes** | Entscheidung: Unterstützungsart, Staffelung und zusätzliche Option bleiben. `isolationLevel` als redundante und wertende Skala entfernt (hidden/legacy; Altdaten lesbar). Support-Begriffe DE-first (Nachrückender Spieler, puckferne Option, vorbereitete Puckjagd …). Vorbereitete Puckjagd von späterem vollständigem Forecheck abgegrenzt. Feedback ohne „wie gut unterstützt“. Nach Abnahme → `CONFIRMED_AS_RINQ_MODEL`. |
| **human_source_refs** | IIHF-2V2-PASSING-BOARD — Passoption / Zeit und Raum: https://www.iihf.com/en/coaching/18946/2vs2-passing-board · IIHF-2V2-TO-3V2: https://www.iihf.com/en/coaching/18940/2vs2-to-3vs2 · RINQ-ENTRY-SUPPORT-MODEL · RINQ-METHODOLOGY-DECISION · RINQ-TERMINOLOGY-DECISION-DEUTSCH-FIRST |

---

### HR-D3-C3 — Post-Entry

| Feld | Wert |
|------|------|
| **claim_id** | D3-C3 |
| **Ort** | D3_D3 |
| **Claim** | Unmittelbarer Zustand + Grund + erste Option + Stabilität |
| **Warum HR** | Enabling-Labels „guter erster Pass“; Hint „erfolgreicher Entry“ |
| **Was prüfen** | Vier Felder zu viel? Wording |
| **AI-Evidence** | MODERATE |
| **Offene Frage** | primaryReason-Labels entschärfen? |
| **human_status** | `NEEDS_CHANGE` |
| **human_notes** | Entscheidung: Unmittelbarer Zustand, erste Option und Stabilität/Fortsetzbarkeit bleiben. `primaryReason` als kausales/redundantes Pflichtfeld entfernt (hidden/legacy). „Guter erster Pass“ und ähnliche Wertungen entfernt. „Erfolgreicher Entry“ → neutrale Beschreibung des spielbaren Zustands. Fenster bleibt 2–4 Sekunden. Altdaten lesbar. Nach Abnahme → `CONFIRMED_AS_RINQ_MODEL`. |
| **human_source_refs** | IIHF-5V5-OFFENCE: https://www.iihf.com/en/coaching/18958/5vs5-offence · IIHF-2V2-PASSING-BOARD: https://www.iihf.com/en/coaching/18946/2vs2-passing-board · RINQ-POST-ENTRY-STATE-MODEL · RINQ-METHODOLOGY-DECISION · RINQ-CURRICULUM-BOUNDARY-C2-C3-D2-D3 |

---

### HR-D3-C4 — Exit / Clear unter Druck

| Feld | Wert |
|------|------|
| **claim_id** | D3-C4 |
| **Ort** | D3_D4 |
| **Claim** | Lösung × Druckgrund × Kontrollgrad × Folge |
| **Warum HR** | Icing als Option; Clear≠Fehler-Haltung zentral |
| **Was prüfen** | Didaktik klar genug gegen Outcome-Bias? |
| **AI-Evidence** | MODERATE |
| **Offene Frage** | immediateFollowup Outcome-Bias wie D2? |
| **human_status** | `NEEDS_CHANGE` |
| **human_notes** | Entscheidung: Lösung, sichtbare Druckbedingung, Kontrollgrad und unmittelbare Folge bleiben; progressive Anzeige. Clear → Befreiung; EN-Lösungen eingedeutscht. Icing bleibt beobachtbar ohne Qualitätsnote. `immediateFollowup` bleibt und heißt „Unmittelbare Folge – ohne Qualitätswertung“ — benotet die Entscheidung nicht nachträglich. Notiz unterstellt keine bessere Alternative. Grenze zu D2_D4 dokumentiert. Nach Abnahme → `CONFIRMED_AS_RINQ_MODEL`. |
| **human_source_refs** | IIHF-RULES-REGULATIONS-GUIDELINES — Icing als Regelzustand: https://www.iihf.com/en/static/55352/rules_regulations_guidelines · DEB-RAHMENRICHTLINIEN-TRAINERAUSBILDUNG-2020: https://www.deb-online.de/download/402/trainer/32893/rahmenrichtlinien-fuer-die-traineraus-fort-und-weiterbildung-fortschreibung-2020.pdf · RINQ-PRESSURED-EXIT-MODEL · RINQ-CURRICULUM-BOUNDARY-C2-C3-D2-D3 |

---

### HR-D3-C5 — Beobachtung an den blauen Linien

| Feld | Wert |
|------|------|
| **claim_id** | D3-C5 |
| **Ort** | D3_D5 |
| **Claim** | Mehrdimensionales Profil ohne Stats/Systemnamen |
| **Warum HR** | „Profil“; Option „Zu wenige Entries beobachtet“ gut — prüfen |
| **Was prüfen** | Copy vs. Disclaimer; Summary „bewerten“ |
| **AI-Evidence** | Didaktik MODERATE |
| **Offene Frage** | Module-Summary „bewerten“ → „einordnen“? |
| **human_status** | `NEEDS_CHANGE` |
| **human_notes** | Entscheidung: Mehrdimensionale Zusammenfassung bleibt. Entries-&-Clears-/Übergangsprofil → Heutige Beobachtung an den blauen Linien. `riskProfile` als interpretative Pflichtdimension entfernt (hidden/legacy). „Zu wenige Zoneneintritte/Zonenaustritte beobachtet“ bleibt. Summary: einordnen statt bewerten; Satzstarter „Im beobachteten Abschnitt war an den blauen Linien erkennbar, dass …“. Keine Team-/Coach-/Übergangsidentität. Terminologie mit D3_D1–D4 abgeglichen. Nach Abnahme → `CONFIRMED_AS_RINQ_MODEL`. |
| **human_source_refs** | DEB-RAHMENRICHTLINIEN-TRAINERAUSBILDUNG-2020: https://www.deb-online.de/download/402/trainer/32893/rahmenrichtlinien-fuer-die-traineraus-fort-und-weiterbildung-fortschreibung-2020.pdf · RINQ-BLUE-LINE-OBSERVATION-MODEL · RINQ-METHODOLOGY-DECISION · RINQ-TERMINOLOGY-DECISION-DEUTSCH-FIRST |

---

## HUMAN_REVIEW_OPTIONAL

### HR-D3-MIN-001 — „erfolgreicher Entry“ Hint

| Feld | Wert |
|------|------|
| **claim_id** | D3-MIN-001 |
| **Ort** | D3_D3 Didaktik |
| **Claim** | „erfolgreicher Entry“ |
| **human_status** | `NEEDS_CHANGE` |
| **human_notes** | Ersetzt durch neutrale Beschreibung des unmittelbar entstehenden spielbaren Zustands nach der blauen Linie. Nach menschlicher Prüfung → `CONFIRMED`. |
| **human_source_refs** | RINQ-POST-ENTRY-STATE-MODEL · RINQ-METHODOLOGY-DECISION |

---

### HR-D3-MIN-002 — „Gute Teams müssen“

| Feld | Wert |
|------|------|
| **claim_id** | D3-MIN-002 |
| **Ort** | Theorie / Drilltexte |
| **Claim** | „Gute Teams müssen“ und gleichwertige normative Formulierungen |
| **human_status** | `NEEDS_CHANGE` |
| **human_notes** | Normative Formulierungen entfernt bzw. ersetzt durch beobachtbare, situationsabhängige Sprache (z. B. „Unter bestimmten Druckbedingungen kann eine einfachere Lösung sichtbar werden.“). Nach menschlicher Prüfung → `CONFIRMED`. |
| **human_source_refs** | RINQ-METHODOLOGY-DECISION · RINQ-TERMINOLOGY-DECISION-DEUTSCH-FIRST |

---

### HR-D3-MIN-003 — Summary „bewerten“

| Feld | Wert |
|------|------|
| **claim_id** | D3-MIN-003 |
| **Ort** | Track summary / Lernziele |
| **Claim** | „lesen und bewerten“ / Entscheidungsqualität |
| **human_status** | `NEEDS_CHANGE` |
| **human_notes** | Ersetzt durch „lesen und einordnen“; Entscheidungsqualität → beobachtbare Entscheidungsbedingungen. Nach menschlicher Prüfung → `CONFIRMED`. |
| **human_source_refs** | RINQ-TERMINOLOGY-DECISION-DEUTSCH-FIRST · RINQ-METHODOLOGY-DECISION |

---

## Quellenhinweis

Die offiziellen Quellen (DEB, IIHF) stützen Puckführung in freien Raum, Passoptionen, Unterstützung, Raumgewinn und spielnahe Entscheidungen. Die konkrete D3-Taxonomie der Zoneneintritte, Unterstützung, Anschlusszustände und Befreiungen ist ein RinQ-Modell und kein offizieller DEB- oder IIHF-Standard.

---

## Zusammenfassung

| Priorität | Anzahl |
|-----------|--------|
| **REQUIRED** | **5** (C1–C5) · alle `NEEDS_CHANGE` nach Umsetzung |
| **OPTIONAL** | **3** (MIN-001–003) · alle `NEEDS_CHANGE` |
