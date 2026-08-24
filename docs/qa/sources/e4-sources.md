# E4 — Evidence Sources

**Datum:** 2026-08-24 (HR-Schärfung)  
**Scope:** HR-E4-C1 … C5 · MIN-001…003  
**Status:** Recherche · Human Review **offen** (`NEEDS_CHANGE`)

---

## Quellen-Katalog

| Ref-ID | Autor / Organisation | Titel | Jahr | URL | Typ |
|--------|---------------------|-------|------|-----|-----|
| **SRC-DEB-RRL-2020-S12** | DEB e.V. | Rahmenrichtlinien … Fortschreibung 2020, S. 12 | 2020 | [DEB PDF](https://www.deb-online.de/download/402/trainer/32893/rahmenrichtlinien-fuer-die-traineraus-fort-und-weiterbildung-fortschreibung-2020.pdf) · lokal: `/Users/christoph/Downloads/Rahmenrichtlinien-fuer-die-Traineraus-fort-und-weiterbildung-Fortschreibung-2020.pdf` | Ausbildung |
| **SRC-IIHF-CEF-2025** | IIHF | Coach Education Framework | 2025 | [IIHF PDF](https://blob.iihf.com/iihf-media/iihfmvc/media/downloads/sport%20files/development-guide/coaching/iihf_coacheducationframework_digital_12052025-v1.pdf) | Ausbildung |
| **SRC-ANTICIPATION-SPORT-REVIEW-2019** | Williams & Jackson | Anticipation in sport: Fifty years on… | 2019 | [ScienceDirect](https://www.sciencedirect.com/science/article/pii/S1469029218305090) · DOI 10.1016/j.psychsport.2018.11.014 | Review |
| **SRC-ACTIVE-INFERENCE-SPORT-2022** | — | An Active Inference Account of Skilled Anticipation in Sport | 2022 | [Springer](https://link.springer.com/article/10.1007/s40279-022-01689-w) | Theorie |
| **SRC-PERCEPTUAL-COGNITIVE-EXPERTISE-META-ANALYSIS** | Mann et al. | Perceptual-Cognitive Expertise in Sport: A Meta-Analysis | 2007 | DOI 10.1123/jsep.29.4.457 · bibliografisch: Journal of Sport & Exercise Psychology | Meta-Analyse |
| **SRC-ICE-HOCKEY-SCANNING-2024** | — | Scanning is associated with better performance in professional ice hockey | 2024/2025 | [DOI](https://doi.org/10.1080/02640414.2024.2433899) | Beobachtungsstudie |
| **SRC-OUTCOME-BIAS-SPORT-2019** | Kausel et al. | Outcome bias in subjective ratings of performance | 2019 | [ScienceDirect](https://www.sciencedirect.com/science/article/pii/S0167487017307614) | Empirie |

### Beleggrenzen

| Ref-ID | Beleggrenze |
|--------|-------------|
| SRC-DEB-RRL-2020-S12 | Definiert kein Antizipationsraster, keine Cue-Rollen und keine Mindestzahl von Reads. |
| SRC-IIHF-CEF-2025 | Stützt reflektiertes Lernen, aber keine konkrete E4-Mechanik oder Kompetenzmessung. |
| SRC-ANTICIPATION-SPORT-REVIEW-2019 | Sportübergreifende Übersichtsarbeit. Validiert weder RinQ-Cue-Rollen noch Drillanzahl oder D5-Aggregation. |
| SRC-ACTIVE-INFERENCE-SPORT-2022 | Theoretisches Modell. Validiert keine binäre RinQ-Update-UI und keinen Antizipationsscore. |
| SRC-PERCEPTUAL-COGNITIVE-EXPERTISE-META-ANALYSIS | Untersuchte Gruppenunterschiede unter Forschungsbedingungen. Rechtfertigt keinen individuellen Hockey-IQ oder Antizipationsscore aus wenigen RinQ-Einträgen. |
| SRC-ICE-HOCKEY-SCANNING-2024 | Beobachtungsstudie zu Profis. Beweist keine Ursache, definiert keine RinQ-Cue-Rollen, erlaubt keine Bewertung individueller Nutzer anhand von E4-Logs. |
| SRC-OUTCOME-BIAS-SPORT-2019 | Fußballbezogene Studie; keine direkte Validierung des E4-Verfahrens. |

---

## RinQ-interne Referenzen

### RINQ-MODEL-E4-READ-OUTCOME-SEPARATION
- **Entscheidung:** Erwartung, Hinweise, tatsächliche Aktion, Übereinstimmung und Nachprüfung getrennt; Vorabdaten nach Auflösung gesperrt.
- **Warum:** Outcome-Bias und Rückschaufehler.
- **Anschluss:** SRC-ANTICIPATION-SPORT-REVIEW-2019; SRC-OUTCOME-BIAS-SPORT-2019; SRC-ACTIVE-INFERENCE-SPORT-2022.
- **Beleggrenze:** Kein DEB/IIHF-Raster; kein validiertes Scoring.
- **Kein offizielles Modell:** RinQ-Lernmechanik.

### RINQ-MODEL-E4-CUE-ROLES
- **Entscheidung:** Haupthinweis / unterstützend / wahrgenommen-nicht-genutzt; keine Punkte.
- **Warum:** „Entscheidend“ klingt objektiv; UI erfasst Nutzung.
- **Anschluss:** SRC-ANTICIPATION-SPORT-REVIEW-2019; SRC-ACTIVE-INFERENCE-SPORT-2022.
- **Beleggrenze:** Validiert keine Cue-Taxonomie.
- **Kein offizielles Modell:** RinQ-Rollenmodell.

### RINQ-MODEL-E4-SCENARIO-BRANCH
- **Entscheidung:** Eine Alternative + beobachtbarer Auslöser; didaktische Begrenzung; Szene wechselbar.
- **Warum:** Fokus ohne „alles möglich“.
- **Anschluss:** SRC-ANTICIPATION-SPORT-REVIEW-2019; SRC-ACTIVE-INFERENCE-SPORT-2022.
- **Beleggrenze:** Keine objektive Zwei-Wege-Validierung.
- **Kein offizielles Modell:** RinQ-Übung.

### RINQ-MODEL-E4-PREDICTION-UPDATE
- **Entscheidung:** Beibehalten/Ändern/keine neue Info/unklar; Timing ohne Speed-Score.
- **Warum:** Speed-Bias und „früher immer besser“ vermeiden.
- **Anschluss:** SRC-ACTIVE-INFERENCE-SPORT-2022; SRC-ANTICIPATION-SPORT-REVIEW-2019.
- **Beleggrenze:** Kein Bayesian-/Reaktionszeitmodell.
- **Kein offizielles Modell:** RinQ-Didaktik.

### RINQ-DECISION-E4-NO-SKILL-PROFILE
- **Entscheidung:** „Meine bisherigen Antizipations-Beobachtungen“; Freischaltung nach Abdeckung D1–D4; `minReadsForProfile=20` nur UX-Hinweis.
- **Warum:** 20 ist keine Validitätsschwelle; Aggregation darf nicht wie Kompetenztest wirken.
- **Anschluss:** SRC-ANTICIPATION-SPORT-REVIEW-2019; SRC-PERCEPTUAL-COGNITIVE-EXPERTISE-META-ANALYSIS; SRC-ICE-HOCKEY-SCANNING-2024.
- **Beleggrenze:** Meta-Analyse rechtfertigt keinen individuellen Score.
- **Kein offizielles Modell:** Produktentscheidung.

### RINQ-METHODOLOGY-E4-NO-GOOD-BAD-READ
- **Entscheidung:** Keine pauschale Gut/Schlecht-Read-Sprache; konkrete Begründungmerkmale.
- **Anschluss:** SRC-ANTICIPATION-SPORT-REVIEW-2019; SRC-OUTCOME-BIAS-SPORT-2019.
- **Kein offizielles Modell:** RinQ-Sprachregel.

### RINQ-DECISION-E4-REMOVE-TIPPING-MOMENT
- **Entscheidung:** Lernziel „Kippmomente“ entfernt; sichtbare Veränderungen für andere nächste Aktion.
- **Anschluss:** SRC-ACTIVE-INFERENCE-SPORT-2022.
- **Kein offizielles Modell:** Curriculum-Entscheidung.

### RINQ-METHODOLOGY-E4-NEUTRAL-INTRO
- **Entscheidung:** „Gute Spieler…“ entfernt; neutrale Lernhandlung.
- **Anschluss:** SRC-IIHF-CEF-2025 (Reflexion ohne normative Elite-Gruppe).
- **Kein offizielles Modell:** RinQ-Copy.

---

## Claim-Evidence-Matrix

| Claim | Quellen | strength |
|-------|---------|----------|
| E4-C1 | SRC-ANTICIPATION… · SRC-ACTIVE-INFERENCE… · SRC-OUTCOME-BIAS… · RINQ-MODEL-E4-READ-OUTCOME-SEPARATION | MODERATE |
| E4-C2 | SRC-ANTICIPATION… · SRC-ACTIVE-INFERENCE… · RINQ-MODEL-E4-CUE-ROLES | MODERATE |
| E4-C3 | SRC-ANTICIPATION… · SRC-ACTIVE-INFERENCE… · RINQ-MODEL-E4-SCENARIO-BRANCH | MODERATE |
| E4-C4 | SRC-ACTIVE-INFERENCE… · SRC-ANTICIPATION… · RINQ-MODEL-E4-PREDICTION-UPDATE | MODERATE |
| E4-C5 | SRC-ANTICIPATION… · SRC-PERCEPTUAL… · SRC-ICE-HOCKEY… · RINQ-DECISION-E4-NO-SKILL-PROFILE | MODERATE |
| MIN-001…003 | siehe RinQ-Refs oben | MODERATE |

**0× STRONG · 8× MODERATE**

---

## Migration

- Interne Keys (`matched`, `well_supported`, `primary`, `keep`, `too_late`, `anticipation_profile`, `minReadsForProfile`) bleiben stabil; Labels remapped.
- Legacy `partly_matched`, `too_early`, `Entscheidend` lesbar.
- D5-Freischaltung: `hasEnoughData` = Abdeckung aller `sourceDrillIds` (`source_coverage`). `minReadsForProfile` bleibt Config/UX-Hinweis, nicht Validitätsschwelle.
