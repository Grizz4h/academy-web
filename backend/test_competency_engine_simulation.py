"""Phase 4A/4A.1 — design simulation invariants (not production engine tests)."""

import sys
import unittest
from datetime import datetime, timezone
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BACKEND_DIR))

from competency.simulations.engine_v1_sim import (  # noqa: E402
    ENGINE_VERSION,
    LEVEL_SCORE_CEILING,
    build_event,
    compute_confidence,
    load_coverage_catalog,
    recompute_competency,
    scenario_diverse_10,
)


class EngineSimulationInvariantTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        profiles = BACKEND_DIR.parent / "data/academy/competency/drill_profiles.json"
        cls.map_entries, cls.catalog = load_coverage_catalog(profiles)

    def test_engine_version_is_set(self):
        self.assertEqual(ENGINE_VERSION, "competency-engine-v1")

    def test_farm_cannot_exceed_l1_ceiling(self):
        base = datetime(2026, 1, 1, tzinfo=timezone.utc)
        events = [
            build_event(self.map_entries, "scanning_identification", "A1_D1", 1.0, base.replace(day=1 + i))
            for i in range(20)
        ]
        st = recompute_competency("scanning_identification", events, self.catalog)
        self.assertLessEqual(st.score, LEVEL_SCORE_CEILING[1])
        self.assertLess(st.confidence, 0.45)
        self.assertLess(st.breadth, 0.15)

    def test_ten_diverse_events_do_not_hit_extreme_confidence(self):
        st = scenario_diverse_10(self.map_entries, self.catalog)
        self.assertGreater(st.confidence, 0.45)
        self.assertLess(st.confidence, 0.85)
        self.assertGreater(st.breadth, 0.15)
        self.assertLess(st.breadth, 0.35)

    def test_neutral_quality_produces_no_strength(self):
        ev = build_event(
            self.map_entries,
            "space_structure",
            "C1_D4",
            0.5,
            datetime(2026, 1, 1, tzinfo=timezone.utc),
        )
        self.assertEqual(ev.strength, 0.0)

    def test_zero_events_unassessed(self):
        st = recompute_competency("space_structure", [], self.catalog)
        self.assertFalse(st.assessed)
        self.assertEqual(st.score, 0.0)
        self.assertEqual(st.confidence, 0.0)

    def test_deterministic_recompute(self):
        base = datetime(2026, 1, 1, tzinfo=timezone.utc)
        events = [
            build_event(self.map_entries, "space_structure", "C1_D4", 0.9, base),
            build_event(self.map_entries, "space_structure", "D1_D3", 0.88, base),
        ]
        a = recompute_competency("space_structure", events, self.catalog)
        b = recompute_competency("space_structure", events, self.catalog)
        self.assertEqual(a.score, b.score)
        self.assertEqual(a.confidence, b.confidence)

    def test_confidence_can_exceed_breadth_when_valid(self):
        base = datetime(2026, 1, 1, tzinfo=timezone.utc)
        events = [build_event(self.map_entries, "space_structure", "C1_D4", 0.95, base)]
        st = recompute_competency("space_structure", events, self.catalog)
        self.assertGreater(st.confidence, st.breadth)


if __name__ == "__main__":
    unittest.main()
