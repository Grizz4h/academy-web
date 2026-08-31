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
| **B2_D5** | `period_checkin` | Synthesis + free-text justification |
| **E1_D1** | `pattern_log` | Pattern comparison over 3+ observations |
| **E1_D5** | `tendency_profile` | Segment tendency synthesis (`segment_summary`) |
| **C1_D5** | `period_checkin` | Defensive stability synthesis (`profileSummary`) |
| **C2_D5** | `period_checkin` | Neutral-zone synthesis (`profileSummary`) |
| **C3_D5** | `period_checkin` | Offensive structure synthesis (`profileSummary`) |
| **D1_D5** | `period_checkin` | Powerplay synthesis (`profileSummary`) |
| **D2_D5** | `period_checkin` | Penalty-kill synthesis (`profileSummary`) |
| **D3_D5** | `period_checkin` | Blue-line transfer synthesis (`profileSummary`) |
| **E2_D1** | `before_after_compare` | Before/after change description (`changeSummary`) |
| **E2_D2** | `change_timeline` | Change timeline synthesis (`changeSummary`) |
| **E2_D3** | `trigger_hypothesis` | Adjustment hypothesis (`hypothesisSummary`) |
| **E2_D4** | `interaction_chain` | Interaction chain synthesis (`chainSummary`) |
| **E2_D5** | `adjustment_profile` | Adjustment synthesis (`segmentSummary`) |
| **A3_D2** | `period_checkin` | First-reaction sequence (`note`) |
| **B1_D1–D5** | `sample_log` | Support / connection notes (`samples[].note`) |
| **E3_D1** | `opportunity_rate` | Opportunity rate with denominator (`userConclusion`) |
| **E3_D2** | `cohort_rate_compare` | Cohort rate comparison (`userConclusion`) |
| **E3_D3** | `conditional_outcome` | Conditional outcome pattern (`userConclusion`) |
| **E3_D4** | `evidence_assessment` | Evidence strength vs sample (`userStatement`) |
| **E3_D5** | `claim_ladder` | Claim strength / falsification (`ai_review`) |

Production allowlist: `PRODUCTION_AI_DRILLS` in `backend/competency/ai/specs/__init__.py`.

Not yet production-wired: E4_* (training-only).

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
| evidence persist error | logged; checkin already returned (background task) |

Final checkin returns immediately; AI/structured evidence runs in a FastAPI `BackgroundTasks` job so session advance is not blocked for ~10s OpenAI latency.

No invented quality 0.5 or 1.0 on failure.

**Ops note:** Placeholder / checklist free-text that only passes the length gate still triggers AI. Near-floor `quality` is then correct and flattens the radar — not a wiring bug.

## Audit metadata (event.metadata)

- `evaluatorVersion`, `rubricVersion`, `provider`, `model`, `promptVersion`
- `dimensions` (compact grounding / alignment / penalties / `reasonCode` per event)

Not stored: full prompts, secrets, redundant user text.

## Prompt injection

User text is wrapped in `<learner_submission>` and marked untrusted in the system prompt. Tests verify injection strings do not bypass mocked contract validation.

## Tests

```bash
cd backend && python -m unittest test_ai_evidence test_ai_evidence_e2e test_structured_evidence test_structured_evidence_e2e
```

All provider calls mocked in tests.

## Next rollout candidates

Already wired: C/D period summaries, E1_D1/D5, **full E2_D1–D5**, **full E3_D1–D5**, **A3_D2 + B1_D1–D5** (with B2_D5). All 25 READY AI drills are on the production allowlist.

Further candidates after smoke:

- E4_* only if training drills later become evidence-eligible

Do **not** batch-migrate all text drills until quality distribution is validated (~0.55–0.65 moderate, ~0.85 strong).

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
- `docs/competency/ai-evidence-validation-batch.md` (cross-calibration matrix)
- `docs/competency/assessment-routing-v1.md` (78-drill least-powerful routing catalog)
- `docs/competency/assessment-spec-v1.md` (AI assessment specs; production allowlist above)

## Dev reset + autofill

CLI:

```bash
cd backend
.venv/bin/python scripts/reset_competency_profile.py --username paywall-widerruf --yes
```

API (`require_dev_access`):

```text
POST /api/dev/competency/reset
```

Deletes only this user's evidence events + competency states (not sessions/rewards).

UI: `/dev` → **DEV → Competency**; Account (Dev-Nav on) under the radar.
Session: **DEV: Drill füllen** for wired AI pilots incl. full E2 track (client drafts only).
