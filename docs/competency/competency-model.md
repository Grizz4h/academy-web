# RinQ Competency Model V1

## Scope

Phase 1 covers Cluster 1 only: A1–A3, B1–B3, C1–C3, D1–D4 and E1–E4. Track 0 is foundation/onboarding and produces no regular competency score. F and M are Cluster 2 and excluded.

The canonical taxonomy is [`../../data/academy/competency/taxonomy.json`](../../data/academy/competency/taxonomy.json). Its eight IDs are stable from V1 onward. Capability bands are interpretive labels, not a scoring algorithm.

## Versioned contracts

Python domain contracts live in `backend/competency/models.py`:

- `DrillCompetencyProfile` separates `trainingWeights` from `evidence`.
- `UserCompetencyState` stores score, confidence, count, breadth, highest evidence level and recency.
- `EvidenceEvent` represents one assessed user performance, never mere completion.

Weights use integer/decimal values on a documented **0–100 scale**. Event `quality` and `strength` use **0.0–1.0**, because they describe one normalized assessment. Evidence levels are restricted to 1–5; user state uses 0 when no evidence exists.

`data/academy/competency/drill_profiles.json` deliberately contains an empty `profiles` array. The next approved Training Map batch (A1–A3) is inserted into that array. No weights may be inferred or invented.

## Persistence boundary

`UserCompetencyStateRepository` and `EvidenceEventRepository` are future ports in `backend/competency/contracts.py`. They use the authenticated RinQ UUID through `AuthContext`. There is intentionally no JSON/Postgres implementation and no migration in Phase 1. Competency must not be mixed into `RewardRepository`.

E4 is training-only. Its profiles can contain training weights but validation rejects enabled evidence.
