"""DEL2 schedule importer — del-2.org game pages (Holema backend)."""

from __future__ import annotations

import json
import os
import re
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple
from urllib.request import Request, urlopen

from .game_store import build_game_id
from .schedule_importer import _parse_score_block, fetch_html
from .season_utils import season_to_display
from .team_mapping import TeamCatalogMapper

_BASE_URL = "https://www.del-2.org"
_USER_AGENT = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
)

_PHASE_LABELS = {
    "hauptrunde": "Hauptrunde",
    "testspiele": "Testspiele",
    "pre_playoffs": "Pre-Playoffs",
    "quarterfinal": "Viertelfinale",
    "semifinal": "Halbfinale",
    "final": "Finale",
    "playdowns": "Playdowns",
}


def build_del2_team_mapper(data_dir: str) -> TeamCatalogMapper:
    mapper = TeamCatalogMapper(os.path.join(data_dir, "teams_del2.json"))
    config_path = os.path.join(data_dir, "del2_import_teams.json")
    if os.path.exists(config_path):
        with open(config_path, "r", encoding="utf-8") as handle:
            raw = json.load(handle)
        for item in raw if isinstance(raw, list) else []:
            catalog_id = (item.get("catalog_id") or "").strip()
            club_path = (item.get("club_path") or "").strip()
            if not catalog_id or not club_path:
                continue
            slug = club_path.rsplit("/", 1)[-1].rsplit("_", 1)[0].lower()
            mapper.register_slug(slug, catalog_id)

    slug_aliases = {
        "dresdner-eislowen": "eislowen_dresden",
        "dresdner-eisloewen": "eislowen_dresden",
        "duesseldorfer-eg": "dusseldorfer_eg",
        "lausitzer-fuechse": "lausitzer_fuchse",
        "eispiraten-crimmitschau": "eispiraten_crimmitschau",
        "ec-bad-nauheim": "ec_bad_nauheim",
        "ec-kassel-huskies": "ec_kassel_huskies",
        "blue-devils-weiden": "blue_devils_weiden",
        "bietigheim-steelers": "bietigheim_steelers",
        "eisbaren-regensburg": "eisbaren_regensburg",
        "ravensburg-towerstars": "ravensburg_towerstars",
        "starbulls-rosenheim": "starbulls_rosenheim",
        "ehc-freiburg": "ehc_freiburg",
        "ev-landshut": "ev_landshut",
        "ecdc-memmingen-indians": "ecdc_memmingen",
        "krefeld-pinguine": "krefeld_pinguine",
    }
    for slug, catalog_id in slug_aliases.items():
        mapper.register_slug(slug, catalog_id)
    return mapper


def del2_site_season_label(season: str) -> str:
    """Convert catalog season 2025/26 → del-2.org label 2025/2026."""
    display = season_to_display(season)
    if "/" not in display:
        return display
    start, end = display.split("/", 1)
    if len(end) == 2:
        end = f"{start[:2]}{end}"
    return f"{start}/{end}"


def _parse_del2_datetime(text: str, *, season: str) -> Tuple[Optional[str], Optional[str]]:
    raw = (text or "").strip()
    match = re.search(r"(\d{1,2})\.(\d{1,2})\.(\d{2,4})(?:\s+(\d{1,2}):(\d{2}))?", raw)
    if not match:
        return None, None
    day, month = int(match.group(1)), int(match.group(2))
    year = int(match.group(3))
    if year < 100:
        start_year = int(season_to_display(season).split("/")[0])
        year = (start_year // 100) * 100 + year
        if year < start_year:
            year += 100
    date_iso = f"{year:04d}-{month:02d}-{day:02d}"
    time_value = None
    if match.group(4) and match.group(5):
        time_value = f"{int(match.group(4)):02d}:{match.group(5)}"
    return date_iso, time_value


def _parse_season_phase(season_raw: str) -> Tuple[str, str]:
    match = re.match(r"^(\d{4}/\d{4})\s*\(([^)]+)\)\s*$", (season_raw or "").strip())
    if not match:
        return season_raw, "Hauptrunde"
    return match.group(1), match.group(2).strip()


def _phase_from_matchday_code(phase_name: str, matchday_code: str) -> Tuple[str, Optional[int]]:
    phase_key = (phase_name or "").strip().lower()
    code = (matchday_code or "").strip().upper()

    if phase_key == "hauptrunde":
        digits = re.sub(r"\D", "", code)
        return "hauptrunde", int(digits) if digits else None

    if phase_key == "testspiele":
        return "testspiele", None

    if phase_key == "playdowns":
        digits = re.sub(r"\D", "", code)
        return "playdowns", int(digits) if digits else None

    if phase_key == "playoffs":
        if code.startswith("1PO"):
            digits = re.sub(r"\D", "", code)
            return "pre_playoffs", int(digits) if digits else 1
        if code.startswith("VF"):
            digits = re.sub(r"\D", "", code)
            return "quarterfinal", int(digits) if digits else 1
        if code.startswith("HF"):
            digits = re.sub(r"\D", "", code)
            return "semifinal", int(digits) if digits else 1
        if code == "F" or code.startswith("F"):
            return "final", None
    return phase_key.replace(" ", "_"), None


def _assign_final_matchdays(games: List[Dict[str, Any]]) -> None:
    buckets: Dict[Tuple[str, str, str], List[Dict[str, Any]]] = {}
    for game in games:
        if game.get("phase_id") != "final":
            continue
        pair = tuple(sorted([game.get("home_team_id") or "", game.get("away_team_id") or ""]))
        key = (game.get("season_id") or "", game.get("phase_id") or "", "|".join(pair))
        buckets.setdefault(key, []).append(game)
    for items in buckets.values():
        items.sort(key=lambda item: (item.get("date") or "", item.get("id") or ""))
        for index, game in enumerate(items, start=1):
            game["matchday"] = index


def _parse_score_from_page(html: str, game_path: str) -> Tuple[Optional[Dict[str, Any]], str]:
    escaped = re.escape(game_path)
    match = re.search(rf'<a href="{escaped}">([\s\S]*?)</a>', html, re.I)
    if not match:
        return None, "scheduled"
    block = match.group(1)
    rows = re.findall(
        r'alt="([^"]*)"[^>]*>[\s\S]*?spieltagcolumn text-center(?:\s+text-muted)?\s+fw-bold">([^<]+)</div>',
        block,
        re.I,
    )
    if len(rows) < 2:
        return None, "scheduled"
    home_score, away_score = rows[0][1].strip(), rows[1][1].strip()
    status_text = ""
    status_match = re.search(r"rospieltagsrow[\s\S]*?<span[^>]*>([^<]+)</span>", block, re.I)
    if status_match:
        status_text = status_match.group(1).strip().lower()
    if home_score == "-" or away_score == "-":
        return None, "scheduled"
    score = _parse_score_block(f"{home_score}:{away_score}")
    if not score:
        return None, "scheduled"
    if "beendet" in status_text or score:
        return score, "final"
    return score, "scheduled"


def parse_del2_game_html(
    html: str,
    *,
    game_numeric_id: int,
    game_path: str,
    league: str,
    season: str,
    team_mapper: TeamCatalogMapper,
) -> Optional[Dict[str, Any]]:
    if not html:
        return None

    list_items = re.findall(r'<li class="list-group-item">([^<]+)</li>', html)
    season_raw = next((item[7:] for item in list_items if item.startswith("Saison ")), None)
    matchday_raw = next((item.split(":", 1)[1].strip() for item in list_items if item.startswith("Spieltag:")), None)
    date_raw = next((item.split(":", 1)[1].strip() for item in list_items if item.startswith("Datum:")), None)
    if not season_raw:
        return None

    site_season, phase_name = _parse_season_phase(season_raw)
    if site_season != del2_site_season_label(season):
        return None

    title_match = re.search(r"<title>DEL2 \| (.+?) vs\. (.+?) - (.+?)</title>", html, re.I)
    home_name = title_match.group(1).strip() if title_match else None
    away_name = title_match.group(2).strip() if title_match else None
    title_tail = title_match.group(3).strip() if title_match else date_raw or ""

    slug_match = re.match(r"/spiel/(.+)-vs-(.+)_(\d+)$", game_path, re.I)
    home_slug = slug_match.group(1) if slug_match else None
    away_slug = slug_match.group(2) if slug_match else None

    home_id = team_mapper.resolve(slug=home_slug, name=home_name)
    away_id = team_mapper.resolve(slug=away_slug, name=away_name)
    if not home_id or not away_id:
        return None

    date_iso, time_value = _parse_del2_datetime(date_raw or title_tail, season=season)
    if not date_iso and title_tail:
        date_iso, time_value = _parse_del2_datetime(title_tail, season=season)

    phase_id, matchday = _phase_from_matchday_code(phase_name, matchday_raw or "")
    phase_label = _PHASE_LABELS.get(phase_id, phase_name or phase_id)
    score, status = _parse_score_from_page(html, game_path)

    external_id = f"{game_numeric_id}"
    game = {
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
        "home_team_name": team_mapper.team_name(home_id) or home_name,
        "away_team_name": team_mapper.team_name(away_id) or away_name,
        "status": status,
        "score": score,
        "source": {
            "provider": "del2",
            "external_id": external_id,
            "path": game_path,
            "imported_at": datetime.utcnow().isoformat() + "Z",
        },
    }
    return game


def _fetch_game_html(game_id: int) -> Tuple[Optional[str], str]:
    url = f"{_BASE_URL}/spiel/game_{game_id}"
    try:
        request = Request(url, headers={"User-Agent": _USER_AGENT})
        with urlopen(request, timeout=20) as response:
            final_url = response.geturl()
            html = response.read().decode("utf-8", errors="ignore")
            path_match = re.search(r"/spiel/[^/?#]+", final_url)
            return html, path_match.group(0) if path_match else f"/spiel/game_{game_id}"
    except Exception as exc:
        if "404" not in str(exc):
            print(f"[DEL2ScheduleImporter] fetch failed {url}: {exc}")
        return None, f"/spiel/game_{game_id}"


def _quick_season_match(game_id: int, site_season_label: str) -> bool:
    html, _path = _fetch_game_html(game_id)
    if not html or len(html) < 5000:
        return False
    season_raw = next(
        (
            item[7:]
            for item in re.findall(r'<li class="list-group-item">([^<]+)</li>', html)
            if item.startswith("Saison ")
        ),
        None,
    )
    return bool(season_raw and site_season_label in season_raw)


def _expand_bound(start: int, direction: int, site_season_label: str, *, stop_at: int) -> int:
    miss = 0
    probe = start
    bound = start
    while (direction < 0 and probe >= stop_at) or (direction > 0 and probe <= stop_at):
        if _quick_season_match(probe, site_season_label):
            bound = probe
            miss = 0
        else:
            miss += 1
            if miss >= 12:
                break
        probe += direction
    return bound


def _discover_id_bounds(site_season_label: str) -> Tuple[int, int]:
    hits: List[int] = []
    for game_id in range(6000, 10000, 25):
        if _quick_season_match(game_id, site_season_label):
            hits.append(game_id)
    if not hits:
        return 0, 0
    lo = _expand_bound(min(hits), -1, site_season_label, stop_at=6000)
    hi = _expand_bound(max(hits), 1, site_season_label, stop_at=9999)
    return lo, hi


def _collect_club_game_ids(data_dir: str) -> List[int]:
    config_path = os.path.join(data_dir, "del2_import_teams.json")
    if not os.path.exists(config_path):
        return []
    with open(config_path, "r", encoding="utf-8") as handle:
        raw = json.load(handle)
    ids: set[int] = set()
    for item in raw if isinstance(raw, list) else []:
        club_path = (item.get("club_path") or "").strip()
        if not club_path:
            continue
        html = fetch_html(f"{_BASE_URL}{club_path}/spielplan")
        if not html:
            continue
        for value in re.findall(r'href="/spiel/[^"]+_(\d+)"', html):
            try:
                ids.add(int(value))
            except ValueError:
                continue
    return sorted(ids)


class Del2ScheduleImporter:
    def __init__(self, team_mapper: TeamCatalogMapper, *, data_dir: Optional[str] = None):
        self.team_mapper = team_mapper
        self.data_dir = data_dir

    def import_season(self, season: str, *, league: str = "DEL2") -> Dict[str, Any]:
        site_label = del2_site_season_label(season)
        errors: List[str] = []
        candidate_ids: set[int] = set()

        if self.data_dir:
            candidate_ids.update(_collect_club_game_ids(self.data_dir))

        lo, hi = _discover_id_bounds(site_label)
        if lo and hi:
            candidate_ids.update(range(lo, hi + 1))
        elif candidate_ids:
            seed_lo = min(candidate_ids)
            seed_hi = max(candidate_ids)
            lo = _expand_bound(seed_lo, -1, site_label, stop_at=max(6000, seed_lo - 120))
            hi = _expand_bound(seed_hi, 1, site_label, stop_at=seed_hi + 120)
            candidate_ids.update(range(lo, hi + 1))
        else:
            errors.append(f"Keine DEL2-Spiele für Saison {site_label} gefunden")
            return {
                "season": season,
                "league": league,
                "games": [],
                "imported_count": 0,
                "import_source": "del2_game_pages",
                "errors": errors,
            }

        parsed_games: List[Dict[str, Any]] = []
        seen_ids: set[str] = set()
        for game_id in sorted(candidate_ids):
            html, game_path = _fetch_game_html(game_id)
            if not html:
                continue
            game = parse_del2_game_html(
                html,
                game_numeric_id=game_id,
                game_path=game_path,
                league=league,
                season=season,
                team_mapper=self.team_mapper,
            )
            if not game:
                continue
            if game["id"] in seen_ids:
                continue
            seen_ids.add(game["id"])
            parsed_games.append(game)

        _assign_final_matchdays(parsed_games)
        parsed_games.sort(key=lambda item: (item.get("date") or "", item.get("matchday") or 0, item.get("id") or ""))

        if not parsed_games:
            errors.append(f"Keine parsebaren DEL2-Spiele für {site_label}")

        return {
            "season": season,
            "league": league,
            "games": parsed_games,
            "imported_count": len(parsed_games),
            "id_bounds": [lo, hi] if lo and hi else None,
            "import_source": "del2_game_pages",
            "errors": errors,
        }


def _repo_data_dir() -> str:
    return os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "data", "academy"))


if __name__ == "__main__":
    import sys

    from .game_store import upsert_games

    data_dir = _repo_data_dir()
    games_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "data", "games"))
    mapper = build_del2_team_mapper(data_dir)
    importer = Del2ScheduleImporter(mapper, data_dir=data_dir)
    seasons = sys.argv[1:] or ["2025/26", "2026/27"]
    for season in seasons:
        result = importer.import_season(season, league="DEL2")
        print(
            f"{season}: {result['imported_count']} games "
            f"(bounds={result.get('id_bounds')}, errors={len(result.get('errors') or [])})"
        )
        if result.get("games"):
            upsert = upsert_games(
                games_dir,
                league="DEL2",
                season=season,
                games=result["games"],
            )
            print(f"  upsert: {upsert}")
