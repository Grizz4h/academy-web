"""Protected club-mark files. Public only when catalog ID is cleared; else creator/admin."""

from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Optional, Set

_REPO_ROOT = Path(__file__).resolve().parent.parent

TEAM_LOGOS_DIR = _REPO_ROOT / "assets" / "team_logos"
CLEARANCE_PATH = _REPO_ROOT / "data" / "academy" / "club_logo_clearance.json"

ALLOWED_LEAGUES = frozenset({"del", "del2", "chl", "nhl", "u20_dnl"})
ALLOWED_EXTENSIONS = frozenset({".png", ".svg", ".jpg", ".jpeg", ".webp", ".gif"})
_FILENAME_RE = re.compile(r"^[a-z0-9][a-z0-9_-]*\.(png|svg|jpe?g|webp|gif)$", re.IGNORECASE)

MIME_BY_EXT = {
    ".png": "image/png",
    ".svg": "image/svg+xml",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".webp": "image/webp",
    ".gif": "image/gif",
}


def normalize_catalog_id(value: str | None) -> str:
    return (value or "").strip().lower().replace("-", "_")


def league_logos_dir(league: str, *, root: Optional[Path] = None) -> Path:
    return (root or TEAM_LOGOS_DIR) / league


def catalog_id_from_filename(filename: str) -> str:
    return normalize_catalog_id(Path(filename).stem)


def load_cleared_catalog_ids(*, path: Optional[Path] = None) -> Set[str]:
    source = path or CLEARANCE_PATH
    try:
        raw = json.loads(source.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return set()
    if not isinstance(raw, dict):
        return set()
    out: Set[str] = set()
    for key, enabled in raw.items():
        if str(key).startswith("_") or enabled is not True:
            continue
        norm = normalize_catalog_id(str(key))
        if norm:
            out.add(norm)
    return out


def is_public_cleared_logo(
    filename: str,
    *,
    catalog_id: Optional[str] = None,
    path: Optional[Path] = None,
) -> bool:
    cleared = load_cleared_catalog_ids(path=path)
    if catalog_id and normalize_catalog_id(catalog_id) in cleared:
        return True
    return catalog_id_from_filename(filename) in cleared


def resolve_protected_logo(
    league: str,
    filename: str,
    *,
    root: Optional[Path] = None,
) -> Optional[Path]:
    """Return an existing file under the logos root, or None. Rejects traversal."""
    league_key = (league or "").strip().lower()
    name = (filename or "").strip()
    if league_key not in ALLOWED_LEAGUES:
        return None
    if not _FILENAME_RE.fullmatch(name):
        return None

    base = (root or TEAM_LOGOS_DIR).resolve()
    candidate = (base / league_key / name).resolve()
    try:
        candidate.relative_to(base)
    except ValueError:
        return None
    if not candidate.is_file():
        return None
    return candidate


def media_type_for(path: Path) -> str:
    return MIME_BY_EXT.get(path.suffix.lower(), "application/octet-stream")
