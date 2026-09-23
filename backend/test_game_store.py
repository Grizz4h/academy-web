"""Catalog upsert keeps one row per pairing when penny-del IDs appear after kickoff."""

from __future__ import annotations

import tempfile
import unittest
from pathlib import Path

from del_data.game_store import collapse_pairing_duplicates, upsert_games


def _game(**overrides):
    row = {
        "id": "del:2026_2027:stub",
        "league_id": "DEL",
        "season_id": "2026/27",
        "phase_id": "hauptrunde",
        "matchday": 1,
        "date": "2026-09-17",
        "time": "19:30",
        "home_team_id": "eisbaren_berlin",
        "away_team_id": "straubing_tigers",
        "home_team_name": "Eisbären Berlin",
        "away_team_name": "Straubing Tigers",
        "status": "scheduled",
        "score": None,
        "source": {
            "provider": "penny_del",
            "external_id": "20260917_eisbaren_berlin_vs_straubing_tigers",
            "imported_at": "2026-08-11T10:00:00Z",
        },
    }
    row.update(overrides)
    return row


class CollapsePairingDuplicatesTests(unittest.TestCase):
    def test_prefers_final_penny_id_over_preseason_stub(self):
        stub = _game()
        played = _game(
            id="del:2026_2027:17092026_eisbaeren-berlin_gg_straubing-tigers_4389",
            status="final",
            score={"home": 4, "away": 2},
            source={
                "provider": "penny_del",
                "external_id": "17092026_eisbaeren-berlin_gg_straubing-tigers_4389",
                "imported_at": "2026-09-21T20:40:00Z",
            },
        )
        collapsed = collapse_pairing_duplicates([stub, played])
        self.assertEqual(len(collapsed), 1)
        self.assertEqual(collapsed[0]["id"], played["id"])
        self.assertEqual(collapsed[0]["status"], "final")
        self.assertEqual(collapsed[0]["score"]["home"], 4)

    def test_moves_stats_onto_canonical_row(self):
        stub = _game(stats={"imported_at": "kept"})
        played = _game(
            id="del:2026_2027:17092026_eisbaeren-berlin_gg_straubing-tigers_4389",
            status="final",
            score={"home": 4, "away": 2},
            source={
                "provider": "penny_del",
                "external_id": "17092026_eisbaeren-berlin_gg_straubing-tigers_4389",
                "imported_at": "2026-09-21T20:40:00Z",
            },
        )
        collapsed = collapse_pairing_duplicates([stub, played])
        self.assertEqual(collapsed[0]["stats"]["imported_at"], "kept")


class UpsertGamesTests(unittest.TestCase):
    def test_upsert_replaces_stub_when_penny_id_arrives(self):
        with tempfile.TemporaryDirectory() as tmp:
            games_dir = str(Path(tmp))
            first = upsert_games(games_dir, league="DEL", season="2026/27", games=[_game()])
            self.assertEqual(first["total"], 1)
            played = _game(
                id="del:2026_2027:17092026_eisbaeren-berlin_gg_straubing-tigers_4389",
                status="final",
                score={"home": 4, "away": 2},
                source={
                    "provider": "penny_del",
                    "external_id": "17092026_eisbaeren-berlin_gg_straubing-tigers_4389",
                    "imported_at": "2026-09-21T20:40:00Z",
                },
            )
            second = upsert_games(games_dir, league="DEL", season="2026/27", games=[played])
            self.assertEqual(second["total"], 1)
            self.assertEqual(second["removed_duplicates"], 1)
            catalog = Path(tmp) / "del_2026_2027.json"
            import json
            games = json.loads(catalog.read_text(encoding="utf-8"))["games"]
            self.assertEqual(len(games), 1)
            self.assertEqual(games[0]["status"], "final")
            self.assertNotIn("_vs_", games[0]["id"])


if __name__ == "__main__":
    unittest.main()
