"""Resolve duplicate UUID vs legacy JSON files to one canonical record per rinq_user_id."""

from __future__ import annotations

import json
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple
from uuid import UUID

from identity.store import normalize_subject


def is_uuid(value: str) -> bool:
    try:
        UUID(str(value))
        return True
    except Exception:
        return False


def iter_json_files(root: Path) -> List[Path]:
    if not root.is_dir():
        return []
    return sorted(
        p for p in root.rglob("*.json") if p.is_file() and not p.name.startswith(".")
    )


def resolve_rinq_for_username(
    username: str, identities: List[Dict[str, Any]]
) -> Optional[str]:
    key = normalize_subject(username)
    for row in identities:
        if normalize_subject(row.get("legacy_username") or "") == key:
            return str(row.get("rinq_user_id") or "") or None
    return None


def _read_json(path: Path) -> Any:
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


@dataclass
class CanonicalBundle:
    """One canonical JSON document per rinq_user_id after precedence rules."""

    records: Dict[str, Dict[str, Any]] = field(default_factory=dict)
    source_by_rid: Dict[str, str] = field(default_factory=dict)
    source_files: int = 0
    canonical_records: int = 0
    legacy_duplicate_skipped: List[str] = field(default_factory=list)
    errors: List[str] = field(default_factory=list)

    def as_meta(self) -> Dict[str, Any]:
        return {
            "source_files": self.source_files,
            "canonical_records": self.canonical_records,
            "legacy_duplicate_skipped": list(self.legacy_duplicate_skipped),
        }


def _resolve_path_owner(
    path: Path, identities: List[Dict[str, Any]]
) -> Tuple[Optional[str], bool, Optional[str]]:
    """Return (rinq_user_id, is_uuid_keyed, error_message)."""
    stem = path.stem
    if is_uuid(stem):
        return stem, True, None
    mapped = resolve_rinq_for_username(stem, identities)
    if not mapped:
        return None, False, f"unresolved owner for {path.name}"
    return mapped, False, None


def canonicalize_user_json_dir(
    root: Path,
    identities: List[Dict[str, Any]],
    *,
    domain: str,
) -> CanonicalBundle:
    """UUID-keyed file beats legacy username file for the same rinq_user_id."""
    bundle = CanonicalBundle()
    if not root.is_dir():
        return bundle

    grouped: Dict[str, List[Tuple[Path, Dict[str, Any], bool]]] = {}
    for path in iter_json_files(root):
        try:
            doc = _read_json(path)
        except Exception as exc:
            bundle.errors.append(f"{domain} read {path.name}: {exc}")
            continue
        if not isinstance(doc, dict):
            bundle.errors.append(f"{domain} invalid JSON object: {path.name}")
            continue
        rid, uuid_keyed, err = _resolve_path_owner(path, identities)
        if err or not rid:
            bundle.errors.append(f"{domain} {err or path.name}")
            continue
        grouped.setdefault(rid, []).append((path, doc, uuid_keyed))
        bundle.source_files += 1

    for rid, items in grouped.items():
        uuid_items = [item for item in items if item[2]]
        legacy_items = [item for item in items if not item[2]]

        if uuid_items:
            canonical = next((item for item in uuid_items if item[0].stem == rid), uuid_items[0])
            if len(uuid_items) > 1:
                names = ", ".join(p.name for p, _, _ in uuid_items)
                bundle.errors.append(
                    f"{domain} conflict: multiple UUID files for {rid}: {names}"
                )
            for path, _, _ in legacy_items:
                bundle.legacy_duplicate_skipped.append(path.name)
            chosen_path, chosen_doc, _ = canonical
        elif legacy_items:
            if len(legacy_items) > 1:
                names = ", ".join(p.name for p, _, _ in legacy_items)
                bundle.errors.append(
                    f"{domain} conflict: multiple legacy files for {rid}: {names}"
                )
                continue
            chosen_path, chosen_doc, _ = legacy_items[0]
        else:
            continue

        bundle.records[rid] = chosen_doc
        bundle.source_by_rid[rid] = chosen_path.name

    bundle.canonical_records = len(bundle.records)
    return bundle


def pick_canonical_reward_path(
    academy_dir: Path, rinq_user_id: str, legacy_username: str
) -> Optional[Path]:
    """Anchor helper: prefer UUID file over legacy username file."""
    uuid_path = academy_dir / "rewards" / f"{rinq_user_id}.json"
    if uuid_path.exists():
        return uuid_path
    legacy_path = academy_dir / "rewards" / f"{legacy_username}.json"
    if legacy_path.exists():
        return legacy_path
    return None
