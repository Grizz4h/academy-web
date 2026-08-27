"""Dev journey preview tests."""

from __future__ import annotations

import os
import sys
import unittest

os.environ.setdefault("ACADEMY_JWT_SECRET", "test-jwt-secret-phase1-hardening-32chars-min")

BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from progression.dev_journey import run_standard_journey


class DevJourneyTests(unittest.TestCase):
    def test_sixteen_steps_with_grants(self):
        result = run_standard_journey()
        self.assertEqual(len(result["steps"]), 16)
        first = result["steps"][0]
        self.assertEqual(first["granted_xp"], 125)
        self.assertEqual(first["granted_pux"], 10)
        self.assertGreater(result["summary"]["total_xp"], 1500)
        self.assertEqual(result["summary"]["units"], 16)


if __name__ == "__main__":
    unittest.main()
