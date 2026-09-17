"""Path-safety tests for protected club logos."""

from __future__ import annotations

import json
import tempfile
import unittest
from pathlib import Path

from team_logo_store import (
    is_public_cleared_logo,
    load_cleared_catalog_ids,
    resolve_protected_logo,
)


class ResolveProtectedLogoTests(unittest.TestCase):
    def setUp(self):
        self._tmp = tempfile.TemporaryDirectory()
        self.root = Path(self._tmp.name)
        (self.root / "del").mkdir()
        (self.root / "del" / "eisbaren_berlin.png").write_bytes(b"png")

    def tearDown(self):
        self._tmp.cleanup()

    def test_known_file(self):
        path = resolve_protected_logo("del", "eisbaren_berlin.png", root=self.root)
        self.assertIsNotNone(path)
        self.assertTrue(path.is_file())

    def test_unknown_league(self):
        self.assertIsNone(resolve_protected_logo("nhl", "eisbaren_berlin.png", root=self.root))

    def test_missing_file(self):
        self.assertIsNone(resolve_protected_logo("del", "missing.png", root=self.root))

    def test_rejects_traversal(self):
        secret = Path(self._tmp.name).parent / "secret.txt"
        # filename regex should already reject slashes and dots
        self.assertIsNone(resolve_protected_logo("del", "../secret.txt", root=self.root))
        self.assertIsNone(resolve_protected_logo("del", "..%2fsecret.txt", root=self.root))
        self.assertIsNone(resolve_protected_logo("del/../del", "eisbaren_berlin.png", root=self.root))
        self.assertFalse(secret.exists() and resolve_protected_logo("del", str(secret), root=self.root))


class ClubLogoClearanceTests(unittest.TestCase):
    def setUp(self):
        self._tmp = tempfile.TemporaryDirectory()
        self.path = Path(self._tmp.name) / "club_logo_clearance.json"

    def tearDown(self):
        self._tmp.cleanup()

    def test_true_ids_only(self):
        self.path.write_text(
            json.dumps({
                "_comment": "ignore",
                "eisbaren_berlin": True,
                "augsburger_panther": True,
                "straubing_tigers": False,
            }),
            encoding="utf-8",
        )
        ids = load_cleared_catalog_ids(path=self.path)
        self.assertEqual(ids, {"eisbaren_berlin", "augsburger_panther"})
        self.assertTrue(is_public_cleared_logo("eisbaren_berlin.png", path=self.path))
        self.assertTrue(is_public_cleared_logo("augsburger_panther.svg", path=self.path))
        self.assertFalse(is_public_cleared_logo("straubing_tigers.svg", path=self.path))

    def test_hyphen_normalized(self):
        self.path.write_text(json.dumps({"eisbaren-berlin": True}), encoding="utf-8")
        self.assertTrue(is_public_cleared_logo("eisbaren_berlin.png", path=self.path))

    def test_missing_file_is_empty(self):
        self.assertEqual(load_cleared_catalog_ids(path=self.path), set())


if __name__ == "__main__":
    unittest.main()
