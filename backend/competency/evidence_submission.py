"""Unified competency evidence dispatch for final drill checkins."""

from __future__ import annotations

import logging
from typing import Any, Dict

from identity.context import AuthContext

from competency.ai.constants import SOURCE_TYPE as AI_SOURCE_TYPE
from competency.ai.evaluator import AiEvidenceEvaluator
from competency.completion_gate import is_submission_complete_for_evidence
from competency.service import CompetencyRecomputeService
from competency.structured.constants import SOURCE_TYPE as STRUCTURED_SOURCE_TYPE
from competency.structured.curriculum import (
    curriculum_drill_config,
    load_curriculum_drill,
    resolve_session_drill,
)
from competency.structured.evaluator import StructuredEvidenceEvaluator


EVIDENCE_SOURCE_TYPE = STRUCTURED_SOURCE_TYPE


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
        evaluator_kind = "structured"
    elif ai.supports_drill(drill_id):
        evaluator = ai
        evaluator_kind = "ai"
    else:
        return 0

    # H2: curriculum-only config — never session/client overrides
    config = curriculum_drill_config(drill_id)
    source_id = f"{session_id}:{drill_id}"

    # H3: idempotency before AI / expensive evaluate
    if recompute_service.events.exists_for_source(
        user,
        source_type=EVIDENCE_SOURCE_TYPE,
        source_id=source_id,
    ):
        logging.info(
            "[competency] skip evaluate (source exists) session=%s drill=%s user=%s",
            session_id,
            drill_id,
            user.rinq_user_id,
        )
        return 0

    # H1: server completion gate — incomplete final must not start pipeline
    if not is_submission_complete_for_evidence(drill_id, answers or {}, config):
        logging.info(
            "[competency] skip evidence (incomplete) session=%s drill=%s user=%s",
            session_id,
            drill_id,
            user.rinq_user_id,
        )
        return 0

    curriculum = load_curriculum_drill(drill_id) or {}
    drill_title = str(curriculum.get("title") or session_drill.get("title") or "")

    if isinstance(evaluator, StructuredEvidenceEvaluator):
        events = evaluator.evaluate(
            drill_id=drill_id,
            answers=answers or {},
            drill_config=config,
            source_id=source_id,
        )
    else:
        events = evaluator.evaluate(
            drill_id=drill_id,
            answers=answers or {},
            drill_config=config,
            source_id=source_id,
            drill_title=drill_title,
        )

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
