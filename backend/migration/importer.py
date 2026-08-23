"""JSON → Postgres migration (Phase 4D). Idempotent; dry-run by default for apply steps."""

from __future__ import annotations

import json
import shutil
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

from identity.store import normalize_subject
from psycopg.types.json import Jsonb

from db.pool import connection, transaction
from migration.canonical import (
    CanonicalBundle,
    canonicalize_user_json_dir,
    is_uuid,
    iter_json_files,
    resolve_rinq_for_username,
)
from repositories.json_reward import merge_reward_state
from repositories.pg_mapping import (
    parse_timestamptz,
    split_profile,
    split_reward,
    split_session,
)


def merge_reward_state_safe(state: Dict[str, Any]) -> Dict[str, Any]:
    return merge_reward_state(state)


@dataclass
class MigrateReport:
    dry_run: bool
    counts_before: Dict[str, int] = field(default_factory=dict)
    counts_after: Dict[str, int] = field(default_factory=dict)
    planned: Dict[str, int] = field(default_factory=dict)
    written: Dict[str, int] = field(default_factory=dict)
    skipped: Dict[str, int] = field(default_factory=dict)
    errors: List[str] = field(default_factory=list)
    backup_path: Optional[str] = None
    source_files: Dict[str, int] = field(default_factory=dict)
    canonical_records: Dict[str, int] = field(default_factory=dict)
    legacy_duplicate_skipped: List[str] = field(default_factory=list)

    def as_dict(self) -> Dict[str, Any]:
        return {
            "dry_run": self.dry_run,
            "counts_before": self.counts_before,
            "counts_after": self.counts_after,
            "planned": self.planned,
            "written": self.written,
            "skipped": self.skipped,
            "errors": self.errors,
            "backup_path": self.backup_path,
            "source_files": self.source_files,
            "canonical_records": self.canonical_records,
            "legacy_duplicate_skipped": self.legacy_duplicate_skipped,
        }


def _read_json(path: Path) -> Any:
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def pg_counts() -> Dict[str, int]:
    tables = [
        "app_users",
        "auth_links",
        "legacy_credentials",
        "profiles",
        "reward_states",
        "sessions",
    ]
    out: Dict[str, int] = {}
    with connection() as conn:
        for table in tables:
            row = conn.execute(f"SELECT COUNT(*) AS c FROM {table}").fetchone()
            out[table] = int(row["c"])
    return out


def backup_json_tree(academy_dir: Path, backups_root: Path) -> Path:
    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    dest = backups_root / f"pre_pg_migrate_{stamp}"
    dest.mkdir(parents=True, exist_ok=False)
    for name in (
        "identity_store.json",
        "users.json",
        "profiles",
        "rewards",
        "sessions",
    ):
        src = academy_dir / name
        if not src.exists():
            continue
        target = dest / name
        if src.is_dir():
            shutil.copytree(src, target)
        else:
            shutil.copy2(src, target)
    meta = {
        "created_at": stamp,
        "source": str(academy_dir),
        "note": "JSON snapshot before Postgres import (Phase 4D)",
    }
    (dest / "BACKUP_META.json").write_text(json.dumps(meta, indent=2), encoding="utf-8")
    return dest


def load_identity_bundle(academy_dir: Path) -> Dict[str, Any]:
    path = academy_dir / "identity_store.json"
    if not path.exists():
        return {"identities": [], "auth_links": [], "version": 1}
    data = _read_json(path)
    if not isinstance(data, dict):
        return {"identities": [], "auth_links": [], "version": 1}
    data.setdefault("identities", [])
    data.setdefault("auth_links", [])
    return data


def load_users(academy_dir: Path) -> List[Dict[str, Any]]:
    path = academy_dir / "users.json"
    if not path.exists():
        return []
    data = _read_json(path)
    if isinstance(data, dict):
        return list(data.get("users") or [])
    return []


def _plan_wave1(
    academy_dir: Path,
    identities: List[Dict[str, Any]],
    links: List[Any],
    users: List[Any],
) -> Tuple[CanonicalBundle, CanonicalBundle, List[Path], Dict[str, int]]:
    profile_bundle = canonicalize_user_json_dir(
        academy_dir / "profiles", identities, domain="profiles"
    )
    reward_bundle = canonicalize_user_json_dir(
        academy_dir / "rewards", identities, domain="rewards"
    )
    session_paths = iter_json_files(academy_dir / "sessions")
    planned = {
        "app_users": len(identities),
        "auth_links": len(links),
        "legacy_credentials": len(users),
        "profiles": profile_bundle.canonical_records,
        "reward_states": reward_bundle.canonical_records,
        "sessions": len(session_paths),
    }
    return profile_bundle, reward_bundle, session_paths, planned


def migrate_from_json(
    academy_dir: Path,
    *,
    dry_run: bool = True,
    do_backup: bool = True,
    backups_root: Optional[Path] = None,
) -> MigrateReport:
    """Import Wave-1 domains. Preserves existing rinq_user_id values. Idempotent upserts."""
    report = MigrateReport(dry_run=dry_run)
    academy_dir = Path(academy_dir)

    try:
        report.counts_before = pg_counts()
    except Exception as exc:
        report.errors.append(f"cannot read postgres counts: {exc}")
        return report

    if do_backup and not dry_run:
        root = backups_root or (academy_dir.parent / "backups")
        try:
            report.backup_path = str(backup_json_tree(academy_dir, Path(root)))
        except Exception as exc:
            report.errors.append(f"backup failed: {exc}")
            return report

    identity = load_identity_bundle(academy_dir)
    identities = list(identity.get("identities") or [])
    links = list(identity.get("auth_links") or [])
    users = load_users(academy_dir)
    profile_bundle, reward_bundle, session_paths, planned = _plan_wave1(
        academy_dir, identities, links, users
    )

    report.planned = planned
    report.source_files = {
        "profiles": profile_bundle.source_files,
        "reward_states": reward_bundle.source_files,
        "sessions": len(session_paths),
    }
    report.canonical_records = {
        "profiles": profile_bundle.canonical_records,
        "reward_states": reward_bundle.canonical_records,
    }
    report.legacy_duplicate_skipped = (
        profile_bundle.legacy_duplicate_skipped + reward_bundle.legacy_duplicate_skipped
    )
    report.errors.extend(profile_bundle.errors)
    report.errors.extend(reward_bundle.errors)

    if dry_run:
        report.counts_after = report.counts_before
        return report

    try:
        with transaction() as conn:
            for row in identities:
                rid = str(row.get("rinq_user_id") or "").strip()
                if not rid or not is_uuid(rid):
                    report.errors.append(f"skip identity without uuid: {row!r}")
                    report.skipped["app_users"] = report.skipped.get("app_users", 0) + 1
                    continue
                created = parse_timestamptz(row.get("created_at")) or datetime.now(timezone.utc)
                status = row.get("status") or "active"
                legacy = row.get("legacy_username")
                if legacy:
                    legacy = normalize_subject(str(legacy))
                conn.execute(
                    """
                    INSERT INTO app_users (rinq_user_id, created_at, status, legacy_username)
                    VALUES (%s::uuid, %s, %s, %s)
                    ON CONFLICT (rinq_user_id) DO UPDATE SET
                      status = EXCLUDED.status,
                      legacy_username = COALESCE(EXCLUDED.legacy_username, app_users.legacy_username)
                    """,
                    (rid, created, status, legacy),
                )
                report.written["app_users"] = report.written.get("app_users", 0) + 1

            for link in links:
                rid = str(link.get("rinq_user_id") or "").strip()
                provider = link.get("provider")
                subject = normalize_subject(link.get("provider_subject") or "")
                if not rid or not provider or not subject:
                    report.skipped["auth_links"] = report.skipped.get("auth_links", 0) + 1
                    continue
                linked = parse_timestamptz(link.get("linked_at")) or datetime.now(timezone.utc)
                conn.execute(
                    """
                    INSERT INTO auth_links (rinq_user_id, provider, provider_subject, linked_at)
                    VALUES (%s::uuid, %s, %s, %s)
                    ON CONFLICT (provider, provider_subject) DO UPDATE SET
                      rinq_user_id = EXCLUDED.rinq_user_id,
                      linked_at = EXCLUDED.linked_at
                    """,
                    (rid, provider, subject, linked),
                )
                report.written["auth_links"] = report.written.get("auth_links", 0) + 1

            for user in users:
                uname = normalize_subject(user.get("username") or "")
                ph = user.get("password_hash")
                if not uname or not ph:
                    report.skipped["legacy_credentials"] = (
                        report.skipped.get("legacy_credentials", 0) + 1
                    )
                    continue
                rid = resolve_rinq_for_username(uname, identities) or str(
                    user.get("rinq_user_id") or ""
                )
                if not rid or not is_uuid(rid):
                    report.errors.append(f"credential without identity: {uname}")
                    report.skipped["legacy_credentials"] = (
                        report.skipped.get("legacy_credentials", 0) + 1
                    )
                    continue
                created = parse_timestamptz(user.get("created_at")) or datetime.now(timezone.utc)
                conn.execute(
                    """
                    INSERT INTO legacy_credentials (
                      rinq_user_id, username, password_hash, role, created_at,
                      password_updated_at
                    ) VALUES (%s::uuid, %s, %s, %s, %s, %s)
                    ON CONFLICT (username) DO UPDATE SET
                      password_hash = EXCLUDED.password_hash,
                      role = COALESCE(EXCLUDED.role, legacy_credentials.role),
                      rinq_user_id = EXCLUDED.rinq_user_id,
                      password_updated_at = COALESCE(
                        EXCLUDED.password_updated_at, legacy_credentials.password_updated_at
                      )
                    """,
                    (
                        rid,
                        uname,
                        str(ph),
                        user.get("role"),
                        created,
                        parse_timestamptz(user.get("password_updated_at")),
                    ),
                )
                report.written["legacy_credentials"] = (
                    report.written.get("legacy_credentials", 0) + 1
                )

            for rid, doc in profile_bundle.records.items():
                display, chosen, payload, updated = split_profile(doc)
                conn.execute(
                    """
                    INSERT INTO profiles (
                      rinq_user_id, display_name, display_name_chosen, payload, updated_at
                    ) VALUES (%s::uuid, %s, %s, %s, %s)
                    ON CONFLICT (rinq_user_id) DO UPDATE SET
                      display_name = EXCLUDED.display_name,
                      display_name_chosen = EXCLUDED.display_name_chosen,
                      payload = EXCLUDED.payload,
                      updated_at = EXCLUDED.updated_at
                    """,
                    (rid, display, chosen, Jsonb(payload), updated),
                )
                report.written["profiles"] = report.written.get("profiles", 0) + 1

            for rid, doc in reward_bundle.records.items():
                cols = split_reward(merge_reward_state_safe(doc))
                conn.execute(
                    """
                    INSERT INTO reward_states (
                      rinq_user_id, xp, pux, progression_pux_granted, payload,
                      bootstrap_completed_at, last_updated_at
                    ) VALUES (%s::uuid, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT (rinq_user_id) DO UPDATE SET
                      xp = EXCLUDED.xp,
                      pux = EXCLUDED.pux,
                      progression_pux_granted = EXCLUDED.progression_pux_granted,
                      payload = EXCLUDED.payload,
                      bootstrap_completed_at = EXCLUDED.bootstrap_completed_at,
                      last_updated_at = EXCLUDED.last_updated_at
                    """,
                    (
                        rid,
                        cols["xp"],
                        cols["pux"],
                        cols["progression_pux_granted"],
                        Jsonb(cols["payload"]),
                        cols["bootstrap_completed_at"],
                        cols["last_updated_at"],
                    ),
                )
                report.written["reward_states"] = report.written.get("reward_states", 0) + 1

            for path in session_paths:
                try:
                    doc = _read_json(path)
                except Exception as exc:
                    report.errors.append(f"session read {path}: {exc}")
                    continue
                if not isinstance(doc, dict):
                    continue
                sid = str(doc.get("id") or path.stem).strip()
                owner_raw = str(doc.get("user") or "").strip()
                if not sid or not owner_raw:
                    report.skipped["sessions"] = report.skipped.get("sessions", 0) + 1
                    continue
                if is_uuid(owner_raw):
                    rid = owner_raw
                else:
                    rid = resolve_rinq_for_username(owner_raw, identities) or ""
                if not rid or not is_uuid(rid):
                    report.errors.append(f"session owner unresolved: {sid} user={owner_raw}")
                    report.skipped["sessions"] = report.skipped.get("sessions", 0) + 1
                    continue
                conn.execute(
                    """
                    INSERT INTO app_users (rinq_user_id, status)
                    VALUES (%s::uuid, 'active')
                    ON CONFLICT (rinq_user_id) DO NOTHING
                    """,
                    (rid,),
                )
                doc = {**doc, "id": sid, "user": rid}
                cols, _ = split_session(doc)
                if not cols["created_at"]:
                    cols["created_at"] = datetime.now(timezone.utc)
                allowed = {
                    "PRE",
                    "P1",
                    "P2",
                    "P3",
                    "POST",
                    "IN_PROGRESS",
                    "COMPLETED",
                    "ABORTED",
                }
                if cols["state"] not in allowed:
                    cols["state"] = "IN_PROGRESS"
                conn.execute(
                    """
                    INSERT INTO sessions (
                      session_id, rinq_user_id, state, module_id, drill_id,
                      observation_scope, learning_area, lab_mode, session_method,
                      focus, observed_team, is_dummy, current_phase,
                      created_at, updated_at, completed_at, payload
                    ) VALUES (
                      %s, %s::uuid, %s, %s, %s,
                      %s, %s, %s, %s,
                      %s, %s, %s, %s,
                      %s, %s, %s, %s
                    )
                    ON CONFLICT (session_id) DO UPDATE SET
                      rinq_user_id = EXCLUDED.rinq_user_id,
                      state = EXCLUDED.state,
                      module_id = EXCLUDED.module_id,
                      drill_id = EXCLUDED.drill_id,
                      observation_scope = EXCLUDED.observation_scope,
                      learning_area = EXCLUDED.learning_area,
                      lab_mode = EXCLUDED.lab_mode,
                      session_method = EXCLUDED.session_method,
                      focus = EXCLUDED.focus,
                      observed_team = EXCLUDED.observed_team,
                      is_dummy = EXCLUDED.is_dummy,
                      current_phase = EXCLUDED.current_phase,
                      updated_at = EXCLUDED.updated_at,
                      completed_at = EXCLUDED.completed_at,
                      payload = EXCLUDED.payload
                    """,
                    (
                        cols["session_id"],
                        rid,
                        cols["state"],
                        cols["module_id"],
                        cols["drill_id"],
                        cols["observation_scope"],
                        cols["learning_area"],
                        cols["lab_mode"],
                        cols["session_method"],
                        cols["focus"],
                        cols["observed_team"],
                        cols["is_dummy"],
                        cols["current_phase"],
                        cols["created_at"],
                        cols["updated_at"],
                        cols["completed_at"],
                        Jsonb(cols["payload"]),
                    ),
                )
                report.written["sessions"] = report.written.get("sessions", 0) + 1
    except Exception as exc:
        report.errors.append(f"migrate transaction failed: {exc}")
        return report

    try:
        report.counts_after = pg_counts()
    except Exception as exc:
        report.errors.append(f"post-count failed: {exc}")
    return report
