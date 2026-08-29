"""AI evidence calibration review — synthetic only, no persistence.

Usage:
  cd backend
  .venv/bin/python -m competency.ai.calibration --mock
  .venv/bin/python -m competency.ai.calibration --mock --validation
  .venv/bin/python -m competency.ai.calibration --validation-matrix
  .venv/bin/python -m competency.ai.calibration --live   # costs OpenAI tokens
"""

from __future__ import annotations

import argparse
import json
import sys

from .report import format_markdown
from .runner import run_calibration


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description="AI evidence pilot calibration review (synthetic fixtures, no persistence)",
    )
    mode = parser.add_mutually_exclusive_group(required=False)
    mode.add_argument(
        "--mock",
        action="store_true",
        help="Deterministic mock provider (free, for tooling tests)",
    )
    mode.add_argument(
        "--live",
        action="store_true",
        help="Call real OpenAI provider (manual only; incurs cost)",
    )
    parser.add_argument(
        "--drill",
        action="append",
        dest="drills",
        help="Limit to drill id (repeatable). Default: B2_D5 and E1_D1",
    )
    parser.add_argument(
        "--validation",
        action="store_true",
        help="Include 6 cross-drill validation fixtures (generic rubric check)",
    )
    parser.add_argument(
        "--validation-matrix",
        action="store_true",
        help="Run synthetic class matrix (excellent→empty) with dimension diagnostics",
    )
    parser.add_argument(
        "--json",
        action="store_true",
        help="Emit JSON instead of Markdown",
    )
    args = parser.parse_args(argv)

    if args.validation_matrix:
        from .validation_matrix import format_validation_matrix_markdown, run_validation_matrix

        report = run_validation_matrix(drill_ids=args.drills)
        if args.json:
            print(json.dumps(report.to_dict(), ensure_ascii=False, indent=2))
        else:
            print(format_validation_matrix_markdown(report))
        return 0 if report.globalVerdict == "VALIDATION RUBRIC CALIBRATED" else 2

    if not args.mock and not args.live:
        parser.error("one of --mock / --live is required (unless --validation-matrix)")

    report = run_calibration(
        mode="live" if args.live else "mock",
        drill_ids=args.drills,
        include_validation=bool(args.validation),
    )

    if args.json:
        print(json.dumps(report.to_dict(), ensure_ascii=False, indent=2))
    else:
        print(format_markdown(report))

    return 0 if report.globalVerdict == "PILOT CALIBRATION LOOKS GOOD" else 2


if __name__ == "__main__":
    sys.exit(main())
