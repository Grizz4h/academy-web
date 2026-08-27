"""Cosmetic cleanup: product sanitize vs development_data_cleanup.

Product path (load): keep ownership of deprecated_hidden items; only fix broken/unequippable equipped slots.
Test path: development_data_cleanup_* resets to Soll starter seed — no product grandfathering.
"""

from __future__ import annotations

from typing import Any, Dict, Optional

# deprecated_hidden — ownership kept on product path; not granted anew / not in regular picker.
DEPRECATED_HIDDEN_IDS = frozenset(
    {
        "avatar_zamboni",
        "banner_zamboni_shift",
        "banner_property_of_the_slot",
        "emblem_zamboni",
        "emblem_slot_resident",
        "sticker_fresh_sheet",
        "sticker_slot",
    }
)

# Back-compat alias for older imports
REMOVED_COSMETIC_IDS = DEPRECATED_HIDDEN_IDS

# Soll starter defaults — no frame at account start.
STARTER_DEFAULTS = {
    "avatarId": "avatar_chalk_01",
    "bannerId": "banner_neutral_01",
    "emblemId": "emblem_puck_01",
    "frameId": None,
    "profileTitleId": "prospect",
    "taglineId": "tagline_starter",
}

STARTER_COSMETIC_IDS = frozenset(
    {
        "avatar_chalk_01",
        "banner_neutral_01",
        "emblem_puck_01",
        "title_catalog_prospect",
        "tagline_starter",
    }
)

_LEGACY_PROFILE_TITLES = {
    "rookie": "prospect",
    "title_catalog_rookie": "prospect",
}


def _is_deprecated(cosmetic_id: Optional[str]) -> bool:
    return bool(cosmetic_id) and cosmetic_id in DEPRECATED_HIDDEN_IDS


def purge_removed_from_reward_state(state: Dict[str, Any]) -> bool:
    """Product load hook.

    Does NOT strip deprecated ownership (Rev. B D1). Only cleans favorites pointing at
    nothing actionable and featured mastery if deprecated. Also merges alias unlocks.
    Returns True if changed.
    """
    from progression.cosmetic_aliases import merge_alias_unlocks

    changed = merge_alias_unlocks(state)

    favorites = state.get("favoriteCosmeticIds")
    if isinstance(favorites, list):
        # Favorites may keep deprecated ids (ownership view); no forced purge.
        pass

    featured = state.get("featuredMasteryCoinId")
    if featured in DEPRECATED_HIDDEN_IDS:
        state["featuredMasteryCoinId"] = None
        changed = True

    return changed


def sanitize_profile_cosmetics(profile: Dict[str, Any]) -> bool:
    """Equipped policy for deprecated_hidden (Rev. B D3–D5) + alias normalize.

    Deprecated IDs are out of the product catalog → treat as not displayable (D4):
    reset that slot to neutral starter / null. Never auto-equip a substitute cosmetic (D5).
    Ownership rows stay in reward state (D1) — only equipment is cleared.
    Legacy title aliases → prospect.
    Equipped Ist shop_* aliases → canonical IDs.
    """
    from progression.cosmetic_aliases import normalize_profile_equip

    changed = normalize_profile_equip(profile)

    avatar = profile.get("avatar")
    if isinstance(avatar, dict) and avatar.get("type") == "catalog":
        aid = avatar.get("avatarId")
        if _is_deprecated(aid):
            profile["avatar"] = {
                "type": "catalog",
                "avatarId": STARTER_DEFAULTS["avatarId"],
            }
            changed = True

    banner_id = profile.get("bannerId")
    if _is_deprecated(banner_id):
        profile["bannerId"] = STARTER_DEFAULTS["bannerId"]
        changed = True

    emblem = profile.get("emblem")
    if isinstance(emblem, dict) and emblem.get("type") == "catalog":
        eid = emblem.get("emblemId")
        if _is_deprecated(eid):
            profile["emblem"] = {
                "type": "catalog",
                "emblemId": STARTER_DEFAULTS["emblemId"],
            }
            changed = True

    frame_id = profile.get("frameId")
    if _is_deprecated(frame_id):
        profile["frameId"] = STARTER_DEFAULTS["frameId"]
        changed = True

    stickers = profile.get("stickerIds")
    if isinstance(stickers, list):
        cleaned = [sid for sid in stickers if not _is_deprecated(sid)]
        if cleaned != stickers:
            profile["stickerIds"] = cleaned
            changed = True

    title = profile.get("profileTitle")
    if isinstance(title, str) and title in _LEGACY_PROFILE_TITLES:
        profile["profileTitle"] = _LEGACY_PROFILE_TITLES[title]
        changed = True

    return changed


def development_data_cleanup_reward_state(
    state: Dict[str, Any],
    *,
    reset_progression: bool = False,
) -> Dict[str, Any]:
    """Reset reward cosmetics to Soll starter seed (test accounts only).

    Starters are owned via catalog `origin.type === starter`, not unlock rows.
    Marks cleanup so it is not confused with product migration M1–M8.
    """
    from repositories.json_reward import create_default_reward_state

    now_marker = "development_data_cleanup"
    if reset_progression:
        cleaned = create_default_reward_state()
        cleaned["developmentDataCleanupAt"] = now_marker
        cleaned["developmentDataCleanupKind"] = "full_progression_reset"
        return cleaned

    state["unlockedCosmetics"] = {}
    state["unlockHistory"] = []
    state["favoriteCosmeticIds"] = []
    state["featuredMasteryCoinId"] = None
    state["featuredAchievementId"] = None
    # Drop early-slot / track0 cosmetic grant keys so slots can be re-earned in tests.
    processed = state.get("processedGrantKeys")
    if isinstance(processed, dict):
        drop_prefixes = ("early_slot_units:", "track0_completed:")
        state["processedGrantKeys"] = {
            k: v
            for k, v in processed.items()
            if not any(str(k).startswith(p) for p in drop_prefixes)
        }
    state["developmentDataCleanupAt"] = now_marker
    state["developmentDataCleanupKind"] = "cosmetic_starter_seed"
    return state


def development_data_cleanup_profile(profile: Dict[str, Any]) -> Dict[str, Any]:
    """Apply Soll starter equipment to a profile dict (test cleanup)."""
    profile["avatar"] = {"type": "catalog", "avatarId": STARTER_DEFAULTS["avatarId"]}
    profile["bannerId"] = STARTER_DEFAULTS["bannerId"]
    profile["emblem"] = {"type": "catalog", "emblemId": STARTER_DEFAULTS["emblemId"]}
    profile["frameId"] = STARTER_DEFAULTS["frameId"]
    profile["profileTitle"] = STARTER_DEFAULTS["profileTitleId"]
    profile["profileTagline"] = STARTER_DEFAULTS["taglineId"]
    profile["stickerIds"] = []
    return profile
