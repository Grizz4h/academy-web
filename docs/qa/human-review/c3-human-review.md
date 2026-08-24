# Human Review — C3

**Status:** Human-Entscheidungen dokumentiert · Umsetzung 2026-08-24 · finale Freigabe offen  
**Datum:** 2026-08-24  
**AI-Evidence:** [`c3-content-review.md`](../reviews/c3-content-review.md) · [`c3-sources.md`](../sources/c3-sources.md)  
**Glossar:** [`docs/content/hockey-glossary.md`](../../content/hockey-glossary.md) § C3

**Regel:** AI setzt **niemals** `human_status` auf CONFIRMED / CONFIRMED_AS_RINQ_MODEL / REJECTED.

**Track-Status:** `CONTENT + EVIDENCE APPROVED` · Curriculum/Theorie/Glossar nach HR geschärft · Human-Abnahme offen

**Priorität:** alle Kerntaxonomien REQUIRED (wie C1/C2).

**Umsetzungsnotiz (technisch):** C3_D1–D5, `theoryData` C3, Hover-Glossar und `c3Polish.test.ts` angepasst. `riskProfile` migrationssicher (`required: false`, `hidden`/`legacy`). Progressive Felder für D1–D4. `human_status` bleibt bis zur menschlichen Abnahme `NEEDS_CHANGE`.

---

## HUMAN_REVIEW_REQUIRED

### HR-C3-C1 — Offensive Raumverteilung

| Feld | Wert |
|------|------|
| **claim_id** | C3-C1 |
| **Ort** | C3_D1 |
| **Claim** | Besetzte vs. freie OZ-Räume (Net Front, Slot, Halfwall, Point, Behind Net) |
| **Warum HR** | Einstieg C3; englische UI-Labels |
| **Was prüfen** | Zonen-Set ausreichend? DE-Labels nötig? |
| **AI-Evidence** | MODERATE — lanes / net-front |
| **Offene Frage** | Systemnamen später optional oder nie in C3? |
| **human_status** | `NEEDS_CHANGE` |
| **human_notes** | Entscheidung: Zonen-Set bleibt (IDs stabil). Primäre UI-Labels: **Direkt vor dem Tor / Slot / Linker·Rechter Seitenraum / Point / Hinter dem Tor**. Slot und Point bleiben als etablierte Fachbegriffe (nicht weiter eingedeutscht; „Zentraler Abschlussraum“ / „Hoher Raum“ wirkten künstlich). Halfwall → Seitenraum; Behind the Net → Hinter dem Tor. Breitenklassifikation neutralisiert. Besetzt/unbesetzt keine Qualitätsbewertung. Systemnamen außerhalb Pflichtklassifikation. Spiegelung aktiv. Nach Abnahme → `CONFIRMED_AS_RINQ_MODEL`. |
| **human_source_refs** | DEB-RAHMENRICHTLINIEN-TRAINERAUSBILDUNG-2020 — Raum-/Pass-/Abschlussaufgaben, Mannschaftsverhalten: https://www.deb-online.de/download/402/trainer/32893/rahmenrichtlinien-fuer-die-traineraus-fort-und-weiterbildung-fortschreibung-2020.pdf · IIHF-2V2-TO-3V2 — freier zentraler Raum: https://www.iihf.com/en/coaching/18940/2vs2-to-3vs2 · IIHF-1V1-COACH-ACTIVATOR — Bewegung vor dem Tor: https://www.iihf.com/en/coaching/18778/1vs1-with-coach-activator · RINQ-OFFENSIVE-SPACE-MODEL · RINQ-TERMINOLOGY-DECISION-DEUTSCH-FIRST · RINQ-CURRICULUM-BOUNDARY-C2-C3 — offizielle Quellen stützen Raumbelegung; konkrete C3-Taxonomie ist RinQ-Modell |

---

### HR-C3-C2 — Verbindungen

| Feld | Wert |
|------|------|
| **claim_id** | C3-C2 |
| **Ort** | C3_D2 |
| **Claim** | Spielbarkeit + Hauptachse + Weak-Side-Einbindung |
| **Warum HR** | „Sehr gut / Stark getrennt / Zu komprimiert“ wertend |
| **Was prüfen** | Achsen-Liste klar? Drei Felder zu viel? |
| **AI-Evidence** | MODERATE — support |
| **Offene Frage** | Skala neutraler formulieren? |
| **human_status** | `NEEDS_CHANGE` |
| **human_notes** | Entscheidung: Drei Dimensionen bleiben und werden schrittweise gezeigt. Wertende Labels → beobachtbare Spielbarkeit (mehrere direkt spielbar / isoliert / wenige Verbindungen / kurze Abstände begrenzen Passwinkel). Achsen deutsch (tiefer↔zentral/hoch, Puckseite↔puckferne Seite). Weak Side → **Puckferne Seite**. Bubble-Rekonstruktion bleibt; ungefähre Beziehungen > Koordinaten. Coachinghafte Feedback-Fragen entfernt. Angeglichen: C3_D2, theoryData `verbindungen`, Glossar. Nach Abnahme → `CONFIRMED_AS_RINQ_MODEL`. |
| **human_source_refs** | IIHF-2V2-PASSING-BOARD — Passoption / Zeit und Raum: https://www.iihf.com/en/coaching/18946/2vs2-passing-board · IIHF-3V3 — Puckbesitz, Zeit/Raum: https://www.iihf.com/en/coaching/18775/3vs3 · DEB-RAHMENRICHTLINIEN-TRAINERAUSBILDUNG-2020: https://www.deb-online.de/download/402/trainer/32893/rahmenrichtlinien-fuer-die-traineraus-fort-und-weiterbildung-fortschreibung-2020.pdf · RINQ-CONNECTION-OBSERVATION-MODEL · RINQ-METHODOLOGY-DECISION |

---

### HR-C3-C3 — Bewegung → Öffnung

| Feld | Wert |
|------|------|
| **claim_id** | C3-C3 |
| **Ort** | C3_D3 |
| **Claim** | Trigger × Defensivreaktion × entstandener Vorteil |
| **Warum HR** | Dichtes RinQ-Raster; Kern „Struktur vor Spielzug“ |
| **Was prüfen** | Dreier klar? Vorteil vs. D4-Entscheidung überlappend? |
| **AI-Evidence** | MODERATE — cycle/switch |
| **Offene Frage** | Optionen kürzen? |
| **human_status** | `NEEDS_CHANGE` |
| **human_notes** | Entscheidung: D3 bleibt bei Bewegung, sichtbarer Defensivreaktion und Öffnung; bewertet noch nicht die Anschlussaktion (D4). Trigger/Ursache/Vorteil → **Ausgangsbewegung / Reaktion / sichtbare Öffnung**. Keine sichere Kausalität. EN-Bewegungsbegriffe eingedeutscht (Positionswechsel, Mehrfachbesetzung, Bewegung zum Tor …). Theorie, Feedback und Glossar angeglichen; progressive Felder. Nach Abnahme → `CONFIRMED_AS_RINQ_MODEL`. |
| **human_source_refs** | IIHF-1V1-COACH-ACTIVATOR — Bewegung / Freilaufen: https://www.iihf.com/en/coaching/18778/1vs1-with-coach-activator · IIHF-2V2-TO-3V2 — zentraler Raum: https://www.iihf.com/en/coaching/18940/2vs2-to-3vs2 · IIHF-3V3: https://www.iihf.com/en/coaching/18775/3vs3 · RINQ-MOVEMENT-OPENING-MODEL · RINQ-TERMINOLOGY-DECISION-DEUTSCH-FIRST · RINQ-METHODOLOGY-DECISION |

---

### HR-C3-C4 — Anschlussaktion ≠ Outcome

| Feld | Wert |
|------|------|
| **claim_id** | C3-C4 |
| **Ort** | C3_D4 |
| **Claim** | Anschlussentscheidung + Opening-Faktor, getrennt vom Ergebnis |
| **Warum HR** | Zentrale Haltung; „Low Cycle“ / „Reset High“ als Labels trotz Struktur-first |
| **Was prüfen** | Cycle/Reset als Entscheidungsart ok ohne Systemlehre? |
| **AI-Evidence** | MODERATE |
| **Offene Frage** | Enabling-Liste zu lang? |
| **human_status** | `NEEDS_CHANGE` |
| **human_notes** | Entscheidung: D4 beobachtet die nächste Aktion nach sichtbarer Öffnung. Labels: **Tiefes Zusammenspiel fortsetzen** (`low_cycle`), **Neuaufbau über den Point** (`reset_high`), **Puckkontrolle halten** (`protect_puck`), **Zusätzlicher Pass**. Opening-Faktor → **unmittelbar zuvor sichtbare Öffnung**; gebunden/Goalie → beobachtbare Formulierungen. Struktur danach neutralisiert. Entscheidung vom Ergebnis getrennt. Drei Dimensionen bleiben, progressive Anzeige. Keys stabil. Angeglichen: C3_D4, theoryData `vorteil`, Glossar. Nach Abnahme → `CONFIRMED_AS_RINQ_MODEL`. |
| **human_source_refs** | IIHF-2V2-PASSING-BOARD: https://www.iihf.com/en/coaching/18946/2vs2-passing-board · IIHF-2V2-TO-3V2: https://www.iihf.com/en/coaching/18940/2vs2-to-3vs2 · DEB-RAHMENRICHTLINIEN-TRAINERAUSBILDUNG-2020: https://www.deb-online.de/download/402/trainer/32893/rahmenrichtlinien-fuer-die-traineraus-fort-und-weiterbildung-fortschreibung-2020.pdf · RINQ-NEXT-ACTION-MODEL · RINQ-METHODOLOGY-DECISION · RINQ-TERMINOLOGY-DECISION-DEUTSCH-FIRST |

---

### HR-C3-C5 — Offensivstruktur-Beobachtung

| Feld | Wert |
|------|------|
| **claim_id** | C3-C5 |
| **Ort** | C3_D5 |
| **Claim** | Mehrdimensionales OZ-Profil ohne System-/Spielzuglabel |
| **Warum HR** | „Profil“ kann wie Team-Identität wirken |
| **Was prüfen** | Copy vs. Disclaimer; Dimensionen-Anzahl |
| **AI-Evidence** | Didaktik MODERATE |
| **Offene Frage** | „Profil“ → „heutige Prinzipien-Beobachtung“? |
| **human_status** | `NEEDS_CHANGE` |
| **human_notes** | Entscheidung: Mehrdimensionale Zusammenfassung bleibt. Framing: **Heutige Offensivstruktur-Beobachtung**; Satzstarter **„Im beobachteten Abschnitt war in der Angriffszone erkennbar, dass …“**; Disclaimer begrenzt auf Stichprobe. `riskProfile` nicht mehr Pflicht (`hidden`/`legacy`); Altdaten lesbar. Begriffe mit D1–D4 abgeglichen und eingedeutscht; Kausalität in Treiber-Frage reduziert. Keine Team-/Coach-/Spielzugidentität. Nach Abnahme → `CONFIRMED_AS_RINQ_MODEL`. |
| **human_source_refs** | DEB-RAHMENRICHTLINIEN-TRAINERAUSBILDUNG-2020: https://www.deb-online.de/download/402/trainer/32893/rahmenrichtlinien-fuer-die-traineraus-fort-und-weiterbildung-fortschreibung-2020.pdf · RINQ-OFFENSIVE-STRUCTURE-OBSERVATION-MODEL · RINQ-METHODOLOGY-DECISION · RINQ-CURRICULUM-BOUNDARY-C2-C3 |

---

## HUMAN_REVIEW_OPTIONAL

### HR-C3-MIN-001 — Profil-Framing

| Feld | Wert |
|------|------|
| **claim_id** | C3-MIN-001 |
| **Ort** | C3_D5 |
| **Claim** | Offensive-Zone-Profil → Heutige Offensivstruktur-Beobachtung; Satzstarter |
| **human_status** | `NEEDS_CHANGE` |
| **human_notes** | Umgesetzt: Titel/Summary **Heutige Offensivstruktur-Beobachtung**; Starter **„Im beobachteten Abschnitt war in der Angriffszone erkennbar, dass …“**. Nach Prüfung → `CONFIRMED`. |
| **human_source_refs** | RINQ-OFFENSIVE-STRUCTURE-OBSERVATION-MODEL · RINQ-METHODOLOGY-DECISION |

---

### HR-C3-MIN-002 — Wertende Verbindungs-Labels

| Feld | Wert |
|------|------|
| **claim_id** | C3-MIN-002 |
| **Ort** | C3_D2 |
| **Claim** | Verbindungsskala entwerten |
| **human_status** | `NEEDS_CHANGE` |
| **human_notes** | Umgesetzt: Sehr gut verbunden → **Mehrere direkt spielbare Verbindungen**; Stark getrennt → **Wenige direkt spielbare Verbindungen**; Zu komprimiert → **Sehr kurze Abstände begrenzen Passwinkel**; Weak Side → **Puckferne Seite**. Keine Verbindungsform automatisch gut/schlecht. Nach Prüfung → `CONFIRMED`. |
| **human_source_refs** | RINQ-CONNECTION-OBSERVATION-MODEL · RINQ-METHODOLOGY-DECISION |

---

### HR-C3-MIN-003 — D4 Optionstiefe

| Feld | Wert |
|------|------|
| **claim_id** | C3-MIN-003 |
| **Ort** | C3_D4 |
| **Claim** | Drei Dimensionen + progressive Anzeige |
| **human_status** | `NEEDS_CHANGE` |
| **human_notes** | D4 behält drei eigenständige Dimensionen; progressive Anzeige; Unklar-Auswahl; EN-Labels eingedeutscht; Opening-Faktor → sichtbare Öffnung; keine weitere Dimension. Nach Prüfung → `CONFIRMED_AS_RINQ_MODEL`. |
| **human_source_refs** | RINQ-NEXT-ACTION-MODEL · RINQ-METHODOLOGY-DECISION |

---

## Quellenhinweis (übergreifend)

Die offiziellen Quellen (DEB / IIHF) stützen Raumbelegung, Spielbarkeit, Unterstützung, Bewegung, zentrale Abschlussräume und Puckbesitz. Die konkrete Zusammenstellung der C3-Beobachtungskategorien ist ein **RinQ-Modell** und kein offizieller DEB- oder IIHF-Standard.

---

## Zusammenfassung

| Claim | Status |
|-------|--------|
| HR-C3-C1 … C5 | `NEEDS_CHANGE` (umgesetzt, Abnahme offen) |
| HR-C3-MIN-001 … 003 | `NEEDS_CHANGE` (umgesetzt, Abnahme offen) |
