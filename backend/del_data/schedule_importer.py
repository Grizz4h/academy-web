"""PENNY DEL schedule importer — Hauptrunde spielplan pages."""

from __future__ import annotations

import re
from datetime import datetime
from html import unescape
from typing import Any, Dict, List, Optional
from urllib.request import Request, urlopen

_USER_AGENT = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
)

from .game_store import build_game_id
from .season_utils import season_to_del_url_slug
from .team_mapping import TeamCatalogMapper


GERMAN_MONTHS = {
    "januar": 1,
    "februar": 2,
    "maerz": 3,
    "märz": 3,
    "april": 4,
    "mai": 5,
    "juni": 6,
    "juli": 7,
    "august": 8,
    "september": 9,
    "oktober": 10,
    "november": 11,
    "dezember": 12,
}


def fetch_html(url: str) -> Optional[str]:
    try:
        request = Request(url, headers={"User-Agent": _USER_AGENT})
        with urlopen(request, timeout=20) as response:
            return response.read().decode("utf-8", errors="ignore")
    except Exception as exc:
        print(f"[ScheduleImporter] fetch failed {url}: {exc}")
        return None


def _strip_html(value: str) -> str:
    text = re.sub(r"<[^>]+>", " ", value or "")
    return unescape(" ".join(text.split()))


def _parse_german_date(text: str) -> Optional[str]:
    raw = (text or "").strip()
    numeric = re.search(r"(\d{1,2})\.(\d{1,2})\.(\d{4})", raw)
    if numeric:
        day, month, year = int(numeric.group(1)), int(numeric.group(2)), int(numeric.group(3))
        return f"{year:04d}-{month:02d}-{day:02d}"
    match = re.search(
        r"(\w+day)?,?\s*(\d{1,2})\.\s*(\w+)\.?\s*(\d{4})",
        raw,
        re.I,
    )
    if not match:
        return None
    day = int(match.group(2))
    month_name = match.group(3).lower().replace("ä", "a").replace("ö", "o").replace("ü", "u")
    year = int(match.group(4))
    month = GERMAN_MONTHS.get(month_name)
    if not month:
        return None
    return f"{year:04d}-{month:02d}-{day:02d}"


def _parse_score_block(text: str) -> Dict[str, Any]:
    raw = (text or "").strip()
    result: Dict[str, Any] = {}
    match = re.search(r"(\d+)\s*:\s*(\d+)(?:\s*\(([^)]+)\))?", raw)
    if not match:
        return result
    result["home"] = int(match.group(1))
    result["away"] = int(match.group(2))
    period_text = match.group(3)
    if period_text:
        periods = []
        for part in period_text.split(","):
            part = part.strip()
            pm = re.match(r"(\d+):(\d+)", part)
            if pm:
                periods.append({"home": int(pm.group(1)), "away": int(pm.group(2))})
        if periods:
            result["periods"] = periods
    return result


def parse_schedule_html(
    html: str,
    *,
    league: str,
    season: str,
    phase_id: str,
    phase_label: str,
    team_mapper: TeamCatalogMapper,
) -> List[Dict[str, Any]]:
    games: List[Dict[str, Any]] = []
    if not html:
        return games

    rows = re.findall(r'<tr>\s*<td class="team-schedule__date">(.*?)</tr>', html, re.S | re.I)
    for row in rows:
        date_text_match = re.search(r"^([^<]+)", row.strip())
        date_iso = _parse_german_date(date_text_match.group(1) if date_text_match else "")
        time_match = re.search(r'team-schedule__time">([^<]+)', row)
        matchday_match = re.search(r'team-schedule__compet">([^<]+)', row)
        # Names may be plain text (no team page / no <a>) — e.g. Dresdner Eislöwen 2025/26.
        # Slugs must stay paired with that name block; a single leftover href is not "away".
        team_slots = []
        for block in re.findall(r'<h6 class="team-meta__name[^"]*">([\s\S]*?)</h6>', row, re.I):
            name = _strip_html(block)
            if not name:
                continue
            slugs = re.findall(r'href="/teams/([^/]+)/', block)
            team_slots.append((name, slugs[0] if slugs else None))
        detail_links = re.findall(r'href="(/statistik/spieldetails/[^"]+)"', row)
        status_cells = [
            _strip_html(cell)
            for cell in re.findall(r'team-schedule__status[^>]*>(.*?)</td>', row, re.S | re.I)
        ]

        if len(team_slots) < 2:
            continue

        home_name, home_slug = team_slots[0]
        away_name, away_slug = team_slots[1]
        home_id = team_mapper.resolve(slug=home_slug, name=home_name)
        away_id = team_mapper.resolve(slug=away_slug, name=away_name)
        if not home_id or not away_id:
            continue

        score_text = next((cell for cell in status_cells if re.search(r"\d+\s*:\s*\d+", cell)), "")
        score = _parse_score_block(score_text)
        status = "final" if score else "scheduled"

        external_id = None
        if detail_links:
            external_id = detail_links[0].split("/")[-1]
        if not external_id and date_iso:
            external_id = f"{date_iso.replace('-', '')}_{home_id}_vs_{away_id}"

        game_id = build_game_id(league, season, external_id or f"{date_iso}-{home_id}-{away_id}")

        matchday_raw = _strip_html(matchday_match.group(1)) if matchday_match else ""
        matchday_digits = re.sub(r"\D", "", matchday_raw)
        matchday = int(matchday_digits) if matchday_digits else None

        games.append(
            {
                "id": game_id,
                "league_id": league.upper(),
                "season_id": season,
                "phase_id": phase_id,
                "phase_label": phase_label,
                "matchday": matchday,
                "date": date_iso,
                "time": (time_match.group(1).strip() if time_match else None),
                "home_team_id": home_id,
                "away_team_id": away_id,
                "home_team_name": home_name,
                "away_team_name": away_name,
                "status": status,
                "score": score or None,
                "source": {
                    "provider": "penny_del",
                    "external_id": external_id,
                    "imported_at": datetime.utcnow().isoformat() + "Z",
                },
            }
        )

    return games


PLAYOFF_ROUND_MAP = {
    "finale": ("final", "Finale"),
    "halbfinale": ("semifinal", "Halbfinale"),
    "viertelfinale": ("quarterfinal", "Viertelfinale"),
    "1. playoff-runde": ("playoff_round_1", "Erste Playoff-Runde"),
    "playoff-runde": ("playoff_round_1", "Erste Playoff-Runde"),
}


def _playoff_round(label: str) -> Optional[tuple[str, str]]:
    key = _strip_html(label).lower().replace("–", "-").replace("—", "-")
    key = re.sub(r"\s+", " ", key).strip()
    if key in PLAYOFF_ROUND_MAP:
        return PLAYOFF_ROUND_MAP[key]
    for prefix, mapped in PLAYOFF_ROUND_MAP.items():
        if prefix in key:
            return mapped
    return None


def _date_from_penny_id(external_id: str) -> Optional[str]:
    match = re.match(r"^(\d{2})(\d{2})(\d{4})_", external_id or "")
    if not match:
        return None
    day, month, year = int(match.group(1)), int(match.group(2)), int(match.group(3))
    if not (1 <= day <= 31 and 1 <= month <= 12):
        return None
    return f"{year:04d}-{month:02d}-{day:02d}"


def parse_playoff_html(
    html: str,
    *,
    league: str,
    season: str,
    team_mapper: TeamCatalogMapper,
) -> List[Dict[str, Any]]:
    """Bracket page: /statistik/saison-…/playoffs/spielplan."""
    games: List[Dict[str, Any]] = []
    if not html:
        return games

    markers: List[tuple[int, Optional[tuple[str, str]]]] = []
    for match in re.finditer(r'alt="([^"]+)" class="pologo"', html, re.I):
        mapped = _playoff_round(match.group(1))
        if mapped:
            markers.append((match.start(), mapped))
    for match in re.finditer(r"<h[1-6][^>]*>\s*([^<]*Playoff-Runde[^<]*)", html, re.I):
        mapped = _playoff_round(match.group(1))
        if mapped:
            markers.append((match.start(), mapped))
    markers.sort()

    series_starts = [match.start() for match in re.finditer(r'class="[^"]*singleseries', html, re.I)]
    for index, start in enumerate(series_starts):
        end = series_starts[index + 1] if index + 1 < len(series_starts) else len(html)
        block = html[start:end]
        current = None
        for pos, mapped in markers:
            if pos < start:
                current = mapped
            else:
                break
        if not current:
            continue
        phase_id, phase_label = current

        series_games: List[Dict[str, Any]] = []
        for match in re.finditer(
            r'href="/statistik/spieldetails/((?:\d{8})_([^/_]+)_gg_([^/_]+)_([^"/]+))"[^>]*>\s*([^<]+)',
            block,
            re.I,
        ):
            external_id = match.group(1)
            home_slug = match.group(2)
            away_slug = match.group(3)
            score_text = _strip_html(match.group(5))
            tail = block[match.end() : match.end() + 180]
            if re.search(r"\bOT\b", tail, re.I) and "OT" not in score_text.upper():
                score_text = f"{score_text} OT"
            home_id = team_mapper.resolve(slug=home_slug)
            away_id = team_mapper.resolve(slug=away_slug)
            home_name = team_mapper.team_name(home_id) if home_id else None
            away_name = team_mapper.team_name(away_id) if away_id else None
            if not home_id or not away_id:
                continue
            date_iso = _date_from_penny_id(external_id)
            score = _parse_score_block(score_text)
            series_games.append(
                {
                    "id": build_game_id(league, season, external_id),
                    "league_id": league.upper(),
                    "season_id": season,
                    "phase_id": phase_id,
                    "phase_label": phase_label,
                    "matchday": 0,
                    "date": date_iso,
                    "time": None,
                    "home_team_id": home_id,
                    "away_team_id": away_id,
                    "home_team_name": home_name or home_slug,
                    "away_team_name": away_name or away_slug,
                    "status": "final" if score else "scheduled",
                    "score": score or None,
                    "source": {
                        "provider": "penny_del",
                        "external_id": external_id,
                        "imported_at": datetime.utcnow().isoformat() + "Z",
                    },
                }
            )

        series_games.sort(key=lambda item: (item.get("date") or "", item.get("id") or ""))
        for game_number, game in enumerate(series_games, start=1):
            game["matchday"] = game_number
            games.append(game)

    return games


def discover_spielplan_month_paths(html: str) -> List[str]:
    """Extract /spielplan/monat/... paths from PENNY DEL month dropdown."""
    paths: List[str] = []
    seen: set[str] = set()
    for value, _label in re.findall(r'<option[^>]*value="([^"]*)"[^>]*>([^<]+)</option>', html, re.I):
        path = (value or "").strip()
        if "/spielplan/monat/" not in path:
            continue
        if path not in seen:
            seen.add(path)
            paths.append(path)
    return paths


def discover_spiele_month_paths(html: str) -> List[str]:
    """Extract /spiele/monat/... paths from PENNY DEL upcoming-schedule dropdown."""
    paths: List[str] = []
    seen: set[str] = set()
    for value, _label in re.findall(r'<option[^>]*value="([^"]*)"[^>]*>([^<]+)</option>', html, re.I):
        path = (value or "").strip()
        if "/spiele/monat/" not in path:
            continue
        if path not in seen:
            seen.add(path)
            paths.append(path)
    return paths


def _default_hauptrunde_month_paths(season_slug: str) -> List[str]:
    """Fallback when month dropdown is missing from HTML."""
    months = [
        "september",
        "oktober",
        "november",
        "dezember",
        "januar",
        "februar",
        "maerz",
        "april",
    ]
    return [f"/statistik/saison-{season_slug}/hauptrunde/spielplan/monat/{month}" for month in months]


def _default_spiele_month_paths() -> List[str]:
    """Fallback when /spiele month dropdown is missing."""
    months = [
        "september",
        "oktober",
        "november",
        "dezember",
        "januar",
        "februar",
        "maerz",
        "april",
    ]
    return [f"/spiele/monat/{month}" for month in months]


def _merge_games(
    target: List[Dict[str, Any]],
    seen_ids: set[str],
    parsed: List[Dict[str, Any]],
) -> int:
    added = 0
    for game in parsed:
        game_id = game.get("id")
        if game_id and game_id in seen_ids:
            continue
        if game_id:
            seen_ids.add(game_id)
        target.append(game)
        added += 1
    return added


class PennyDelScheduleImporter:
    def __init__(self, team_mapper: TeamCatalogMapper):
        self.team_mapper = team_mapper

    def _import_hauptrunde(self, season: str, *, league: str = "DEL") -> Dict[str, Any]:
        season_slug = season_to_del_url_slug(season)
        base_path = f"/statistik/saison-{season_slug}/hauptrunde/spielplan"
        base_url = f"https://www.penny-del.org{base_path}"

        errors: List[str] = []
        month_paths: List[str] = []
        base_html = fetch_html(base_url)
        if base_html and "team-schedule__date" in base_html:
            month_paths = discover_spielplan_month_paths(base_html)
        else:
            errors.append(f"Spielplan-Basis nicht abrufbar: {base_url}")

        if not month_paths:
            month_paths = _default_hauptrunde_month_paths(season_slug)
            errors.append("Monats-Dropdown nicht gefunden — Standard-Monatsliste verwendet")

        all_games: List[Dict[str, Any]] = []
        seen_ids: set[str] = set()
        months_fetched: List[str] = []

        for path in month_paths:
            url = f"https://www.penny-del.org{path}"
            html = fetch_html(url)
            if not html or "team-schedule__date" not in html:
                errors.append(f"Kein Spielplan: {url}")
                continue
            parsed = parse_schedule_html(
                html,
                league=league,
                season=season,
                phase_id="hauptrunde",
                phase_label="Hauptrunde",
                team_mapper=self.team_mapper,
            )
            added = _merge_games(all_games, seen_ids, parsed)
            if added:
                months_fetched.append(path.rsplit("/", 1)[-1])

        return {
            "season": season,
            "league": league,
            "games": all_games,
            "imported_count": len(all_games),
            "months_fetched": months_fetched,
            "import_source": "hauptrunde",
            "errors": errors,
        }

    def _import_playoffs(self, season: str, *, league: str = "DEL") -> Dict[str, Any]:
        season_slug = season_to_del_url_slug(season)
        url = f"https://www.penny-del.org/statistik/saison-{season_slug}/playoffs/spielplan"
        errors: List[str] = []
        html = fetch_html(url)
        if not html or "singleseries" not in html:
            errors.append(f"Playoff-Spielplan nicht abrufbar: {url}")
            return {
                "season": season,
                "league": league,
                "games": [],
                "imported_count": 0,
                "import_source": "playoffs",
                "errors": errors,
            }
        parsed = parse_playoff_html(html, league=league, season=season, team_mapper=self.team_mapper)
        if not parsed:
            errors.append(f"Keine Playoff-Spiele geparst: {url}")
        return {
            "season": season,
            "league": league,
            "games": parsed,
            "imported_count": len(parsed),
            "import_source": "playoffs",
            "errors": errors,
        }

    def _import_spiele_months(self, season: str, *, league: str = "DEL") -> Dict[str, Any]:
        """Upcoming-season fallback: /spiele/monat/* (used before statistik pages exist)."""
        base_url = "https://www.penny-del.org/spiele"
        errors: List[str] = []
        month_paths: List[str] = []

        base_html = fetch_html(base_url)
        if base_html and "team-schedule__date" in base_html:
            month_paths = discover_spiele_month_paths(base_html)
        else:
            errors.append(f"Spiele-Basis nicht abrufbar: {base_url}")

        if not month_paths:
            month_paths = _default_spiele_month_paths()
            errors.append("Spiele-Monats-Dropdown nicht gefunden — Standard-Monatsliste verwendet")

        all_games: List[Dict[str, Any]] = []
        seen_ids: set[str] = set()
        months_fetched: List[str] = []

        for path in month_paths:
            url = f"https://www.penny-del.org{path}"
            html = fetch_html(url)
            if not html or "team-schedule__date" not in html:
                errors.append(f"Kein Spielplan: {url}")
                continue
            parsed = parse_schedule_html(
                html,
                league=league,
                season=season,
                phase_id="hauptrunde",
                phase_label="Hauptrunde",
                team_mapper=self.team_mapper,
            )
            added = _merge_games(all_games, seen_ids, parsed)
            if added:
                months_fetched.append(path.rsplit("/", 1)[-1])

        return {
            "season": season,
            "league": league,
            "games": all_games,
            "imported_count": len(all_games),
            "months_fetched": months_fetched,
            "import_source": "spiele_monat",
            "errors": errors,
        }

    def _phase_candidates(self, season: str) -> List[Dict[str, str]]:
        season_slug = season_to_del_url_slug(season)
        return [
            {
                "id": "upcoming",
                "label": "Kommende Spiele",
                "paths": ["/spiele"],
            },
            {
                "id": "legacy",
                "label": "Legacy",
                "paths": [
                    f"/statistik/saison-{season_slug}/spielplan",
                ],
            },
        ]

    def import_season(
        self,
        season: str,
        *,
        league: str = "DEL",
        phases: Optional[List[Dict[str, str]]] = None,
    ) -> Dict[str, Any]:
        # Hauptrunde: scrape month-by-month from statistik (past/current published seasons)
        hauptrunde = self._import_hauptrunde(season, league=league)
        playoffs = self._import_playoffs(season, league=league)
        merged: List[Dict[str, Any]] = []
        seen_ids: set[str] = set()
        _merge_games(merged, seen_ids, hauptrunde.get("games") or [])
        _merge_games(merged, seen_ids, playoffs.get("games") or [])
        if merged:
            sources = []
            if hauptrunde.get("games"):
                sources.append("hauptrunde")
            if playoffs.get("games"):
                sources.append("playoffs")
            return {
                "season": season,
                "league": league,
                "games": merged,
                "imported_count": len(merged),
                "months_fetched": hauptrunde.get("months_fetched") or [],
                "import_source": "+".join(sources),
                "errors": list(hauptrunde.get("errors") or []) + list(playoffs.get("errors") or []),
            }

        # Upcoming season: PENNY DEL often has no statistik URL yet — use /spiele/monat/*
        spiele = self._import_spiele_months(season, league=league)
        if spiele.get("games"):
            return spiele

        phase_list = phases or self._phase_candidates(season)
        all_games: List[Dict[str, Any]] = list(hauptrunde.get("games") or [])
        errors: List[str] = list(hauptrunde.get("errors") or [])
        errors.extend(spiele.get("errors") or [])
        seen_ids: set[str] = {game.get("id") for game in all_games if game.get("id")}

        for phase in phase_list:
            paths = phase.get("paths") or ([phase["path"]] if phase.get("path") else [])
            for path in paths:
                url = f"https://www.penny-del.org{path}"
                html = fetch_html(url)
                if not html or "team-schedule__date" not in html:
                    errors.append(f"Kein Spielplan unter {url}")
                    continue
                parsed = parse_schedule_html(
                    html,
                    league=league,
                    season=season,
                    phase_id=phase["id"],
                    phase_label=phase.get("label") or phase["id"],
                    team_mapper=self.team_mapper,
                )
                if not parsed:
                    errors.append(f"Keine Spiele geparst: {url}")
                    continue
                _merge_games(all_games, seen_ids, parsed)
                break

        return {
            "season": season,
            "league": league,
            "games": all_games,
            "imported_count": len(all_games),
            "months_fetched": spiele.get("months_fetched") or hauptrunde.get("months_fetched") or [],
            "import_source": "legacy",
            "errors": errors,
        }
