"""Progression unit key derivation."""

from __future__ import annotations

from typing import Any, Dict, Optional


VALID_GRANT_SCOPES = frozenset({"P1", "P2", "P3", "FULL_GAME"})


def normalize_observation_scope(scope: Optional[str]) -> str:
    value = (scope or "").strip().upper()
    if value in VALID_GRANT_SCOPES or value == "LESSON":
        return value
    return "FULL_GAME"


def normalize_part(value: Optional[str]) -> str:
    return (value or "").strip()


def build_progression_unit_key(
    *,
    game_id: Optional[str],
    observation_scope: Optional[str],
    drill_id: Optional[str],
    legacy_session_id: Optional[str] = None,
) -> Optional[str]:
    game = normalize_part(game_id)
    drill = normalize_part(drill_id)
    scope = normalize_observation_scope(observation_scope)

    if not drill:
        return None
    if scope == "LESSON":
        return None
    if scope not in VALID_GRANT_SCOPES:
        return None

    if game:
        return f"{game}|{scope}|{drill}"

    # Historical sessions before game-linking: count completed work once per session.
    legacy = normalize_part(legacy_session_id)
    if legacy:
        return f"legacy:{legacy}|{scope}|{drill}"
    return None


def unit_key_from_session(session: Optional[Dict[str, Any]]) -> Optional[str]:
    if not isinstance(session, dict):
        return None
    game_id = session.get("game_id") or (session.get("game_info") or {}).get("game_id")
    drill_id = session.get("drill_id") or session.get("module_id")
    return build_progression_unit_key(
        game_id=str(game_id) if game_id else None,
        observation_scope=session.get("observation_scope"),
        drill_id=str(drill_id) if drill_id else None,
        legacy_session_id=str(session.get("id") or "") or None,
    )


def unit_key_from_event(
    event: Dict[str, Any],
    session: Optional[Dict[str, Any]] = None,
) -> Optional[str]:
    game_id = event.get("gameId")
    drill_id = event.get("drillId")
    scope = event.get("observationScope")
    session_id = event.get("sessionId")

    if session:
        if not game_id:
            game_id = session.get("game_id") or (session.get("game_info") or {}).get("game_id")
        if not drill_id:
            drill_id = session.get("drill_id") or session.get("module_id")
        if not scope:
            scope = session.get("observation_scope")
        if not session_id:
            session_id = session.get("id")

    return build_progression_unit_key(
        game_id=str(game_id) if game_id else None,
        observation_scope=str(scope) if scope else None,
        drill_id=str(drill_id) if drill_id else None,
        legacy_session_id=str(session_id) if session_id else None,
    )
