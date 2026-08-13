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

    def test_lab_predict_template_guidance_and_entries(self):
        session = {
            "id": "lab_1",
            "learning_area": "lab",
            "lab_mode": "predict",
            "lab_template_id": "pressure_carrier_solution",
            "observed_team": "Augsburg",
            "prediction_entries": [
                {
                    "id": "p1",
                    "predictedValue": "reverse",
                    "actualValue": "reverse",
                    "resolution": "correct",
                    "predictionCues": ["support_position"],
                    "lockedAt": "2026-08-12T10:00:00",
                    "outcome": {"pressureResolution": "possession_lost"},
                }
            ],
            "prediction_summary": {"total": 1, "correct": 1},
            "drills": [],
        }
        lab_content = {
            "prediction_templates": [
                {
                    "id": "pressure_carrier_solution",
                    "title": "Wie löst der Puckführer den Druck?",
                    "learningGoal": "Optionen unter Druck früh erkennen.",
                    "reflectionGuidance": [
                        "Unterscheide Prediction Accuracy von Qualität oder Erfolg der tatsächlichen Aktion."
                    ],
                    "coreHints": ["Predicte die Entscheidung, bevor sie sichtbar wird."],
                    "observationGuide": {
                        "howToDecide": ["Lies zuerst Optionen."],
                    },
                }
            ]
        }

        payload = build_reflection_payload(session, None, lab_content)
        self.assertEqual(payload["drill"]["id"], "pressure_carrier_solution")
        self.assertIn("Optionen unter Druck", payload["drill"]["learningGoal"])
        self.assertTrue(
            any("Prediction Accuracy" in item for item in payload["drill"]["reflectionGuidance"])
        )
        predict_obs = payload["session"]["observations"][-1]
        self.assertEqual(predict_obs["phase"], "PREDICT")
        self.assertEqual(predict_obs["answers"]["predictionEntries"][0]["predictedValue"], "reverse")
        self.assertEqual(
            predict_obs["answers"]["predictionEntries"][0]["outcome"]["pressureResolution"],
            "possession_lost",
        )


if __name__ == "__main__":
    unittest.main()
