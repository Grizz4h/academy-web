"""Unit tests for development_data_cleanup vs product sanitize (Rev. B)."""

from __future__ import annotations

import os
import sys
import unittest

BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from progression.cosmetic_aliases import (
    canonical_cosmetic_id,
    merge_alias_unlocks,
    owns_cosmetic,
)
from progression.cosmetic_cleanup import (
    DEPRECATED_HIDDEN_IDS,
    development_data_cleanup_profile,
    development_data_cleanup_reward_state,
    purge_removed_from_reward_state,
    sanitize_profile_cosmetics,
)
from progression.grants import _unlock_cosmetic


class CosmeticCleanupTests(unittest.TestCase):
    def test_product_load_keeps_deprecated_ownership(self):
        state = {
            "unlockedCosmetics": {
                "sticker_slot": {"cosmeticId": "sticker_slot", "unlockedAt": "t0"},
                "avatar_chalk_01": {"cosmeticId": "avatar_chalk_01", "unlockedAt": "t0"},
            },
            "favoriteCosmeticIds": ["sticker_slot"],
        }
        purge_removed_from_reward_state(state)
        self.assertIn("sticker_slot", state["unlockedCosmetics"])
        self.assertEqual(state.get("cosmeticMigrationPhase3Id"), "cosmetic_migration_phase3_grundprogression_v1")

    def test_sanitize_clears_deprecated_equip_without_replacement_grant(self):
        profile = {
            "avatar": {"type": "catalog", "avatarId": "avatar_zamboni"},
            "bannerId": "banner_zamboni_shift",
            "emblem": {"type": "catalog", "emblemId": "emblem_slot_resident"},
            "frameId": "frame_shop_basic",
            "stickerIds": ["sticker_slot", "sticker_tape"],
            "profileTitle": "rookie",
        }
        self.assertTrue(sanitize_profile_cosmetics(profile))
        self.assertEqual(profile["avatar"]["avatarId"], "avatar_chalk_01")
        self.assertEqual(profile["bannerId"], "banner_neutral_01")
        self.assertEqual(profile["emblem"]["emblemId"], "emblem_puck_01")
        # Alias frame → canonical; non-deprecated stays equipped
        self.assertEqual(profile["frameId"], "frame_basic")
        self.assertEqual(profile["stickerIds"], ["sticker_tape"])
        self.assertEqual(profile["profileTitle"], "prospect")
        # No auto-equip of high_slot replacements
        self.assertNotIn("sticker_high_slot", profile["stickerIds"])

    def test_development_cleanup_starter_seed(self):
        state = {
            "xp": 500,
            "currency": {"PUX": 40},
            "unlockedCosmetics": {
                "avatar_ice_01": {},
                "frame_shop_basic": {},
                "sticker_slot": {},
            },
            "unlockHistory": [{"cosmeticId": "avatar_ice_01"}],
            "favoriteCosmeticIds": ["avatar_ice_01"],
            "processedGrantKeys": {
                "early_slot_units:2:title_shop_quiet_observer": "t0",
                "early_slot_units:2:emblem_arrow_01": "t0",
                "track0_completed:user": "t0",
                "base_unit_xp:x": "t0",
            },
            "processedUnits": {"g|P1|d": {}},
        }
        cleaned = development_data_cleanup_reward_state(state, reset_progression=False)
        self.assertEqual(cleaned["unlockedCosmetics"], {})
        self.assertEqual(cleaned["unlockHistory"], [])
        self.assertEqual(cleaned["favoriteCosmeticIds"], [])
        self.assertEqual(cleaned["xp"], 500)
        self.assertIn("base_unit_xp:x", cleaned["processedGrantKeys"])
        self.assertNotIn("early_slot_units:2:emblem_arrow_01", cleaned["processedGrantKeys"])
        self.assertNotIn("track0_completed:user", cleaned["processedGrantKeys"])
        self.assertEqual(cleaned["developmentDataCleanupKind"], "cosmetic_starter_seed")

        profile = {
            "avatar": {"type": "catalog", "avatarId": "avatar_ice_01"},
            "bannerId": "banner_crease_01",
            "emblem": {"type": "catalog", "emblemId": "emblem_arrow_01"},
            "frameId": "frame_shop_basic",
            "profileTitle": "rink_rat",
            "profileTagline": "tagline_watch_the_center",
            "stickerIds": ["sticker_tape"],
        }
        development_data_cleanup_profile(profile)
        self.assertEqual(profile["avatar"]["avatarId"], "avatar_chalk_01")
        self.assertEqual(profile["bannerId"], "banner_neutral_01")
        self.assertEqual(profile["emblem"]["emblemId"], "emblem_puck_01")
        self.assertIsNone(profile["frameId"])
        self.assertEqual(profile["profileTitle"], "prospect")
        self.assertEqual(profile["profileTagline"], "tagline_starter")
        self.assertEqual(profile["stickerIds"], [])

    def test_deprecated_set_includes_legacy_ugly(self):
        self.assertIn("avatar_zamboni", DEPRECATED_HIDDEN_IDS)
        self.assertIn("sticker_slot", DEPRECATED_HIDDEN_IDS)


class CosmeticAliasTests(unittest.TestCase):
    def test_canonical_map(self):
        self.assertEqual(canonical_cosmetic_id("frame_shop_basic"), "frame_basic")
        self.assertEqual(canonical_cosmetic_id("banner_shop_soft_ice"), "banner_soft_ice")
        self.assertEqual(canonical_cosmetic_id("frame_shop_rare_trim"), "frame_rare_trim")
        self.assertEqual(canonical_cosmetic_id("frame_basic"), "frame_basic")

    def test_merge_alias_to_canonical(self):
        state = {
            "unlockedCosmetics": {
                "frame_shop_basic": {
                    "cosmeticId": "frame_shop_basic",
                    "unlockedAt": "2026-01-01T00:00:00Z",
                    "sourceType": "track0",
                },
                "banner_shop_soft_ice": {
                    "cosmeticId": "banner_shop_soft_ice",
                    "unlockedAt": "2026-02-01T00:00:00Z",
                },
            }
        }
        self.assertTrue(merge_alias_unlocks(state))
        unlocked = state["unlockedCosmetics"]
        self.assertIn("frame_basic", unlocked)
        self.assertNotIn("frame_shop_basic", unlocked)
        self.assertIn("banner_soft_ice", unlocked)
        self.assertNotIn("banner_shop_soft_ice", unlocked)
        self.assertEqual(unlocked["frame_basic"]["cosmeticId"], "frame_basic")

    def test_merge_both_keys_keeps_earlier_unlock(self):
        state = {
            "unlockedCosmetics": {
                "frame_shop_basic": {
                    "cosmeticId": "frame_shop_basic",
                    "unlockedAt": "2026-01-01T00:00:00Z",
                    "sourceType": "track0",
                },
                "frame_basic": {
                    "cosmeticId": "frame_basic",
                    "unlockedAt": "2026-06-01T00:00:00Z",
                    "sourceType": "progression",
                },
            }
        }
        merge_alias_unlocks(state)
        self.assertNotIn("frame_shop_basic", state["unlockedCosmetics"])
        self.assertEqual(
            state["unlockedCosmetics"]["frame_basic"]["unlockedAt"],
            "2026-01-01T00:00:00Z",
        )

    def test_grant_skips_when_alias_owned(self):
        state = {
            "unlockedCosmetics": {
                "frame_shop_basic": {"cosmeticId": "frame_shop_basic", "unlockedAt": "t0"},
            }
        }
        merge_alias_unlocks(state)
        self.assertTrue(owns_cosmetic(state, "frame_shop_basic"))
        self.assertTrue(owns_cosmetic(state, "frame_basic"))
        again = _unlock_cosmetic(
            state,
            "frame_basic",
            evaluated_at="t1",
            source_type="track0",
            source_id="x",
        )
        self.assertIsNone(again)

    def test_grant_writes_canonical(self):
        state = {"unlockedCosmetics": {}}
        entry = _unlock_cosmetic(
            state,
            "frame_shop_basic",
            evaluated_at="t1",
            source_type="track0",
            source_id="x",
        )
        self.assertEqual(entry["cosmeticId"], "frame_basic")
        self.assertIn("frame_basic", state["unlockedCosmetics"])
        self.assertNotIn("frame_shop_basic", state["unlockedCosmetics"])


if __name__ == "__main__":
    unittest.main()
