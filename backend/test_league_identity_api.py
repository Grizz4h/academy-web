"""External Tank API emits DNL; catalog lookup still serves U20 DNL teams."""

from __future__ import annotations

import json
import os
import sys
import tempfile
import unittest
from pathlib import Path
from unittest import mock

os.environ["ACADEMY_JWT_SECRET"] = "test-jwt-secret-phase1-hardening-32chars-min"
os.environ["ACADEMY_SKIP_IDENTITY_MIGRATION"] = "1"
os.environ["STORAGE_BACKEND"] = "json"

BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from fastapi.testclient import TestClient
from identity.context import AuthContext

import main as backend_main

OWNER = "user-league-identity-tests"


def _auth() -> AuthContext:
    return AuthContext(
        rinq_user_id=OWNER,
        auth_provider="legacy_password",
        auth_subject="alice",
        display_name="Alice",
        legacy_username="alice",
    )


class TeamsLeagueIdentityApiTests(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(backend_main.app)

    def tearDown(self):
        self.client.close()

    def test_get_teams_dnl_returns_u20_catalog_as_dnl(self):
        response = self.client.get("/api/teams", params={"league": "DNL", "season": "2026/27"})
        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["league"], "DNL")
        names = [team["name"] for team in payload["teams"]]
        self.assertIn("ERC Ingolstadt U20", names)
        ids = [team["id"] for team in payload["teams"]]
        self.assertIn("erc_ingolstadt", ids)

    def test_get_teams_legacy_u20_dnl_alias(self):
        canonical = self.client.get("/api/teams", params={"league": "DNL", "season": "2026/27"}).json()
        legacy = self.client.get("/api/teams", params={"league": "U20_DNL", "season": "2026/27"}).json()
        self.assertEqual(legacy["league"], "DNL")
        self.assertEqual([t["id"] for t in legacy["teams"]], [t["id"] for t in canonical["teams"]])

    def test_other_leagues_unchanged(self):
        del_res = self.client.get("/api/teams", params={"league": "DEL", "season": "2026/27"})
        self.assertEqual(del_res.status_code, 200)
        self.assertEqual(del_res.json()["league"], "DEL")
        nhl = self.client.get("/api/teams", params={"league": "NHL"})
        self.assertEqual(nhl.status_code, 200)
        self.assertEqual(nhl.json()["league"], "NHL")


class SceneLeagueIdentityApiTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        root = Path(self.tmp.name)
        self.scenes_dir = root / "scenes"
        self.scenes_dir.mkdir()
        self.prev_dir = backend_main.SCENES_DIR
        backend_main.SCENES_DIR = str(self.scenes_dir)
        counter = root / "scene_code_counter.json"
        counter.write_text(json.dumps({"prefix": "SC", "last_number": 400}), encoding="utf-8")
        self.prev_counter = getattr(backend_main, "SCENE_CODE_COUNTER_FILE", None)
        backend_main.SCENE_CODE_COUNTER_FILE = str(counter)
        backend_main.app.dependency_overrides[backend_main.get_current_user] = _auth
        self.creator_patch = mock.patch("main.is_creator_mode_auth", return_value=True)
        self.creator_patch.start()
        self.client = TestClient(backend_main.app)

    def tearDown(self):
        self.client.close()
        self.creator_patch.stop()
        backend_main.app.dependency_overrides.clear()
        backend_main.SCENES_DIR = self.prev_dir
        if self.prev_counter is not None:
            backend_main.SCENE_CODE_COUNTER_FILE = self.prev_counter
        self.tmp.cleanup()

    def _write_scene(self, payload: dict) -> Path:
        scene_id = str(payload["id"])
        path = self.scenes_dir / "2026" / "10" / f"{scene_id}.json"
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps(payload, ensure_ascii=False), encoding="utf-8")
        return path

    def test_legacy_persisted_u20_dnl_emits_dnl_without_rewriting_file(self):
        path = self._write_scene(
            {
                "id": "scene_legacy_dnl",
                "scene_code": "SC401",
                "user": OWNER,
                "team_home": "ERC Ingolstadt U20",
                "team_away": "ESV Kaufbeuren U20",
                "league": "U20_DNL",
                "season": "2026/27",
                "period": "P1",
                "game_time": "5:00",
                "source": {"type": "manual"},
                "status": "NEW",
                "created_at": "2026-10-06T10:00:00",
            }
        )
        listed = self.client.get("/api/scenes", params={"league": "DNL"})
        self.assertEqual(listed.status_code, 200)
        scenes = listed.json()["scenes"]
        self.assertEqual(len(scenes), 1)
        self.assertEqual(scenes[0]["league"], "DNL")
        self.assertEqual(scenes[0]["id"], "scene_legacy_dnl")
        self.assertEqual(scenes[0]["scene_code"], "SC401")
        single = self.client.get("/api/scenes/scene_legacy_dnl")
        self.assertEqual(single.status_code, 200)
        self.assertEqual(single.json()["league"], "DNL")
        stored = json.loads(path.read_text(encoding="utf-8"))
        self.assertEqual(stored["league"], "U20_DNL")

        alias_filter = self.client.get("/api/scenes", params={"league": "U20_DNL"})
        self.assertEqual(len(alias_filter.json()["scenes"]), 1)

    def test_create_and_put_persist_dnl(self):
        created = self.client.post(
            "/api/scenes",
            json={
                "game_time": "8:12",
                "league": "U20_DNL",
                "season": "2026/27",
                "team_home": "ERC Ingolstadt U20",
                "team_away": "ESV Kaufbeuren U20",
                "period": "P2",
                "source": {"type": "manual"},
            },
        )
        self.assertEqual(created.status_code, 200, created.text)
        body = created.json()
        self.assertEqual(body["league"], "DNL")
        scene_id = body["id"]
        on_disk = json.loads(next(Path(self.scenes_dir).rglob(f"{scene_id}.json")).read_text(encoding="utf-8"))
        self.assertEqual(on_disk["league"], "DNL")

        updated = self.client.put(f"/api/scenes/{scene_id}", json={"league": "U20_DNL"})
        self.assertEqual(updated.status_code, 200)
        self.assertEqual(updated.json()["league"], "DNL")
        on_disk = json.loads(next(Path(self.scenes_dir).rglob(f"{scene_id}.json")).read_text(encoding="utf-8"))
        self.assertEqual(on_disk["league"], "DNL")

    def test_new_write_dnl_stays_dnl(self):
        created = self.client.post(
            "/api/scenes",
            json={
                "game_time": "1:00",
                "league": "DNL",
                "season": "2026/27",
                "source": {"type": "manual"},
            },
        )
        self.assertEqual(created.status_code, 200, created.text)
        self.assertEqual(created.json()["league"], "DNL")


class GamesLeagueIdentityApiTests(unittest.TestCase):
    def setUp(self):
        backend_main.app.dependency_overrides[backend_main.get_current_user] = _auth
        self.client = TestClient(backend_main.app)

    def tearDown(self):
        self.client.close()
        backend_main.app.dependency_overrides.clear()

    def test_get_games_dnl_emits_domain_league_keeps_ids(self):
        response = self.client.get("/api/games", params={"league": "DNL", "season": "2026/27"})
        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["league"], "DNL")
        self.assertGreater(payload["total"], 0)
        first = payload["games"][0]
        self.assertEqual(first["league_id"], "DNL")
        self.assertTrue(str(first["id"]).startswith("u20_dnl:"))
        self.assertNotEqual(first.get("home_team_id"), first.get("away_team_id") or "x")

        alias = self.client.get("/api/games", params={"league": "U20_DNL", "season": "2026/27"})
        self.assertEqual(alias.status_code, 200)
        self.assertEqual(alias.json()["league"], "DNL")
        self.assertEqual(alias.json()["total"], payload["total"])

    def test_del_games_unchanged(self):
        response = self.client.get("/api/games", params={"league": "DEL", "season": "2026/27"})
        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["league"], "DEL")
        if payload["games"]:
            self.assertEqual(payload["games"][0]["league_id"], "DEL")


if __name__ == "__main__":
    unittest.main()
