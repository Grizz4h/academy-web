"""Tank-S2: durable Scene ↔ check-in sample link."""

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
from scene_observation_link import (
    ObservationLinkConflict,
    apply_observation_scene_link,
    find_observation_sample,
    preflight_observation_scene_link,
)

OWNER = "user-scene-link-tests"
OTHER = "someone-else"
SESSION_ID = "session_link_1"


def _auth() -> AuthContext:
    return AuthContext(
        rinq_user_id=OWNER,
        auth_provider="legacy_password",
        auth_subject="alice",
        display_name="Alice",
        legacy_username="alice",
    )


class SceneObservationLinkUnitTests(unittest.TestCase):
    def test_find_sample_in_drafts_and_checkins(self):
        session = {
            "id": SESSION_ID,
            "drafts": {
                "P1": {
                    "winger_samples": [
                        {"id": "sample_aaa", "note": "a"},
                    ]
                }
            },
            "checkins": [
                {
                    "phase": "P2",
                    "answers": {
                        "winger_samples": [
                            {"id": "sample_bbb", "sceneId": "scene_old"},
                        ]
                    },
                }
            ],
        }
        found = find_observation_sample(session, "sample_bbb")
        self.assertIsNotNone(found)
        self.assertEqual(found.location, "checkins")
        self.assertEqual(found.phase, "P2")
        self.assertEqual(found.sample["id"], "sample_bbb")

    def test_apply_sets_bidirectional_link(self):
        session = {
            "id": SESSION_ID,
            "drill_id": "B1W_D3",
            "drafts": {
                "P1": {
                    "winger_side_compare_samples": [
                        {"id": "sample_x", "near_side": "holds_distance"},
                    ],
                    "__active_observation_draft": {
                        "id": "sample_x",
                        "sessionId": SESSION_ID,
                        "drillId": "B1W_D3",
                        "phase": "P1",
                        "collectionKey": "winger_side_compare_samples",
                        "label": "Winger-Moment",
                    },
                }
            },
            "checkins": [],
        }
        scene = {
            "id": "scene_new",
            "scene_code": "SC100",
            "session_id": SESSION_ID,
            "drill_id": "B1W_D3",
            "source": {
                "type": "drill",
                "session_id": SESSION_ID,
                "drill_id": "B1W_D3",
                "observation_id": "sample_x",
            },
        }
        result = apply_observation_scene_link(
            scene=scene,
            session=session,
            observation_id="sample_x",
            other_scenes=[],
        )
        self.assertTrue(result.sample_found)
        self.assertEqual(session["drafts"]["P1"]["winger_side_compare_samples"][0]["sceneId"], "scene_new")
        self.assertEqual(session["drafts"]["P1"]["__active_observation_draft"]["sceneId"], "scene_new")
        self.assertEqual(scene["source"]["observation_id"], "sample_x")

    def test_conflict_sample_scene_id(self):
        session = {
            "id": SESSION_ID,
            "drafts": {"P1": {"samples": [{"id": "sample_x", "sceneId": "scene_other"}]}},
            "checkins": [],
        }
        scene = {
            "id": "scene_new",
            "session_id": SESSION_ID,
            "source": {"type": "drill", "session_id": SESSION_ID},
        }
        with self.assertRaises(ObservationLinkConflict) as ctx:
            preflight_observation_scene_link(
                scene=scene,
                session=session,
                observation_id="sample_x",
                other_scenes=[],
            )
        self.assertEqual(ctx.exception.code, "sample_scene_conflict")

    def test_conflict_drill_mismatch(self):
        session = {
            "id": SESSION_ID,
            "drill_id": "B1W_D1",
            "drafts": {
                "P1": {
                    "samples": [{"id": "sample_x"}],
                    "__active_observation_draft": {
                        "id": "sample_x",
                        "sessionId": SESSION_ID,
                        "drillId": "B1W_D1",
                    },
                }
            },
            "checkins": [],
        }
        scene = {
            "id": "scene_new",
            "session_id": SESSION_ID,
            "drill_id": "B1W_D3",
            "source": {"type": "drill", "session_id": SESSION_ID, "drill_id": "B1W_D3"},
        }
        with self.assertRaises(ObservationLinkConflict) as ctx:
            preflight_observation_scene_link(
                scene=scene,
                session=session,
                observation_id="sample_x",
                other_scenes=[],
            )
        self.assertEqual(ctx.exception.code, "drill_mismatch")

    def test_idempotent_relink(self):
        session = {
            "id": SESSION_ID,
            "drafts": {"P1": {"samples": [{"id": "sample_x", "sceneId": "scene_new"}]}},
            "checkins": [],
        }
        scene = {
            "id": "scene_new",
            "session_id": SESSION_ID,
            "source": {
                "type": "drill",
                "session_id": SESSION_ID,
                "observation_id": "sample_x",
            },
        }
        result = apply_observation_scene_link(
            scene=scene,
            session=session,
            observation_id="sample_x",
            other_scenes=[],
        )
        self.assertEqual(result.status, "already_linked")


class SceneObservationLinkApiTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        root = Path(self.tmp.name)
        self.scenes_dir = root / "scenes"
        self.sessions_dir = root / "sessions"
        self.scenes_dir.mkdir()
        self.sessions_dir.mkdir()

        self.prev_scenes = backend_main.SCENES_DIR
        self.prev_sessions = backend_main.SESSIONS_DIR
        backend_main.SCENES_DIR = str(self.scenes_dir)
        backend_main.SESSIONS_DIR = str(self.sessions_dir)

        # Counter file for scene codes
        self.prev_counter = getattr(backend_main, "SCENE_CODE_COUNTER_FILE", None)
        counter = root / "scene_code_counter.json"
        counter.write_text(json.dumps({"prefix": "SC", "last_number": 200}), encoding="utf-8")
        backend_main.SCENE_CODE_COUNTER_FILE = str(counter)

        backend_main.app.dependency_overrides[backend_main.get_current_user] = _auth
        # Creator mode for POST /api/scenes
        self.creator_patch = mock.patch(
            "main.is_creator_mode_auth",
            return_value=True,
        )
        self.creator_patch.start()

        # Session repository uses get_repos().sessions — stub create/load via filesystem helpers
        self._session_store = {}

        def fake_require(session_id, current_user):
            if session_id not in self._session_store:
                raise backend_main.HTTPException(status_code=404, detail="Session not found")
            sess = self._session_store[session_id]
            if sess.get("user") != current_user.rinq_user_id:
                raise backend_main.HTTPException(status_code=403, detail="Forbidden")
            return f"/tmp/{session_id}.json", sess

        def fake_persist(session):
            self._session_store[session["id"]] = session
            return session

        self.require_patch = mock.patch.object(backend_main, "_require_session_owner", side_effect=fake_require)
        self.persist_patch = mock.patch.object(backend_main, "_persist_session", side_effect=fake_persist)
        self.require_patch.start()
        self.persist_patch.start()

        self.client = TestClient(backend_main.app)

    def tearDown(self):
        self.client.close()
        self.require_patch.stop()
        self.persist_patch.stop()
        self.creator_patch.stop()
        backend_main.app.dependency_overrides.clear()
        backend_main.SCENES_DIR = self.prev_scenes
        backend_main.SESSIONS_DIR = self.prev_sessions
        if self.prev_counter is not None:
            backend_main.SCENE_CODE_COUNTER_FILE = self.prev_counter
        self.tmp.cleanup()

    def _put_session(self, session: dict) -> None:
        self._session_store[session["id"]] = session

    def _write_scene_file(self, scene: dict) -> Path:
        path = self.scenes_dir / "2026" / "09" / f"{scene['id']}.json"
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps(scene), encoding="utf-8")
        return path

    def test_create_scene_stores_observation_and_backlinks_sample(self):
        self._put_session(
            {
                "id": SESSION_ID,
                "user": OWNER,
                "drill_id": "B1W_D3",
                "drafts": {
                    "P1": {
                        "samples": [{"id": "sample_link_1", "note": "hello"}],
                        "__active_observation_draft": {
                            "id": "sample_link_1",
                            "sessionId": SESSION_ID,
                            "drillId": "B1W_D3",
                            "phase": "P1",
                            "collectionKey": "samples",
                            "label": "Moment",
                        },
                    }
                },
                "checkins": [],
            }
        )
        res = self.client.post(
            "/api/scenes",
            json={
                "game_time": "12:34",
                "period": "P1",
                "session_id": SESSION_ID,
                "drill_id": "B1W_D3",
                "drill_title": "Pucknah und puckfern lesen",
                "league": "DEL",
                "season": "2026/27",
                "team_home": "ERC Ingolstadt",
                "team_away": "EHC Red Bull München",
                "source": {
                    "type": "drill",
                    "session_id": SESSION_ID,
                    "drill_id": "B1W_D3",
                    "observation_id": "sample_link_1",
                    "observation_label": "Moment",
                },
            },
        )
        self.assertEqual(res.status_code, 200, res.text)
        body = res.json()
        self.assertEqual(body["source"]["observation_id"], "sample_link_1")
        self.assertEqual(body["drill_id"], "B1W_D3")
        self.assertEqual(body["session_id"], SESSION_ID)
        self.assertIn("observation_link", body)
        sess = self._session_store[SESSION_ID]
        sample = sess["drafts"]["P1"]["samples"][0]
        self.assertEqual(sample["sceneId"], body["id"])
        # Resolve both directions
        found = find_observation_sample(sess, "sample_link_1")
        self.assertEqual(found.sample["sceneId"], body["id"])
        get_res = self.client.get(f"/api/scenes/{body['id']}")
        self.assertEqual(get_res.status_code, 200)
        self.assertEqual(get_res.json()["source"]["observation_id"], "sample_link_1")

    def test_manual_scene_without_observation(self):
        res = self.client.post(
            "/api/scenes",
            json={
                "game_time": "1:00",
                "period": "P1",
                "league": "DEL",
                "season": "2026/27",
                "team_home": "ERC Ingolstadt",
                "team_away": "EHC Red Bull München",
                "source": {"type": "manual"},
            },
        )
        self.assertEqual(res.status_code, 200, res.text)
        body = res.json()
        self.assertIsNone(body.get("source", {}).get("observation_id"))
        self.assertNotIn("observation_link", body)

    def test_link_endpoint_repairs_missing_sample_backlink(self):
        scene = {
            "id": "scene_repair",
            "scene_code": "SC201",
            "user": OWNER,
            "session_id": SESSION_ID,
            "drill_id": "B1W_D4",
            "period": "P2",
            "game_time": "5:00",
            "source": {
                "type": "drill",
                "session_id": SESSION_ID,
                "drill_id": "B1W_D4",
                "observation_id": "sample_repair",
            },
            "created_at": "2026-09-18T10:00:00",
        }
        self._write_scene_file(scene)
        self._put_session(
            {
                "id": SESSION_ID,
                "user": OWNER,
                "drill_id": "B1W_D4",
                "drafts": {"P2": {"board_battle_samples": [{"id": "sample_repair", "note": "board"}]}},
                "checkins": [],
            }
        )
        res = self.client.post("/api/scenes/scene_repair/observation-link", json={})
        self.assertEqual(res.status_code, 200, res.text)
        payload = res.json()
        self.assertEqual(payload["sample"]["sceneId"], "scene_repair")
        self.assertTrue(payload["observation_link"]["repaired_sample"])

    def test_link_conflict_rejected(self):
        scene = {
            "id": "scene_a",
            "scene_code": "SC202",
            "user": OWNER,
            "session_id": SESSION_ID,
            "drill_id": "B1W_D3",
            "period": "P1",
            "game_time": "6:00",
            "source": {
                "type": "drill",
                "session_id": SESSION_ID,
                "observation_id": "sample_conflict",
            },
            "created_at": "2026-09-18T10:00:00",
        }
        self._write_scene_file(scene)
        self._put_session(
            {
                "id": SESSION_ID,
                "user": OWNER,
                "drafts": {
                    "P1": {"samples": [{"id": "sample_conflict", "sceneId": "scene_other"}]}
                },
                "checkins": [],
            }
        )
        res = self.client.post("/api/scenes/scene_a/observation-link", json={})
        self.assertEqual(res.status_code, 409, res.text)
        self.assertEqual(res.json()["detail"]["code"], "sample_scene_conflict")

    def test_create_does_not_modify_sample_when_preflight_fails(self):
        self._put_session(
            {
                "id": SESSION_ID,
                "user": OWNER,
                "drafts": {
                    "P1": {"samples": [{"id": "sample_locked", "sceneId": "scene_existing"}]}
                },
                "checkins": [],
            }
        )
        before = json.dumps(self._session_store[SESSION_ID])
        res = self.client.post(
            "/api/scenes",
            json={
                "game_time": "9:00",
                "period": "P1",
                "session_id": SESSION_ID,
                "drill_id": "B1W_D3",
                "league": "DEL",
                "season": "2026/27",
                "team_home": "ERC Ingolstadt",
                "team_away": "EHC Red Bull München",
                "source": {
                    "type": "drill",
                    "session_id": SESSION_ID,
                    "drill_id": "B1W_D3",
                    "observation_id": "sample_locked",
                },
            },
        )
        self.assertEqual(res.status_code, 409)
        self.assertEqual(json.dumps(self._session_store[SESSION_ID]), before)
        # No new scene file for this observation
        self.assertEqual(list(self.scenes_dir.rglob("*.json")), [])

    def test_unknown_scene_link_404(self):
        res = self.client.post("/api/scenes/scene_missing/observation-link", json={
            "observation_id": "sample_x",
            "session_id": SESSION_ID,
        })
        self.assertEqual(res.status_code, 404)

    def test_list_scenes_unchanged_shape(self):
        self._write_scene_file(
            {
                "id": "scene_list",
                "scene_code": "SC210",
                "user": OWNER,
                "period": "P1",
                "game_time": "1:00",
                "league": "DEL",
                "season": "2026/27",
                "team_home": "ERC Ingolstadt",
                "team_away": "EHC Red Bull München",
                "source": {"type": "manual"},
                "created_at": "2026-09-18T10:00:00",
            }
        )
        res = self.client.get("/api/scenes")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(len(res.json()["scenes"]), 1)


if __name__ == "__main__":
    unittest.main()
