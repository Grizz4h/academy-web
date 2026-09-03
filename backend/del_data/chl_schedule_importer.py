"""Champions Hockey League schedule importer — official chl.hockey JSON feeds."""

from __future__ import annotations

import json
import os
import re
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple
from urllib.request import Request, urlopen

from .game_store import build_game_id
from .schedule_time import utc_instant_to_app_local
from .season_utils import season_to_display
from .team_mapping import TeamCatalogMapper

_BASE = "https://www.chl.hockey"
_USER_AGENT = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
)

_SEASON_FEED_HINTS = {
    "2025/26": "3c5f99fa605394cc65733fc9",
    "2026/27": "fc954f6d33272fdf4a8b95bb",
}

_PHASE_MAP = {
    "round of 16": ("round_of_16", "Round of 16"),
    "quarter-finals": ("quarterfinal", "Viertelfinale"),
    "quarterfinals": ("quarterfinal", "Viertelfinale"),
    "semi-finals": ("semifinal", "Halbfinale"),
    "semifinals": ("semifinal", "Halbfinale"),
    "final": ("final", "Finale"),
}


def _fetch(url: str) -> Optional[bytes]:
    try:
        request = Request(url, headers={"User-Agent": _USER_AGENT})
        with urlopen(request, timeout=30) as response:
            return response.read()
    except Exception as exc:
        print(f"[CHLScheduleImporter] fetch failed {url}: {exc}")
        return None


def _fetch_json(url: str) -> Optional[Dict[str, Any]]:
    raw = _fetch(url)
    if not raw:
        return None
    try:
        return json.loads(raw.decode("utf-8", errors="ignore"))
    except Exception as exc:
        print(f"[CHLScheduleImporter] JSON parse failed {url}: {exc}")
        return None


def _normalize_name(value: str) -> str:
    text = (value or "").strip().lower()
    text = (
        text.replace("ä", "a")
        .replace("ö", "o")
        .replace("ü", "u")
        .replace("ß", "ss")
        .replace("å", "a")
        .replace("é", "e")
        .replace("è", "e")
        .replace("í", "i")
        .replace("ý", "y")
        .replace("ř", "r")
        .replace("š", "s")
        .replace("č", "c")
        .replace("ž", "z")
        .replace("ň", "n")
        .replace("ť", "t")
        .replace("ď", "d")
        .replace("ľ", "l")
        .replace("ô", "o")
    )
    return re.sub(r"[^a-z0-9]+", " ", text).strip()


def slug_to_catalog_id(name: str) -> str:
    return _normalize_name(name).replace(" ", "_")


def build_chl_team_mapper(teams_json_path: str) -> TeamCatalogMapper:
    mapper = TeamCatalogMapper(teams_json_path)
    aliases = {
        "pinguins bremerhaven": "pinguins_bremerhaven",
        "fischtown pinguins": "pinguins_bremerhaven",
        "fischtown pinguins bremerhaven": "pinguins_bremerhaven",
        "lulea hf": "lulea_hockey",
        "lulea hockey": "lulea_hockey",
        "brynas if": "brynas_if",
        "frolunda hc": "frolunda_gothenburg",
        "frolunda gothenburg": "frolunda_gothenburg",
        "zsc lions": "zsc_lions_zurich",
        "bruleurs de loups": "grenoble",
        "bruleurs de loups grenoble": "grenoble",
        "hc bolzano foxes": "hc_bolzano",
        "bili tygri liberec": "bili_tygri_liberec",
        "fribourg gotteron": "fribourg_gotteron",
        "geneve servette": "geneve_servette",
        "geneve servette hc": "geneve_servette",
        "graz 99ers": "graz99ers",
        "graz99ers": "graz99ers",
        "hc skoda plzen": "hc_pilsen",
        "hc plzen": "hc_pilsen",
        "hc pilsen": "hc_pilsen",
        "koo koo kouvola": "kookoo_kouvola",
        "kookoo": "kookoo_kouvola",
        "sai pa lappeenranta": "saipa_lappeenranta",
        "saipa": "saipa_lappeenranta",
        "skelleftea aik": "skelleftea_aik",
        "vaxjo lakers": "vaxjo_lakers",
        "rogle angelholm": "rogle_angelholm",
        "rogle bk": "rogle_angelholm",
    }
    for alias, team_id in aliases.items():
        mapper.register_name(alias, team_id)
    return mapper


def discover_schedule_feeds() -> Dict[str, str]:
    """Map display season → schedule feed filename via /en/schedule page."""
    html_bytes = _fetch(f"{_BASE}/en/schedule")
    if not html_bytes:
        return dict(_SEASON_FEED_HINTS)
    html = html_bytes.decode("utf-8", errors="ignore")
    keys = sorted(set(re.findall(r"schedule-21ec9dad81abe2e0240460d0-[0-9a-f]+\.json", html)))
    found: Dict[str, str] = {}
    for key in keys:
        payload = _fetch_json(f"{_BASE}/api/s3?q={key}")
        games = (payload or {}).get("data") or []
        if not games:
            continue
        years = sorted(
            {
                int((game.get("startDate") or "")[:4])
                for game in games
                if (game.get("startDate") or "")[:4].isdigit()
            }
        )
        if not years:
            continue
        # CHL seasons span Aug(start) → Mar(end); prefer majority year as start.
        start_year = years[0]
        if len(years) >= 2 and years[-1] == years[0] + 1:
            # Count games per year — regular season usually dominates start year.
            counts: Dict[int, int] = {}
            for game in games:
                y = (game.get("startDate") or "")[:4]
                if y.isdigit():
                    counts[int(y)] = counts.get(int(y), 0) + 1
            start_year = max(counts, key=counts.get) if counts else years[0]
            if start_year == years[-1] and years[0] in counts and counts[years[0]] >= counts.get(years[-1], 0):
                start_year = years[0]
        season = f"{start_year}/{str(start_year + 1)[2:]}"
        # Keep the densest feed per season (avoid tiny mid-COVID stubs).
        if season not in found or len(games) > 50:
            found[season] = key
    for season, hint in _SEASON_FEED_HINTS.items():
        found.setdefault(season, f"schedule-21ec9dad81abe2e0240460d0-{hint}.json")
    return found


def _parse_phase(stage: Dict[str, Any]) -> Tuple[str, str, Optional[int]]:
    round_info = stage.get("round") or {}
    group_info = stage.get("group") or {}
    round_name = str(round_info.get("name") or "").strip()
    group_name = str(group_info.get("name") or "").strip()

    game_day = re.match(r"Game Day\s+(\d+)", round_name, re.I)
    if game_day:
        return "hauptrunde", "Regular Season", int(game_day.group(1))

    phase_key = _PHASE_MAP.get(group_name.lower()) or _PHASE_MAP.get(round_name.lower())
    if phase_key:
        phase_id, phase_label = phase_key
        series_game = None
        if re.search(r"first game", round_name, re.I):
            series_game = 1
        elif re.search(r"return game", round_name, re.I):
            series_game = 2
        elif phase_id == "final":
            series_game = 1
        return phase_id, phase_label, series_game

    return "hauptrunde", round_name or group_name or "Regular Season", None


def parse_chl_match(
    match: Dict[str, Any],
    *,
    league: str,
    season: str,
    team_mapper: TeamCatalogMapper,
) -> Optional[Dict[str, Any]]:
    teams = match.get("teams") or {}
    home = teams.get("home") or {}
    away = teams.get("away") or {}
    home_name = (home.get("name") or "").strip()
    away_name = (away.get("name") or "").strip()
    if not home_name or not away_name:
        return None

    home_id = team_mapper.resolve(name=home_name) or slug_to_catalog_id(home_name)
    away_id = team_mapper.resolve(name=away_name) or slug_to_catalog_id(away_name)
    if home_id in {"hc_skoda_plzen", "hc_plzen"}:
        home_id = "hc_pilsen"
    if away_id in {"hc_skoda_plzen", "hc_plzen"}:
        away_id = "hc_pilsen"
    if home_id == "tba" or away_id == "tba" or home_name.upper() == "TBA" or away_name.upper() == "TBA":
        return None

    start = match.get("startDate") or ""
    date_iso, time_value = utc_instant_to_app_local(start)
    if not date_iso and len(start) >= 10:
        date_iso = start[:10]

    phase_id, phase_label, matchday = _parse_phase(match.get("stage") or {})
    results = ((match.get("results") or {}).get("scores") or {})
    raw_status = str(match.get("status") or "").lower()
    score = None
    status = "scheduled"
    if raw_status in {"finished", "played", "final"}:
        if results.get("home") is not None and results.get("away") is not None:
            score = {"home": int(results["home"]), "away": int(results["away"])}
        status = "final"
    elif raw_status in {"live", "inprogress", "in-progress"}:
        status = "live"
        if results.get("home") is not None and results.get("away") is not None:
            score = {"home": int(results["home"]), "away": int(results["away"])}

    external_id = str(match.get("externalId") or match.get("_entityId") or "")
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
            "provider": "chl",
            "external_id": external_id,
            "entity_id": match.get("_entityId"),
            "imported_at": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        },
    }


def teams_from_schedule(games: List[Dict[str, Any]]) -> List[Dict[str, str]]:
    by_id: Dict[str, Dict[str, str]] = {}
    for match in games:
        teams = match.get("teams") or {}
        for side in ("home", "away"):
            team = teams.get(side) or {}
            name = (team.get("name") or "").strip()
            short = (team.get("shortName") or "").strip()
            if not name or short.upper() == "TBA" or name.upper() == "TBA":
                continue
            catalog_id = slug_to_catalog_id(name)
            # Keep known catalog aliases for German DEL overlap names.
            if "bremerhaven" in catalog_id:
                catalog_id = "pinguins_bremerhaven"
            if catalog_id in {"hc_skoda_plzen", "hc_plzen"}:
                catalog_id = "hc_pilsen"
            country = ((team.get("country") or {}).get("code") or "").strip().upper()
            by_id[catalog_id] = {
                "id": catalog_id,
                "name": name,
                "short": short.upper() or catalog_id[:3].upper(),
                **({"country": country} if country else {}),
            }
    return sorted(by_id.values(), key=lambda item: item["name"].lower())


class ChlScheduleImporter:
    def __init__(self, team_mapper: TeamCatalogMapper):
        self.team_mapper = team_mapper

    def import_season(self, season: str, *, league: str = "CHL") -> Dict[str, Any]:
        display = season_to_display(season)
        feeds = discover_schedule_feeds()
        feed = feeds.get(display)
        errors: List[str] = []
        if not feed:
            errors.append(f"Kein CHL-Spielplan-Feed für {display}")
            return {
                "season": season,
                "league": league,
                "games": [],
                "imported_count": 0,
                "import_source": "chl_json",
                "errors": errors,
            }

        payload = _fetch_json(f"{_BASE}/api/s3?q={feed}")
        raw_games = (payload or {}).get("data") or []
        if not raw_games:
            errors.append(f"Leerer CHL-Feed: {feed}")

        parsed: List[Dict[str, Any]] = []
        seen: set[str] = set()
        for match in raw_games:
            game = parse_chl_match(match, league=league, season=display, team_mapper=self.team_mapper)
            if not game or game["id"] in seen:
                continue
            seen.add(game["id"])
            parsed.append(game)

        parsed.sort(key=lambda item: (item.get("date") or "", item.get("matchday") or 0, item.get("id") or ""))
        return {
            "season": season,
            "league": league,
            "games": parsed,
            "imported_count": len(parsed),
            "feed": feed,
            "import_source": "chl_json",
            "errors": errors,
            "teams": teams_from_schedule(raw_games),
        }


def _repo_paths() -> Tuple[str, str]:
    root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
    return (
        os.path.join(root, "data", "academy"),
        os.path.join(root, "data", "games"),
    )


def sync_chl_team_catalog(data_dir: str, seasons: Dict[str, List[Dict[str, str]]]) -> str:
    path = os.path.join(data_dir, "teams_chl.json")
    existing: Dict[str, Any] = {}
    if os.path.exists(path):
        with open(path, "r", encoding="utf-8") as handle:
            existing = json.load(handle)
    catalog = {
        "league": "CHL",
        "default_season": existing.get("default_season") or "2025/26",
        "seasons": {
            **(existing.get("seasons") or {}),
            **seasons,
        },
    }
    with open(path, "w", encoding="utf-8") as handle:
        json.dump(catalog, handle, ensure_ascii=False, indent=2)
        handle.write("\n")
    # Mirror frontend copy.
    frontend_path = os.path.abspath(
        os.path.join(data_dir, "..", "..", "frontend", "src", "data", "teams_chl.json")
    )
    with open(frontend_path, "w", encoding="utf-8") as handle:
        json.dump(catalog, handle, ensure_ascii=False, indent=2)
        handle.write("\n")
    return path


if __name__ == "__main__":
    import sys

    from .game_store import load_games_catalog, save_games_catalog
    from .season_utils import season_to_file_key

    data_dir, games_dir = _repo_paths()
    seasons = sys.argv[1:] or ["2025/26", "2026/27"]
    # Bootstrap mapper from current catalog (may be stale for 26/27).
    mapper = build_chl_team_mapper(os.path.join(data_dir, "teams_chl.json"))
    importer = ChlScheduleImporter(mapper)
    season_teams: Dict[str, List[Dict[str, str]]] = {}
    for season in seasons:
        result = importer.import_season(season, league="CHL")
        print(
            f"{season}: {result['imported_count']} games "
            f"(feed={result.get('feed')}, errors={result.get('errors')})"
        )
        if result.get("teams"):
            season_teams[season_to_display(season)] = result["teams"]
        if result.get("games"):
            catalog = load_games_catalog(games_dir, "CHL", season)
            catalog["league"] = "CHL"
            catalog["season"] = season_to_file_key(season)
            catalog["season_label"] = season_to_display(season)
            catalog["updated_at"] = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
            catalog["games"] = result["games"]
            save_games_catalog(games_dir, catalog)
            print(f"  wrote {len(result['games'])} games (full replace)")
    if season_teams:
        path = sync_chl_team_catalog(data_dir, season_teams)
        print("teams catalog:", path)
