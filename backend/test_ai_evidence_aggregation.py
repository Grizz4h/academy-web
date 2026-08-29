"""Unit tests for deterministic quality aggregation (Variant B)."""

from __future__ import annotations

import os
import sys
import unittest
from pathlib import Path

os.environ.setdefault("ACADEMY_JWT_SECRET", "test-jwt-secret-phase1-hardening-32chars-min")

BACKEND_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BACKEND_DIR))

from competency.ai.aggregation import aggregate_quality
from competency.ai.calibration.bands import BAND_ORDER, BAND_RANGES, flags_for_row
from competency.ai.calibration.mock_provider import dimensions_for_band
from competency.models import CompetencyId
from competency.ai.schema import AiCompetencyDimensions


def _dims(**overrides):
    base = dict(
        competencyId=CompetencyId.EVIDENCE_ANALYSIS,
        observationGrounding=0.8,
        specificity=0.75,
        competencyAlignment=0.8,
        relationalReasoning=0.7,
        evidenceScope=0.75,
        uncertaintyCalibration=0.7,
        unsupportedClaims=0.1,
        outcomeBias=0.05,
        reasonCode="observation_grounded",
        notes=[],
    )
    base.update(overrides)
    return AiCompetencyDimensions(**base)


class AggregationTests(unittest.TestCase):
    def test_severe_unsupported_caps_quality(self):
        q = aggregate_quality(_dims(unsupportedClaims=0.85, observationGrounding=0.95, competencyAlignment=0.95))
        self.assertLessEqual(q, 0.45)

    def test_severe_outcome_bias_caps_quality(self):
        q = aggregate_quality(_dims(outcomeBias=0.85))
        self.assertLessEqual(q, 0.45)

    def test_weak_grounding_caps_quality(self):
        q = aggregate_quality(_dims(observationGrounding=0.15, competencyAlignment=0.9))
        self.assertLessEqual(q, 0.25)

    def test_high_clean_dimensions_can_be_excellent(self):
        q = aggregate_quality(
            _dims(
                observationGrounding=0.95,
                specificity=0.92,
                competencyAlignment=0.94,
                relationalReasoning=0.9,
                evidenceScope=0.92,
                uncertaintyCalibration=0.9,
                unsupportedClaims=0.05,
                outcomeBias=0.02,
            )
        )
        self.assertGreaterEqual(q, 0.85)

    def test_mock_band_dimensions_land_in_expected_bands(self):
        for band in BAND_ORDER:
            dims = dimensions_for_band("evidence_analysis", band)
            quality = aggregate_quality(dims)
            lo, hi = BAND_RANGES[band]
            self.assertGreaterEqual(quality, lo - 0.02, band)
            self.assertLessEqual(quality, hi + 0.02, band)
            flags = flags_for_row(
                expected_band=band,
                quality=quality,
                unsupported_claims=dims.unsupportedClaims,
                case_kind="band",
            )
            self.assertEqual(flags, ["OK"], f"{band}→{quality}")

    def test_deterministic(self):
        dims = _dims()
        self.assertEqual(aggregate_quality(dims), aggregate_quality(dims))


if __name__ == "__main__":
    unittest.main()
