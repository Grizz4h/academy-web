"""CORS boundary tests — Board Studio WebView vs existing Vite origins."""

from __future__ import annotations

import os
import sys
import unittest

os.environ["ACADEMY_JWT_SECRET"] = "test-jwt-secret-phase1-hardening-32chars-min"
os.environ["ACADEMY_SKIP_IDENTITY_MIGRATION"] = "1"
os.environ["STORAGE_BACKEND"] = "json"

BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from fastapi.testclient import TestClient

import main as backend_main


BOARD_STUDIO_DEV_ORIGIN = "http://localhost:1420"
EXISTING_VITE_ORIGIN = "http://localhost:5174"
FOREIGN_ORIGIN = "http://evil.example:9999"

PREFLIGHT_HEADERS = {
    "Access-Control-Request-Method": "GET",
    "Access-Control-Request-Headers": "authorization",
}


class CorsBoundaryTests(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(backend_main.app)

    def tearDown(self):
        self.client.close()

    def test_board_studio_dev_origin_is_listed(self):
        self.assertIn(BOARD_STUDIO_DEV_ORIGIN, backend_main.CORS_ALLOW_ORIGINS)
        self.assertIn(EXISTING_VITE_ORIGIN, backend_main.CORS_ALLOW_ORIGINS)

    def test_preflight_board_studio_dev_allows_authorization(self):
        res = self.client.options(
            "/api/scenes",
            headers={"Origin": BOARD_STUDIO_DEV_ORIGIN, **PREFLIGHT_HEADERS},
        )
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.headers.get("access-control-allow-origin"), BOARD_STUDIO_DEV_ORIGIN)
        allow_headers = (res.headers.get("access-control-allow-headers") or "").lower()
        self.assertIn("authorization", allow_headers)
        allow_methods = (res.headers.get("access-control-allow-methods") or "").upper()
        self.assertIn("GET", allow_methods)

    def test_preflight_existing_vite_origin_still_allowed(self):
        res = self.client.options(
            "/api/scenes",
            headers={"Origin": EXISTING_VITE_ORIGIN, **PREFLIGHT_HEADERS},
        )
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.headers.get("access-control-allow-origin"), EXISTING_VITE_ORIGIN)

    def test_preflight_foreign_origin_rejected(self):
        res = self.client.options(
            "/api/scenes",
            headers={"Origin": FOREIGN_ORIGIN, **PREFLIGHT_HEADERS},
        )
        self.assertEqual(res.status_code, 400)
        self.assertIn("disallowed cors origin", (res.text or "").lower())
        self.assertNotEqual(res.headers.get("access-control-allow-origin"), FOREIGN_ORIGIN)

    def test_scenes_get_without_bearer_still_401(self):
        res = self.client.get(
            "/api/scenes",
            headers={"Origin": BOARD_STUDIO_DEV_ORIGIN},
        )
        self.assertEqual(res.status_code, 401)
        self.assertEqual(res.headers.get("access-control-allow-origin"), BOARD_STUDIO_DEV_ORIGIN)


if __name__ == "__main__":
    unittest.main()
