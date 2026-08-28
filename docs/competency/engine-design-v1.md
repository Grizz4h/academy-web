# Competency Engine Design V1

**Phase 4A — design & simulation only.**  
**Status:** `ENGINE DESIGN V1 READY`  
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
| `score` | 0–100 | Estimated competence height **when assessed** |
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

Internal derived metrics (not public V1): `effectiveEvidence`, `provenLevelSupport`, `coverageCatalogVersion`.

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

## 4. Level ceiling model (hard rule)

Evidence level limits **achievable score bands**, not merely event weight.

### Score ceilings

```text
L1 → 35
L2 → 55
L3 → 75
L4 → 90
L5 → 100
```

### Proving a level (aggregate + optional fast-path)

A level `L` is **proven** if either:

1. **Aggregate:** `Σ strength` of qualifying events at level `L` ≥ **0.30**  
   (qualifying: `quality ≥ 0.55` and `strength ≥ 0.12`)

2. **Fast-path (single exceptional event):** `quality ≥ 0.80` AND `strength ≥ 0.50`

```text
scoreCeiling = LEVEL_SCORE_CEILING[max(provenLevels)]  or 35 if none proven
```

**Simulated behaviour:**

- 20× perfect L1 farm → score ≤ 35, hiLvl=1 ✓
- L4 single event q=1.0 → score ≤ 90 ✓
- Many L1 events raise confidence, not ceiling ✓

---

## 5. Score model (recommended: recompute weighted aggregation)

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
repetitionFactor(n) = 1 / sqrt(n)     ← recommended V1
```

Alternatives simulated: `1/(1+0.45*(n-1))`, `exp(-0.18*(n-1))`.  
`1/sqrt(n)` balances first-attempt full weight, useful 2nd/3rd reps, minimal 20th rep.

### Final score

```text
effectiveWeight_i = strength_i * repetitionFactor(n_i)
scoreRaw = Σ(effectiveWeight_i * eventTarget_i) / Σ(effectiveWeight_i)
score = clamp(scoreRaw, 0, scoreCeiling)
```

Properties:

- Single event cannot jump to 95 unless level + weights allow
- Poor quality can pull below midpoint
- High confidence requires many diverse events (see §7)
- Not monotonic globally (new weak evidence can lower score)

---

## 6. Confidence model (0–1)

**Recommendation:** saturating exponential over **diversity-gated effective evidence**.

```text
effectiveEvidence = Σ(strength_i * repetitionFactor(n_i))
diversityGate = 0.25 + 0.75 * breadth
confidence = 1 - exp(-k * effectiveEvidence * diversityGate)
```

`k = 2.8` (tuned in simulation).

Compared to plain `1 - exp(-k * count)`: diversity gate prevents 20 same-drill reps from → 1.0.

| Scenario | confidence (sim) |
|----------|------------------|
| 20× L1 farm | ~0.55 |
| 10 diverse drills / 3 tracks | ~0.99 |
| 30× gamer farm | ~0.63 |

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

**Simulated separability:**

- 2× strong L4 events: score≈85, confidence≈0.57, breadth≈0.07 ✓
- Advanced user space_structure: score≈80, confidence≈0.97, breadth≈0.33 ✓
- Advanced scanning (spread, no level depth): score≈35, confidence≈0.63, breadth≈0.37 ✓  
  → demonstrates breadth without score inflation (WORTH REVIEW for calibration)

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

## 12. Farming protection (simulation results)

### Scenario A — 20× same L1 drill, q=1.0

```text
score=35  confidence≈0.55  breadth≈0.07  hiLvl=1
```

### Scenario B — 10 drills, 3 tracks

```text
score≈67.5  confidence≈0.99  breadth≈0.23  hiLvl=3
```

### Scenario C — A→E progression (space_structure)

| After | score | conf | breadth | hiLvl |
|-------|-------|------|---------|-------|
| A2_D1 | 35 | 0.16 | 0.06 | 0 |
| B2_D1 | 53 | 0.31 | 0.13 | 2 |
| C1_D4 | 69 | 0.63 | 0.19 | 4 |
| D1_D3 | 74 | 0.83 | 0.26 | 4 |
| E1_D4 | 77 | 0.90 | 0.32 | 4 |

Higher bands unlock with higher-level evidence ✓

### Scenario D — gaming user (30× A1_D1)

```text
score=35  confidence≈0.63  breadth≈0.07  hiLvl=1
vs advanced breadth explorer: same score, 5× breadth
```

Completion farming does not explode radar ✓

---

## 13. Advanced user simulation (~50 synthetic events)

| Competency | score | conf | breadth | hiLvl |
|------------|-------|------|---------|-------|
| scanning_identification | 35 | 0.63 | 0.37 | 0 |
| roles_support | 68 | 0.90 | 0.34 | 3 |
| space_structure | 80 | 0.97 | 0.33 | 5 |
| options_decisions | 78 | 0.93 | 0.29 | 5 |
| transition_tempo | 77 | 0.89 | 0.27 | 4 |
| pressure_control | 74 | 0.95 | 0.29 | 4 |
| systems_patterns | 86 | 0.98 | 0.28 | 5 |
| evidence_analysis | 91 | 1.00 | 0.42 | 5 |

E3_D4/D5: score high on analysis only with map-appropriate narrow profiles ✓

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

## 20. Known calibration risks (WORTH REVIEW, not blockers)

| Risk | Notes |
|------|-------|
| `LEVEL_PROOF_AGGREGATE = 0.30` | May be strict for “wide but shallow” explorers (scanning advanced sim) |
| Watchlist broad profiles | B3/C/D synthesis drills — observe in beta |
| confidence/breadth 0–1 vs model 0–100 | Resolve at implementation |
| E4 training-only | Engine must skip E4 drills for evidence entirely |
| Quality rubric undefined | Phase 4B; neutral 0.5 critical |

---

## 21. Implementation checklist (Phase 4B — out of scope here)

- [ ] `EvidenceEvent` persistence + append-only store
- [ ] `recompute_competency_state(user, competency_id, engine_version)`
- [ ] Coverage catalog loader from frozen JSON
- [ ] API: read competency state; no client write to score fields
- [ ] UI: confidence=0 → unrated spoke
- [ ] Unit tests port simulation invariants to production module

---

## Findings summary

```text
EXPECTED — recompute architecture; level ceilings; farming protection; E4 excluded
EXPECTED — score/confidence/breadth separable; no decay V1
EXPECTED — E3 maxStrength 1.0 is capacity not score
WORTH REVIEW — level proof threshold tuning; scanning “wide shallow” pattern
WORTH REVIEW — existing broad synthesis watchlist drills
LIKELY INCONSISTENCY — none blocking V1 design
```

```text
ENGINE DESIGN V1 READY
```
