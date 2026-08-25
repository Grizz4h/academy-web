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
TRACK0_BUNDLE_COSMETIC_ID = "frame_shop_basic"

# Unit-count thresholds → cosmetic unlock (Phase 2 early slots).
EARLY_SLOT_COSMETICS: Dict[int, str] = {
    2: "title_shop_quiet_observer",
    4: "title_shop_glass_leaner",
    10: "emblem_shop_simple_crest",
}

FULL_GAME_BONUS_COSMETIC_ID = "sticker_matchday_first_read"

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
