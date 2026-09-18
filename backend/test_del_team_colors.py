"""DEL primary/secondary club colors on the teams catalog."""

from __future__ import annotations

import json
import os
import re
import sys
import unittest
from pathlib import Path

os.environ["ACADEMY_JWT_SECRET"] = "test-jwt-secret-phase1-hardening-32chars-min"
os.environ["ACADEMY_SKIP_IDENTITY_MIGRATION"] = "1"
os.environ["STORAGE_BACKEND"] = "json"

BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from fastapi.testclient import TestClient

import main as backend_main

HEX = re.compile(r"^#[0-9A-F]{6}$")
REPO = Path(BACKEND_DIR).resolve().parent
ACADEMY_COLORS = REPO / "data" / "academy" / "del_team_colors.json"
FRONTEND_COLORS = REPO / "frontend" / "src" / "data" / "delTeamColors.json"
TEAMS_CATALOG = REPO / "data" / "academy" / "teams.json"


def _palette_ids(raw: dict) -> list[str]:
    return sorted(key for key in raw if not str(key).startswith("_"))


class DelTeamColorTests(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(backend_main.app)

    def tearDown(self):
        self.client.close()

    def test_frontend_mirror_matches_academy_source(self):
        academy = json.loads(ACADEMY_COLORS.read_text(encoding="utf-8"))
        frontend = json.loads(FRONTEND_COLORS.read_text(encoding="utf-8"))
        self.assertEqual(_palette_ids(academy), _palette_ids(frontend))
        for team_id in _palette_ids(academy):
            self.assertEqual(academy[team_id], frontend[team_id], team_id)

    def test_every_catalog_team_has_hex_pair(self):
        catalog = json.loads(TEAMS_CATALOG.read_text(encoding="utf-8"))
        colors = json.loads(ACADEMY_COLORS.read_text(encoding="utf-8"))
        ids = {
            team["id"]
            for teams in (catalog.get("seasons") or {}).values()
            for team in teams
        }
        self.assertEqual(sorted(ids), _palette_ids(colors))
        for team_id in ids:
            pair = colors[team_id]
            self.assertRegex(pair["primaryColor"].upper(), HEX.pattern)
            self.assertRegex(pair["secondaryColor"].upper(), HEX.pattern)
            self.assertNotEqual(pair["primaryColor"].upper(), pair["secondaryColor"].upper())

    def test_api_teams_includes_del_colors(self):
        response = self.client.get("/api/teams", params={"league": "DEL", "season": "2026/27"})
        self.assertEqual(response.status_code, 200)
        teams = response.json()["teams"]
        self.assertGreaterEqual(len(teams), 14)
        berlin = next(team for team in teams if team["id"] == "eisbaren_berlin")
        self.assertEqual(berlin["primaryColor"], "#003087")
        self.assertEqual(berlin["secondaryColor"], "#CC0C24")
        for team in teams:
            self.assertRegex(team["primaryColor"], HEX.pattern)
            self.assertRegex(team["secondaryColor"], HEX.pattern)

        previous = self.client.get("/api/teams", params={"league": "DEL", "season": "2025/26"})
        self.assertEqual(previous.status_code, 200)
        dresden = next(team for team in previous.json()["teams"] if team["id"] == "eislowen_dresden")
        self.assertEqual(dresden["primaryColor"], "#001848")
        self.assertEqual(dresden["secondaryColor"], "#009CE4")

    def test_api_other_leagues_do_not_get_del_colors(self):
        response = self.client.get("/api/teams", params={"league": "NHL"})
        self.assertEqual(response.status_code, 200)
        teams = response.json()["teams"]
        self.assertTrue(teams)
        self.assertNotIn("primaryColor", teams[0])
        self.assertNotIn("secondaryColor", teams[0])


if __name__ == "__main__":
    unittest.main()
