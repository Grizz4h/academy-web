import json
import logging
import os
import time
from datetime import datetime
from typing import Any, Dict, Optional, Tuple
from uuid import uuid4

from fastapi import HTTPException

from .payload import build_reflection_payload
from .prompt import SYSTEM_PROMPT_V1, build_user_prompt
from .schema import (
    REFLECTION_JSON_SCHEMA,
    AiSessionReflection,
    ReflectionUsage,
    StoredAiReflection,
)

logger = logging.getLogger(__name__)

DEFAULT_MODEL = "gpt-5-mini"
DEFAULT_PROMPT_VERSION = "v1"


def _config() -> Dict[str, str]:
    return {
        "api_key": (os.environ.get("OPENAI_API_KEY") or "").strip(),
        "model": (os.environ.get("OPENAI_REFLECTION_MODEL") or DEFAULT_MODEL).strip(),
        "prompt_version": (
            os.environ.get("OPENAI_REFLECTION_PROMPT_VERSION") or DEFAULT_PROMPT_VERSION
        ).strip(),
    }


def _module_learning_goals(curriculum: Optional[Dict[str, Any]], module_id: Optional[str]) -> Optional[list]:
    if not curriculum or not module_id:
        return None
    for track in curriculum.get("tracks") or []:
        for module in track.get("modules") or []:
            if module.get("id") == module_id:
                goals = module.get("learningGoals") or []
                return goals if goals else None
    return None


def _extract_output_text(response: Any) -> str:
    output_text = getattr(response, "output_text", None)
    if isinstance(output_text, str) and output_text.strip():
        return output_text.strip()

    chunks = []
    for item in getattr(response, "output", []) or []:
        if getattr(item, "type", None) != "message":
            continue
        for content in getattr(item, "content", []) or []:
            content_type = getattr(content, "type", None)
            if content_type == "output_text":
                text = getattr(content, "text", "")
                if text:
                    chunks.append(text)
            elif content_type == "refusal":
                refusal = getattr(content, "refusal", "")
                raise HTTPException(
                    status_code=502,
                    detail=f"OpenAI refusal: {refusal or 'unknown'}",
                )
    if not chunks:
        raise HTTPException(status_code=502, detail="OpenAI returned empty reflection content")
    return "\n".join(chunks).strip()


def _extract_usage(response: Any) -> Optional[ReflectionUsage]:
    usage = getattr(response, "usage", None)
    if not usage:
        return None
    return ReflectionUsage(
        inputTokens=getattr(usage, "input_tokens", None),
        outputTokens=getattr(usage, "output_tokens", None),
        totalTokens=getattr(usage, "total_tokens", None),
    )


def _call_openai(payload: Dict[str, Any], cfg: Dict[str, str]) -> Tuple[AiSessionReflection, Optional[ReflectionUsage]]:
    try:
        from openai import OpenAI
    except ImportError as exc:
        raise HTTPException(
            status_code=500,
            detail="OpenAI SDK not installed on server",
        ) from exc

    if not cfg["api_key"]:
        raise HTTPException(
            status_code=503,
            detail="OPENAI_API_KEY is not configured on the server",
        )

    client = OpenAI(api_key=cfg["api_key"])
    user_prompt = build_user_prompt(payload)

    started = time.time()
    try:
        response = client.responses.create(
            model=cfg["model"],
            input=[
                {"role": "system", "content": SYSTEM_PROMPT_V1},
                {"role": "user", "content": user_prompt},
            ],
            text={
                "format": {
                    "type": "json_schema",
                    "name": "rink_reflection",
                    "strict": True,
                    "schema": REFLECTION_JSON_SCHEMA,
                }
            },
            store=False,
        )
    except HTTPException:
        raise
    except Exception as exc:
        logger.warning("[reflection] OpenAI call failed after %.2fs: %s", time.time() - started, exc)
        raise HTTPException(status_code=502, detail="KI-Reflexion konnte nicht erstellt werden") from exc

    duration = time.time() - started
    logger.info(
        "[reflection] OpenAI call completed in %.2fs model=%s",
        duration,
        cfg["model"],
    )

    raw_text = _extract_output_text(response)
    try:
        parsed = json.loads(raw_text)
    except json.JSONDecodeError as exc:
        raise HTTPException(status_code=502, detail="Invalid reflection JSON from OpenAI") from exc

    try:
        content = AiSessionReflection.model_validate(parsed)
    except Exception as exc:
        raise HTTPException(status_code=502, detail="Reflection schema validation failed") from exc

    return content, _extract_usage(response)


def generate_session_reflection(
    session: Dict[str, Any],
    curriculum: Optional[Dict[str, Any]] = None,
    lab_content: Optional[Dict[str, Any]] = None,
) -> StoredAiReflection:
    cfg = _config()
    module_id = session.get("module_id")
    goals = _module_learning_goals(curriculum, module_id)
    payload = build_reflection_payload(session, goals, lab_content)
    content, usage = _call_openai(payload, cfg)

    return StoredAiReflection(
        id=f"refl_{uuid4().hex[:12]}",
        sessionId=str(session.get("id") or ""),
        createdAt=datetime.now().isoformat(),
        provider="openai",
        model=cfg["model"],
        promptVersion=cfg["prompt_version"],
        content=content,
        usage=usage,
    )
