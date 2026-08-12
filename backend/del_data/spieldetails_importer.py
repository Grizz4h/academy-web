"""PENNY DEL spieldetails scraper — team match stats + player boxscore (experimental)."""

from __future__ import annotations

import re
import time
from datetime import datetime
from html import unescape
from typing import Any, Dict, List, Optional, Tuple

from .schedule_importer import fetch_html
from .team_mapping import TeamCatalogMapper


BASE_URL = "https://www.penny-del.org"

STAT_KEY_MAP = {
    "schüsse auf tor": "shots_on_goal",
    "schusse auf tor": "shots_on_goal",
    "schusseffizienz": "shooting_pct",
    "schüsse gesamt": "total_shots",
    "schusse gesamt": "total_shots",
    "strafminuten": "penalty_minutes",
    "powerplays": "power_plays",
    "powerplaytore": "power_play_goals",
    "powerplayquote": "power_play_pct",
    "unterzahltore": "shorthanded_goals",
    "bullies gewonnen": "faceoffs_won",
}


def _strip_html(value: str) -> str:
    text = re.sub(r"<[^>]+>", " ", value or "")
    return unescape(" ".join(text.split()))


def _normalize_stat_key(label: str) -> str:
    raw = (label or "").strip().lower()
    raw = raw.replace("ä", "a").replace("ö", "o").replace("ü", "u")
    return STAT_KEY_MAP.get(raw, re.sub(r"[^a-z0-9]+", "_", raw).strip("_"))


def _parse_numeric(value: str) -> Any:
    raw = (value or "").strip().replace(",", ".")
    if not raw:
        return None
    if raw.endswith("%"):
        try:
            return float(raw[:-1])
        except ValueError:
            return raw
    if re.fullmatch(r"-?\d+", raw):
        return int(raw)
    if re.fullmatch(r"-?\d+\.\d+", raw):
        return float(raw)
    return raw


def parse_match_statistics(html: str) -> Dict[str, Dict[str, Any]]:
    """Extract Match Statistics grid (home = first value, away = second)."""
    stats: Dict[str, Dict[str, Any]] = {}
    if not html:
        return stats

    blocks = re.findall(
        r'progress-labels__title">([^<]+)</div>.*?'
        r'progress-labels__value">([^<]+)</div>\s*'
        r'<div class="progress-labels__value">([^<]+)</div>',
        html,
        re.S | re.I,
    )
    for label, home_raw, away_raw in blocks:
        key = _normalize_stat_key(_strip_html(label))
        if not key:
            continue
        stats[key] = {
            "label": _strip_html(label),
            "home": _parse_numeric(_strip_html(home_raw)),
            "away": _parse_numeric(_strip_html(away_raw)),
        }
    return stats


def _parse_player_row(cells: List[str], position_group: str) -> Optional[Dict[str, Any]]:
    if len(cells) < 4:
        return None
    number = _strip_html(cells[0])
    name = _strip_html(cells[2])
    if not name or name.lower() in {"spieler", "name"}:
        return None

    def cell(index: int) -> Any:
        if index >= len(cells):
            return None
        return _parse_numeric(_strip_html(cells[index])) or _strip_html(cells[index]) or None

    if position_group == "goalie":
        return {
            "number": number,
            "name": name,
            "position_group": position_group,
            "decision": cell(3),
            "shots_against": cell(4),
            "goals_against": cell(5),
            "saves": cell(6),
            "save_pct": cell(7),
            "toi": cell(8),
        }

    return {
        "number": number,
        "name": name,
        "position_group": position_group,
        "goals": cell(3),
        "assists": cell(4),
        "points": cell(5),
        "plus_minus": cell(6),
        "pim": cell(7),
        "sog": cell(8),
        "blocks": cell(9),
        "fow": cell(10),
        "fol": cell(11),
        "fo_pct": cell(12),
        "shifts": cell(13),
        "toi": cell(14),
        "pp_toi": cell(15) if len(cells) > 15 else None,
        "sh_toi": cell(16) if len(cells) > 16 else None,
    }


def _parse_boxscore_team_block(block_html: str) -> Tuple[str, List[Dict[str, Any]]]:
    team_match = re.search(r'team-meta__name">([^<]+)<', block_html, re.I)
    team_name = _strip_html(team_match.group(1)) if team_match else ""

    players: List[Dict[str, Any]] = []
    position_group = "forward"

    row_pattern = re.compile(r"<tr>\s*(.*?)\s*</tr>", re.S | re.I)
    cell_pattern = re.compile(r"<td[^>]*>(.*?)</td>", re.S | re.I)

    for row_html in row_pattern.findall(block_html):
        row_text = _strip_html(row_html).lower()
        if "stürmer" in row_text or "stuermer" in row_text:
            position_group = "forward"
            continue
        if "verteidiger" in row_text:
            position_group = "defense"
            continue
        if "torhüter" in row_text or "torhueter" in row_text:
            position_group = "goalie"
            continue
        if "alc-player-info__name" not in row_html and "alc-number" not in row_html:
            continue

        cells = [_strip_html(cell) for cell in cell_pattern.findall(row_html)]
        player = _parse_player_row(cells, position_group)
        if player:
            players.append(player)

    return team_name, players


def parse_boxscore_html(html: str, team_mapper: TeamCatalogMapper) -> List[Dict[str, Any]]:
    """Parse both team tables from /boxscore page."""
    teams: List[Dict[str, Any]] = []
    if not html:
        return teams

    blocks = re.findall(
        r'<div class="card card--has-table">(.*?)</div>\s*<!--\s*Box Score - Team',
        html + "\n<!-- Box Score - Team END -->",
        re.S | re.I,
    )
    if not blocks:
        blocks = re.findall(
            r'<div class="card card--has-table">(.*?)(?=<div class="card card--has-table">|$)',
            html,
            re.S | re.I,
        )

    for block in blocks:
        if "team-meta__name" not in block or "alc-table-stats" not in block:
            continue
        team_name, players = _parse_boxscore_team_block(block)
        if not team_name:
            continue
        team_id = team_mapper.resolve(name=team_name)
        teams.append(
            {
                "team_id": team_id,
                "team_name": team_name,
                "players": players,
            }
        )
    return teams


class PennyDelSpieldetailsImporter:
    def __init__(self, team_mapper: TeamCatalogMapper):
        self.team_mapper = team_mapper

    def fetch_game_stats(self, external_id: str) -> Dict[str, Any]:
        external_id = (external_id or "").strip().strip("/")
        if not external_id:
            return {"ok": False, "errors": ["external_id fehlt"]}

        overview_url = f"{BASE_URL}/statistik/spieldetails/{external_id}"
        boxscore_url = f"{overview_url}/boxscore"

        overview_html = fetch_html(overview_url)
        if not overview_html:
            return {"ok": False, "errors": [f"Übersicht nicht erreichbar: {overview_url}"]}

        boxscore_html = fetch_html(boxscore_url)
        errors: List[str] = []
        if not boxscore_html:
            errors.append(f"Boxscore nicht erreichbar: {boxscore_url}")

        team_stats = parse_match_statistics(overview_html)
        player_stats = parse_boxscore_html(boxscore_html or "", self.team_mapper)

        if not team_stats and not player_stats:
            return {
                "ok": False,
                "errors": errors or ["Keine Statistik-Daten auf der Seite gefunden"],
            }

        return {
            "ok": True,
            "external_id": external_id,
            "overview_url": overview_url,
            "boxscore_url": boxscore_url,
            "team_stats": team_stats,
            "player_stats": player_stats,
            "errors": errors,
            "imported_at": datetime.utcnow().isoformat() + "Z",
        }

    def import_games_batch(
        self,
        games: List[Dict[str, Any]],
        *,
        limit: int = 5,
        delay_seconds: float = 0.35,
        skip_existing: bool = True,
    ) -> Dict[str, Any]:
        results: List[Dict[str, Any]] = []
        processed = 0

        for game in games:
            if processed >= limit:
                break
            if skip_existing and (game.get("stats") or {}).get("imported_at"):
                continue
            external_id = (game.get("source") or {}).get("external_id")
            if not external_id:
                results.append(
                    {
                        "game_id": game.get("id"),
                        "ok": False,
                        "error": "Keine spieldetails external_id",
                    }
                )
                continue

            payload = self.fetch_game_stats(external_id)
            results.append(
                {
                    "game_id": game.get("id"),
                    "external_id": external_id,
                    "ok": payload.get("ok"),
                    "stats": payload if payload.get("ok") else None,
                    "error": None if payload.get("ok") else "; ".join(payload.get("errors") or []),
                    "warnings": payload.get("errors") or [],
                }
            )
            processed += 1
            if delay_seconds > 0:
                time.sleep(delay_seconds)

        ok_count = sum(1 for item in results if item.get("ok"))
        fail_count = sum(1 for item in results if not item.get("ok"))
        return {
            "attempted": len(results),
            "imported": ok_count,
            "failed": fail_count,
            "results": results,
        }
