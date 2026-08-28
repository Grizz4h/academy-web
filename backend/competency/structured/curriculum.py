"""Load drill definitions from frozen curriculum JSON."""

from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path
from typing import Any, Dict, Optional, Tuple


def _curriculum_path() -> Path:
    return Path(__file__).resolve().parents[3] / "data/academy/curriculum.json"


@lru_cache(maxsize=1)
def _curriculum_index() -> Dict[str, Dict[str, Any]]:
    document = json.loads(_curriculum_path().read_text(encoding="utf-8"))
    index: Dict[str, Dict[str, Any]] = {}
    for track in document.get("tracks", []):
        for module in track.get("modules", []):
            for drill in module.get("drills", []):
                drill_id = str(drill.get("id") or "").strip()
                if drill_id:
                    index[drill_id] = drill
    return index


def load_curriculum_drill(drill_id: str) -> Optional[Dict[str, Any]]:
    return _curriculum_index().get(str(drill_id).strip())


def resolve_session_drill(session: Dict[str, Any]) -> Optional[Tuple[str, Dict[str, Any]]]:
    drills = session.get("drills") or []
    drill_id = str(session.get("drill_id") or "").strip()
    if drill_id:
        for drill in drills:
            if str(drill.get("id") or "") == drill_id:
                return drill_id, drill
        curriculum = load_curriculum_drill(drill_id)
        if curriculum:
            return drill_id, curriculum
    if drills:
        first = drills[0]
        first_id = str(first.get("id") or "").strip()
        if first_id:
            curriculum = load_curriculum_drill(first_id)
            return first_id, curriculum or first
    return None


def merged_drill_config(session_drill: Dict[str, Any]) -> Dict[str, Any]:
    drill_id = str(session_drill.get("id") or "").strip()
    curriculum = load_curriculum_drill(drill_id) if drill_id else None
    session_cfg = session_drill.get("config") if isinstance(session_drill.get("config"), dict) else {}
    curriculum_cfg = curriculum.get("config") if curriculum and isinstance(curriculum.get("config"), dict) else {}
    return {**curriculum_cfg, **session_cfg}


def clear_curriculum_cache() -> None:
    _curriculum_index.cache_clear()
