"""Phase 4F — Postgres production hardening tests."""

from __future__ import annotations

import os
import sys
import unittest
from unittest.mock import patch

os.environ.setdefault("ACADEMY_JWT_SECRET", "test-jwt-secret-phase1-hardening-32chars-min")
os.environ.setdefault("ACADEMY_SKIP_IDENTITY_MIGRATION", "1")

BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)


class PoolSettingsTests(unittest.TestCase):
    def setUp(self):
        self._env = {
            k: os.environ.get(k)
            for k in (
                "ACADEMY_PG_POOL_MIN",
                "ACADEMY_PG_POOL_MAX",
                "ACADEMY_PG_CONNECT_TIMEOUT",
            )
        }
        for key in self._env:
            os.environ.pop(key, None)

    def tearDown(self):
        for key, value in self._env.items():
            if value is None:
                os.environ.pop(key, None)
            else:
                os.environ[key] = value

    def test_default_pool_settings(self):
        from db.settings import (
            DEFAULT_CONNECT_TIMEOUT_SEC,
            DEFAULT_POOL_MAX,
            DEFAULT_POOL_MIN,
            pool_connect_timeout_sec,
            pool_max_size,
            pool_min_size,
        )

        self.assertEqual(pool_min_size(), DEFAULT_POOL_MIN)
        self.assertEqual(pool_max_size(), DEFAULT_POOL_MAX)
        self.assertEqual(pool_connect_timeout_sec(), DEFAULT_CONNECT_TIMEOUT_SEC)

    def test_pool_max_not_below_min(self):
        os.environ["ACADEMY_PG_POOL_MIN"] = "4"
        os.environ["ACADEMY_PG_POOL_MAX"] = "2"
        from importlib import reload
        import db.settings as settings

        reload(settings)
        self.assertEqual(settings.pool_min_size(), 4)
        self.assertEqual(settings.pool_max_size(), 4)


class HealthPayloadTests(unittest.TestCase):
    def setUp(self):
        self._saved = {
            k: os.environ.get(k) for k in ("STORAGE_BACKEND", "DATABASE_URL")
        }

    def tearDown(self):
        for key, value in self._saved.items():
            if value is None:
                os.environ.pop(key, None)
            else:
                os.environ[key] = value

    def test_json_backend_health(self):
        os.environ["STORAGE_BACKEND"] = "json"
        os.environ.pop("DATABASE_URL", None)
        from db.health import build_health_payload

        payload, status = build_health_payload()
        self.assertEqual(status, 200)
        self.assertEqual(payload, {"status": "ok", "storage": "json"})
        self.assertNotIn("database", payload)

    def test_postgres_backend_ok(self):
        os.environ["STORAGE_BACKEND"] = "postgres"
        os.environ["DATABASE_URL"] = "postgresql://example.invalid/test"
        from db.health import build_health_payload

        with patch("db.pool.ping_database"):
            payload, status = build_health_payload()
        self.assertEqual(status, 200)
        self.assertEqual(payload["database"], "ok")
        self.assertEqual(payload["storage"], "postgres")

    def test_postgres_backend_down(self):
        os.environ["STORAGE_BACKEND"] = "postgres"
        os.environ["DATABASE_URL"] = "postgresql://example.invalid/test"
        from db.health import build_health_payload

        with patch("db.pool.ping_database", side_effect=RuntimeError("down")):
            payload, status = build_health_payload()
        self.assertEqual(status, 503)
        self.assertEqual(payload["status"], "degraded")
        self.assertEqual(payload["database"], "error")


class WiringFailFastTests(unittest.TestCase):
    def test_postgres_without_database_url_fails(self):
        os.environ["STORAGE_BACKEND"] = "postgres"
        old = os.environ.pop("DATABASE_URL", None)
        try:
            from identity.store import IdentityStore
            import tempfile
            from pathlib import Path
            from repositories.wiring import configure_repositories

            tmp = tempfile.TemporaryDirectory()
            root = Path(tmp.name)
            store = IdentityStore(str(root / "identity_store.json"))
            with self.assertRaises(RuntimeError):
                configure_repositories(
                    get_identity_store=lambda: store,
                    get_users_file=lambda: str(root / "users.json"),
                    get_profiles_dir=lambda: str(root / "profiles"),
                    get_rewards_dir=lambda: str(root / "rewards"),
                    get_sessions_dir=lambda: str(root / "sessions"),
                    storage_backend="postgres",
                )
            tmp.cleanup()
        finally:
            if old is not None:
                os.environ["DATABASE_URL"] = old
            os.environ.pop("STORAGE_BACKEND", None)


@unittest.skipUnless(
    os.environ.get("TEST_DATABASE_URL"),
    "TEST_DATABASE_URL not set — live constraint probes skipped",
)
class LiveConstraintTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        url = os.environ["TEST_DATABASE_URL"]
        os.environ["STORAGE_BACKEND"] = "postgres"
        os.environ["DATABASE_URL"] = url
        from db.pool import close_pool, configure_pool

        close_pool()
        configure_pool()

    @classmethod
    def tearDownClass(cls):
        from db.pool import close_pool

        close_pool()

    def test_reward_xp_check_constraint(self):
        from psycopg.errors import CheckViolation
        from db.pool import connection

        with connection() as conn:
            user = conn.execute(
                "SELECT rinq_user_id::text FROM app_users LIMIT 1"
            ).fetchone()
            self.assertIsNotNone(user)
            rid = user["rinq_user_id"]
            with self.assertRaises(CheckViolation):
                with conn.transaction():
                    conn.execute(
                        """
                        INSERT INTO reward_states (rinq_user_id, xp, pux)
                        VALUES (%s::uuid, -1, 0)
                        ON CONFLICT (rinq_user_id) DO UPDATE SET xp = -1
                        """,
                        (rid,),
                    )

    def test_auth_link_global_uniqueness(self):
        from psycopg.errors import UniqueViolation
        from db.pool import connection

        with connection() as conn:
            row = conn.execute(
                """
                SELECT rinq_user_id::text, provider, provider_subject
                FROM auth_links LIMIT 1
                """
            ).fetchone()
            self.assertIsNotNone(row)
            other = conn.execute(
                "SELECT rinq_user_id::text FROM app_users WHERE rinq_user_id <> %s::uuid LIMIT 1",
                (row["rinq_user_id"],),
            ).fetchone()
            if not other:
                self.skipTest("need at least two app_users rows")
            with self.assertRaises(UniqueViolation):
                with conn.transaction():
                    conn.execute(
                        """
                        INSERT INTO auth_links (rinq_user_id, provider, provider_subject)
                        VALUES (%s::uuid, %s, %s)
                        """,
                        (other["rinq_user_id"], row["provider"], row["provider_subject"]),
                    )


if __name__ == "__main__":
    unittest.main()
