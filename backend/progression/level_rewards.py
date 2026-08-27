"""Account level rewards — mirrors frontend levelSystem.LEVEL_REWARDS."""

from __future__ import annotations

from typing import Any, Dict, List, Tuple

from progression.level_curve import get_level_from_xp

# Keep in sync with frontend/src/features/progression/levelSystem.ts
LEVEL_REWARDS: List[Dict[str, Any]] = [
    {"level": 5, "pux": 50, "cosmetics": ["title_level_5_observer"]},
    {"level": 10, "pux": 100, "cosmetics": ["banner_level_10"]},
    {"level": 15, "pux": 150, "cosmetics": ["title_level_15_analyst"]},
    {"level": 20, "pux": 200, "cosmetics": ["emblem_level_20"]},
]


def apply_level_rewards_for_xp(
    state: Dict[str, Any],
    *,
    evaluated_at: str,
) -> Tuple[int, List[dict]]:
    """Grant missing level cosmetics/PUX for the account's current XP.

    Idempotent via processedGrantKeys `level_reward:{level}`.
    Returns (pux_added, cosmetics_added).
    """
    xp = int(state.get("xp") or 0)
    level = get_level_from_xp(xp)
    keys = state.setdefault("processedGrantKeys", {})
    if not isinstance(keys, dict):
        keys = {}
        state["processedGrantKeys"] = keys
    unlocked = state.setdefault("unlockedCosmetics", {})
    if not isinstance(unlocked, dict):
        unlocked = {}
        state["unlockedCosmetics"] = unlocked

    pux_added = 0
    cosmetics_added: List[dict] = []
    for entry in LEVEL_REWARDS:
        reward_level = int(entry["level"])
        if reward_level > level:
            continue
        grant_key = f"level_reward:{reward_level}"
        if grant_key in keys:
            continue
        keys[grant_key] = {"grantedAt": evaluated_at, "level": reward_level}
        pux_added += int(entry.get("pux") or 0)
        for cosmetic_id in entry.get("cosmetics") or []:
            cid = str(cosmetic_id or "").strip()
            if not cid or cid in unlocked:
                continue
            row = {
                "cosmeticId": cid,
                "unlockedAt": evaluated_at,
                "sourceType": "level",
                "sourceId": str(reward_level),
                "earnKind": "earned",
            }
            unlocked[cid] = row
            cosmetics_added.append(row)
    return pux_added, cosmetics_added
