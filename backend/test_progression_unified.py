"""Phase 5 — unified progression unit grants."""

from __future__ import annotations

import os
import sys
import unittest

os.environ.setdefault("ACADEMY_JWT_SECRET", "test-jwt-secret-phase1-hardening-32chars-min")

BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from progression.grants import compute_unified_base_grants
from progression.config import progression_unified_pipeline_enabled
from progression.unit_key import build_progression_unit_key, unit_key_from_session


class ProgressionUnitKeyTests(unittest.TestCase):
    def test_p1_unit_key(self):
        key = build_progression_unit_key(
            game_id="del:2025:123",
            observation_scope="P1",
            drill_id="D1_01",
        )
        self.assertEqual(key, "del:2025:123|P1|D1_01")

    def test_lesson_no_key(self):
        self.assertIsNone(
            build_progression_unit_key(
                game_id="del:2025:123",
                observation_scope="LESSON",
                drill_id="T0_01",
            ),
        )

    def test_full_game_historical(self):
        key = build_progression_unit_key(
            game_id="del:2025:123",
            observation_scope="FULL_GAME",
            drill_id="D1_01",
        )
        self.assertEqual(key, "del:2025:123|FULL_GAME|D1_01")

    def test_from_session(self):
        key = unit_key_from_session(
            {
                "game_id": "g1",
                "observation_scope": "P2",
                "drill_id": "D2",
                "state": "COMPLETED",
            },
        )
        self.assertEqual(key, "g1|P2|D2")


class UnifiedBaseGrantTests(unittest.TestCase):
    def _session(self, session_id: str = "s1", scope: str = "P1") -> dict:
        return {
            "id": session_id,
            "state": "COMPLETED",
            "is_dummy": False,
            "game_id": "game-1",
            "observation_scope": scope,
            "drill_id": "drill-a",
        }

    def _event(self, session_id: str = "s1", scope: str = "P1", drill: str = "drill-a") -> dict:
        return {
            "id": f"session_completed:{session_id}",
            "type": "session_completed",
            "sessionId": session_id,
            "drillId": drill,
            "gameId": "game-1",
            "observationScope": scope,
            "occurredAt": "2026-08-25T10:00:00Z",
            "isDummy": False,
        }

    def test_first_unit_grants_base(self):
        state = {"processedUnits": {}, "processedGrantKeys": {}, "unlockedCosmetics": {}}
        xp, pux, cosmetics, logs = compute_unified_base_grants(
            state,
            [self._event()],
            session_doc=self._session(),
            evaluated_at="2026-08-25T10:00:00Z",
        )
        self.assertEqual(xp, 100)
        self.assertEqual(pux, 10)
        self.assertEqual(cosmetics, [])
        self.assertIn("game-1|P1|drill-a", state["processedUnits"])
        self.assertTrue(any("grant:base_unit" in line for line in logs))

    def test_duplicate_unit_no_grant(self):
        state = {
            "processedUnits": {
                "game-1|P1|drill-a": {"progressionUnitKey": "game-1|P1|drill-a"},
            },
            "processedGrantKeys": {},
            "unlockedCosmetics": {},
        }
        xp, pux, _cosmetics, _logs = compute_unified_base_grants(
            state,
            [self._event(session_id="s2")],
            session_doc={**self._session("s2"), "id": "s2"},
            evaluated_at="2026-08-25T11:00:00Z",
        )
        self.assertEqual(xp, 0)
        self.assertEqual(pux, 0)

    def test_first_drill_bonus_once(self):
        state = {"processedUnits": {}, "processedGrantKeys": {}, "unlockedCosmetics": {}}
        event = self._event()
        event["isFirstSessionOfDrill"] = True
        xp, _pux, _cosmetics, _logs = compute_unified_base_grants(
            state,
            [event],
            session_doc=self._session(),
            evaluated_at="2026-08-25T10:00:00Z",
        )
        self.assertEqual(xp, 125)

    def test_full_game_after_three_periods(self):
        state = {
            "processedUnits": {
                "game-1|P1|drill-a": {},
                "game-1|P2|drill-b": {},
            },
            "processedGrantKeys": {},
            "unlockedCosmetics": {},
        }
        xp, pux, cosmetics, logs = compute_unified_base_grants(
            state,
            [self._event(session_id="s3", scope="P3", drill="drill-c")],
            session_doc={**self._session("s3", "P3"), "drill_id": "drill-c"},
            evaluated_at="2026-08-25T12:00:00Z",
        )
        self.assertEqual(xp, 100 + 25)
        self.assertEqual(pux, 10 + 10)
        self.assertTrue(any("grant:full_game" in line for line in logs))
        self.assertGreaterEqual(len(cosmetics), 1)

    def test_lesson_session_ineligible(self):
        state = {"processedUnits": {}, "processedGrantKeys": {}, "unlockedCosmetics": {}}
        xp, pux, _cosmetics, _logs = compute_unified_base_grants(
            state,
            [self._event(scope="LESSON")],
            session_doc={**self._session(scope="LESSON"), "observation_scope": "LESSON"},
            evaluated_at="2026-08-25T10:00:00Z",
        )
        self.assertEqual(xp, 0)
        self.assertEqual(pux, 0)

    def test_early_slot_at_second_unit(self):
        state = {
            "processedUnits": {"game-1|P1|drill-a": {}},
            "processedGrantKeys": {},
            "unlockedCosmetics": {},
        }
        xp, pux, cosmetics, logs = compute_unified_base_grants(
            state,
            [self._event(session_id="s2", scope="P2", drill="drill-b")],
            session_doc={**self._session("s2", "P2"), "drill_id": "drill-b"},
            evaluated_at="2026-08-25T11:00:00Z",
        )
        self.assertEqual(xp, 100)
        self.assertEqual(pux, 10)
        self.assertEqual(len(cosmetics), 1)
        self.assertEqual(cosmetics[0]["cosmeticId"], "emblem_arrow_01")
        self.assertTrue(any("grant:early_slot:2" in line for line in logs))

    def test_early_slots_at_48_units_all_missing(self):
        """Nutzer mit 48 Units erhält alle fehlenden Slots — nicht nur den höchsten."""
        processed = {f"game-1|P1|drill-{i}": {} for i in range(47)}
        state = {
            "processedUnits": processed,
            "processedGrantKeys": {},
            "unlockedCosmetics": {},
        }
        xp, pux, cosmetics, logs = compute_unified_base_grants(
            state,
            [self._event(session_id="s48", scope="P2", drill="drill-48")],
            session_doc={**self._session("s48", "P2"), "drill_id": "drill-48"},
            evaluated_at="2026-08-25T12:00:00Z",
        )
        self.assertEqual(xp, 100)
        self.assertEqual(pux, 10)
        ids = {c["cosmeticId"] for c in cosmetics}
        self.assertEqual(
            ids,
            {
                "emblem_arrow_01",
                "avatar_ice_01",
                "banner_soft_ice",
                "frame_rare_trim",
                "avatar_slot_01",
            },
        )
        for n in (2, 4, 10, 24, 48):
            self.assertTrue(any(f"grant:early_slot:{n}" in line for line in logs))

    def test_track0_bundle_once(self):
        state = {"processedUnits": {}, "processedGrantKeys": {}, "unlockedCosmetics": {}}
        event = {
            "id": "track0_completed:user-1",
            "type": "track0_completed",
            "trackId": "T0",
            "userId": "user-1",
            "occurredAt": "2026-08-25T10:00:00Z",
        }
        xp, pux, cosmetics, logs = compute_unified_base_grants(
            state,
            [event],
            evaluated_at="2026-08-25T10:00:00Z",
        )
        self.assertEqual(xp, 100)
        self.assertEqual(pux, 25)
        self.assertEqual(len(cosmetics), 1)
        self.assertEqual(cosmetics[0]["cosmeticId"], "frame_basic")
        self.assertTrue(any("grant:track0_bundle" in line for line in logs))

        xp2, pux2, cosmetics2, _logs2 = compute_unified_base_grants(
            state,
            [event],
            evaluated_at="2026-08-25T11:00:00Z",
        )
        self.assertEqual(xp2, 0)
        self.assertEqual(pux2, 0)
        self.assertEqual(cosmetics2, [])


class ProgressionPipelineFlagTests(unittest.TestCase):
    def test_default_on(self):
        env = os.environ.pop("ACADEMY_PROGRESSION_UNIFIED_PIPELINE", None)
        try:
            self.assertTrue(progression_unified_pipeline_enabled())
        finally:
            if env is not None:
                os.environ["ACADEMY_PROGRESSION_UNIFIED_PIPELINE"] = env

    def test_explicit_off(self):
        prev = os.environ.get("ACADEMY_PROGRESSION_UNIFIED_PIPELINE")
        os.environ["ACADEMY_PROGRESSION_UNIFIED_PIPELINE"] = "0"
        try:
            self.assertFalse(progression_unified_pipeline_enabled())
        finally:
            if prev is None:
                os.environ.pop("ACADEMY_PROGRESSION_UNIFIED_PIPELINE", None)
            else:
                os.environ["ACADEMY_PROGRESSION_UNIFIED_PIPELINE"] = prev


if __name__ == "__main__":
    unittest.main()
