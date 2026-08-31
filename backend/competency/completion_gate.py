"""Server-side completion gate for evidence generation (curriculum-authoritative)."""

from __future__ import annotations

from typing import Any, Dict, Optional

from competency.ai.constants import MIN_FREE_TEXT_CHARS
from competency.structured.rubrics import evaluate_a1_d2_quality, evaluate_a3_d1_quality


def _as_str(value: Any) -> str:
    return str(value or "").strip()


def _positive_int(value: Any, fallback: int) -> int:
    try:
        parsed = int(value)
    except (TypeError, ValueError):
        return fallback
    return parsed if parsed > 0 else fallback


def is_submission_complete_for_evidence(
    drill_id: str,
    answers: Dict[str, Any],
    config: Dict[str, Any],
) -> bool:
    """Return True only when answers meet curriculum thresholds for evidence.

    Uses curriculum config exclusively (caller must pass curriculum-only config).
    Incomplete / manipulated submissions must not start AI or structured scoring.
    """
    drill_id = _as_str(drill_id)
    answers = answers or {}
    config = config or {}

    if drill_id == "A1_D2":
        return evaluate_a1_d2_quality(answers, config) is not None

    if drill_id == "A3_D1":
        return evaluate_a3_d1_quality(answers, config) is not None

    if drill_id == "A3_D2":
        note = _as_str(answers.get("note"))
        min_chars = MIN_FREE_TEXT_CHARS
        for question in config.get("questions") or []:
            if isinstance(question, dict) and _as_str(question.get("key")) == "note":
                min_chars = max(min_chars, _positive_int(question.get("min_chars"), min_chars))
                break
        return len(note) >= min_chars

    if drill_id in ("B1_D1", "B1_D2", "B1_D3", "B1_D4", "B1_D5"):
        sample_key = _as_str(config.get("sample_key")) or "samples"
        note_key = _as_str(config.get("note_key")) or "note"
        min_samples = _positive_int(
            config.get("required_samples") or config.get("max_samples_per_phase"),
            3,
        )
        note_min = max(MIN_FREE_TEXT_CHARS, _positive_int(config.get("note_min_chars"), 150))
        samples = answers.get(sample_key)
        if not isinstance(samples, list) or len(samples) < min_samples:
            return False
        last = samples[-1]
        if not isinstance(last, dict):
            return False
        return len(_as_str(last.get(note_key))) >= note_min

    if drill_id == "B2_D5":
        if not _as_str(answers.get("decision_pattern")):
            return False
        reason = _as_str(answers.get("pattern_reason"))
        evidence = answers.get("pattern_evidence")
        evidence_values = (
            [_as_str(v) for v in evidence if _as_str(v)] if isinstance(evidence, list) else []
        )
        # Free text must be substantive; multi-select alone is not enough for AI pilot.
        return len(reason) >= MIN_FREE_TEXT_CHARS

    if drill_id == "E1_D1":
        logs_key = _as_str(config.get("logs_key")) or "pattern_observations"
        summary_key = _as_str(config.get("summary_key")) or "pattern_summary"
        assessment_key = _as_str(config.get("assessment_key")) or "pattern_assessment"
        min_observations = _positive_int(config.get("minObservations"), 3)
        observations = answers.get(logs_key)
        if not isinstance(observations, list) or len(observations) < min_observations:
            return False
        if not _as_str(answers.get(assessment_key)):
            return False
        return len(_as_str(answers.get(summary_key))) >= MIN_FREE_TEXT_CHARS

    if drill_id in ("C1_D5", "C2_D5", "C3_D5", "D1_D5", "D2_D5", "D3_D5"):
        return len(_as_str(answers.get("profileSummary"))) >= MIN_FREE_TEXT_CHARS

    if drill_id == "E1_D5":
        summary_key = _as_str(config.get("segment_summary_key")) or "segment_summary"
        tendencies_key = _as_str(config.get("tendencies_key")) or "tendency_entries"
        if len(_as_str(answers.get(summary_key))) < MIN_FREE_TEXT_CHARS:
            return False
        tendencies = answers.get(tendencies_key)
        if not isinstance(tendencies, list):
            return False
        for entry in tendencies:
            if not isinstance(entry, dict):
                return False
            if not _as_str(entry.get("summary")):
                return False
            if not _as_str(entry.get("strongestEvidence")):
                return False
        return True

    if drill_id == "E2_D1":
        if _as_str(answers.get("__before_after_compare_stage")) != "complete":
            return False
        before = answers.get("before")
        after = answers.get("after")
        if not isinstance(before, dict) or not isinstance(after, dict):
            return False
        for bag in (before, after):
            for field in (
                "spacePriority",
                "pressureBehavior",
                "positioning",
                "decisionBehavior",
                "description",
            ):
                if not _as_str(bag.get(field)):
                    return False
        comparability = _as_str(answers.get("comparabilityRating"))
        if not comparability:
            return False
        if comparability == "partly_comparable" and not _as_str(answers.get("comparabilityLimit")):
            return False
        primary = _as_str(answers.get("primaryChange"))
        if not primary:
            return False
        skip = primary in {"no_clear_change", "situations_not_comparable", "unclear"} or comparability in {
            "not_comparable",
            "not_assessable",
        }
        if skip:
            return True
        if not _as_str(answers.get("changeMagnitude")):
            return False
        return len(_as_str(answers.get("changeSummary"))) >= MIN_FREE_TEXT_CHARS

    if drill_id == "E2_D2":
        if _as_str(answers.get("__change_timeline_stage")) != "complete":
            return False
        if not _as_str(answers.get("observationFocus")):
            return False
        if not _as_str(answers.get("baselineDescription")):
            return False
        logs = answers.get("change_timeline_observations")
        min_obs = _positive_int(config.get("minObservations") or config.get("min_observations"), 4)
        if not isinstance(logs, list) or len(logs) < min_obs:
            return False
        for obs in logs:
            if not isinstance(obs, dict):
                return False
            if not _as_str(obs.get("description")):
                return False
            if not _as_str(obs.get("relationToBaseline")):
                return False
        if not _as_str(answers.get("comparability")):
            return False
        if not _as_str(answers.get("assessment")):
            return False
        cp = _as_str(answers.get("candidateChangePointId"))
        none_cps = {"no_clear_change_point", "too_variable", "unclear", ""}
        if cp and cp not in none_cps and not _as_str(answers.get("postChangeStability")):
            return False
        return len(_as_str(answers.get("changeSummary"))) >= MIN_FREE_TEXT_CHARS

    if drill_id == "E2_D3":
        if _as_str(answers.get("__trigger_hypothesis_stage")) != "complete":
            return False
        if not _as_str(answers.get("observedChange")):
            return False
        for key in (
            "priorProblem",
            "triggerType",
            "alternativeExplanation",
            "problemFit",
            "linkStrength",
            "confidence",
        ):
            if not _as_str(answers.get(key)):
                return False
        evidence = answers.get("evidence")
        if not isinstance(evidence, list) or not any(_as_str(v) for v in evidence):
            return False
        if _as_str(answers.get("problemFit")) != "no_functional_link":
            link_min = _positive_int(config.get("functional_link_min_chars"), 20)
            if len(_as_str(answers.get("functionalLink"))) < link_min:
                return False
        return len(_as_str(answers.get("hypothesisSummary"))) >= MIN_FREE_TEXT_CHARS

    if drill_id == "E2_D4":
        if _as_str(answers.get("__interaction_chain_stage")) != "complete":
            return False
        for key in (
            "problemDescription",
            "problemCategory",
            "adjustmentDescription",
            "adjustmentDimension",
            "changeMagnitude",
            "responseType",
            "responseDescription",
            "problemEffect",
            "tradeoff",
            "comparability",
            "interactionAssessment",
        ):
            if not _as_str(answers.get(key)):
                return False
        evidence = answers.get("problemEvidence")
        if not isinstance(evidence, list) or not any(_as_str(v) for v in evidence):
            return False
        return len(_as_str(answers.get("chainSummary"))) >= MIN_FREE_TEXT_CHARS

    if drill_id == "E2_D5":
        min_chars = _positive_int(config.get("summary_min_chars"), MIN_FREE_TEXT_CHARS)
        if len(_as_str(answers.get("segmentSummary"))) < min_chars:
            return False
        if answers.get("noClearAdjustment") is True:
            return bool(_as_str(answers.get("noAdjustmentReason")))
        entries = answers.get("adjustment_entries")
        if not isinstance(entries, list):
            return False
        for entry in entries:
            if not isinstance(entry, dict):
                return False
            if not (
                _as_str(entry.get("beforeBehavior"))
                and _as_str(entry.get("changedBehavior"))
                and _as_str(entry.get("triggerEvidence"))
            ):
                return False
        if len(entries) >= 2 and not _as_str(answers.get("primaryAdjustmentId")):
            return False
        return _as_str(answers.get("__adjustment_profile_stage")) == "complete"

    if drill_id == "E3_D1":
        if _as_str(answers.get("__opportunity_rate_stage")) != "complete":
            return False
        if not isinstance(answers.get("opportunity_rate_definition"), dict):
            return False
        logs = answers.get("opportunity_rate_observations")
        tracker = config.get("tracker") if isinstance(config.get("tracker"), dict) else {}
        min_obs = _positive_int(tracker.get("minObservations"), 6)
        if not isinstance(logs, list):
            return False
        usable = [
            row
            for row in logs
            if isinstance(row, dict) and row.get("validOpportunity") is not False and _as_str(row.get("outcomeId"))
        ]
        if len(usable) < min_obs:
            return False
        if not _as_str(answers.get("countOnlyReflection")):
            return False
        if not _as_str(answers.get("opportunityDefinitionClarity")):
            return False
        return len(_as_str(answers.get("userConclusion"))) >= MIN_FREE_TEXT_CHARS

    if drill_id == "E3_D2":
        if _as_str(answers.get("__cohort_rate_stage")) != "complete":
            return False
        if not isinstance(answers.get("cohort_rate_definition"), dict):
            return False
        if not isinstance(answers.get("cohort_rate_comparison"), dict):
            return False
        logs = answers.get("cohort_rate_observations")
        tracker = config.get("tracker") if isinstance(config.get("tracker"), dict) else {}
        min_total = _positive_int(tracker.get("minObservations"), 8)
        min_per = _positive_int(tracker.get("minPerGroup"), 3)
        if not isinstance(logs, list):
            return False
        usable = [
            row
            for row in logs
            if isinstance(row, dict)
            and row.get("validOpportunity") is not False
            and _as_str(row.get("outcomeId"))
            and _as_str(row.get("cohortId")) in {"A", "B"}
        ]
        a_count = sum(1 for row in usable if row.get("cohortId") == "A")
        b_count = sum(1 for row in usable if row.get("cohortId") == "B")
        if len(usable) < min_total or a_count < min_per or b_count < min_per:
            return False
        if not _as_str(answers.get("comparability")):
            return False
        if not _as_str(answers.get("perceivedDifference")):
            return False
        return len(_as_str(answers.get("userConclusion"))) >= MIN_FREE_TEXT_CHARS

    if drill_id == "E3_D3":
        if _as_str(answers.get("__conditional_outcome_stage")) != "complete":
            return False
        if not isinstance(answers.get("conditional_outcome_definition"), dict):
            return False
        if not _as_str(answers.get("conditionalHypothesis")):
            return False
        logs = answers.get("conditional_outcome_observations")
        tracker = config.get("tracker") if isinstance(config.get("tracker"), dict) else {}
        min_total = _positive_int(tracker.get("minObservations"), 10)
        min_present = _positive_int(tracker.get("minPresent"), 3)
        min_absent = _positive_int(tracker.get("minAbsent"), 3)
        if not isinstance(logs, list):
            return False
        usable = [
            row
            for row in logs
            if isinstance(row, dict)
            and row.get("validOpportunity") is not False
            and _as_str(row.get("conditionState"))
            and _as_str(row.get("outcomeState"))
        ]
        present = sum(1 for row in usable if row.get("conditionState") == "present")
        absent = sum(1 for row in usable if row.get("conditionState") == "absent")
        if len(usable) < min_total or present < min_present or absent < min_absent:
            return False
        for key in ("comparability", "hypothesisAssessment", "counterexampleAssessment"):
            if not _as_str(answers.get(key)):
                return False
        alt_min = _positive_int(config.get("alternative_min_chars"), 12)
        if len(_as_str(answers.get("alternativeExplanation"))) < alt_min:
            return False
        return len(_as_str(answers.get("userConclusion"))) >= MIN_FREE_TEXT_CHARS

    if drill_id == "E3_D4":
        assessments_key = _as_str(config.get("assessments_key") or config.get("assessmentsKey")) or "evidence_assessments"
        stage_key = _as_str(config.get("stage_key") or config.get("stageKey")) or "__evidence_assessment_stage"
        micro_key = (
            _as_str(config.get("microfeedback_key") or config.get("microfeedbackKey"))
            or "evidenceMicrofeedback"
        )
        min_chars = max(MIN_FREE_TEXT_CHARS, _positive_int(config.get("user_statement_min_chars"), 80))
        if _as_str(answers.get(stage_key)) != "complete":
            return False
        if not _as_str(answers.get(micro_key)):
            return False
        bag = answers.get(assessments_key)
        if not isinstance(bag, dict) or not bag:
            return False
        for assessment in bag.values():
            if not isinstance(assessment, dict):
                return False
            if len(_as_str(assessment.get("userStatement"))) < min_chars:
                return False
            if not _as_str(assessment.get("overallStrength")):
                return False
            if not _as_str(assessment.get("strongestSupportedStatement")):
                return False
            if not _as_str(assessment.get("tooStrongStatement")):
                return False
        return True

    if drill_id == "E3_D5":
        profile = answers.get("evidenceProfile")
        bag = profile if isinstance(profile, dict) else {}
        claim = _as_str(answers.get("finalClaim") or bag.get("finalClaim"))
        falsification = _as_str(
            answers.get("falsificationCondition") or bag.get("falsificationCondition")
        )
        next_test = _as_str(answers.get("nextObservationTest") or bag.get("nextObservationTest"))
        if len(claim) < MIN_FREE_TEXT_CHARS:
            return False
        return len(falsification) >= 20 or len(next_test) >= 20

    return False
