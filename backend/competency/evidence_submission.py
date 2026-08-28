"""Unified competency evidence dispatch for final drill checkins."""

from __future__ import annotations

import logging
from typing import Any, Dict

from identity.context import AuthContext

from competency.ai.evaluator import AiEvidenceEvaluator
from competency.service import CompetencyRecomputeService
from competency.structured.curriculum import merged_drill_config, resolve_session_drill
from competency.structured.evaluator import StructuredEvidenceEvaluator
from repositories.errors import RepositoryError, StorageError


def process_evidence_for_checkin(
    user: AuthContext,
    *,
    session_id: str,
    session: Dict[str, Any],
    answers: Dict[str, Any],
    final: bool,
    recompute_service: CompetencyRecomputeService,
) -> int:
    """Evaluate final submission and append evidence events.

    Dispatch:
      structured supported → StructuredEvidenceEvaluator
      ai supported         → AiEvidenceEvaluator
      unsupported          → no evidence

    Returns number of events appended (0 = legitimately no evidence).
    Raises StorageError / RepositoryError on persistence failures.
    AI/provider failures return 0 without failing the checkin.
    """
    if not final:
        return 0
    if session.get("is_dummy") is True:
        return 0

    resolved = resolve_session_drill(session)
    if resolved is None:
        return 0

    drill_id, session_drill = resolved
    if drill_id.upper().startswith("E4_"):
        return 0

    structured = StructuredEvidenceEvaluator()
    ai = AiEvidenceEvaluator()

    if structured.supports_drill(drill_id):
        evaluator = structured
    elif ai.supports_drill(drill_id):
        evaluator = ai
    else:
        return 0

    config = merged_drill_config(session_drill)
    source_id = f"{session_id}:{drill_id}"
    drill_title = str(session_drill.get("title") or "")

    if isinstance(evaluator, StructuredEvidenceEvaluator):
        events = evaluator.evaluate(
            drill_id=drill_id,
            answers=answers or {},
            drill_config=config,
            source_id=source_id,
        )
        evaluator_kind = "structured"
    else:
        events = evaluator.evaluate(
            drill_id=drill_id,
            answers=answers or {},
            drill_config=config,
            source_id=source_id,
            drill_title=drill_title,
        )
        evaluator_kind = "ai"

    if not events:
        return 0

    recompute_service.append_events_and_recompute(user, events)
    logging.info(
        "[competency] %s evidence session=%s drill=%s events=%s user=%s",
        evaluator_kind,
        session_id,
        drill_id,
        len(events),
        user.rinq_user_id,
    )
    return len(events)


def process_structured_evidence_for_checkin(
    user: AuthContext,
    *,
    session_id: str,
    session: Dict[str, Any],
    answers: Dict[str, Any],
    final: bool,
    recompute_service: CompetencyRecomputeService,
) -> int:
    """Backward-compatible alias — delegates to unified dispatcher."""
    return process_evidence_for_checkin(
        user,
        session_id=session_id,
        session=session,
        answers=answers,
        final=final,
        recompute_service=recompute_service,
    )
