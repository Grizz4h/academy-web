"""Per-user watched catalog games — sessions + manual calendar check-off.

Ownership is always AuthContext.rinq_user_id. Manual flags live in
data/academy/watched_games/{uuid}.json; session-derived ids are computed live.
"""

from __future__ import annotations

import os
import re
from datetime import datetime, timezone
from typing import Any, Dict, Iterable, List, Optional, Set

from identity.context import AuthContext
from repositories.json_io import FileLock, atomic_write_json, read_json

from del_data.game_store import is_dummy_game

_MAX_GAME_ID_LEN = 200
_TEAM_FOLD = re.compile(r"[^a-z0-9]+")


def watched_games_path(watched_dir: str, rinq_user_id: str) -> str:
    return os.path.join(watched_dir, f"{rinq_user_id}.json")


def empty_doc() -> Dict[str, Any]:
    return {"manual_ids": [], "ignored_ids": [], "updated_at": None}


def normalize_game_id(raw: Any) -> str:
    value = str(raw or "").strip()
    if not value or len(value) > _MAX_GAME_ID_LEN:
        raise ValueError("invalid_game_id")
    if value.startswith("dev:"):
        raise ValueError("invalid_game_id")
    if "/" in value or "\\" in value or ".." in value:
        raise ValueError("invalid_game_id")
    return value


def _unique(ids: Iterable[str]) -> List[str]:
    out: List[str] = []
    seen: Set[str] = set()
    for item in ids:
        if not item or item in seen:
            continue
        seen.add(item)
        out.append(item)
    out.sort()
    return out


def _fold_team(value: Any) -> str:
    return _TEAM_FOLD.sub("", str(value or "").casefold())


def _normalize_date(raw: Any) -> str:
    """Catalog dates are YYYY-MM-DD; older sessions often store full ISO timestamps."""
    value = str(raw or "").strip()
    if not value:
        return ""
    if "T" in value:
        value = value.split("T", 1)[0]
    if len(value) >= 10 and value[4] == "-" and value[7] == "-":
        return value[:10]
    return value


def _session_is_dummy(session: Dict[str, Any]) -> bool:
    if session.get("is_dummy") is True or session.get("isDummy") is True:
        return True
    info = session.get("game_info")
    if isinstance(info, dict) and (info.get("is_dummy") is True or info.get("isDummy") is True):
        return True
    return False


def _session_has_observation(session: Dict[str, Any]) -> bool:
    """True if the session actually observed a team / period — not just empty setup."""
    info = session.get("game_info") if isinstance(session.get("game_info"), dict) else {}
    for key in ("observed_team", "observed_team_id", "observed_team_name"):
        if str(session.get(key) or "").strip() or str(info.get(key) or "").strip():
            return True
    checkins = session.get("checkins")
    if isinstance(checkins, list) and len(checkins) > 0:
        return True
    scope = str(session.get("observation_scope") or "").strip().upper()
    if scope in {"P1", "P2", "P3", "FULL", "BOTH"}:
        return True
    return False


def direct_session_game_id(session: Dict[str, Any]) -> Optional[str]:
    if not isinstance(session, dict) or _session_is_dummy(session):
        return None
    if not _session_has_observation(session):
        return None
    info = session.get("game_info") if isinstance(session.get("game_info"), dict) else {}
    raw = session.get("game_id") or info.get("game_id")
    try:
        return normalize_game_id(raw)
    except ValueError:
        return None


def _load_catalog_games(games_dir: str) -> List[Dict[str, Any]]:
    if not games_dir or not os.path.isdir(games_dir):
        return []
    games: List[Dict[str, Any]] = []
    for name in os.listdir(games_dir):
        if not name.endswith(".json") or name.startswith("."):
            continue
        path = os.path.join(games_dir, name)
        try:
            data = read_json(path, default={})
        except Exception:
            continue
        if not isinstance(data, dict):
            continue
        for game in data.get("games") or []:
            if isinstance(game, dict) and not is_dummy_game(game):
                games.append(game)
    return games


def _game_matches_pairing(game: Dict[str, Any], info: Dict[str, Any]) -> bool:
    date = _normalize_date(info.get("date"))
    game_date = _normalize_date(game.get("date"))
    if not date or not game_date or date != game_date:
        return False

    # Optional league hint when present (avoids DEL vs U20 name collisions).
    session_league = str(info.get("league") or info.get("league_id") or "").strip().upper().replace(" ", "_")
    game_league = str(game.get("league_id") or game.get("league") or "").strip().upper().replace(" ", "_")
    if session_league and game_league:
        from league_identity import leagues_equivalent

        if not leagues_equivalent(session_league, game_league):
            return False

    home_id = str(info.get("home_team_id") or "").strip()
    away_id = str(info.get("away_team_id") or "").strip()
    game_home = str(game.get("home_team_id") or "").strip()
    game_away = str(game.get("away_team_id") or "").strip()
    if home_id and away_id and game_home and game_away:
        if home_id == game_home and away_id == game_away:
            return True
        if home_id == game_away and away_id == game_home:
            return True

    home_name = _fold_team(info.get("team_home") or info.get("home_team_name"))
    away_name = _fold_team(info.get("team_away") or info.get("away_team_name"))
    game_home_name = _fold_team(game.get("home_team_name") or game.get("home_team_id"))
    game_away_name = _fold_team(game.get("away_team_name") or game.get("away_team_id"))
    if home_name and away_name and game_home_name and game_away_name:
        if home_name == game_home_name and away_name == game_away_name:
            return True
        if home_name == game_away_name and away_name == game_home_name:
            return True
    return False


def resolve_session_game_id(session: Dict[str, Any], catalog: List[Dict[str, Any]]) -> Optional[str]:
    direct = direct_session_game_id(session)
    if direct:
        return direct
    if not isinstance(session, dict) or _session_is_dummy(session):
        return None
    if not _session_has_observation(session):
        return None
    info = session.get("game_info")
    if not isinstance(info, dict):
        return None
    matches = [game for game in catalog if _game_matches_pairing(game, info)]
    if len(matches) != 1:
        return None
    try:
        return normalize_game_id(matches[0].get("id"))
    except ValueError:
        return None


def session_game_ids(sessions: Iterable[Dict[str, Any]], games_dir: str) -> List[str]:
    catalog = _load_catalog_games(games_dir)
    ids: List[str] = []
    for session in sessions:
        if not isinstance(session, dict):
            continue
        found = resolve_session_game_id(session, catalog)
        if found:
            ids.append(found)
    return _unique(ids)


def load_doc(watched_dir: str, rinq_user_id: str) -> Dict[str, Any]:
    path = watched_games_path(watched_dir, rinq_user_id)
    if not os.path.isfile(path):
        return empty_doc()
    try:
        data = read_json(path)
    except Exception:
        return empty_doc()
    if not isinstance(data, dict):
        return empty_doc()
    manual: List[str] = []
    ignored: List[str] = []
    for raw in data.get("manual_ids") or []:
        try:
            manual.append(normalize_game_id(raw))
        except ValueError:
            continue
    for raw in data.get("ignored_ids") or []:
        try:
            ignored.append(normalize_game_id(raw))
        except ValueError:
            continue
    return {
        "manual_ids": _unique(manual),
        "ignored_ids": _unique(ignored),
        "updated_at": data.get("updated_at"),
    }


def save_doc(watched_dir: str, rinq_user_id: str, doc: Dict[str, Any]) -> Dict[str, Any]:
    path = watched_games_path(watched_dir, rinq_user_id)
    payload = {
        "manual_ids": _unique(doc.get("manual_ids") or []),
        "ignored_ids": _unique(doc.get("ignored_ids") or []),
        "updated_at": datetime.now(timezone.utc).replace(microsecond=0).isoformat(),
    }
    os.makedirs(watched_dir, exist_ok=True)
    lock = FileLock(path + ".lock")
    with lock.exclusive():
        atomic_write_json(path, payload)
    return payload


def build_payload(
    user: AuthContext,
    *,
    sessions: Iterable[Dict[str, Any]],
    games_dir: str,
    watched_dir: str,
) -> Dict[str, Any]:
    doc = load_doc(watched_dir, user.rinq_user_id)
    from_session = session_game_ids(sessions, games_dir)
    manual = list(doc.get("manual_ids") or [])
    ignored = set(doc.get("ignored_ids") or [])
    effective = [game_id for game_id in _unique([*from_session, *manual]) if game_id not in ignored]
    return {
        "game_ids": effective,
        "from_session": from_session,
        "manual": manual,
    }


def toggle_watched(
    user: AuthContext,
    *,
    game_id: str,
    seen: bool,
    sessions: Iterable[Dict[str, Any]],
    games_dir: str,
    watched_dir: str,
) -> Dict[str, Any]:
    normalized = normalize_game_id(game_id)
    doc = load_doc(watched_dir, user.rinq_user_id)
    manual = set(doc.get("manual_ids") or [])
    ignored = set(doc.get("ignored_ids") or [])
    if seen:
        manual.add(normalized)
        ignored.discard(normalized)
    else:
        manual.discard(normalized)
        ignored.add(normalized)
    save_doc(
        watched_dir,
        user.rinq_user_id,
        {"manual_ids": sorted(manual), "ignored_ids": sorted(ignored)},
    )
    return build_payload(user, sessions=sessions, games_dir=games_dir, watched_dir=watched_dir)
