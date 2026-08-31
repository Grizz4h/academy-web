"""Security contract for the operational admin surface."""
from __future__ import annotations
import os, sys, unittest
os.environ.setdefault("ACADEMY_JWT_SECRET", "test-jwt-secret-admin-hardening-32chars")
os.environ["ACADEMY_SKIP_IDENTITY_MIGRATION"] = "1"
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from fastapi.testclient import TestClient
from identity.context import AuthContext
import main

ADMIN_ID = "00000000-0000-4000-8000-000000000001"
USER_ID = "00000000-0000-4000-8000-000000000002"
def auth(uid: str) -> AuthContext:
    return AuthContext(rinq_user_id=uid, auth_provider="supabase_email", auth_subject=uid, display_name="Test")

class AdminAccessTests(unittest.TestCase):
    def setUp(self):
        self.old = os.environ.get("RINQ_ADMIN_USER_IDS")
        os.environ["RINQ_ADMIN_USER_IDS"] = ADMIN_ID
        self.client = TestClient(main.app)
    def tearDown(self):
        main.app.dependency_overrides.clear()
        if self.old is None: os.environ.pop("RINQ_ADMIN_USER_IDS", None)
        else: os.environ["RINQ_ADMIN_USER_IDS"] = self.old
    def test_unauthenticated_is_401(self):
        self.assertEqual(self.client.get("/api/admin/me").status_code, 401)
    def test_normal_user_is_403_for_every_admin_route(self):
        main.app.dependency_overrides[main.get_current_user] = lambda: auth(USER_ID)
        cases = [("GET","/api/admin/me"),("GET","/api/admin/overview"),("GET","/api/admin/users/search?q=test"),("GET",f"/api/admin/users/{USER_ID}"),("POST",f"/api/admin/users/{USER_ID}/resync-entitlement"),("GET","/api/admin/withdrawals"),("POST",f"/api/admin/withdrawals/{ADMIN_ID}/retry-email"),("POST",f"/api/admin/withdrawals/{ADMIN_ID}/retry-processing"),("POST",f"/api/admin/withdrawals/{ADMIN_ID}/retry-premium-revoke"),("GET","/api/admin/billing/issues"),("GET","/api/admin/system/status"),("GET","/api/admin/errors"),("GET","/api/admin/audit")]
        for method, path in cases:
            with self.subTest(path=path): self.assertEqual(self.client.request(method, path).status_code, 403)
    def test_allowlisted_id_can_pass_guard(self):
        main.app.dependency_overrides[main.get_current_user] = lambda: auth(ADMIN_ID)
        response = self.client.get("/api/admin/me")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["rinq_user_id"], ADMIN_ID)
    def test_legacy_username_env_cannot_grant_new_admin_access(self):
        os.environ["ACADEMY_ADMIN_USERNAMES"] = "test"
        main.app.dependency_overrides[main.get_current_user] = lambda: AuthContext(rinq_user_id=USER_ID, auth_provider="legacy_password", auth_subject="test", display_name="Test", legacy_username="test")
        self.assertEqual(self.client.get("/api/admin/me").status_code, 403)

if __name__ == "__main__": unittest.main()
