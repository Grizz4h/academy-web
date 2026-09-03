"""Local wall-clock helpers for catalog game times.

Imported feeds often provide UTC. The academy UI stores plain `HH:MM` without a
timezone field and treats it as Germany-local (same as DEL/DEL2 scrapes).
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional, Tuple
from zoneinfo import ZoneInfo

APP_TZ = ZoneInfo("Europe/Berlin")


def utc_instant_to_app_local(
    value: str,
    *,
    fallback_date: Optional[str] = None,
) -> Tuple[Optional[str], Optional[str]]:
    """Convert an ISO UTC (or offset) instant to Europe/Berlin date + HH:MM."""
    raw = (value or "").strip()
    if not raw:
        return fallback_date, None
    try:
        normalized = raw.replace("Z", "+00:00")
        dt = datetime.fromisoformat(normalized)
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        local = dt.astimezone(APP_TZ)
        return local.strftime("%Y-%m-%d"), local.strftime("%H:%M")
    except Exception:
        date_iso = raw[:10] if len(raw) >= 10 else fallback_date
        time_value = raw[11:16] if len(raw) >= 16 else None
        return date_iso, time_value
