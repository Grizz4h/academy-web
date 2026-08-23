"""Post-import verification: counts + known user anchors (JSON vs Postgres)."""

from __future__ import annotations

import json
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Dict, List, Optional

from identity.store import normalize_subject

from db.pool import connection
from migration.importer import (
    is_uuid,
    iter_json_files,
    load_identity_bundle,
    load_users,
    pg_counts,
    resolve_rinq_for_username,
)
from repositories.json_reward import merge_reward_state
from repositories.pg_mapping import merge_reward_row, merge_session_row


@dataclass
class VerifyReport:
    ok: bool = True
    counts_json: Dict[str, int] = field(default_factory=dict)
    counts_pg: Dict[str, int] = field(default_factory=dict)
    mismatches: List[str] = field(default_factory=list)
    anchors: Dict[str, Any] = field(default_factory=dict)

    def as_dict(self) -> Dict[str, Any]:
        return {
            "ok": self.ok,
            "counts_json": self.counts_json,
            "counts_pg": self.counts_pg,
            "mismatches": self.mismatches,
            "anchors": self.anchors,
        }


def _read_json(path: Path) -> Any:
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def json_domain_counts(academy_dir: Path) -> Dict[str, int]:
    identity = load_identity_bundle(academy_dir)
    return {
        "app_users": len(identity.get("identities") or []),
        "auth_links": len(identity.get("auth_links") or []),
        "legacy_credentials": len(load_users(academy_dir)),
        "profiles": len(iter_json_files(academy_dir / "profiles")),
        "reward_states": len(iter_json_files(academy_dir / "rewards")),
        "sessions": len(iter_json_files(academy_dir / "sessions")),
    }


def _achievement_count(state: Dict[str, Any]) -> int:
    unlocked = state.get("unlockedAchievements") or {}
    return len(unlocked) if isinstance(unlocked, dict) else 0


def _anchor_for_legacy(
    academy_dir: Path, legacy_username: str, identities: List[Dict[str, Any]]
) -> Optional[Dict[str, Any]]:
    rid = resolve_rinq_for_username(legacy_username, identities)
    if not rid:
        return None
    # rewards
    reward_path = academy_dir / "rewards" / f"{rid}.json"
    if not reward_path.exists():
        legacy_path = academy_dir / "rewards" / f"{normalize_subject(legacy_username)}.json"
        reward_path = legacy_path if legacy_path.exists() else reward_path
    xp = pux = achievements = None
    if reward_path.exists():
        state = merge_reward_state(_read_json(reward_path) or {})
        xp = int(state.get("xp") or 0)
        currency = state.get("currency") or {}
        pux = int(currency.get("PUX") or 0)
        achievements = _achievement_count(state)

    session_count = 0
    for path in iter_json_files(academy_dir / "sessions"):
        try:
            doc = _read_json(path)
        except Exception:
            continue
        if not isinstance(doc, dict):
            continue
        user = str(doc.get("user") or "")
        if user == rid or normalize_subject(user) == normalize_subject(legacy_username):
            session_count += 1

    return {
        "legacy_username": normalize_subject(legacy_username),
        "rinq_user_id": rid,
        "xp": xp,
        "pux": pux,
        "achievement_count": achievements,
        "session_count": session_count,
    }


def _pg_anchor(rinq_user_id: str) -> Dict[str, Any]:
    with connection() as conn:
        reward = conn.execute(
            """
            SELECT xp, pux, payload FROM reward_states WHERE rinq_user_id = %s::uuid
            """,
            (rinq_user_id,),
        ).fetchone()
        sessions = conn.execute(
            "SELECT COUNT(*) AS c FROM sessions WHERE rinq_user_id = %s::uuid",
            (rinq_user_id,),
        ).fetchone()
        user = conn.execute(
            "SELECT rinq_user_id::text FROM app_users WHERE rinq_user_id = %s::uuid",
            (rinq_user_id,),
        ).fetchone()
    out: Dict[str, Any] = {
        "rinq_user_id": rinq_user_id,
        "exists": bool(user),
        "session_count": int(sessions["c"]) if sessions else 0,
    }
    if reward:
        state = merge_reward_state(merge_reward_row(reward))
        out["xp"] = int(state.get("xp") or 0)
        out["pux"] = int((state.get("currency") or {}).get("PUX") or 0)
        out["achievement_count"] = _achievement_count(state)
    else:
        out["xp"] = out["pux"] = out["achievement_count"] = None
    return out


def verify_migration(
    academy_dir: Path,
    *,
    anchor_usernames: Optional[List[str]] = None,
) -> VerifyReport:
    report = VerifyReport()
    academy_dir = Path(academy_dir)
    report.counts_json = json_domain_counts(academy_dir)
    try:
        report.counts_pg = pg_counts()
    except Exception as exc:
        report.ok = False
        report.mismatches.append(f"postgres unreachable: {exc}")
        return report

    # Count compare (credentials / profiles may differ if unresolved legacy files)
    for key in ("app_users", "auth_links", "sessions"):
        j = report.counts_json.get(key, 0)
        p = report.counts_pg.get(key, 0)
        if j != p:
            report.ok = False
            report.mismatches.append(f"count mismatch {key}: json={j} pg={p}")

    identity = load_identity_bundle(academy_dir)
    identities = list(identity.get("identities") or [])
    anchors = anchor_usernames or ["christoph", "martin", "tobi"]
    for name in anchors:
        json_anchor = _anchor_for_legacy(academy_dir, name, identities)
        if not json_anchor:
            report.anchors[name] = {"status": "not_in_json"}
            continue
        rid = json_anchor["rinq_user_id"]
        pg_anchor = _pg_anchor(rid)
        entry = {"json": json_anchor, "postgres": pg_anchor}
        for field in ("rinq_user_id", "xp", "pux", "achievement_count", "session_count"):
            jv = json_anchor.get(field if field != "rinq_user_id" else "rinq_user_id")
            pv = pg_anchor.get(field)
            if field == "rinq_user_id":
                jv = rid
                pv = pg_anchor.get("rinq_user_id")
            if jv is not None and pv is not None and jv != pv:
                report.ok = False
                report.mismatches.append(
                    f"anchor {name}.{field}: json={jv} pg={pv}"
                )
        if not pg_anchor.get("exists"):
            report.ok = False
            report.mismatches.append(f"anchor {name}: missing app_users row")
        report.anchors[name] = entry

    # Stable UUID check: every identity still present
    with connection() as conn:
        for row in identities:
            rid = str(row.get("rinq_user_id") or "")
            if not is_uuid(rid):
                continue
            found = conn.execute(
                "SELECT 1 FROM app_users WHERE rinq_user_id = %s::uuid",
                (rid,),
            ).fetchone()
            if not found:
                report.ok = False
                report.mismatches.append(f"missing uuid after migrate: {rid}")

    return report


def shadow_compare_session(session_id: str, json_doc: Dict[str, Any]) -> List[str]:
    """Temporary JSON-vs-Postgres compare for one session (no dual-write)."""
    mismatches: List[str] = []
    with connection() as conn:
        row = conn.execute(
            """
            SELECT session_id, rinq_user_id, state, module_id, drill_id,
                   observation_scope, learning_area, lab_mode, session_method,
                   focus, observed_team, is_dummy, current_phase,
                   created_at, updated_at, completed_at, payload
            FROM sessions WHERE session_id = %s
            """,
            (session_id,),
        ).fetchone()
    if not row:
        return [f"session {session_id} missing in postgres"]
    pg_doc = merge_session_row(row)
    for key in ("id", "user", "state", "module_id", "drill_id"):
        if json_doc.get(key) != pg_doc.get(key) and str(json_doc.get(key)) != str(
            pg_doc.get(key)
        ):
            mismatches.append(
                f"{key}: json={json_doc.get(key)!r} pg={pg_doc.get(key)!r}"
            )
    return mismatches
