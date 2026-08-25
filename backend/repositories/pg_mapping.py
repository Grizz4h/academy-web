"""Helpers to split JSON documents into relational columns + JSONB payload."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict, Optional, Tuple
from uuid import UUID


SESSION_RELATIONAL_KEYS = frozenset(
    {
        "id",
        "user",
        "state",
        "module_id",
        "drill_id",
        "observation_scope",
        "learning_area",
        "lab_mode",
        "session_method",
        "focus",
        "observed_team",
        "is_dummy",
        "current_phase",
        "created_at",
        "updated_at",
        "completed_at",
    }
)

PROFILE_RELATIONAL_KEYS = frozenset(
    {"displayName", "displayNameChosen", "updatedAt"}
)

REWARD_TOP_KEYS_IN_PAYLOAD = frozenset(
    {
        "currency",
        "unlockedAchievements",
        "unlockedMasteries",
        "processedSessions",
        "processedUnits",
        "processedGrantKeys",
        "progressionCurveVersion",
        "levelGrandfatherFloor",
        "processedEvents",
        "unlockedCosmetics",
        "activityLog",
        "unlockHistory",
        "favoriteCosmeticIds",
        "puxTransactions",
        "completedCollections",
        "masteryMilestoneUnlocks",
        "featuredAchievementId",
        "featuredMasteryCoinId",
        "challengeProgress",
        "challengeRotation",
        "venueVisits",
        # keep xp/pux mirrors out of payload when reconstructing? we keep full fidelity
        "xp",
        "progressionPuxGranted",
        "bootstrapCompletedAt",
        "lastUpdatedAt",
    }
)


def parse_timestamptz(value: Any) -> Optional[datetime]:
    if value is None or value == "":
        return None
    if isinstance(value, datetime):
        if value.tzinfo is None:
            return value.replace(tzinfo=timezone.utc)
        return value
    text = str(value).strip()
    if not text:
        return None
    if text.endswith("Z"):
        text = text[:-1] + "+00:00"
    try:
        dt = datetime.fromisoformat(text)
    except ValueError:
        return None
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt


def as_uuid(value: Any) -> UUID:
    return UUID(str(value))


def split_session(doc: Dict[str, Any]) -> Tuple[Dict[str, Any], Dict[str, Any]]:
    payload = {k: v for k, v in doc.items() if k not in SESSION_RELATIONAL_KEYS}
    cols = {
        "session_id": str(doc.get("id") or "").strip(),
        "rinq_user_id": str(doc.get("user") or "").strip(),
        "state": str(doc.get("state") or "IN_PROGRESS").strip() or "IN_PROGRESS",
        "module_id": doc.get("module_id"),
        "drill_id": doc.get("drill_id"),
        "observation_scope": doc.get("observation_scope"),
        "learning_area": doc.get("learning_area"),
        "lab_mode": doc.get("lab_mode"),
        "session_method": doc.get("session_method"),
        "focus": doc.get("focus"),
        "observed_team": doc.get("observed_team"),
        "is_dummy": bool(doc.get("is_dummy") or False),
        "current_phase": doc.get("current_phase"),
        "created_at": parse_timestamptz(doc.get("created_at")),
        "updated_at": parse_timestamptz(doc.get("updated_at")),
        "completed_at": parse_timestamptz(doc.get("completed_at")),
        "payload": payload,
    }
    return cols, payload


def merge_session_row(row: Dict[str, Any]) -> Dict[str, Any]:
    payload = dict(row.get("payload") or {})
    created = row.get("created_at")
    updated = row.get("updated_at")
    completed = row.get("completed_at")
    out = {
        **payload,
        "id": row["session_id"],
        "user": str(row["rinq_user_id"]),
        "state": row["state"],
        "module_id": row.get("module_id"),
        "drill_id": row.get("drill_id"),
        "observation_scope": row.get("observation_scope"),
        "learning_area": row.get("learning_area"),
        "lab_mode": row.get("lab_mode"),
        "session_method": row.get("session_method"),
        "focus": row.get("focus"),
        "observed_team": row.get("observed_team"),
        "is_dummy": bool(row.get("is_dummy") or False),
        "current_phase": row.get("current_phase"),
        "created_at": created.isoformat() if isinstance(created, datetime) else created,
        "updated_at": updated.isoformat() if isinstance(updated, datetime) else updated,
        "completed_at": completed.isoformat() if isinstance(completed, datetime) else completed,
    }
    return out


def split_profile(doc: Dict[str, Any]) -> Tuple[str, bool, Dict[str, Any], Optional[datetime]]:
    display = str(doc.get("displayName") or "Spieler").strip() or "Spieler"
    chosen = bool(doc.get("displayNameChosen") or False)
    updated = parse_timestamptz(doc.get("updatedAt"))
    payload = {k: v for k, v in doc.items() if k not in PROFILE_RELATIONAL_KEYS}
    return display, chosen, payload, updated


def merge_profile_row(row: Dict[str, Any]) -> Dict[str, Any]:
    payload = dict(row.get("payload") or {})
    updated = row.get("updated_at")
    out = {
        **payload,
        "displayName": row["display_name"],
        "displayNameChosen": bool(row.get("display_name_chosen")),
        "updatedAt": updated.isoformat() if isinstance(updated, datetime) else updated,
    }
    return out


def split_reward(doc: Dict[str, Any]) -> Dict[str, Any]:
    currency = doc.get("currency") if isinstance(doc.get("currency"), dict) else {}
    pux = int(currency.get("PUX") if currency.get("PUX") is not None else doc.get("pux") or 0)
    xp = int(doc.get("xp") or 0)
    progression = int(doc.get("progressionPuxGranted") or 0)
    # Store full document in payload for round-trip fidelity (incl. xp/pux mirrors).
    payload = dict(doc)
    return {
        "xp": max(0, xp),
        "pux": max(0, pux),
        "progression_pux_granted": max(0, progression),
        "payload": payload,
        "bootstrap_completed_at": parse_timestamptz(doc.get("bootstrapCompletedAt")),
        "last_updated_at": parse_timestamptz(doc.get("lastUpdatedAt")),
    }


def merge_reward_row(row: Dict[str, Any]) -> Dict[str, Any]:
    payload = dict(row.get("payload") or {})
    # Prefer relational counters as source of truth after DB writes.
    payload["xp"] = int(row.get("xp") or 0)
    currency = payload.get("currency") if isinstance(payload.get("currency"), dict) else {}
    currency = {**currency, "PUX": int(row.get("pux") or 0)}
    payload["currency"] = currency
    payload["progressionPuxGranted"] = int(row.get("progression_pux_granted") or 0)
    boot = row.get("bootstrap_completed_at")
    last = row.get("last_updated_at")
    if boot is not None:
        payload["bootstrapCompletedAt"] = (
            boot.isoformat() if isinstance(boot, datetime) else boot
        )
    if last is not None:
        payload["lastUpdatedAt"] = last.isoformat() if isinstance(last, datetime) else last
    return payload
