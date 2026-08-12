"""Map PENNY DEL slugs / team names to canonical catalog team IDs."""

from __future__ import annotations

import json
import os
import re
from typing import Dict, Optional


def _normalize_name(value: str) -> str:
    text = (value or "").strip().lower()
    text = text.replace("ä", "a").replace("ö", "o").replace("ü", "u").replace("ß", "ss")
    return re.sub(r"[^a-z0-9]+", " ", text).strip()


class TeamCatalogMapper:
    def __init__(self, teams_json_path: str):
        self.teams_json_path = teams_json_path
        self._name_to_id: Dict[str, str] = {}
        self._id_to_name: Dict[str, str] = {}
        self._slug_to_id: Dict[str, str] = {}
        self._reload()

    def _reload(self) -> None:
        self._name_to_id = {}
        self._id_to_name = {}
        self._slug_to_id = {}
        if not os.path.exists(self.teams_json_path):
            return
        with open(self.teams_json_path, "r", encoding="utf-8") as handle:
            catalog = json.load(handle)
        seasons = catalog.get("seasons") or {}
        for teams in seasons.values():
            if not isinstance(teams, list):
                continue
            for team in teams:
                team_id = (team.get("id") or "").strip()
                name = (team.get("name") or "").strip()
                if not team_id or not name:
                    continue
                self._id_to_name[team_id] = name
                self._name_to_id[_normalize_name(name)] = team_id
                self._slug_to_id[team_id.replace("_", "-")] = team_id

        # Common PENNY DEL aliases
        aliases = {
            "pinguins bremerhaven": "fischtown_pinguins",
            "fischtown pinguins": "fischtown_pinguins",
            "ehc red bull munchen": "red_bull_munchen",
            "ehc red bull muenchen": "red_bull_munchen",
            "lowen frankfurt": "lowen_frankfurt",
            "loewen frankfurt": "lowen_frankfurt",
            "kolner haie": "kolner_haie",
            "krefeld pinguine": "krefeld_pinguine",
            "nuernberg ice tigers": "nurnberg_ice_tigers",
            "nurnberg ice tigers": "nurnberg_ice_tigers",
            "dresdner eislowen": "eislowen_dresden",
            "dresdner eisloewen": "eislowen_dresden",
            "dresdner eislöwen": "eislowen_dresden",
            "eislowen dresden": "eislowen_dresden",
        }
        for alias, team_id in aliases.items():
            self._name_to_id[alias] = team_id

        slug_aliases = {
            "dresdner-eisloewen": "eislowen_dresden",
            "krefeld-pinguine": "krefeld_pinguine",
        }
        for slug, team_id in slug_aliases.items():
            self._slug_to_id[slug] = team_id

    def register_slug(self, slug: str, catalog_id: str) -> None:
        if slug and catalog_id:
            self._slug_to_id[slug.replace("_", "-")] = catalog_id
            self._slug_to_id[slug.replace("-", "_")] = catalog_id

    def resolve(self, *, slug: Optional[str] = None, name: Optional[str] = None, team_id: Optional[str] = None) -> Optional[str]:
        if team_id and team_id in self._id_to_name:
            return team_id
        if slug:
            normalized = slug.strip().lower()
            if normalized in self._slug_to_id:
                return self._slug_to_id[normalized]
            underscored = normalized.replace("-", "_")
            if underscored in self._id_to_name:
                return underscored
        if name:
            resolved = self._name_to_id.get(_normalize_name(name))
            if resolved:
                return resolved
        return None

    def team_name(self, team_id: str) -> Optional[str]:
        return self._id_to_name.get(team_id)
