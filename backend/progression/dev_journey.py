"""DevLab standard journey — server-side chained preview."""

from __future__ import annotations

import copy
from typing import Any, Dict, List

from .grants import compute_unified_base_grants
from .level_curve import get_level_from_xp, xp_required_for_level

GAME = "del:2025:999"
EVAL = "2026-01-01T12:00:00.000Z"
WEEKS = 4
UNITS_PER_WEEK = 4


def _session_doc(session_id: str, drill: str) -> Dict[str, Any]:
    return {
        "id": session_id,
        "state": "COMPLETED",
        "is_dummy": False,
        "game_id": GAME,
        "drill_id": drill,
        "module_id": drill.split("_")[0] or "C1",
        "observation_scope": "P1",
    }


def _session_event(session_id: str, drill: str, *, first_drill: bool) -> Dict[str, Any]:
    return {
        "id": f"journey:{session_id}",
        "type": "session_completed",
        "occurredAt": EVAL,
        "sessionId": session_id,
        "drillId": drill,
        "trackId": drill.split("_")[0] or "C1",
        "observationScope": "P1",
        "gameId": GAME,
        "leagueId": "DEL",
        "isDummy": False,
        "isFirstSessionOfDrill": first_drill,
    }


def build_standard_journey_steps() -> List[Dict[str, Any]]:
    steps: List[Dict[str, Any]] = []
    unit = 0
    for week in range(1, WEEKS + 1):
        for slot in range(1, UNITS_PER_WEEK + 1):
            unit += 1
            session_id = f"journey-w{week}-u{slot}"
            drill = f"C1_D{unit}"
            steps.append(
                {
                    "title": f"W{week} · Unit {unit} ({drill} P1)",
                    "activity_events": [_session_event(session_id, drill, first_drill=unit == 1)],
                    "session_doc": _session_doc(session_id, drill),
                },
            )
    return steps


def run_standard_journey(*, initial_state: Dict[str, Any] | None = None) -> Dict[str, Any]:
    from repositories.json_reward import create_default_reward_state, merge_reward_state

    state = merge_reward_state(copy.deepcopy(initial_state) if initial_state else create_default_reward_state())
    rows: List[Dict[str, Any]] = []

    for step in build_standard_journey_steps():
        xp, pux, cosmetics, logs = compute_unified_base_grants(
            state,
            step["activity_events"],
            session_doc=step["session_doc"],
            evaluated_at=EVAL,
        )
        state["xp"] = int(state.get("xp") or 0) + int(xp)
        if "currency" not in state or not isinstance(state["currency"], dict):
            state["currency"] = {"PUX": 0}
        state["currency"]["PUX"] = int(state["currency"].get("PUX") or 0) + int(pux)

        total_xp = int(state.get("xp") or 0)
        total_pux = int(state["currency"].get("PUX") or 0)
        rows.append(
            {
                "title": step["title"],
                "granted_xp": int(xp),
                "granted_pux": int(pux),
                "total_xp": total_xp,
                "total_pux": total_pux,
                "level": get_level_from_xp(total_xp),
                "units": len(state.get("processedUnits") or {}),
                "logs": logs,
                "cosmetics": cosmetics,
            },
        )

    last = rows[-1] if rows else {}
    return {
        "weeks": WEEKS,
        "steps": rows,
        "summary": {
            "total_xp": last.get("total_xp", 0),
            "total_pux": last.get("total_pux", 0),
            "level": last.get("level", 1),
            "units": last.get("units", 0),
            "xp_to_level_5": sum(xp_required_for_level(level) for level in range(1, 5)),
        },
    }
