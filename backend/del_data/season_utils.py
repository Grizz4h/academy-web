"""Season key normalization between display (2025/26) and file (2025_2026) formats."""

from __future__ import annotations

import re
from typing import Optional


def season_to_file_key(season: str) -> str:
    """Convert 2025/26 or 2025_2026 → 2025_2026."""
    raw = (season or "").strip()
    if not raw:
        return raw
    if "/" in raw:
        parts = raw.split("/")
        if len(parts) == 2 and len(parts[0]) == 4:
            start = parts[0]
            end_suffix = parts[1]
            end = start[:2] + end_suffix if len(end_suffix) == 2 else end_suffix
            return f"{start}_{end}"
    return raw.replace("/", "_").replace("-", "_")


def season_to_display(season: str) -> str:
    """Convert 2025_2026 → 2025/26."""
    raw = (season or "").strip()
    if not raw:
        return raw
    if "/" in raw:
        return raw
    match = re.match(r"^(\d{4})[_-](\d{2,4})$", raw)
    if match:
        start, end = match.group(1), match.group(2)
        if len(end) == 4:
            end = end[2:]
        return f"{start}/{end}"
    return raw


def season_to_del_url_slug(season: str) -> str:
    """Convert 2025/26 → 2025-26 for penny-del URLs."""
    display = season_to_display(season)
    if "/" in display:
        return display.replace("/", "-")
    return display


def season_date_bounds(season: str) -> tuple[Optional[str], Optional[str]]:
    """Approximate DEL season window for filtering schedule rows (ISO dates)."""
    key = season_to_file_key(season)
    match = re.match(r"^(\d{4})[_-](\d{2,4})$", key)
    if not match:
        return None, None
    start_year = int(match.group(1))
    end_part = match.group(2)
    end_year = int(end_part) if len(end_part) == 4 else int(f"{start_year // 100}{end_part}")
    # Hauptrunde roughly Jul start_year – Aug end_year (playoffs included)
    return f"{start_year}-07-01", f"{end_year}-08-31"


def game_date_in_season(game_date: Optional[str], season: str) -> bool:
    if not game_date:
        return True
    start, end = season_date_bounds(season)
    if not start or not end:
        return True
    return start <= game_date <= end
