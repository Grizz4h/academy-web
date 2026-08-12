"""Lightweight roster plausibility checks."""

from __future__ import annotations

from typing import Any, Dict, List, Tuple


DataQuality = str  # verified | plausible | incomplete | suspicious


def assess_roster_quality(players: List[Dict[str, Any]]) -> Tuple[DataQuality, List[str]]:
    warnings: List[str] = []
    active = [p for p in players if p.get("active", True)]
    count = len(active)

    if count == 0:
        warnings.append("Leerer Kader")
        return "suspicious", warnings

    names = [str(p.get("player_name") or p.get("name") or "").strip() for p in active]
    if any(not name for name in names):
        warnings.append("Spieler ohne Namen")

    player_ids = [str(p.get("player_id") or "").strip() for p in active if p.get("player_id")]
    if len(player_ids) != len(set(player_ids)):
        warnings.append("Doppelte Spieler-IDs")

    if count < 12:
        warnings.append(f"Ungewöhnlich wenige Spieler ({count})")
    elif count < 18:
        warnings.append(f"Kleiner Kader ({count})")

    goalies = [
        p for p in active
        if "goalie" in str(p.get("position_group") or p.get("position") or "").lower()
    ]
    if not goalies:
        warnings.append("Keine Torhüter erkannt")

    missing_position = sum(
        1 for p in active
        if not str(p.get("position") or p.get("position_group") or "").strip()
    )
    if missing_position > max(2, count // 4):
        warnings.append(f"Fehlende Positionen ({missing_position})")

    if count < 12 or not goalies or any(not name for name in names):
        return "suspicious", warnings
    if warnings:
        return "incomplete", warnings
    return "plausible", warnings
