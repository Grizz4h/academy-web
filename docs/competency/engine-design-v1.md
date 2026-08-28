# Competency Engine Design V1

**Phase 4A / 4A.1 — design & simulation only.**
**Status:** `ENGINE V1 CALIBRATED` (implementation-ready specification)
**Engine version:** `competency-engine-v1`

Maps remain frozen (Training V1 + Evidence V1). This document specifies the recommended V1 computation model. Implementation is Phase 4B+.

Simulation reference: `backend/competency/simulations/engine_v1_sim.py`
Run: `python backend/competency/simulations/engine_v1_sim.py`

---

## Binding principles

```text
Training ≠ Evidence
Completion ≠ Competence
XP ≠ Competence
AI evaluates evidence; RinQ computes competence.
```

- Evidence Events are **server-authoritative** (quality/strength/level derived server-side from drill profile + assessment input).
- Client never sets score, confidence, breadth, or strength.
- Engine is **deterministic** — no randomness, no AI inside recompute.

---

## 1. User competency state (public V1 semantics)

Per competency:

```json
{
  "competencyId": "space_structure",
  "score": 0,
  "confidence": 0,
  "evidenceCount": 0,
  "breadth": 0,
  "highestEvidenceLevel": 0,
  "lastEvidenceAt": null
}
```

| Field | Range | Semantics |
|-------|-------|-----------|
| `score` | 0–100 | Best-effort estimate of observed competence height (**not** % correct, XP, or percentile) |
| `confidence` | 0–1 | Certainty of the estimate (not competence itself) |
| `breadth` | 0–1 | Diversity of evidence sources (not event count) |
| `highestEvidenceLevel` | 0–5 | Highest **proven** evidence level (see §14) |
| `evidenceCount` | int | Raw event count (informational) |

**Contract note:** `backend/competency/models.py` currently types `confidence`/`breadth` as 0–100. Implementation should align to **0–1** as above (UI may display ×100).

### Neutral start (no fake competence)

**Recommendation:** keep numeric fields at zero and treat **`confidence = 0` as “unassessed / unknown”**.

```text
0 events → score=0, confidence=0, breadth=0, highestEvidenceLevel=0
UI rule: do NOT render as “Skill 0” — show “Noch nicht bewertet” / empty radar spoke
```

Nullable `score` is possible but adds DB/API complexity; **confidence-gated display** is simpler and sufficient.

Internal derived metrics (not public V1): `effectiveEvidenceVolume`, `provenLevelSupport`, `coverageCatalogVersion`.

### Score semantics (V1)

```text
score = best deterministic estimate of currently observable competence
```

Valid example: `score=80, confidence=0.35, breadth=0.20` → strong signal, thin basis.
UI copy: *„Was ich bisher gesehen habe, deutet auf hohes Niveau — aber ich habe noch nicht genug unterschiedliche Situationen gesehen.“*

---

## Phase 4A.1 — Calibration summary

### Confidence (Variant B — frozen)

Compared legacy `k=2.8` gate (10 diverse → **conf≈0.99**) vs calibrated:

```text
effectiveVolume = Σ(strength_i × n_i^-0.5)
evidenceConfidence = 1 - exp(-0.95 × sqrt(effectiveVolume))
breadthModifier = 0.35 + 0.65 × sqrt(breadth)
confidence = min(0.98, evidenceConfidence × breadthModifier)
```

| Scenario | breadth | confidence (calibrated) |
|----------|---------|-------------------------|
| 1 good event | ~0.07 | ~0.26 |
| 3 events, 1 drill | ~0.07 | ~0.31 |
| 10 diverse / 3 tracks | ~0.23 | **~0.56** |
| 20 diverse (matrix D) | ~0.36 | ~0.74 |
| 20× L1 farm | ~0.07 | ~0.31 |
| 50× L1 farm | ~0.07 | ~0.36 |

`confidence` may exceed `breadth` (e.g. specialist), but **`conf≈0.99` at breadth≈0.23 is no longer possible**.

### Level proof (frozen)

Aggregate support uses **repetition-damped** contributions:

```text
levelSupport[L] += strength × n^-0.5
```

Level `L` is proven if:

1. `levelSupport[L] ≥ threshold(L)` where
   `threshold = 0.26 × 0.72^(uniqueDrillsAtLevel - 1)` for `uniqueDrills ≥ 2`, else `0.26`
2. **OR** fast-path single event: `quality ≥ 0.80` AND `strength ≥ 0.48`

Qualifying events: `quality ≥ 0.55`, `strength ≥ 0.10`.

**Advanced scanning (7 mixed drills):** proven L3, ceiling 75, score≈63, conf≈0.40, breadth≈0.37 — breadth without fake elite score.

### Soft ceiling (frozen)

```text
if scoreRaw ≤ hardCeiling: score = scoreRaw
else: score = hardCeiling + (scoreRaw - hardCeiling) × 0.18
```

Used when raw mean exceeds proven band; prevents abrupt cliffs without allowing L1 farming into 90+.

### Specialist vs generalist (simulated)

| | score | confidence | breadth |
|---|-------|------------|---------|
| Specialist (6× L4, q≈0.92) | 84 | 0.39 | 0.07 |
| Generalist (10 tracks, q≈0.80) | 71 | 0.61 | 0.44 |

---

## 2. Architecture: Event → bounded contribution → aggregate state

```text
Assessment input (structured fields / AI review output)
  ↓ server normalizes quality ∈ [0,1]
  ↓ server computes strength from frozen drill evidence profile
  ↓ append EvidenceEvent (immutable)
  ↓ recompute UserCompetencyState from all events (per competency)
```

A single event **never** sets score directly.

---

## 3. Evidence event strength (recommended V1 formula)

### Semantics (non-redundant)

| Input | Meaning |
|-------|---------|
| `evidenceWeight / 100` | Drill relevance for this competency |
| `maxStrength` | Max believable single-event cap for this drill |
| `evidenceLevel` | Complexity band this drill can support |
| `quality` | Concrete user performance (neutral at 0.5) |

`evidenceWeight` and `maxStrength` differ: a drill may be highly relevant (weight 80) but each observation capped (maxStrength 0.85).

### Quality signal

```text
qualitySignal(q) = clamp((q - 0.5) * 2, -1, +1)
```

| quality | signal | Interpretation |
|---------|--------|----------------|
| 0.5 | 0 | neutral — no directional evidence |
| 1.0 | +1 | strong positive |
| 0.0 | −1 | strong weak/negative evidence |

### Level capacity multiplier (soft, distinct from ceiling)

```text
levelCapacity(L):  L1=0.55  L2=0.70  L3=0.82  L4=0.92  L5=1.00
```

### Stored event strength (0–1)

```text
relevance = evidenceWeight / 100
perf = abs(qualitySignal(quality))
raw = relevance * maxStrength * levelCapacity(evidenceLevel) * perf
strength = min(raw, relevance * maxStrength)
```

Neutral quality (0.5) → `strength = 0` (event exists but carries no weight).

---

## 4. Level ceiling model

Evidence level limits **achievable score bands**.

### Score ceilings (`LEVEL_SCORE_CEILING`)

```text
L1 → 35   L2 → 55   L3 → 75   L4 → 90   L5 → 100
```

### Proving a level

See Phase 4A.1 summary above. Constants:

```text
LEVEL_PROOF_AGGREGATE = 0.26
LEVEL_PROOF_DIVERSITY_FACTOR = 0.72   // per extra unique drill at level
LEVEL_PROOF_MIN_QUALITY = 0.55
LEVEL_PROOF_MIN_STRENGTH = 0.10
LEVEL_PROOF_SINGLE_QUALITY = 0.80
LEVEL_PROOF_SINGLE_STRENGTH = 0.48
```

```text
hardCeiling = LEVEL_SCORE_CEILING[max(provenLevels)]  or 35
score = applySoftCeiling(scoreRaw, hardCeiling)       // bleed=0.18
```

**Simulated behaviour:**

- 20× L1 farm → score≤35, conf≈0.31, breadth≈0.07 ✓
- 10 diverse → score≈68, conf≈0.56, breadth≈0.23 ✓
- q=0.55 × 20 → score≈38 (neutral cannot farm high scores) ✓

---

## 5. Score model (recompute weighted aggregation)

### Compared approaches

| Approach | Pros | Cons |
|----------|------|------|
| **A — Incremental EMA** | O(1) update | Drift on formula changes; order-sensitive edge cases |
| **B — Recompute from events** ✓ | Auditable, versionable, no drift | O(n) per recompute |
| **C — Bayesian** | Theoretically elegant | Harder to explain; calibration overhead |

**Recommendation: B — full recompute from events** for V1. At expected volumes (tens–low hundreds of events per user per competency), cost is negligible (<1 ms in simulation).

### Event target (directional suggestion)

```text
if qualitySignal ≥ 0:
  eventTarget = 50 + (LEVEL_SCORE_CEILING[level] - 50) * qualitySignal
else:
  floor = max(0, LEVEL_SCORE_CEILING[level] - 40)
  eventTarget = 50 + (floor - 50) * (-qualitySignal)
```

### Repetition factor (per competency + drillId, chronological)

```text
repetitionFactor(n) = n^-0.5    // REPETITION_POWER = 0.5
```

50 repetitions → cumulative effective weight ≈1.8× single event (not 50×).

### Final score

```text
effectiveWeight_i = strength_i × n_i^-0.5
scoreRaw = Σ(effectiveWeight_i × eventTarget_i) / Σ(effectiveWeight_i)
score = applySoftCeiling(scoreRaw, hardCeiling)
```

---

## 6. Confidence model (0–1)

**Frozen formula (Variant B):**

```text
effectiveVolume = Σ(strength_i × n_i^-0.5)
evidenceConfidence = 1 - exp(-0.95 × sqrt(effectiveVolume))
breadthModifier = 0.35 + 0.65 × sqrt(breadth)
confidence = min(0.98, evidenceConfidence × breadthModifier)
```

Constants: `CONFIDENCE_K=0.95`, `CONFIDENCE_MAX=0.98`.

**Not enforced:** `confidence ≤ breadth` — specialist may have higher confidence than breadth.

**Rejected for V1:** legacy `k=2.8` linear gate (overconfident at low breadth).

---

## 7. Breadth model (0–1)

Breadth = **normalized diversity** relative to the frozen evidence map for that competency.

Precompute catalog from `drill_profiles.json`:

```text
availableDrills, availableTracks, availableLetterGroups  per competency
```

```text
drillCoverage = Σ_d min(1, Σ events on drill d of strength*repetitionFactor) / availableDrills
trackCoverage = |tracks hit| / availableTracks
letterCoverage = |letter groups hit| / availableLetterGroups

breadth = 0.45*drillCoverage + 0.35*trackCoverage + 0.20*letterCoverage
```

Properties:

- Same drill 20× → drillCoverage ≈ 1/availableDrills (low)
- 10 drills / 3 tracks → breadth ~0.23–0.37 (sim)
- Competencies with fewer map tracks are not penalized (normalized)

---

## 8. Metric separation (strict)

| Metric | Meaning | Can differ because |
|--------|---------|-------------------|
| **Score** | How high competence appears | Strong L4/L5 events |
| **Confidence** | How sure we are | Many weighted events |
| **Breadth** | How wide evidence base is | Many drills/tracks |

**Simulated separability (calibrated):**

- 1× strong L4: score≈90, confidence≈0.26, breadth≈0.07 ✓
- Specialist: score≈84, confidence≈0.39, breadth≈0.07 ✓
- Generalist: score≈71, confidence≈0.61, breadth≈0.44 ✓
- Advanced scanning: score≈63, confidence≈0.40, breadth≈0.37 ✓

---

## 9. highestEvidenceLevel

**Recommendation:** same as **max proven level** used for score ceiling (§4), not a lone weak event.

```text
highestEvidenceLevel = max(provenLevels) or 0
```

Avoids UI showing hiLvl=5 while score ceiling still at L1.

---

## 10. Negative / weak evidence

| quality | strength | score effect |
|---------|----------|--------------|
| 0.5 | 0 | neutral — no update weight |
| 0.75 | moderate | positive pull toward level ceiling |
| 1.0 | high | strong positive |
| 0.25 | low | slight negative pull; does not prove level |
| 0.0 | high magnitude | negative directional target; **does not mean user skill = 0** |

Quality 0 ≠ “incompetent user”; it means “this observation was very weak.”

---

## 11. Recency / decay

**Recommendation for V1: no decay.**

Rationale: product measures **analytic competence**, not physical freshness. Events remain valid; breadth/confidence already encode exploration. Slow decay can be Phase 2+ if needed.

---

## 12. Farming & sparse-vs-diverse (calibrated simulation)

### 20× / 50× L1 farm (scanning A1_D1, q=1.0)

```text
n=20: score=35  confidence≈0.31  breadth≈0.07
n=50: score=35  confidence≈0.36  breadth≈0.07
```

### Sparse-vs-diverse matrix (20 events, q=0.85, space_structure)

| Pattern | score | confidence | breadth |
|---------|-------|------------|---------|
| A: 1×20 | 68 | 0.41 | 0.07 |
| B: 5×4 | 68 | 0.64 | 0.22 |
| C: 10×2 | 68 | 0.68 | 0.27 |
| D: 20×1 | 70 | 0.74 | 0.36 |

Score stable; **confidence and breadth increase with diversity** ✓

### High-score sanity paths (space_structure)

| Target | score | hiLvl | notes |
|--------|-------|-------|-------|
| ~50 | 53 | 2 | foundation |
| ~70 | 67 | 3 | applied |
| ~85 | 79 | 4 | strong L4 mix |
| ~95 | 85 | 4 | needs L5 proof for 90+ band — not trivial |

Score 95 requires sustained L5 evidence + breadth (rare by design).

---

## 13. Advanced user simulation (~50 synthetic events)

Re-run after calibration recommended at implementation; scanning now reflects L3 proof when diverse L3 hits accumulate.

---

## 14. maxStrength audit

Distribution (78 enabled profiles): peaks at 0.80, 0.85, 0.90, 0.95; **only E3_D4/E3_D5 = 1.0**.

```text
maxStrength = 1.0  ≠  user score 100
```

Means: a single event from that drill *could* (with q=1, level proof) contribute up to full band — still capped by level ceiling + aggregation.

---

## 15. Recompute vs incremental

**Recommendation: recompute-from-events as source of truth.**

```text
EvidenceEventRepository.append(event)
  → recompute_all_competencies(user)   // or lazy per competency
  → UserCompetencyStateRepository.save
```

Benefits: formula versioning, audit trail, bug recovery, no drift.
Optional: cache incremental for hot path later; recompute on read/write remains canonical.

Performance: 78 drills × ~50 events worst-case ≪ 1s Python; acceptable for V1.

---

## 16. Versioning

Every stored state and event batch tagged:

```text
engineVersion: "competency-engine-v1"
mapVersion: training+evidence commit hashes or "evidence-map-v1"
```

On engine bump: recompute all users from events. Events immutable; strength may be re-derived if map changes (map is frozen for V1).

---

## 17. Security / integrity

- Evidence created only server-side after auth + drill ownership validation
- `quality` from structured assessment pipeline or AI review endpoint — never trusted from client raw
- `strength`, `evidenceLevel`, `evidenceWeight` from frozen profile at event time (snapshot on event recommended)
- Admin/dev cannot mutate user competency without evidence audit log (future)
- Align with `docs/ai-rules/security-and-privacy.md`

---

## 18. Radar coverage readiness (from Evidence Map V1 audit)

All eight axes have ≥12 tracks of evidence; no single-drill dependency.
`transition_tempo` thinner but 52 sources / 15 tracks — engine breadth normalization handles map asymmetry.

---

## 19. Achsen-Korrelation (simulation, 78 vectors)

No pair ≥ |0.75|. Strongest: scanning ↔ evidence_analysis **r≈−0.72** (expected A vs E split).
Focus pairs moderate (~0.33–0.40) — axes remain distinguishable.

---

## 20. Frozen V1 constants

```text
ENGINE_VERSION = competency-engine-v1

LEVEL_SCORE_CEILING = {1:35, 2:55, 3:75, 4:90, 5:100}
LEVEL_CAPACITY = {1:0.55, 2:0.70, 3:0.82, 4:0.92, 5:1.00}

QUALITY_NEUTRAL = 0.5
REPETITION_POWER = 0.5                    // n^-0.5

LEVEL_PROOF_AGGREGATE = 0.26
LEVEL_PROOF_DIVERSITY_FACTOR = 0.72
LEVEL_PROOF_MIN_QUALITY = 0.55
LEVEL_PROOF_MIN_STRENGTH = 0.10
LEVEL_PROOF_SINGLE_QUALITY = 0.80
LEVEL_PROOF_SINGLE_STRENGTH = 0.48

SCORE_SOFT_CEILING_BLEED = 0.18

CONFIDENCE_K = 0.95
CONFIDENCE_BREADTH_BASE = 0.35
CONFIDENCE_BREADTH_SQRT_SCALE = 0.65
CONFIDENCE_MAX = 0.98

BREADTH_W_DRILL = 0.45
BREADTH_W_TRACK = 0.35
BREADTH_W_LETTER = 0.20
```

---

## 21. Known calibration notes (WORTH REVIEW)

| Item | Notes |
|------|-------|
| Level proof 6× vs 3× L4 | Both may prove L4; differentiate via confidence/breadth — stricter L4+ single-drill aggregate optional in beta |
| Watchlist synthesis drills | unchanged from Evidence Map audit |
| Quality rubric | Phase 4B; neutral 0.5 is load-bearing |
| Model 0–100 vs spec 0–1 | Align `UserCompetencyState` at implementation |

---

## 22. Implementation checklist (Phase 4B)

- [ ] `EvidenceEvent` persistence + append-only store
- [ ] `recompute_competency_state(user, competency_id, engine_version)`
- [ ] Coverage catalog loader from frozen JSON
- [ ] API: read competency state; no client write to score fields
- [ ] UI: confidence=0 → unrated spoke
- [ ] Unit tests port simulation invariants to production module

---

## Findings summary

```text
EXPECTED — confidence no longer ~0.99 at breadth≈0.23
EXPECTED — scanning breadth without artificial score 35 when L3 band proven
EXPECTED — specialist high score / low breadth; generalist lower score / high breadth
EXPECTED — q=0.55 cannot farm elite scores
WORTH REVIEW — L4 proof via 6× same drill vs 3× different (score/conf differ; hiLvl may match)
LIKELY INCONSISTENCY — none blocking implementation
```

```text
ENGINE V1 CALIBRATED
```
