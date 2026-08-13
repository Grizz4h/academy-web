"""Game catalog storage — league + season indexed JSON files."""

from __future__ import annotations

import json
import os
import re
from datetime import datetime
from typing import Any, Dict, List, Optional

from .season_utils import season_to_display, season_to_file_key, game_date_in_season


def games_catalog_path(games_dir: str, league: str, season: str) -> str:
    league_key = (league or "del").strip().lower()
    season_key = season_to_file_key(season)
    return os.path.join(games_dir, f"{league_key}_{season_key}.json")


def load_games_catalog(games_dir: str, league: str, season: str) -> Dict[str, Any]:
    path = games_catalog_path(games_dir, league, season)
    if not os.path.exists(path):
        return {
            "league": league.upper(),
            "season": season_to_file_key(season),
            "season_label": season_to_display(season),
            "games": [],
        }
    with open(path, "r", encoding="utf-8") as handle:
        data = json.load(handle)
    data.setdefault("games", [])
    return data


def save_games_catalog(games_dir: str, catalog: Dict[str, Any]) -> None:
    league = (catalog.get("league") or "DEL").strip()
    season = catalog.get("season") or catalog.get("season_label") or ""
    path = games_catalog_path(games_dir, league, season)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as handle:
        json.dump(catalog, handle, indent=2, ensure_ascii=False)


def build_game_id(league: str, season: str, external_id: str) -> str:
    league_key = (league or "del").strip().lower()
    season_key = season_to_file_key(season)
    safe_external = re.sub(r"[^a-zA-Z0-9_-]+", "-", external_id).strip("-")
    return f"{league_key}:{season_key}:{safe_external}"


def is_dummy_game(game: Dict[str, Any]) -> bool:
    if not isinstance(game, dict):
        return False
    if game.get("isDummy") is True or game.get("is_dummy") is True:
        return True
    source = game.get("source") or {}
    if isinstance(source, dict) and source.get("provider") == "dev_fixture":
        return True
    game_id = str(game.get("id") or "")
    return game_id.startswith("dev:")


def upsert_games(
    games_dir: str,
    *,
    league: str,
    season: str,
    games: List[Dict[str, Any]],
) -> Dict[str, Any]:
    catalog = load_games_catalog(games_dir, league, season)
    catalog["league"] = league.upper()
    catalog["season"] = season_to_file_key(season)
    catalog["season_label"] = season_to_display(season)
    catalog["updated_at"] = datetime.utcnow().isoformat() + "Z"

    existing_by_id = {
        game.get("id"): game
        for game in catalog.get("games") or []
        if game.get("id") and not is_dummy_game(game)
    }
    created = 0
    updated = 0

    for game in games:
        if is_dummy_game(game):
            continue
        game_id = game.get("id")
        if not game_id:
            continue
        if game_id in existing_by_id:
            merged = {**existing_by_id[game_id], **game}
            existing_by_id[game_id] = merged
            updated += 1
        else:
            existing_by_id[game_id] = game
            created += 1

    catalog["games"] = sorted(
        [
            game
            for game in existing_by_id.values()
            if not is_dummy_game(game) and game_date_in_season(game.get("date"), season)
        ],
        key=lambda item: (item.get("date") or "", item.get("matchday") or 0),
    )
    save_games_catalog(games_dir, catalog)
    return {"created": created, "updated": updated, "total": len(catalog["games"])}


def list_games(
    games_dir: str,
    *,
    league: str,
    season: str,
    team_id: Optional[str] = None,
    phase_id: Optional[str] = None,
    status: Optional[str] = None,
) -> List[Dict[str, Any]]:
    catalog = load_games_catalog(games_dir, league, season)
    games = catalog.get("games") or []
    season_key = season_to_file_key(season)
    filtered = []
    for game in games:
        if is_dummy_game(game):
            continue
        if not game_date_in_season(game.get("date"), season_key):
            continue
        if team_id and game.get("home_team_id") != team_id and game.get("away_team_id") != team_id:
            continue
        if phase_id and game.get("phase_id") != phase_id:
            continue
        if status and game.get("status") != status:
            continue
        filtered.append(game)
    return filtered


def get_game(games_dir: str, game_id: str) -> Optional[Dict[str, Any]]:
    if not game_id or ":" not in game_id:
        return None
    parts = game_id.split(":", 2)
    if len(parts) < 3:
        return None
    league, season_key = parts[0], parts[1]
    catalog = load_games_catalog(games_dir, league.upper(), season_key)
    for game in catalog.get("games") or []:
        if game.get("id") == game_id:
            if is_dummy_game(game) or game_id.startswith("dev:"):
                return None
            return game
    return None


def games_status_summary(games_dir: str, league: str, season: str) -> Dict[str, Any]:
    catalog = load_games_catalog(games_dir, league, season)
    games = catalog.get("games") or []
    by_status: Dict[str, int] = {}
    with_stats = 0
    final_without_stats = 0
    for game in games:
        status = game.get("status") or "unknown"
        by_status[status] = by_status.get(status, 0) + 1
        if (game.get("stats") or {}).get("imported_at"):
            with_stats += 1
        elif status == "final" or game.get("score"):
            final_without_stats += 1
    return {
        "league": catalog.get("league"),
        "season": catalog.get("season_label") or season_to_display(catalog.get("season") or season),
        "total": len(games),
        "by_status": by_status,
        "with_stats": with_stats,
        "final_without_stats": final_without_stats,
        "updated_at": catalog.get("updated_at"),
    }


def update_game_stats(games_dir: str, game_id: str, stats: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    if not game_id or ":" not in game_id:
        return None
    parts = game_id.split(":", 2)
    if len(parts) < 3:
        return None
    league, season_key = parts[0], parts[1]
    catalog = load_games_catalog(games_dir, league.upper(), season_key)
    games = catalog.get("games") or []
    updated_game: Optional[Dict[str, Any]] = None

    for index, game in enumerate(games):
        if game.get("id") != game_id:
            continue
        merged_stats = {**(game.get("stats") or {}), **stats}
        updated_game = {**game, "stats": merged_stats}
        games[index] = updated_game
        break

    if not updated_game:
        return None

    catalog["games"] = games
    catalog["updated_at"] = datetime.utcnow().isoformat() + "Z"
    save_games_catalog(games_dir, catalog)
    return updated_game
