"""Phase 4A — design simulation invariants (not production engine tests)."""

import sys
import unittest
from datetime import datetime, timezone
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BACKEND_DIR))

from competency.simulations.engine_v1_sim import (  # noqa: E402
    ENGINE_VERSION,
    build_event,
    load_coverage_catalog,
    recompute_competency,
    scenario_farm_l1,
    scenario_gamer,
)


class EngineSimulationInvariantTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        profiles = BACKEND_DIR.parent / "data/academy/competency/drill_profiles.json"
        cls.map_entries, cls.catalog = load_coverage_catalog(profiles)

    def test_engine_version_is_set(self):
        self.assertEqual(ENGINE_VERSION, "competency-engine-v1")

    def test_farm_cannot_exceed_l1_ceiling(self):
        farm = scenario_farm_l1(self.map_entries)
        st = farm["scanning_identification"]
        self.assertLessEqual(st.score, 35.0)
        self.assertLess(st.confidence, 0.95)
        self.assertLess(st.breadth, 0.15)

    def test_gamer_vs_breadth_explorer(self):
        gamer = scenario_gamer(self.map_entries)["scanning_identification"]
        self.assertLessEqual(gamer.score, 35.0)
        self.assertLess(gamer.breadth, 0.12)

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
        self.assertEqual(a.breadth, b.breadth)


if __name__ == "__main__":
    unittest.main()
