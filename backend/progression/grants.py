"""Server-side base grants for unified progression pipeline."""

from __future__ import annotations

from typing import Any, Dict, List, Optional, Tuple

from .config import (
    BASE_PUX_PER_UNIT,
    BASE_XP_PER_UNIT,
    EARLY_SLOT_COSMETICS,
    FIRST_DRILL_ID_BONUS_XP,
    FULL_GAME_BONUS_COSMETIC_ID,
    FULL_GAME_BONUS_PUX,
    FULL_GAME_BONUS_XP,
    RULE_BASE_UNIT_PUX,
    RULE_BASE_UNIT_XP,
    RULE_EARLY_SLOT,
    RULE_FIRST_DRILL_ID_BONUS_XP,
    RULE_FULL_GAME_BONUS,
    RULE_FULL_GAME_COSMETIC,
    RULE_TRACK0_BUNDLE,
    TRACK0_BUNDLE_COSMETIC_ID,
    TRACK0_BUNDLE_PUX,
    TRACK0_BUNDLE_XP,
)
from .unit_key import normalize_observation_scope, normalize_part, unit_key_from_event

GrantResult = Tuple[int, int, List[dict], List[str]]


def _session_is_grant_eligible(session: Optional[Dict[str, Any]]) -> bool:
    if not isinstance(session, dict):
        return False
    if session.get("is_dummy") is True:
        return False
    if str(session.get("state") or "").upper() != "COMPLETED":
        return False
    scope = normalize_observation_scope(session.get("observation_scope"))
    if scope == "LESSON":
        return False
    game_id = session.get("game_id") or (session.get("game_info") or {}).get("game_id")
    drill_id = session.get("drill_id") or session.get("module_id")
    if not normalize_part(str(game_id) if game_id else None):
        return False
    if not normalize_part(str(drill_id) if drill_id else None):
        return False
    return True


def _session_is_foundation(session: Optional[Dict[str, Any]]) -> bool:
    if not isinstance(session, dict):
        return False
    if normalize_observation_scope(session.get("observation_scope")) == "LESSON":
        return True
    module_id = str(session.get("module_id") or "").upper()
    if module_id == "T0" or module_id.startswith("T0"):
        return True
    for drill in session.get("drills") or []:
        if isinstance(drill, dict) and drill.get("drill_type") == "foundation_lesson":
            return True
    return False


def _grant_key(rule_id: str, ref: str) -> str:
    return f"{rule_id}:{ref}"


def _game_has_all_periods(processed_units: Dict[str, Any], game_id: str) -> bool:
    prefix = f"{normalize_part(game_id)}|"
    scopes = set()
    for key in processed_units:
        if not isinstance(key, str) or not key.startswith(prefix):
            continue
        parts = key.split("|")
        if len(parts) >= 2:
            scopes.add(parts[1].upper())
    return {"P1", "P2", "P3"}.issubset(scopes)


def _unlock_cosmetic(
    state: Dict[str, Any],
    cosmetic_id: str,
    *,
    evaluated_at: str,
    source_type: str,
    source_id: str,
) -> Optional[dict]:
    if not cosmetic_id:
        return None
    unlocked = state.setdefault("unlockedCosmetics", {})
    if cosmetic_id in unlocked:
        return None
    entry = {
        "cosmeticId": cosmetic_id,
        "unlockedAt": evaluated_at,
        "sourceType": source_type,
        "sourceId": source_id,
        "earnKind": "earned",
    }
    unlocked[cosmetic_id] = entry
    return entry


def _apply_early_slot_grants(
    state: Dict[str, Any],
    *,
    unit_count: int,
    evaluated_at: str,
    added_xp: int,
    added_pux: int,
    added_cosmetics: List[dict],
    logs: List[str],
) -> Tuple[int, int]:
    processed_grant_keys: Dict[str, Any] = state.setdefault("processedGrantKeys", {})
    for threshold, cosmetic_id in sorted(EARLY_SLOT_COSMETICS.items()):
        if unit_count < threshold:
            continue
        slot_key = _grant_key(RULE_EARLY_SLOT, str(threshold))
        if slot_key in processed_grant_keys:
            continue
        processed_grant_keys[slot_key] = evaluated_at
        cosmetic = _unlock_cosmetic(
            state,
            cosmetic_id,
            evaluated_at=evaluated_at,
            source_type="progression_unit",
            source_id=f"early_slot:{threshold}",
        )
        if cosmetic:
            added_cosmetics.append(cosmetic)
            logs.append(f"grant:early_slot:{threshold}:{cosmetic_id}")
    return added_xp, added_pux


def _apply_track0_bundle(
    state: Dict[str, Any],
    raw_event: dict,
    *,
    evaluated_at: str,
    added_xp: int,
    added_pux: int,
    added_cosmetics: List[dict],
    logs: List[str],
) -> Tuple[int, int]:
    processed_grant_keys: Dict[str, Any] = state.setdefault("processedGrantKeys", {})
    user_ref = str(raw_event.get("userId") or raw_event.get("id") or "").strip()
    if user_ref.startswith("track0_completed:"):
        user_ref = user_ref.split(":", 1)[-1]
    bundle_key = f"track0_completed:{user_ref or 'account'}"
    if bundle_key in processed_grant_keys:
        logs.append(f"skip:track0_duplicate:{user_ref or 'account'}")
        return added_xp, added_pux

    processed_grant_keys[bundle_key] = evaluated_at
    added_xp += TRACK0_BUNDLE_XP
    added_pux += TRACK0_BUNDLE_PUX
    cosmetic = _unlock_cosmetic(
        state,
        TRACK0_BUNDLE_COSMETIC_ID,
        evaluated_at=evaluated_at,
        source_type="track0",
        source_id="T0",
    )
    if cosmetic:
        added_cosmetics.append(cosmetic)
    logs.append(f"grant:track0_bundle:{user_ref or 'account'}")
    return added_xp, added_pux


def compute_unified_base_grants(
    state: Dict[str, Any],
    activity_events: List[dict],
    *,
    session_doc: Optional[Dict[str, Any]] = None,
    evaluated_at: str,
) -> GrantResult:
    """
    Apply base unit XP/PUX, track0 bundle, early slots, and related bonuses server-side.
    Returns (added_xp, added_pux, unlocked_cosmetics, log_lines).
    """
    processed_units: Dict[str, Any] = state.setdefault("processedUnits", {})
    processed_grant_keys: Dict[str, Any] = state.setdefault("processedGrantKeys", {})

    added_xp = 0
    added_pux = 0
    added_cosmetics: List[dict] = []
    logs: List[str] = []

    sessions_by_id: Dict[str, Dict[str, Any]] = {}
    if session_doc and session_doc.get("id"):
        sessions_by_id[str(session_doc["id"])] = session_doc

    for raw_event in activity_events or []:
        if not isinstance(raw_event, dict):
            continue
        if raw_event.get("isDummy") is True:
            continue

        event_type = str(raw_event.get("type") or "")

        if event_type == "track0_completed":
            added_xp, added_pux = _apply_track0_bundle(
                state,
                raw_event,
                evaluated_at=evaluated_at,
                added_xp=added_xp,
                added_pux=added_pux,
                added_cosmetics=added_cosmetics,
                logs=logs,
            )
            continue

        if event_type != "session_completed":
            continue

        event_session_id = str(raw_event.get("sessionId") or "").strip()
        session = sessions_by_id.get(event_session_id) if event_session_id else session_doc
        if not _session_is_grant_eligible(session):
            if _session_is_foundation(session):
                logs.append(f"skip:foundation_session:{event_session_id or 'unknown'}")
            else:
                logs.append(f"skip:session_ineligible:{event_session_id or 'unknown'}")
            continue

        unit_key = unit_key_from_event(raw_event, session)
        if not unit_key:
            logs.append(f"skip:no_unit_key:{event_session_id or 'unknown'}")
            continue

        if unit_key in processed_units:
            logs.append(f"skip:unit_duplicate:{unit_key}")
            continue

        processed_units[unit_key] = {
            "progressionUnitKey": unit_key,
            "sessionId": event_session_id or None,
            "grantedAt": evaluated_at,
            "ruleIds": [RULE_BASE_UNIT_XP, RULE_BASE_UNIT_PUX],
        }
        processed_grant_keys[_grant_key(RULE_BASE_UNIT_XP, unit_key)] = evaluated_at
        processed_grant_keys[_grant_key(RULE_BASE_UNIT_PUX, unit_key)] = evaluated_at

        added_xp += BASE_XP_PER_UNIT
        added_pux += BASE_PUX_PER_UNIT
        logs.append(f"grant:base_unit:{unit_key}")

        unit_count = len(processed_units)
        _apply_early_slot_grants(
            state,
            unit_count=unit_count,
            evaluated_at=evaluated_at,
            added_xp=added_xp,
            added_pux=added_pux,
            added_cosmetics=added_cosmetics,
            logs=logs,
        )

        drill_id = normalize_part(str(raw_event.get("drillId") or ""))
        if not drill_id and session:
            drill_id = normalize_part(str(session.get("drill_id") or session.get("module_id") or ""))

        first_drill_key = _grant_key(RULE_FIRST_DRILL_ID_BONUS_XP, drill_id)
        is_first_drill = raw_event.get("isFirstSessionOfDrill") is True
        if is_first_drill and drill_id and first_drill_key not in processed_grant_keys:
            processed_grant_keys[first_drill_key] = evaluated_at
            added_xp += FIRST_DRILL_ID_BONUS_XP
            logs.append(f"grant:first_drill:{drill_id}")

        game_id = normalize_part(
            str(
                raw_event.get("gameId")
                or (session or {}).get("game_id")
                or ((session or {}).get("game_info") or {}).get("game_id")
                or "",
            ),
        )
        if game_id and _game_has_all_periods(processed_units, game_id):
            full_game_key = _grant_key(RULE_FULL_GAME_BONUS, game_id)
            if full_game_key not in processed_grant_keys:
                processed_grant_keys[full_game_key] = evaluated_at
                added_xp += FULL_GAME_BONUS_XP
                added_pux += FULL_GAME_BONUS_PUX
                logs.append(f"grant:full_game:{game_id}")

                cosmetic_key = _grant_key(RULE_FULL_GAME_COSMETIC, game_id)
                if cosmetic_key not in processed_grant_keys:
                    processed_grant_keys[cosmetic_key] = evaluated_at
                    cosmetic = _unlock_cosmetic(
                        state,
                        FULL_GAME_BONUS_COSMETIC_ID,
                        evaluated_at=evaluated_at,
                        source_type="full_game",
                        source_id=game_id,
                    )
                    if cosmetic:
                        added_cosmetics.append(cosmetic)
                        logs.append(f"grant:full_game_cosmetic:{game_id}")

    return added_xp, added_pux, added_cosmetics, logs
