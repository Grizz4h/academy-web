"""OpenAI provider for AI competency evidence — server-side only."""

from __future__ import annotations

import json
import logging
import os
import time
from typing import Any, Callable, Optional, Protocol

from competency.ai.constants import AI_PROMPT_VERSION
from competency.ai.prompt import SYSTEM_PROMPT_V2, build_user_prompt
from competency.ai.rubrics import AiEvaluationInput
from competency.ai.schema import AI_EVIDENCE_JSON_SCHEMA, AiEvidenceEvaluation

logger = logging.getLogger(__name__)

DEFAULT_MODEL = "gpt-5-mini"
DEFAULT_TIMEOUT_SECONDS = 30.0


class AiEvidenceProvider(Protocol):
    def evaluate(self, evaluation: AiEvaluationInput) -> Optional[AiEvidenceEvaluation]:
        ...


def _config() -> dict[str, str]:
    return {
        "api_key": (os.environ.get("OPENAI_API_KEY") or "").strip(),
        "model": (os.environ.get("OPENAI_EVIDENCE_MODEL") or os.environ.get("OPENAI_REFLECTION_MODEL") or DEFAULT_MODEL).strip(),
        "prompt_version": (os.environ.get("OPENAI_EVIDENCE_PROMPT_VERSION") or AI_PROMPT_VERSION).strip(),
    }


def _extract_output_text(response: Any) -> str:
    output_text = getattr(response, "output_text", None)
    if isinstance(output_text, str) and output_text.strip():
        return output_text.strip()

    chunks: list[str] = []
    for item in getattr(response, "output", []) or []:
        if getattr(item, "type", None) != "message":
            continue
        for content in getattr(item, "content", []) or []:
            if getattr(content, "type", None) == "output_text":
                text = getattr(content, "text", "")
                if text:
                    chunks.append(text)
    if not chunks:
        return ""
    return "\n".join(chunks).strip()


def call_openai_evidence(
    evaluation: AiEvaluationInput,
    *,
    cfg: Optional[dict[str, str]] = None,
    timeout_seconds: float = DEFAULT_TIMEOUT_SECONDS,
) -> tuple[Optional[AiEvidenceEvaluation], dict[str, str]]:
    """Returns (evaluation, audit_metadata). None evaluation on any failure."""
    cfg = cfg or _config()
    audit = {
        "evaluatorVersion": "ai-evidence-v1",
        "rubricVersion": evaluation.rubric_version,
        "provider": "openai",
        "model": cfg["model"],
        "promptVersion": cfg["prompt_version"],
    }

    if not cfg["api_key"]:
        logger.warning("[competency-ai] OPENAI_API_KEY missing — skipping AI evidence")
        return None, audit

    try:
        from openai import OpenAI
    except ImportError:
        logger.warning("[competency-ai] OpenAI SDK not installed — skipping AI evidence")
        return None, audit

    client = OpenAI(api_key=cfg["api_key"], timeout=timeout_seconds)
    user_prompt = build_user_prompt(evaluation)
    started = time.time()
    try:
        response = client.responses.create(
            model=cfg["model"],
            input=[
                {"role": "system", "content": SYSTEM_PROMPT_V2},
                {"role": "user", "content": user_prompt},
            ],
            text={
                "format": {
                    "type": "json_schema",
                    "name": "rink_ai_evidence",
                    "strict": True,
                    "schema": AI_EVIDENCE_JSON_SCHEMA,
                }
            },
            store=False,
        )
    except Exception as exc:
        logger.warning(
            "[competency-ai] OpenAI call failed after %.2fs drill=%s: %s",
            time.time() - started,
            evaluation.drill_id,
            exc,
        )
        return None, audit

    logger.info(
        "[competency-ai] OpenAI call completed in %.2fs model=%s drill=%s",
        time.time() - started,
        cfg["model"],
        evaluation.drill_id,
    )

    raw_text = _extract_output_text(response)
    if not raw_text:
        logger.warning("[competency-ai] empty OpenAI response drill=%s", evaluation.drill_id)
        return None, audit

    try:
        parsed = json.loads(raw_text)
        result = AiEvidenceEvaluation.model_validate(parsed)
    except Exception as exc:
        logger.warning("[competency-ai] invalid AI JSON drill=%s: %s", evaluation.drill_id, exc)
        return None, audit

    return result, audit


class OpenAiEvidenceProvider:
    def __init__(
        self,
        *,
        cfg: Optional[dict[str, str]] = None,
        timeout_seconds: float = DEFAULT_TIMEOUT_SECONDS,
        caller: Optional[Callable[..., tuple[Optional[AiEvidenceEvaluation], dict[str, str]]]] = None,
    ):
        self._cfg = cfg
        self._timeout_seconds = timeout_seconds
        self._caller = caller or call_openai_evidence

    def evaluate(self, evaluation: AiEvaluationInput) -> Optional[AiEvidenceEvaluation]:
        result, _audit = self._caller(
            evaluation,
            cfg=self._cfg,
            timeout_seconds=self._timeout_seconds,
        )
        return result

    def evaluate_with_audit(
        self, evaluation: AiEvaluationInput
    ) -> tuple[Optional[AiEvidenceEvaluation], dict[str, str]]:
        return self._caller(
            evaluation,
            cfg=self._cfg,
            timeout_seconds=self._timeout_seconds,
        )
