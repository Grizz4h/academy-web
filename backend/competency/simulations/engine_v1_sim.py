#!/usr/bin/env python3
"""
Competency Engine V1 — design simulation only (Phase 4A / 4A.1).

Run calibration audit:
    python backend/competency/simulations/engine_v1_sim.py

NOT production runtime code.
"""

from __future__ import annotations

import json
import math
from collections import defaultdict
from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Dict, Iterable, List, Optional, Tuple

ENGINE_VERSION = "competency-engine-v1"

# --- Frozen V1 constants (Phase 4A.1 calibration) ---
LEVEL_SCORE_CEILING = {1: 35.0, 2: 55.0, 3: 75.0, 4: 90.0, 5: 100.0}
LEVEL_CAPACITY = {1: 0.55, 2: 0.70, 3: 0.82, 4: 0.92, 5: 1.00}

LEVEL_PROOF_AGGREGATE = 0.26
LEVEL_PROOF_MIN_STRENGTH = 0.10  # include moderate L2/L3 scanning hits in aggregate proof
LEVEL_PROOF_MIN_QUALITY = 0.55
LEVEL_PROOF_SINGLE_STRENGTH = 0.48
LEVEL_PROOF_SINGLE_QUALITY = 0.80
# At level L: threshold *= DIVERSITY^max(0, uniqueDrills-1) when uniqueDrills>=2
LEVEL_PROOF_DIVERSITY_FACTOR = 0.72

QUALITY_NEUTRAL = 0.5
REPETITION_POWER = 0.5  # n^-0.5 == 1/sqrt(n)

CONFIDENCE_K = 0.95
CONFIDENCE_BREADTH_BASE = 0.35
CONFIDENCE_BREADTH_SQRT_SCALE = 0.65
CONFIDENCE_MAX = 0.98  # pract. never 1.0

SCORE_SOFT_CEILING_BLEED = 0.18  # retain this fraction of excess above hard ceiling

BREADTH_W_DRILL = 0.45
BREADTH_W_TRACK = 0.35
BREADTH_W_LETTER = 0.20

COMPETENCIES = [
    "scanning_identification",
    "roles_support",
    "space_structure",
    "options_decisions",
    "transition_tempo",
    "pressure_control",
    "systems_patterns",
    "evidence_analysis",
]


@dataclass(frozen=True)
class MapEntry:
    drill_id: str
    track: str
    letter: str
    competency: str
    evidence_weight: float
    evidence_level: int
    max_strength: float


@dataclass
class SyntheticEvent:
    competency: str
    drill_id: str
    quality: float
    timestamp: datetime
    track: str = ""
    letter: str = ""
    evidence_weight: float = 0.0
    evidence_level: int = 1
    max_strength: float = 0.0
    strength: float = 0.0


@dataclass
class CompetencyState:
    competency_id: str
    score: float
    confidence: float
    evidence_count: int
    breadth: float
    highest_evidence_level: int
    last_evidence_at: Optional[datetime] = None
    assessed: bool = False


@dataclass
class CoverageCatalog:
    drills: Dict[str, set] = field(default_factory=lambda: defaultdict(set))
    tracks: Dict[str, set] = field(default_factory=lambda: defaultdict(set))
    letters: Dict[str, set] = field(default_factory=lambda: defaultdict(set))


def profiles_path() -> Path:
    return Path(__file__).resolve().parents[3] / "data/academy/competency/drill_profiles.json"


def load_coverage_catalog(profiles_path_arg: Optional[Path] = None) -> Tuple[Dict[str, MapEntry], CoverageCatalog]:
    path = profiles_path_arg or profiles_path()
    doc = json.loads(path.read_text())
    entries: Dict[str, MapEntry] = {}
    catalog = CoverageCatalog()
    for profile in doc["profiles"]:
        drill_id = profile["drillId"]
        if not profile["evidence"]["enabled"]:
            continue
        track = drill_id.split("_")[0]
        letter = drill_id[0]
        ev = profile["evidence"]
        for comp, weight in ev["weights"].items():
            if weight <= 0:
                continue
            key = f"{drill_id}:{comp}"
            entries[key] = MapEntry(
                drill_id=drill_id,
                track=track,
                letter=letter,
                competency=comp,
                evidence_weight=float(weight),
                evidence_level=int(ev["level"]),
                max_strength=float(ev["maxStrength"]),
            )
            catalog.drills[comp].add(drill_id)
            catalog.tracks[comp].add(track)
            catalog.letters[comp].add(letter)
    return entries, catalog


def quality_signal(quality: float) -> float:
    return max(-1.0, min(1.0, (quality - QUALITY_NEUTRAL) * 2.0))


def compute_event_strength(
    evidence_weight: float,
    max_strength: float,
    evidence_level: int,
    quality: float,
) -> float:
    relevance = evidence_weight / 100.0
    perf = abs(quality_signal(quality))
    raw = relevance * max_strength * LEVEL_CAPACITY[evidence_level] * perf
    cap = relevance * max_strength
    return max(0.0, min(raw, cap))


def event_target_score(evidence_level: int, quality: float) -> float:
    ceiling = LEVEL_SCORE_CEILING[evidence_level]
    sig = quality_signal(quality)
    if sig >= 0:
        return 50.0 + (ceiling - 50.0) * sig
    floor = max(0.0, ceiling - 40.0)
    return 50.0 + (floor - 50.0) * (-sig)


def repetition_factor(n: int, power: float = REPETITION_POWER) -> float:
    if n <= 0:
        return 0.0
    return n ** (-power)


def build_event(
    map_entries: Dict[str, MapEntry],
    competency: str,
    drill_id: str,
    quality: float,
    when: datetime,
) -> SyntheticEvent:
    key = f"{drill_id}:{competency}"
    if key not in map_entries:
        raise KeyError(f"No evidence map entry for {key}")
    m = map_entries[key]
    strength = compute_event_strength(m.evidence_weight, m.max_strength, m.evidence_level, quality)
    return SyntheticEvent(
        competency=competency,
        drill_id=drill_id,
        quality=quality,
        timestamp=when,
        track=m.track,
        letter=m.letter,
        evidence_weight=m.evidence_weight,
        evidence_level=m.evidence_level,
        max_strength=m.max_strength,
        strength=strength,
    )


def _ordered_events(events: Iterable[SyntheticEvent]) -> List[SyntheticEvent]:
    return sorted(events, key=lambda e: e.timestamp)


def _drill_counts(events: Iterable[SyntheticEvent]) -> Dict[str, int]:
    counts: Dict[str, int] = defaultdict(int)
    for ev in events:
        counts[ev.drill_id] += 1
    return counts


def _effective_weight(ev: SyntheticEvent, n: int) -> float:
    return ev.strength * repetition_factor(n)


def proven_level_details(events: Iterable[SyntheticEvent]) -> Tuple[Dict[int, float], Dict[int, set]]:
    support: Dict[int, float] = defaultdict(float)
    drills_at: Dict[int, set] = defaultdict(set)
    counts: Dict[str, int] = defaultdict(int)
    for ev in _ordered_events(events):
        counts[ev.drill_id] += 1
        if ev.quality < LEVEL_PROOF_MIN_QUALITY or ev.strength < LEVEL_PROOF_MIN_STRENGTH:
            continue
        lvl = ev.evidence_level
        support[lvl] += _effective_weight(ev, counts[ev.drill_id])
        drills_at[lvl].add(ev.drill_id)
    return support, drills_at


def _level_proof_threshold(unique_drills: int) -> float:
    threshold = LEVEL_PROOF_AGGREGATE
    if unique_drills >= 2:
        threshold *= LEVEL_PROOF_DIVERSITY_FACTOR ** (unique_drills - 1)
    return threshold


def proven_levels(events: Iterable[SyntheticEvent]) -> List[int]:
    support, drills_at = proven_level_details(events)
    proven = [
        lvl
        for lvl, s in support.items()
        if s >= _level_proof_threshold(len(drills_at[lvl]))
    ]
    for ev in events:
        if ev.quality >= LEVEL_PROOF_SINGLE_QUALITY and ev.strength >= LEVEL_PROOF_SINGLE_STRENGTH:
            proven.append(ev.evidence_level)
    return sorted(set(proven))


def score_ceiling_from_events(events: Iterable[SyntheticEvent]) -> float:
    proven = proven_levels(events)
    if not proven:
        return LEVEL_SCORE_CEILING[1]
    return LEVEL_SCORE_CEILING[max(proven)]


def highest_proven_level(events: Iterable[SyntheticEvent]) -> int:
    proven = proven_levels(events)
    return max(proven) if proven else 0


def apply_score_ceiling(raw: float, hard_ceiling: float, soft: bool = True) -> float:
    if raw <= hard_ceiling or not soft:
        return max(0.0, min(raw, hard_ceiling if not soft else raw))
    excess = raw - hard_ceiling
    return hard_ceiling + excess * SCORE_SOFT_CEILING_BLEED


def compute_breadth(
    events: List[SyntheticEvent],
    catalog: CoverageCatalog,
    competency: str,
) -> float:
    if not events:
        return 0.0
    avail_drills = max(1, len(catalog.drills[competency]))
    avail_tracks = max(1, len(catalog.tracks[competency]))
    avail_letters = max(1, len(catalog.letters[competency]))

    drill_contrib: Dict[str, float] = defaultdict(float)
    tracks_hit: set = set()
    letters_hit: set = set()
    counts: Dict[str, int] = defaultdict(int)

    for ev in events:
        counts[ev.drill_id] += 1
        drill_contrib[ev.drill_id] += _effective_weight(ev, counts[ev.drill_id])
        tracks_hit.add(ev.track)
        letters_hit.add(ev.letter)

    drill_coverage = sum(min(1.0, v) for v in drill_contrib.values()) / avail_drills
    track_coverage = len(tracks_hit) / avail_tracks
    letter_coverage = len(letters_hit) / avail_letters
    raw = (
        BREADTH_W_DRILL * drill_coverage
        + BREADTH_W_TRACK * track_coverage
        + BREADTH_W_LETTER * letter_coverage
    )
    return max(0.0, min(1.0, raw))


def effective_evidence_volume(events: List[SyntheticEvent]) -> float:
    counts: Dict[str, int] = defaultdict(int)
    total = 0.0
    for ev in _ordered_events(events):
        counts[ev.drill_id] += 1
        total += _effective_weight(ev, counts[ev.drill_id])
    return total


def compute_confidence_legacy(events: List[SyntheticEvent], breadth: float, k: float = 2.8) -> float:
    effective = effective_evidence_volume(events)
    gate = 0.25 + 0.75 * breadth
    return min(1.0, 1.0 - math.exp(-k * effective * gate))


def compute_confidence_variant_a(events: List[SyntheticEvent], breadth: float, k: float) -> float:
    effective = effective_evidence_volume(events)
    gate = 0.25 + 0.75 * breadth
    return min(CONFIDENCE_MAX, 1.0 - math.exp(-k * effective * gate))


def compute_confidence_variant_b(events: List[SyntheticEvent], breadth: float, k: float = CONFIDENCE_K) -> float:
    effective = effective_evidence_volume(events)
    evidence_conf = 1.0 - math.exp(-k * math.sqrt(max(0.0, effective)))
    breadth_mod = CONFIDENCE_BREADTH_BASE + CONFIDENCE_BREADTH_SQRT_SCALE * math.sqrt(max(0.0, breadth))
    return min(CONFIDENCE_MAX, evidence_conf * breadth_mod)


def compute_confidence(events: List[SyntheticEvent], breadth: float) -> float:
    """Calibrated V1 (Variant B)."""
    if not events:
        return 0.0
    return compute_confidence_variant_b(events, breadth)


def compute_score(events: List[SyntheticEvent], soft_ceiling: bool = True) -> float:
    if not events:
        return 0.0
    counts: Dict[str, int] = defaultdict(int)
    weighted_sum = 0.0
    weight_total = 0.0
    for ev in _ordered_events(events):
        counts[ev.drill_id] += 1
        w = _effective_weight(ev, counts[ev.drill_id])
        if w <= 0:
            continue
        weighted_sum += w * event_target_score(ev.evidence_level, ev.quality)
        weight_total += w
    if weight_total <= 0:
        return 0.0
    raw = weighted_sum / weight_total
    hard = score_ceiling_from_events(events)
    return round(apply_score_ceiling(raw, hard, soft=soft_ceiling), 1)


def recompute_competency(
    competency: str,
    events: List[SyntheticEvent],
    catalog: CoverageCatalog,
    *,
    soft_ceiling: bool = True,
    confidence_fn=compute_confidence,
) -> CompetencyState:
    comp_events = [e for e in events if e.competency == competency]
    comp_events = _ordered_events(comp_events)
    if not comp_events:
        return CompetencyState(
            competency_id=competency,
            score=0.0,
            confidence=0.0,
            evidence_count=0,
            breadth=0.0,
            highest_evidence_level=0,
            assessed=False,
        )
    breadth = compute_breadth(comp_events, catalog, competency)
    confidence = confidence_fn(comp_events, breadth)
    score = compute_score(comp_events, soft_ceiling=soft_ceiling)
    return CompetencyState(
        competency_id=competency,
        score=score,
        confidence=round(confidence, 3),
        evidence_count=len(comp_events),
        breadth=round(breadth, 3),
        highest_evidence_level=highest_proven_level(comp_events),
        last_evidence_at=comp_events[-1].timestamp,
        assessed=True,
    )


def _t(base: datetime, days: int) -> datetime:
    return base + timedelta(days=days)


def scenario_diverse_10(map_entries: Dict[str, MapEntry], catalog: CoverageCatalog) -> CompetencyState:
    base = datetime(2026, 2, 1, tzinfo=timezone.utc)
    drills = ["C1_D1", "C1_D2", "C2_D1", "C2_D2", "C3_D1", "C3_D2", "D1_D1", "D1_D2", "D2_D1", "D3_D1"]
    events = [build_event(map_entries, "space_structure", d, 0.85, _t(base, i)) for i, d in enumerate(drills)]
    return recompute_competency("space_structure", events, catalog)


def scenario_sparse_matrix(
    map_entries: Dict[str, MapEntry],
    catalog: CoverageCatalog,
    pattern: str,
    n_total: int = 20,
    quality: float = 0.85,
) -> CompetencyState:
    """A:1×20, B:5×4, C:10×2, D:20×1 on space_structure L3-ish drills."""
    pools = {
        "A": ["C1_D1"],
        "B": ["C1_D1", "C2_D1", "C3_D1", "D1_D1", "D2_D1"],
        "C": ["C1_D1", "C1_D2", "C2_D1", "C2_D2", "C3_D1", "C3_D2", "D1_D1", "D1_D2", "D2_D1", "D3_D1"],
        "D": ["C1_D1", "C1_D2", "C1_D3", "C2_D1", "C2_D2", "C2_D3", "C3_D1", "C3_D2", "C3_D3", "D1_D1",
              "D1_D2", "D1_D3", "D2_D1", "D2_D2", "D3_D1", "D3_D2", "D3_D3", "D4_D1", "D4_D2", "D4_D3"],
    }
    reps = {"A": 20, "B": 4, "C": 2, "D": 1}[pattern]
    drills = pools[pattern]
    base = datetime(2026, 7, 1, tzinfo=timezone.utc)
    events: List[SyntheticEvent] = []
    day = 0
    for _ in range(n_total // reps):
        for d in drills:
            for _r in range(reps):
                events.append(build_event(map_entries, "space_structure", d, quality, _t(base, day)))
                day += 1
    return recompute_competency("space_structure", events, catalog)


def scenario_specialist_vs_generalist(map_entries: Dict[str, MapEntry], catalog: CoverageCatalog) -> Tuple[CompetencyState, CompetencyState]:
    base = datetime(2026, 8, 1, tzinfo=timezone.utc)
    specialist = [
        build_event(map_entries, "space_structure", "C1_D4", 0.92, _t(base, i))
        for i in range(6)
    ]
    generalist_drills = ["A2_D1", "B2_D1", "C1_D4", "C2_D4", "D1_D3", "D2_D2", "D3_D4", "E2_D3", "E3_D2", "C3_D5"]
    generalist = [
        build_event(map_entries, "space_structure", d, 0.80, _t(base, i))
        for i, d in enumerate(generalist_drills)
    ]
    return (
        recompute_competency("space_structure", specialist, catalog),
        recompute_competency("space_structure", generalist, catalog),
    )


def scenario_advanced_scanning(map_entries: Dict[str, MapEntry], catalog: CoverageCatalog) -> None:
    base = datetime(2026, 4, 1, tzinfo=timezone.utc)
    drills = [
        ("A1_D1", 0.75), ("B1_D2", 0.82), ("C1_D1", 0.88), ("D3_D1", 0.84),
        ("E1_D2", 0.87), ("C2_D1", 0.83), ("A3_D2", 0.79),
    ]
    events = [build_event(map_entries, "scanning_identification", d, q, _t(base, i)) for i, (d, q) in enumerate(drills)]
    st = recompute_competency("scanning_identification", events, catalog)
    support, drills_at = proven_level_details(events)
    print("  events:")
    for ev in events:
        print(f"    {ev.drill_id} L{ev.evidence_level} str={ev.strength:.3f} tgt={event_target_score(ev.evidence_level, ev.quality):.1f}")
    print(f"  level support={dict(support)} unique={ {k: len(v) for k,v in drills_at.items()} }")
    print(f"  proven={proven_levels(events)} ceiling={score_ceiling_from_events(events)}")
    print(f"  score={st.score} conf={st.confidence} breadth={st.breadth} hiLvl={st.highest_evidence_level}")


def run_calibration() -> None:
    map_entries, catalog = load_coverage_catalog()
    base = datetime(2026, 1, 1, tzinfo=timezone.utc)

    print("=" * 60)
    print("PHASE 4A.1 — ENGINE CALIBRATION")
    print("ENGINE_VERSION", ENGINE_VERSION)
    print("=" * 60)

    # 1. Confidence variants on 10 diverse / 3 tracks
    print("\n=== 1. Confidence variants (10 drills / 3 tracks, space_structure) ===")
    div = scenario_diverse_10(map_entries, catalog)
    eff = effective_evidence_volume([
        build_event(map_entries, "space_structure", d, 0.85, base)
        for d in ["C1_D1", "C1_D2", "C2_D1", "C2_D2", "C3_D1", "C3_D2", "D1_D1", "D1_D2", "D2_D1", "D3_D1"]
    ])
    print(f"  breadth={div.breadth:.3f} effectiveVolume={eff:.3f}")
    print(f"  LEGACY k=2.8: conf={compute_confidence_legacy([], div.breadth):.3f} (placeholder)")
    ev10 = [
        build_event(map_entries, "space_structure", d, 0.85, _t(base, i))
        for i, d in enumerate(["C1_D1", "C1_D2", "C2_D1", "C2_D2", "C3_D1", "C3_D2", "D1_D1", "D1_D2", "D2_D1", "D3_D1"])
    ]
    for label, fn in [
        ("legacy k=2.8", lambda e, b: compute_confidence_legacy(e, b, 2.8)),
        ("varA k=1.2", lambda e, b: compute_confidence_variant_a(e, b, 1.2)),
        ("varA k=1.6", lambda e, b: compute_confidence_variant_a(e, b, 1.6)),
        ("varB k=0.95 CAL", compute_confidence_variant_b),
    ]:
        c = fn(ev10, div.breadth)
        print(f"  {label:18s} conf={c:.3f}  (target 0.55–0.80)")

    print(f"\n  CALIBRATED full state: score={div.score} conf={div.confidence} breadth={div.breadth} hiLvl={div.highest_evidence_level}")

    # Confidence targets
    print("\n=== Confidence calibration targets ===")
    cases = [
        ("1 good event", [build_event(map_entries, "space_structure", "C1_D4", 0.90, base)]),
        ("3 events 1-2 drills", [
            build_event(map_entries, "space_structure", "C1_D1", 0.88, _t(base, i)) for i in range(3)
        ]),
        ("10 diverse", ev10),
    ]
    for label, evs in cases:
        b = compute_breadth(evs, catalog, "space_structure")
        c = compute_confidence(evs, b)
        print(f"  {label:22s} conf={c:.3f} breadth={b:.3f}")

    # 3. Scanning advanced diagnosis
    print("\n=== 3. Advanced scanning diagnosis ===")
    scenario_advanced_scanning(map_entries, catalog)

    # 4. Hard vs soft ceiling
    print("\n=== 4. Hard vs soft ceiling (7 mixed scanning events) ===")
    scan_events = [
        build_event(map_entries, "scanning_identification", d, q, _t(base, i))
        for i, (d, q) in enumerate([
            ("A1_D1", 0.75), ("B1_D2", 0.82), ("C1_D1", 0.88), ("D3_D1", 0.84),
            ("E1_D2", 0.87), ("C2_D1", 0.83), ("A3_D2", 0.79),
        ])
    ]
    raw = compute_score(scan_events, soft_ceiling=False)
    # compute raw manually
    counts: Dict[str, int] = defaultdict(int)
    ws = wt = 0.0
    for ev in scan_events:
        counts[ev.drill_id] += 1
        w = _effective_weight(ev, counts[ev.drill_id])
        ws += w * event_target_score(ev.evidence_level, ev.quality)
        wt += w
    raw_mean = ws / wt if wt else 0
    hard = score_ceiling_from_events(scan_events)
    soft = apply_score_ceiling(raw_mean, hard, True)
    print(f"  rawMean={raw_mean:.1f} hardCeiling={hard} hardScore={min(raw_mean,hard):.1f} softScore={soft:.1f}")

    # 5. Level proof diversity: 6× same L4 vs 3× different L4
    print("\n=== 5. Level proof diversity (L4 space_structure) ===")
    same6 = [build_event(map_entries, "space_structure", "C1_D4", 0.90, _t(base, i)) for i in range(6)]
    diff3 = [
        build_event(map_entries, "space_structure", d, 0.90, _t(base, i))
        for i, d in enumerate(["C1_D4", "C2_D4", "D1_D4"])
    ]
    for label, evs in [("6× C1_D4", same6), ("3× L4 drills", diff3)]:
        sup, da = proven_level_details(evs)
        print(f"  {label}: support={dict(sup)} proven={proven_levels(evs)} hiLvl={highest_proven_level(evs)}")

    # 7. Quality sweep extended
    print("\n=== 7. Quality sweep (C1_D4) ===")
    for q in (0.25, 0.40, 0.50, 0.55, 0.60, 0.75, 1.0):
        ev = [build_event(map_entries, "space_structure", "C1_D4", q, base)]
        st = recompute_competency("space_structure", ev, catalog)
        print(f"  q={q:.2f} score={st.score} str={ev[0].strength:.3f}")

    # q=0.55 farming
    print("\n  20× q=0.55 C1_D4:")
    farm55 = [build_event(map_entries, "space_structure", "C1_D4", 0.55, _t(base, i)) for i in range(20)]
    st55 = recompute_competency("space_structure", farm55, catalog)
    print(f"    score={st55.score} conf={st55.confidence} (neutral should not farm high scores)")

    # 8. Repetition curve
    print("\n=== 8. Repetition cumulative (C1_D4 q=0.9) ===")
    cumulative = 0.0
    for n in (1, 2, 3, 5, 10, 20, 50):
        inc = compute_event_strength(80, 0.9, 4, 0.9) * repetition_factor(n)
        cumulative += inc
        print(f"  n={n:2d} factor={repetition_factor(n):.3f} increment={inc:.3f} cumulative={cumulative:.3f}")
    for p in (0.6, 0.7):
        print(f"  alt power={p}: n=50 factor={50**(-p):.4f}")

    # 9. Sparse vs diverse matrix
    print("\n=== 9. Sparse-vs-diverse matrix (20 events, q=0.85) ===")
    for pat in ("A", "B", "C", "D"):
        st = scenario_sparse_matrix(map_entries, catalog, pat)
        print(f"  {pat}: score={st.score} conf={st.confidence} breadth={st.breadth}")

    # 10. High score requirements (synthetic paths)
    print("\n=== 10. High score sanity paths ===")
    paths = {
        "~50": [("A2_D1", 0.75), ("B2_D1", 0.78)],
        "~70": [("C1_D2", 0.82), ("C2_D2", 0.84), ("D1_D1", 0.86)],
        "~85": [("C1_D4", 0.88), ("D1_D3", 0.90), ("D2_D2", 0.88), ("E2_D3", 0.87)],
        "~95": [("C1_D4", 0.95), ("C2_D4", 0.94), ("D1_D3", 0.93), ("D3_D4", 0.92), ("D2_D4", 0.91)],
    }
    for target, plan in paths.items():
        events = [build_event(map_entries, "space_structure", d, q, _t(base, i)) for i, (d, q) in enumerate(plan)]
        st = recompute_competency("space_structure", events, catalog)
        print(f"  target {target}: score={st.score} conf={st.confidence} breadth={st.breadth} hiLvl={st.highest_evidence_level}")

    # 11. Specialist vs generalist
    print("\n=== 11. Specialist vs Generalist ===")
    spec, gen = scenario_specialist_vs_generalist(map_entries, catalog)
    print(f"  Specialist: score={spec.score} conf={spec.confidence} breadth={spec.breadth}")
    print(f"  Generalist: score={gen.score} conf={gen.confidence} breadth={gen.breadth}")

    # Farming 20/50
    print("\n=== Farming 20× / 50× L1 scanning ===")
    for n in (20, 50):
        evs = [build_event(map_entries, "scanning_identification", "A1_D1", 1.0, _t(base, i)) for i in range(n)]
        st = recompute_competency("scanning_identification", evs, catalog)
        print(f"  n={n}: score={st.score} conf={st.confidence} breadth={st.breadth} effVol={effective_evidence_volume(evs):.2f}")

    print("\nSTATUS: ENGINE V1 CALIBRATED")


def main() -> None:
    run_calibration()


if __name__ == "__main__":
    main()
