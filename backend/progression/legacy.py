"""Legacy reward ids frozen under unified progression pipeline."""

from __future__ import annotations

from typing import FrozenSet

LEGACY_ACHIEVEMENT_IDS: FrozenSet[str] = frozenset(
    {
        "first-drill-complete",
        "ten-drills-complete",
        "fifty-drills-complete",
        "three-completed-in-a-row",
        "seven-active-days",
        "five-distinct-drills",
        "ten-distinct-drills",
        "five-drills-one-session",
        "long-notes",
        "early-bird",
        "night-owl",
        "prime-time-scout",
        "mobile-scout",
        "desktop-room",
        "ten-drills-one-session",
    },
)


def is_legacy_achievement_id(achievement_id: str) -> bool:
    return achievement_id in LEGACY_ACHIEVEMENT_IDS
