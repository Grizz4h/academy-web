"""Wire structured evidence generation into session checkins (delegates to unified dispatcher)."""

from __future__ import annotations

from competency.evidence_submission import process_structured_evidence_for_checkin

__all__ = ["process_structured_evidence_for_checkin"]
