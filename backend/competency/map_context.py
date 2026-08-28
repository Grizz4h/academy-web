"""Frozen evidence map loading for repositories and recompute."""

from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path
from typing import Tuple

from .catalog import EvidenceMapCatalog
from .engine import load_catalog_from_profiles_path
from .validation import evidence_map_sha256, validate_drill_profiles


def default_profiles_path() -> Path:
    return Path(__file__).resolve().parents[2] / "data/academy/competency/drill_profiles.json"


@lru_cache(maxsize=1)
def get_frozen_evidence_map() -> Tuple[EvidenceMapCatalog, str]:
    """Load validated catalog + evidence map hash (process-local cache)."""
    path = default_profiles_path()
    document = json.loads(path.read_text(encoding="utf-8"))
    profiles = validate_drill_profiles(document)
    catalog = load_catalog_from_profiles_path(str(path))
    map_hash = evidence_map_sha256(document.get("profiles", []))
    return catalog, map_hash


def clear_frozen_evidence_map_cache() -> None:
    get_frozen_evidence_map.cache_clear()
