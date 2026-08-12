"""PENNY DEL schedule importer — Hauptrunde spielplan pages."""

from __future__ import annotations

import re
from datetime import datetime
from html import unescape
from typing import Any, Dict, List, Optional
from urllib.request import urlopen

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
        with urlopen(url, timeout=15) as response:
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
        team_names = [
            _strip_html(name)
            for name in re.findall(r'team-meta__name[^>]*>\s*<a[^>]*>([^<]+)</a>', row, re.S | re.I)
        ]
        team_slugs = re.findall(r'href="/teams/([^/]+)/', row)
        detail_links = re.findall(r'href="(/statistik/spieldetails/[^"]+)"', row)
        status_cells = [
            _strip_html(cell)
            for cell in re.findall(r'team-schedule__status[^>]*>(.*?)</td>', row, re.S | re.I)
        ]

        if len(team_names) < 2:
            continue

        home_name, away_name = team_names[0], team_names[1]
        home_slug = team_slugs[0] if team_slugs else None
        away_slug = team_slugs[1] if len(team_slugs) > 1 else None
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
        if hauptrunde.get("games"):
            return hauptrunde

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
