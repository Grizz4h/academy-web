"""Phase 5 — capped level curve + grandfathering."""

from __future__ import annotations

import os
import sys
import unittest

os.environ.setdefault("ACADEMY_JWT_SECRET", "test-jwt-secret-phase1-hardening-32chars-min")

BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from progression.level_curve import (
    PROGRESSION_CURVE_VERSION,
    apply_curve_migration,
    get_level_from_xp,
    get_level_from_xp_legacy,
    migrate_progression_curve,
    xp_required_for_level,
)


class LevelCurveTests(unittest.TestCase):
    def test_level_1_to_2_cost(self):
        self.assertEqual(xp_required_for_level(1), 100)

    def test_level_2_to_3_cost(self):
        self.assertEqual(xp_required_for_level(2), 300)

    def test_level_5_threshold(self):
        self.assertEqual(get_level_from_xp(1199), 4)
        self.assertEqual(get_level_from_xp(1200), 5)

    def test_cap_at_level_25(self):
        self.assertEqual(xp_required_for_level(25), 1000)
        self.assertEqual(xp_required_for_level(100), 1000)

    def test_grandfather_when_new_curve_lower(self):
        xp = 355
        self.assertGreater(get_level_from_xp_legacy(xp), get_level_from_xp(xp))
        migrated = migrate_progression_curve({"xp": xp})
        self.assertEqual(migrated["progressionCurveVersion"], PROGRESSION_CURVE_VERSION)
        self.assertGreaterEqual(migrated["levelGrandfatherFloor"], get_level_from_xp_legacy(xp))

    def test_no_grandfather_when_new_curve_higher(self):
        migrated = migrate_progression_curve({"xp": 0})
        self.assertEqual(migrated["progressionCurveVersion"], PROGRESSION_CURVE_VERSION)
        self.assertIsNone(migrated["levelGrandfatherFloor"])

    def test_apply_curve_migration_mutates_state(self):
        state = {"xp": 355}
        apply_curve_migration(state)
        self.assertEqual(state["progressionCurveVersion"], PROGRESSION_CURVE_VERSION)
        self.assertEqual(state.get("levelGrandfatherFloor"), 3)


if __name__ == "__main__":
    unittest.main()
