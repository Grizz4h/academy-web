# Assessment Routing V1

**Status:** catalog ready — no production wiring  
**Commit target:** `Classify competency assessment routing v1`  
**Depends on:** Evidence Map V1 · Generic Rubric · Validation batch `a36f551`

## Principle

```text
Use the least powerful evaluator that can produce valid evidence.

deterministic
  → structured_only
    → structured_plus_ai_review
      → ai_review
```

AI only when structured inputs cannot reliably judge the relevant evidence dimensions.

## Catalog

```text
data/academy/competency/assessment_routing.json
```

Rebuild (does not modify maps):

```bash
python3 backend/scripts/build_assessment_routing_v1.py
```

Validate:

```bash
cd backend && .venv/bin/python -m unittest test_assessment_routing_v1 -q
```

## V1 distribution (78 evidence-enabled drills; no E4)

| assessmentSource | count |
|------------------|------:|
| deterministic | 0 |
| structured_only | 53 |
| structured_plus_ai_review | 23 |
| ai_review | 2 |

| readiness | count |
|-----------|------:|
| NOT_SUITABLE_FOR_AI_EVIDENCE | 53 |
| READY | 18 |
| NEEDS_SMALL_INPUT_CHANGE | 6 |
| NEEDS_MECHANIC_CHANGE | 1 |

Pure `ai_review`: **E1_D1**, **E3_D5** only.

AI-involved share ≈ **25 / 78 (~32%)** — majority stay structured.

## Pilot regression (frozen)

| Drill | Source | Readiness |
|-------|--------|-----------|
| A1_D2 | structured_only | NOT_SUITABLE_FOR_AI_EVIDENCE |
| A3_D2 | structured_plus_ai_review | NEEDS_SMALL_INPUT_CHANGE |
| B1_D1 | structured_plus_ai_review | NEEDS_SMALL_INPUT_CHANGE |
| C1_D5 | structured_plus_ai_review | READY |
| D3_D5 | structured_plus_ai_review | READY |
| E3_D5 | ai_review | READY |

Also: production AI pilots **B2_D5** (`structured_plus_ai_review` / READY) and **E1_D1** (`ai_review` / READY).

## Input changes (no UI yet)

- **NEEDS_SMALL_INPUT_CHANGE:** A3_D2, B1_D1–B1_D5 — optional short notes → require short free-text *only if* AI path is chosen later; otherwise keep structured-only.
- **NEEDS_MECHANIC_CHANGE:** E3_D4 — review whether open statement quality needs explicit free-text or stays rule-based.

## Scopes reused

`single_observation` · `single_sequence` · `multi_observation` · `pattern_synthesis` · `comparative_analysis`

## Privacy

Routing catalog has no PII. Future AI calls must send only drill-necessary answers — never email/name/history/profile.

## Not in this phase

No 78 rubric specs, no prompt generation, no checkin/AI production wiring, no map/engine changes.
