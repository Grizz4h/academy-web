"""Validation entry points for versioned taxonomy and drill-profile documents."""

from __future__ import annotations

import hashlib
import json
from typing import Any, Dict, List

from pydantic import TypeAdapter

from .models import CompetencyId, DrillCompetencyProfile, SCHEMA_VERSION


def validate_taxonomy(document: Dict[str, Any]) -> Dict[str, Any]:
    if document.get("schemaVersion") != SCHEMA_VERSION:
        raise ValueError("unsupported taxonomy schemaVersion")
    ids = [item.get("id") for item in document.get("competencies", [])]
    expected = [item.value for item in CompetencyId]
    if len(ids) != len(set(ids)):
        raise ValueError("competency IDs must be unique")
    if set(ids) != set(expected) or len(ids) != len(expected):
        raise ValueError("taxonomy must contain exactly the eight V1 competency IDs")
    return document


def validate_drill_profiles(document: Dict[str, Any]) -> List[DrillCompetencyProfile]:
    if document.get("schemaVersion") != SCHEMA_VERSION:
        raise ValueError("unsupported drill profile collection schemaVersion")
    if document.get("weightScale") != "0-100":
        raise ValueError("weightScale must be 0-100")
    return TypeAdapter(List[DrillCompetencyProfile]).validate_python(document.get("profiles", []))


def training_map_sha256(profiles: List[Dict[str, Any]], *, prefix: str) -> str:
    """Fingerprint trainingWeights only — evidence edits must not change this."""
    rows = [
        {"drillId": profile["drillId"], "trainingWeights": profile["trainingWeights"]}
        for profile in profiles
        if str(profile.get("drillId") or "").startswith(prefix)
    ]
    return hashlib.sha256(
        json.dumps(rows, sort_keys=True, separators=(",", ":")).encode()
    ).hexdigest()
