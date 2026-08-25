"""Phase 2 piecewise level curve — mirrors frontend levelCurve.ts."""

from __future__ import annotations

PROGRESSION_CURVE_VERSION = 2
BASE_XP_PER_UNIT = 100


def units_required_for_level(level: int) -> int:
    if level < 1:
        return 1
    if level == 1:
        return 1
    if level == 2:
        return 3
    if level <= 4:
        return 4
    if level <= 9:
        return 6
    if level <= 24:
        return 8
    return 10


def xp_required_for_level(level: int) -> int:
    if level < 1:
        return 0
    return units_required_for_level(level) * BASE_XP_PER_UNIT


def xp_required_for_level_legacy(level: int) -> int:
    if level < 1:
        return 0
    return round(BASE_XP_PER_UNIT * (level**1.35))


def get_level_from_xp(total_xp: int) -> int:
    xp = max(0, int(total_xp or 0))
    level = 1
    remaining = xp
    while remaining >= xp_required_for_level(level):
        remaining -= xp_required_for_level(level)
        level += 1
        if level > 500:
            break
    return level


def get_level_from_xp_legacy(total_xp: int) -> int:
    xp = max(0, int(total_xp or 0))
    level = 1
    remaining = xp
    while remaining >= xp_required_for_level_legacy(level):
        remaining -= xp_required_for_level_legacy(level)
        level += 1
        if level > 500:
            break
    return level


def migrate_progression_curve(state: dict) -> dict:
    current_version = int(state.get("progressionCurveVersion") or 1)
    if current_version >= PROGRESSION_CURVE_VERSION:
        return {
            "progressionCurveVersion": current_version,
            "levelGrandfatherFloor": state.get("levelGrandfatherFloor"),
        }

    xp = int(state.get("xp") or 0)
    old_level = get_level_from_xp_legacy(xp)
    new_level = get_level_from_xp(xp)
    floor = state.get("levelGrandfatherFloor")
    if new_level < old_level:
        floor = max(int(floor or 1), old_level)

    return {
        "progressionCurveVersion": PROGRESSION_CURVE_VERSION,
        "levelGrandfatherFloor": floor if floor and int(floor) > 1 else None,
    }


def apply_curve_migration(state: dict) -> None:
    migrated = migrate_progression_curve(state)
    state["progressionCurveVersion"] = migrated["progressionCurveVersion"]
    floor = migrated.get("levelGrandfatherFloor")
    if floor and int(floor) > 1:
        state["levelGrandfatherFloor"] = int(floor)
