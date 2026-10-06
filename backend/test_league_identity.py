"""Canonical DNL league identity (domain vs catalog key)."""

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

from league_identity import (
    CATALOG_LEAGUE_DNL,
    DOMAIN_LEAGUE_DNL,
    apply_domain_league_fields,
    catalog_league,
    domain_league,
    is_dnl_league,
    leagues_equivalent,
    logo_folder_league,
    persist_league,
)


class LeagueIdentityUnitTests(unittest.TestCase):
    def test_domain_aliases(self):
        for raw in ("DNL", "U20_DNL", "u20-dnl", "U20"):
            self.assertTrue(is_dnl_league(raw), raw)
            self.assertEqual(domain_league(raw), DOMAIN_LEAGUE_DNL)
            self.assertEqual(persist_league(raw), DOMAIN_LEAGUE_DNL)
            self.assertEqual(catalog_league(raw), CATALOG_LEAGUE_DNL)
            self.assertEqual(logo_folder_league(raw), "u20_dnl")

    def test_other_leagues_unchanged(self):
        for raw in ("DEL", "DEL2", "CHL", "NHL"):
            self.assertFalse(is_dnl_league(raw))
            self.assertEqual(domain_league(raw), raw)
            self.assertEqual(catalog_league(raw), raw)

    def test_leagues_equivalent(self):
        self.assertTrue(leagues_equivalent("DNL", "U20_DNL"))
        self.assertFalse(leagues_equivalent("DNL", "DEL"))

    def test_apply_domain_fields_keeps_game_id(self):
        row = apply_domain_league_fields(
            {
                "id": "u20_dnl:2026_2027:abc",
                "league": "U20_DNL",
                "league_id": "U20_DNL",
            }
        )
        self.assertEqual(row["id"], "u20_dnl:2026_2027:abc")
        self.assertEqual(row["league"], "DNL")
        self.assertEqual(row["league_id"], "DNL")


if __name__ == "__main__":
    unittest.main()
