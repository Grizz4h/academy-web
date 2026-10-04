"""GET /api/scenes/{scene_id} — single Scene Pool document addressability."""

from __future__ import annotations

import json
import os
import sys
import tempfile
import unittest
from pathlib import Path

os.environ["ACADEMY_JWT_SECRET"] = "test-jwt-secret-phase1-hardening-32chars-min"
os.environ["ACADEMY_SKIP_IDENTITY_MIGRATION"] = "1"
os.environ["STORAGE_BACKEND"] = "json"

BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from fastapi.testclient import TestClient
from identity.context import AuthContext

import main as backend_main

OWNER = "user-scene-get-tests"
OTHER = "someone-else"


def _auth() -> AuthContext:
    return AuthContext(
        rinq_user_id=OWNER,
        auth_provider="legacy_password",
        auth_subject="alice",
        display_name="Alice",
        legacy_username="alice",
    )


class SceneGetApiTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.scenes_dir = Path(self.tmp.name) / "scenes"
        self.scenes_dir.mkdir()
        self.prev_dir = backend_main.SCENES_DIR
        backend_main.SCENES_DIR = str(self.scenes_dir)
        backend_main.app.dependency_overrides[backend_main.get_current_user] = _auth
        self.client = TestClient(backend_main.app)

    def tearDown(self):
        self.client.close()
        backend_main.app.dependency_overrides.clear()
        backend_main.SCENES_DIR = self.prev_dir
        self.tmp.cleanup()

    def _write_scene(self, payload: dict) -> Path:
        """Persist like create_scene: filename == Scene.id."""
        scene_id = str(payload["id"])
        path = self.scenes_dir / "2026" / "09" / f"{scene_id}.json"
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps(payload, ensure_ascii=False), encoding="utf-8")
        return path

    def test_get_scene_by_id_returns_200(self):
        self._write_scene(
            {
                "id": "scene_1782650644_bc413f",
                "scene_code": "SC041",
                "user": OWNER,
                "team_home": "ERC Ingolstadt",
                "team_away": "EHC Red Bull München",
                "league": "DEL",
                "season": "2026/27",
                "period": "P3",
                "game_time": "4:28",
                "note": "Board battle left",
                "rating": 4,
                "status": "NEW",
                "source": {"type": "manual"},
                "created_at": "2026-09-18T10:00:00",
            },
        )
        res = self.client.get("/api/scenes/scene_1782650644_bc413f")
        self.assertEqual(res.status_code, 200)
        scene = res.json()
        self.assertEqual(scene["id"], "scene_1782650644_bc413f")
        self.assertEqual(scene["scene_code"], "SC041")
        self.assertEqual(scene["note"], "Board battle left")
        self.assertEqual(scene["rating"], 4)

    def test_get_scene_matches_list_dto_and_asset_name(self):
        self._write_scene(
            {
                "id": "scene_mine",
                "scene_code": "SC041",
                "user": OWNER,
                "team_home": "ERC Ingolstadt",
                "team_away": "EHC Red Bull München",
                "league": "DEL",
                "season": "2026/27",
                "period": "P3",
                "game_time": "4:28",
                "source": {"type": "manual"},
                "created_at": "2026-09-18T10:00:00",
            },
        )
        list_res = self.client.get("/api/scenes")
        get_res = self.client.get("/api/scenes/scene_mine")
        self.assertEqual(list_res.status_code, 200)
        self.assertEqual(get_res.status_code, 200)
        listed = list_res.json()["scenes"][0]
        single = get_res.json()
        # Same enrichment contract (including derived asset_name)
        self.assertEqual(single["asset_name"], listed["asset_name"])
        self.assertEqual(single["asset_name_missing"], listed["asset_name_missing"])
        self.assertEqual(single["asset_name"], "SC041_ING-MUC_P3_T04-28_Manual")
        for key in (
            "id",
            "scene_code",
            "team_home",
            "team_away",
            "league",
            "period",
            "game_time",
            "status",
            "source",
            "metadata_status",
        ):
            self.assertEqual(single.get(key), listed.get(key), key)

    def test_get_scene_unknown_id_404(self):
        res = self.client.get("/api/scenes/scene_does_not_exist")
        self.assertEqual(res.status_code, 404)

    def test_get_scene_other_owner_forbidden(self):
        self._write_scene(
            {
                "id": "scene_theirs",
                "scene_code": "SC042",
                "user": OTHER,
                "team_home": "Eisbären Berlin",
                "team_away": "Kölner Haie",
                "league": "DEL",
                "period": "P1",
                "game_time": "12:00",
                "source": {"type": "manual"},
                "created_at": "2026-09-18T11:00:00",
            },
        )
        res = self.client.get("/api/scenes/scene_theirs")
        self.assertEqual(res.status_code, 403)
        self.assertNotIn("Eisbären", res.text)

    def test_get_scene_does_not_modify_file(self):
        path = self._write_scene(
            {
                "id": "scene_stable",
                "scene_code": "SC050",
                "user": OWNER,
                "team_home": "ERC Ingolstadt",
                "team_away": "EHC Red Bull München",
                "league": "DEL",
                "season": "2026/27",
                "period": "P2",
                "game_time": "1:02",
                "source": {
                    "type": "drill",
                    "session_id": "sess_1",
                    "drill_id": "B1W_D4",
                    "observation_id": "obs_abc",
                    "observation_label": "Bandenmoment",
                },
                "session_id": "sess_1",
                "drill_id": "B1W_D4",
                "created_at": "2026-09-18T12:00:00",
            },
        )
        before = path.read_text(encoding="utf-8")
        mtime_before = path.stat().st_mtime_ns
        res = self.client.get("/api/scenes/scene_stable")
        self.assertEqual(res.status_code, 200)
        after = path.read_text(encoding="utf-8")
        self.assertEqual(before, after)
        self.assertEqual(path.stat().st_mtime_ns, mtime_before)
        persisted = json.loads(after)
        self.assertNotIn("asset_name", persisted)
        self.assertNotIn("asset_name_missing", persisted)

    def test_get_scene_preserves_observation_drill_session(self):
        self._write_scene(
            {
                "id": "scene_linked",
                "scene_code": "SC051",
                "user": OWNER,
                "session_id": "Christoph_1782649917",
                "drill_id": "B1W_D3",
                "drill_title": "Pucknah und puckfern lesen",
                "module_id": "B1W",
                "team_home": "Straubing Tigers",
                "team_away": "Augsburger Panther",
                "league": "DEL",
                "period": "P1",
                "game_time": "9:15",
                "source": {
                    "type": "drill",
                    "session_id": "Christoph_1782649917",
                    "drill_id": "B1W_D3",
                    "observation_id": "obs_near_far_1",
                    "observation_label": "Winger-Moment",
                },
                "created_at": "2026-09-18T13:00:00",
            },
        )
        res = self.client.get("/api/scenes/scene_linked")
        self.assertEqual(res.status_code, 200)
        scene = res.json()
        self.assertEqual(scene["session_id"], "Christoph_1782649917")
        self.assertEqual(scene["drill_id"], "B1W_D3")
        self.assertEqual(scene["source"]["observation_id"], "obs_near_far_1")
        self.assertEqual(scene["source"]["observation_label"], "Winger-Moment")
        self.assertEqual(scene["source"]["session_id"], "Christoph_1782649917")
        self.assertEqual(scene["source"]["drill_id"], "B1W_D3")

    def test_get_manual_scene_without_drill(self):
        self._write_scene(
            {
                "id": "scene_manual",
                "scene_code": "SC052",
                "user": OWNER,
                "team_home": "ERC Ingolstadt",
                "team_away": "EHC Red Bull München",
                "league": "DEL",
                "season": "2026/27",
                "period": "P1",
                "game_time": "10:00",
                "source": {
                    "type": "manual",
                    "session_id": None,
                    "drill_id": None,
                    "observation_id": None,
                },
                "session_id": None,
                "drill_id": None,
                "created_at": "2026-09-18T14:00:00",
            },
        )
        res = self.client.get("/api/scenes/scene_manual")
        self.assertEqual(res.status_code, 200)
        scene = res.json()
        self.assertEqual(scene["source"]["type"], "manual")
        self.assertIsNone(scene.get("drill_id"))
        self.assertIsNone(scene["source"].get("drill_id"))
        self.assertIsNone(scene["source"].get("observation_id"))

    def test_get_scene_by_scene_code_also_resolves(self):
        """Resolver matches PUT/DELETE: scene_code works, but Board Studio should use Scene.id."""
        self._write_scene(
            {
                "id": "scene_bycode",
                "scene_code": "SC060",
                "user": OWNER,
                "team_home": "ERC Ingolstadt",
                "team_away": "EHC Red Bull München",
                "league": "DEL",
                "season": "2026/27",
                "period": "P3",
                "game_time": "4:28",
                "source": {"type": "manual"},
                "created_at": "2026-09-18T15:00:00",
            },
        )
        res = self.client.get("/api/scenes/SC060")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["id"], "scene_bycode")
        self.assertEqual(res.json()["scene_code"], "SC060")

    def test_list_scenes_still_works(self):
        self._write_scene(
            {
                "id": "scene_mine",
                "scene_code": "SC041",
                "user": OWNER,
                "team_home": "ERC Ingolstadt",
                "team_away": "EHC Red Bull München",
                "league": "DEL",
                "season": "2026/27",
                "period": "P3",
                "game_time": "4:28",
                "source": {"type": "manual"},
                "created_at": "2026-09-18T10:00:00",
            },
        )
        self._write_scene(
            {
                "id": "scene_theirs",
                "scene_code": "SC042",
                "user": OTHER,
                "team_home": "Eisbären Berlin",
                "team_away": "Kölner Haie",
                "league": "DEL",
                "period": "P1",
                "game_time": "12:00",
                "source": {"type": "manual"},
                "created_at": "2026-09-18T11:00:00",
            },
        )
        res = self.client.get("/api/scenes")
        self.assertEqual(res.status_code, 200)
        scenes = res.json()["scenes"]
        self.assertEqual(len(scenes), 1)
        self.assertEqual(scenes[0]["id"], "scene_mine")

    def test_get_scene_requires_auth(self):
        backend_main.app.dependency_overrides.clear()
        res = self.client.get("/api/scenes/scene_mine")
        self.assertEqual(res.status_code, 401)


if __name__ == "__main__":
    unittest.main()
