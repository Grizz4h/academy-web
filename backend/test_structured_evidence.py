"""Phase 5A — structured evidence evaluator unit tests."""

from __future__ import annotations

import unittest

from competency.constants import QUALITY_NEUTRAL
from competency.models import AssessmentSource
from competency.structured.evaluator import StructuredEvidenceEvaluator
from competency.structured.rubrics import evaluate_a1_d2_quality, evaluate_a3_d1_quality


def _a1_d2_complete(*, observations: int = 5, unsure: int = 0) -> dict:
    obs = []
    positions = (["low"] * (observations - unsure)) + (["unsure"] * unsure)
    for index, position in enumerate(positions, start=1):
        obs.append({"id": f"o{index}", "order": index, "position": position})
    return {
        "shift_tracker_observations": obs,
        "__shift_tracker_stage": "complete",
        "patternNoticed": "changes_often",
    }


def _a3_d1_complete(*, events: int = 3, unclear_outcomes: int = 0) -> dict:
    rows = []
    for index in range(events):
        outcome = "unklar" if index < unclear_outcomes else "kurze Kontrolle"
        rows.append(
            {
                "zone": "neutrale Zone",
                "win_type": "abgefangen",
                "outcome": outcome,
            }
        )
    return {"puck_win_events": rows}


class StructuredRubricTests(unittest.TestCase):
    A1_CONFIG = {
        "observations_key": "shift_tracker_observations",
        "stage_key": "__shift_tracker_stage",
        "minObservations": 4,
        "recommendedObservations": 5,
        "patternOptions": [{"id": "changes_often"}],
    }

    A3_CONFIG = {
        "event_key": "puck_win_events",
        "fields": [
            {"key": "zone", "type": "select"},
            {"key": "win_type", "type": "select"},
            {"key": "outcome", "type": "select"},
        ],
    }

    def test_a1_d2_weak_mostly_unsure(self):
        quality = evaluate_a1_d2_quality(_a1_d2_complete(observations=4, unsure=3), self.A1_CONFIG)
        self.assertIsNotNone(quality)
        assert quality is not None
        self.assertLess(quality, 0.75)

    def test_a1_d2_strong_specific(self):
        quality = evaluate_a1_d2_quality(_a1_d2_complete(observations=5, unsure=0), self.A1_CONFIG)
        self.assertIsNotNone(quality)
        assert quality is not None
        self.assertGreater(quality, 0.85)

    def test_a1_d2_incomplete_returns_none(self):
        answers = _a1_d2_complete()
        answers["shift_tracker_observations"] = answers["shift_tracker_observations"][:2]
        self.assertIsNone(evaluate_a1_d2_quality(answers, self.A1_CONFIG))

    def test_a3_d1_volume_and_specificity(self):
        weak = evaluate_a3_d1_quality(_a3_d1_complete(events=3, unclear_outcomes=2), self.A3_CONFIG)
        strong = evaluate_a3_d1_quality(_a3_d1_complete(events=4, unclear_outcomes=0), self.A3_CONFIG)
        self.assertIsNotNone(weak)
        self.assertIsNotNone(strong)
        assert weak is not None and strong is not None
        self.assertGreater(strong, weak)
        self.assertGreaterEqual(weak, QUALITY_NEUTRAL)

    def test_a3_d1_too_few_events_returns_none(self):
        self.assertIsNone(evaluate_a3_d1_quality(_a3_d1_complete(events=2), self.A3_CONFIG))


class StructuredEvaluatorTests(unittest.TestCase):
    def setUp(self):
        self.evaluator = StructuredEvidenceEvaluator()

    def test_a1_d2_emits_four_competency_events(self):
        events = self.evaluator.evaluate(
            drill_id="A1_D2",
            answers=_a1_d2_complete(observations=5, unsure=1),
            drill_config={
                "observations_key": "shift_tracker_observations",
                "stage_key": "__shift_tracker_stage",
                "minObservations": 4,
                "recommendedObservations": 5,
                "patternOptions": [{"id": "x"}],
            },
            source_id="sess-1:A1_D2",
        )
        self.assertEqual(len(events), 4)
        competency_ids = {str(event.competencyId) for event in events}
        self.assertIn("scanning_identification", competency_ids)
        self.assertIn("transition_tempo", competency_ids)
        for event in events:
            self.assertEqual(event.sourceType, "drill_submission")
            self.assertEqual(event.sourceId, "sess-1:A1_D2")
            self.assertEqual(event.assessmentSource, AssessmentSource.STRUCTURED.value)
            self.assertEqual(event.metadata.get("evaluatorVersion"), "structured-evaluator-v1")

    def test_unsupported_drill_returns_empty(self):
        self.assertEqual(
            self.evaluator.evaluate(
                drill_id="B1_D1",
                answers={"foo": "bar"},
                drill_config={},
                source_id="sess:B1_D1",
            ),
            [],
        )

    def test_e4_not_supported(self):
        self.assertFalse(self.evaluator.supports_drill("E4_D1"))


if __name__ == "__main__":
    unittest.main()
