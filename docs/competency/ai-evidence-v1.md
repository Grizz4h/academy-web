# AI Competency Evidence — Phase 5B (Pilot)

**Status:** pilot (`ai-evidence-v1`)  
**Prerequisite:** structured evidence Phase 5A (`ff646bb`)

## Principle

```text
AI evaluates evidence.
RinQ computes competence.
```

The AI layer outputs **quality ∈ [0, 1]** per allowed competency axis only. It never sets score, confidence, breadth, highestEvidenceLevel, strength, evidenceWeight, evidenceLevel, or maxStrength — those remain map-/engine-authoritative.

## Pilot drills

| drill_id | type | Why |
|----------|------|-----|
| **B2_D5** | `period_checkin` | Synthesis drill with free-text justification (`pattern_reason`) plus structured tendency/evidence — not reducible to deterministic rules alone |
| **E1_D1** | `pattern_log` | Pattern comparison with `pattern_summary` over 3+ observations — qualitative observation vs inference separation |

Not in pilot: E4_* (training-only), full C/D “Heutige …” 8-axis drills (rollout later), E3 claim_ladder complexity.

## Architecture

```text
final checkin (POST /api/sessions/{id}/checkins)
  → persist session/checkin
  → process_evidence_for_checkin (evidence_submission.py)
       structured supported → StructuredEvidenceEvaluator (5A, unchanged)
       ai supported         → AiEvidenceEvaluator (5B)
       else                 → no evidence
  → EvidenceEvent append (idempotent)
  → CompetencyRecomputeService
  → /api/me/competencies
```

Code layout:

```text
backend/competency/ai/
  constants.py   — MVP_AI_DRILL_IDS, evaluatorVersion
  schema.py      — strict JSON contract
  rubrics.py     — answer extraction / gating
  prompt.py      — system + user prompts (injection guard)
  provider.py    — OpenAI Responses API (reuse reflection pattern)
  evaluator.py   — AiEvidenceEvaluator
backend/competency/evidence_submission.py — unified dispatch
```

## AI provider

Reuses existing **OpenAI** server integration (`reflection/service.py` pattern):

- `OPENAI_API_KEY` (required for live calls; missing → skip AI, no fake evidence)
- `OPENAI_EVIDENCE_MODEL` (optional, falls back to `OPENAI_REFLECTION_MODEL`)
- `OPENAI_EVIDENCE_PROMPT_VERSION` (default `v1`)
- Strict JSON schema via Responses API, `store=False`
- Timeout 30s; failures logged, **no default quality**

No `VITE_*`, no user UUID/email sent to provider.

## Output schema

```json
{
  "competencies": [
    {
      "competencyId": "pressure_control",
      "quality": 0.72,
      "specificity": 0.68,
      "evidenceAlignment": 0.74,
      "unsupportedClaims": 0.12,
      "reasonCode": "observation_grounded"
    }
  ]
}
```

- Only competency IDs from frozen evidence map weights for the drill
- Unknown/extra axes dropped server-side
- Per-competency quality (not one global quality copied to all axes)

## Quality rubric (AI)

- `0.5` = neutral engine pivot (partially usable / uncertain)
- Reward: observational grounding, specificity, observation/claim separation, scoped claims
- Do **not** reward: length, polish, confident tone, jargon alone, or “sounds plausible”
- Do **not** infer missing observations or assume unstated tactical intent
- Drill-specific band guides live in `competency/ai/prompt.py` (`E1_D1`, `B2_D5`) — prompt `v2` / rubric `*-rubric-v2`

## Idempotency

Same as structured pipeline:

```text
source_type = drill_submission
source_id   = {session_id}:{drill_id}
+ competency_id uniqueness
```

Retry of final checkin does not duplicate events.

## Failure / retry

| Condition | Behaviour |
|-----------|-----------|
| `final=false` | no evaluation |
| incomplete answers / short text | no provider call |
| missing API key | no evidence |
| timeout / invalid JSON / schema error | no evidence |
| checkin persist | always succeeds (existing product rule) |
| evidence persist error | HTTP 500 (same as 5A) |

No invented quality 0.5 or 1.0 on failure.

## Audit metadata (event.metadata)

- `evaluatorVersion`: `ai-evidence-v1`
- `rubricVersion`: e.g. `B2_D5-rubric-v2`
- `provider`, `model`, `promptVersion`

Not stored: full prompts, secrets, redundant user text.

## Prompt injection

User text is wrapped in `<learner_submission>` and marked untrusted in the system prompt. Tests verify injection strings do not bypass mocked contract validation.

## Tests

```bash
cd backend && python -m unittest test_ai_evidence test_ai_evidence_e2e test_structured_evidence test_structured_evidence_e2e
```

All provider calls mocked in tests.

## Next rollout candidates

After manual review of 10–20 synthetic answers:

- C1_D5 / C2_D5 / C3_D5 “Heutige …-Beobachtung” period summaries
- B2_D3 (text + structured mix)
- E1 follow-ups once D1 pilot stable

Do **not** batch-migrate all text drills until pilot quality distribution is validated (~0.55–0.65 moderate, ~0.85 strong).

## Calibration review (Phase 5B.1) + Generic Rubric V1

Synthetic fixture review (no persistence):

```bash
cd backend
.venv/bin/python -m competency.ai.calibration --mock
.venv/bin/python -m competency.ai.calibration --mock --validation
.venv/bin/python -m competency.ai.calibration --live   # manual; costs tokens
```

See:

- `docs/competency/ai-evidence-calibration-review.md`
- `docs/competency/ai-evidence-generic-rubric-v1.md` (Variant B: AI dimensions → backend quality)
