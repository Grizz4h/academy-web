# Structured Evidence Generation V1 (Phase 5A)

Server-side evidence from **structured drill submissions** — no LLM, no client-authoritative quality.

## Structured vs AI (Phase 5B)

| | Phase 5A (this doc) | Phase 5B (future) |
|---|---------------------|-------------------|
| Input | Selects, enums, observation logs | Free text, reflection |
| Quality | Deterministic rubric | AI review (`ai_review`) |
| Drills | MVP: `A1_D2`, `A3_D1` | Open-ended A–E drills |

Principle: **Training ≠ Evidence · Completion ≠ Competence** — a drill can finish without producing evidence if the submission is not evaluable.

## MVP drills

### A1_D2 — shift_tracker (“Wo taucht der Center auf?”)

**Why:** Structured position selects, stage `complete`, no correct/wrong key. Evidence map L1 with four competencies.

**Rubric `A1_D2-rubric-v1`:**

- Requires `__shift_tracker_stage === complete`, ≥ `minObservations` (4), pattern reflection filled when configured
- `specificity = 1 - (unsure / observationCount)`
- `volume = min(1, observationCount / recommendedObservations)`
- `quality = 0.5 + 0.5 × (0.6×specificity + 0.4×volume)`

Unsure answers are valid but reduce specificity — not scored as “wrong”.

### A3_D1 — event_log (“Umschaltmoment erkennen”)

**Why:** Pure select chain (zone → win_type → outcome). Strong `transition_tempo` weight. No judgment of transition quality.

**Rubric `A3_D1-rubric-v1`:**

- Requires ≥ 3 complete events (all required select fields filled)
- `specificity = share(outcome != "unklar")`
- `volume = min(1, completeEvents / 3)`
- `quality = 0.5 + 0.5 × (0.5×specificity + 0.5×volume)`

## Event creation

On **final** session checkin (`POST /api/sessions/{id}/checkins` with `final: true`):

```text
validate owner
→ StructuredEvidenceEvaluator
→ EvidenceEventCreate[] (one per enabled competency weight)
→ append idempotently
→ CompetencyRecomputeService.recompute_user
```

Hook: `save_checkin` in `backend/main.py` after session persist. **Not** on draft autosave or back-navigation saves (`final: false`).

## Idempotency

```text
source_type = "drill_submission"
source_id   = "{session_id}:{drill_id}"
UNIQUE (rinq_user_id, source_type, source_id, competency_id)
```

Re-processing the same final submission does not duplicate events.

## Security

- Auth required; session ownership via `_require_session_owner`
- Drill must be in frozen evidence map with `assessmentMode: structured`
- E4 training-only drills never emit evidence
- Client cannot set `quality`, `competencyId`, map weights, or strength

## Versioning

- Evaluator: `structured-evaluator-v1`
- Per-drill rubrics: `A1_D2-rubric-v1`, `A3_D1-rubric-v1`
- Stored in event `metadata` (minimal — no full answer duplication)

## Error behaviour (V1)

If evidence persistence fails after checkin save, API returns **500** (`Kompetenz-Evidenz konnte nicht gespeichert werden`). Client may retry; idempotency prevents duplicates.

## Tests

```bash
cd backend
.venv/bin/python -m unittest test_structured_evidence test_structured_evidence_e2e -q
```

## Next (Phase 5B)

Drills needing **AI quality evaluation**: free-text reflections, period summaries, claim ladders, evidence-assessment mechanics — anywhere `requiresQualityEvaluation` cannot be satisfied by deterministic rubrics alone.
