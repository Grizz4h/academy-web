"""Build review rows and summaries from AiEvidenceEvaluator detailed output."""

from __future__ import annotations

from dataclasses import asdict, dataclass, field
from statistics import mean as _mean
from typing import Any, Dict, List, Optional, Sequence

from .bands import BAND_ORDER, mean, median


@dataclass
class ReviewRow:
    drillId: str
    caseId: str
    expectedBand: str
    caseKind: str
    competencyId: str
    quality: float
    specificity: float
    evidenceAlignment: float
    unsupportedClaims: float
    reasonCode: str
    flags: List[str] = field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


@dataclass
class BandStats:
    expectedBand: str
    count: int
    meanQuality: Optional[float]
    medianQuality: Optional[float]
    minQuality: Optional[float]
    maxQuality: Optional[float]


@dataclass
class DrillSummary:
    drillId: str
    bandStats: List[BandStats]
    monotonic: bool
    tooHigh: int
    tooLow: int
    injectionProblems: int
    unsupportedMissed: int
    rowCount: int
    verdictHint: str


@dataclass
class CalibrationReport:
    mode: str
    rows: List[ReviewRow]
    drills: List[DrillSummary]
    globalVerdict: str

    def to_dict(self) -> Dict[str, Any]:
        return {
            "mode": self.mode,
            "globalVerdict": self.globalVerdict,
            "drills": [
                {
                    "drillId": d.drillId,
                    "monotonic": d.monotonic,
                    "tooHigh": d.tooHigh,
                    "tooLow": d.tooLow,
                    "injectionProblems": d.injectionProblems,
                    "unsupportedMissed": d.unsupportedMissed,
                    "rowCount": d.rowCount,
                    "verdictHint": d.verdictHint,
                    "bandStats": [asdict(b) for b in d.bandStats],
                }
                for d in self.drills
            ],
            "rows": [r.to_dict() for r in self.rows],
        }


def _band_means(rows: Sequence[ReviewRow]) -> Dict[str, float]:
    buckets: Dict[str, List[float]] = {}
    for row in rows:
        if row.caseKind != "band":
            continue
        buckets.setdefault(row.expectedBand, []).append(row.quality)
    return {band: _mean(vals) for band, vals in buckets.items() if vals}


def _is_monotonic(band_means: Dict[str, float]) -> bool:
    ordered = [band_means[b] for b in BAND_ORDER if b in band_means]
    if len(ordered) < 2:
        return True
    return all(ordered[i] <= ordered[i + 1] + 0.05 for i in range(len(ordered) - 1))


def summarize_drill(drill_id: str, rows: Sequence[ReviewRow]) -> DrillSummary:
    drill_rows = [r for r in rows if r.drillId == drill_id]
    band_stats: List[BandStats] = []
    for band in BAND_ORDER:
        qualities = [r.quality for r in drill_rows if r.expectedBand == band and r.caseKind == "band"]
        band_stats.append(
            BandStats(
                expectedBand=band,
                count=len(qualities),
                meanQuality=mean(qualities),
                medianQuality=median(qualities),
                minQuality=min(qualities) if qualities else None,
                maxQuality=max(qualities) if qualities else None,
            )
        )

    too_high = sum(1 for r in drill_rows if "TOO_HIGH" in r.flags)
    too_low = sum(1 for r in drill_rows if "TOO_LOW" in r.flags)
    injection = sum(1 for r in drill_rows if "INJECTION_SUSPICIOUS" in r.flags)
    unsupported = sum(1 for r in drill_rows if "UNSUPPORTED_CLAIMS_MISSED" in r.flags)
    mono = _is_monotonic(_band_means(drill_rows))

    problems = too_high + too_low + injection + unsupported
    if problems == 0 and mono:
        hint = "looks_good"
    else:
        hint = "review_prompt_rubric"

    return DrillSummary(
        drillId=drill_id,
        bandStats=band_stats,
        monotonic=mono,
        tooHigh=too_high,
        tooLow=too_low,
        injectionProblems=injection,
        unsupportedMissed=unsupported,
        rowCount=len(drill_rows),
        verdictHint=hint,
    )


def build_report(*, mode: str, rows: List[ReviewRow]) -> CalibrationReport:
    drill_ids = sorted({r.drillId for r in rows})
    drills = [summarize_drill(d, rows) for d in drill_ids]
    if drills and all(d.verdictHint == "looks_good" for d in drills):
        verdict = "PILOT CALIBRATION LOOKS GOOD"
    else:
        verdict = "REVIEW PROMPT/RUBRIC BEFORE ROLLOUT"
    return CalibrationReport(mode=mode, rows=rows, drills=drills, globalVerdict=verdict)


def format_markdown(report: CalibrationReport) -> str:
    lines: List[str] = [
        "# AI Evidence Calibration Review",
        "",
        f"Mode: `{report.mode}`",
        f"Verdict: **{report.globalVerdict}**",
        "",
        "## Rows",
        "",
        "| drillId | caseId | expectedBand | competencyId | quality | specificity | evidenceAlignment | unsupportedClaims | reasonCode | flags |",
        "|---|---|---|---|---:|---:|---:|---:|---|---|",
    ]
    for r in report.rows:
        lines.append(
            f"| {r.drillId} | {r.caseId} | {r.expectedBand} | {r.competencyId} | "
            f"{r.quality:.2f} | {r.specificity:.2f} | {r.evidenceAlignment:.2f} | "
            f"{r.unsupportedClaims:.2f} | {r.reasonCode} | {','.join(r.flags)} |"
        )

    lines.extend(["", "## Summary by drill", ""])
    for d in report.drills:
        lines.append(f"### {d.drillId}")
        lines.append(
            f"- rows={d.rowCount} monotonic={d.monotonic} "
            f"TOO_HIGH={d.tooHigh} TOO_LOW={d.tooLow} "
            f"INJECTION={d.injectionProblems} UNSUPPORTED_MISSED={d.unsupportedMissed}"
        )
        lines.append("- band means (band cases only):")
        for b in d.bandStats:
            if b.count == 0:
                continue
            lines.append(
                f"  - {b.expectedBand}: n={b.count} mean={b.meanQuality:.2f} "
                f"median={b.medianQuality:.2f} min={b.minQuality:.2f} max={b.maxQuality:.2f}"
            )
        lines.append("")
    return "\n".join(lines)
