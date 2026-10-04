"""Tank-S3: Scene Analysis Context read contract."""

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
from curriculum_content_hash import (
    canonicalize_curriculum_payload,
    hash_curriculum_payload,
    curriculum_hash_metadata,
)
from scene_analysis_context import build_scene_analysis_context

OWNER = "user-analysis-ctx-tests"
OTHER = "someone-else"
SESSION_ID = "session_analysis_1"
DRILL_ID = "B1W_D3"


def _auth() -> AuthContext:
    return AuthContext(
        rinq_user_id=OWNER,
        auth_provider="legacy_password",
        auth_subject="alice",
        display_name="Alice",
        legacy_username="alice",
    )


def _other_auth() -> AuthContext:
    return AuthContext(
        rinq_user_id=OTHER,
        auth_provider="legacy_password",
        auth_subject="bob",
        display_name="Bob",
        legacy_username="bob",
    )


FIXTURE_CURRICULUM = {
    "tracks": [
        {
            "id": "B1W",
            "modules": [
                {
                    "id": "B1W_M1",
                    "drills": [
                        {
                            "id": DRILL_ID,
                            "title": "Pucknah und puckfern lesen",
                            "description": "Vergleiche Near vs Far Side.",
                            "drill_type": "observation",
                            "didactics": {
                                "explanation": "Lies die Distanz zum Puck.",
                                "observation_guide": {
                                    "what_to_watch": ["Pucknähe", "Support-Winkel"],
                                    "how_to_decide": ["Near first", "Then far"],
                                    "ignore": ["Scoreboard"],
                                },
                                "learning_hint": "Vergleiche Seiten.",
                            },
                            "config": {
                                "questions": [
                                    {
                                        "id": "near_side",
                                        "label": "Near Side",
                                        "options": ["holds_distance", "collapses"],
                                    }
                                ],
                                "state_options": ["holds_distance", "collapses"],
                            },
                            "miniFeedback": {"holds_distance": "Gut gehalten."},
                            "sceneSlug": "WingerSide",
                        }
                    ],
                }
            ],
        }
    ]
}


SESSION_DRILL_SNAPSHOT = {
    "id": DRILL_ID,
    "title": "HISTORICAL TITLE",
    "description": "Historical description text.",
    "didactics": {
        "explanation": "Historical explanation.",
        "observation_guide": {
            "what_to_watch": ["Historical watch"],
            "how_to_decide": ["Historical decide"],
            "ignore": ["Historical ignore"],
        },
    },
    "config": {
        "questions": [{"id": "near_side", "options": ["old_a", "old_b"]}],
        "state_options": ["old_a", "old_b"],
    },
}


class CurriculumContentHashTests(unittest.TestCase):
    def test_identical_content_same_hash(self):
        a = hash_curriculum_payload(FIXTURE_CURRICULUM)[0]
        b = hash_curriculum_payload(json.loads(json.dumps(FIXTURE_CURRICULUM)))[0]
        self.assertEqual(a, b)
        self.assertTrue(a.startswith("sha256:"))

    def test_changed_content_changes_hash(self):
        base = hash_curriculum_payload(FIXTURE_CURRICULUM)[0]
        changed = json.loads(json.dumps(FIXTURE_CURRICULUM))
        changed["tracks"][0]["modules"][0]["drills"][0]["title"] = "CHANGED"
        self.assertNotEqual(base, hash_curriculum_payload(changed)[0])

    def test_key_order_does_not_destabilize(self):
        left = {"tracks": [{"id": "T", "modules": [], "z": 1, "a": 2}]}
        right = {"tracks": [{"a": 2, "modules": [], "z": 1, "id": "T"}]}
        self.assertEqual(
            canonicalize_curriculum_payload(left),
            canonicalize_curriculum_payload(right),
        )
        self.assertEqual(hash_curriculum_payload(left)[0], hash_curriculum_payload(right)[0])

    def test_hash_failure_surfaced_safely(self):
        with mock.patch(
            "scene_analysis_context.curriculum_hash_metadata",
            side_effect=RuntimeError("boom"),
        ):
            ctx = build_scene_analysis_context(
                scene={"id": "s1", "source": {"type": "manual"}, "note": None},
                curriculum=FIXTURE_CURRICULUM,
            )
        self.assertIsNone(ctx["curriculum"]["contentHash"])
        self.assertEqual(ctx["curriculum"]["error"], "hash_failed")


class SceneAnalysisContextUnitTests(unittest.TestCase):
    def test_manual_scene_partial(self):
        ctx = build_scene_analysis_context(
            scene={
                "id": "scene_manual",
                "scene_code": "SC001",
                "note": "manual note verbatim",
                "source": {"type": "manual"},
            },
            curriculum=FIXTURE_CURRICULUM,
        )
        self.assertEqual(ctx["linkStatus"]["code"], "unlinked")
        self.assertIsNone(ctx["observation"])
        self.assertIsNone(ctx["drill"])
        self.assertEqual(ctx["scene"]["note"], "manual note verbatim")
        self.assertTrue(ctx["curriculum"]["contentHash"].startswith("sha256:"))

    def test_linked_observation_and_both_drills(self):
        session = {
            "id": SESSION_ID,
            "drill_id": DRILL_ID,
            "drills": [SESSION_DRILL_SNAPSHOT],
            "drafts": {
                "P1": {
                    "samples": [
                        {
                            "id": "sample_1",
                            "sceneId": "scene_linked",
                            "near_side": "holds_distance",
                            "note": "verbatim observation text",
                        }
                    ]
                }
            },
            "checkins": [],
        }
        scene = {
            "id": "scene_linked",
            "scene_code": "SC010",
            "session_id": SESSION_ID,
            "drill_id": DRILL_ID,
            "note": "scene note verbatim",
            "source": {
                "type": "drill",
                "session_id": SESSION_ID,
                "drill_id": DRILL_ID,
                "observation_id": "sample_1",
            },
        }
        ctx = build_scene_analysis_context(
            scene=scene,
            curriculum=FIXTURE_CURRICULUM,
            session=session,
        )
        self.assertEqual(ctx["linkStatus"]["code"], "linked")
        self.assertEqual(ctx["observation"]["answers"]["note"], "verbatim observation text")
        self.assertEqual(ctx["observation"]["answers"]["near_side"], "holds_distance")
        self.assertEqual(ctx["scene"]["note"], "scene note verbatim")
        self.assertEqual(
            ctx["drill"]["currentCurriculum"]["didactics"]["observation_guide"]["what_to_watch"],
            ["Pucknähe", "Support-Winkel"],
        )
        self.assertEqual(
            ctx["drill"]["currentCurriculum"]["config"]["questions"][0]["options"],
            ["holds_distance", "collapses"],
        )
        self.assertEqual(ctx["drill"]["sessionSnapshot"]["title"], "HISTORICAL TITLE")
        self.assertEqual(
            ctx["drill"]["currentCurriculum"]["title"],
            "Pucknah und puckfern lesen",
        )

    def test_pending_when_observation_missing(self):
        session = {"id": SESSION_ID, "drafts": {}, "checkins": []}
        scene = {
            "id": "scene_pending",
            "session_id": SESSION_ID,
            "drill_id": DRILL_ID,
            "source": {
                "type": "drill",
                "session_id": SESSION_ID,
                "observation_id": "sample_missing",
            },
        }
        ctx = build_scene_analysis_context(
            scene=scene,
            curriculum=FIXTURE_CURRICULUM,
            session=session,
        )
        self.assertEqual(ctx["linkStatus"]["code"], "pending_or_broken")
        self.assertIn("observation_not_found", ctx["linkStatus"]["reasons"])
        self.assertIsNotNone(ctx["drill"]["currentCurriculum"])

    def test_session_missing_partial(self):
        scene = {
            "id": "scene_nosess",
            "session_id": "gone",
            "drill_id": DRILL_ID,
            "source": {"type": "drill", "session_id": "gone", "observation_id": "sample_x"},
        }
        ctx = build_scene_analysis_context(
            scene=scene,
            curriculum=FIXTURE_CURRICULUM,
            session=None,
            session_error="not_found",
        )
        self.assertEqual(ctx["linkStatus"]["code"], "pending_or_broken")
        self.assertIn("session_not_found", ctx["linkStatus"]["reasons"])
        self.assertIsNotNone(ctx["drill"]["currentCurriculum"])

    def test_curriculum_drill_missing_session_present(self):
        session = {
            "id": SESSION_ID,
            "drills": [SESSION_DRILL_SNAPSHOT],
            "drafts": {},
            "checkins": [],
        }
        scene = {
            "id": "scene_hist",
            "session_id": SESSION_ID,
            "drill_id": DRILL_ID,
            "source": {"type": "drill", "session_id": SESSION_ID},
        }
        ctx = build_scene_analysis_context(
            scene=scene,
            curriculum={"tracks": []},
            session=session,
        )
        self.assertIsNotNone(ctx["drill"]["sessionSnapshot"])
        self.assertIsNone(ctx["drill"]["currentCurriculum"])

    def test_session_drill_missing_curriculum_present(self):
        session = {"id": SESSION_ID, "drills": [], "drafts": {}, "checkins": []}
        scene = {
            "id": "scene_curr",
            "session_id": SESSION_ID,
            "drill_id": DRILL_ID,
            "source": {"type": "drill"},
        }
        ctx = build_scene_analysis_context(
            scene=scene,
            curriculum=FIXTURE_CURRICULUM,
            session=session,
        )
        self.assertIsNone(ctx["drill"]["sessionSnapshot"])
        self.assertIsNotNone(ctx["drill"]["currentCurriculum"])

    def test_legacy_absent_scene_id_on_sample(self):
        session = {
            "id": SESSION_ID,
            "drafts": {"P1": {"samples": [{"id": "sample_legacy", "note": "x"}]}},
            "checkins": [],
        }
        scene = {
            "id": "scene_legacy",
            "session_id": SESSION_ID,
            "source": {"type": "drill", "observation_id": "sample_legacy"},
        }
        ctx = build_scene_analysis_context(
            scene=scene,
            curriculum=FIXTURE_CURRICULUM,
            session=session,
        )
        self.assertEqual(ctx["linkStatus"]["code"], "linked")
        self.assertIsNone(ctx["observation"]["sceneId"])

    def test_sample_scene_mismatch_inconsistent(self):
        session = {
            "id": SESSION_ID,
            "drafts": {
                "P1": {"samples": [{"id": "sample_bad", "sceneId": "other_scene"}]}
            },
            "checkins": [],
        }
        scene = {
            "id": "scene_bad",
            "session_id": SESSION_ID,
            "source": {"type": "drill", "observation_id": "sample_bad"},
        }
        ctx = build_scene_analysis_context(
            scene=scene,
            curriculum=FIXTURE_CURRICULUM,
            session=session,
        )
        self.assertEqual(ctx["linkStatus"]["code"], "inconsistent")
        self.assertIn("sample_scene_mismatch", ctx["linkStatus"]["reasons"])


class SceneAnalysisContextApiTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        root = Path(self.tmp.name)
        self.scenes_dir = root / "scenes"
        self.scenes_dir.mkdir()
        self.prev_scenes = backend_main.SCENES_DIR
        backend_main.SCENES_DIR = str(self.scenes_dir)

        self._session_store = {}

        def fake_try_load(session_id, current_user):
            if not session_id:
                return None, None
            if session_id not in self._session_store:
                return None, "not_found"
            sess = self._session_store[session_id]
            if sess.get("user") != current_user.rinq_user_id:
                return None, "not_found"
            return sess, None

        self.try_patch = mock.patch.object(
            backend_main, "_try_load_owned_session", side_effect=fake_try_load
        )
        self.curr_patch = mock.patch.object(
            backend_main,
            "_load_merged_curriculum_for_analysis",
            return_value=FIXTURE_CURRICULUM,
        )
        self.try_patch.start()
        self.curr_patch.start()

        backend_main.app.dependency_overrides[backend_main.get_current_user] = _auth
        self.client = TestClient(backend_main.app)

    def tearDown(self):
        self.client.close()
        self.try_patch.stop()
        self.curr_patch.stop()
        backend_main.app.dependency_overrides.clear()
        backend_main.SCENES_DIR = self.prev_scenes
        self.tmp.cleanup()

    def _write_scene(self, payload: dict) -> Path:
        path = self.scenes_dir / "2026" / "09" / f"{payload['id']}.json"
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps(payload, ensure_ascii=False), encoding="utf-8")
        return path

    def _scene_bytes(self, scene_id: str) -> bytes:
        path = self.scenes_dir / "2026" / "09" / f"{scene_id}.json"
        return path.read_bytes()

    def test_A_owned_scene_200(self):
        self._write_scene(
            {
                "id": "scene_a",
                "scene_code": "SC300",
                "user": OWNER,
                "note": "hello",
                "source": {"type": "manual"},
                "created_at": "2026-09-18T10:00:00",
            }
        )
        res = self.client.get("/api/scenes/scene_a/analysis-context")
        self.assertEqual(res.status_code, 200, res.text)
        body = res.json()
        self.assertEqual(body["scene"]["id"], "scene_a")
        self.assertEqual(body["provenance"]["lookupIdentity"], "scene.id")

    def test_B_C_D_E_F_G_H_I_J_complete_link(self):
        self._session_store[SESSION_ID] = {
            "id": SESSION_ID,
            "user": OWNER,
            "drill_id": DRILL_ID,
            "drills": [SESSION_DRILL_SNAPSHOT],
            "drafts": {
                "P1": {
                    "samples": [
                        {
                            "id": "sample_complete",
                            "sceneId": "scene_complete",
                            "near_side": "holds_distance",
                            "note": "verbatim answers",
                        }
                    ]
                }
            },
            "checkins": [],
        }
        self._write_scene(
            {
                "id": "scene_complete",
                "scene_code": "SC301",
                "user": OWNER,
                "session_id": SESSION_ID,
                "drill_id": DRILL_ID,
                "note": "scene owned note",
                "period": "P1",
                "game_time": "12:00",
                "team_home": "ERC Ingolstadt",
                "team_away": "EHC Red Bull München",
                "league": "DEL",
                "season": "2026/27",
                "source": {
                    "type": "drill",
                    "session_id": SESSION_ID,
                    "drill_id": DRILL_ID,
                    "observation_id": "sample_complete",
                },
                "created_at": "2026-09-18T10:00:00",
            }
        )
        before = self._scene_bytes("scene_complete")
        session_before = json.dumps(self._session_store[SESSION_ID], sort_keys=True)
        res = self.client.get("/api/scenes/scene_complete/analysis-context")
        self.assertEqual(res.status_code, 200, res.text)
        body = res.json()
        self.assertEqual(body["linkStatus"]["code"], "linked")
        self.assertEqual(body["observation"]["id"], "sample_complete")
        self.assertEqual(body["observation"]["answers"]["note"], "verbatim answers")
        self.assertEqual(body["drill"]["id"], DRILL_ID)
        self.assertEqual(
            body["drill"]["currentCurriculum"]["didactics"]["observation_guide"]["ignore"],
            ["Scoreboard"],
        )
        self.assertEqual(
            body["drill"]["currentCurriculum"]["config"]["state_options"],
            ["holds_distance", "collapses"],
        )
        self.assertEqual(body["scene"]["note"], "scene owned note")
        self.assertEqual(body["drill"]["sessionSnapshot"]["title"], "HISTORICAL TITLE")
        self.assertEqual(
            body["drill"]["currentCurriculum"]["title"],
            "Pucknah und puckfern lesen",
        )
        self.assertTrue(body["curriculum"]["contentHash"].startswith("sha256:"))
        # U/V/W — GET purity
        self.assertEqual(self._scene_bytes("scene_complete"), before)
        self.assertEqual(
            json.dumps(self._session_store[SESSION_ID], sort_keys=True),
            session_before,
        )
        # sample sceneId unchanged (no repair on GET)
        self.assertEqual(
            self._session_store[SESSION_ID]["drafts"]["P1"]["samples"][0]["sceneId"],
            "scene_complete",
        )

    def test_K_manual_partial(self):
        self._write_scene(
            {
                "id": "scene_manual",
                "scene_code": "SC302",
                "user": OWNER,
                "source": {"type": "manual"},
                "created_at": "2026-09-18T10:00:00",
            }
        )
        res = self.client.get("/api/scenes/scene_manual/analysis-context")
        self.assertEqual(res.status_code, 200)
        body = res.json()
        self.assertEqual(body["linkStatus"]["code"], "unlinked")
        self.assertIsNone(body["observation"])
        self.assertIsNone(body["drill"])

    def test_L_drill_without_observation(self):
        self._write_scene(
            {
                "id": "scene_drill_only",
                "user": OWNER,
                "session_id": SESSION_ID,
                "drill_id": DRILL_ID,
                "source": {"type": "drill", "session_id": SESSION_ID, "drill_id": DRILL_ID},
                "created_at": "2026-09-18T10:00:00",
            }
        )
        self._session_store[SESSION_ID] = {
            "id": SESSION_ID,
            "user": OWNER,
            "drills": [SESSION_DRILL_SNAPSHOT],
            "drafts": {},
            "checkins": [],
        }
        res = self.client.get("/api/scenes/scene_drill_only/analysis-context")
        self.assertEqual(res.status_code, 200)
        body = res.json()
        self.assertEqual(body["linkStatus"]["code"], "unlinked")
        self.assertIsNotNone(body["drill"]["currentCurriculum"])
        self.assertIsNotNone(body["drill"]["sessionSnapshot"])

    def test_M_broken_observation(self):
        self._write_scene(
            {
                "id": "scene_broken",
                "user": OWNER,
                "session_id": SESSION_ID,
                "drill_id": DRILL_ID,
                "source": {
                    "type": "drill",
                    "session_id": SESSION_ID,
                    "observation_id": "missing_sample",
                },
                "created_at": "2026-09-18T10:00:00",
            }
        )
        self._session_store[SESSION_ID] = {
            "id": SESSION_ID,
            "user": OWNER,
            "drafts": {},
            "checkins": [],
        }
        res = self.client.get("/api/scenes/scene_broken/analysis-context")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["linkStatus"]["code"], "pending_or_broken")

    def test_N_session_missing(self):
        self._write_scene(
            {
                "id": "scene_nosession",
                "user": OWNER,
                "session_id": "absent",
                "drill_id": DRILL_ID,
                "source": {
                    "type": "drill",
                    "session_id": "absent",
                    "observation_id": "sample_x",
                },
                "created_at": "2026-09-18T10:00:00",
            }
        )
        res = self.client.get("/api/scenes/scene_nosession/analysis-context")
        self.assertEqual(res.status_code, 200)
        body = res.json()
        self.assertEqual(body["linkStatus"]["code"], "pending_or_broken")
        self.assertIn("session_not_found", body["linkStatus"]["reasons"])

    def test_O_curriculum_missing_session_present(self):
        self.curr_patch.stop()
        self.curr_patch = mock.patch.object(
            backend_main,
            "_load_merged_curriculum_for_analysis",
            return_value={"tracks": []},
        )
        self.curr_patch.start()
        self._session_store[SESSION_ID] = {
            "id": SESSION_ID,
            "user": OWNER,
            "drills": [SESSION_DRILL_SNAPSHOT],
            "drafts": {},
            "checkins": [],
        }
        self._write_scene(
            {
                "id": "scene_o",
                "user": OWNER,
                "session_id": SESSION_ID,
                "drill_id": DRILL_ID,
                "source": {"type": "drill", "session_id": SESSION_ID},
                "created_at": "2026-09-18T10:00:00",
            }
        )
        res = self.client.get("/api/scenes/scene_o/analysis-context")
        self.assertEqual(res.status_code, 200)
        body = res.json()
        self.assertIsNotNone(body["drill"]["sessionSnapshot"])
        self.assertIsNone(body["drill"]["currentCurriculum"])

    def test_P_session_drill_absent_curriculum_present(self):
        self._session_store[SESSION_ID] = {
            "id": SESSION_ID,
            "user": OWNER,
            "drills": [],
            "drafts": {},
            "checkins": [],
        }
        self._write_scene(
            {
                "id": "scene_p",
                "user": OWNER,
                "session_id": SESSION_ID,
                "drill_id": DRILL_ID,
                "source": {"type": "drill", "session_id": SESSION_ID},
                "created_at": "2026-09-18T10:00:00",
            }
        )
        res = self.client.get("/api/scenes/scene_p/analysis-context")
        self.assertEqual(res.status_code, 200)
        body = res.json()
        self.assertIsNone(body["drill"]["sessionSnapshot"])
        self.assertIsNotNone(body["drill"]["currentCurriculum"])

    def test_Q_legacy_null_scene_id(self):
        self._session_store[SESSION_ID] = {
            "id": SESSION_ID,
            "user": OWNER,
            "drafts": {"P1": {"samples": [{"id": "sample_q", "note": "q"}]}},
            "checkins": [],
        }
        self._write_scene(
            {
                "id": "scene_q",
                "user": OWNER,
                "session_id": SESSION_ID,
                "source": {
                    "type": "drill",
                    "session_id": SESSION_ID,
                    "observation_id": "sample_q",
                },
                "created_at": "2026-09-18T10:00:00",
            }
        )
        res = self.client.get("/api/scenes/scene_q/analysis-context")
        self.assertEqual(res.status_code, 200)
        body = res.json()
        self.assertEqual(body["linkStatus"]["code"], "linked")
        self.assertIsNone(body["observation"]["sceneId"])

    def test_R_inconsistent_scene_id(self):
        self._session_store[SESSION_ID] = {
            "id": SESSION_ID,
            "user": OWNER,
            "drafts": {
                "P1": {"samples": [{"id": "sample_r", "sceneId": "other"}]}
            },
            "checkins": [],
        }
        self._write_scene(
            {
                "id": "scene_r",
                "user": OWNER,
                "session_id": SESSION_ID,
                "source": {
                    "type": "drill",
                    "session_id": SESSION_ID,
                    "observation_id": "sample_r",
                },
                "created_at": "2026-09-18T10:00:00",
            }
        )
        res = self.client.get("/api/scenes/scene_r/analysis-context")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["linkStatus"]["code"], "inconsistent")

    def test_S_unknown_404(self):
        res = self.client.get("/api/scenes/does_not_exist/analysis-context")
        self.assertEqual(res.status_code, 404)

    def test_T_other_user_403(self):
        self._write_scene(
            {
                "id": "scene_other",
                "user": OTHER,
                "source": {"type": "manual"},
                "note": "secret",
                "created_at": "2026-09-18T10:00:00",
            }
        )
        res = self.client.get("/api/scenes/scene_other/analysis-context")
        self.assertEqual(res.status_code, 403)
        self.assertNotIn("secret", res.text)

    def test_X_Y_existing_get_scenes_unchanged(self):
        self._write_scene(
            {
                "id": "scene_xy",
                "scene_code": "SC399",
                "user": OWNER,
                "team_home": "ERC Ingolstadt",
                "team_away": "EHC Red Bull München",
                "league": "DEL",
                "season": "2026/27",
                "period": "P1",
                "game_time": "1:00",
                "source": {"type": "manual"},
                "created_at": "2026-09-18T10:00:00",
            }
        )
        list_res = self.client.get("/api/scenes")
        get_res = self.client.get("/api/scenes/scene_xy")
        self.assertEqual(list_res.status_code, 200)
        self.assertEqual(get_res.status_code, 200)
        listed = list_res.json()["scenes"][0]
        single = get_res.json()
        self.assertEqual(single["id"], listed["id"])
        self.assertEqual(single["asset_name"], listed["asset_name"])
        self.assertNotIn("linkStatus", single)
        self.assertNotIn("curriculum", single)


class CurriculumApiHashSmokeTests(unittest.TestCase):
    def test_curriculum_endpoint_includes_content_hash(self):
        backend_main.app.dependency_overrides.clear()
        client = TestClient(backend_main.app)
        try:
            with mock.patch.object(
                backend_main,
                "load_json",
                return_value=FIXTURE_CURRICULUM,
            ), mock.patch.object(
                backend_main,
                "_merge_foundation_tracks",
                side_effect=lambda c: c,
            ), mock.patch.object(
                backend_main,
                "filter_curriculum_for_user",
                side_effect=lambda c, *_a, **_k: c,
            ), mock.patch.object(
                backend_main,
                "resolve_user_from_authorization",
                return_value=None,
            ):
                res = client.get("/api/curriculum")
            self.assertEqual(res.status_code, 200)
            body = res.json()
            expected = curriculum_hash_metadata(FIXTURE_CURRICULUM)["contentHash"]
            self.assertEqual(body["contentHash"], expected)
            self.assertEqual(body["contentHashAlgorithm"], "sha256")
            self.assertEqual(body["contentHashScope"], "merged_curriculum")
        finally:
            client.close()


if __name__ == "__main__":
    unittest.main()
