"""
PENNY DEL Kaderimporter - Web Scraper und Upsert-Logik.

Dieser Importer lädt Spieler von der PENNY DEL Website und speichert sie
mit Upsert-Logik. Bestehende Beobachtungen werden geschützt.
"""

import json
import os
import re
from html import unescape
from datetime import datetime
from typing import Optional, Dict, Any, List
from urllib.request import urlopen


class PennyDelImporter:
    """Scraper und Upsert-Manager für PENNY DEL Kader."""

    def __init__(self, players_dir: str, config_path: str):
        """
        Args:
            players_dir: Pfad zu /data/academy/players/
            config_path: Pfad zur Team-Konfiguration
        """
        self.players_dir = players_dir
        self.config_path = config_path
        self._ensure_dir()
    
    def _ensure_dir(self):
        """Stellt sicher, dass das players_dir existiert."""
        os.makedirs(self.players_dir, exist_ok=True)

    def _load_team_configs(self) -> List[Dict[str, Any]]:
        if not os.path.exists(self.config_path):
            return []

        try:
            with open(self.config_path, "r", encoding="utf-8") as f:
                raw = json.load(f)
        except Exception as e:
            print(f"[Importer] Fehler beim Laden der Team-Konfiguration {self.config_path}: {e}")
            return []

        configs: List[Dict[str, Any]] = []
        for item in raw if isinstance(raw, list) else []:
            slug = (item.get("slug") or "").strip().lower()
            if not slug:
                continue
            configs.append(
                {
                    "id": slug.replace("-", "_"),
                    "slug": slug,
                    "catalog_id": (item.get("catalog_id") or slug.replace("-", "_")).strip(),
                    "team": (item.get("team") or slug).strip(),
                    "league": (item.get("league") or "PENNY DEL").strip(),
                    "url": (item.get("url") or "").strip(),
                    "overview_url": (item.get("overview_url") or "").strip(),
                    "kader_available": bool(item.get("kader_available", True)),
                    "kader_note": (item.get("kader_note") or "").strip(),
                    "enabled": bool(item.get("enabled", True)),
                }
            )
        return configs

    def list_teams(self, enabled_only: bool = False) -> List[Dict[str, Any]]:
        teams = self._load_team_configs()
        if enabled_only:
            teams = [team for team in teams if team.get("enabled")]
        return teams
    
    def fetch_raw_html(self, url: str) -> Optional[str]:
        """Lädt HTML von der PENNY DEL Website."""
        try:
            with urlopen(url, timeout=10) as response:
                return response.read().decode('utf-8', errors='ignore')
        except Exception as e:
            print(f"[Importer] Fehler beim Fetch von {url}: {e}")
            return None
    
    def parse_roster_sections(self, html: str, team_name: str, league: str) -> List[Dict[str, Any]]:
        """
        Parsed alle Kader-Positionssektionen (Forwards/Defense/Goalies).

        Importiert bewusst nur den Roster-Bereich (Kommentar-Marker) und ignoriert
        Leader/Top-Spieler/Statistik-Tabellen außerhalb der Sektionen.
        """
        players = []

        if not html:
            return players

        section_map = [
            ("Forwards", "forward", "Forward"),
            ("Defense", "defense", "Defender"),
            ("Goalies", "goalie", "Goalie"),
        ]

        for marker, position_group, position_label in section_map:
            section_match = re.search(
                rf"<!--\s*Roster:\s*{marker}\s*-->(.*?)<!--\s*Roster:\s*{marker}\s*/\s*End\s*-->",
                html,
                re.I | re.S,
            )
            if not section_match:
                continue

            section_html = section_match.group(1)
            table_match = re.search(r"<table[^>]*>.*?</table>", section_html, re.I | re.S)
            if not table_match:
                continue

            rows = re.findall(r"<tr[^>]*>(.*?)</tr>", table_match.group(0), re.I | re.S)
            for row_html in rows[1:]:
                cells = re.findall(r"<td[^>]*>(.*?)</td>", row_html, re.I | re.S)
                if len(cells) < 8:
                    continue
                try:
                    player_data = self._extract_player_from_row(
                        cells,
                        position_group=position_group,
                        position_label=position_label,
                        team_name=team_name,
                        league=league,
                    )
                    if player_data:
                        players.append(player_data)
                except Exception as e:
                    print(f"[Importer] Parsing-Fehler bei Row ({marker}): {e}")

        return players

    def _extract_player_from_row(
        self,
        cells: list,
        position_group: str,
        position_label: str,
        team_name: str,
        league: str,
    ) -> Optional[Dict[str, Any]]:
        """
        Extrahiert Spielerdaten aus einer Tabellenzeile.
        
        Erwartet Tabelle: [Nr, Bild, Name, Nationalität, Seite, Alter, Größe, Gewicht, Geburtsort]
        """
        try:
            jersey_text = self._strip_html(cells[0])
            name_text = self._strip_html(cells[2]) if len(cells) > 2 else ""

            nationality = self._strip_html(cells[3]) if len(cells) > 3 else ""
            shoots_text = self._strip_html(cells[4]) if len(cells) > 4 else ""
            age_text = self._strip_html(cells[5]) if len(cells) > 5 else ""
            height_text = self._strip_html(cells[6]) if len(cells) > 6 else ""
            weight_text = self._strip_html(cells[7]) if len(cells) > 7 else ""
            birthplace = self._strip_html(cells[8]) if len(cells) > 8 else ""
            
            if not name_text:
                return None
            
            # Parse numerische Werte
            jersey_num = self._extract_int(jersey_text)
            age = self._extract_int(age_text)
            height_cm = self._extract_int(height_text)
            weight_kg = self._extract_float(weight_text)
            
            return {
                "player_name": name_text,
                "jersey_number": jersey_num,
                "position": position_label,
                "position_group": position_group,
                "nationality": nationality or None,
                "age": age,
                "height_cm": height_cm,
                "weight_kg": weight_kg,
                "birthplace": birthplace or None,
                "shoots_or_catches": shoots_text or None,
                "team": team_name,
                "league": league,
                "source": "PENNY DEL",
                "active": True
            }
        except Exception as e:
            print(f"[Importer] Fehler bei Player-Extraktion: {e}")
            return None
    
    def _extract_int(self, text: str) -> Optional[int]:
        """Extrahiert erste Ganzzahl aus Text."""
        if not text:
            return None
        match = re.search(r'\d+', text)
        return int(match.group()) if match else None
    
    def _extract_float(self, text: str) -> Optional[float]:
        """Extrahiert erste Dezimalzahl aus Text."""
        if not text:
            return None
        match = re.search(r'\d+[.,]\d+|\d+', text)
        if match:
            return float(match.group().replace(',', '.'))
        return None

    def _strip_html(self, html_fragment: str) -> str:
        text = re.sub(r"<[^>]+>", " ", html_fragment or "")
        return unescape(" ".join(text.split()))
    
    def _get_player_id(self, player_name: str) -> str:
        """Generiert player_id aus Name (lowercase, no spaces)."""
        return re.sub(r'[^a-z0-9_-]', '', player_name.lower().replace(' ', '_'))
    
    def _load_team_players(self, team_id: str) -> Dict[str, Dict[str, Any]]:
        """Lädt existierende Spieler für ein Team."""
        team_file = os.path.join(self.players_dir, f"{team_id}_players.json")
        if os.path.exists(team_file):
            try:
                with open(team_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    return {p['player_id']: p for p in data.get('players', [])}
            except Exception as e:
                print(f"[Importer] Fehler beim Laden von {team_file}: {e}")
        return {}
    
    def _save_team_players(self, team_id: str, players: Dict[str, Dict[str, Any]]):
        """Speichert Spieler für ein Team."""
        team_file = os.path.join(self.players_dir, f"{team_id}_players.json")
        try:
            data = {
                "team_id": team_id,
                "updated_at": datetime.utcnow().isoformat() + "Z",
                "players": list(players.values())
            }
            os.makedirs(os.path.dirname(team_file), exist_ok=True)
            with open(team_file, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
        except Exception as e:
            print(f"[Importer] Fehler beim Speichern von {team_file}: {e}")
    
    def upsert_players(self, team_id: str, new_players: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Upsert-Logik: Aktualisiert oder erstellt Spieler.
        
        - Existierende Beobachtungen bleiben geschützt
        - Inaktive Spieler werden als active=false markiert (nicht gelöscht)
        - Neue Spieler erhalten observation_count=0, summary=""
        """
        existing = self._load_team_players(team_id)
        updated_players = {}
        
        stats = {
            "created": 0,
            "updated": 0,
            "reactivated": 0
        }
        
        # Verarbeite neue Spieler
        for new_player_data in new_players:
            player_id = self._get_player_id(new_player_data['player_name'])
            
            if player_id in existing:
                # Update existierenden Spieler
                existing_player = existing[player_id]
                was_active = existing_player.get('active', True)
                existing_player.update({
                    k: v for k, v in new_player_data.items()
                    if k not in ['observation_count', 'summary', 'last_observed', 'player_id']
                })
                existing_player['active'] = True
                if not was_active:
                    stats['reactivated'] += 1
                else:
                    stats['updated'] += 1
                updated_players[player_id] = existing_player
            else:
                # Neuer Spieler
                new_player = {
                    **new_player_data,
                    "player_id": player_id,
                    "observation_count": 0,
                    "summary": "",
                    "last_observed": None,
                    "created_at": datetime.utcnow().isoformat() + "Z"
                }
                updated_players[player_id] = new_player
                stats['created'] += 1
        
        # Markiere Spieler, die nicht mehr im Kader sind, als inaktiv
        for player_id, player in existing.items():
            if player_id not in updated_players:
                # Nur inaktiv markieren wenn noch nicht inaktiv
                if player.get('active', True):
                    player['active'] = False
                    updated_players[player_id] = player
        
        # Speichere aktualisierte Spieler
        self._save_team_players(team_id, updated_players)
        
        return {
            "team_id": team_id,
            "total_players": len(updated_players),
            "active_players": sum(1 for p in updated_players.values() if p.get('active', True)),
            **stats
        }
    
    def import_team(self, team_id: str) -> Dict[str, Any]:
        teams = self._load_team_configs()
        team_cfg = next((item for item in teams if item.get("id") == team_id), None)
        if not team_cfg:
            return {"error": f"Kein konfiguriertes Team für team_id '{team_id}' gefunden"}
        if not team_cfg.get("enabled"):
            return {"error": f"Team '{team_id}' ist deaktiviert"}
        if not team_cfg.get("kader_available", True):
            note = team_cfg.get("kader_note") or "Kader-Seite bei PENNY-DEL noch nicht verfügbar"
            return {
                "error": note,
                "kader_pending": True,
                "team_id": team_id,
                "overview_url": team_cfg.get("overview_url") or "",
            }

        url = team_cfg.get("url")
        if not url:
            return {"error": f"Keine URL für Team {team_id} definiert"}

        html = self.fetch_raw_html(url)
        if not html:
            return {
                "error": "Kader-Seite nicht erreichbar (404 oder Netzwerkfehler)",
                "kader_pending": True,
                "team_id": team_id,
                "url": url,
            }

        players = self.parse_roster_sections(html, team_cfg.get("team") or team_id, team_cfg.get("league") or "PENNY DEL")
        if not players:
            return {"error": "Keine Spieler gefunden - möglicherweise hat sich die HTML-Struktur geändert"}

        result = self.upsert_players(team_id, players)
        result["team"] = team_cfg.get("team")
        result["league"] = team_cfg.get("league")
        result["slug"] = team_cfg.get("slug")
        result["imported_count"] = len(players)
        result["url"] = url
        return result

    def import_all_enabled(self) -> List[Dict[str, Any]]:
        results: List[Dict[str, Any]] = []
        for team in self.list_teams(enabled_only=True):
            results.append(self.import_team(team.get("id") or ""))
        return results


def batch_import_all_teams(players_dir: str, config_path: str) -> List[Dict[str, Any]]:
    """
    Importiert alle konfigurierten Teams.
    
    Derzeit nur ERC Ingolstadt. Später können weitere Teams hinzugefügt werden.
    """
    importer = PennyDelImporter(players_dir, config_path)
    return importer.import_all_enabled()
