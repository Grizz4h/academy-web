"""Wire structured evidence generation into session checkins."""

from __future__ import annotations

import logging
from typing import Any, Dict

from identity.context import AuthContext

from competency.service import CompetencyRecomputeService
from repositories.errors import RepositoryError, StorageError

from .curriculum import merged_drill_config, resolve_session_drill
from .evaluator import StructuredEvidenceEvaluator


def process_structured_evidence_for_checkin(
    user: AuthContext,
    *,
    session_id: str,
    session: Dict[str, Any],
    answers: Dict[str, Any],
    final: bool,
    recompute_service: CompetencyRecomputeService,
) -> int:
    """Evaluate structured submission and append evidence events.

    Returns number of events appended (0 = legitimately no evidence).
    Raises StorageError / RepositoryError on persistence failures.
    """
    if not final:
        return 0
    if session.get("is_dummy") is True:
        return 0

    resolved = resolve_session_drill(session)
    if resolved is None:
        return 0

    drill_id, session_drill = resolved
    evaluator = StructuredEvidenceEvaluator()
    if not evaluator.supports_drill(drill_id):
        return 0

    if drill_id.upper().startswith("E4_"):
        return 0

    config = merged_drill_config(session_drill)
    source_id = f"{session_id}:{drill_id}"
    events = evaluator.evaluate(
        drill_id=drill_id,
        answers=answers or {},
        drill_config=config,
        source_id=source_id,
    )
    if not events:
        return 0

    recompute_service.append_events_and_recompute(user, events)
    logging.info(
        "[competency] structured evidence session=%s drill=%s events=%s user=%s",
        session_id,
        drill_id,
        len(events),
        user.rinq_user_id,
    )
    return len(events)
