"""Phase 4B — Competency Engine V1 runtime golden scenarios and invariants."""

from __future__ import annotations

import sys
import unittest
from datetime import datetime, timedelta, timezone
from pathlib import Path
from uuid import uuid4

BACKEND_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BACKEND_DIR))

from competency.catalog import EvidenceMapCatalog
from competency.constants import ENGINE_VERSION, LEVEL_SCORE_CEILING
from competency.engine import (
    compute_event_strength,
    compute_event_target,
    load_catalog_from_profiles_path,
    recompute_competency_state,
    recompute_user_competencies,
    resolve_evidence_event,
)
from competency.models import AssessmentSource, EvidenceEvent
from competency.simulations.engine_v1_sim import (
    scenario_diverse_10,
    scenario_sparse_matrix,
    scenario_specialist_vs_generalist,
)
from competency.simulations.helpers import build_evidence_event


PROFILES = BACKEND_DIR.parent / "data/academy/competency/drill_profiles.json"


def _t(base: datetime, days: int) -> datetime:
    return base + timedelta(days=days)


class CompetencyEngineGoldenTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.catalog = load_catalog_from_profiles_path(str(PROFILES))
        cls.base = datetime(2026, 1, 1, tzinfo=timezone.utc)

    def test_null_state(self):
        st = recompute_competency_state("space_structure", [], self.catalog)
        self.assertEqual(st.score, 0.0)
        self.assertEqual(st.confidence, 0.0)
        self.assertEqual(st.breadth, 0.0)
        self.assertEqual(st.highestEvidenceLevel, 0)
        self.assertEqual(st.evidenceCount, 0)

    def test_l1_farming_band(self):
        events = [
            build_evidence_event(self.catalog, "scanning_identification", "A1_D1", 1.0, _t(self.base, i))
            for i in range(20)
        ]
        st = recompute_competency_state("scanning_identification", events, self.catalog)
        self.assertLessEqual(st.score, LEVEL_SCORE_CEILING[1])
        self.assertAlmostEqual(st.score, 35.0, delta=1.0)
        self.assertLess(st.breadth, 0.15)
        self.assertAlmostEqual(st.confidence, 0.31, delta=0.08)

    def test_fifty_repeat_no_explosion(self):
        events = [
            build_evidence_event(self.catalog, "scanning_identification", "A1_D1", 1.0, _t(self.base, i))
            for i in range(50)
        ]
        st = recompute_competency_state("scanning_identification", events, self.catalog)
        self.assertLessEqual(st.score, LEVEL_SCORE_CEILING[1] + 2)
        self.assertAlmostEqual(st.confidence, 0.36, delta=0.08)
        self.assertLess(st.breadth, 0.15)

    def test_sparse_vs_diverse_matrix(self):
        sparse = scenario_sparse_matrix(self.catalog, "A")
        diverse = scenario_sparse_matrix(self.catalog, "D")
        self.assertAlmostEqual(sparse.score, diverse.score, delta=8.0)
        self.assertLess(sparse.confidence, diverse.confidence)
        self.assertLess(sparse.breadth, diverse.breadth)

    def test_ten_diverse_space_structure(self):
        st = scenario_diverse_10(self.catalog)
        self.assertAlmostEqual(st.score, 68.0, delta=6.0)
        self.assertAlmostEqual(st.confidence, 0.56, delta=0.10)
        self.assertAlmostEqual(st.breadth, 0.23, delta=0.08)

    def test_specialist_vs_generalist(self):
        spec, gen = scenario_specialist_vs_generalist(self.catalog)
        self.assertGreaterEqual(spec.score, gen.score - 5)
        self.assertLess(spec.breadth, gen.breadth)
        self.assertLess(spec.confidence, gen.confidence)
        self.assertAlmostEqual(spec.score, 84.0, delta=5.0)
        self.assertAlmostEqual(gen.score, 71.0, delta=6.0)
        self.assertAlmostEqual(spec.confidence, 0.39, delta=0.10)
        self.assertAlmostEqual(gen.confidence, 0.61, delta=0.10)

    def test_advanced_scanning(self):
        drills = [
            ("A1_D1", 0.75), ("B1_D2", 0.82), ("C1_D1", 0.88), ("D3_D1", 0.84),
            ("E1_D2", 0.87), ("C2_D1", 0.83), ("A3_D2", 0.79),
        ]
        events = [
            build_evidence_event(self.catalog, "scanning_identification", d, q, _t(self.base, i))
            for i, (d, q) in enumerate(drills)
        ]
        st = recompute_competency_state("scanning_identification", events, self.catalog)
        self.assertAlmostEqual(st.score, 63.0, delta=5.0)
        self.assertEqual(st.highestEvidenceLevel, 3)
        self.assertAlmostEqual(st.breadth, 0.37, delta=0.10)

    def test_e3_high_max_strength_not_auto_100(self):
        events = [
            build_evidence_event(self.catalog, "space_structure", "E3_D2", 1.0, self.base),
        ]
        st = recompute_competency_state("space_structure", events, self.catalog)
        self.assertLess(st.score, 100.0)

    def test_neutral_quality_zero_strength(self):
        strength = compute_event_strength(80, 0.9, 4, 0.5)
        self.assertEqual(strength, 0.0)
        ev = build_evidence_event(self.catalog, "space_structure", "C1_D4", 0.5, self.base)
        self.assertEqual(ev.strength, 0.0)
        st = recompute_competency_state("space_structure", [ev], self.catalog)
        self.assertEqual(st.score, 0.0)
        self.assertEqual(st.evidenceCount, 0)

    def test_q055_farming_no_elite_score(self):
        events = [
            build_evidence_event(self.catalog, "space_structure", "C1_D4", 0.55, _t(self.base, i))
            for i in range(20)
        ]
        st = recompute_competency_state("space_structure", events, self.catalog)
        self.assertLess(st.score, 55.0)
        self.assertAlmostEqual(st.score, 38.0, delta=8.0)

    def test_negative_evidence_reduces_score(self):
        good = [
            build_evidence_event(self.catalog, "space_structure", "C1_D4", 0.90, _t(self.base, i))
            for i in range(5)
        ]
        mixed = good + [
            build_evidence_event(self.catalog, "space_structure", "C1_D4", 0.25, _t(self.base, 10))
        ]
        st_good = recompute_competency_state("space_structure", good, self.catalog)
        st_mixed = recompute_competency_state("space_structure", mixed, self.catalog)
        self.assertLess(st_mixed.score, st_good.score)
        self.assertGreater(st_good.score, 50.0)


class CompetencyEngineInvariantTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.catalog = load_catalog_from_profiles_path(str(PROFILES))
        cls.base = datetime(2026, 3, 1, tzinfo=timezone.utc)

    def test_engine_version(self):
        self.assertEqual(ENGINE_VERSION, "competency-engine-v1")

    def test_deterministic_recompute(self):
        events = [
            build_evidence_event(self.catalog, "space_structure", "C1_D4", 0.9, self.base),
            build_evidence_event(self.catalog, "space_structure", "D1_D3", 0.88, _t(self.base, 1)),
        ]
        a = recompute_competency_state("space_structure", events, self.catalog)
        b = recompute_competency_state("space_structure", list(reversed(events)), self.catalog)
        self.assertEqual(a.score, b.score)
        self.assertEqual(a.confidence, b.confidence)
        self.assertEqual(a.breadth, b.breadth)

    def test_output_ranges(self):
        events = [
            build_evidence_event(self.catalog, "space_structure", "C1_D4", 0.92, _t(self.base, i))
            for i in range(6)
        ]
        st = recompute_competency_state("space_structure", events, self.catalog)
        self.assertGreaterEqual(st.score, 0.0)
        self.assertLessEqual(st.score, 100.0)
        self.assertGreaterEqual(st.confidence, 0.0)
        self.assertLessEqual(st.confidence, 1.0)
        self.assertGreaterEqual(st.breadth, 0.0)
        self.assertLessEqual(st.breadth, 1.0)
        self.assertGreaterEqual(st.highestEvidenceLevel, 0)
        self.assertLessEqual(st.highestEvidenceLevel, 5)

    def test_repeated_drill_does_not_increase_breadth_much(self):
        one = recompute_competency_state(
            "space_structure",
            [build_evidence_event(self.catalog, "space_structure", "C1_D4", 0.9, self.base)],
            self.catalog,
        )
        many = recompute_competency_state(
            "space_structure",
            [
                build_evidence_event(self.catalog, "space_structure", "C1_D4", 0.9, _t(self.base, i))
                for i in range(10)
            ],
            self.catalog,
        )
        self.assertAlmostEqual(one.breadth, many.breadth, delta=0.05)

    def test_l1_only_cannot_reach_90(self):
        events = [
            build_evidence_event(self.catalog, "scanning_identification", "A1_D1", 1.0, _t(self.base, i))
            for i in range(30)
        ]
        st = recompute_competency_state("scanning_identification", events, self.catalog)
        self.assertLess(st.score, 90.0)

    def test_e4_events_ignored(self):
        before = recompute_competency_state("space_structure", [], self.catalog)
        e4_event = EvidenceEvent(
            eventId=uuid4(),
            userId=uuid4(),
            drillId="E4_D1",
            competencyId="space_structure",
            quality=1.0,
            strength=1.0,
            evidenceLevel=3,
            assessmentSource=AssessmentSource.STRUCTURED,
            createdAt=self.base,
        )
        self.assertIsNone(resolve_evidence_event(e4_event, self.catalog))
        after = recompute_competency_state("space_structure", [e4_event], self.catalog)
        self.assertEqual(after.score, before.score)
        self.assertEqual(after.confidence, before.confidence)

    def test_recompute_all_competencies(self):
        events = [
            build_evidence_event(self.catalog, "space_structure", "C1_D4", 0.9, self.base),
        ]
        result = recompute_user_competencies(events, self.catalog)
        self.assertEqual(result.engine_version, ENGINE_VERSION)
        self.assertEqual(len(result.states), 8)
        self.assertGreater(result.states["space_structure"].score, 0.0)
        self.assertEqual(result.states["scanning_identification"].score, 0.0)

    def test_event_target_respects_level_cap(self):
        l1 = compute_event_target(1, 1.0)
        l5 = compute_event_target(5, 1.0)
        self.assertLess(l1, l5)
        self.assertAlmostEqual(l1, LEVEL_SCORE_CEILING[1], delta=1.0)


if __name__ == "__main__":
    unittest.main()
