# Human Review — C1

**Status:** Human-Entscheidungen dokumentiert · Umsetzung 2026-08-24 · finale Freigabe offen  
**Datum:** 2026-08-24  
**AI-Evidence:** [`c1-content-review.md`](../reviews/c1-content-review.md) · [`c1-sources.md`](../sources/c1-sources.md)  
**Glossar:** [`docs/content/hockey-glossary.md`](../../content/hockey-glossary.md) § C1

**Regel:** AI setzt **niemals** `human_status` auf CONFIRMED / CONFIRMED_AS_RINQ_MODEL / REJECTED.

**Track-Status:** `CONTENT + EVIDENCE APPROVED` · Curriculum/Theorie/Glossar nach HR geschärft · Human-Abnahme offen

**Priorität:** alle Kerntaxonomien REQUIRED (wie B2/B3).

**Umsetzungsnotiz (technisch):** C1_D1–D5, `theoryData` C1, Hover-Glossar und `c1Polish.test.ts` angepasst. `human_status` bleibt bis zur menschlichen Abnahme `NEEDS_CHANGE`.

---

## HUMAN_REVIEW_REQUIRED

### HR-C1-C1 — Raumprioritäten

| Feld | Wert |
|------|------|
| **claim_id** | C1-C1 |
| **Ort** | C1_D1 |
| **Claim** | Geschützter / gefährlicher / bewusst zugelassener Raum |
| **Warum HR** | Einstieg Track C; Paint-Labels prägen Lesart |
| **Was prüfen** | Dreier-Layer didaktisch klar? „Gefährlich“ für wen? |
| **AI-Evidence** | MODERATE — Mitte/Slot-Priorität |
| **Offene Frage** | Systemnamen später optional erwähnen oder bewusst nie in C1? |
| **human_status** | `NEEDS_CHANGE` |
| **human_notes** | Entscheidung: Das RinQ-Dreiermodell bleibt. Sichtbare Labels jetzt **Geschützter Raum / Raum mit hoher Torgefahr / Weniger priorisierter Raum** (IDs `protected_space` / `danger_space` / `accepted_space` stabil). „Weniger priorisiert“ behauptet keine bewusste Freigabe oder feste taktische Vorgabe. Paint-Layer dürfen sich überlagern; Markierung gilt für die Szene, nicht als allgemeingültige Eisflächenkarte. Systemnamen sind kein Pflichtlernziel. Formulierungen wie „bewusst zugelassen/freigegeben“ und „das Team will diesen Raum anbieten“ wurden durch beobachtbare Sprache ersetzt. Angeglichen: C1_D1 Didaktik/Missionen/Completion, theoryData `raumprioritaeten`, Glossar (md + hover), Paint-Fallback in DrillRenderer. Nach geprüfter Umsetzung und menschlicher Abnahme kann auf `CONFIRMED_AS_RINQ_MODEL` gesetzt werden. |
| **human_source_refs** | DEB-RAHMENRICHTLINIEN-TRAINERAUSBILDUNG-2020 — individuelles/kollektives Abwehrverhalten, gruppentaktische Abwehraufgaben: https://www.deb-online.de/download/402/trainer/32893/rahmenrichtlinien-fuer-die-traineraus-fort-und-weiterbildung-fortschreibung-2020.pdf · IIHF-1V1-PLUS-OUTLETS — Position halten, Torraumverteidigung: https://www.iihf.com/en/coaching/18787/1vs1-plus-outlets · IIHF-2V2-SHOOTING-BOARD — zwischen Gegner und Tor bleiben, Passwege: https://www.iihf.com/en/coaching/18952/2vs2-shooting-board · IIHF-DEFEND-THE-GATE — Anwinkeln, Weg ins Zentrum begrenzen: https://www.iihf.com/en/coaching/18781/defend-the-gate · RINQ-SPACE-PRIORITY-MODEL · RINQ-CURRICULUM-BOUNDARY-B3-C1-C2 — offizielle Quellen stützen defensive Prinzipien; konkrete RinQ-Taxonomie ist kein DEB-/IIHF-Standard |

---

### HR-C1-C2 — Struktur / Staffelung

| Feld | Wert |
|------|------|
| **claim_id** | C1-C2 |
| **Ort** | C1_D2 |
| **Claim** | Kompakt / ausgewogen / gestreckt + Raumfunktion |
| **Warum HR** | „Gestreckt“ kann wertend wirken; Bubble-Rekonstruktion anspruchsvoll |
| **Was prüfen** | Skala + Funktionsliste tragfähig? |
| **AI-Evidence** | MODERATE partial |
| **Offene Frage** | MiniFeedback-Frage „Welche Anpassung hätte … verbessert?“ leicht coaching-haft? |
| **human_status** | `NEEDS_CHANGE` |
| **human_notes** | Entscheidung: Sichtbare Strukturklassifikation jetzt **Enge / Mittlere / Große Abstände / Unklar** (interne IDs compact/balanced/stretched/unclear für Rückwärtskompatibilität). Abstandskategorie ist keine Qualitätsnote. Bubble-Rekonstruktion aller fünf Defensivrollen bleibt; ungefähre Beziehungen zählen, keine Zentimeterpflicht. Raumfunktionen (Zentrum schützen, Druck unterstützen, Passwege schließen, Raum kontrollieren, Unklar) bleiben; „Druck unterstützen“ mit B3 abgestimmt. Coachinghafte MiniFeedback-Frage („Welche Anpassung hätte die Raumkontrolle verbessert?“) durch Beobachtungsfragen ersetzt. Angeglichen: C1_D2 Titel/Didaktik/Options/Feedback, theoryData `struktur`, Glossar Abstände/Staffelung. Nach Abnahme → `CONFIRMED_AS_RINQ_MODEL`. |
| **human_source_refs** | DEB-RAHMENRICHTLINIEN-TRAINERAUSBILDUNG-2020 — kollektives Abwehrverhalten / Abstände: https://www.deb-online.de/download/402/trainer/32893/rahmenrichtlinien-fuer-die-traineraus-fort-und-weiterbildung-fortschreibung-2020.pdf · IIHF-2V2-WITH-OUTLETS — Raumbegrenzung und Support: https://www.iihf.com/en/coaching/19085/2vs2-with-outlets · RINQ-STRUCTURE-OBSERVATION-MODEL · RINQ-METHODOLOGY-DECISION |

---

### HR-C1-C3 — Druck vs. Kontrolle (Optionstiefe)

| Feld | Wert |
|------|------|
| **claim_id** | C1-C3 |
| **Ort** | C1_D3 |
| **Claim** | Trigger × Ausführung × Absicherung × Timing |
| **Warum HR** | Stärkstes / dichtestes RinQ-Raster in C1 |
| **Was prüfen** | Zu granular für Live-Beobachtung? Reduktion möglich? |
| **AI-Evidence** | MODERATE — Pressure + coverage Konvention |
| **Offene Frage** | Pflichtfelder alle vier Dimensionen behalten? |
| **human_status** | `NEEDS_CHANGE` |
| **human_notes** | Entscheidung: Vier Dimensionen bleiben (Auslöser, Form, Absicherung, Timing) plus Ortsmarkierung. Primärer DE-Begriff **Auslöser**; `Trigger` nur Glossarsynonym. `Abgesicherter Zugriff` aus der Auslöserliste entfernt (gehört zur Absicherung). `Notwendiger Zugriff` → **Unmittelbare Gefahr vor dem Tor**. Form: „Zwei Spieler begrenzen gemeinsam den Raum“ statt Falle; „Keine gemeinsame Unterstützung erkennbar“ statt unkoordinierter Einzelzugriff. Timing neutral relativ zur nächsten gegnerischen Aktion (vor / gleichzeitig / nach; ohne Früh/Überhastet). Notiz ohne „Qualität“. Progressive Felddarstellung (`observation_fields_progressive`) reduziert Bedienlast. Alle Dimensionen erlauben Unklar/Nicht klar beurteilbar. Keine innere Absicht oder sichere Kausalität. Angeglichen: C1_D3, theoryData `aktiverZugriff`, Glossar Auslöser/Absicherung, DrillRenderer. Nach Abnahme → `CONFIRMED_AS_RINQ_MODEL`. |
| **human_source_refs** | DEB-RAHMENRICHTLINIEN-TRAINERAUSBILDUNG-2020 — Abdrängen / individuelles Abwehrverhalten: https://www.deb-online.de/download/402/trainer/32893/rahmenrichtlinien-fuer-die-traineraus-fort-und-weiterbildung-fortschreibung-2020.pdf · IIHF-2V2-WITH-OUTLETS — Druck zur Raumbegrenzung: https://www.iihf.com/en/coaching/19085/2vs2-with-outlets · IIHF-DEFEND-THE-GATE — Lenken nach außen: https://www.iihf.com/en/coaching/18781/defend-the-gate · RINQ-PRESSURE-COVERAGE-MODEL · RINQ-METHODOLOGY-DECISION · RINQ-CURRICULUM-BOUNDARY-B3-C1-C2 |

---

### HR-C1-C4 — Verantwortlichkeitswechsel

| Feld | Wert |
|------|------|
| **claim_id** | C1-C4 |
| **Ort** | C1_D4 |
| **Claim** | Reaktionstypen + Struktur-Outcomes + Auslöser |
| **Warum HR** | Boundary Man-Coverage vs. Raumverantwortung |
| **Was prüfen** | Labels klar? „gefährliche Lücke“ zu wertend? |
| **AI-Evidence** | MODERATE — switches/handoffs |
| **Offene Frage** | Vorher/Nachher-UI Lernaufwand vs. Nutzen |
| **human_status** | `NEEDS_CHANGE` |
| **human_notes** | Entscheidung: Vorher-/Nachher-Mechanik bleibt. `Gezielte Übergabe` → **Sichtbare Übergabe**. `Unkoordinierte Reaktion` → **Keine gemeinsame Anpassung erkennbar** (ohne Aussage über Kommunikation/Vorgaben). Struktur-Outcomes: erhalten / angepasst und verbunden / kurzzeitig offener Raum / direkter Raum oder Passweg zum Tor offen / Verbundenheit verloren / nicht klar beurteilbar. Auslöser = nur unmittelbar vorausgehende sichtbare Bewegung. Relative Abstände wichtiger als exakte Koordinaten. Angeglichen: C1_D4, theoryData Verantwortung, Glossar Verantwortlichkeitswechsel/Verbundenheit. Nach Abnahme → `CONFIRMED_AS_RINQ_MODEL`. |
| **human_source_refs** | DEB-RAHMENRICHTLINIEN-TRAINERAUSBILDUNG-2020 — kollektives Abwehrverhalten: https://www.deb-online.de/download/402/trainer/32893/rahmenrichtlinien-fuer-die-traineraus-fort-und-weiterbildung-fortschreibung-2020.pdf · IIHF-1V1-PLUS-OUTLETS — nicht ausschließlich dem Puck folgen: https://www.iihf.com/en/coaching/18787/1vs1-plus-outlets · RINQ-RESPONSIBILITY-SHIFT-MODEL · RINQ-METHODOLOGY-DECISION |

---

### HR-C1-C5 — Stabilität / „Profil“

| Feld | Wert |
|------|------|
| **claim_id** | C1-C5 |
| **Ort** | C1_D5 |
| **Claim** | Mehrdimensionale Stabilität ohne gut/schlecht und ohne Systemnamen |
| **Warum HR** | `summary_title` „Defensivprofil“ + Satzstarter „Dieses Team verteidigt…“ |
| **Was prüfen** | Copy vs. Disclaimer; Dimensionen-Anzahl |
| **AI-Evidence** | Didaktik MODERATE |
| **Offene Frage** | Profil → „heutige Stabilitätsbeobachtung“? |
| **human_status** | `NEEDS_CHANGE` |
| **human_notes** | Entscheidung: Mehrdimensionale Zusammenfassung bleibt (Raumpriorität, Grundstruktur, Verschiebung, Zugriff, eigene Zusammenfassung). Framing: **Heutige Stabilitätsbeobachtung**; Reflection **Beobachtungen zusammenfassen**; Satzstarter **„Im beobachteten Abschnitt war erkennbar, dass …“**. Disclaimer betont Stichprobe / kein Systemlabel / keine Identität. `riskProfile` nicht mehr Pflicht (`required: false`, `hidden`/`legacy`); Altdaten lesbar, nicht neu berechnet, nicht in sichtbarer Zusammenfassung. Labels: früher aktiver Zugriff / häufig früh herausrückend; „Keine stabile Tendenz erkennbar“ vs. „Nicht sicher beurteilbar“ getrennt. Angeglichen: C1_D5, PeriodCheckin-Filter für hidden, Session-Validierung, theoryData, Glossar. Nach Abnahme → `CONFIRMED_AS_RINQ_MODEL`. |
| **human_source_refs** | DEB-RAHMENRICHTLINIEN-TRAINERAUSBILDUNG-2020 — langfristige Ausbildung statt Identitätsableitung: https://www.deb-online.de/download/402/trainer/32893/rahmenrichtlinien-fuer-die-traineraus-fort-und-weiterbildung-fortschreibung-2020.pdf · RINQ-STABILITY-OBSERVATION-MODEL · RINQ-METHODOLOGY-DECISION · RINQ-CURRICULUM-BOUNDARY-B3-C1-C2 |

---

## HUMAN_REVIEW_OPTIONAL

### HR-C1-MIN-001 — Defensivprofil Framing

| Feld | Wert |
|------|------|
| **claim_id** | C1-MIN-001 |
| **human_status** | `NEEDS_CHANGE` |
| **human_notes** | Umbenennung **Defensivprofil → Heutige Stabilitätsbeobachtung** und Satzstarter **„Im beobachteten Abschnitt war erkennbar, dass …“** umgesetzt (gemeinsam mit C1-C5). Rein sprachlicher Teil; nach menschlicher Prüfung kann auf `CONFIRMED` gesetzt werden. |
| **human_source_refs** | RINQ-METHODOLOGY-DECISION · RINQ-STABILITY-OBSERVATION-MODEL |

### HR-C1-MIN-002 — D3 Optionstiefe

| Feld | Wert |
|------|------|
| **claim_id** | C1-MIN-002 |
| **human_status** | `NEEDS_CHANGE` |
| **human_notes** | Vier Dimensionen bleiben erhalten. Progressive Darstellung (`observation_fields_progressive`) reduziert Bedienlast. Jede Dimension bietet Unklar/Nicht klar beurteilbar. Keine zusätzliche Dimension. Auslöser-/Absicherungs-/Timing-Taxonomien bereinigt (siehe C1-C3). Nach Abnahme → `CONFIRMED_AS_RINQ_MODEL`. |
| **human_source_refs** | RINQ-PRESSURE-COVERAGE-MODEL · RINQ-METHODOLOGY-DECISION |

### HR-C1-MIN-003 — Paint „Gefährlicher Raum“

| Feld | Wert |
|------|------|
| **claim_id** | C1-MIN-003 |
| **human_status** | `NEEDS_CHANGE` |
| **human_notes** | Umbenennung **Gefährlicher Raum → Raum mit hoher Torgefahr**: macht klar, dass die Gefahr für das verteidigte Tor gemeint ist; vermeidet perspektivlose Wertung. Konsistent in Paint-Layer, Theorie und Glossar. Nach menschlicher Prüfung kann auf `CONFIRMED` gesetzt werden. |
| **human_source_refs** | RINQ-SPACE-PRIORITY-MODEL · HR C1-C1 |

---

## Zusammenfassung

| Priorität | Anzahl |
|-----------|--------|
| **REQUIRED** | **5** (C1–C5) — dokumentiert, `NEEDS_CHANGE`, Umsetzung erfolgt |
| **OPTIONAL** | **3** — dokumentiert, `NEEDS_CHANGE` |

**Nächster Schritt:** Spot-Check UI (Paint-Overlay, D3 progressiv, D5 ohne Risikoprofil) → Claims manuell auf `CONFIRMED` / `CONFIRMED_AS_RINQ_MODEL` setzen → Track-Status `CONTENT + EVIDENCE + HUMAN APPROVED`.
