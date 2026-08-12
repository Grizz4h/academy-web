import json
import os
import sys
import unittest

BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from reflection.payload import build_reflection_payload
from reflection.schema import AiSessionReflection, REFLECTION_JSON_SCHEMA


class ReflectionPayloadTests(unittest.TestCase):
    def test_payload_strips_internal_keys_and_coordinates(self):
        session = {
            "id": "test_1",
            "module_id": "B3",
            "observation_scope": "P1",
            "checkins": [
                {
                    "phase": "P1",
                    "answers": {
                        "__draggable_rink_observation_draft": {"note": "draft"},
                        "defensive_pressure_observations": [
                            {
                                "initiatorPosition": "LW",
                                "accessLocation": {"x": 0.3, "y": 0.8},
                                "zone": "offensive",
                                "note": "forecheck",
                            }
                        ],
                        "pressure_pattern_reflection": "nein",
                    },
                }
            ],
            "drills": [
                {
                    "id": "B3_D1",
                    "title": "Druck",
                    "config": {
                        "zone_labels": {"offensive": "Offensive Zone"},
                        "completion_reflection": {"label": "Muster?"},
                    },
                    "didactics": {
                        "goal": "Ersten Druck sehen",
                        "observation_guide": {
                            "what_to_watch": ["Erster Druck"],
                            "ignore": ["Ergebnis"],
                        },
                    },
                }
            ],
        }

        payload = build_reflection_payload(session, ["Modulziel"])
        observations = payload["session"]["observations"][0]["answers"]
        self.assertNotIn("__draggable_rink_observation_draft", observations)
        self.assertIn("defensive_pressure_observations", observations)
        item = observations["defensive_pressure_observations"][0]
        self.assertEqual(item["zoneLabel"], "Offensive Zone")
        self.assertNotIn("accessLocation", item)
        self.assertIn("Ersten Druck sehen", payload["drill"]["learningGoal"])
        self.assertTrue(payload["drill"]["reflectionGuidance"])

    def test_schema_validation(self):
        content = AiSessionReflection.model_validate(
            {
                "strengths": ["Klar getrennt"],
                "cautions": ["Vorsicht bei Verallgemeinerung"],
                "nextObservationFocus": "Nächstes Mal Gegenbeispiel suchen",
                "summary": "Solide Beobachtungsbasis mit kleiner Interpretationslücke.",
            }
        )
        self.assertEqual(len(content.strengths), 1)
        self.assertIn("nextObservationFocus", content.model_dump())

    def test_json_schema_has_required_fields(self):
        required = set(REFLECTION_JSON_SCHEMA["required"])
        self.assertIn("summary", required)
        self.assertIn("nextObservationFocus", required)


if __name__ == "__main__":
    unittest.main()
