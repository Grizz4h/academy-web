"""Phase 5 — legacy achievement freeze."""

from __future__ import annotations

import os
import sys
import unittest

os.environ.setdefault("ACADEMY_JWT_SECRET", "test-jwt-secret-phase1-hardening-32chars-min")
os.environ["ACADEMY_PROGRESSION_UNIFIED_PIPELINE"] = "1"

BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from progression.legacy import is_legacy_achievement_id


class LegacyAchievementTests(unittest.TestCase):
    def test_legacy_ids(self):
        self.assertTrue(is_legacy_achievement_id("first-drill-complete"))
        self.assertTrue(is_legacy_achievement_id("ten-drills-one-session"))
        self.assertFalse(is_legacy_achievement_id("first_shift"))
        self.assertFalse(is_legacy_achievement_id("getting_warm"))


if __name__ == "__main__":
    unittest.main()
