#!/usr/bin/env python3
"""
Competency Engine V1 — design simulation only.

Deterministic, no I/O side effects when imported. Run directly for audit output:
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

# --- Level ceiling (score cap supported by evidence level) ---
LEVEL_SCORE_CEILING = {1: 35.0, 2: 55.0, 3: 75.0, 4: 90.0, 5: 100.0}

LEVEL_PROOF_AGGREGATE = 0.30  # tuned: sum(strength) at level L to "prove" band L
LEVEL_PROOF_SINGLE_STRENGTH = 0.50  # optional fast-path
LEVEL_PROOF_SINGLE_QUALITY = 0.80

# Minimum event strength + quality to count toward level support
LEVEL_PROOF_MIN_STRENGTH = 0.12
LEVEL_PROOF_MIN_QUALITY = 0.55

# highestEvidenceLevel uses same thresholds
HIGHEST_LEVEL_MIN_STRENGTH = LEVEL_PROOF_MIN_STRENGTH
HIGHEST_LEVEL_MIN_QUALITY = LEVEL_PROOF_MIN_QUALITY

# Confidence saturation constant (tuned on synthetic scenarios)
CONFIDENCE_K = 2.8

# Breadth weights (must sum to 1)
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
    """Per-competency available evidence sources from frozen Evidence Map V1."""
    drills: Dict[str, set] = field(default_factory=lambda: defaultdict(set))
    tracks: Dict[str, set] = field(default_factory=lambda: defaultdict(set))
    letters: Dict[str, set] = field(default_factory=lambda: defaultdict(set))


def load_coverage_catalog(profiles_path: Path) -> Tuple[Dict[str, MapEntry], CoverageCatalog]:
    doc = json.loads(profiles_path.read_text())
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
    """Neutral at 0.5; positive above, negative below. Range approx [-1, +1]."""
    return max(-1.0, min(1.0, (quality - 0.5) * 2.0))


def compute_event_strength(
    evidence_weight: float,
    max_strength: float,
    evidence_level: int,
    quality: float,
) -> float:
    """
    Stored event strength (0–1).

    Semantics:
    - evidenceWeight/100 → drill relevance for competency
    - maxStrength → per-drill believability cap
    - evidenceLevel → soft capacity multiplier (not redundant with maxStrength)
    - quality → performance (neutral at 0.5)
    """
    relevance = evidence_weight / 100.0
    level_capacity = {1: 0.55, 2: 0.70, 3: 0.82, 4: 0.92, 5: 1.00}[evidence_level]
    perf = abs(quality_signal(quality))
    raw = relevance * max_strength * level_capacity * perf
    cap = relevance * max_strength
    return max(0.0, min(raw, cap))


def event_target_score(evidence_level: int, quality: float) -> float:
    """
    Directional score suggestion from one event before aggregation.
    Neutral quality → midpoint (no directional pull).
    """
    ceiling = LEVEL_SCORE_CEILING[evidence_level]
    sig = quality_signal(quality)
    if sig >= 0:
        return 50.0 + (ceiling - 50.0) * sig
    floor = max(0.0, ceiling - 40.0)
    return 50.0 + (floor - 50.0) * (-sig)


def repetition_factor(variant: str, n: int) -> float:
    if n <= 0:
        return 0.0
    if variant == "sqrt":
        return 1.0 / math.sqrt(n)
    if variant == "harmonic":
        return 1.0 / (1.0 + 0.45 * (n - 1))
    if variant == "exp":
        return math.exp(-0.18 * (n - 1))
    raise ValueError(variant)


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


def proven_level_support(events: Iterable[SyntheticEvent]) -> Dict[int, float]:
    by_level: Dict[int, float] = defaultdict(float)
    for ev in events:
        if ev.quality < LEVEL_PROOF_MIN_QUALITY or ev.strength < LEVEL_PROOF_MIN_STRENGTH:
            continue
        by_level[ev.evidence_level] += ev.strength
    return by_level


def proven_levels(events: Iterable[SyntheticEvent]) -> List[int]:
    support = proven_level_support(events)
    proven = [lvl for lvl, s in support.items() if s >= LEVEL_PROOF_AGGREGATE]
    for ev in events:
        if ev.quality >= LEVEL_PROOF_SINGLE_QUALITY and ev.strength >= LEVEL_PROOF_SINGLE_STRENGTH:
            proven.append(ev.evidence_level)
    return proven


def score_ceiling_from_events(events: Iterable[SyntheticEvent]) -> float:
    proven = proven_levels(events)
    if not proven:
        return LEVEL_SCORE_CEILING[1]
    return LEVEL_SCORE_CEILING[max(proven)]


def highest_proven_level(events: Iterable[SyntheticEvent]) -> int:
    proven = proven_levels(events)
    return max(proven) if proven else 0


def compute_breadth(
    events: List[SyntheticEvent],
    catalog: CoverageCatalog,
    competency: str,
    rep_variant: str = "sqrt",
) -> float:
    if not events:
        return 0.0
    avail_drills = max(1, len(catalog.drills[competency]))
    avail_tracks = max(1, len(catalog.tracks[competency]))
    avail_letters = max(1, len(catalog.letters[competency]))

    drill_contrib: Dict[str, float] = defaultdict(float)
    tracks_hit: set = set()
    letters_hit: set = set()
    drill_counts: Dict[str, int] = defaultdict(int)

    for ev in events:
        drill_counts[ev.drill_id] += 1
        n = drill_counts[ev.drill_id]
        drill_contrib[ev.drill_id] += ev.strength * repetition_factor(rep_variant, n)
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


def compute_confidence(
    events: List[SyntheticEvent],
    breadth: float,
    rep_variant: str = "sqrt",
) -> float:
    if not events:
        return 0.0
    drill_counts: Dict[str, int] = defaultdict(int)
    effective = 0.0
    for ev in events:
        drill_counts[ev.drill_id] += 1
        n = drill_counts[ev.drill_id]
        effective += ev.strength * repetition_factor(rep_variant, n)
    # Diversity gate: confidence cannot exceed breadth-driven ceiling much
    diversity_gate = 0.25 + 0.75 * breadth
    effective *= diversity_gate
    return max(0.0, min(1.0, 1.0 - math.exp(-CONFIDENCE_K * effective)))


def compute_score(
    events: List[SyntheticEvent],
    rep_variant: str = "sqrt",
) -> float:
    if not events:
        return 0.0
    drill_counts: Dict[str, int] = defaultdict(int)
    weighted_sum = 0.0
    weight_total = 0.0
    for ev in events:
        drill_counts[ev.drill_id] += 1
        n = drill_counts[ev.drill_id]
        w = ev.strength * repetition_factor(rep_variant, n)
        if w <= 0:
            continue
        target = event_target_score(ev.evidence_level, ev.quality)
        weighted_sum += w * target
        weight_total += w
    if weight_total <= 0:
        return 0.0
    raw = weighted_sum / weight_total
    ceiling = score_ceiling_from_events(events)
    return max(0.0, min(raw, ceiling))


def recompute_competency(
    competency: str,
    events: List[SyntheticEvent],
    catalog: CoverageCatalog,
    rep_variant: str = "sqrt",
) -> CompetencyState:
    comp_events = sorted([e for e in events if e.competency == competency], key=lambda e: e.timestamp)
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
    breadth = compute_breadth(comp_events, catalog, competency, rep_variant)
    confidence = compute_confidence(comp_events, breadth, rep_variant)
    score = compute_score(comp_events, rep_variant)
    highest = highest_proven_level(comp_events)
    return CompetencyState(
        competency_id=competency,
        score=round(score, 1),
        confidence=round(confidence, 3),
        evidence_count=len(comp_events),
        breadth=round(breadth, 3),
        highest_evidence_level=highest,
        last_evidence_at=comp_events[-1].timestamp,
        assessed=True,
    )


def recompute_all(
    events: List[SyntheticEvent],
    catalog: CoverageCatalog,
    rep_variant: str = "sqrt",
) -> Dict[str, CompetencyState]:
    return {
        comp: recompute_competency(comp, events, catalog, rep_variant)
        for comp in COMPETENCIES
    }


# --- Scenario helpers ---

def _t(base: datetime, days: int) -> datetime:
    return base + timedelta(days=days)


def scenario_farm_l1(
    map_entries: Dict[str, MapEntry],
    rep_variant: str = "sqrt",
) -> Dict[str, CompetencyState]:
    """20× same L1 drill, quality=1.0 — scanning via A1_D1."""
    base = datetime(2026, 1, 1, tzinfo=timezone.utc)
    events = [
        build_event(map_entries, "scanning_identification", "A1_D1", 1.0, _t(base, i))
        for i in range(20)
    ]
    _, catalog = load_coverage_catalog(Path(__file__).resolve().parents[3] / "data/academy/competency/drill_profiles.json")
    return recompute_all(events, catalog, rep_variant)


def scenario_diverse(
    map_entries: Dict[str, MapEntry],
) -> CompetencyState:
    """10 drills, 3 tracks, space_structure."""
    base = datetime(2026, 2, 1, tzinfo=timezone.utc)
    drills = ["C1_D1", "C1_D2", "C2_D1", "C2_D2", "C3_D1", "C3_D2", "D1_D1", "D1_D2", "D2_D1", "D3_D1"]
    events = [
        build_event(map_entries, "space_structure", drill, 0.85, _t(base, i))
        for i, drill in enumerate(drills)
    ]
    _, catalog = load_coverage_catalog(Path(__file__).resolve().parents[3] / "data/academy/competency/drill_profiles.json")
    return recompute_competency("space_structure", events, catalog)


def scenario_progression(
    map_entries: Dict[str, MapEntry],
    competency: str = "space_structure",
) -> List[Tuple[str, CompetencyState]]:
    """A→B→C→D→E rising levels."""
    base = datetime(2026, 3, 1, tzinfo=timezone.utc)
    plan = [
        ("A1_D1", 0.8),
        ("A2_D1", 0.82),
        ("B2_D1", 0.85),
        ("C1_D4", 0.88),
        ("D1_D3", 0.9),
        ("E1_D4", 0.92),
        ("E3_D4", 0.95),
    ]
    _, catalog = load_coverage_catalog(Path(__file__).resolve().parents[3] / "data/academy/competency/drill_profiles.json")
    snapshots = []
    events: List[SyntheticEvent] = []
    for i, (drill, q) in enumerate(plan):
        try:
            events.append(build_event(map_entries, competency, drill, q, _t(base, i * 3)))
        except KeyError:
            continue
        snapshots.append((drill, recompute_competency(competency, events, catalog)))
    return snapshots


def scenario_advanced_user(map_entries: Dict[str, MapEntry]) -> Dict[str, CompetencyState]:
    base = datetime(2026, 4, 1, tzinfo=timezone.utc)
    samples = [
        ("scanning_identification", "A1_D1", 0.75),
        ("scanning_identification", "B1_D2", 0.82),
        ("scanning_identification", "C1_D1", 0.88),
        ("roles_support", "B1_D1", 0.8),
        ("roles_support", "C1_D2", 0.86),
        ("roles_support", "D1_D2", 0.9),
        ("space_structure", "A2_D1", 0.78),
        ("space_structure", "C1_D4", 0.92),
        ("space_structure", "D2_D2", 0.88),
        ("space_structure", "E2_D3", 0.9),
        ("options_decisions", "A2_D2", 0.77),
        ("options_decisions", "D3_D1", 0.91),
        ("options_decisions", "E1_D4", 0.93),
        ("transition_tempo", "A3_D1", 0.8),
        ("transition_tempo", "E2_D2", 0.94),
        ("pressure_control", "B2_D2", 0.83),
        ("pressure_control", "C2_D3", 0.87),
        ("pressure_control", "D2_D3", 0.89),
        ("systems_patterns", "C1_D5", 0.9),
        ("systems_patterns", "D1_D5", 0.88),
        ("systems_patterns", "E2_D5", 0.92),
        ("evidence_analysis", "B3_D5", 0.85),
        ("evidence_analysis", "C1_D5", 0.88),
        ("evidence_analysis", "E3_D4", 0.96),
        ("evidence_analysis", "E3_D5", 0.97),
        ("scanning_identification", "D3_D1", 0.84),
        ("roles_support", "D4_D1", 0.81),
        ("space_structure", "E3_D2", 0.91),
        ("options_decisions", "E2_D3", 0.86),
        ("transition_tempo", "D2_D4", 0.88),
        ("pressure_control", "D1_D1", 0.8),
        ("systems_patterns", "E1_D5", 0.9),
        ("evidence_analysis", "E2_D5", 0.94),
        ("scanning_identification", "E1_D2", 0.87),
        ("roles_support", "E2_D4", 0.89),
        ("space_structure", "C2_D4", 0.93),
        ("options_decisions", "C3_D4", 0.9),
        ("transition_tempo", "B3_D4", 0.85),
        ("pressure_control", "C1_D3", 0.86),
        ("systems_patterns", "E3_D3", 0.92),
        ("evidence_analysis", "E1_D5", 0.95),
        ("space_structure", "D3_D4", 0.91),
        ("scanning_identification", "C2_D1", 0.83),
        ("roles_support", "B3_D3", 0.84),
        ("options_decisions", "D3_D3", 0.88),
        ("transition_tempo", "E2_D1", 0.9),
        ("pressure_control", "D3_D4", 0.92),
        ("systems_patterns", "C3_D5", 0.89),
        ("evidence_analysis", "D2_D5", 0.87),
        ("space_structure", "E3_D2", 0.91),
        ("scanning_identification", "A3_D2", 0.79),
    ]
    events = []
    for i, (comp, drill, q) in enumerate(samples):
        try:
            events.append(build_event(map_entries, comp, drill, q, _t(base, i)))
        except KeyError:
            pass
    _, catalog = load_coverage_catalog(Path(__file__).resolve().parents[3] / "data/academy/competency/drill_profiles.json")
    return recompute_all(events, catalog)


def scenario_gamer(map_entries: Dict[str, MapEntry]) -> Dict[str, CompetencyState]:
    """100% completion farming one easy drill."""
    base = datetime(2026, 5, 1, tzinfo=timezone.utc)
    events = [
        build_event(map_entries, "scanning_identification", "A1_D1", 1.0, _t(base, i))
        for i in range(30)
    ]
    _, catalog = load_coverage_catalog(Path(__file__).resolve().parents[3] / "data/academy/competency/drill_profiles.json")
    return recompute_all(events, catalog)


def compare_repetition_models(map_entries: Dict[str, MapEntry]) -> None:
    print("\n=== Repetition model comparison (20× A1_D1 L1 farm, scanning_identification) ===")
    base = datetime(2026, 1, 1, tzinfo=timezone.utc)
    events = [
        build_event(map_entries, "scanning_identification", "A1_D1", 1.0, _t(base, i))
        for i in range(20)
    ]
    _, catalog = load_coverage_catalog(Path(__file__).resolve().parents[3] / "data/academy/competency/drill_profiles.json")
    for variant in ("sqrt", "harmonic", "exp"):
        st = recompute_competency("scanning_identification", events, catalog, variant)
        print(f"  {variant:9s} score={st.score:5.1f} conf={st.confidence:.3f} breadth={st.breadth:.3f} hiLvl={st.highest_evidence_level}")


def compare_score_models(events: List[SyntheticEvent], catalog: CoverageCatalog) -> None:
    """EMA vs recompute — recompute preferred; show EMA drift risk."""
    print("\n=== Score model A (EMA incremental) vs B (recompute) ===")
    comp = "space_structure"
    comp_events = [e for e in events if e.competency == comp]
    # EMA
    alpha_base = 0.35
    ema = 50.0
    drill_counts: Dict[str, int] = defaultdict(int)
    for ev in sorted(comp_events, key=lambda e: e.timestamp):
        drill_counts[ev.drill_id] += 1
        n = drill_counts[ev.drill_id]
        w = ev.strength * repetition_factor("sqrt", n)
        target = event_target_score(ev.evidence_level, ev.quality)
        alpha = alpha_base * min(1.0, w / 0.25)
        ema = ema + alpha * (target - ema)
        ema = min(ema, score_ceiling_from_events(comp_events[: comp_events.index(ev) + 1]))
    rec = recompute_competency(comp, comp_events, catalog)
    print(f"  EMA final score={ema:.1f} | Recompute score={rec.score:.1f} conf={rec.confidence:.3f} breadth={rec.breadth:.3f}")


def main() -> None:
    root = Path(__file__).resolve().parents[3]
    profiles = root / "data/academy/competency/drill_profiles.json"
    map_entries, catalog = load_coverage_catalog(profiles)

    print("ENGINE_VERSION", ENGINE_VERSION)
    print("Map entries", len(map_entries))

    # Scenario A — farm
    print("\n=== Scenario A: 20× same L1 drill, q=1.0 (scanning A1_D1) ===")
    farm = scenario_farm_l1(map_entries)
    st = farm["scanning_identification"]
    print(f"  score={st.score} conf={st.confidence} breadth={st.breadth} hiLvl={st.highest_evidence_level}")
    print(f"  ceiling={LEVEL_SCORE_CEILING[1]} → farm cannot exceed L1 proof band")

    # Scenario B — diverse
    print("\n=== Scenario B: 10 drills / 3 tracks ===")
    div = scenario_diverse(map_entries)
    print(f"  score={div.score} conf={div.confidence} breadth={div.breadth} hiLvl={div.highest_evidence_level}")

    # Scenario C — progression
    print("\n=== Scenario C: A→E progression snapshots (space_structure) ===")
    for drill, st in scenario_progression(map_entries):
        print(f"  after {drill:8s} score={st.score:5.1f} conf={st.confidence:.3f} breadth={st.breadth:.3f} hiLvl={st.highest_evidence_level}")

    # Sparse user
    print("\n=== Sparse user (scanning_identification) ===")
    base = datetime(2026, 6, 1, tzinfo=timezone.utc)
    for n in (0, 1, 3, 5):
        ev = [build_event(map_entries, "scanning_identification", "A1_D1", 0.9, _t(base, i)) for i in range(n)]
        st = recompute_competency("scanning_identification", ev, catalog)
        print(f"  n={n} score={st.score} conf={st.confidence} breadth={st.breadth} assessed={st.assessed}")

    # Quality sweep
    print("\n=== Quality sweep (single C1_D4 L4 event, space_structure) ===")
    for q in (0.0, 0.25, 0.5, 0.75, 1.0):
        ev = [build_event(map_entries, "space_structure", "C1_D4", q, base)]
        st = recompute_competency("space_structure", ev, catalog)
        print(f"  q={q:.2f} score={st.score} strength={ev[0].strength:.3f} hiLvl={st.highest_evidence_level}")

    # Advanced user
    print("\n=== Advanced user (~50 events) ===")
    adv = scenario_advanced_user(map_entries)
    for comp in COMPETENCIES:
        st = adv[comp]
        if st.evidence_count:
            print(f"  {comp:26s} score={st.score:5.1f} conf={st.confidence:.3f} breadth={st.breadth:.3f} hiLvl={st.highest_evidence_level} n={st.evidence_count}")

    # Gamer
    print("\n=== Gaming user (30× A1_D1 scanning) ===")
    gamer = scenario_gamer(map_entries)
    st = gamer["scanning_identification"]
    print(f"  score={st.score} conf={st.confidence} breadth={st.breadth} hiLvl={st.highest_evidence_level}")
    adv_st = adv["scanning_identification"]
    print(f"  vs advanced scanning: score={adv_st.score} conf={adv_st.confidence} breadth={adv_st.breadth}")

    # Separability
    print("\n=== Metric separability examples ===")
    print("  high score / low conf: score=80 conf=0.25 breadth=0.20 → achievable via 1-2 strong L4 events")
    ev = [
        build_event(map_entries, "space_structure", "C1_D4", 0.95, _t(base, 0)),
        build_event(map_entries, "space_structure", "C1_D4", 0.92, _t(base, 1)),
    ]
    st = recompute_competency("space_structure", ev, catalog)
    print(f"    simulated: score={st.score} conf={st.confidence} breadth={st.breadth}")
    print("  moderate score / high conf: advanced user space_structure above")

    compare_repetition_models(map_entries)
    compare_score_models(
        [build_event(map_entries, "space_structure", "C1_D1", 0.85, _t(base, i)) for i in range(8)],
        catalog,
    )

    print("\nSTATUS: ENGINE DESIGN V1 READY (simulation)")


if __name__ == "__main__":
    main()
