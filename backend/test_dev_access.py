"""Dev access allowlist (DevLab without admin)."""

from __future__ import annotations

import os
import sys
import unittest

os.environ.setdefault("ACADEMY_JWT_SECRET", "test-jwt-secret-phase1-hardening-32chars-min")

BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from identity.context import AuthContext
from security_guards import is_dev_access_auth


class DevAccessTests(unittest.TestCase):
    def test_paywall_test_default(self):
        env = os.environ.pop("ACADEMY_DEV_USERNAMES", None)
        try:
            auth = AuthContext(
                auth_subject="paywall-test",
                legacy_username="paywall-test",
                rinq_user_id="00000000-0000-4000-8000-000000000099",
                auth_provider="legacy_password",
            )
            self.assertTrue(is_dev_access_auth(auth))
            self.assertFalse(is_dev_access_auth(AuthContext(
                auth_subject="random-user",
                legacy_username="random-user",
                rinq_user_id="00000000-0000-4000-8000-000000000098",
                auth_provider="legacy_password",
            )))
        finally:
            if env is not None:
                os.environ["ACADEMY_DEV_USERNAMES"] = env


if __name__ == "__main__":
    unittest.main()
