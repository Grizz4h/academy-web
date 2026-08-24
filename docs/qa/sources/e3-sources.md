# E3 — Evidence Sources

**Datum:** 2026-08-24 (HR-Schärfung)  
**Scope:** HR-E3-C1 … C5 · MIN-001/002  
**Status:** Recherche · Human Review **offen** (`NEEDS_CHANGE`)

---

## Quellen-Katalog

| Ref-ID | Autor / Organisation | Titel | Jahr | URL / Ort | Typ |
|--------|---------------------|-------|------|-----------|-----|
| **SRC-DEB-RRL-2020-S12** | Deutscher Eishockey-Bund e.V. | Rahmenrichtlinien für die Traineraus-, -fort- und -weiterbildung, Fortschreibung 2020, S. 12 | 2020 | [DEB PDF](https://www.deb-online.de/download/402/trainer/32893/rahmenrichtlinien-fuer-die-traineraus-fort-und-weiterbildung-fortschreibung-2020.pdf) · lokal: `/Users/christoph/Downloads/Rahmenrichtlinien-fuer-die-Traineraus-fort-und-weiterbildung-Fortschreibung-2020.pdf` | Primär (Ausbildung) |
| **SRC-IIHF-CEF-2025** | IIHF | Coach Education Framework | 2025 | [IIHF PDF](https://blob.iihf.com/iihf-media/iihfmvc/media/downloads/sport%20files/development-guide/coaching/iihf_coacheducationframework_digital_12052025-v1.pdf) | Primär (Ausbildung) |
| **SRC-STROBE-OBSERVATIONAL-REPORTING** | STROBE Initiative | Checklist for observational studies | — | [STROBE checklist](https://www.strobe-statement.org/fileadmin/Strobe/uploads/checklists/STROBE_checklist_v4_combined.pdf) | Methoden (Medizin) |
| **SRC-OBSERVATIONAL-METHODOLOGY-SPORT** | Anguera et al. | The Specificity of Observational Studies in Physical Activity and Sports Sciences | 2017 | [PMC5742273](https://pmc.ncbi.nlm.nih.gov/articles/PMC5742273/) | Methoden (Sport) |
| **SRC-MATCH-ANALYSIS-TEAM-SPORTS** | — | Match Analysis in Team Ball Sports: An Umbrella Review | 2022 | [PMC9100301](https://pmc.ncbi.nlm.nih.gov/articles/PMC9100301/) | Review |
| **SRC-SPORTS-ANALYTICS-METHODOLOGY** | — | Methodology and evaluation in sports analytics | 2024 | [Springer](https://link.springer.com/article/10.1007/s10994-024-06585-0) | Methoden |
| **SRC-PERFORMANCE-ANALYSIS-VALIDITY-RELIABILITY** | Francis et al. | The landscape of validity and reliability practices from applied performance analysts | 2025 | [SAGE](https://journals.sagepub.com/doi/10.1177/17479541251317043) | Methoden |
| **SRC-OUTCOME-BIAS-SPORT** | Kausel et al. | Outcome bias in subjective ratings of performance | 2019 | [ScienceDirect](https://www.sciencedirect.com/science/article/pii/S0167487017307614) | Empirie (Fußball) |

### Beleggrenzen (externe Quellen)

| Ref-ID | Beleggrenze |
|--------|-------------|
| SRC-DEB-RRL-2020-S12 | Definiert keine konkrete Nenner-, Raten- oder Evidenzmethodik. |
| SRC-IIHF-CEF-2025 | Stützt dokumentierte Evidenzsammlung und Reflexion, aber keine konkrete E3-Statistikmethodik. |
| SRC-STROBE-OBSERVATIONAL-REPORTING | Medizinische Berichtsleitlinie. Stützt Transparenz bei Variablen, Fallzahlen und fehlenden Daten; validiert weder E3 noch die konkreten RinQ-Berechnungen. |
| SRC-OBSERVATIONAL-METHODOLOGY-SPORT | Sportübergreifende Methodenquelle; keine eishockeyspezifische Validierung von E3. |
| SRC-MATCH-ANALYSIS-TEAM-SPORTS | Stützt Kontext- und Qualitätsgrenzen von Matchanalyse, aber keine konkrete RinQ-Taxonomie. |
| SRC-SPORTS-ANALYTICS-METHODOLOGY | Allgemeine methodische Quelle; keine eishockeyspezifische Stichprobenschwelle. |
| SRC-PERFORMANCE-ANALYSIS-VALIDITY-RELIABILITY | Stützt valide Definitionen und zuverlässige Erfassung; validiert nicht die RinQ-Kategorien. |
| SRC-OUTCOME-BIAS-SPORT | Empirischer Beleg für Ergebnisverzerrung im Fußball; keine direkte E3-Validierung. |

---

## Interne RinQ-Referenzen

### RINQ-DECISION-E3-UNCLEAR-OUTCOMES

- **Entscheidung:** Rate = Zielereignisse / eindeutig auswertbare Ergebnisse. Unklare Ergebnisse werden vollständig gespeichert, separat ausgewiesen und nicht als Misserfolg behandelt.
- **Warum:** Sonst werden unklare Fälle still wie Nicht-Zielereignisse behandelt und verzerren die Stichprobenrate.
- **Externe Anschlüsse:** SRC-STROBE-OBSERVATIONAL-REPORTING (fehlende Daten transparent); SRC-DEB-RRL-2020-S12 (Analyse als Ausbildungsthema).
- **Beleggrenze:** Kein offizielles DEB-/IIHF-/Statistikmodell für diese Nennerformel.
- **Kein offizielles Modell:** RinQ-Produktentscheidung für Lerntransparenz.

### RINQ-MODEL-E3-COMPARISON-GROUPS

- **Entscheidung:** Gleiche Messdefinition in beiden Vergleichsgruppen; eine primäre Vergleichsdimension; weitere sichtbare Kontextunterschiede dokumentieren; keine automatische Besser/Schlechter-Wertung.
- **Warum:** Im Spiel sind Kontextdimensionen nicht vollständig kontrollierbar; Wertungs-Bias soll verhindert werden.
- **Externe Anschlüsse:** SRC-STROBE; SRC-MATCH-ANALYSIS-TEAM-SPORTS; SRC-SPORTS-ANALYTICS-METHODOLOGY.
- **Beleggrenze:** Keine eishockeyspezifische Validierung der RinQ-UI-Regeln.
- **Kein offizielles Modell:** RinQ-Lernmodell.

### RINQ-MODEL-E3-CONDITIONAL-ASSOCIATION

- **Entscheidung:** Bedingtes Zusammenauftreten in der Stichprobe; Gegenfälle sichtbar; keine Ursache.
- **Warum:** Kausalitätsfalle ist zentral in Beobachtungsanalysen.
- **Externe Anschlüsse:** SRC-OBSERVATIONAL-METHODOLOGY-SPORT; SRC-MATCH-ANALYSIS-TEAM-SPORTS; SRC-SPORTS-ANALYTICS-METHODOLOGY.
- **Beleggrenze:** Logik/Methodenkonvention, keine Hockey-Empirie zu E3-Templates.
- **Kein offizielles Modell:** RinQ-Lernmodell.

### RINQ-MODEL-E3-EVIDENCE-ASSESSMENT

- **Entscheidung:** Qualitative Tragfähigkeit der Beobachtungsgrundlage ohne p-Werte, Konfidenzintervalle oder automatischen Gesamtscore; Kategorien bleiben stichprobengebunden.
- **Warum:** Mini-Samples laden zu Schein-Statistik ein; Produktentscheidung gegen Fake Certainty.
- **Externe Anschlüsse:** SRC-STROBE; SRC-OBSERVATIONAL-METHODOLOGY-SPORT; SRC-PERFORMANCE-ANALYSIS-VALIDITY-RELIABILITY.
- **Beleggrenze:** Validiert nicht die konkreten RinQ-Kategorien.
- **Kein offizielles Modell:** RinQ-Didaktik.

### RINQ-MODEL-E3-STATEMENT-LADDER

- **Entscheidung:** Aussagestufen 0–4; Ursache/Teamwahrheit/Zukunfts-%/taktische Empfehlung nicht erreichbar; App warnt bei Überziehung, berechnet Stufe nicht als objektiv richtig.
- **Warum:** Sprache darf nicht stärker sein als die Beobachtungsgrundlage (Outcome-Bias-Risiko).
- **Externe Anschlüsse:** SRC-STROBE; SRC-SPORTS-ANALYTICS-METHODOLOGY; SRC-OUTCOME-BIAS-SPORT.
- **Beleggrenze:** Keine direkte E3-Validierung.
- **Kein offizielles Modell:** RinQ-Lernmodell.

### RINQ-METHODOLOGY-E3-TRANSPARENT-REPORTING

- **Entscheidung:** „Gute Analyse“ → nachvollziehbar / transparent / zur Beobachtungsgrundlage passend; Kriterien statt Etikett.
- **Warum:** Pauschale Qualitätsetiketten verdecken fehlende Definition/Unklarheit.
- **Externe Anschlüsse:** SRC-STROBE.
- **Beleggrenze:** STROBE validiert nicht RinQ-Copy.
- **Kein offizielles Modell:** RinQ-Sprachregel.

### RINQ-DECISION-E3-LEARNING-GOALS

- **Entscheidung:** Sechs operationale Lernziele; Haltung „nicht entmenschlichen“ in der Einleitung.
- **Warum:** Acht Ziele waren teilweise redundant; operationale Ziele steuern Drills klarer.
- **Externe Anschlüsse:** SRC-IIHF-CEF-2025 (Reflexion/Evidenzsammlung als Haltung).
- **Beleggrenze:** IIHF definiert keine E3-Lernziel-Liste.
- **Kein offizielles Modell:** RinQ-Curriculum-Entscheidung.

---

## Claim-Evidence-Matrix (nach HR)

| Claim | Quellen | evidence_strength |
|-------|---------|-------------------|
| E3-C1 Nenner | SRC-DEB-RRL-2020-S12 · SRC-STROBE · SRC-OBSERVATIONAL-METHODOLOGY-SPORT · RINQ-DECISION-E3-UNCLEAR-OUTCOMES | MODERATE |
| E3-C2 Vergleich | SRC-STROBE · SRC-MATCH-ANALYSIS · SRC-SPORTS-ANALYTICS · RINQ-MODEL-E3-COMPARISON-GROUPS | MODERATE |
| E3-C3 Bedingung | SRC-OBSERVATIONAL · SRC-MATCH-ANALYSIS · SRC-SPORTS-ANALYTICS · RINQ-MODEL-E3-CONDITIONAL-ASSOCIATION | MODERATE |
| E3-C4 Tragfähigkeit | SRC-STROBE · SRC-OBSERVATIONAL · SRC-PERFORMANCE-ANALYSIS · RINQ-MODEL-E3-EVIDENCE-ASSESSMENT | MODERATE (RinQ) |
| E3-C5 Aussagestufen | SRC-STROBE · SRC-SPORTS-ANALYTICS · SRC-OUTCOME-BIAS · RINQ-MODEL-E3-STATEMENT-LADDER | MODERATE |
| MIN-001 | SRC-STROBE · RINQ-METHODOLOGY-E3-TRANSPARENT-REPORTING | MODERATE |
| MIN-002 | SRC-IIHF-CEF-2025 · RINQ-DECISION-E3-LEARNING-GOALS | MODERATE |

**0× STRONG · 7× MODERATE · 0× WEAK**

---

## Datenmigration (Raten)

Vorher: `rate = targetCount / totalOpportunities` (unklare Ergebnisse im Nenner → wie Nicht-Zielereignis).  
Nachher: `rate = targetCount / evaluableCount` (`evaluableCount = gültig − unklar`), `rateDenominatorBasis: 'evaluable'`.

Raten werden aus Rohbeobachtungen neu berechnet. Gespeicherte Session-Antworten ohne Rohlogs bleiben lesbar; angezeigte Raten aus Rohdaten nutzen die neue Formel. Alte und neue Raten nicht ungekennzeichnet vergleichen.
