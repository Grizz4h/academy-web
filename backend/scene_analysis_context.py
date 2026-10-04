"""Scene Analysis Context read model (Tank-S3).

Pure read join. Does not mutate Scene/Session or repair links.
"""

from __future__ import annotations

from copy import deepcopy
from typing import Any, Dict, List, Optional, Tuple

from curriculum_content_hash import CONTENT_HASH_ALGORITHM, curriculum_hash_metadata
from scene_observation_link import find_active_observation_draft, find_observation_sample


def _norm(value: Any) -> str:
    return str(value or "").strip()


def find_drill_in_curriculum(curriculum: Dict[str, Any], drill_id: str) -> Optional[Dict[str, Any]]:
    target = _norm(drill_id)
    if not target:
        return None
    for track in curriculum.get("tracks") or []:
        if not isinstance(track, dict):
            continue
        for module in track.get("modules") or []:
            if not isinstance(module, dict):
                continue
            for drill in module.get("drills") or []:
                if isinstance(drill, dict) and _norm(drill.get("id")) == target:
                    return drill
    return None


def find_drill_in_session_snapshot(session: Optional[Dict[str, Any]], drill_id: str) -> Optional[Dict[str, Any]]:
    if not isinstance(session, dict):
        return None
    target = _norm(drill_id)
    if not target:
        return None
    for drill in session.get("drills") or []:
        if isinstance(drill, dict) and _norm(drill.get("id")) == target:
            return drill
    return None


def extract_drill_analysis_fields(drill: Optional[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    """Curate analysis-relevant Drill fields. Preserve wording; do not invent meanings."""
    if not isinstance(drill, dict):
        return None
    didactics = drill.get("didactics") if isinstance(drill.get("didactics"), dict) else {}
    guide = didactics.get("observation_guide") if isinstance(didactics.get("observation_guide"), dict) else {}
    config = drill.get("config") if isinstance(drill.get("config"), dict) else {}

    config_out: Dict[str, Any] = {}
    for key in (
        "questions",
        "observation_sections",
        "state_options",
        "state_label",
        "factor_label",
        "factors_by_state",
        "sample_key",
        "sample_label",
        "note_key",
        "note_label",
        "observation_fields",
        "mode",
    ):
        if key in config:
            config_out[key] = deepcopy(config[key])

    out: Dict[str, Any] = {
        "id": drill.get("id"),
        "title": drill.get("title"),
        "description": drill.get("description"),
        "drill_type": drill.get("drill_type"),
        "didactics": {
            "explanation": didactics.get("explanation"),
            "observation_guide": {
                "what_to_watch": deepcopy(guide.get("what_to_watch")),
                "how_to_decide": deepcopy(guide.get("how_to_decide")),
                "ignore": deepcopy(guide.get("ignore")),
            },
            "learning_hint": didactics.get("learning_hint"),
        },
        "config": config_out,
    }
    if isinstance(didactics.get("inline_explanations"), dict):
        out["didactics"]["inline_explanations"] = deepcopy(didactics["inline_explanations"])
    if "miniFeedback" in drill:
        out["miniFeedback"] = deepcopy(drill.get("miniFeedback"))
    if "sceneSlug" in drill:
        out["sceneSlug"] = drill.get("sceneSlug")
    return out


def extract_scene_analysis_fields(scene: Dict[str, Any]) -> Dict[str, Any]:
    """Scene-owned analysis fields (already enriched for read)."""
    always = (
        "id",
        "scene_code",
        "drill_id",
        "session_id",
        "source",
        "note",
    )
    optional = (
        "drill_title",
        "module_id",
        "track_id",
        "rating",
        "status",
        "metadata_status",
        "league",
        "season",
        "competition_phase",
        "competition_phase_label",
        "competition_unit_type",
        "competition_unit_label",
        "competition_unit_value",
        "matchday",
        "game_date",
        "team_home",
        "team_away",
        "observed_team",
        "observed_team_id",
        "observed_team_name",
        "period",
        "game_time",
        "asset_name",
        "asset_name_missing",
        "created_at",
        "updated_at",
    )
    out: Dict[str, Any] = {key: deepcopy(scene.get(key)) for key in always}
    for key in optional:
        if key in scene:
            out[key] = deepcopy(scene.get(key))
    return out


def extract_observation_analysis_fields(
    *,
    found_sample,
    found_draft,
) -> Optional[Dict[str, Any]]:
    if not found_sample and not found_draft:
        return None

    sample = deepcopy(found_sample.sample) if found_sample else None
    draft = deepcopy(found_draft.draft) if found_draft else None

    observation_id = None
    if sample:
        observation_id = _norm(sample.get("id"))
    elif draft:
        observation_id = _norm(draft.get("id"))

    # Separate identity fields from answer payload (verbatim remainder).
    answers: Dict[str, Any] = {}
    if isinstance(sample, dict):
        for key, value in sample.items():
            if key in {"id", "sceneId", "scene_id", "sceneCode"}:
                continue
            answers[key] = deepcopy(value)

    out: Dict[str, Any] = {
        "id": observation_id,
        "sceneId": (sample or {}).get("sceneId") if sample else (draft or {}).get("sceneId"),
        "sceneCode": (sample or {}).get("sceneCode") if sample else (draft or {}).get("sceneCode"),
        "answers": answers,
        "location": found_sample.location if found_sample else ("draft_only" if found_draft else None),
        "phase": found_sample.phase if found_sample else (draft or {}).get("phase"),
        "collectionKey": found_sample.collection_key if found_sample else (draft or {}).get("collectionKey"),
        "label": (draft or {}).get("label") if draft else None,
        "samplePresent": bool(found_sample),
        "draftPresent": bool(found_draft),
    }
    return out


def evaluate_link_status(
    *,
    scene: Dict[str, Any],
    session: Optional[Dict[str, Any]],
    session_error: Optional[str],
    found_sample,
    found_draft,
) -> Tuple[Dict[str, Any], List[str]]:
    source = scene.get("source") if isinstance(scene.get("source"), dict) else {}
    observation_id = _norm(source.get("observation_id"))
    session_id = _norm(scene.get("session_id") or source.get("session_id"))
    scene_id = _norm(scene.get("id"))
    scene_drill = _norm(scene.get("drill_id") or source.get("drill_id"))

    reasons: List[str] = []

    if not observation_id:
        return {
            "code": "unlinked",
            "observationId": None,
            "sessionId": session_id or None,
            "reasons": [],
        }, reasons

    if session_error == "not_found":
        reasons.append("session_not_found")
    elif session_error:
        reasons.append("session_unavailable")

    if session is not None:
        if session_id and _norm(session.get("id")) and session_id != _norm(session.get("id")):
            reasons.append("session_mismatch")

    if session is not None and not found_sample and not found_draft:
        reasons.append("observation_not_found")
    elif session is None and observation_id and not session_error:
        reasons.append("observation_not_found")

    if found_sample:
        sample_scene = _norm(found_sample.sample.get("sceneId") or found_sample.sample.get("scene_id"))
        # Absent sample.sceneId is legacy-compatible (honest null), not inconsistent.
        if sample_scene and scene_id and sample_scene != scene_id:
            reasons.append("sample_scene_mismatch")

    if found_draft:
        draft_scene = _norm(found_draft.draft.get("sceneId"))
        if draft_scene and scene_id and draft_scene != scene_id:
            reasons.append("sample_scene_mismatch")
        draft_drill = _norm(found_draft.draft.get("drillId") or found_draft.draft.get("drill_id"))
        if scene_drill and draft_drill and scene_drill != draft_drill:
            reasons.append("drill_mismatch")

    inconsistency = {
        "sample_scene_mismatch",
        "session_mismatch",
        "drill_mismatch",
    }
    if any(reason in inconsistency for reason in reasons):
        code = "inconsistent"
    elif "observation_not_found" in reasons or "session_not_found" in reasons or "session_unavailable" in reasons:
        code = "pending_or_broken"
    else:
        code = "linked"

    return {
        "code": code,
        "observationId": observation_id,
        "sessionId": session_id or None,
        "reasons": reasons,
    }, reasons


def build_scene_analysis_context(
    *,
    scene: Dict[str, Any],
    curriculum: Optional[Dict[str, Any]] = None,
    curriculum_error: Optional[str] = None,
    session: Optional[Dict[str, Any]] = None,
    session_error: Optional[str] = None,
    resolved_via: str = "id",
) -> Dict[str, Any]:
    """Build the analysis-context read model. Side-effect free."""
    source = scene.get("source") if isinstance(scene.get("source"), dict) else {}
    observation_id = _norm(source.get("observation_id"))
    drill_id = _norm(scene.get("drill_id") or source.get("drill_id"))

    found_sample = None
    found_draft = None
    if observation_id and isinstance(session, dict):
        found_sample = find_observation_sample(session, observation_id)
        found_draft = find_active_observation_draft(session, observation_id)

    link_status, _reasons = evaluate_link_status(
        scene=scene,
        session=session,
        session_error=session_error,
        found_sample=found_sample,
        found_draft=found_draft,
    )

    session_snapshot = extract_drill_analysis_fields(
        find_drill_in_session_snapshot(session, drill_id) if drill_id else None
    )
    current_curriculum = None
    if drill_id and isinstance(curriculum, dict):
        current_curriculum = extract_drill_analysis_fields(
            find_drill_in_curriculum(curriculum, drill_id)
        )

    drill_block = None
    if drill_id or session_snapshot or current_curriculum:
        drill_block = {
            "id": drill_id or None,
            "sessionSnapshot": session_snapshot,
            "currentCurriculum": current_curriculum,
        }

    curriculum_meta: Dict[str, Any]
    if isinstance(curriculum, dict):
        try:
            curriculum_meta = curriculum_hash_metadata(curriculum)
        except Exception as exc:  # noqa: BLE001 — surface safely in read model
            curriculum_meta = {
                "contentHash": None,
                "contentHashAlgorithm": CONTENT_HASH_ALGORITHM,
                "contentHashScope": "merged_curriculum",
                "error": "hash_failed",
                "errorDetail": str(exc)[:200],
            }
    else:
        curriculum_meta = {
            "contentHash": None,
            "contentHashAlgorithm": CONTENT_HASH_ALGORITHM,
            "contentHashScope": "merged_curriculum",
            "error": curriculum_error or "curriculum_unavailable",
        }

    return {
        "scene": extract_scene_analysis_fields(scene),
        "observation": extract_observation_analysis_fields(
            found_sample=found_sample,
            found_draft=found_draft,
        ),
        "drill": drill_block,
        "curriculum": curriculum_meta,
        "linkStatus": link_status,
        "provenance": {
            "lookupIdentity": "scene.id",
            "sceneId": _norm(scene.get("id")) or None,
            "resolvedVia": resolved_via,
            "sessionFound": isinstance(session, dict),
            "sessionError": session_error,
            "curriculumError": curriculum_error or curriculum_meta.get("error"),
            "observationResolved": bool(found_sample or found_draft),
            "samplePresent": bool(found_sample),
            "draftPresent": bool(found_draft),
            "drillId": drill_id or None,
            "hasSessionDrillSnapshot": bool(session_snapshot),
            "hasCurrentCurriculumDrill": bool(current_curriculum),
        },
    }
