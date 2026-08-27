"""Central progression tuning (Phase 5 skeleton)."""

from __future__ import annotations

import os
from typing import Dict

BASE_XP_PER_UNIT = 100
BASE_PUX_PER_UNIT = 10
FIRST_DRILL_ID_BONUS_XP = 25
FULL_GAME_BONUS_XP = 25
FULL_GAME_BONUS_PUX = 10

TRACK0_BUNDLE_XP = 100
TRACK0_BUNDLE_PUX = 25
# Track 0 grants the basic frame (canonical ID; Ist alias: frame_shop_basic).
TRACK0_BUNDLE_COSMETIC_ID = "frame_basic"

# Unit-count thresholds → cosmetic unlock (Grundprogression Rev. B).
EARLY_SLOT_COSMETICS: Dict[int, str] = {
    2: "emblem_arrow_01",
    4: "avatar_ice_01",
    10: "banner_soft_ice",  # Ist alias: banner_shop_soft_ice
    24: "frame_rare_trim",  # Ist alias: frame_shop_rare_trim
    48: "avatar_slot_01",
}

FULL_GAME_BONUS_COSMETIC_ID = ""
# Matchday sticker stays on challenge only (primary freigegeben 2026-08-26).

RULE_BASE_UNIT_XP = "base_unit_xp"
RULE_BASE_UNIT_PUX = "base_unit_pux"
RULE_FIRST_DRILL_ID_BONUS_XP = "first_drill_id_bonus_xp"
RULE_FULL_GAME_BONUS = "full_game_bonus"
RULE_TRACK0_BUNDLE = "track0_bundle"
RULE_EARLY_SLOT = "early_slot_units"
RULE_FULL_GAME_COSMETIC = "full_game_cosmetic"


def progression_unified_pipeline_enabled() -> bool:
    """Unified pipeline is default-on (Phase 5.10). Set ACADEMY_PROGRESSION_UNIFIED_PIPELINE=0 to opt out."""
    value = (os.environ.get("ACADEMY_PROGRESSION_UNIFIED_PIPELINE") or "").strip().lower()
    if value in ("0", "false", "no", "off"):
        return False
    return True
