"""Durable Scene ↔ check-in sample link helpers.

Canonical relationship (no new entity):

  Scene.source.observation_id  ==  sample.id
  sample.sceneId               ==  Scene.id

sample.id is generated client-side as ``sample_<uuid>`` / ``event_<uuid>`` /
``obs_<uuid>`` and is treated as unique within a Session. Resolution always
uses (session_id, observation_id).
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Dict, Iterator, List, Optional, Tuple


ACTIVE_OBSERVATION_DRAFT_KEY = "__active_observation_draft"


class ObservationLinkConflict(Exception):
    """Idempotent link refused because identities disagree."""

    def __init__(self, code: str, detail: str):
        super().__init__(detail)
        self.code = code
        self.detail = detail


@dataclass
class FoundSample:
    location: str  # "drafts" | "checkins"
    phase: str
    collection_key: str
    index: int
    sample: Dict[str, Any]
    answers_bag: Dict[str, Any]


@dataclass
class FoundDraft:
    location: str
    phase: str
    draft: Dict[str, Any]
    answers_bag: Dict[str, Any]


@dataclass
class LinkResult:
    status: str
    observation_id: str
    scene_id: str
    sample_found: bool
    draft_found: bool
    repaired_sample: bool
    repaired_scene: bool
    repaired_draft: bool


def _norm(value: Any) -> str:
    return str(value or "").strip()


def iter_answer_bags(session: Dict[str, Any]) -> Iterator[Tuple[str, str, Dict[str, Any]]]:
    """Yield (location, phase, answers_dict) from drafts and checkins."""
    drafts = session.get("drafts")
    if isinstance(drafts, dict):
        for phase, answers in drafts.items():
            if isinstance(answers, dict):
                yield "drafts", str(phase), answers

    for checkin in session.get("checkins") or []:
        if not isinstance(checkin, dict):
            continue
        answers = checkin.get("answers")
        if isinstance(answers, dict):
            yield "checkins", _norm(checkin.get("phase")), answers


def iter_sample_collections(answers: Dict[str, Any]) -> Iterator[Tuple[str, List[Any]]]:
    """Yield (collection_key, list) for list-of-object bags that may hold samples."""
    for key, value in answers.items():
        if key == ACTIVE_OBSERVATION_DRAFT_KEY:
            continue
        if not isinstance(value, list) or not value:
            continue
        if any(isinstance(item, dict) for item in value):
            yield str(key), value


def find_observation_sample(
    session: Dict[str, Any],
    observation_id: str,
) -> Optional[FoundSample]:
    """Locate a persisted sample (or event) by id inside drafts/checkins."""
    target = _norm(observation_id)
    if not target:
        return None

    for location, phase, answers in iter_answer_bags(session):
        for collection_key, items in iter_sample_collections(answers):
            for index, item in enumerate(items):
                if not isinstance(item, dict):
                    continue
                if _norm(item.get("id")) == target:
                    return FoundSample(
                        location=location,
                        phase=phase,
                        collection_key=collection_key,
                        index=index,
                        sample=item,
                        answers_bag=answers,
                    )
    return None


def find_active_observation_draft(
    session: Dict[str, Any],
    observation_id: str,
) -> Optional[FoundDraft]:
    target = _norm(observation_id)
    if not target:
        return None

    for location, phase, answers in iter_answer_bags(session):
        raw = answers.get(ACTIVE_OBSERVATION_DRAFT_KEY)
        if not isinstance(raw, dict):
            continue
        if _norm(raw.get("id")) == target:
            return FoundDraft(
                location=location,
                phase=phase,
                draft=raw,
                answers_bag=answers,
            )
    return None


def find_scenes_for_observation(
    scenes: List[Dict[str, Any]],
    *,
    session_id: str,
    observation_id: str,
    exclude_scene_id: Optional[str] = None,
) -> List[Dict[str, Any]]:
    sid = _norm(session_id)
    oid = _norm(observation_id)
    exclude = _norm(exclude_scene_id)
    matches: List[Dict[str, Any]] = []
    for scene in scenes:
        if not isinstance(scene, dict):
            continue
        if exclude and _norm(scene.get("id")) == exclude:
            continue
        scene_session = _norm(scene.get("session_id")) or _norm(
            (scene.get("source") or {}).get("session_id") if isinstance(scene.get("source"), dict) else ""
        )
        if sid and scene_session and scene_session != sid:
            continue
        source = scene.get("source") if isinstance(scene.get("source"), dict) else {}
        if _norm(source.get("observation_id")) == oid:
            matches.append(scene)
    return matches


def _sample_drill_hint(found: FoundSample, session: Dict[str, Any]) -> Optional[str]:
    draft = found.answers_bag.get(ACTIVE_OBSERVATION_DRAFT_KEY)
    if isinstance(draft, dict) and _norm(draft.get("id")) == _norm(found.sample.get("id")):
        drill = _norm(draft.get("drillId") or draft.get("drill_id"))
        if drill:
            return drill
    # Session-level selected drill (single-drill sessions)
    return _norm(session.get("drill_id")) or None


def preflight_observation_scene_link(
    *,
    scene: Dict[str, Any],
    session: Dict[str, Any],
    observation_id: str,
    other_scenes: Optional[List[Dict[str, Any]]] = None,
) -> None:
    """Raise ObservationLinkConflict if linking would violate integrity.

    Does not mutate scene/session.
    """
    scene_id = _norm(scene.get("id"))
    oid = _norm(observation_id)
    if not scene_id or not oid:
        raise ObservationLinkConflict("missing_ids", "Scene.id and observation_id are required")

    session_id = _norm(session.get("id"))
    scene_session = _norm(scene.get("session_id")) or _norm(
        (scene.get("source") or {}).get("session_id") if isinstance(scene.get("source"), dict) else ""
    )
    if scene_session and session_id and scene_session != session_id:
        raise ObservationLinkConflict(
            "session_mismatch",
            f"Scene.session_id ({scene_session}) does not match session ({session_id})",
        )

    source = scene.get("source") if isinstance(scene.get("source"), dict) else {}
    existing_oid = _norm(source.get("observation_id"))
    if existing_oid and existing_oid != oid:
        raise ObservationLinkConflict(
            "scene_observation_conflict",
            f"Scene already linked to observation_id={existing_oid}",
        )

    if other_scenes:
        conflicts = find_scenes_for_observation(
            other_scenes,
            session_id=session_id or scene_session,
            observation_id=oid,
            exclude_scene_id=scene_id,
        )
        if conflicts:
            raise ObservationLinkConflict(
                "observation_already_linked",
                f"observation_id already linked to scene {conflicts[0].get('id')}",
            )

    scene_drill = _norm(scene.get("drill_id") or source.get("drill_id"))
    found_sample = find_observation_sample(session, oid)
    if found_sample:
        sample_drill = _sample_drill_hint(found_sample, session)
        if scene_drill and sample_drill and scene_drill != sample_drill:
            raise ObservationLinkConflict(
                "drill_mismatch",
                f"Scene.drill_id ({scene_drill}) does not match sample drill ({sample_drill})",
            )
        existing_scene = _norm(found_sample.sample.get("sceneId") or found_sample.sample.get("scene_id"))
        if existing_scene and existing_scene != scene_id:
            raise ObservationLinkConflict(
                "sample_scene_conflict",
                f"Sample already linked to sceneId={existing_scene}",
            )

    found_draft = find_active_observation_draft(session, oid)
    if found_draft:
        draft_drill = _norm(found_draft.draft.get("drillId") or found_draft.draft.get("drill_id"))
        if scene_drill and draft_drill and scene_drill != draft_drill:
            raise ObservationLinkConflict(
                "drill_mismatch",
                f"Scene.drill_id ({scene_drill}) does not match draft drill ({draft_drill})",
            )
        draft_session = _norm(found_draft.draft.get("sessionId") or found_draft.draft.get("session_id"))
        if draft_session and session_id and draft_session != session_id:
            raise ObservationLinkConflict(
                "session_mismatch",
                f"Draft sessionId ({draft_session}) does not match session ({session_id})",
            )
        existing_scene = _norm(found_draft.draft.get("sceneId"))
        if existing_scene and existing_scene != scene_id:
            raise ObservationLinkConflict(
                "sample_scene_conflict",
                f"Active draft already linked to sceneId={existing_scene}",
            )


def apply_observation_scene_link(
    *,
    scene: Dict[str, Any],
    session: Dict[str, Any],
    observation_id: str,
    other_scenes: Optional[List[Dict[str, Any]]] = None,
    allow_pending_sample: bool = True,
) -> LinkResult:
    """Mutate scene + session to establish / repair the bidirectional link.

    Raises ObservationLinkConflict on hard mismatches.
    """
    scene_id = _norm(scene.get("id"))
    if not scene_id:
        raise ObservationLinkConflict("missing_scene_id", "Scene.id is required")

    oid = _norm(observation_id)
    if not oid:
        raise ObservationLinkConflict("missing_observation_id", "observation_id is required")

    scene_session = _norm(scene.get("session_id")) or _norm(
        (scene.get("source") or {}).get("session_id") if isinstance(scene.get("source"), dict) else ""
    )
    session_id = _norm(session.get("id"))
    if not session_id:
        raise ObservationLinkConflict("missing_session_id", "Session.id is required")
    if scene_session and scene_session != session_id:
        raise ObservationLinkConflict(
            "session_mismatch",
            f"Scene.session_id ({scene_session}) does not match session ({session_id})",
        )

    # Ensure source object
    source = scene.get("source") if isinstance(scene.get("source"), dict) else {}
    source = dict(source)
    source.setdefault("type", "drill")
    source["session_id"] = session_id
    if scene.get("drill_id") and not source.get("drill_id"):
        source["drill_id"] = scene.get("drill_id")

    existing_oid = _norm(source.get("observation_id"))
    repaired_scene = False
    if existing_oid and existing_oid != oid:
        raise ObservationLinkConflict(
            "scene_observation_conflict",
            f"Scene already linked to observation_id={existing_oid}",
        )
    if not existing_oid:
        source["observation_id"] = oid
        repaired_scene = True
    scene["source"] = source
    scene["session_id"] = session_id

    # Another scene must not already own this observation in the same session.
    if other_scenes:
        conflicts = find_scenes_for_observation(
            other_scenes,
            session_id=session_id,
            observation_id=oid,
            exclude_scene_id=scene_id,
        )
        if conflicts:
            raise ObservationLinkConflict(
                "observation_already_linked",
                f"observation_id already linked to scene {conflicts[0].get('id')}",
            )

    found_sample = find_observation_sample(session, oid)
    found_draft = find_active_observation_draft(session, oid)
    repaired_sample = False
    repaired_draft = False

    scene_drill = _norm(scene.get("drill_id") or source.get("drill_id"))

    if found_sample:
        sample_drill = _sample_drill_hint(found_sample, session)
        if scene_drill and sample_drill and scene_drill != sample_drill:
            raise ObservationLinkConflict(
                "drill_mismatch",
                f"Scene.drill_id ({scene_drill}) does not match sample drill ({sample_drill})",
            )
        existing_scene = _norm(found_sample.sample.get("sceneId") or found_sample.sample.get("scene_id"))
        if existing_scene and existing_scene != scene_id:
            raise ObservationLinkConflict(
                "sample_scene_conflict",
                f"Sample already linked to sceneId={existing_scene}",
            )
        if not existing_scene:
            found_sample.sample["sceneId"] = scene_id
            repaired_sample = True
        scene_code = _norm(scene.get("scene_code"))
        if scene_code and _norm(found_sample.sample.get("sceneCode")) != scene_code:
            found_sample.sample["sceneCode"] = scene_code
            repaired_sample = True
        # Write back into list (sample is the same dict reference when loaded from JSON)

    if found_draft:
        draft_drill = _norm(found_draft.draft.get("drillId") or found_draft.draft.get("drill_id"))
        if scene_drill and draft_drill and scene_drill != draft_drill:
            raise ObservationLinkConflict(
                "drill_mismatch",
                f"Scene.drill_id ({scene_drill}) does not match draft drill ({draft_drill})",
            )
        draft_session = _norm(found_draft.draft.get("sessionId") or found_draft.draft.get("session_id"))
        if draft_session and draft_session != session_id:
            raise ObservationLinkConflict(
                "session_mismatch",
                f"Draft sessionId ({draft_session}) does not match session ({session_id})",
            )
        existing_scene = _norm(found_draft.draft.get("sceneId"))
        if existing_scene and existing_scene != scene_id:
            raise ObservationLinkConflict(
                "sample_scene_conflict",
                f"Active draft already linked to sceneId={existing_scene}",
            )
        if not existing_scene:
            found_draft.draft["sceneId"] = scene_id
            repaired_draft = True
        scene_code = _norm(scene.get("scene_code"))
        if scene_code:
            found_draft.draft["sceneCode"] = scene_code

    if not found_sample and not found_draft and not allow_pending_sample:
        raise ObservationLinkConflict(
            "observation_not_found",
            f"No sample/draft with id={oid} in session {session_id}",
        )

    if not found_sample and not found_draft:
        status = "pending_sample"
    elif not (repaired_sample or repaired_draft or repaired_scene):
        status = "already_linked"
    elif repaired_scene and not (repaired_sample or repaired_draft):
        status = "repaired_scene"
    elif (repaired_sample or repaired_draft) and not repaired_scene:
        status = "repaired_sample"
    else:
        status = "linked"

    return LinkResult(
        status=status,
        observation_id=oid,
        scene_id=scene_id,
        sample_found=bool(found_sample),
        draft_found=bool(found_draft),
        repaired_sample=repaired_sample,
        repaired_scene=repaired_scene,
        repaired_draft=repaired_draft,
    )


def clear_sample_scene_backlinks(
    session: Dict[str, Any],
    *,
    scene_id: str,
    observation_id: Optional[str] = None,
) -> int:
    """Clear sample/draft sceneId pointing at this scene. Returns number of clears."""
    cleared = 0
    sid = _norm(scene_id)
    oid = _norm(observation_id)

    for _location, _phase, answers in iter_answer_bags(session):
        draft = answers.get(ACTIVE_OBSERVATION_DRAFT_KEY)
        if isinstance(draft, dict):
            if _norm(draft.get("sceneId")) == sid and (not oid or _norm(draft.get("id")) == oid):
                draft["sceneId"] = None
                draft["sceneCode"] = None
                cleared += 1
        for _key, items in iter_sample_collections(answers):
            for item in items:
                if not isinstance(item, dict):
                    continue
                if _norm(item.get("sceneId") or item.get("scene_id")) != sid:
                    continue
                if oid and _norm(item.get("id")) != oid:
                    continue
                item.pop("sceneId", None)
                item.pop("scene_id", None)
                item.pop("sceneCode", None)
                cleared += 1
    return cleared
