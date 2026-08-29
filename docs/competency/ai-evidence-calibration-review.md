# AI Evidence Calibration Review — Phase 5B.1

**Status:** tooling only (not production pipeline)  
**Depends on:** `343ce64` AI evidence pilot (`B2_D5`, `E1_D1`)

## Purpose

Observe whether the pilot AI evaluator is **human-plausibly calibrated** before rolling out more text drills.

This module:

- uses **synthetic** learner answers only
- calls existing `AiEvidenceEvaluator.evaluate_detailed(...)`
- **never** appends EvidenceEvents or recomputes competency state
- does **not** unlock additional pilot drills

## Run

```bash
cd backend

# Free / deterministic tooling check
.venv/bin/python -m competency.ai.calibration --mock

# Real provider (manual; costs tokens — requires OPENAI_API_KEY)
.venv/bin/python -m competency.ai.calibration --live

# JSON
.venv/bin/python -m competency.ai.calibration --mock --json

# One drill
.venv/bin/python -m competency.ai.calibration --live --drill B2_D5
```

Exit code `0` = `PILOT CALIBRATION LOOKS GOOD`, `2` = `REVIEW PROMPT/RUBRIC BEFORE ROLLOUT`.

## Fixtures

```text
backend/competency/ai/calibration/fixtures/b2_d5.json
backend/competency/ai/calibration/fixtures/e1_d1.json
```

Per drill ≈ 10 band cases (`very_weak` … `very_strong`, ~2 each) plus:

- 1 vague
- 1 unsupported claim
- 1 prompt-injection style text

`expectedBand` / `caseKind` stay in the fixture metadata and are **not** sent to the evaluator.

## Soft target ranges

```text
very_weak   ~ 0.10–0.35
weak        ~ 0.30–0.50
moderate    ~ 0.50–0.70
strong      ~ 0.70–0.88
very_strong ~ 0.82–0.95
```

Overlaps allowed. Flags: `TOO_HIGH`, `TOO_LOW`, `UNSUPPORTED_CLAIMS_MISSED`, `INJECTION_SUSPICIOUS`, `OK`.

## Tests

```bash
.venv/bin/python -m unittest test_ai_evidence_calibration test_ai_evidence -q
```

## Next step after a live run

Manually read the table. If moderate answers cluster at 0.85+ or injection cases score high → revise prompt/rubric before any broader AI drill rollout.
