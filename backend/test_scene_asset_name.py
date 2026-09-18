"""Canonical scene asset naming — Tank-owned derived field."""

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
from scene_asset_name import (
    attach_scene_asset_name,
    format_scene_asset_clock,
    format_scene_asset_period,
    generate_scene_asset_name,
    generate_scene_asset_name_from_scene,
    resolve_team_short,
    strip_derived_scene_fields,
)

OWNER = "user-asset-name-tests"


def _auth() -> AuthContext:
    return AuthContext(
        rinq_user_id=OWNER,
        auth_provider="legacy_password",
        auth_subject="alice",
        display_name="Alice",
        legacy_username="alice",
    )


class SceneAssetNameUnitTests(unittest.TestCase):
    def test_manual_ingolstadt_muenchen(self):
        result = generate_scene_asset_name(
            scene_code="SC041",
            team_home="ERC Ingolstadt",
            team_away="EHC Red Bull München",
            league="DEL",
            season="2026/27",
            period="P3",
            game_time="4:28",
            source_type="manual",
        )
        self.assertTrue(result["ok"])
        self.assertEqual(result["name"], "SC041_ING-MUC_P3_T04-28_Manual")

    def test_drill_slug_from_curriculum(self):
        result = generate_scene_asset_name(
            scene_code="SC035",
            team_home="Straubing Tigers",
            team_away="Augsburger Panther",
            league="DEL",
            period="P2",
            game_time="09:15",
            source_type="drill",
            drill_id="B1_D1",
        )
        self.assertTrue(result["ok"])
        self.assertEqual(result["name"], "SC035_STR-AEV_P2_T09-15_Center-Reads")

    def test_clock_and_period_normalization(self):
        self.assertEqual(format_scene_asset_clock("9:15"), "T09-15")
        self.assertEqual(format_scene_asset_period("ot"), "OT")
        result = generate_scene_asset_name(
            scene_code="SC100",
            team_home="Boston Bruins",
            team_away="Toronto Maple Leafs",
            league="NHL",
            period="ot",
            game_time="9:15",
            source_type="manual",
        )
        self.assertEqual(result["name"], "SC100_BOS-TOR_OT_T09-15_Manual")

    def test_missing_required_fields_fail_closed(self):
        result = generate_scene_asset_name(
            scene_code="SC011",
            team_home="Unknown FC",
            team_away="Augsburger Panther",
            league="DEL",
            period="P1",
            game_time="01:00",
            source_type="manual",
        )
        self.assertFalse(result["ok"])
        self.assertIsNone(result["name"])
        self.assertIn("Paarung", result["missing"])

        empty = generate_scene_asset_name(source_type="manual")
        self.assertFalse(empty["ok"])
        self.assertIsNone(empty["name"])
        self.assertIn("Szenen-ID", empty["missing"])

    def test_scene_id_is_never_used_as_scene_code(self):
        result = generate_scene_asset_name_from_scene(
            {
                "id": "SC041",
                "scene_code": None,
                "team_home": "ERC Ingolstadt",
                "team_away": "EHC Red Bull München",
                "league": "DEL",
                "period": "P3",
                "game_time": "4:28",
                "source": {"type": "manual"},
            }
        )
        self.assertFalse(result["ok"])
        self.assertIsNone(result["name"])
        self.assertIn("Szenen-ID", result["missing"])

    def test_scene_code_is_primary_and_allows_four_digits(self):
        result = generate_scene_asset_name(
            scene_code="SC1000",
            scene_id="scene_should_not_appear",
            team_home="Boston Bruins",
            team_away="Toronto Maple Leafs",
            league="NHL",
            period="OT",
            game_time="00:07",
            source_type="manual",
        )
        self.assertTrue(result["ok"])
        self.assertEqual(result["name"], "SC1000_BOS-TOR_OT_T00-07_Manual")
        self.assertNotIn("scene_should_not_appear", result["name"])

    def test_league_aware_overlap_del_vs_chl(self):
        self.assertEqual(
            resolve_team_short("Eisbären Berlin", league="DEL"),
            "EBB",
        )
        self.assertEqual(
            resolve_team_short("Eisbären Berlin", league="CHL"),
            "BER",
        )
        self.assertEqual(
            resolve_team_short("Kölner Haie", league="DEL"),
            "KEC",
        )
        self.assertEqual(
            resolve_team_short("Kölner Haie", league="CHL", season="2026/27"),
            "KOL",
        )
        del_name = generate_scene_asset_name(
            scene_code="SC036",
            team_home="Eisbären Berlin",
            team_away="Kölner Haie",
            league="DEL",
            period="P1",
            game_time="12:00",
            source_type="manual",
        )
        chl_name = generate_scene_asset_name(
            scene_code="SC036",
            team_home="Eisbären Berlin",
            team_away="Kölner Haie",
            league="CHL",
            season="2026/27",
            period="P1",
            game_time="12:00",
            source_type="manual",
        )
        self.assertEqual(del_name["name"], "SC036_EBB-KEC_P1_T12-00_Manual")
        self.assertEqual(chl_name["name"], "SC036_BER-KOL_P1_T12-00_Manual")

    def test_catalog_id_preferred_over_display_name(self):
        result = generate_scene_asset_name(
            scene_code="SC200",
            team_home="Eisbären Berlin",
            team_away="Kölner Haie",
            home_team_id="eisbaren_berlin",
            away_team_id="kolner_haie",
            league="CHL",
            season="2026/27",
            period="P2",
            game_time="1:02",
            source_type="manual",
        )
        self.assertEqual(result["name"], "SC200_BER-KOL_P2_T01-02_Manual")

    def test_attach_does_not_mutate_persistence_keys_on_source_dict_copy(self):
        scene = {
            "id": "scene_abc",
            "scene_code": "SC041",
            "team_home": "ERC Ingolstadt",
            "team_away": "EHC Red Bull München",
            "league": "DEL",
            "period": "P3",
            "game_time": "4:28",
            "source": {"type": "manual"},
        }
        attached = attach_scene_asset_name(scene)
        self.assertEqual(attached["asset_name"], "SC041_ING-MUC_P3_T04-28_Manual")
        self.assertEqual(attached["asset_name_missing"], [])
        self.assertNotIn("asset_name", scene)
        stripped = strip_derived_scene_fields(dict(attached))
        self.assertNotIn("asset_name", stripped)
        self.assertNotIn("asset_name_missing", stripped)


class SceneAssetNameApiTests(unittest.TestCase):
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

    def _write_scene(self, name: str, payload: dict) -> None:
        path = self.scenes_dir / "2026" / "09" / f"{name}.json"
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps(payload), encoding="utf-8")

    def test_get_scenes_requires_auth(self):
        backend_main.app.dependency_overrides.clear()
        res = self.client.get("/api/scenes")
        self.assertEqual(res.status_code, 401)

    def test_get_scenes_is_owner_filtered_and_additive(self):
        self._write_scene(
            "mine",
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
            "theirs",
            {
                "id": "scene_theirs",
                "scene_code": "SC042",
                "user": "someone-else",
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
        scene = scenes[0]
        self.assertEqual(scene["id"], "scene_mine")
        self.assertEqual(scene["scene_code"], "SC041")
        self.assertEqual(scene["asset_name"], "SC041_ING-MUC_P3_T04-28_Manual")
        self.assertEqual(scene["asset_name_missing"], [])
        self.assertEqual(scene["team_home"], "ERC Ingolstadt")
        persisted = json.loads((self.scenes_dir / "2026" / "09" / "mine.json").read_text(encoding="utf-8"))
        self.assertNotIn("asset_name", persisted)
        self.assertNotIn("asset_name_missing", persisted)

    def test_get_scenes_does_not_invent_name_when_incomplete(self):
        self._write_scene(
            "incomplete",
            {
                "id": "scene_incomplete",
                "scene_code": "SC099",
                "user": OWNER,
                "team_home": "Unknown FC",
                "team_away": "Augsburger Panther",
                "league": "DEL",
                "period": "P1",
                "game_time": "01:00",
                "source": {"type": "manual"},
                "created_at": "2026-09-18T12:00:00",
            },
        )
        res = self.client.get("/api/scenes")
        self.assertEqual(res.status_code, 200)
        scene = res.json()["scenes"][0]
        self.assertIsNone(scene["asset_name"])
        self.assertIn("Paarung", scene["asset_name_missing"])

    def test_get_scenes_resolves_curriculum_slug_for_drill(self):
        self._write_scene(
            "drill",
            {
                "id": "scene_drill",
                "scene_code": "SC035",
                "user": OWNER,
                "team_home": "Straubing Tigers",
                "team_away": "Augsburger Panther",
                "league": "DEL",
                "period": "P2",
                "game_time": "9:15",
                "source": {"type": "drill", "drill_id": "B1_D1"},
                "created_at": "2026-09-18T13:00:00",
            },
        )
        res = self.client.get("/api/scenes")
        self.assertEqual(res.status_code, 200)
        scene = res.json()["scenes"][0]
        self.assertEqual(scene["scene_code"], "SC035")
        self.assertEqual(scene["asset_name"], "SC035_STR-AEV_P2_T09-15_Center-Reads")
        persisted = json.loads((self.scenes_dir / "2026" / "09" / "drill.json").read_text(encoding="utf-8"))
        self.assertNotIn("asset_name", persisted)


if __name__ == "__main__":
    unittest.main()
