"""Watched catalog games — session backfill + manual calendar check-off."""

from __future__ import annotations

import json
import os
import sys
import tempfile
import unittest
from datetime import datetime, timedelta
from pathlib import Path

os.environ["ACADEMY_JWT_SECRET"] = "test-jwt-secret-phase1-hardening-32chars-min"
os.environ["ACADEMY_SKIP_IDENTITY_MIGRATION"] = "1"
os.environ["STORAGE_BACKEND"] = "json"

BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

import jwt
from fastapi.testclient import TestClient
from security_guards import reset_rate_limiter_for_tests

import main as backend_main
from watched_games import resolve_session_game_id, session_game_ids


JWT_ALGO = "HS256"
GAME_ID = "del:2025_2026:14092025-ebb-man-1"
PAIRING_GAME_ID = "del:2025_2026:15092025-kec-str-2"


def _token(sub: str) -> str:
    payload = {
        "sub": sub,
        "exp": (datetime.utcnow() + timedelta(days=1)).timestamp(),
    }
    return jwt.encode(payload, os.environ["ACADEMY_JWT_SECRET"], algorithm=JWT_ALGO)


def _auth(sub: str) -> dict:
    return {"Authorization": f"Bearer {_token(sub)}"}


class WatchedGamesTests(unittest.TestCase):
    def setUp(self):
        reset_rate_limiter_for_tests()
        self._tmp = tempfile.TemporaryDirectory()
        root = Path(self._tmp.name)
        academy = root / "academy"
        games = root / "games"
        sessions_dir = academy / "sessions"
        watched_dir = academy / "watched_games"
        sessions_dir.mkdir(parents=True)
        watched_dir.mkdir()
        games.mkdir()
        (academy / "profiles").mkdir()
        (academy / "rewards").mkdir()
        (academy / "uploads" / "avatars").mkdir(parents=True)

        catalog = {
            "league": "DEL",
            "season": "2025_2026",
            "games": [
                {
                    "id": GAME_ID,
                    "date": "2025-09-14",
                    "home_team_id": "EBB",
                    "away_team_id": "MAN",
                    "home_team_name": "Eisbären Berlin",
                    "away_team_name": "Adler Mannheim",
                },
                {
                    "id": PAIRING_GAME_ID,
                    "date": "2025-09-15",
                    "home_team_id": "KEC",
                    "away_team_id": "STR",
                    "home_team_name": "Kölner Haie",
                    "away_team_name": "Straubing Tigers",
                },
            ],
        }
        (games / "del_2025_2026.json").write_text(json.dumps(catalog), encoding="utf-8")

        self._prev = {
            "SESSIONS_DIR": backend_main.SESSIONS_DIR,
            "WATCHED_GAMES_DIR": backend_main.WATCHED_GAMES_DIR,
            "GAMES_DIR": backend_main.GAMES_DIR,
            "USERS_FILE": backend_main.USERS_FILE,
            "DATA_DIR": backend_main.DATA_DIR,
            "PROFILES_DIR": backend_main.PROFILES_DIR,
            "REWARDS_DIR": backend_main.REWARDS_DIR,
            "IDENTITY_STORE_FILE": backend_main.IDENTITY_STORE_FILE,
        }

        users_file = academy / "users.json"
        users_file.write_text(
            json.dumps(
                {
                    "users": [
                        {"username": "alice", "password_hash": "x", "created_at": "2026-01-01", "role": "user"},
                        {"username": "bob", "password_hash": "x", "created_at": "2026-01-01", "role": "user"},
                    ]
                }
            ),
            encoding="utf-8",
        )

        backend_main.SESSIONS_DIR = str(sessions_dir)
        backend_main.WATCHED_GAMES_DIR = str(watched_dir)
        backend_main.GAMES_DIR = str(games)
        backend_main.USERS_FILE = str(users_file)
        backend_main.DATA_DIR = str(academy)
        backend_main.PROFILES_DIR = str(academy / "profiles")
        backend_main.REWARDS_DIR = str(academy / "rewards")
        backend_main.IDENTITY_STORE_FILE = str(academy / "identity_store.json")
        backend_main._identity_store = backend_main.configure_identity_store(
            backend_main.IDENTITY_STORE_FILE
        )

        self.alice = backend_main._identity_store.ensure_legacy_identity("alice")
        self.bob = backend_main._identity_store.ensure_legacy_identity("bob")
        self.sessions_dir = sessions_dir
        self.watched_dir = watched_dir
        self.client = TestClient(backend_main.app)

    def tearDown(self):
        for key, value in self._prev.items():
            setattr(backend_main, key, value)
        backend_main._identity_store = backend_main.configure_identity_store(
            backend_main.IDENTITY_STORE_FILE
        )
        self.client.close()
        self._tmp.cleanup()

    def _write_session(self, session_id: str, owner_id: str, extra: dict) -> None:
        folder = self.sessions_dir / "2026" / "08"
        folder.mkdir(parents=True, exist_ok=True)
        doc = {
            "id": session_id,
            "user": owner_id,
            "created_by": owner_id,
            "module_id": "A1",
            "state": "COMPLETED",
            "created_at": datetime.utcnow().isoformat(),
            "checkins": [{"phase": "P1", "answers": {}}],
            "observation_scope": "P1",
            "observed_team": "home",
            "current_phase": "P1",
            "learning_area": "academy",
            "drills": [],
            **extra,
        }
        (folder / f"{session_id}.json").write_text(json.dumps(doc), encoding="utf-8")

    def test_unauthenticated_is_401(self):
        self.assertEqual(self.client.get("/api/me/watched-games").status_code, 401)
        self.assertEqual(
            self.client.patch(
                "/api/me/watched-games",
                json={"game_id": GAME_ID, "seen": True},
            ).status_code,
            401,
        )

    def test_backfill_from_session_game_id(self):
        self._write_session(
            "alice_watch_1",
            self.alice.rinq_user_id,
            {"game_id": GAME_ID, "game_info": {"game_id": GAME_ID, "date": "2025-09-14"}},
        )
        self._write_session(
            "bob_watch_1",
            self.bob.rinq_user_id,
            {"game_id": PAIRING_GAME_ID},
        )
        res = self.client.get("/api/me/watched-games", headers=_auth("alice"))
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["game_ids"], [GAME_ID])
        self.assertEqual(data["from_session"], [GAME_ID])
        self.assertEqual(data["manual"], [])

        bob = self.client.get("/api/me/watched-games", headers=_auth("bob"))
        self.assertEqual(bob.json()["game_ids"], [PAIRING_GAME_ID])

    def test_backfill_from_pairing_without_game_id(self):
        self._write_session(
            "alice_watch_2",
            self.alice.rinq_user_id,
            {
                "game_info": {
                    "date": "2025-09-15",
                    "team_home": "Kölner Haie",
                    "team_away": "Straubing Tigers",
                    "league": "DEL",
                }
            },
        )
        res = self.client.get("/api/me/watched-games", headers=_auth("alice"))
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["game_ids"], [PAIRING_GAME_ID])

    def test_backfill_from_iso_datetime_date(self):
        """Older sessions stored wall-clock as ISO timestamps — still match catalog YYYY-MM-DD."""
        self._write_session(
            "alice_watch_iso",
            self.alice.rinq_user_id,
            {
                "game_id": None,
                "game_info": {
                    "date": "2025-09-15T16:45:00.000Z",
                    "team_home": "Kölner Haie",
                    "team_away": "Straubing Tigers",
                    "league": "DEL",
                    "observed_team": "Kölner Haie",
                },
            },
        )
        res = self.client.get("/api/me/watched-games", headers=_auth("alice"))
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["game_ids"], [PAIRING_GAME_ID])

    def test_empty_setup_without_observation_is_ignored(self):
        self._write_session(
            "alice_empty",
            self.alice.rinq_user_id,
            {
                "game_id": GAME_ID,
                "checkins": [],
                "observation_scope": None,
                "observed_team": None,
            },
        )
        res = self.client.get("/api/me/watched-games", headers=_auth("alice"))
        self.assertEqual(res.json()["game_ids"], [])

    def test_dummy_session_is_ignored(self):
        self._write_session(
            "alice_dummy",
            self.alice.rinq_user_id,
            {"game_id": GAME_ID, "is_dummy": True},
        )
        res = self.client.get("/api/me/watched-games", headers=_auth("alice"))
        self.assertEqual(res.json()["game_ids"], [])

    def test_manual_toggle_and_uncheck_session_game(self):
        self._write_session("alice_watch_3", self.alice.rinq_user_id, {"game_id": GAME_ID})
        marked = self.client.patch(
            "/api/me/watched-games",
            headers=_auth("alice"),
            json={"game_id": PAIRING_GAME_ID, "seen": True},
        )
        self.assertEqual(marked.status_code, 200)
        self.assertEqual(set(marked.json()["game_ids"]), {GAME_ID, PAIRING_GAME_ID})
        self.assertEqual(marked.json()["manual"], [PAIRING_GAME_ID])

        unchecked = self.client.patch(
            "/api/me/watched-games",
            headers=_auth("alice"),
            json={"game_id": GAME_ID, "seen": False},
        )
        self.assertEqual(unchecked.json()["game_ids"], [PAIRING_GAME_ID])
        self.assertEqual(unchecked.json()["from_session"], [GAME_ID])

    def test_rejects_path_game_id(self):
        res = self.client.patch(
            "/api/me/watched-games",
            headers=_auth("alice"),
            json={"game_id": "../secrets", "seen": True},
        )
        self.assertEqual(res.status_code, 400)

    def test_resolve_pairing_helper(self):
        catalog = [
            {
                "id": PAIRING_GAME_ID,
                "date": "2025-09-15",
                "home_team_id": "KEC",
                "away_team_id": "STR",
                "home_team_name": "Kölner Haie",
                "away_team_name": "Straubing Tigers",
            }
        ]
        session = {
            "observation_scope": "P1",
            "observed_team": "KEC",
            "checkins": [{"phase": "P1"}],
            "game_info": {
                "date": "2025-09-15",
                "home_team_id": "KEC",
                "away_team_id": "STR",
            },
        }
        self.assertEqual(resolve_session_game_id(session, catalog), PAIRING_GAME_ID)
        self.assertEqual(
            session_game_ids([{"is_dummy": True, "game_id": GAME_ID}], str(self.watched_dir.parent / "nope")),
            [],
        )


if __name__ == "__main__":
    unittest.main()
