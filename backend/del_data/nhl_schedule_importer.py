"""NHL schedule importer — official api-web.nhle.com JSON feeds."""

from __future__ import annotations

import json
import os
import re
from collections import defaultdict
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple
from urllib.request import Request, urlopen

from .game_store import build_game_id, load_games_catalog, save_games_catalog
from .schedule_time import utc_instant_to_app_local
from .season_utils import season_to_display, season_to_file_key
from .team_mapping import TeamCatalogMapper

_API = "https://api-web.nhle.com/v1"
_USER_AGENT = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
)

# NHL gameType: 1=preseason, 2=regular, 3=playoffs, 4=all-star, 6/9/etc specials
_GAME_TYPE_REGULAR = 2
_GAME_TYPE_PLAYOFF = 3

_PLAYOFF_ROUND_MAP = {
    1: ("round_1", "Round 1"),
    2: ("round_2", "Round 2"),
    3: ("conference_final", "Conference Final"),
    4: ("stanley_cup_final", "Stanley Cup Final"),
}

_ABBREV_TO_ID = {
    "ANA": "anaheim_ducks",
    "BOS": "boston_bruins",
    "BUF": "buffalo_sabres",
    "CAR": "carolina_hurricanes",
    "CBJ": "columbus_blue_jackets",
    "CGY": "calgary_flames",
    "CHI": "chicago_blackhawks",
    "COL": "colorado_avalanche",
    "DAL": "dallas_stars",
    "DET": "detroit_red_wings",
    "EDM": "edmonton_oilers",
    "FLA": "florida_panthers",
    "LAK": "los_angeles_kings",
    "MIN": "minnesota_wild",
    "MTL": "montreal_canadiens",
    "NJD": "new_jersey_devils",
    "NSH": "nashville_predators",
    "NYI": "new_york_islanders",
    "NYR": "new_york_rangers",
    "OTT": "ottawa_senators",
    "PHI": "philadelphia_flyers",
    "PIT": "pittsburgh_penguins",
    "SEA": "seattle_kraken",
    "SJS": "san_jose_sharks",
    "STL": "st_louis_blues",
    "TBL": "tampa_bay_lightning",
    "TOR": "toronto_maple_leafs",
    "UTA": "utah_mammoth",
    "VAN": "vancouver_canucks",
    "VGK": "vegas_golden_knights",
    "WPG": "winnipeg_jets",
    "WSH": "washington_capitals",
}


def _fetch_json(url: str) -> Optional[Dict[str, Any]]:
    try:
        request = Request(url, headers={"User-Agent": _USER_AGENT})
        with urlopen(request, timeout=30) as response:
            return json.loads(response.read().decode("utf-8", errors="ignore"))
    except Exception as exc:
        print(f"[NHLScheduleImporter] fetch failed {url}: {exc}")
        return None


def _normalize_name(value: str) -> str:
    text = (value or "").strip().lower()
    text = (
        text.replace("ä", "a")
        .replace("ö", "o")
        .replace("ü", "u")
        .replace("é", "e")
        .replace("è", "e")
        .replace("ê", "e")
        .replace("á", "a")
        .replace("à", "a")
        .replace("ç", "c")
        .replace("ñ", "n")
        .replace("st.", "st")
        .replace("saint ", "st ")
    )
    return re.sub(r"[^a-z0-9]+", " ", text).strip()


def slug_to_catalog_id(name: str) -> str:
    return _normalize_name(name).replace(" ", "_")


def season_to_nhl_id(season: str) -> str:
    display = season_to_display(season)
    if "/" in display:
        start, end = display.split("/", 1)
        if len(end) == 2:
            end = f"{start[:2]}{end}"
        return f"{start}{end}"
    key = season_to_file_key(season)
    parts = key.split("_")
    if len(parts) == 2:
        return f"{parts[0]}{parts[1]}"
    return key.replace("_", "")


def build_nhl_team_mapper(teams_json_path: str) -> TeamCatalogMapper:
    mapper = TeamCatalogMapper(teams_json_path)
    for abbrev, catalog_id in _ABBREV_TO_ID.items():
        mapper.register_slug(abbrev.lower(), catalog_id)
        mapper.register_name(abbrev, catalog_id)
    aliases = {
        "montreal canadiens": "montreal_canadiens",
        "st louis blues": "st_louis_blues",
        "utah hockey club": "utah_mammoth",
        "utah mammoth": "utah_mammoth",
        "arizona coyotes": "utah_mammoth",
        "vegas golden knights": "vegas_golden_knights",
        "tampa bay lightning": "tampa_bay_lightning",
        "new jersey devils": "new_jersey_devils",
        "new york islanders": "new_york_islanders",
        "new york rangers": "new_york_rangers",
        "los angeles kings": "los_angeles_kings",
        "san jose sharks": "san_jose_sharks",
        "columbus blue jackets": "columbus_blue_jackets",
    }
    for alias, catalog_id in aliases.items():
        mapper.register_name(alias, catalog_id)
    return mapper


def _localized(value: Any) -> str:
    if isinstance(value, dict):
        return str(value.get("default") or value.get("en") or next(iter(value.values()), "") or "").strip()
    return str(value or "").strip()


def _team_full_name(team: Dict[str, Any]) -> str:
    place = _localized(team.get("placeName") or team.get("placeNameWithPreposition"))
    common = _localized(team.get("commonName"))
    if place and common:
        # Avoid "Vegas Golden Knights" becoming "Vegas Golden Knights Knights"
        if common.lower().startswith(place.lower()):
            return common
        return f"{place} {common}".strip()
    return common or place or _localized(team.get("name")) or team.get("abbrev") or ""


def _resolve_team_id(team: Dict[str, Any], mapper: TeamCatalogMapper) -> Tuple[str, str]:
    abbrev = str(team.get("abbrev") or "").strip().upper()
    name = _team_full_name(team)
    catalog_id = (
        _ABBREV_TO_ID.get(abbrev)
        or mapper.resolve(slug=abbrev.lower(), name=name)
        or slug_to_catalog_id(name)
    )
    return catalog_id, name


def _parse_phase(game: Dict[str, Any]) -> Tuple[str, str, Optional[int]]:
    game_type = int(game.get("gameType") or 0)
    if game_type == _GAME_TYPE_REGULAR:
        return "hauptrunde", "Regular Season", None
    if game_type == _GAME_TYPE_PLAYOFF:
        series = game.get("seriesStatus") or {}
        round_no = int(series.get("round") or 0)
        phase_id, phase_label = _PLAYOFF_ROUND_MAP.get(round_no, ("round_1", series.get("seriesTitle") or "Playoffs"))
        series_game = series.get("gameNumberOfSeries") or game.get("seriesGameNumber")
        try:
            matchday = int(series_game) if series_game is not None else None
        except (TypeError, ValueError):
            matchday = None
        return phase_id, phase_label, matchday
    return "special", f"Game Type {game_type}", None


def _parse_status(game: Dict[str, Any]) -> Tuple[str, Optional[Dict[str, int]]]:
    state = str(game.get("gameState") or "").upper()
    home = game.get("homeTeam") or {}
    away = game.get("awayTeam") or {}
    score = None
    if home.get("score") is not None and away.get("score") is not None:
        score = {"home": int(home["score"]), "away": int(away["score"])}
    if state in {"OFF", "FINAL"}:
        return "final", score
    if state in {"LIVE", "CRIT"}:
        return "live", score
    # FUTURE / PRED / etc.
    return "scheduled", None


def parse_nhl_game(
    game: Dict[str, Any],
    *,
    league: str,
    season: str,
    team_mapper: TeamCatalogMapper,
    home_game_number: Optional[int] = None,
) -> Optional[Dict[str, Any]]:
    game_type = int(game.get("gameType") or 0)
    if game_type not in {_GAME_TYPE_REGULAR, _GAME_TYPE_PLAYOFF}:
        return None

    home_team = game.get("homeTeam") or {}
    away_team = game.get("awayTeam") or {}
    home_id, home_name = _resolve_team_id(home_team, team_mapper)
    away_id, away_name = _resolve_team_id(away_team, team_mapper)
    if not home_id or not away_id:
        return None

    phase_id, phase_label, matchday = _parse_phase(game)
    if phase_id in {"hauptrunde", "regular_season"}:
        matchday = home_game_number

    start = game.get("startTimeUTC") or ""
    feed_date = game.get("gameDate") or None
    if feed_date and "T" in str(feed_date):
        feed_date = str(feed_date)[:10]
    date_iso, time_value = utc_instant_to_app_local(start, fallback_date=str(feed_date) if feed_date else None)
    if not date_iso:
        date_iso = str(feed_date) if feed_date else None
    if date_iso and "T" in str(date_iso):
        date_iso = str(date_iso)[:10]

    status, score = _parse_status(game)
    external_id = str(game.get("id") or "")
    if not external_id:
        return None

    return {
        "id": build_game_id(league, season, external_id),
        "league_id": league.upper(),
        "season_id": season_to_display(season),
        "phase_id": phase_id,
        "phase_label": phase_label,
        "matchday": matchday,
        "date": date_iso,
        "time": time_value,
        "home_team_id": home_id,
        "away_team_id": away_id,
        "home_team_name": home_name,
        "away_team_name": away_name,
        "status": status,
        "score": score,
        "source": {
            "provider": "nhl",
            "external_id": external_id,
            "game_type": game_type,
            "imported_at": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        },
    }


def _season_bounds(season_nhl_id: str) -> Tuple[str, str]:
    """Return approximate walk start/end dates for a season id like 20252026."""
    start_year = int(season_nhl_id[:4])
    # Preseason can start late Sep; playoffs end mid-June.
    return f"{start_year}-09-15", f"{start_year + 1}-06-30"


def collect_season_games(season_nhl_id: str) -> List[Dict[str, Any]]:
    start, end = _season_bounds(season_nhl_id)
    date = start
    # Prefer official regular-season start if available.
    probe = _fetch_json(f"{_API}/schedule/{start}")
    if probe and probe.get("regularSeasonStartDate"):
        date = probe["regularSeasonStartDate"]
    seen: set[int] = set()
    games: List[Dict[str, Any]] = []
    guard = 0
    while date and date <= end and guard < 60:
        guard += 1
        payload = _fetch_json(f"{_API}/schedule/{date}")
        if not payload:
            break
        for day in payload.get("gameWeek") or []:
            for game in day.get("games") or []:
                if int(game.get("season") or 0) not in {0, int(season_nhl_id)}:
                    # Keep games that omit season or match target.
                    if game.get("season") and int(game["season"]) != int(season_nhl_id):
                        continue
                gid = game.get("id")
                if not gid or gid in seen:
                    continue
                seen.add(gid)
                games.append(game)
        nxt = payload.get("nextStartDate")
        if not nxt or nxt <= date:
            break
        if payload.get("playoffEndDate") and nxt > payload["playoffEndDate"] and nxt > end:
            break
        date = nxt
    return games


def teams_from_standings_or_games(games: List[Dict[str, Any]]) -> List[Dict[str, str]]:
    """Build club roster for a season — NHL franchises only (skip national-team specials)."""
    by_id: Dict[str, Dict[str, str]] = {}
    standings = _fetch_json(f"{_API}/standings/now")
    for row in (standings or {}).get("standings") or []:
        abbrev = _localized(row.get("teamAbbrev")).upper()
        catalog_id = _ABBREV_TO_ID.get(abbrev)
        if not catalog_id:
            continue
        name = _localized(row.get("teamName"))
        by_id[catalog_id] = {
            "id": catalog_id,
            "name": name or catalog_id,
            "short": abbrev,
            **({"division": _localized(row.get("divisionName"))} if row.get("divisionName") else {}),
        }
    # Ensure schedule-only clubs (edge cases) are present; ignore national teams / specials.
    for game in games:
        if int(game.get("gameType") or 0) not in {_GAME_TYPE_REGULAR, _GAME_TYPE_PLAYOFF}:
            continue
        for side in ("homeTeam", "awayTeam"):
            team = game.get(side) or {}
            abbrev = str(team.get("abbrev") or "").upper()
            catalog_id = _ABBREV_TO_ID.get(abbrev)
            if not catalog_id or catalog_id in by_id:
                continue
            name = _team_full_name(team)
            by_id[catalog_id] = {
                "id": catalog_id,
                "name": name or catalog_id,
                "short": abbrev,
            }
    return sorted(by_id.values(), key=lambda item: item["name"].lower())


class NhlScheduleImporter:
    def __init__(self, team_mapper: TeamCatalogMapper):
        self.team_mapper = team_mapper

    def import_season(self, season: str, *, league: str = "NHL") -> Dict[str, Any]:
        display = season_to_display(season)
        season_nhl_id = season_to_nhl_id(display)
        errors: List[str] = []
        raw_games = collect_season_games(season_nhl_id)
        if not raw_games:
            errors.append(f"Keine NHL-Spiele für {display} ({season_nhl_id})")

        # Assign regular-season game numbers from chronological order per team.
        rs_games = sorted(
            [g for g in raw_games if int(g.get("gameType") or 0) == _GAME_TYPE_REGULAR],
            key=lambda item: (item.get("startTimeUTC") or item.get("gameDate") or "", item.get("id") or 0),
        )
        team_counts: Dict[str, int] = defaultdict(int)
        home_game_number: Dict[Any, int] = {}
        for game in rs_games:
            home_abbr = str((game.get("homeTeam") or {}).get("abbrev") or "").upper()
            away_abbr = str((game.get("awayTeam") or {}).get("abbrev") or "").upper()
            if home_abbr:
                team_counts[home_abbr] += 1
            if away_abbr:
                team_counts[away_abbr] += 1
            home_game_number[game.get("id")] = team_counts[home_abbr] if home_abbr else None

        parsed: List[Dict[str, Any]] = []
        seen: set[str] = set()
        for game in raw_games:
            row = parse_nhl_game(
                game,
                league=league,
                season=display,
                team_mapper=self.team_mapper,
                home_game_number=home_game_number.get(game.get("id")),
            )
            if not row or row["id"] in seen:
                continue
            seen.add(row["id"])
            parsed.append(row)

        parsed.sort(key=lambda item: (item.get("date") or "", item.get("matchday") or 0, item.get("id") or ""))
        return {
            "season": season,
            "league": league,
            "games": parsed,
            "imported_count": len(parsed),
            "season_nhl_id": season_nhl_id,
            "import_source": "nhl_api_web",
            "errors": errors,
            "teams": teams_from_standings_or_games(raw_games),
        }


def _repo_paths() -> Tuple[str, str]:
    root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
    return os.path.join(root, "data", "academy"), os.path.join(root, "data", "games")


def sync_nhl_team_catalog(data_dir: str, seasons: Dict[str, List[Dict[str, str]]]) -> str:
    path = os.path.join(data_dir, "teams_nhl.json")
    existing: Dict[str, Any] = {}
    if os.path.exists(path):
        with open(path, "r", encoding="utf-8") as handle:
            existing = json.load(handle)
    catalog = {
        "league": "NHL",
        "default_season": existing.get("default_season") or "2025/26",
        "seasons": {
            **(existing.get("seasons") or {}),
            **seasons,
        },
    }
    # Drop obsolete Arizona from modern seasons if Utah is present.
    for season_key, teams in list(catalog["seasons"].items()):
        ids = {t.get("id") for t in teams}
        if "utah_mammoth" in ids:
            catalog["seasons"][season_key] = [t for t in teams if t.get("id") != "arizona_coyotes"]
    with open(path, "w", encoding="utf-8") as handle:
        json.dump(catalog, handle, ensure_ascii=False, indent=2)
        handle.write("\n")
    frontend_path = os.path.abspath(os.path.join(data_dir, "..", "..", "frontend", "src", "data", "teams_nhl.json"))
    with open(frontend_path, "w", encoding="utf-8") as handle:
        json.dump(catalog, handle, ensure_ascii=False, indent=2)
        handle.write("\n")
    return path


if __name__ == "__main__":
    import sys

    data_dir, games_dir = _repo_paths()
    seasons = sys.argv[1:] or ["2025/26", "2026/27"]
    mapper = build_nhl_team_mapper(os.path.join(data_dir, "teams_nhl.json"))
    importer = NhlScheduleImporter(mapper)
    season_teams: Dict[str, List[Dict[str, str]]] = {}
    for season in seasons:
        result = importer.import_season(season, league="NHL")
        print(
            f"{season}: {result['imported_count']} games "
            f"(nhl_id={result.get('season_nhl_id')}, errors={result.get('errors')})"
        )
        if result.get("teams"):
            season_teams[season_to_display(season)] = result["teams"]
        if result.get("games"):
            catalog = load_games_catalog(games_dir, "NHL", season)
            catalog["league"] = "NHL"
            catalog["season"] = season_to_file_key(season)
            catalog["season_label"] = season_to_display(season)
            catalog["updated_at"] = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
            catalog["games"] = result["games"]
            save_games_catalog(games_dir, catalog)
            print(f"  wrote {len(result['games'])} games (full replace)")
    if season_teams:
        print("teams catalog:", sync_nhl_team_catalog(data_dir, season_teams))
