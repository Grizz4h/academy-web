"""Season-aware roster catalog storage — one canonical snapshot per team + season."""

from __future__ import annotations

import json
import os
from datetime import datetime
from typing import Any, Dict, List, Optional, Optional

from .roster_quality import assess_roster_quality
from .season_utils import season_to_display, season_to_file_key


def roster_catalog_path(rosters_dir: str, league: str, season: str) -> str:
    league_key = (league or "del").strip().lower()
    season_key = season_to_file_key(season)
    return os.path.join(rosters_dir, f"{league_key}_{season_key}.json")


def load_roster_catalog(rosters_dir: str, league: str, season: str) -> Dict[str, Any]:
    path = roster_catalog_path(rosters_dir, league, season)
    if not os.path.exists(path):
        return {
            "league": league.upper(),
            "season": season_to_file_key(season),
            "season_label": season_to_display(season),
            "teams": [],
        }
    with open(path, "r", encoding="utf-8") as handle:
        data = json.load(handle)
    data.setdefault("teams", [])
    return data


def save_roster_catalog(rosters_dir: str, catalog: Dict[str, Any]) -> None:
    league = (catalog.get("league") or "DEL").strip()
    season = catalog.get("season") or catalog.get("season_label") or ""
    path = roster_catalog_path(rosters_dir, league, season)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as handle:
        json.dump(catalog, handle, indent=2, ensure_ascii=False)


def _player_to_roster_entry(player: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "player_id": player.get("player_id"),
        "name": player.get("player_name") or player.get("name"),
        "number": player.get("jersey_number") or player.get("number"),
        "position": player.get("position") or "",
        "position_group": player.get("position_group"),
    }


def get_team_roster_snapshot(
    rosters_dir: str,
    league: str,
    season: str,
    team_id: str,
) -> Optional[Dict[str, Any]]:
    catalog = load_roster_catalog(rosters_dir, league, season)
    for team in catalog.get("teams") or []:
        if team.get("team_id") == team_id:
            return team
    return None


def upsert_team_roster_snapshot(
    rosters_dir: str,
    *,
    league: str,
    season: str,
    team_id: str,
    team_name: str,
    players: List[Dict[str, Any]],
    source: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    catalog = load_roster_catalog(rosters_dir, league, season)
    catalog["league"] = league.upper()
    catalog["season"] = season_to_file_key(season)
    catalog["season_label"] = season_to_display(season)

    active_players = [p for p in players if p.get("active", True)]
    quality, warnings = assess_roster_quality(active_players)
    roster_players = [_player_to_roster_entry(p) for p in active_players]
    roster_players.sort(key=lambda item: item.get("number") or 999)

    snapshot_meta = {
        "imported_at": datetime.utcnow().isoformat() + "Z",
        "source": source or {"provider": "manual"},
        "quality": quality,
        "warnings": warnings,
        "active_count": len(roster_players),
        "status": "active",
    }

    teams: List[Dict[str, Any]] = catalog.get("teams") or []
    updated_team = {
        "team_id": team_id,
        "name": team_name,
        "players": roster_players,
        "snapshot": snapshot_meta,
    }

    replaced = False
    for index, team in enumerate(teams):
        if team.get("team_id") == team_id:
            teams[index] = updated_team
            replaced = True
            break
    if not replaced:
        teams.append(updated_team)

    teams.sort(key=lambda item: item.get("name") or item.get("team_id") or "")
    catalog["teams"] = teams
    save_roster_catalog(rosters_dir, catalog)
    return updated_team


def migrate_legacy_team_players_to_season(
    rosters_dir: str,
    players_dir: str,
    *,
    league: str,
    season: str,
    team_mapper,
    import_config_path: Optional[str] = None,
) -> Dict[str, Any]:
    """One-time migration: copy current kader files into season roster catalog."""
    migrated = []
    importer_to_catalog: Dict[str, str] = {}
    if import_config_path and os.path.exists(import_config_path):
        try:
            with open(import_config_path, "r", encoding="utf-8") as handle:
                raw = json.load(handle)
            for item in raw if isinstance(raw, list) else []:
                slug = (item.get("slug") or "").strip().lower()
                catalog_id = (item.get("catalog_id") or "").strip()
                if slug and catalog_id:
                    importer_to_catalog[slug.replace("-", "_")] = catalog_id
        except Exception:
            pass

    if not os.path.isdir(players_dir):
        return {"migrated": migrated, "total": 0}

    for file_name in os.listdir(players_dir):
        if not file_name.endswith("_players.json"):
            continue
        team_id = file_name.replace("_players.json", "")
        catalog_id = (
            importer_to_catalog.get(team_id)
            or team_mapper.resolve(team_id=team_id)
            or team_mapper.resolve(slug=team_id.replace("_", "-"))
            or team_id
        )
        path = os.path.join(players_dir, file_name)
        try:
            with open(path, "r", encoding="utf-8") as handle:
                data = json.load(handle)
        except Exception:
            continue
        players = data.get("players") or []
        if not players:
            continue
        team_name = (
            team_mapper.team_name(catalog_id)
            or (players[0].get("team") if players else None)
            or catalog_id
        )
        upsert_team_roster_snapshot(
            rosters_dir,
            league=league,
            season=season,
            team_id=catalog_id,
            team_name=team_name,
            players=players,
            source={
                "provider": "legacy_migration",
                "sourceTeamFile": file_name,
                "importedAt": datetime.utcnow().isoformat() + "Z",
            },
        )
        migrated.append(catalog_id)

    return {"migrated": migrated, "total": len(migrated)}


def roster_status_summary(rosters_dir: str, league: str, season: str) -> Dict[str, Any]:
    catalog = load_roster_catalog(rosters_dir, league, season)
    teams = catalog.get("teams") or []
    warnings_count = sum(1 for team in teams if (team.get("snapshot") or {}).get("quality") != "plausible")
    return {
        "league": catalog.get("league"),
        "season": catalog.get("season_label") or season_to_display(catalog.get("season") or season),
        "teams_total": len(teams),
        "teams_with_roster": len([t for t in teams if t.get("players")]),
        "warnings_count": warnings_count,
        "teams": [
            {
                "team_id": team.get("team_id"),
                "name": team.get("name"),
                "player_count": len(team.get("players") or []),
                "imported_at": (team.get("snapshot") or {}).get("imported_at"),
                "quality": (team.get("snapshot") or {}).get("quality"),
                "warnings": (team.get("snapshot") or {}).get("warnings") or [],
            }
            for team in sorted(teams, key=lambda item: item.get("name") or "")
        ],
    }
