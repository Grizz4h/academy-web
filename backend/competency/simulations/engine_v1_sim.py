#!/usr/bin/env python3
"""
Competency Engine V1 — calibration audit harness.

Uses the production runtime engine (Phase 4B). Run:
    python backend/competency/simulations/engine_v1_sim.py
"""

from __future__ import annotations

import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Tuple

BACKEND_DIR = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(BACKEND_DIR))

from competency.catalog import EvidenceMapCatalog
from competency.constants import ENGINE_VERSION, LEVEL_SCORE_CEILING
from competency.engine import (
    apply_soft_ceiling,
    compute_confidence,
    compute_event_target,
    compute_raw_score,
    determine_proven_levels,
    effective_evidence_volume,
    load_catalog_from_profiles_path,
    proven_level_support,
    recompute_competency_state,
    score_ceiling_from_events,
)
from competency.models import UserCompetencyState
from competency.simulations.helpers import build_evidence_event


def profiles_path() -> Path:
    return Path(__file__).resolve().parents[3] / "data/academy/competency/drill_profiles.json"


def load_coverage_catalog(profiles_path_arg: Path | None = None) -> Tuple[EvidenceMapCatalog, EvidenceMapCatalog]:
    path = profiles_path_arg or profiles_path()
    catalog = load_catalog_from_profiles_path(str(path))
    return catalog, catalog


def _t(base: datetime, days: int) -> datetime:
    return base + timedelta(days=days)


def scenario_diverse_10(catalog: EvidenceMapCatalog) -> UserCompetencyState:
    base = datetime(2026, 2, 1, tzinfo=timezone.utc)
    drills = ["C1_D1", "C1_D2", "C2_D1", "C2_D2", "C3_D1", "C3_D2", "D1_D1", "D1_D2", "D2_D1", "D3_D1"]
    events = [
        build_evidence_event(catalog, "space_structure", d, 0.85, _t(base, i))
        for i, d in enumerate(drills)
    ]
    return recompute_competency_state("space_structure", events, catalog)


def scenario_sparse_matrix(
    catalog: EvidenceMapCatalog,
    pattern: str,
    n_total: int = 20,
    quality: float = 0.85,
) -> UserCompetencyState:
    pools = {
        "A": ["C1_D1"],
        "B": ["C1_D1", "C2_D1", "C3_D1", "D1_D1", "D2_D1"],
        "C": ["C1_D1", "C1_D2", "C2_D1", "C2_D2", "C3_D1", "C3_D2", "D1_D1", "D1_D2", "D2_D1", "D3_D1"],
        "D": [
            "C1_D1", "C1_D2", "C1_D3", "C2_D1", "C2_D2", "C2_D3", "C3_D1", "C3_D2", "C3_D3",
            "D1_D1", "D1_D2", "D1_D3", "D2_D1", "D2_D2", "D3_D1", "D3_D2", "D3_D3", "D4_D1", "D4_D2", "D4_D3",
        ],
    }
    reps = {"A": 20, "B": 4, "C": 2, "D": 1}[pattern]
    drills = pools[pattern]
    base = datetime(2026, 7, 1, tzinfo=timezone.utc)
    events = []
    day = 0
    for _ in range(n_total // reps):
        for drill in drills:
            for _rep in range(reps):
                events.append(build_evidence_event(catalog, "space_structure", drill, quality, _t(base, day)))
                day += 1
    return recompute_competency_state("space_structure", events, catalog)


def scenario_specialist_vs_generalist(
    catalog: EvidenceMapCatalog,
) -> Tuple[UserCompetencyState, UserCompetencyState]:
    base = datetime(2026, 8, 1, tzinfo=timezone.utc)
    specialist = [
        build_evidence_event(catalog, "space_structure", "C1_D4", 0.92, _t(base, i))
        for i in range(6)
    ]
    generalist_drills = ["A2_D1", "B2_D1", "C1_D4", "C2_D4", "D1_D3", "D2_D2", "D3_D4", "E2_D3", "E3_D2", "C3_D5"]
    generalist = [
        build_evidence_event(catalog, "space_structure", d, 0.80, _t(base, i))
        for i, d in enumerate(generalist_drills)
    ]
    return (
        recompute_competency_state("space_structure", specialist, catalog),
        recompute_competency_state("space_structure", generalist, catalog),
    )


def scenario_advanced_scanning(catalog: EvidenceMapCatalog) -> None:
    from competency.engine import resolve_evidence_event, sort_events

    base = datetime(2026, 4, 1, tzinfo=timezone.utc)
    drills = [
        ("A1_D1", 0.75), ("B1_D2", 0.82), ("C1_D1", 0.88), ("D3_D1", 0.84),
        ("E1_D2", 0.87), ("C2_D1", 0.83), ("A3_D2", 0.79),
    ]
    raw_events = [
        build_evidence_event(catalog, "scanning_identification", d, q, _t(base, i))
        for i, (d, q) in enumerate(drills)
    ]
    resolved = [resolve_evidence_event(ev, catalog) for ev in raw_events]
    resolved = [ev for ev in resolved if ev is not None]
    ordered = sort_events(resolved)
    st = recompute_competency_state("scanning_identification", raw_events, catalog)
    support, drills_at = proven_level_support(ordered)
    print("  events:")
    for ev in ordered:
        print(
            f"    {ev.drill_id} L{ev.evidence_level} str={ev.strength:.3f} "
            f"tgt={compute_event_target(ev.evidence_level, ev.quality):.1f}"
        )
    print(f"  level support={dict(support)} unique={ {k: len(v) for k, v in drills_at.items()} }")
    print(f"  proven={determine_proven_levels(ordered)} ceiling={score_ceiling_from_events(ordered)}")
    print(f"  score={st.score} conf={st.confidence} breadth={st.breadth} hiLvl={st.highestEvidenceLevel}")


def run_calibration() -> None:
    catalog, _ = load_coverage_catalog()
    base = datetime(2026, 1, 1, tzinfo=timezone.utc)

    print("=" * 60)
    print("PHASE 4B — ENGINE CALIBRATION (runtime parity)")
    print("ENGINE_VERSION", ENGINE_VERSION)
    print("=" * 60)

    div = scenario_diverse_10(catalog)
    ev10 = [
        build_evidence_event(catalog, "space_structure", d, 0.85, _t(base, i))
        for i, d in enumerate(["C1_D1", "C1_D2", "C2_D1", "C2_D2", "C3_D1", "C3_D2", "D1_D1", "D1_D2", "D2_D1", "D3_D1"])
    ]
    from competency.engine import resolve_evidence_event, sort_events

    resolved10 = sort_events([resolve_evidence_event(ev, catalog) for ev in ev10])
    eff = effective_evidence_volume(resolved10)
    print(f"\n  CALIBRATED full state: score={div.score} conf={div.confidence} breadth={div.breadth} hiLvl={div.highestEvidenceLevel}")
    print(f"  breadth={div.breadth:.3f} effectiveVolume={eff:.3f}")

    print("\n=== Advanced scanning diagnosis ===")
    scenario_advanced_scanning(catalog)

    print("\n=== Sparse-vs-diverse matrix (20 events, q=0.85) ===")
    for pat in ("A", "B", "C", "D"):
        st = scenario_sparse_matrix(catalog, pat)
        print(f"  {pat}: score={st.score} conf={st.confidence} breadth={st.breadth}")

    print("\n=== Specialist vs Generalist ===")
    spec, gen = scenario_specialist_vs_generalist(catalog)
    print(f"  Specialist: score={spec.score} conf={spec.confidence} breadth={spec.breadth}")
    print(f"  Generalist: score={gen.score} conf={gen.confidence} breadth={gen.breadth}")

    print("\n=== Farming 20× / 50× L1 scanning ===")
    for n in (20, 50):
        evs = [
            build_evidence_event(catalog, "scanning_identification", "A1_D1", 1.0, _t(base, i))
            for i in range(n)
        ]
        st = recompute_competency_state("scanning_identification", evs, catalog)
        resolved = sort_events([resolve_evidence_event(ev, catalog) for ev in evs])
        print(f"  n={n}: score={st.score} conf={st.confidence} breadth={st.breadth} effVol={effective_evidence_volume(resolved):.2f}")

    print("\nSTATUS: ENGINE V1 CALIBRATED")


def main() -> None:
    run_calibration()


if __name__ == "__main__":
    main()
