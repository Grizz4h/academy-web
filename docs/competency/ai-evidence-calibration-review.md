# AI Evidence Calibration Review — Phase 5B.1 / Calibration Pass

**Status:** tooling only (not production pipeline)  
**Prompt:** `ai-evidence` prompt `v2` · rubrics `B2_D5-rubric-v2` / `E1_D1-rubric-v2`

## Purpose

Observe whether the pilot AI evaluator is **human-plausibly calibrated** before rolling out more text drills.

This module:

- uses **synthetic** learner answers only
- calls existing `AiEvidenceEvaluator.evaluate_detailed(...)`
- **never** appends EvidenceEvents or recomputes competency state
- does **not** unlock additional pilot drills
- does **not** change completion gate / curriculum config / idempotency / export

## Run

```bash
cd backend

# Free / deterministic tooling check
.venv/bin/python -m competency.ai.calibration --mock

# Real provider (manual; costs tokens — requires OPENAI_API_KEY)
.venv/bin/python -m competency.ai.calibration --live
```

Exit code `0` = `PILOT CALIBRATION LOOKS GOOD`, `2` = `REVIEW PROMPT/RUBRIC BEFORE ROLLOUT`.

## Fixtures

```text
backend/competency/ai/calibration/fixtures/b2_d5.json
backend/competency/ai/calibration/fixtures/e1_d1.json
```

Per drill: band cases across six quality bands plus vague / unsupported / injection / adversarial cases.

`expectedBand` / `caseKind` stay in the fixture metadata and are **not** sent to the evaluator.

## Soft target ranges (calibration pass)

```text
very_weak   0.0–0.25
weak        0.25–0.45
neutral     0.45–0.55
decent      0.55–0.70
strong      0.70–0.85
excellent   0.85–1.00   (1.0 rare)
```

Aliases: `moderate` → neutral, `very_strong` → excellent.

Flags: `TOO_HIGH`, `TOO_LOW`, `UNSUPPORTED_CLAIMS_MISSED`, `INJECTION_SUSPICIOUS`, `OK`.

## Tests

```bash
.venv/bin/python -m unittest \
  test_ai_evidence_calibration_pass \
  test_ai_evidence_calibration \
  test_ai_evidence \
  test_competency_evidence_hardening -q
```

## Prompt hardening (v2)

Anti-bias rules in `competency/ai/prompt.py`: no length / confidence / jargon / plausibility reward; no inferred observations; score only explicit evidence. Drill-specific rubrics for `E1_D1` (repetition + evidence_analysis) and `B2_D5` (pressure + options + decision pattern).
