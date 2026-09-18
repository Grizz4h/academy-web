"""Canonical scene asset naming — Tank owns the rule.

Derived at read time. Never persist `asset_name` on scene JSON.

Schema: `{SCENE_CODE}_{HOME}-{AWAY}_{PERIOD}_{Tmm-ss}_{SLUG}`
"""

from __future__ import annotations

import json
import os
import re
import unicodedata
from functools import lru_cache
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional, Sequence, Tuple

REPO_ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = REPO_ROOT / "data" / "academy"

MANUAL_SCENE_SLUG = "Manual"
DERIVED_SCENE_KEYS = ("asset_name", "asset_name_missing")

PERIOD_TOKEN_BY_VALUE = {
    "P1": "P1",
    "P2": "P2",
    "P3": "P3",
    "OT": "OT",
    "SO": "SO",
}

LEAGUE_CATALOG_FILES = {
    "DEL": "teams.json",
    "DEL2": "teams_del2.json",
    "NHL": "teams_nhl.json",
    "CHL": "teams_chl.json",
    "U20_DNL": "teams_u20_dnl.json",
    "NATIONALMANNCHAFTEN": "teams_national.json",
    "TESTSPIELE": "teams_testspiele.json",
}

# League-scoped aliases only. Never a global last-write-wins map.
LEAGUE_NAME_ALIASES: Dict[str, Dict[str, str]] = {
    "DEL": {
        "fischtown pinguins": "fischtown_pinguins",
        "pinguins bremerhaven": "fischtown_pinguins",
        "ehc munchen": "red_bull_munchen",
        "ehc red bull munchen": "red_bull_munchen",
        "ehc red bull muenchen": "red_bull_munchen",
    },
    "CHL": {
        "fischtown pinguins": "pinguins_bremerhaven",
        "pinguins bremerhaven": "pinguins_bremerhaven",
    },
    "NHL": {
        "utah hockey club": "utah_mammoth",
    },
    "DEL2": {
        "ec kassel": "ec_kassel_huskies",
        "kassel huskies": "ec_kassel_huskies",
    },
}

LEAGUE_PREFERENCE = [
    "DEL",
    "DEL2",
    "NHL",
    "CHL",
    "U20_DNL",
    "NATIONALMANNCHAFTEN",
    "TESTSPIELE",
]


def strip_derived_scene_fields(scene: dict) -> dict:
    for key in DERIVED_SCENE_KEYS:
        scene.pop(key, None)
    return scene


def normalize_league_key(value: Optional[str]) -> str:
    text = unicodedata.normalize("NFD", str(value or ""))
    text = "".join(ch for ch in text if unicodedata.category(ch) != "Mn")
    underscored = re.sub(r"[^A-Z0-9]+", "_", text.upper()).strip("_")
    compact = underscored.replace("_", "")
    if underscored in LEAGUE_CATALOG_FILES:
        return underscored
    if compact == "U20DNL":
        return "U20_DNL"
    if compact == "NATIONALMANNSCHAFTEN":
        return "NATIONALMANNCHAFTEN"
    return underscored


def normalize_season_key(raw: Optional[str]) -> Optional[str]:
    if not raw:
        return None
    value = str(raw).strip()
    if not value:
        return None
    range_match = re.match(r"^(\d{4})\s*[/\-]\s*(\d{2,4})$", value)
    if range_match:
        start = range_match.group(1)
        end = range_match.group(2)
        if len(end) == 4:
            end = end[-2:]
        return f"{start}/{end.zfill(2)}"
    return value


def normalize_team_key(value: str) -> str:
    text = unicodedata.normalize("NFD", str(value or ""))
    text = "".join(ch for ch in text if unicodedata.category(ch) != "Mn")
    text = text.replace("ä", "a").replace("ö", "o").replace("ü", "u").replace("ß", "ss")
    text = text.replace("Ä", "a").replace("Ö", "o").replace("Ü", "u")
    return re.sub(r"[^a-z0-9]+", " ", text.lower()).strip()


def catalog_id_key(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "_", str(value or "").strip().lower()).strip("_")


def normalize_scene_slug(raw: Optional[str]) -> Optional[str]:
    if not raw:
        return None
    value = str(raw).strip()
    if not value:
        return None
    value = re.sub(r"[/:\\]+", "-", value)
    value = re.sub(r"\s+", "-", value)
    value = re.sub(r"_+", "-", value)
    value = re.sub(r"-+", "-", value)
    value = value.strip("-")
    return value or None


def format_scene_asset_clock(raw: Optional[str]) -> Optional[str]:
    text = str(raw or "").strip()
    if not text:
        return None
    match = re.match(r"^(\d{1,2})(?::(\d{1,2}))?$", text)
    if not match:
        return None
    minutes = int(match.group(1))
    seconds = int(match.group(2)) if match.group(2) is not None else 0
    if minutes < 0 or minutes > 99 or seconds < 0 or seconds > 59:
        return None
    return f"T{minutes:02d}-{seconds:02d}"


def format_scene_asset_period(raw: Optional[str]) -> Optional[str]:
    key = str(raw or "").strip().upper()
    if not key:
        return None
    return PERIOD_TOKEN_BY_VALUE.get(key)


def _load_json(path: Path) -> Any:
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def _catalog_mtime(files: Iterable[Path]) -> Tuple[int, ...]:
    stamps = []
    for path in files:
        try:
            stamps.append(int(path.stat().st_mtime_ns))
        except OSError:
            stamps.append(0)
    return tuple(stamps)


@lru_cache(maxsize=1)
def _team_catalogs(cache_key: Tuple[int, ...]) -> Dict[str, dict]:
    del cache_key
    catalogs: Dict[str, dict] = {}
    for league, filename in LEAGUE_CATALOG_FILES.items():
        path = DATA_DIR / filename
        if not path.is_file():
            continue
        try:
            catalogs[league] = _load_json(path)
        except (OSError, json.JSONDecodeError):
            continue
    return catalogs


def load_team_catalogs() -> Dict[str, dict]:
    files = [DATA_DIR / filename for filename in LEAGUE_CATALOG_FILES.values()]
    return _team_catalogs(_catalog_mtime(files))


def _ordered_teams(catalog: dict, season: Optional[str]) -> List[dict]:
    seasons = catalog.get("seasons")
    if not isinstance(seasons, dict) or not seasons:
        teams = catalog.get("teams") or []
        return [team for team in teams if isinstance(team, dict)]
    preferred = normalize_season_key(season)
    if preferred and preferred not in seasons:
        default = catalog.get("default_season")
        if default in seasons:
            preferred = default
    ordered: List[dict] = []
    if preferred and preferred in seasons and isinstance(seasons[preferred], list):
        ordered.extend(team for team in seasons[preferred] if isinstance(team, dict))
    for key, teams in seasons.items():
        if key == preferred or not isinstance(teams, list):
            continue
        ordered.extend(team for team in teams if isinstance(team, dict))
    return ordered


def resolve_team_short(
    value: Optional[str] = None,
    *,
    league: Optional[str] = None,
    season: Optional[str] = None,
    team_id: Optional[str] = None,
    catalogs: Optional[Dict[str, dict]] = None,
) -> Optional[str]:
    """Resolve a catalog short within one league. No invented codes."""
    catalogs = catalogs if catalogs is not None else load_team_catalogs()
    league_key = normalize_league_key(league)
    leagues: Sequence[str]
    if league_key:
        if league_key not in catalogs:
            return None
        leagues = [league_key]
    else:
        leagues = [key for key in LEAGUE_PREFERENCE if key in catalogs]

    raw_id = catalog_id_key(team_id or "")
    raw_value = str(value or "").strip()
    raw_value_id = catalog_id_key(raw_value)
    name_key = normalize_team_key(raw_value)

    for league_name in leagues:
        catalog = catalogs.get(league_name) or {}
        teams = _ordered_teams(catalog, season)
        aliases = LEAGUE_NAME_ALIASES.get(league_name) or {}

        def short_for(team: dict) -> Optional[str]:
            short = str(team.get("short") or "").strip().upper()
            return short or None

        if raw_id:
            for team in teams:
                if catalog_id_key(team.get("id") or "") == raw_id:
                    found = short_for(team)
                    if found:
                        return found
        if raw_value_id:
            for team in teams:
                if catalog_id_key(team.get("id") or "") == raw_value_id:
                    found = short_for(team)
                    if found:
                        return found
        if raw_value:
            for team in teams:
                if str(team.get("name") or "").strip() == raw_value:
                    found = short_for(team)
                    if found:
                        return found
        if name_key:
            for team in teams:
                if normalize_team_key(str(team.get("name") or "")) == name_key:
                    found = short_for(team)
                    if found:
                        return found
            alias_id = aliases.get(name_key)
            if alias_id:
                for team in teams:
                    if catalog_id_key(team.get("id") or "") == alias_id:
                        found = short_for(team)
                        if found:
                            return found
        if league_key:
            break
    return None


def format_matchup_short_codes(
    team_home: Optional[str],
    team_away: Optional[str],
    *,
    league: Optional[str] = None,
    season: Optional[str] = None,
    home_team_id: Optional[str] = None,
    away_team_id: Optional[str] = None,
    catalogs: Optional[Dict[str, dict]] = None,
) -> Optional[str]:
    catalogs = catalogs if catalogs is not None else load_team_catalogs()
    home = resolve_team_short(
        team_home, league=league, season=season, team_id=home_team_id, catalogs=catalogs
    )
    away = resolve_team_short(
        team_away, league=league, season=season, team_id=away_team_id, catalogs=catalogs
    )
    if not home or not away:
        return None
    return f"{home}-{away}"


def _iter_drills(curriculum: dict) -> Iterable[dict]:
    for track in curriculum.get("tracks") or []:
        if not isinstance(track, dict):
            continue
        for module in track.get("modules") or []:
            if not isinstance(module, dict):
                continue
            for drill in module.get("drills") or []:
                if isinstance(drill, dict):
                    yield drill


def _merge_foundation_tracks(curriculum: dict) -> dict:
    foundation_dir = DATA_DIR / "foundation"
    if not foundation_dir.is_dir():
        return curriculum
    tracks = list(curriculum.get("tracks") or [])
    existing_ids = {track.get("id") for track in tracks if isinstance(track, dict)}
    extra = []
    try:
        for name in sorted(os.listdir(foundation_dir)):
            if not name.endswith(".json"):
                continue
            try:
                payload = _load_json(foundation_dir / name) or {}
            except (OSError, json.JSONDecodeError):
                continue
            track = payload.get("track") if isinstance(payload, dict) else None
            if not isinstance(track, dict) or not track.get("id"):
                continue
            if track["id"] in existing_ids:
                continue
            extra.append(track)
            existing_ids.add(track["id"])
    except OSError:
        return curriculum
    if not extra:
        return curriculum
    return {**curriculum, "tracks": extra + tracks}


@lru_cache(maxsize=1)
def _drill_scene_slugs(cache_key: Tuple[int, ...]) -> Dict[str, str]:
    del cache_key
    path = DATA_DIR / "curriculum.json"
    if not path.is_file():
        return {}
    try:
        curriculum = _load_json(path)
    except (OSError, json.JSONDecodeError):
        return {}
    if not isinstance(curriculum, dict):
        return {}
    curriculum = _merge_foundation_tracks(curriculum)
    slugs: Dict[str, str] = {}
    for drill in _iter_drills(curriculum):
        drill_id = str(drill.get("id") or "").strip()
        slug = normalize_scene_slug(drill.get("sceneSlug"))
        if drill_id and slug:
            slugs[drill_id] = slug
    return slugs


def load_drill_scene_slugs() -> Dict[str, str]:
    paths = [DATA_DIR / "curriculum.json"]
    foundation_dir = DATA_DIR / "foundation"
    if foundation_dir.is_dir():
        paths.extend(sorted(foundation_dir.glob("*.json")))
    return _drill_scene_slugs(_catalog_mtime(paths))


def resolve_scene_source_type(scene: dict) -> str:
    source = scene.get("source") if isinstance(scene.get("source"), dict) else {}
    source_type = str(source.get("type") or "").strip().lower()
    if source_type in ("manual", "drill"):
        return source_type
    if scene.get("session_id") or scene.get("drill_id") or source.get("drill_id"):
        return "drill"
    return "manual"


def resolve_scene_drill_id(scene: dict) -> Optional[str]:
    source = scene.get("source") if isinstance(scene.get("source"), dict) else {}
    drill_id = source.get("drill_id") or scene.get("drill_id")
    drill_id = str(drill_id).strip() if drill_id else ""
    return drill_id or None


def resolve_scene_asset_slug(
    *,
    source_type: Optional[str],
    drill_id: Optional[str],
    scene_slug: Optional[str] = None,
    slugs: Optional[Dict[str, str]] = None,
) -> Optional[str]:
    resolved_type = (source_type or ("drill" if drill_id else "manual")).strip().lower()
    if resolved_type == "manual":
        return MANUAL_SCENE_SLUG
    if scene_slug:
        return normalize_scene_slug(scene_slug)
    if drill_id:
        table = slugs if slugs is not None else load_drill_scene_slugs()
        return table.get(str(drill_id).strip())
    return None


def generate_scene_asset_name(
    *,
    scene_code: Optional[str] = None,
    scene_id: Optional[str] = None,
    team_home: Optional[str] = None,
    team_away: Optional[str] = None,
    home_team_id: Optional[str] = None,
    away_team_id: Optional[str] = None,
    league: Optional[str] = None,
    season: Optional[str] = None,
    period: Optional[str] = None,
    game_time: Optional[str] = None,
    source_type: Optional[str] = None,
    drill_id: Optional[str] = None,
    scene_slug: Optional[str] = None,
    catalogs: Optional[Dict[str, dict]] = None,
    slugs: Optional[Dict[str, str]] = None,
) -> Dict[str, Any]:
    """Fail-closed builder. Never uses scene.id as the scene code."""
    missing: List[str] = []
    # scene_id (file/uuid) is intentionally unused — never a scene_code fallback.
    code = str(scene_code or "").strip()
    if not code:
        missing.append("Szenen-ID")

    matchup = format_matchup_short_codes(
        team_home,
        team_away,
        league=league,
        season=season,
        home_team_id=home_team_id,
        away_team_id=away_team_id,
        catalogs=catalogs,
    )
    if not matchup:
        missing.append("Paarung")

    period_token = format_scene_asset_period(period)
    if not period_token:
        missing.append("Drittel")

    clock = format_scene_asset_clock(game_time)
    if not clock:
        missing.append("Spielzeit")

    resolved_type = (source_type or ("drill" if drill_id else "manual")).strip().lower()
    slug = resolve_scene_asset_slug(
        source_type=resolved_type,
        drill_id=drill_id,
        scene_slug=scene_slug,
        slugs=slugs,
    )
    if not slug:
        missing.append("Quelle" if resolved_type == "manual" else "Drill-Slug")

    unique_missing = list(dict.fromkeys(missing))
    if unique_missing or not code or not matchup or not period_token or not clock or not slug:
        return {"ok": False, "name": None, "missing": unique_missing}

    return {
        "ok": True,
        "name": f"{code}_{matchup}_{period_token}_{clock}_{slug}",
        "missing": [],
    }


def generate_scene_asset_name_from_scene(
    scene: dict,
    *,
    catalogs: Optional[Dict[str, dict]] = None,
    slugs: Optional[Dict[str, str]] = None,
) -> Dict[str, Any]:
    source_type = resolve_scene_source_type(scene)
    drill_id = resolve_scene_drill_id(scene) if source_type == "drill" else None
    return generate_scene_asset_name(
        scene_code=scene.get("scene_code") or scene.get("internal_scene_id"),
        scene_id=scene.get("id"),
        team_home=scene.get("team_home"),
        team_away=scene.get("team_away"),
        home_team_id=scene.get("team_home_id") or scene.get("home_team_id"),
        away_team_id=scene.get("team_away_id") or scene.get("away_team_id"),
        league=scene.get("league"),
        season=scene.get("season"),
        period=scene.get("period"),
        game_time=scene.get("game_time"),
        source_type=source_type,
        drill_id=drill_id,
        catalogs=catalogs,
        slugs=slugs,
    )


def attach_scene_asset_name(
    scene: dict,
    *,
    catalogs: Optional[Dict[str, dict]] = None,
    slugs: Optional[Dict[str, str]] = None,
) -> dict:
    """Return a response copy with derived asset_name. Does not persist."""
    payload = dict(scene)
    strip_derived_scene_fields(payload)
    result = generate_scene_asset_name_from_scene(payload, catalogs=catalogs, slugs=slugs)
    payload["asset_name"] = result.get("name")
    payload["asset_name_missing"] = list(result.get("missing") or [])
    return payload
