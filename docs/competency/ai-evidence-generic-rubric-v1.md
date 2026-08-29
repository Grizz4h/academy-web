# Generic Evidence Evaluator Rubric V1

**Status:** architecture ready for staged rollout  
**Depends on:** calibration pass `6705603`, pilots `E1_D1` + `B2_D5`  
**Prompt:** `v3` · **Evaluator:** `ai-evidence-v2` · **Rubric:** `generic-rubric-v1`

## Principle

```text
AI judges evidence dimensions.
Backend computes quality.
Engine computes competence.
```

The model must **not** emit authoritative `quality`, `score`, `confidence`, or `breadth`.

## Architecture

```text
Generic Evaluator Prompt (SYSTEM v3)
  + Competency Rubric Config (8 axes)
  + Drill Assessment Spec (compact JSON)
  + Learner submission (+ structured context)
       ↓
  Dimension scores (per competencyId)
       ↓
  Deterministic aggregator (backend)
       ↓
  quality ∈ [0, 1] → EvidenceEvent → Engine
```

Not: one bespoke mega-prompt per drill.

## Dimensions

| Dimension | Role |
|-----------|------|
| `observationGrounding` | Observable anchors in the answer? |
| `specificity` | Concrete actors/spaces/actions vs platitudes? |
| `competencyAlignment` | Supports **this** competency? |
| `relationalReasoning` | Required relationships linked? (scope-scaled) |
| `evidenceScope` | Claim strength matches observation base? |
| `uncertaintyCalibration` | Limits handled sanely? (uncertainty ≠ auto-bad) |
| `unsupportedClaims` | Speculation / invented intent / causality (↑ worse) |
| `outcomeBias` | Success/failure confused with observation quality (↑ worse) |

## Quality aggregation (Variant B)

Positive weighted mean → soft penalties for unsupported/outcome → **hard caps**:

- severe unsupported/outcome (≥0.70) → max quality **0.45**
- moderate (≥0.50) → max **0.70**
- weak grounding → max **0.25** / thin grounding → max **0.55**
- weak alignment → max **0.45**

Scope scales `relationalReasoning` weight (`single_observation` lower than `pattern_synthesis`).

Code: `backend/competency/ai/aggregation.py`

## Competency rubrics

`backend/competency/ai/specs/competency_rubrics.json` — strong/weak evidence bullets from taxonomy. Not separate prompts.

## Drill assessment specs

Schema fields: `drillId`, `specVersion`, `scope`, `primaryTextKeys`, `evaluationFocus`, `requiredForStrong`, `commonFailureModes`, `dimensionEmphasis`, optional `validationOnly`.

**Production pilots (wired):** `E1_D1`, `B2_D5`  
**Validation-only (specs + fixtures, not checkin-wired):**  
`A1_D2`, `A3_D2`, `B1_D1`, `C1_D5`, `D3_D5`, `E3_D5`

Scope types: `single_observation` · `single_sequence` · `multi_observation` · `pattern_synthesis` · `comparative_analysis`

## Quality bands

```text
very_weak 0.00–0.25 · weak 0.25–0.45 · neutral 0.45–0.55
decent 0.55–0.70 · strong 0.70–0.85 · excellent 0.85–1.00
```

## Calibration

```bash
cd backend
.venv/bin/python -m competency.ai.calibration --mock
.venv/bin/python -m competency.ai.calibration --mock --validation
```

## Not in this phase

- Specs for all ~78 evidence-enabled drills
- Wiring validation drills into production checkin dispatch
- Competency engine / training / evidence map changes
