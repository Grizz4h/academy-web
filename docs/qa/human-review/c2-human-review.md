# Human Review — C2

**Status:** Human-Entscheidungen dokumentiert · Umsetzung 2026-08-24 · finale Freigabe offen  
**Datum:** 2026-08-24  
**AI-Evidence:** [`c2-content-review.md`](../reviews/c2-content-review.md) · [`c2-sources.md`](../sources/c2-sources.md)  
**Glossar:** [`docs/content/hockey-glossary.md`](../../content/hockey-glossary.md) § C2

**Regel:** AI setzt **niemals** `human_status` auf CONFIRMED / CONFIRMED_AS_RINQ_MODEL / REJECTED.

**Track-Status:** `CONTENT + EVIDENCE APPROVED` · Curriculum/Theorie/Glossar nach HR geschärft · Human-Abnahme offen

**Priorität:** alle Kerntaxonomien REQUIRED (wie C1).

**Umsetzungsnotiz (technisch):** C2_D1–D5, `theoryData` C2, Hover-Glossar und `c2Polish.test.ts` angepasst. `endpointMeaning` und `riskProfile` migrationssicher (`required: false`, `hidden`/`legacy`). Progressive Felder für D2/D3/D4. `human_status` bleibt bis zur menschlichen Abnahme `NEEDS_CHANGE`.

---

## HUMAN_REVIEW_REQUIRED

### HR-C2-C1 — Geschlossene / verbleibende Wege

| Feld | Wert |
|------|------|
| **claim_id** | C2-C1 |
| **Ort** | C2_D1 |
| **Claim** | Primär geschlossener Korridor vs. verbleibender Weg (inkl. Dump) |
| **Warum HR** | Einstieg C2; Konflikt-Hinweis wenn beide gleich gewählt |
| **Was prüfen** | Drei Lanes + Dump/unclear ausreichend? |
| **AI-Evidence** | MODERATE — Mitte schützen / Außen |
| **Offene Frage** | Formationszahlen später optional oder nie in C2? |
| **human_status** | `NEEDS_CHANGE` |
| **human_notes** | Entscheidung: Drei Korridore (links/zentral/rechts) plus alternative Eintrittslösungen bleiben. `angebotener Weg` → **verbleibender / am ehesten verfügbarer Weg** — keine bewusste taktische Freigabe. Sichtbar **Puck tief spielen** statt Dump-in (EN nur Glossarsynonym); Abgrenzung zu **kontrollierter Eintritt mit reduziertem Tempo**. Konflikthinweis bleibt warnend, nicht blockierend. Systemnamen außerhalb der Pflichtklassifikation; optionaler Glossarhinweis: ähnliche Raumwirkung aus verschiedenen Systemen. Angeglichen: C2_D1 Titel/Didaktik/Selection/Conflict/Note, theoryData `wege`, Glossar Eintrittsweg/geschlossen/verbleibend/Puck tief spielen, DrillRenderer-Fallback. Nach geprüfter Umsetzung und menschlicher Abnahme → `CONFIRMED_AS_RINQ_MODEL`. |
| **human_source_refs** | DEB-RAHMENRICHTLINIEN-TRAINERAUSBILDUNG-2020 — individuelles/kollektives Abwehrverhalten, Abdrängen, gruppentaktische Abwehraufgaben, einfache Abwehrsysteme: https://www.deb-online.de/download/402/trainer/32893/rahmenrichtlinien-fuer-die-traineraus-fort-und-weiterbildung-fortschreibung-2020.pdf · IIHF-DEFEND-THE-GATE — Anwinkeln, Gegner außen halten, Mitte begrenzen: https://www.iihf.com/en/coaching/18781/defend-the-gate · IIHF-2V2-WITH-OUTLETS — defensiver Druck / Raum: https://www.iihf.com/en/coaching/19085/2vs2-with-outlets · IIHF-2V2-SHOOTING-BOARD — Passwege schließen: https://www.iihf.com/en/coaching/18952/2vs2-shooting-board · RINQ-NEUTRAL-ZONE-CORRIDOR-MODEL · RINQ-CURRICULUM-BOUNDARY-B3-C1-C2-C3 · RINQ-TERMINOLOGY-DECISION-DEUTSCH-FIRST — offizielle Quellen stützen Raumbegrenzung; konkrete C2-Kategorien sind RinQ-Modell, kein DEB-/IIHF-Standard |

---

### HR-C2-C2 — Staffelung

| Feld | Wert |
|------|------|
| **claim_id** | C2-C2 |
| **Ort** | C2_D2 |
| **Claim** | Tiefenebenen × Verbundenheit × Breite |
| **Warum HR** | „Zu weit / Zu eng“ wertend; drei Dimensionen pro Szene |
| **Was prüfen** | Skalen tragfähig für Live-Beobachtung? |
| **AI-Evidence** | MODERATE partial |
| **Offene Frage** | Dimensionen reduzieren? |
| **human_status** | `NEEDS_CHANGE` |
| **human_notes** | Entscheidung: Drei Dimensionen bleiben und werden schrittweise gezeigt (`structure_fields_progressive`). Abstandslabel jetzt **kurze / mittlere / große Abstände / sehr kurze ohne klare Tiefentrennung / verändern sich / nicht klar** — keine Gut-/Schlecht-Wertung. Breite: **Über die Breite verbunden** statt „Ausgewogen verteilt“. Bubble-Rekonstruktion bleibt; ungefähre Beziehungen > exakte Koordinaten; kein Formationsname aus Bubbles. Coachinghafte MiniFeedback-Fragen entfernt. Active Focus → **Aktiver Fokus**. Angeglichen: C2_D2, theoryData `staffelung`, Glossar Tiefenebene/Verbundenheit. Nach Abnahme → `CONFIRMED_AS_RINQ_MODEL`. |
| **human_source_refs** | DEB-RAHMENRICHTLINIEN-TRAINERAUSBILDUNG-2020 — kollektives Abwehrverhalten / Staffelung: https://www.deb-online.de/download/402/trainer/32893/rahmenrichtlinien-fuer-die-traineraus-fort-und-weiterbildung-fortschreibung-2020.pdf · IIHF-2V2-WITH-OUTLETS — Raumbegrenzung und Support: https://www.iihf.com/en/coaching/19085/2vs2-with-outlets · IIHF-3V3 — Zeit und Raum begrenzen: https://www.iihf.com/en/coaching/18775/3vs3 · RINQ-DEPTH-STRUCTURE-MODEL · RINQ-METHODOLOGY-DECISION |

---

### HR-C2-C3 — Lenkung

| Feld | Wert |
|------|------|
| **claim_id** | C2-C3 |
| **Ort** | C2_D3 |
| **Claim** | Angebotene Route + Ursache + Wirkung |
| **Warum HR** | Dichtes RinQ-Raster; Kernkonzept Steering |
| **Was prüfen** | Dreier-Felder klar? Dump vs. slow_entry trennscharf? |
| **AI-Evidence** | MODERATE — steering/outside |
| **Offene Frage** | Cause-Liste kürzen? |
| **human_status** | `NEEDS_CHANGE` |
| **human_notes** | Entscheidung: Pfad + drei Klassifikationsschritte bleiben (Route, Einflussfaktor, unmittelbare Folge). Leitfrage auf **am ehesten verbleibende Route** unter Raumkontrolle; Disclaimer gegen bewusste Absicht. `Ursache` → **sichtbarer Einflussfaktor** (Key `steeringCause` kompatibel). `schwache Seite` → **puckferne Seite**; Dump-in → **Puck tief spielen**; `Kontrolle der blauen Linie` → **Positionierung an der blauen Linie**. Wirkung als unmittelbare sichtbare Folge formuliert. Progressive Felder. Angeglichen: C2_D3, theoryData `lenkung`, Glossar Lenkung/pucknahe/puckferne. Nach Abnahme → `CONFIRMED_AS_RINQ_MODEL`. |
| **human_source_refs** | IIHF-DEFEND-THE-GATE — Lenken nach außen: https://www.iihf.com/en/coaching/18781/defend-the-gate · IIHF-2V2-WITH-OUTLETS — Druck/Stock/Passunterbrechung: https://www.iihf.com/en/coaching/19085/2vs2-with-outlets · IIHF-2V2-SHOOTING-BOARD — Passwege / zwischen Gegner und Tor: https://www.iihf.com/en/coaching/18952/2vs2-shooting-board · DEB-RAHMENRICHTLINIEN-TRAINERAUSBILDUNG-2020 — Abdrängen: https://www.deb-online.de/download/402/trainer/32893/rahmenrichtlinien-fuer-die-traineraus-fort-und-weiterbildung-fortschreibung-2020.pdf · RINQ-STEERING-OBSERVATION-MODEL · RINQ-TERMINOLOGY-DECISION-DEUTSCH-FIRST · RINQ-METHODOLOGY-DECISION |

---

### HR-C2-C4 — Reaktion nach Durchbruch

| Feld | Wert |
|------|------|
| **claim_id** | C2-C4 |
| **Ort** | C2_D4 |
| **Claim** | Systemanpassung hinter überspielter erster Ebene |
| **Warum HR** | Boundary zu B3 (Einzelzugriff) und Schuldzuweisung |
| **Was prüfen** | Didaktik klar genug? Outcome „gefährlicher Angriff“ zu wertend? |
| **AI-Evidence** | MODERATE — reload/layers |
| **Offene Frage** | Endpoint-Feld nötig oder redundant zu Outcome? |
| **human_status** | `NEEDS_CHANGE` |
| **human_notes** | Entscheidung: C2_D4 = kollektive Systemanpassung nach Überspielen, nicht individuelles Versagen (B3). Endpunkt räumlich erhalten; Label **Ende der beobachteten Reaktion** (nicht Kontrollendpunkt). Reaktionsbegriffe neutralisiert (übernimmt und bleibt verbunden; einzelner Verteidiger reagiert sichtbar; Verbundenheit verloren). Carry/Dump eingedeutscht. Outcome **Direkter zentraler Angriff oder Überzahlsituation** statt „gefährlicher Angriff“. `endpointMeaning` als redundantes Pflichtfeld entfernt (`required: false`, `hidden`/`legacy`); Altdaten lesbar; Bedeutung aus `sequenceOutcome` + Notiz. Progressive Felder. Angeglichen: C2_D4, theoryData `durchbruch`, Glossar überspielte erste Ebene. Nach Abnahme → `CONFIRMED_AS_RINQ_MODEL`. |
| **human_source_refs** | DEB-RAHMENRICHTLINIEN-TRAINERAUSBILDUNG-2020 — kollektives Abwehrverhalten: https://www.deb-online.de/download/402/trainer/32893/rahmenrichtlinien-fuer-die-traineraus-fort-und-weiterbildung-fortschreibung-2020.pdf · IIHF-3V3 — Zeit/Raum, Umschalten: https://www.iihf.com/en/coaching/18775/3vs3 · IIHF-2V2-WITH-OUTLETS: https://www.iihf.com/en/coaching/19085/2vs2-with-outlets · RINQ-RECOVERY-AFTER-BREAKTHROUGH-MODEL · RINQ-CURRICULUM-BOUNDARY-B3-C1-C2-C3 · RINQ-METHODOLOGY-DECISION |

---

### HR-C2-C5 — Neutral-Zone-Beobachtung

| Feld | Wert |
|------|------|
| **claim_id** | C2-C5 |
| **Ort** | C2_D5 |
| **Claim** | Mehrdimensionales Profil ohne Systemlabel / ohne gut-schlecht |
| **Warum HR** | Titel „Profil“ kann wie Team-Identität wirken |
| **Was prüfen** | Copy vs. Disclaimer; Dimensionen-Anzahl |
| **AI-Evidence** | Didaktik MODERATE |
| **Offene Frage** | „Profil“ → „heutige Prinzipien-Beobachtung“? |
| **human_status** | `NEEDS_CHANGE` |
| **human_notes** | Entscheidung: Mehrdimensionale Zusammenfassung bleibt (Weg, Tiefenstaffelung, Lenkung, Reaktion, eigene Zusammenfassung). Framing: **Heutige Neutral-Zone-Beobachtung**; Reflection **Beobachtungen zusammenfassen**; Satzstarter **„Im beobachteten Abschnitt war in der neutralen Zone erkennbar, dass …“**. Disclaimer betont Stichprobe / kein Systemlabel / keine Identität. `riskProfile` nicht mehr Pflicht (`required: false`, `hidden`/`legacy`); Altdaten lesbar, nicht neu berechnet, nicht in sichtbarer Zusammenfassung. Terminologie mit D1–D4 abgeglichen; „Keine stabile Tendenz erkennbar“ vs. „Nicht sicher beurteilbar“ getrennt. Angeglichen: C2_D5, PeriodCheckin-Filter, Session-Validierung, theoryData `profil`, Glossar Neutral-Zone-Beobachtung. Nach Abnahme → `CONFIRMED_AS_RINQ_MODEL`. |
| **human_source_refs** | DEB-RAHMENRICHTLINIEN-TRAINERAUSBILDUNG-2020: https://www.deb-online.de/download/402/trainer/32893/rahmenrichtlinien-fuer-die-traineraus-fort-und-weiterbildung-fortschreibung-2020.pdf · RINQ-NEUTRAL-ZONE-OBSERVATION-MODEL · RINQ-METHODOLOGY-DECISION · RINQ-TERMINOLOGY-DECISION-DEUTSCH-FIRST — Quellen stützen defensive Prinzipien; Zusammenfassungsformat ist RinQ-Modell |

---

## HUMAN_REVIEW_OPTIONAL

### HR-C2-MIN-001 — Profil-Framing

| Feld | Wert |
|------|------|
| **claim_id** | C2-MIN-001 |
| **Ort** | C2_D5 |
| **Claim** | Neutral-Zone-Profil → Heutige Neutral-Zone-Beobachtung; Satzstarter auf beobachteten Abschnitt |
| **human_status** | `NEEDS_CHANGE` |
| **human_notes** | Umgesetzt: Titel/Summary **Heutige Neutral-Zone-Beobachtung**; Starter **„Im beobachteten Abschnitt war in der neutralen Zone erkennbar, dass …“** statt „Dieses Team kontrolliert …“. Nach menschlicher Prüfung → `CONFIRMED`. |
| **human_source_refs** | RINQ-NEUTRAL-ZONE-OBSERVATION-MODEL · RINQ-METHODOLOGY-DECISION |

---

### HR-C2-MIN-002 — „Zu weit / Zu eng“

| Feld | Wert |
|------|------|
| **claim_id** | C2-MIN-002 |
| **Ort** | C2_D2 |
| **Claim** | Abstandskategorien entwerten |
| **human_status** | `NEEDS_CHANGE` |
| **human_notes** | Umgesetzt: `Zu weit auseinander` → **Große Abstände zwischen den Ebenen**; `Zu eng zusammengedrängt` → **Sehr kurze Abstände ohne klare Tiefentrennung**; `Ausgewogen` → **Mittlere Abstände zwischen den Ebenen**. Keine Abstandskategorie automatisch gut/schlecht. Nach Prüfung → `CONFIRMED`. |
| **human_source_refs** | RINQ-DEPTH-STRUCTURE-MODEL · RINQ-METHODOLOGY-DECISION |

---

### HR-C2-MIN-003 — D3/D4 Optionstiefe

| Feld | Wert |
|------|------|
| **claim_id** | C2-MIN-003 |
| **Ort** | C2_D3 / C2_D4 |
| **Claim** | Live-Last vs. Lernschritte |
| **human_status** | `NEEDS_CHANGE` |
| **human_notes** | D3 behält Pfad + drei Klassifikationsschritte; D4 reduziert durch Entfernung von `endpointMeaning` als Pflicht. Alle Dimensionen mit Unklar-Auswahl. Progressive Anzeige reduziert Live-Last; keine zusätzliche Dimension. D3-Ursache → Einflussfaktor. Nach Prüfung → `CONFIRMED_AS_RINQ_MODEL`. |
| **human_source_refs** | RINQ-STEERING-OBSERVATION-MODEL · RINQ-RECOVERY-AFTER-BREAKTHROUGH-MODEL · RINQ-METHODOLOGY-DECISION |

---

## Quellenhinweis (übergreifend)

Die offiziellen Quellen (DEB / IIHF) stützen Raumbegrenzung, Lenken, Passwegkontrolle, defensive Staffelung und Zeit-/Raumdruck. Die konkrete Zusammenstellung der C2-Beobachtungskategorien ist ein **RinQ-Modell** und kein offizieller DEB- oder IIHF-Standard.

---

## Zusammenfassung

| Claim | Status |
|-------|--------|
| HR-C2-C1 … C5 | `NEEDS_CHANGE` (umgesetzt, Abnahme offen) |
| HR-C2-MIN-001 … 003 | `NEEDS_CHANGE` (umgesetzt, Abnahme offen) |
