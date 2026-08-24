# Human Review — E3

**Status:** `NEEDS_CHANGE` (Umsetzung dokumentiert; menschliche Endfreigabe offen)  
**Datum:** 2026-08-24  
**AI-Evidence:** [`e3-content-review.md`](../reviews/e3-content-review.md) · [`e3-sources.md`](../sources/e3-sources.md)  
**Glossar:** [`docs/content/hockey-glossary.md`](../../content/hockey-glossary.md) § E3

**Regel:** AI setzt **niemals** `human_status` auf CONFIRMED / CONFIRMED_AS_RINQ_MODEL / REJECTED.

**Track-Status:** Content + Nennerlogik geschärft · Human **offen**

---

## HUMAN_REVIEW_REQUIRED

### HR-E3-C1 — Ausgangssituation, Zielereignis und Nenner

| Feld | Wert |
|------|------|
| **claim_id** | E3-C1 |
| **Ort** | E3_D1 |
| **Claim** | Rate = Zielereignisse / eindeutig auswertbare Ergebnisse; Unklar separat |
| **Warum HR** | Einstieg Micro-Analytics; Definitionsqualität entscheidet |
| **Was prüfen** | Templates/Beispiele; unklare Ergebnisse nicht als Misserfolg; Absolute sichtbar |
| **AI-Evidence** | MODERATE |
| **human_status** | `NEEDS_CHANGE` |
| **human_notes** | Die Nennerlogik wird geschärft. Alle gültigen Ausgangssituationen werden vollständig erfasst. Eindeutig auswertbare und unklare Ergebnisse werden getrennt ausgewiesen. Ein unklarer Ergebnisfall zählt nicht automatisch als nicht eingetretenes Zielereignis. Die Rate verwendet den eindeutig auswertbaren Nenner; zusätzlich werden unklare Fälle und die Gesamtzahl gültiger Situationen genannt. Templates erhalten klare Einschluss-, Ausschluss-, Start-, End- und Ergebnisregeln. Mindestzahlen bleiben didaktischer Übungsumfang und keine statistische Evidenzschwelle. |
| **human_source_refs** | SRC-DEB-RRL-2020-S12; SRC-STROBE-OBSERVATIONAL-REPORTING; SRC-OBSERVATIONAL-METHODOLOGY-SPORT; RINQ-DECISION-E3-UNCLEAR-OUTCOMES |

---

### HR-E3-C2 — Vergleichsgruppen

| Feld | Wert |
|------|------|
| **claim_id** | E3-C2 |
| **Ort** | E3_D2 |
| **Claim** | Gleiche Messung + primäre Vergleichsdimension; weitere Unterschiede dokumentieren |
| **Warum HR** | Nutzer wollen oft „wer ist besser“ |
| **Was prüfen** | Copy gegen Wertungs-Bias; Vergleichsgruppe statt Cohort in UI |
| **AI-Evidence** | MODERATE |
| **human_status** | `NEEDS_CHANGE` |
| **human_notes** | Der Vergleich verwendet in beiden Gruppen dieselbe Messfrage, dieselbe Definition der Ausgangssituation, dasselbe Zielereignis und dieselbe Ergebnislogik. Es wird eine primäre Vergleichsdimension festgelegt; weitere sichtbare Kontextunterschiede werden dokumentiert, da sie im Spiel nicht vollständig kontrolliert werden können. Pro Gruppe bleiben absolute Zahlen, auswertbare Ergebnisse und unklare Fälle sichtbar. Die UI erzeugt keine Wertung als besser, schlechter oder effektiver. Mindestwerte pro Gruppe sind nur Teil der Lernaufgabe. |
| **human_source_refs** | SRC-STROBE-OBSERVATIONAL-REPORTING; SRC-MATCH-ANALYSIS-TEAM-SPORTS; SRC-SPORTS-ANALYTICS-METHODOLOGY; RINQ-MODEL-E3-COMPARISON-GROUPS |

---

### HR-E3-C3 — Bedingtes Zusammenauftreten

| Feld | Wert |
|------|------|
| **claim_id** | E3-C3 |
| **Ort** | E3_D3 |
| **Claim** | Zusammenauftreten ≠ Ursache; Gegenfälle sichtbar |
| **Warum HR** | Kausalitätsfalle zentral |
| **Was prüfen** | UI macht Gegenfälle leicht genug? |
| **AI-Evidence** | MODERATE |
| **human_status** | `NEEDS_CHANGE` |
| **human_notes** | D3 bleibt auf bedingtes Zusammenauftreten innerhalb der beobachteten Stichprobe begrenzt. Ausgangssituation, Bedingung und Ergebnis werden getrennt erfasst. Fälle mit und ohne Bedingung sowie passende und widersprechende Ergebnisse bleiben vollständig sichtbar. Gegenfälle werden durch die UI leicht erkennbar gemacht, begrenzen oder schärfen eine Aussage, widerlegen einen Zusammenhang aber nicht automatisch. Unklare Bedingungen und Ergebnisse bleiben getrennt. Mindestzahlen sind keine Signifikanz- oder Kausalitätsschwelle. |
| **human_source_refs** | SRC-OBSERVATIONAL-METHODOLOGY-SPORT; SRC-MATCH-ANALYSIS-TEAM-SPORTS; SRC-SPORTS-ANALYTICS-METHODOLOGY; RINQ-MODEL-E3-CONDITIONAL-ASSOCIATION |

---

### HR-E3-C4 — Mehrdimensionale Evidenzbewertung

| Feld | Wert |
|------|------|
| **claim_id** | E3-C4 |
| **Ort** | E3_D4 |
| **Claim** | Tragfähigkeit der Beobachtungsgrundlage; kein p-Wert/Score |
| **Warum HR** | Produktentscheidung gegen Inferenzstatistik |
| **Was prüfen** | Dimensionen der Assessment-UI; solid_picture → konsistentes Stichprobenbild |
| **AI-Evidence** | MODERATE (RinQ) |
| **human_status** | `NEEDS_CHANGE` |
| **human_notes** | Die Evidenzbewertung bleibt eine qualitative RinQ-Lernhilfe ohne p-Wert, Signifikanz, Konfidenzintervall oder automatischen Gesamtscore. Der sichtbare Begriff wird als Tragfähigkeit der Beobachtungsgrundlage geschärft. Getrennt geprüft werden Definitionsklarheit, Vollständigkeit, Stichprobengröße, unklare Fälle, Gruppenbalance, Vergleichbarkeit, Kontextunterschiede, Gegenfälle und Stabilität des beobachteten Unterschieds. Auch die höchste Kategorie bleibt ein konsistentes Bild innerhalb der Stichprobe und keine wissenschaftliche Sicherheit. |
| **human_source_refs** | SRC-STROBE-OBSERVATIONAL-REPORTING; SRC-OBSERVATIONAL-METHODOLOGY-SPORT; SRC-PERFORMANCE-ANALYSIS-VALIDITY-RELIABILITY; RINQ-MODEL-E3-EVIDENCE-ASSESSMENT |

---

### HR-E3-C5 — Aussagestufen

| Feld | Wert |
|------|------|
| **claim_id** | E3-C5 |
| **Ort** | E3_D5 |
| **Claim** | Sprache ≤ Beobachtungsgrundlage; Stufen 0–4; Ursache nicht erreichbar |
| **Warum HR** | Abschluss Track-Logik E3 |
| **Was prüfen** | Aussagestufen klar; keine Kausalstufe |
| **AI-Evidence** | MODERATE |
| **human_status** | `NEEDS_CHANGE` |
| **human_notes** | Claim Ladder und Claim Ceiling werden in der sichtbaren UI durch Aussagestufen und höchstens vertretbare Aussage ersetzt. Die Stufen reichen von keiner inhaltlichen Aussage über Stichprobenbeschreibung und Stichprobenvergleich bis zu einem vorläufigen Zusammenhang innerhalb der Stichprobe. Ein wiederkehrender Hinweis über mehrere Stichproben ist nur bei tatsächlich getrennten und konsistent definierten Beobachtungen zulässig. Ursache, allgemeine Teamwahrheit, Zukunftswahrscheinlichkeit und taktische Empfehlung sind mit E3 allein keine erreichbaren Stufen. Jede Aussage nennt Zahlen, Nenner, unklare Fälle, Grenzen und nächsten Beobachtungsschritt. |
| **human_source_refs** | SRC-STROBE-OBSERVATIONAL-REPORTING; SRC-SPORTS-ANALYTICS-METHODOLOGY; SRC-OUTCOME-BIAS-SPORT; RINQ-MODEL-E3-STATEMENT-LADDER |

---

## HUMAN_REVIEW_OPTIONAL

### HR-E3-MIN-001 — „Gute Analyse“

| **claim_id** | E3-MIN-001 | **human_status** | `NEEDS_CHANGE` |
| **Ort** | E3 Copy / D5 | **AI-Evidence** | MODERATE |
| **human_notes** | Gute Analyse wird durch nachvollziehbare, transparente beziehungsweise zur Beobachtungsgrundlage passende Analyse ersetzt. Die Qualität wird nicht pauschal etikettiert, sondern über konkrete Kriterien wie Definitionsklarheit, vollständige Erfassung, sichtbare Unklarheit und angemessene Aussagestärke beschrieben. |
| **human_source_refs** | SRC-STROBE-OBSERVATIONAL-REPORTING; RINQ-METHODOLOGY-E3-TRANSPARENT-REPORTING |

### HR-E3-MIN-002 — Anzahl der Lernziele

| **claim_id** | E3-MIN-002 | **human_status** | `NEEDS_CHANGE` |
| **Ort** | E3 Modul | **AI-Evidence** | MODERATE |
| **human_notes** | Die acht teilweise redundanten Lernziele werden auf sechs operationale Ziele reduziert: Definition, transparente Nennerlogik, Vergleichsgruppen, bedingtes Zusammenauftreten, mehrdimensionale Prüfung der Beobachtungsgrundlage und angemessene Aussagestärke. Analyse objektiver machen, ohne sie zu entmenschlichen wird als Haltung in die Einleitung verschoben. |
| **human_source_refs** | SRC-IIHF-CEF-2025; RINQ-DECISION-E3-LEARNING-GOALS |
