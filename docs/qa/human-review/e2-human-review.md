# Human Review — E2

**Status:** `NEEDS_CHANGE` (Implementierung erfolgt · Endfreigabe offen)  
**Datum:** 2026-08-24  
**AI-Evidence:** [`e2-content-review.md`](../reviews/e2-content-review.md) · [`e2-sources.md`](../sources/e2-sources.md)  
**Glossar:** [`docs/content/hockey-glossary.md`](../../content/hockey-glossary.md) § E2

**Regel:** AI setzt **niemals** `human_status` auf CONFIRMED / CONFIRMED_AS_RINQ_MODEL / REJECTED.

**Track-Status:** Spielanpassungen erkennen · German-first · 0–2 Kandidaten · Human **offen**

---

## HUMAN_REVIEW_REQUIRED

### HR-E2-C1 — Vorher–Nachher

| Feld | Wert |
|------|------|
| **claim_id** | E2-C1 |
| **Ort** | E2_D1 |
| **Claim** | Veränderung beschreiben vor Erklären; Vergleichbarkeit operationalisieren |
| **Warum HR** | Einstieg Adjustment-Lesen → Spielanpassung |
| **Was prüfen** | Vergleichbarkeits-UI; keine Veränderung erzwingen; Spielstand als Kontext |
| **AI-Evidence** | MODERATE |
| **human_status** | `NEEDS_CHANGE` |
| **human_notes** | Die Regel Veränderung beschreiben vor Erklären bleibt erhalten. Ausreichend ähnliche Abschnitte werden über Spielphase, Zone, numerische Situation, Puckbesitz, Gegnerdruck, sichtbare Rollen und Spielkontext operationalisiert. Unterschiede und Grenzen des Vergleichs müssen dokumentiert werden. Keine klare Veränderung, nicht sinnvoll vergleichbar und nicht sicher beurteilbar werden als gültige Ergebnisse ergänzt. Confidence wird bevorzugt durch eine transparente Beobachtungsgrundlage ersetzt. |
| **human_source_refs** | SRC-DEB-RRL-2020-S12; SRC-IIHF-CEF-2025; SRC-OBSERVATIONAL-METHODOLOGY-SPORT-2017; RINQ-MODEL-E2-BEFORE-AFTER |

---

### HR-E2-C2 — Timeline / möglicher Veränderungszeitpunkt

| Feld | Wert |
|------|------|
| **claim_id** | E2-C2 |
| **Ort** | E2_D2 |
| **Claim** | Manuelle Timeline; kein erzwungener Veränderungszeitpunkt; 4 = Übungsminimum |
| **Warum HR** | Abgrenzung zu statistischem Change Point |
| **Was prüfen** | Labels; gültige Abschlüsse inkl. Rücksprung |
| **AI-Evidence** | MODERATE |
| **human_status** | `NEEDS_CHANGE` |
| **human_notes** | Change Point wird in der UI durch möglicher Veränderungszeitpunkt ersetzt. Die Folge lautet Ausgangsbeobachtungen, erste Abweichung, weitere vergleichbare Beobachtungen und mögliche anhaltende Veränderung. Vier Beobachtungen bleiben eine didaktische Mindestmenge und sind kein allgemeiner Nachweis eines neuen Zustands. Ein Veränderungszeitpunkt wird nicht erzwungen; einzelne Abweichung, Rücksprung, keine anhaltende Veränderung und nicht ausreichend beobachtet sind gültige Ergebnisse. |
| **human_source_refs** | SRC-CHANGEPOINT-TEAM-SPORT-2022; SRC-OBSERVATIONAL-METHODOLOGY-SPORT-2017; RINQ-MODEL-E2-MANUAL-CHANGE-TIMELINE |

---

### HR-E2-C3 — Anpassungshypothese

| Feld | Wert |
|------|------|
| **claim_id** | E2-C3 |
| **Ort** | E2_D3 |
| **Claim** | Offene prüfbare Hypothese; keine Coachingabsicht |
| **Warum HR** | Interpretationsgrenze |
| **Was prüfen** | Alternative; funktionale Passung optional fehlend; Beispiele |
| **AI-Evidence** | MODERATE |
| **human_status** | `NEEDS_CHANGE` |
| **human_notes** | D3 bleibt eine ausdrücklich offene Anpassungshypothese. Zeitliche Reihenfolge und funktionale Passung sind Hinweise, keine Ursachenbelege. Problem wird je nach Kontext durch vorherige Herausforderung oder beobachtete Interaktion ersetzt. Die UI trennt Veränderung, möglichen Anlass, funktionale Passung, alternative Erklärung, Gegenbeobachtung und Informationslücke. Gute Hypothese wird durch prüfbare beziehungsweise nachvollziehbar dokumentierte Hypothese ersetzt. Coachingabsicht darf nicht behauptet werden. |
| **human_source_refs** | SRC-IIHF-CDF-2025; SRC-IIHF-CEF-2025; SRC-SPORTS-ANALYTICS-METHODOLOGY-2024; RINQ-MODEL-E2-ADJUSTMENT-HYPOTHESIS |

---

### HR-E2-C4 — Interaktionskette

| Feld | Wert |
|------|------|
| **claim_id** | E2_C4 / E2-C4 |
| **Ort** | E2_D4 |
| **Claim** | Folgeinteraktion ohne Erfolgsbewertung aus Outcomes |
| **Warum HR** | Outcome Bias |
| **Was prüfen** | Titel; Kategorien; Tor≠Erfolg |
| **AI-Evidence** | MODERATE |
| **human_status** | `NEEDS_CHANGE` |
| **human_notes** | D4 wird von Hat das Adjustment das Problem verändert? zu Wie entwickelt sich die vergleichbare Interaktion danach? umformuliert. Dieselbe Interaktion wird über ausreichend ähnliche Ausgangslage, Gegnerverhalten, eigenes Verhalten und relevante Räume oder Optionen erklärt. Die Kategorien beschreiben veränderte, teilweise veränderte, unveränderte, verlagerte oder nicht ausreichend beobachtete Interaktionen. Tore und andere Einzelergebnisse beweisen weder Erfolg noch Misserfolg. |
| **human_source_refs** | SRC-OUTCOME-BIAS-SPORT-2019; SRC-OUTCOME-BIAS-COACHING-2023; SRC-MATCH-ANALYSIS-TEAM-SPORTS-2022; RINQ-MODEL-E2-INTERACTION-CHAIN |

---

### HR-E2-C5 — Segment-Anpassungen

| Feld | Wert |
|------|------|
| **claim_id** | E2-C5 |
| **Ort** | E2_D5 |
| **Claim** | 0–2 Kandidaten; Signal ≠ Interpretationssicherheit; kein Profil |
| **Warum HR** | Synthese |
| **Was prüfen** | minAdjustments=0; UI ohne Adjustment-Profil |
| **AI-Evidence** | Didaktik MODERATE |
| **human_status** | `NEEDS_CHANGE` |
| **human_notes** | Adjustment-Profil wird durch mögliche Spielanpassungen im beobachteten Segment ersetzt. Maximal zwei Kandidaten bleiben sinnvoll; null ausreichend gestützte Kandidaten ist ein vollständiger Abschluss. Jeder Kandidat dokumentiert Vorher, Nachher, Vergleichbarkeit, Wiederholung, Hypothese, alternative Erklärung, Folgeinteraktion, Problemverlagerung und nächste Beobachtung. Beobachtungssignal und subjektive Sicherheit der Interpretation werden getrennt. Es entsteht kein dauerhaftes Teamprofil. |
| **human_source_refs** | SRC-IIHF-CEF-2025; SRC-OBSERVATIONAL-METHODOLOGY-SPORT-2017; SRC-SPORTS-ANALYTICS-METHODOLOGY-2024; RINQ-MODEL-E2-SEGMENT-ADJUSTMENTS |

---

## HUMAN_REVIEW_OPTIONAL

### HR-E2-MIN-001 — Goals „Bewerte“ / „coachbare“

| Feld | Wert |
|------|------|
| **claim_id** | E2-MIN-001 |
| **human_status** | `NEEDS_CHANGE` |
| **human_notes** | Die Lernziele Bewerte Adjustments und formuliere coachbare Verhaltensänderungen werden geändert. E2 beobachtet und ordnet mögliche Spielanpassungen ein; es bewertet keine Coachingentscheidung und formuliert noch keine aktive Coachingmaßnahme. German-first wird Adjustment durch Spielanpassung ersetzt. |
| **human_source_refs** | SRC-DEB-RRL-2020-S12; SRC-IIHF-CEF-2025; RINQ-METHODOLOGY-E2-OBSERVE-BEFORE-PRESCRIBE |

### HR-E2-MIN-002 — „gute Hypothese“

| Feld | Wert |
|------|------|
| **claim_id** | E2-MIN-002 |
| **human_status** | `NEEDS_CHANGE` |
| **human_notes** | Gute Hypothese wird durch prüfbare beziehungsweise nachvollziehbar dokumentierte Hypothese ersetzt. Qualität wird nicht pauschal bewertet. Entscheidend sind getrennte Beobachtung, funktionale Passung, Alternativerklärung, Gegenbeobachtung und benannte Informationsgrenzen. |
| **human_source_refs** | SRC-SPORTS-ANALYTICS-METHODOLOGY-2024; RINQ-MODEL-E2-ADJUSTMENT-HYPOTHESIS |

### HR-E2-MIN-003 — „Ursache vs. Symptom“ Framing

| Feld | Wert |
|------|------|
| **claim_id** | E2-MIN-003 |
| **human_status** | `NEEDS_CHANGE` |
| **human_notes** | Das harte Framing Ursache versus Symptom wird entfernt. Aus wenigen Spielszenen können Ursachen normalerweise nicht verlässlich bestimmt werden. E2 unterscheidet stattdessen sichtbare Veränderung, vorher beobachtete Herausforderung, mögliche Erklärung, alternative Erklärung und spätere Folgebeobachtung. |
| **human_source_refs** | SRC-SPORTS-ANALYTICS-METHODOLOGY-2024; RINQ-METHODOLOGY-NO-CAUSAL-CLAIM |

---

## Zusammenfassung

| Priorität | Anzahl |
|-----------|--------|
| **REQUIRED** | **5** (C1–C5) |
| **OPTIONAL** | **3** |

Alle bearbeiteten Claims bleiben `NEEDS_CHANGE`, bis Christoph die Umsetzung geprüft hat.
