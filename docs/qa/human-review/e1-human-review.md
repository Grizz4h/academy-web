# Human Review — E1

**Status:** `NEEDS_CHANGE` (Implementierung erfolgt · Endfreigabe offen)  
**Datum:** 2026-08-24  
**AI-Evidence:** [`e1-content-review.md`](../reviews/e1-content-review.md) · [`e1-sources.md`](../sources/e1-sources.md)  
**Glossar:** [`docs/content/hockey-glossary.md`](../../content/hockey-glossary.md) § E1

**Regel:** AI setzt **niemals** `human_status` auf CONFIRMED / CONFIRMED_AS_RINQ_MODEL / REJECTED.

**Track-Status:** methodische Schärfung umgesetzt (Vergleichsmerkmale · Gegenfälle · stabil/variabel · Kontextstabilität · Segment-Tendenzen inkl. null) · Human **offen**

**Priorität:** alle Kerntaxonomien / Methoden-Claims REQUIRED.

---

## HUMAN_REVIEW_REQUIRED

### HR-E1-C1 — Wiederholung ≠ Muster

| Feld | Wert |
|------|------|
| **claim_id** | E1-C1 |
| **Ort** | E1_D1 |
| **Claim** | Vergleichsmerkmale nötig; Ergebnis-Ähnlichkeit reicht nicht; drei Fälle = didaktische Mindestmenge |
| **Warum HR** | Einstieg Track E; Kernmethode |
| **Was prüfen** | Dimensionen-Set; Min-Observations-Copy; Abschlussoptionen inkl. nicht ausreichend beobachtet |
| **AI-Evidence** | MODERATE |
| **human_status** | `NEEDS_CHANGE` |
| **human_notes** | Die Grundidee bleibt erhalten: Ergebnisähnlichkeit allein genügt nicht; mehrere Situationen werden anhand sichtbarer Vergleichsmerkmale geprüft. Zone, Auslöser, Reaktion, Ablauf und Positionierung bilden das überschaubare Kernset. Seite bleibt ein ergänzendes Kontextmerkmal. Drei Beobachtungen sind ausschließlich die didaktische Mindestmenge der Übung und kein Nachweis einer allgemeinen Teamtendenz. Nicht ausreichend beobachtet wird als gültiges Ergebnis ergänzt. Pattern Fingerprint wird in der UI durch Vergleichsmerkmale ersetzt. |
| **human_source_refs** | SRC-DEB-RRL-2020-S12; SRC-IIHF-CEF-2025; SRC-OBSERVATIONAL-METHODOLOGY-SPORT-2017; RINQ-MODEL-E1-COMPARISON-FEATURES |

---

### HR-E1-C2 — Bedingungen / Gegenfälle

| Feld | Wert |
|------|------|
| **claim_id** | E1-C2 |
| **Ort** | E1_D2 |
| **Claim** | Bedingungen + Gegenfälle schärfen die Formulierung ohne Kausalität |
| **Warum HR** | Didaktisch stark; Lernaufwand hoch |
| **Was prüfen** | Gegenfall-UI (Vergleichbarkeit, Abweichung, Schärfung, Bildausschnitt) |
| **AI-Evidence** | MODERATE |
| **human_status** | `NEEDS_CHANGE` |
| **human_notes** | Bedingungen und Gegenfälle bleiben Teil der Methode. Ein Gegenfall muss eine ausreichend ähnliche Ausgangslage mit abweichendem Verhalten zeigen. Er kann eine Tendenz einschränken oder schärfen, widerlegt sie aber nicht automatisch. Ein fehlender Gegenfall stärkt die Tendenz ebenfalls nicht. Die UI muss Vergleichbarkeit, sichtbare Abweichung und die mögliche Schärfung der Formulierung getrennt erfassen. Kausalsprache und Aussagen über notwendige Bedingungen werden entfernt. |
| **human_source_refs** | SRC-IIHF-CEF-2025; SRC-OBSERVATIONAL-METHODOLOGY-SPORT-2017; SRC-MATCH-ANALYSIS-TEAM-SPORTS-2022; RINQ-MODEL-E1-COUNTERCASE |

---

### HR-E1-C3 — Stabile und variable Merkmale

| Feld | Wert |
|------|------|
| **claim_id** | E1-C3 |
| **Ort** | E1_D3 |
| **Claim** | Stabile/variable Merkmale statt absoluter Invariante; funktionaler Kern als RinQ-Arbeitsbegriff |
| **Warum HR** | Abstraktester Schritt |
| **Was prüfen** | UI-Begriffe; targetEffect als sichtbare Folge; nicht alle Dimensionen Pflicht-Kern |
| **AI-Evidence** | MODERATE (modellhaft) |
| **human_status** | `NEEDS_CHANGE` |
| **human_notes** | Der abstrakte und absolute Begriff Invariante wird in der UI durch stabile und variable Merkmale ersetzt. Funktionaler Kern bleibt als erklärter RinQ-Arbeitsbegriff: wenige Merkmale, die in den bisher verglichenen Situationen trotz unterschiedlicher Ausführung ähnlich bleiben. Die Kategorien lauten bisher stabil beobachtet, häufig ähnlich, variabel und nicht ausreichend beurteilbar. targetEffect darf keine beabsichtigte oder verursachte Wirkung unterstellen und wird beobachtbar formuliert. |
| **human_source_refs** | SRC-OBSERVATIONAL-METHODOLOGY-SPORT-2017; SRC-MATCH-ANALYSIS-TEAM-SPORTS-2022; RINQ-MODEL-E1-STABLE-VARIABLE-FEATURES |

---

### HR-E1-C4 — Kontextstabilität (keine Attribution)

| Feld | Wert |
|------|------|
| **claim_id** | E1-C4 |
| **Ort** | E1_D4 |
| **Claim** | Kontextstabilität statt strukturell/situativ/gegnerbedingt/personell/spielstandsbedingt |
| **Warum HR** | Stärkste inhaltliche Umbauentscheidung |
| **Was prüfen** | Labels, Beobachtungsgrundlage, Hypothesen-Disclaimer, keine objektive Confidence |
| **AI-Evidence** | MODERATE |
| **human_status** | `NEEDS_CHANGE` |
| **human_notes** | Die Attribution strukturell / situativ / gegnerbedingt / personell / spielstandsbedingt wird verworfen. Wenige Beobachtungen erlauben keine verlässliche Ursachenzuordnung, und mehrere Kontexte können gleichzeitig wirken. D4 prüft künftig, in welchen sichtbaren Kontexten eine Tendenz erneut auftritt, abweicht oder nicht ausreichend beobachtet wurde. Mögliche Ursachen dürfen nur als ausdrücklich offene Hypothesen dokumentiert werden. Confidence wird nicht als objektive Wahrscheinlichkeit behandelt; bevorzugt wird eine transparente Beobachtungsgrundlage. |
| **human_source_refs** | SRC-IIHF-CDF-2025; SRC-IIHF-CEF-2025; SRC-OBSERVATIONAL-METHODOLOGY-SPORT-2017; SRC-SPORTS-ANALYTICS-METHODOLOGY-2024; RINQ-DECISION-E1-REMOVE-CAUSAL-ATTRIBUTION |

---

### HR-E1-C5 — Tendenzen im beobachteten Segment

| Feld | Wert |
|------|------|
| **claim_id** | E1-C5 |
| **Ort** | E1_D5 |
| **Claim** | Segmentbezogene vorläufige Tendenzen; null gültig; kein Tendenzprofil als Teamidentität |
| **Warum HR** | Synthese-Schritt; Profil-Risiko |
| **Was prüfen** | minTendencies=0; Pflichtfelder nur wenn Tendenzen vorliegen |
| **AI-Evidence** | Didaktik MODERATE |
| **human_status** | `NEEDS_CHANGE` |
| **human_notes** | Tendenzprofil wird in der UI durch Tendenzen im beobachteten Segment ersetzt. Maximal drei Tendenzen bleiben sinnvoll; zugleich muss null belastbare Tendenzen ein gültiger Abschluss sein. Jede Tendenz enthält Beobachtungsgrundlage, wiederkehrende und variable Merkmale, Bedingungen, Gegenfälle, Aussagegrenze und nächste Prüfbeobachtung. Stärkste Tendenz und next watch sind nur verpflichtend, wenn mindestens eine Tendenz vorliegt. Es entsteht keine historische oder dauerhafte Teamwahrheit. |
| **human_source_refs** | SRC-IIHF-CEF-2025; SRC-OBSERVATIONAL-METHODOLOGY-SPORT-2017; SRC-MATCH-ANALYSIS-TEAM-SPORTS-2022; SRC-SPORTS-ANALYTICS-METHODOLOGY-2024; RINQ-MODEL-E1-SEGMENT-TENDENCIES |

---

## HUMAN_REVIEW_OPTIONAL

### HR-E1-MIN-001 — Goal „Bewerte“

| Feld | Wert |
|------|------|
| **claim_id** | E1-MIN-001 |
| **human_status** | `NEEDS_CHANGE` |
| **human_notes** | Das Lernziel Bewerte Spielverlauf unabhängig vom Spielstand wird zu Ordne Beobachtungen unabhängig vom unmittelbaren Ergebnis und mit dokumentiertem Spielkontext ein geändert. Der Spielstand wird nicht ignoriert, sondern als möglicher Kontext getrennt vom Ergebnisurteil erfasst. |
| **human_source_refs** | SRC-DEB-RRL-2020-S12; SRC-IIHF-CEF-2025; RINQ-METHODOLOGY-OBSERVATION-NOT-EVALUATION |

### HR-E1-MIN-002 — „Ursachen“-Sprache D4

| Feld | Wert |
|------|------|
| **claim_id** | E1-MIN-002 |
| **human_status** | `NEEDS_CHANGE` |
| **human_notes** | Ursachen-Sprache in D4 wird entfernt. Der Drill fragt nicht mehr, warum ein Muster auftritt, sondern in welchen beobachteten Kontexten es erneut sichtbar wird oder abweicht. Erklärungen bleiben optional gekennzeichnete Hypothesen. |
| **human_source_refs** | SRC-SPORTS-ANALYTICS-METHODOLOGY-2024; RINQ-DECISION-E1-REMOVE-CAUSAL-ATTRIBUTION |

### HR-E1-MIN-003 — Summary-Titel Härte

| Feld | Wert |
|------|------|
| **claim_id** | E1-MIN-003 |
| **human_status** | `NEEDS_CHANGE` |
| **human_notes** | Harte Summary-Begriffe werden abgeschwächt. Mögliches Muster, Geprüftes Muster, Funktionaler Kern und Tendenzprofil werden je nach Drill durch Hinweis auf eine mögliche Tendenz, Bedingungen der bisherigen Beobachtungen, stabile und variable Merkmale sowie Tendenzen im beobachteten Segment ersetzt. Jede Zusammenfassung bleibt vorläufig und segmentbezogen. |
| **human_source_refs** | SRC-OBSERVATIONAL-METHODOLOGY-SPORT-2017; RINQ-MODEL-E1-SEGMENT-TENDENCIES |

---

## Zusammenfassung

| Priorität | Anzahl |
|-----------|--------|
| **REQUIRED** | **5** (C1–C5) |
| **OPTIONAL** | **3** |

Alle bearbeiteten Claims bleiben `NEEDS_CHANGE`, bis Christoph die Umsetzung geprüft hat.
