"""Redacted competency export for account self-service (no secrets/PII beyond user data)."""

from __future__ import annotations

from typing import Any, Dict, List

from identity.context import AuthContext

from .api import map_competency_item
from .taxonomy import load_taxonomy_competencies


def collect_competency_export(user: AuthContext, repos: Any) -> Dict[str, Any]:
    """Export competency projection + evidence events for the authenticated user only."""
    states = list(repos.competency_states.list_for_user(user))
    by_id = {str(s.competencyId): s for s in states}
    state_rows: List[Dict[str, Any]] = []
    for axis in load_taxonomy_competencies():
        state = by_id.get(axis["id"])
        if state is None:
            state_rows.append(
                {
                    "competencyId": axis["id"],
                    "label": axis["label"],
                    "score": 0.0,
                    "confidence": 0.0,
                    "breadth": 0.0,
                    "evidenceCount": 0,
                    "highestEvidenceLevel": 0,
                    "lastEvidenceAt": None,
                    "status": "unrated",
                }
            )
        else:
            state_rows.append(map_competency_item(state, label=axis["label"]))

    events = list(repos.competency_events.list_for_user(user))
    event_rows: List[Dict[str, Any]] = []
    for event in events:
        event_rows.append(
            {
                "eventId": str(event.eventId),
                "drillId": event.drillId,
                "competencyId": str(event.competencyId),
                "quality": float(event.quality),
                "strength": float(event.strength),
                "evidenceLevel": int(event.evidenceLevel),
                "assessmentSource": str(event.assessmentSource),
                "createdAt": event.createdAt.isoformat() if event.createdAt else None,
            }
        )

    return {
        "competency_states": state_rows,
        "competency_evidence_events": event_rows,
    }
