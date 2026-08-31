#!/usr/bin/env python3
"""Regenerate data/academy/competency/assessment_specs.json from routing + evidence map.

Hand-authored focus / blockers live in this script — re-run after routing changes.
Does not call LLM providers or modify maps.
"""

from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]

# Import generation body by exec of previous one-shot logic — keep in sync with committed JSON.
# Prefer editing FOCUS/MUST_NOT/MISSING here then re-running.

FOCUS = {
    "A3_D2": [
        "first reaction after possession switch",
        "before→after behaviour change in first seconds",
        "situational functions without quality judgment",
    ],
    "B1_D1": [
        "playable support under the puck",
        "who supports whom with lane/distance/orientation/timing",
        "proximity ≠ playability",
    ],
    "B1_D2": [
        "maintaining connections between players",
        "observable support links across a sample",
        "functional relations not labels alone",
    ],
    "B1_D3": [
        "center tasks as visible functions",
        "support/outlet/cover cues",
        "no invented intent",
    ],
    "B1_D4": [
        "center as outlet and continuation option",
        "passability and timing cues",
        "options vs chosen action if stated",
    ],
    "B1_D5": [
        "timing and visible preparation of support",
        "pressure/time constraints if visible",
        "sample-scoped claims only",
    ],
    "B2_D5": [
        "pressure cue + options + repeated decision",
        "conditions of occurrence",
        "decision ≠ outcome",
    ],
    "C1_D5": [
        "defensive stability patterns in segment",
        "spacing/protected space/connection recurrence",
        "no formation name as proof",
    ],
    "C2_D5": [
        "neutral-zone control / lane / reaction patterns",
        "segment-scoped synthesis",
        "no system identity",
    ],
    "C3_D5": [
        "offensive structure recurrence",
        "space creation and connections",
        "structure ≠ scoring outcome",
    ],
    "D1_D5": [
        "powerplay space/function/attack signals recurrence",
        "segment-scoped PP patterns",
        "no setup identity",
    ],
    "D2_D5": [
        "penalty-kill priorities and organization patterns",
        "segment-scoped PK patterns",
        "no formation identity",
    ],
    "D3_D5": [
        "blue-line entry/exit tendencies",
        "support/control conditions",
        "decision ≠ goal",
    ],
    "E1_D1": [
        "repetition across comparable observations",
        "observation vs interpretation",
        "claim strength ≤ sample",
    ],
    "E1_D5": [
        "tendency profile from segment",
        "strongest tendency with limits",
        "falsification / next watch if present",
    ],
    "E2_D1": [
        "before vs after change description",
        "comparability of situations",
        "no premature cause",
    ],
    "E2_D2": [
        "change timeline / change point caution",
        "enough before/after cases",
        "no causal overclaim",
    ],
    "E2_D3": [
        "testable adjustment hypothesis",
        "functional link + alternative explanation",
        "no coach-intent as fact",
    ],
    "E2_D4": [
        "same interaction before/after response",
        "trade-off / problem shift if visible",
        "outcome bias avoided",
    ],
    "E2_D5": [
        "adjustment profile synthesis",
        "separate observed change from guessed cause",
        "uncertainty / alternatives",
    ],
    "E3_D1": [
        "opportunity rate with denominator awareness",
        "sample limits",
        "no false precision",
    ],
    "E3_D2": [
        "cohort rate comparison",
        "comparable bases",
        "no significance theater",
    ],
    "E3_D3": [
        "conditional outcome compare",
        "alternative explanations",
        "base rates respected",
    ],
    "E3_D4": [
        "evidence strength of a statement vs sample",
        "rate sensitivity to classification",
        "required userStatement matched to assessed strength",
    ],
    "E3_D5": [
        "claim ladder strength ≤ evidence base",
        "falsification / next test",
        "cause unreachable in E3",
    ],
}

MUST_NOT_DEFAULT = [
    "coach intention as fact",
    "hidden system call",
    "unseen video ground truth",
    "player inner motivation",
]

MUST_NOT = {
    "E3_D5": [
        "causal claim beyond sample",
        "treating confidence of tone as evidence",
        "inventing missing cases",
    ],
    "E1_D1": [
        "team identity from thin sample",
        "unsupported causality",
        "single event as tendency",
    ],
    "B2_D5": [
        "outcome as decision quality",
        "generic under-pressure cliché without cue",
    ],
    "E2_D3": [
        "coach changed the system as fact",
        "scoreboard as sole proof of adjustment",
    ],
}

MISSING = {
}


def main() -> None:
    # Delegate to regenerating via the already-written JSON merge path:
    # Keep this script as the editable source; rebuild full document by importing
    # structure from the existing file's non-drill sections.
    routing = json.loads((ROOT / "data/academy/competency/assessment_routing.json").read_text())
    profiles = {
        p["drillId"]: p
        for p in json.loads((ROOT / "data/academy/competency/drill_profiles.json").read_text())["profiles"]
    }
    existing = json.loads((ROOT / "data/academy/competency/assessment_specs.json").read_text())

    ai_rows = [
        r
        for r in routing["drills"]
        if r["assessmentSource"] in ("structured_plus_ai_review", "ai_review")
    ]
    drills = []
    for r in sorted(ai_rows, key=lambda x: x["drillId"]):
        did = r["drillId"]
        weights = profiles[did]["evidence"]["weights"]
        comps = sorted([k for k, v in weights.items() if float(v) > 0])
        row = {
            "drillId": did,
            "scope": r["scope"],
            "assessmentSource": r["assessmentSource"],
            "readiness": r["readiness"],
            "productionReadyForAiEvidence": r["readiness"] == "READY",
            "costLatencyClass": r.get("costLatencyClass"),
            "competencies": comps,
            "focus": FOCUS.get(did, ["drill-specific observation quality"]),
            "mustNotInfer": MUST_NOT.get(did, MUST_NOT_DEFAULT),
            "aiNeededFor": r.get("aiNeededFor") or [],
        }
        if did in MISSING:
            row.update(MISSING[did])
        if did == "E3_D4":
            pass  # required userStatement shipped; READY via routing
        if did in ("E1_D1", "E3_D5"):
            row["pureAiReview"] = {
                "whyStructuredInsufficient": "Core performance is open analytical language that cannot be reduced to selects alone.",
                "evaluableFreeText": "E1_D1: pattern_summary (+ logs context). E3_D5: finalClaim, falsificationCondition, nextObservationTest.",
                "insufficientInputSignals": [
                    "empty/near-empty text",
                    "injection-only text",
                    "no observable anchors and no task answer",
                ],
                "noGroundTruth": True,
            }
        drills.append(row)

    existing["drills"] = drills
    existing["assessmentSpecVersion"] = "assessment-spec-v1"
    out = ROOT / "data/academy/competency/assessment_specs.json"
    out.write_text(json.dumps(existing, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"wrote {out} drills={len(drills)}")


if __name__ == "__main__":
    main()
