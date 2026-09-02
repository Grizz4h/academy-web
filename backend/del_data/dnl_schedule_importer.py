"""U20 DNL schedule importer — DEB LIVE via public hockeydata Schedule API.

API key is read at runtime from the public deb-online.live widget config
and never written to disk or logs.
"""

from __future__ import annotations

import json
import os
import re
from datetime import datetime, timezone
from html import unescape
from typing import Any, Dict, List, Optional, Tuple
from urllib.parse import urlencode
from urllib.request import Request, urlopen

from .game_store import build_game_id, load_games_catalog, save_games_catalog
from .season_utils import season_to_display, season_to_file_key
from .team_mapping import TeamCatalogMapper

_PAGE_URL = "https://deb-online.live/liga/herren/u20-dnl/"
_API = "https://api.hockeydata.net/data/ebel/Schedule"
_USER_AGENT = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
)
_REFERER_HOST = "deb-online.live"

# Division map mirrors DEB LIVE naming. 25/26 called Div 2 "Findung B" and
# Div 3 "Qualifikationsrunde 3"; 26/27 uses Division 2 / 3 Nord / 3 Süd.
_SEASON_DIVISIONS: Dict[str, List[Tuple[int, str, str]]] = {
    # (divisionId, phase_id, phase_label)
    "2025/26": [
        (18700, "finding_a_g1", "Findung A · Gruppe 1"),
        (18701, "finding_a_g2", "Findung A · Gruppe 2"),
        (18705, "top_division", "Top Division"),
        (18706, "qualification_1", "Qualifikationsrunde 1"),
        (18702, "division_2", "Division 2"),
        (18703, "division_3_nord", "Division 3 Nord"),
        (18704, "division_3_sued", "Division 3 Süd"),
        (20535, "pre_playoffs", "Pre-Playoffs"),
        (20534, "playoffs", "Playoffs"),
        (20561, "playdowns", "Playdowns"),
        (20565, "playdowns", "Playdowns"),
        (20568, "playdowns", "Playdowns"),
        (20572, "playdowns", "Playdowns"),
    ],
    "2026/27": [
        (21356, "finding_a_g1", "Findung A · Gruppe 1"),
        (21357, "finding_a_g2", "Findung A · Gruppe 2"),
        (21358, "division_2", "Division 2"),
        (21359, "division_3_nord", "Division 3 Nord"),
        (21360, "division_3_sued", "Division 3 Süd"),
    ],
}

_NAME_ALIASES = {
    "augsburger ev": "augsburger_ev",
    "dusseldorfer eg": "dusseldorfer_eg",
    "ec bad tolz": "ec_bad_tolz",
    "ev fussen": "ev_fuessen",
    "eisbaren juniors berlin": "eisbaren_juniors_berlin",
    "iserlohner ec": "iserlohner_ec",
    "jungadler mannheim": "jungadler_mannheim",
    "kolner junghaie": "kolner_junghaie",
    "erc ingolstadt": "erc_ingolstadt",
    "esc dresden": "esc_dresden",
    "esv kaufbeuren": "esv_kaufbeuren",
    "ev landshut": "ev_landshut",
    "krefelder ev 81": "krefelder_ev_81",
    "sc bietigheim bissingen": "sc_bietigheim_bissingen",
    "schwenninger erc": "schwenninger_erc",
    "starbulls rosenheim": "starbulls_rosenheim",
    "jung eisbaren regensburg": "jung_eisbaren_regensburg",
    "ungarn u20": "hungary_u20",
    "hungary u20": "hungary_u20",
}


def _normalize_name(value: str) -> str:
    text = (value or "").strip().lower()
    text = (
        text.replace("ä", "a")
        .replace("ö", "o")
        .replace("ü", "u")
        .replace("ß", "ss")
        .replace("é", "e")
        .replace("è", "e")
    )
    text = re.sub(r"\bu20\b", " ", text)
    return re.sub(r"[^a-z0-9]+", " ", text).strip()


def slug_to_catalog_id(name: str) -> str:
    return _normalize_name(name).replace(" ", "_")


def build_dnl_team_mapper(teams_json_path: str) -> TeamCatalogMapper:
    mapper = TeamCatalogMapper(teams_json_path)
    for alias, catalog_id in _NAME_ALIASES.items():
        mapper.register_name(alias, catalog_id)
        mapper.register_name(alias + " u20", catalog_id)
    return mapper


def _fetch(url: str, *, referer: Optional[str] = None) -> Optional[bytes]:
    headers = {
        "User-Agent": _USER_AGENT,
        "Accept": "application/json,text/javascript,*/*",
    }
    if referer:
        headers["Referer"] = referer
    try:
        request = Request(url, headers=headers)
        with urlopen(request, timeout=30) as response:
            return response.read()
    except Exception as exc:
        print(f"[DnlScheduleImporter] fetch failed {url.split('?')[0]}: {exc}")
        return None


def _extract_widget_api_key(html: str) -> Optional[str]:
    match = re.search(r"data-hd-widget-options='(\{.*?\})'", html)
    if not match:
        return None
    try:
        opts = json.loads(unescape(match.group(1)))
    except Exception:
        return None
    key = (opts.get("apiKey") or "").strip()
    return key or None


def _live_page_divisions(html: str) -> List[Tuple[int, str]]:
    match = re.search(r"data-hd-widget-options='(\{.*?\})'", html)
    if not match:
        return []
    try:
        opts = json.loads(unescape(match.group(1)))
    except Exception:
        return []
    out: List[Tuple[int, str]] = []
    for row in opts.get("divisions") or []:
        try:
            out.append((int(row["divisionId"]), str(row.get("divisionName") or "")))
        except (KeyError, TypeError, ValueError):
            continue
    return out


def _phase_for_live_division(name: str) -> Optional[Tuple[str, str]]:
    label = (name or "").strip()
    low = label.lower()
    if "findung a" in low and ("gruppe 1" in low or "group 1" in low):
        return "finding_a_g1", "Findung A · Gruppe 1"
    if "findung a" in low and ("gruppe 2" in low or "group 2" in low):
        return "finding_a_g2", "Findung A · Gruppe 2"
    if "findung a" in low:
        return "finding_a_g1", "Findung A"
    if "findung b" in low or re.search(r"\bdivision\s*2\b", low):
        return "division_2", "Division 2"
    if "top" in low:
        return "top_division", "Top Division"
    if "qualifikationsrunde 1" in low or re.search(r"quali.*\b1\b", low):
        return "qualification_1", "Qualifikationsrunde 1"
    if "qualifikationsrunde 3" in low and "nord" in low:
        return "division_3_nord", "Division 3 Nord"
    if "qualifikationsrunde 3" in low and ("süd" in low or "sued" in low):
        return "division_3_sued", "Division 3 Süd"
    if re.search(r"\bdivision\s*3\b", low) and "nord" in low:
        return "division_3_nord", "Division 3 Nord"
    if re.search(r"\bdivision\s*3\b", low) and ("süd" in low or "sued" in low):
        return "division_3_sued", "Division 3 Süd"
    if "pre-playoff" in low or "pre playoff" in low:
        return "pre_playoffs", "Pre-Playoffs"
    if "play-down" in low or "playdown" in low:
        return "playdowns", "Playdowns"
    if "play-off" in low or "playoff" in low:
        return "playoffs", "Playoffs"
    return None


_RS_PHASES = {
    "finding_a",
    "finding_a_g1",
    "finding_a_g2",
    "top_division",
    "qualification_1",
    "division_2",
    "division_3_nord",
    "division_3_sued",
    "hauptrunde",
}


def _game_name_sequence(row: Dict[str, Any]) -> int:
    match = re.search(r"_(\d+)$", str(row.get("gameName") or ""))
    return int(match.group(1)) if match else 0


def _row_sort_key(row: Dict[str, Any]) -> Tuple[Any, ...]:
    return (
        _game_name_sequence(row),
        str(row.get("scheduledGameStart") or ""),
        str(row.get("id") or ""),
    )


def _teams_in_row(row: Dict[str, Any]) -> set:
    return {
        row.get("homeTeamId"),
        row.get("awayTeamId"),
    } - {None}


def _find_disjoint_round(
    candidates: List[Dict[str, Any]],
    games_per_round: int,
    start: int,
    used_teams: set,
    picked: List[Dict[str, Any]],
) -> Optional[List[Dict[str, Any]]]:
    if len(picked) == games_per_round:
        return picked
    for index in range(start, len(candidates)):
        game = candidates[index]
        teams = _teams_in_row(game)
        if teams & used_teams:
            continue
        found = _find_disjoint_round(
            candidates,
            games_per_round,
            index + 1,
            used_teams | teams,
            picked + [game],
        )
        if found:
            return found
    return None


def rebuild_regular_season_matchdays(rows: List[Dict[str, Any]]) -> Dict[str, int]:
    """Rebuild Spieltag numbers so each team appears at most once per matchday.

    hockeydata ``gameDay`` often splits one round across dates (e.g. Sat slate +
    midweek makeup get different gameDay values). With N teams a round has N/2
    games. We partition the schedule into disjoint rounds (each team once) using
    the ``gameName`` sequence as a stable tie-breaker, not calendar order alone.
    """
    if not rows:
        return {}
    team_ids = {
        row.get("homeTeamId")
        for row in rows
        if row.get("homeTeamId") is not None
    } | {
        row.get("awayTeamId")
        for row in rows
        if row.get("awayTeamId") is not None
    }
    games_per_round = max(1, len(team_ids) // 2)

    remaining = sorted([row for row in rows if row.get("id")], key=_row_sort_key)
    assigned: Dict[str, int] = {}
    matchday = 0
    while remaining:
        matchday += 1
        picked = _find_disjoint_round(remaining, games_per_round, 0, set(), [])
        if not picked:
            for game in remaining:
                assigned[str(game["id"])] = matchday
                matchday += 1
            break
        picked_ids = {game["id"] for game in picked}
        for game in picked:
            assigned[str(game["id"])] = matchday
        remaining = [row for row in remaining if row["id"] not in picked_ids]
    return assigned


def divisions_for_season(season: str, html: str) -> List[Tuple[int, str, str]]:
    display = season_to_display(season)
    pinned = list(_SEASON_DIVISIONS.get(display) or [])
    if pinned:
        return pinned
    # Unknown future season: use Div-1-ish widgets from the live page.
    out: List[Tuple[int, str, str]] = []
    for division_id, name in _live_page_divisions(html):
        phase = _phase_for_live_division(name)
        if not phase:
            continue
        out.append((division_id, phase[0], phase[1]))
    return out


def fetch_division_schedule(api_key: str, division_id: int) -> List[Dict[str, Any]]:
    params = urlencode(
        {
            "apiKey": api_key,
            "divisionId": str(division_id),
            "referer": _REFERER_HOST,
            "timestamp": str(int(datetime.now().timestamp() * 1000)),
        }
    )
    raw = _fetch(f"{_API}?{params}", referer=_PAGE_URL)
    if not raw:
        return []
    try:
        payload = json.loads(raw.decode("utf-8", errors="ignore"))
    except Exception:
        return []
    if payload.get("statusId") != 1:
        print(f"[DnlScheduleImporter] division {division_id}: {payload.get('statusMsg')}")
        return []
    rows = ((payload.get("data") or {}).get("rows")) or []
    return rows if isinstance(rows, list) else []


def _parse_date(row: Dict[str, Any]) -> Tuple[Optional[str], Optional[str]]:
    start = row.get("scheduledGameStart") or ""
    if isinstance(start, str) and "T" in start:
        date_iso = start[:10]
        time_value = start[11:16] if len(start) >= 16 else (row.get("scheduledTime") or None)
        return date_iso, time_value
    scheduled = row.get("scheduledDate") or {}
    value = scheduled.get("value") if isinstance(scheduled, dict) else None
    if value and re.match(r"^\d{2}\.\d{2}\.\d{4}$", str(value)):
        day, month, year = str(value).split(".")
        return f"{year}-{month}-{day}", row.get("scheduledTime") or None
    return None, row.get("scheduledTime") or None


def _parse_status(row: Dict[str, Any]) -> Tuple[str, Optional[Dict[str, int]]]:
    home = row.get("homeTeamScore")
    away = row.get("awayTeamScore")
    score = None
    if home is not None and away is not None:
        try:
            score = {"home": int(home), "away": int(away)}
        except (TypeError, ValueError):
            score = None
    if row.get("gameHasEnded") or "FINISHED" in (row.get("labels") or []):
        return "final", score
    status = int(row.get("gameStatus") or 0)
    # hockeydata: 1/2 often live-ish, 4 finished, 0 scheduled
    if status in {1, 2, 3} and score is not None:
        return "live", score
    if status == 4:
        return "final", score
    return "scheduled", None


def _series_game_number(row: Dict[str, Any]) -> Optional[int]:
    name = str(row.get("gameName") or "")
    match = re.search(r"-(\d+)$", name)
    if match:
        try:
            return int(match.group(1))
        except ValueError:
            return None
    return None


def _resolve_team(name: str, mapper: TeamCatalogMapper) -> Tuple[str, str]:
    clean = (name or "").strip()
    catalog_id = (
        mapper.resolve(name=clean)
        or mapper.resolve(name=f"{clean} U20")
        or _NAME_ALIASES.get(_normalize_name(clean))
        or slug_to_catalog_id(clean)
    )
    return catalog_id, clean


def parse_dnl_game(
    row: Dict[str, Any],
    *,
    league: str,
    season: str,
    phase_id: str,
    phase_label: str,
    team_mapper: TeamCatalogMapper,
    matchday_override: Optional[int] = None,
) -> Optional[Dict[str, Any]]:
    external_id = str(row.get("id") or "").strip()
    if not external_id:
        return None
    home_id, home_name = _resolve_team(str(row.get("homeTeamLongName") or ""), team_mapper)
    away_id, away_name = _resolve_team(str(row.get("awayTeamLongName") or ""), team_mapper)
    if not home_id or not away_id:
        return None
    home_name = team_mapper.team_name(home_id) or home_name
    away_name = team_mapper.team_name(away_id) or away_name

    date_iso, time_value = _parse_date(row)
    status, score = _parse_status(row)

    source_game_day = None
    try:
        if row.get("gameDay") not in (None, 0, "0"):
            source_game_day = int(row["gameDay"])
    except (TypeError, ValueError):
        source_game_day = None

    matchday: Optional[int] = None
    if phase_id in _RS_PHASES:
        matchday = matchday_override if matchday_override is not None else source_game_day
    else:
        matchday = _series_game_number(row)

    return {
        "id": build_game_id(league, season, external_id),
        "league_id": "U20_DNL",
        "season_id": season_to_display(season),
        "phase_id": phase_id,
        "phase_label": phase_label or row.get("divisionName") or phase_id,
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
            "provider": "deb_hockeydata",
            "external_id": external_id,
            "division_id": row.get("divisionId"),
            "game_name": row.get("gameName"),
            "source_game_day": source_game_day,
            "home_logo_url": row.get("homeTeamLogoUrl"),
            "away_logo_url": row.get("awayTeamLogoUrl"),
            "imported_at": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        },
    }


class DnlScheduleImporter:
    def __init__(self, team_mapper: TeamCatalogMapper):
        self.team_mapper = team_mapper

    def import_season(self, season: str, *, league: str = "U20_DNL") -> Dict[str, Any]:
        display = season_to_display(season)
        errors: List[str] = []
        html_bytes = _fetch(_PAGE_URL, referer=_PAGE_URL)
        if not html_bytes:
            return {
                "season": season,
                "league": league,
                "games": [],
                "imported_count": 0,
                "errors": ["DEB LIVE Seite nicht erreichbar"],
            }
        html = html_bytes.decode("utf-8", errors="ignore")
        api_key = _extract_widget_api_key(html)
        if not api_key:
            return {
                "season": season,
                "league": league,
                "games": [],
                "imported_count": 0,
                "errors": ["Kein hockeydata Widget-Key auf DEB LIVE"],
            }

        divisions = divisions_for_season(display, html)
        if not divisions:
            errors.append(f"Keine Divisionen für {display}")

        parsed: List[Dict[str, Any]] = []
        seen: set[str] = set()
        teams_by_id: Dict[str, Dict[str, str]] = {}
        logo_hints: Dict[str, str] = {}

        for division_id, phase_id, phase_label in divisions:
            rows = fetch_division_schedule(api_key, division_id)
            if not rows:
                errors.append(f"Division {division_id} ({phase_label}): keine Spiele")
                continue
            matchday_by_id: Dict[str, int] = {}
            if phase_id in _RS_PHASES:
                matchday_by_id = rebuild_regular_season_matchdays(rows)
            for row in rows:
                external_id = str(row.get("id") or "").strip()
                game = parse_dnl_game(
                    row,
                    league=league,
                    season=display,
                    phase_id=phase_id,
                    phase_label=phase_label,
                    team_mapper=self.team_mapper,
                    matchday_override=matchday_by_id.get(external_id),
                )
                if not game or game["id"] in seen:
                    continue
                seen.add(game["id"])
                parsed.append(game)
                for side, name_key, id_key, logo_key in (
                    ("home", "home_team_name", "home_team_id", "homeTeamLogoUrl"),
                    ("away", "away_team_name", "away_team_id", "awayTeamLogoUrl"),
                ):
                    tid = game[id_key]
                    raw_name = str(game[name_key] or "")
                    catalog_name = self.team_mapper.team_name(tid)
                    if not catalog_name:
                        low = raw_name.lower()
                        if any(
                            token in low
                            for token in ("jung", "juniors", "u20", "haie")
                        ):
                            catalog_name = raw_name
                        else:
                            catalog_name = f"{raw_name} U20"
                    short = str(row.get(f"{side}TeamShortName") or "").strip().upper()
                    teams_by_id[tid] = {
                        "id": tid,
                        "name": catalog_name,
                        "short": short[:3] if short else tid[:3].upper(),
                    }
                    logo = row.get(logo_key)
                    if logo and tid not in logo_hints:
                        logo_hints[tid] = str(logo).replace("net//", "net/")

        parsed.sort(key=lambda item: (item.get("date") or "", item.get("matchday") or 0, item.get("id") or ""))
        return {
            "season": season,
            "league": league,
            "games": parsed,
            "imported_count": len(parsed),
            "import_source": "deb_hockeydata",
            "errors": errors,
            "teams": sorted(teams_by_id.values(), key=lambda item: item["name"].lower()),
            "logo_hints": logo_hints,
            "divisions": [{"id": d[0], "phase_id": d[1], "phase_label": d[2]} for d in divisions],
        }


def _repo_paths() -> Tuple[str, str]:
    root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
    return os.path.join(root, "data", "academy"), os.path.join(root, "data", "games")


def sync_dnl_team_catalog(data_dir: str, seasons: Dict[str, List[Dict[str, str]]]) -> str:
    path = os.path.join(data_dir, "teams_u20_dnl.json")
    existing: Dict[str, Any] = {}
    if os.path.exists(path):
        with open(path, "r", encoding="utf-8") as handle:
            existing = json.load(handle)

    # Keep Hungary guest entry when present historically.
    hungary = {"id": "hungary_u20", "name": "Ungarn U20 (HUN)", "short": "HUN", "country": "Hungary"}
    merged_seasons = dict(existing.get("seasons") or {})
    for season_key, teams in seasons.items():
        by_id = {t["id"]: t for t in teams if t.get("id")}
        if "hungary_u20" not in by_id:
            by_id["hungary_u20"] = hungary
        merged_seasons[season_key] = sorted(by_id.values(), key=lambda item: item["name"].lower())

    catalog = {
        "league": "U20_DNL",
        "default_season": existing.get("default_season") or "2025/26",
        "seasons": merged_seasons,
    }
    with open(path, "w", encoding="utf-8") as handle:
        json.dump(catalog, handle, ensure_ascii=False, indent=2)
        handle.write("\n")
    frontend_path = os.path.abspath(os.path.join(data_dir, "..", "..", "frontend", "src", "data", "teams_u20_dnl.json"))
    with open(frontend_path, "w", encoding="utf-8") as handle:
        json.dump(catalog, handle, ensure_ascii=False, indent=2)
        handle.write("\n")
    return path


if __name__ == "__main__":
    import sys

    data_dir, games_dir = _repo_paths()
    seasons = sys.argv[1:] or ["2025/26", "2026/27"]
    mapper = build_dnl_team_mapper(os.path.join(data_dir, "teams_u20_dnl.json"))
    importer = DnlScheduleImporter(mapper)
    season_teams: Dict[str, List[Dict[str, str]]] = {}
    logo_hints: Dict[str, str] = {}
    for season in seasons:
        result = importer.import_season(season, league="U20_DNL")
        print(
            f"{season}: {result['imported_count']} games "
            f"(errors={len(result.get('errors') or [])})"
        )
        for err in result.get("errors") or []:
            print(f"  ! {err}")
        if result.get("teams"):
            season_teams[season_to_display(season)] = result["teams"]
        logo_hints.update(result.get("logo_hints") or {})
        if result.get("games"):
            catalog = load_games_catalog(games_dir, "U20_DNL", season)
            catalog["league"] = "U20_DNL"
            catalog["season"] = season_to_file_key(season)
            catalog["season_label"] = season_to_display(season)
            catalog["updated_at"] = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
            catalog["games"] = result["games"]
            save_games_catalog(games_dir, catalog)
            print(f"  wrote {len(result['games'])} games (full replace)")
    if season_teams:
        print("teams catalog:", sync_dnl_team_catalog(data_dir, season_teams))
    if logo_hints:
        hints_path = os.path.join(data_dir, "u20_dnl_logo_hints.json")
        with open(hints_path, "w", encoding="utf-8") as handle:
            json.dump(logo_hints, handle, ensure_ascii=False, indent=2)
            handle.write("\n")
        print("logo hints:", hints_path)
