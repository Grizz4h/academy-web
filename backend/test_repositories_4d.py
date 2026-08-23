"""Phase 4D — mapping + wiring tests that do not need a live Postgres."""

from __future__ import annotations

import json
import os
import sys
import tempfile
import unittest
from pathlib import Path

os.environ["ACADEMY_JWT_SECRET"] = "test-jwt-secret-phase1-hardening-32chars-min"
os.environ["ACADEMY_SKIP_IDENTITY_MIGRATION"] = "1"
os.environ.pop("STORAGE_BACKEND", None)
os.environ.pop("DATABASE_URL", None)

BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from identity.store import IdentityStore
from repositories.pg_mapping import (
    merge_profile_row,
    merge_reward_row,
    merge_session_row,
    split_profile,
    split_reward,
    split_session,
)
from repositories.wiring import configure_repositories, get_repos


class MappingRoundTripTests(unittest.TestCase):
    def test_session_split_merge(self):
        doc = {
            "id": "s1",
            "user": "11111111-1111-1111-1111-111111111111",
            "state": "COMPLETED",
            "module_id": "B1",
            "drill_id": "B1_D1",
            "created_at": "2026-01-01T12:00:00",
            "checkins": {"P1": {"ok": True}},
            "drafts": {"a": 1},
        }
        cols, payload = split_session(doc)
        self.assertEqual(cols["session_id"], "s1")
        self.assertIn("checkins", payload)
        self.assertNotIn("id", payload)
        row = {
            **cols,
            "rinq_user_id": cols["rinq_user_id"],
            "payload": payload,
        }
        merged = merge_session_row(row)
        self.assertEqual(merged["id"], "s1")
        self.assertEqual(merged["checkins"]["P1"]["ok"], True)
        self.assertEqual(merged["state"], "COMPLETED")

    def test_reward_xp_pux(self):
        doc = {
            "xp": 120,
            "currency": {"PUX": 40},
            "unlockedAchievements": {"a1": True},
            "progressionPuxGranted": 5,
        }
        cols = split_reward(doc)
        self.assertEqual(cols["xp"], 120)
        self.assertEqual(cols["pux"], 40)
        merged = merge_reward_row(
            {
                "xp": 120,
                "pux": 40,
                "progression_pux_granted": 5,
                "payload": cols["payload"],
                "bootstrap_completed_at": None,
                "last_updated_at": None,
            }
        )
        self.assertEqual(merged["xp"], 120)
        self.assertEqual(merged["currency"]["PUX"], 40)

    def test_profile_display(self):
        display, chosen, payload, _ = split_profile(
            {"displayName": "Chris", "displayNameChosen": True, "bannerId": "b1"}
        )
        self.assertEqual(display, "Chris")
        self.assertTrue(chosen)
        self.assertEqual(payload.get("bannerId"), "b1")
        merged = merge_profile_row(
            {
                "display_name": display,
                "display_name_chosen": chosen,
                "payload": payload,
                "updated_at": None,
            }
        )
        self.assertEqual(merged["displayName"], "Chris")
        self.assertEqual(merged["bannerId"], "b1")


class WiringDefaultJsonTests(unittest.TestCase):
    def test_default_json_backend(self):
        tmp = tempfile.TemporaryDirectory()
        self.addCleanup(tmp.cleanup)
        root = Path(tmp.name)
        store = IdentityStore(str(root / "identity_store.json"))
        repos = configure_repositories(
            get_identity_store=lambda: store,
            get_users_file=lambda: str(root / "users.json"),
            get_profiles_dir=lambda: str(root / "profiles"),
            get_rewards_dir=lambda: str(root / "rewards"),
            get_sessions_dir=lambda: str(root / "sessions"),
        )
        self.assertEqual(repos.backend, "json")
        self.assertEqual(get_repos().backend, "json")

    def test_postgres_without_url_fails(self):
        tmp = tempfile.TemporaryDirectory()
        self.addCleanup(tmp.cleanup)
        root = Path(tmp.name)
        store = IdentityStore(str(root / "identity_store.json"))
        old_url = os.environ.pop("DATABASE_URL", None)
        try:
            with self.assertRaises(RuntimeError):
                configure_repositories(
                    get_identity_store=lambda: store,
                    get_users_file=lambda: str(root / "users.json"),
                    get_profiles_dir=lambda: str(root / "profiles"),
                    get_rewards_dir=lambda: str(root / "rewards"),
                    get_sessions_dir=lambda: str(root / "sessions"),
                    storage_backend="postgres",
                )
        finally:
            if old_url is not None:
                os.environ["DATABASE_URL"] = old_url


@unittest.skipUnless(
    bool(os.environ.get("TEST_DATABASE_URL") or os.environ.get("DATABASE_URL")),
    "Set TEST_DATABASE_URL (or DATABASE_URL) to a non-production Postgres to run",
)
class PostgresRepositoryLiveTests(unittest.TestCase):
    """MANUAL: point at staging/local DB with 001 schema applied — never production by default."""

    @classmethod
    def setUpClass(cls):
        url = os.environ.get("TEST_DATABASE_URL") or os.environ.get("DATABASE_URL")
        os.environ["DATABASE_URL"] = url
        from db.pool import close_pool, configure_pool

        configure_pool(conninfo=url)
        cls._close = close_pool

    @classmethod
    def tearDownClass(cls):
        cls._close()

    def test_auth_link_uniqueness_and_reward_tx(self):
        from identity.context import AuthContext, LEGACY_PASSWORD_PROVIDER, SUPABASE_GOOGLE_PROVIDER
        from repositories.errors import DuplicateAuthLinkError
        from repositories.pg_identity import PostgresIdentityRepository
        from repositories.pg_reward import PostgresRewardRepository

        ident = PostgresIdentityRepository()
        a = ident.ensure_legacy_identity("4d_test_alice")
        b = ident.ensure_provider_identity(SUPABASE_GOOGLE_PROVIDER, "4d-test-google-sub")
        ident.create_auth_link(a.rinq_user_id, SUPABASE_GOOGLE_PROVIDER, "4d-shared-sub")
        with self.assertRaises(DuplicateAuthLinkError):
            ident.create_auth_link(b.rinq_user_id, SUPABASE_GOOGLE_PROVIDER, "4d-shared-sub")

        rewards = PostgresRewardRepository()
        user = AuthContext(
            rinq_user_id=a.rinq_user_id,
            auth_provider=LEGACY_PASSWORD_PROVIDER,
            auth_subject="4d_test_alice",
            display_name="Alice",
            legacy_username="4d_test_alice",
        )

        def mutator(state):
            state = {**state, "xp": int(state.get("xp") or 0) + 3}
            currency = dict(state.get("currency") or {})
            currency["PUX"] = int(currency.get("PUX") or 0) + 1
            state["currency"] = currency
            return state, state["xp"]

        xp = rewards.apply_reward_delta(user, mutator)
        self.assertGreaterEqual(xp, 3)
        again = rewards.get_reward_state(user)
        self.assertEqual(again["xp"], xp)

        # cleanup
        ident.delete_identity_cascade(a.rinq_user_id)
        ident.delete_identity_cascade(b.rinq_user_id)


class MigrateDryRunLogicTests(unittest.TestCase):
    def test_cli_help_imports(self):
        from migration import cli, importer, verify

        self.assertTrue(callable(cli.main))
        self.assertTrue(callable(importer.migrate_from_json))
        self.assertTrue(callable(verify.verify_migration))


class CanonicalizationTests(unittest.TestCase):
    def setUp(self):
        self._tmp = tempfile.TemporaryDirectory()
        self.root = Path(self._tmp.name)
        self.rid = "30de6c03-3f4d-4617-8a2c-bb5786b688c0"
        self.identities = [
            {
                "rinq_user_id": self.rid,
                "legacy_username": "christoph",
                "status": "active",
            }
        ]
        rewards = self.root / "rewards"
        rewards.mkdir()
        (rewards / f"{self.rid}.json").write_text(
            json.dumps({"xp": 10850, "currency": {"PUX": 2475}}),
            encoding="utf-8",
        )
        (rewards / "christoph.json").write_text(
            json.dumps({"xp": 0, "currency": {"PUX": 0}}),
            encoding="utf-8",
        )

    def tearDown(self):
        self._tmp.cleanup()

    def test_uuid_file_wins_over_legacy(self):
        from migration.canonical import canonicalize_user_json_dir

        bundle = canonicalize_user_json_dir(
            self.root / "rewards", self.identities, domain="rewards"
        )
        self.assertEqual(bundle.canonical_records, 1)
        self.assertEqual(bundle.records[self.rid]["xp"], 10850)
        self.assertIn("christoph.json", bundle.legacy_duplicate_skipped)

    def test_uuid_file_wins_regardless_of_sort_order(self):
        from migration.canonical import canonicalize_user_json_dir

        rewards = self.root / "rewards"
        (rewards / "christoph.json").write_text(
            json.dumps({"xp": 0, "currency": {"PUX": 0}}),
            encoding="utf-8",
        )
        bundle = canonicalize_user_json_dir(rewards, self.identities, domain="rewards")
        self.assertEqual(bundle.records[self.rid]["currency"]["PUX"], 2475)

    def test_semantic_counts_not_raw_files(self):
        from migration.importer import _plan_wave1

        profiles = self.root / "profiles"
        profiles.mkdir()
        (profiles / f"{self.rid}.json").write_text('{"displayName":"Chris"}', encoding="utf-8")
        (profiles / "christoph.json").write_text('{"displayName":"Stale"}', encoding="utf-8")
        _, reward_bundle, _, planned = _plan_wave1(self.root, self.identities, [], [])
        self.assertEqual(planned["profiles"], 1)
        self.assertEqual(planned["reward_states"], 1)
        self.assertEqual(reward_bundle.source_files, 2)

    def test_multiple_legacy_only_is_conflict(self):
        from migration.canonical import canonicalize_user_json_dir

        rewards = self.root / "rewards"
        (rewards / f"{self.rid}.json").unlink()
        (rewards / "christoph.json").write_text('{"xp": 1}', encoding="utf-8")
        (rewards / "Christoph.json").write_text('{"xp": 2}', encoding="utf-8")
        bundle = canonicalize_user_json_dir(rewards, self.identities, domain="rewards")
        self.assertEqual(bundle.canonical_records, 0)
        self.assertTrue(any("conflict" in e for e in bundle.errors))


if __name__ == "__main__":
    unittest.main()
