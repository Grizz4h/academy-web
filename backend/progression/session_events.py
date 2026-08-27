"""Build activity events from stored sessions for authoritative rebuilds."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict, List, Tuple

from .unit_key import normalize_observation_scope


def activity_events_from_sessions(
    sessions: List[Dict[str, Any]],
    *,
    user_id: str,
) -> Tuple[List[dict], Dict[str, Dict[str, Any]]]:
    """Return (activity_events, sessions_by_id) for compute_unified_base_grants."""
    ordered = sorted(
        [s for s in sessions if isinstance(s, dict)],
        key=lambda s: str((s.get("post") or {}).get("completed_at") or s.get("created_at") or ""),
    )
    sessions_by_id: Dict[str, Dict[str, Any]] = {
        str(s.get("id")): s for s in ordered if s.get("id")
    }
    events: List[dict] = []
    seen_drills: set[str] = set()
    track0_emitted = False

    for session in ordered:
        if str(session.get("state") or "").upper() != "COMPLETED":
            continue
        if session.get("is_dummy") is True:
            continue
        sid = str(session.get("id") or "").strip()
        if not sid:
            continue
        drill = str(session.get("drill_id") or session.get("module_id") or "").strip()
        scope = normalize_observation_scope(session.get("observation_scope"))
        occurred = str(
            (session.get("post") or {}).get("completed_at")
            or session.get("created_at")
            or datetime.now(timezone.utc).isoformat()
        )
        is_first = bool(drill) and drill not in seen_drills
        if drill:
            seen_drills.add(drill)
        events.append(
            {
                "id": f"session_completed:{sid}",
                "type": "session_completed",
                "sessionId": sid,
                "drillId": drill or None,
                "gameId": session.get("game_id")
                or ((session.get("game_info") or {}).get("game_id")),
                "observationScope": scope,
                "occurredAt": occurred,
                "isFirstSessionOfDrill": is_first,
                "isDummy": False,
            }
        )
        module = str(session.get("module_id") or "").upper()
        is_foundation = scope == "LESSON" or module == "T0" or module.startswith("T0")
        if is_foundation and not track0_emitted:
            track0_emitted = True
            events.append(
                {
                    "id": f"track0_completed:{user_id}",
                    "type": "track0_completed",
                    "trackId": "T0",
                    "userId": user_id,
                    "occurredAt": occurred,
                }
            )

    return events, sessions_by_id
