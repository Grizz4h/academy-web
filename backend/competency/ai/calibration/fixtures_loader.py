"""Load synthetic calibration fixtures — expectedBand never sent to the evaluator."""

from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, List, Optional

FIXTURES_DIR = Path(__file__).resolve().parent / "fixtures"

DRILL_FIXTURE_FILES = {
    "B2_D5": "b2_d5.json",
    "E1_D1": "e1_d1.json",
}

DRILL_TITLES = {
    "B2_D5": "Beobachtungstendenzen unter Druck",
    "E1_D1": "Wiederholt sich wirklich etwas?",
}

DRILL_CONFIGS: Dict[str, Dict[str, Any]] = {
    "B2_D5": {
        "questions": [
            {
                "key": "decision_pattern",
                "options": [
                    {"value": "sicherheit_vereinfachung", "label": "Sicherheit und Vereinfachung"},
                    {"value": "kontrolle_stabilisierung", "label": "Kontrolle und Stabilisierung"},
                    {"value": "aktiver_vorwaertsimpuls", "label": "Aktiver Vorwärtsimpuls"},
                    {"value": "wechselhaft_instabil", "label": "Wechselhaft / kein klares Muster"},
                    {"value": "unklar", "label": "Unklar"},
                ],
            },
            {
                "key": "pattern_evidence",
                "options": [
                    {"value": "haeufige_sicherheitsloesungen", "label": "Häufige Sicherheitslösungen"},
                    {"value": "kontrollierte_rueck_querpaesse", "label": "Kontrollierte Rück- und Querpässe"},
                    {"value": "struktur_vor_tempo", "label": "Struktur wurde vor Tempo priorisiert"},
                    {"value": "direkte_vertikalaktionen", "label": "Direkte Vertikalaktionen"},
                    {"value": "tempo_nach_puckgewinn", "label": "Schnelles Tempo nach Puckgewinn"},
                    {"value": "wiederholte_unklare_anschluesse", "label": "Wiederholte unklare Anschlussaktionen"},
                    {"value": "unterschiedliche_situationen", "label": "Viele unterschiedliche Situationen ohne klare Tendenz"},
                ],
            },
        ]
    },
    "E1_D1": {
        "logs_key": "pattern_observations",
        "summary_key": "pattern_summary",
        "assessment_key": "pattern_assessment",
        "minObservations": 3,
    },
}


@dataclass(frozen=True)
class CalibrationCase:
    drill_id: str
    case_id: str
    expected_band: str
    case_kind: str
    answers: Dict[str, Any]
    notes: str = ""
    drill_title: str = ""
    drill_config: Optional[Dict[str, Any]] = None

    def evaluator_answers(self) -> Dict[str, Any]:
        """Answers only — no expectedBand / caseKind leakage."""
        return dict(self.answers)


def fixtures_dir() -> Path:
    return FIXTURES_DIR


def load_fixture_document(drill_id: str, *, directory: Optional[Path] = None) -> List[Dict[str, Any]]:
    drill_id = str(drill_id or "").strip()
    filename = DRILL_FIXTURE_FILES.get(drill_id)
    if filename is None:
        raise KeyError(f"no calibration fixtures for drill {drill_id}")
    path = (directory or FIXTURES_DIR) / filename
    data = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(data, list):
        raise ValueError(f"fixture {path} must be a JSON array")
    return data


def load_cases(
    drill_ids: Optional[List[str]] = None,
    *,
    directory: Optional[Path] = None,
) -> List[CalibrationCase]:
    ids = drill_ids or list(DRILL_FIXTURE_FILES.keys())
    cases: List[CalibrationCase] = []
    for drill_id in ids:
        for row in load_fixture_document(drill_id, directory=directory):
            case_id = str(row.get("caseId") or "").strip()
            expected = str(row.get("expectedBand") or "").strip().lower()
            if not case_id or not expected:
                raise ValueError(f"fixture row missing caseId/expectedBand for {drill_id}")
            answers = row.get("answers")
            if not isinstance(answers, dict):
                raise ValueError(f"fixture {case_id} answers must be an object")
            cases.append(
                CalibrationCase(
                    drill_id=drill_id,
                    case_id=case_id,
                    expected_band=expected,
                    case_kind=str(row.get("caseKind") or "band").strip().lower(),
                    answers=answers,
                    notes=str(row.get("notes") or ""),
                    drill_title=DRILL_TITLES.get(drill_id, drill_id),
                    drill_config=dict(DRILL_CONFIGS.get(drill_id) or {}),
                )
            )
    return cases
