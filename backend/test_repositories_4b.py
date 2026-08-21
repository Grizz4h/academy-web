"""Phase 4B — repository abstraction tests (JSON implementations)."""

from __future__ import annotations

import os
import sys
import tempfile
import unittest
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

os.environ["ACADEMY_JWT_SECRET"] = "test-jwt-secret-phase1-hardening-32chars-min"
os.environ["ACADEMY_SKIP_IDENTITY_MIGRATION"] = "1"

BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from identity.context import AuthContext, LEGACY_PASSWORD_PROVIDER, SUPABASE_GOOGLE_PROVIDER
from identity.store import IdentityStore
from repositories.errors import DuplicateAuthLinkError, NotFoundError
from repositories.json_credentials import JsonUserCredentialRepository
from repositories.json_identity import JsonIdentityRepository
from repositories.json_profile import JsonProfileRepository
from repositories.json_reward import JsonRewardRepository
from repositories.json_session import JsonSessionRepository


def _ctx(rinq: str, *, legacy: str | None = None, display: str = "Tester") -> AuthContext:
    return AuthContext(
        rinq_user_id=rinq,
        auth_provider=LEGACY_PASSWORD_PROVIDER if legacy else SUPABASE_GOOGLE_PROVIDER,
        auth_subject=legacy or "sub-1",
        display_name=display,
        legacy_username=legacy,
    )


class IdentityRepositoryTests(unittest.TestCase):
    def setUp(self):
        self._tmp = tempfile.TemporaryDirectory()
        path = str(Path(self._tmp.name) / "identity_store.json")
        self.store = IdentityStore(path)
        self.repo = JsonIdentityRepository(lambda: self.store)

    def tearDown(self):
        self._tmp.cleanup()

    def test_lookup_and_link_uniqueness(self):
        a = self.repo.ensure_legacy_identity("alice", display_name="Alice")
        b = self.repo.ensure_provider_identity(SUPABASE_GOOGLE_PROVIDER, "google-sub-1")
        self.assertNotEqual(a.rinq_user_id, b.rinq_user_id)
        self.assertIsNotNone(self.repo.find_auth_link(LEGACY_PASSWORD_PROVIDER, "alice"))
        self.assertEqual(
            self.repo.get_identity_by_user_id(a.rinq_user_id)["rinq_user_id"],
            a.rinq_user_id,
        )
        self.repo.create_auth_link(a.rinq_user_id, SUPABASE_GOOGLE_PROVIDER, "google-sub-2")
        with self.assertRaises(DuplicateAuthLinkError):
            self.repo.create_auth_link(b.rinq_user_id, SUPABASE_GOOGLE_PROVIDER, "google-sub-2")
        links = self.repo.list_auth_links_for_user(a.rinq_user_id)
        self.assertEqual(len(links), 2)


class CredentialRepositoryTests(unittest.TestCase):
    def setUp(self):
        self._tmp = tempfile.TemporaryDirectory()
        self.users_file = str(Path(self._tmp.name) / "users.json")
        self.repo = JsonUserCredentialRepository(lambda: self.users_file)

    def tearDown(self):
        self._tmp.cleanup()

    def test_upsert_lookup_delete(self):
        self.repo.upsert_user(
            {"username": "alice", "password_hash": "hash1", "created_at": "2026-01-01"}
        )
        row = self.repo.get_by_username("Alice")
        self.assertEqual(row["password_hash"], "hash1")
        self.assertEqual(self.repo.get_password_hash("alice"), "hash1")
        self.assertTrue(self.repo.delete_legacy_credential("alice"))
        self.assertIsNone(self.repo.get_by_username("alice"))


class ProfileRepositoryTests(unittest.TestCase):
    def setUp(self):
        self._tmp = tempfile.TemporaryDirectory()
        self.dir = str(Path(self._tmp.name) / "profiles")
        Path(self.dir).mkdir()
        self.repo = JsonProfileRepository(lambda: self.dir)
        self.user = _ctx("11111111-1111-1111-1111-111111111111", legacy="alice")

    def tearDown(self):
        self._tmp.cleanup()

    def test_read_write_delete(self):
        created = self.repo.create_default_profile(self.user, "alice")
        self.assertEqual(created["displayName"], "Alice")
        updated = self.repo.update_display_name(self.user, "Al")
        self.assertEqual(updated["displayName"], "Al")
        self.assertTrue(updated["displayNameChosen"])
        loaded = self.repo.get_profile(self.user)
        self.assertEqual(loaded["displayName"], "Al")
        self.assertTrue(self.repo.delete_profile(self.user))
        again = self.repo.get_profile(self.user)
        # After delete, defaults come from AuthContext.display_name
        self.assertEqual(again["displayName"], "Tester")


class RewardRepositoryTests(unittest.TestCase):
    def setUp(self):
        self._tmp = tempfile.TemporaryDirectory()
        self.dir = str(Path(self._tmp.name) / "rewards")
        Path(self.dir).mkdir()
        self.repo = JsonRewardRepository(lambda: self.dir)
        self.user = _ctx("22222222-2222-2222-2222-222222222222")

    def tearDown(self):
        self._tmp.cleanup()

    def test_apply_delta_atomic(self):
        def add_ten(state):
            state["currency"]["PUX"] = int(state["currency"].get("PUX", 0)) + 10
            state["xp"] = int(state.get("xp") or 0) + 5
            return state, state["currency"]["PUX"]

        pux = self.repo.apply_reward_delta(self.user, add_ten)
        self.assertEqual(pux, 10)
        state = self.repo.get_reward_state(self.user)
        self.assertEqual(state["currency"]["PUX"], 10)
        self.assertEqual(state["xp"], 5)

    def test_concurrent_applies_no_lost_update(self):
        def bump(_):
            def mutator(state):
                state["currency"]["PUX"] = int(state["currency"].get("PUX", 0)) + 1
                return state, True

            return self.repo.apply_reward_delta(self.user, mutator)

        with ThreadPoolExecutor(max_workers=8) as pool:
            futures = [pool.submit(bump, i) for i in range(8)]
            for f in as_completed(futures):
                self.assertTrue(f.result())

        state = self.repo.get_reward_state(self.user)
        self.assertEqual(
            state["currency"]["PUX"],
            8,
            "parallel reward deltas must not lose updates",
        )


class SessionRepositoryTests(unittest.TestCase):
    def setUp(self):
        self._tmp = tempfile.TemporaryDirectory()
        self.dir = str(Path(self._tmp.name) / "sessions")
        Path(self.dir).mkdir()
        self.repo = JsonSessionRepository(lambda: self.dir)
        self.alice = _ctx("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa", legacy="alice")
        self.bob = _ctx("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb", legacy="bob")

    def tearDown(self):
        self._tmp.cleanup()

    def test_crud_and_ownership(self):
        doc = {
            "id": f"{self.alice.rinq_user_id}_1",
            "user": self.alice.rinq_user_id,
            "state": "IN_PROGRESS",
            "created_at": "2026-03-01T12:00:00",
        }
        self.repo.create_session(doc)
        loaded = self.repo.get_session_for_user(doc["id"], self.alice)
        self.assertEqual(loaded["user"], self.alice.rinq_user_id)
        with self.assertRaises(NotFoundError):
            self.repo.get_session_for_user(doc["id"], self.bob)
        loaded["state"] = "DONE"
        self.repo.save_session(loaded)
        listed = self.repo.list_sessions_for_user(self.alice)
        self.assertEqual(len(listed), 1)
        self.assertEqual(listed[0]["state"], "DONE")
        self.assertTrue(self.repo.delete_session_for_user(doc["id"], self.alice))
        with self.assertRaises(NotFoundError):
            self.repo.get_session_for_user(doc["id"], self.alice)


if __name__ == "__main__":
    unittest.main()
