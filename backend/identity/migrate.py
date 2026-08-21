"""Idempotent migration: legacy username ownership → rinq_user_id."""

from __future__ import annotations

import json
import os
import re
import shutil
from datetime import datetime, timezone
from typing import Any, Callable, Dict, Iterable, List, Optional, Tuple

from .context import LEGACY_PASSWORD_PROVIDER
from .store import IdentityStore, normalize_subject


def _utc_stamp() -> str:
    return datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")


def _load_json(path: str) -> Any:
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def _save_json(path: str, data: Any) -> None:
    os.makedirs(os.path.dirname(path) or ".", exist_ok=True)
    tmp = path + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
        f.flush()
        os.fsync(f.fileno())
    os.replace(tmp, path)


def _iter_json_files(root: str) -> Iterable[str]:
    if not root or not os.path.isdir(root):
        return []
    for dirpath, _, files in os.walk(root):
        for name in files:
            if name.endswith(".json") and not name.startswith("."):
                yield os.path.join(dirpath, name)


def _looks_like_uuid(value: str) -> bool:
    return bool(
        re.fullmatch(
            r"[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}",
            (value or "").strip(),
        )
    )


def backup_runtime_trees(paths: List[str], backup_root: str) -> str:
    stamp = _utc_stamp()
    dest = os.path.join(backup_root, f"identity-3a-{stamp}")
    os.makedirs(dest, exist_ok=True)
    for src in paths:
        if not src or not os.path.exists(src):
            continue
        name = os.path.basename(src.rstrip(os.sep)) or "root"
        target = os.path.join(dest, name)
        if os.path.isdir(src):
            if os.path.exists(target):
                continue
            shutil.copytree(src, target, dirs_exist_ok=False)
        else:
            shutil.copy2(src, target)
    return dest


def ensure_identities_for_users(
    store: IdentityStore,
    users_file: str,
) -> Dict[str, str]:
    """Return map normalized_username → rinq_user_id. Idempotent."""
    mapping: Dict[str, str] = {}
    if not os.path.exists(users_file):
        return mapping
    users_doc = _load_json(users_file)
    for user in users_doc.get("users") or []:
        username = user.get("username") or ""
        subject = normalize_subject(username)
        if not subject:
            continue
        ctx = store.ensure_legacy_identity(
            subject,
            display_name=username,
            created_at=user.get("created_at"),
        )
        mapping[subject] = ctx.rinq_user_id
    return mapping


def _resolve_owner_id(
    raw: str,
    username_to_uuid: Dict[str, str],
) -> Optional[str]:
    key = normalize_subject(raw)
    if not key:
        return None
    if _looks_like_uuid(key):
        return key
    return username_to_uuid.get(key)


def _rewrite_owner_fields(
    doc: Dict[str, Any],
    username_to_uuid: Dict[str, str],
    fields: Tuple[str, ...] = ("user", "created_by"),
) -> bool:
    changed = False
    for field in fields:
        if field not in doc:
            continue
        raw = doc.get(field)
        if not isinstance(raw, str):
            continue
        new_id = _resolve_owner_id(raw, username_to_uuid)
        if new_id and new_id != raw:
            doc[field] = new_id
            changed = True
    return changed


def _rename_user_keyed_file(
    directory: str,
    username_to_uuid: Dict[str, str],
) -> List[str]:
    """Rename {username}.json → {uuid}.json when source is legacy."""
    actions: List[str] = []
    if not os.path.isdir(directory):
        return actions
    for name in list(os.listdir(directory)):
        if not name.endswith(".json"):
            continue
        stem = name[:-5]
        if _looks_like_uuid(stem):
            continue
        key = normalize_subject(stem)
        uuid = username_to_uuid.get(key)
        if not uuid:
            continue
        src = os.path.join(directory, name)
        dest = os.path.join(directory, f"{uuid}.json")
        if os.path.abspath(src) == os.path.abspath(dest):
            continue
        if os.path.exists(dest):
            # Prefer existing UUID file; drop duplicate legacy if identical owner already migrated
            actions.append(f"skip_rename_exists {src} -> {dest}")
            continue
        os.replace(src, dest)
        actions.append(f"renamed {src} -> {dest}")
    return actions


def _migrate_avatar_files(
    avatar_dir: str,
    username_to_uuid: Dict[str, str],
) -> List[str]:
    actions: List[str] = []
    if not os.path.isdir(avatar_dir):
        return actions
    for name in list(os.listdir(avatar_dir)):
        if name.startswith("."):
            continue
        # {user_key}_{hex8}.ext
        match = re.match(r"^([a-z0-9._-]+)_([0-9a-fA-F]{8})(\.[A-Za-z0-9]+)$", name)
        if not match:
            continue
        user_key, suffix, ext = match.group(1), match.group(2), match.group(3)
        if _looks_like_uuid(user_key):
            continue
        uuid = username_to_uuid.get(normalize_subject(user_key))
        if not uuid:
            continue
        src = os.path.join(avatar_dir, name)
        dest = os.path.join(avatar_dir, f"{uuid}_{suffix}{ext}")
        if os.path.exists(dest):
            actions.append(f"skip_avatar_exists {src}")
            continue
        os.replace(src, dest)
        actions.append(f"avatar {src} -> {dest}")

        # Patch profile uploadUrl references if profile already UUID-named
        profile_path = os.path.join(os.path.dirname(avatar_dir), "..", "profiles", f"{uuid}.json")
        profile_path = os.path.normpath(profile_path)
    return actions


def _patch_avatar_urls_in_profiles(
    profiles_dir: str,
    username_to_uuid: Dict[str, str],
) -> List[str]:
    actions: List[str] = []
    for path in _iter_json_files(profiles_dir):
        try:
            doc = _load_json(path)
        except Exception:
            continue
        changed = False
        avatar = doc.get("avatar")
        if isinstance(avatar, dict) and avatar.get("type") == "upload":
            url = avatar.get("uploadUrl") or ""
            if isinstance(url, str) and "/uploads/avatars/" in url:
                for legacy, uuid in username_to_uuid.items():
                    needle = f"/uploads/avatars/{legacy}_"
                    repl = f"/uploads/avatars/{uuid}_"
                    if needle in url:
                        avatar["uploadUrl"] = url.replace(needle, repl)
                        changed = True
        if changed:
            _save_json(path, doc)
            actions.append(f"profile_avatar_url {path}")
    return actions


def _migrate_json_tree_owners(
    root: str,
    username_to_uuid: Dict[str, str],
    *,
    extra_fields: Tuple[str, ...] = (),
) -> List[str]:
    actions: List[str] = []
    fields = ("user", "created_by") + extra_fields
    for path in _iter_json_files(root):
        try:
            doc = _load_json(path)
        except Exception:
            continue
        if not isinstance(doc, dict):
            continue
        if _rewrite_owner_fields(doc, username_to_uuid, fields):
            # Observation profile_id may embed username — rewrite if present
            profile_id = doc.get("profile_id")
            if isinstance(profile_id, str):
                for legacy, uuid in username_to_uuid.items():
                    prefix = f"profile_{legacy}_"
                    if profile_id.startswith(prefix):
                        doc["profile_id"] = f"profile_{uuid}_" + profile_id[len(prefix) :]
            _save_json(path, doc)
            actions.append(f"owner_fields {path}")
    return actions


def _rename_session_files(
    sessions_dir: str,
    username_to_uuid: Dict[str, str],
) -> List[str]:
    """Rename {Username}_{ts}.json → {uuid}_{ts}.json when possible."""
    actions: List[str] = []
    for path in list(_iter_json_files(sessions_dir)):
        base = os.path.basename(path)
        if not base.endswith(".json"):
            continue
        stem = base[:-5]
        # Prefer rewriting based on file content user field (already UUID after owner migrate)
        try:
            doc = _load_json(path)
        except Exception:
            continue
        owner = doc.get("user") if isinstance(doc, dict) else None
        if not isinstance(owner, str) or not _looks_like_uuid(owner):
            continue
        # If filename still starts with a legacy username
        for legacy in username_to_uuid:
            if stem.lower().startswith(legacy + "_") or stem.lower() == legacy:
                # Keep timestamp suffix if present
                parts = stem.split("_", 1)
                suffix = parts[1] if len(parts) > 1 else stem
                new_name = f"{owner}_{suffix}.json" if parts else f"{owner}.json"
                # Avoid double uuid prefix if stem already uuid
                if _looks_like_uuid(parts[0]):
                    break
                dest = os.path.join(os.path.dirname(path), new_name)
                if os.path.exists(dest):
                    actions.append(f"skip_session_rename {path}")
                    break
                os.replace(path, dest)
                # Keep session id field stable (id may still be old filename stem)
                actions.append(f"session_file {path} -> {dest}")
                break
    return actions


def run_identity_migration(
    *,
    store: IdentityStore,
    users_file: str,
    profiles_dir: str,
    rewards_dir: str,
    sessions_dir: str,
    scenes_dir: str,
    observations_dir: str,
    uploads_dir: str,
    backup_root: str,
    create_backup: bool = True,
) -> Dict[str, Any]:
    report: Dict[str, Any] = {"backup": None, "mapping": {}, "actions": []}

    paths = [
        users_file,
        profiles_dir,
        rewards_dir,
        sessions_dir,
        scenes_dir,
        observations_dir,
        uploads_dir,
        store.path,
    ]
    if create_backup:
        report["backup"] = backup_runtime_trees(
            [p for p in paths if p and os.path.exists(p)],
            backup_root,
        )

    mapping = ensure_identities_for_users(store, users_file)
    report["mapping"] = mapping
    if not mapping:
        return report

    actions: List[str] = []
    actions.extend(_rename_user_keyed_file(profiles_dir, mapping))
    actions.extend(_rename_user_keyed_file(rewards_dir, mapping))
    actions.extend(_migrate_avatar_files(os.path.join(uploads_dir, "avatars"), mapping))
    actions.extend(_patch_avatar_urls_in_profiles(profiles_dir, mapping))
    actions.extend(_migrate_json_tree_owners(sessions_dir, mapping))
    actions.extend(_rename_session_files(sessions_dir, mapping))
    actions.extend(_migrate_json_tree_owners(scenes_dir, mapping))
    actions.extend(
        _migrate_json_tree_owners(
            observations_dir,
            mapping,
        )
    )

    # Marker file so repeat runs are cheap to detect (still fully idempotent without it)
    marker = os.path.join(os.path.dirname(store.path), ".identity_migration_3a_done")
    _save_json(
        marker,
        {
            "completed_at": datetime.now(timezone.utc).replace(tzinfo=None).isoformat(),
            "users": len(mapping),
            "providers": [LEGACY_PASSWORD_PROVIDER],
        },
    )
    report["actions"] = actions
    report["marker"] = marker
    return report


def owners_match(resource_user: str, auth_owner_id: str, legacy_username: Optional[str]) -> bool:
    key = normalize_subject(resource_user)
    if not key:
        return False
    if key == normalize_subject(auth_owner_id):
        return True
    if legacy_username and key == normalize_subject(legacy_username):
        return True
    return False
