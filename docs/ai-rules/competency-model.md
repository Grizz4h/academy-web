# RinQ Tank — Competency Model Manifest

**Status:** verbindliche Architektur- und Design-Rule

1. Cluster 1 umfasst A1–A3, B1–B3, C1–C3, D1–D4 und E1–E4. Track 0 erzeugt keine regulären Scores; F und M sind ausgeschlossen.
2. Die acht Competency IDs in `data/academy/competency/taxonomy.json` sind in V1 stabil.
3. Training ist nicht Evidence.
4. Completion ist nicht Competence.
5. XP ist nicht Competence.
6. Auth/Rewards und Competency bleiben getrennte Domains.
7. AI bewertet einzelne Evidence, nie den finalen Skillscore.
8. Ein Score benötigt eine getrennte Confidence-Aussage.
9. Breadth muss Drill-Farming verhindern und verschiedene Evidenzquellen berücksichtigen.
10. Evidence Level begrenzt später die Aussagehöhe eines Scores.
11. E4 ist training-only und liefert keine Kompetenzbewertung.
12. Neue Competency IDs oder semantische Änderungen benötigen eine explizite Architekturentscheidung.
13. Drill-Gewichte werden ausschließlich aus einer fachlich freigegebenen Map übernommen und niemals eigenständig erfunden.

Details und Contracts: [`../competency/competency-model.md`](../competency/competency-model.md) und [`../competency/scoring-principles.md`](../competency/scoring-principles.md).
