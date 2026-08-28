"""Phase 4B — runtime engine simulation parity checks."""

import sys
import unittest
from datetime import datetime, timezone
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BACKEND_DIR))

from competency.constants import ENGINE_VERSION, LEVEL_SCORE_CEILING
from competency.engine import compute_event_strength, load_catalog_from_profiles_path, recompute_competency_state
from competency.simulations.engine_v1_sim import load_coverage_catalog, scenario_diverse_10
from competency.simulations.helpers import build_evidence_event


class EngineSimulationParityTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        profiles = BACKEND_DIR.parent / "data/academy/competency/drill_profiles.json"
        cls.catalog, _ = load_coverage_catalog(profiles)
        cls.map_catalog = load_catalog_from_profiles_path(str(profiles))

    def test_engine_version_is_set(self):
        self.assertEqual(ENGINE_VERSION, "competency-engine-v1")

    def test_farm_cannot_exceed_l1_ceiling(self):
        base = datetime(2026, 1, 1, tzinfo=timezone.utc)
        events = [
            build_evidence_event(self.catalog, "scanning_identification", "A1_D1", 1.0, base.replace(day=1 + i))
            for i in range(20)
        ]
        st = recompute_competency_state("scanning_identification", events, self.catalog)
        self.assertLessEqual(st.score, LEVEL_SCORE_CEILING[1])
        self.assertLess(st.confidence, 0.45)
        self.assertLess(st.breadth, 0.15)

    def test_ten_diverse_events_do_not_hit_extreme_confidence(self):
        st = scenario_diverse_10(self.catalog)
        self.assertGreater(st.confidence, 0.45)
        self.assertLess(st.confidence, 0.85)
        self.assertGreater(st.breadth, 0.15)
        self.assertLess(st.breadth, 0.35)

    def test_neutral_quality_produces_no_strength(self):
        ev = build_evidence_event(
            self.catalog,
            "space_structure",
            "C1_D4",
            0.5,
            datetime(2026, 1, 1, tzinfo=timezone.utc),
        )
        self.assertEqual(ev.strength, 0.0)

    def test_zero_events_unassessed(self):
        st = recompute_competency_state("space_structure", [], self.catalog)
        self.assertEqual(st.score, 0.0)
        self.assertEqual(st.confidence, 0.0)

    def test_deterministic_recompute(self):
        base = datetime(2026, 1, 1, tzinfo=timezone.utc)
        events = [
            build_evidence_event(self.catalog, "space_structure", "C1_D4", 0.9, base),
            build_evidence_event(self.catalog, "space_structure", "D1_D3", 0.88, base),
        ]
        a = recompute_competency_state("space_structure", events, self.catalog)
        b = recompute_competency_state("space_structure", events, self.catalog)
        self.assertEqual(a.score, b.score)
        self.assertEqual(a.confidence, b.confidence)

    def test_confidence_can_exceed_breadth_when_valid(self):
        base = datetime(2026, 1, 1, tzinfo=timezone.utc)
        events = [build_evidence_event(self.catalog, "space_structure", "C1_D4", 0.95, base)]
        st = recompute_competency_state("space_structure", events, self.catalog)
        self.assertGreater(st.confidence, st.breadth)


if __name__ == "__main__":
    unittest.main()
