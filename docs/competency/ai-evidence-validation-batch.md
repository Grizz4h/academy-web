# Generic Evidence Rubric — Validation Batch (Phase 2)

**Status:** calibrated (synthetic matrix)  
**Depends on:** `932fb14` generic rubric  
**Commit target:** `Calibrate generic evidence rubric across drills`

Validation drills remain **not production-wired** (no checkin dispatch / EvidenceEvents).

## Principle (unchanged)

```text
AI → dimensions
Backend → deterministic quality
Engine → competence (level / weight / capacity)
```

Quality means: *how well does this answer meet THIS drill's requirements?*  
Excellent A1 and excellent E3 may share the ~0.85–1.0 band. Difficulty is **not** encoded by suppressing early-drill quality.

## Six validation specs (`*-spec-v2`)

| Drill | Scope | Readiness | Source recommendation |
|-------|-------|-----------|------------------------|
| A1_D2 | `single_observation` | `NOT_SUITABLE_FOR_AI_EVIDENCE` | `structured_only` |
| A3_D2 | `single_sequence` | `NEEDS_SMALL_INPUT_CHANGE` | `structured_plus_ai_review` |
| B1_D1 | `single_observation` | `NEEDS_SMALL_INPUT_CHANGE` | `structured_plus_ai_review` |
| C1_D5 | `pattern_synthesis` | `READY` | `structured_plus_ai_review` |
| D3_D5 | `pattern_synthesis` | `READY` | `structured_plus_ai_review` |
| E3_D5 | `comparative_analysis` | `READY` | `ai_review` |

Specs live under `backend/competency/ai/specs/drills/`.  
Design metadata (`freeTextReadiness`, `evidenceSourceRecommendation`, `minimalInputChange`) is **not** LLM prompt solution text.

### Minimal input changes (if AI later)

- **A1_D2:** keep structured shift_tracker; AI not required
- **A3_D2:** require short free-text (~60–150 chars) for first-reaction sequence, or stay structured-only
- **B1_D1:** raise/require note (~150–250 chars) on final sample, or stay structured-only
- **C1/D3/E3:** already READY

## Synthetic calibration matrix

Classes per drill: `excellent > good > partial > weak` plus `unsupported_confident` / `empty_offtopic`.

```bash
cd backend
.venv/bin/python -m competency.ai.calibration --validation-matrix
.venv/bin/python -m competency.ai.calibration --mock --validation
```

Diagnostics per cell: dimension scores, positive aggregate, soft penalty, applied caps, final quality (`aggregation.aggregate_quality_report`).

## Caps (unchanged)

Severe unsupported / outcome bias still hard-cap quality at **≤0.45** — high specificity cannot rescue eloquence without evidence.

## Generic rubric changes in this phase

- Specs enriched (emphasis, fairness, readiness, source strategy)
- Aggregator uses existing `dimensionEmphasis` + scope scaling (no new dimensions, no new caps)
- Diagnostics report helper

No production wiring. No 78-drill rollout.

## Regression

E1_D1 / B2_D5 mock calibration must remain `PILOT CALIBRATION LOOKS GOOD`.
