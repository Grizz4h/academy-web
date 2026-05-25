#!/usr/bin/env python3
"""Normalize game_info.season values in stored session JSON files.

Rules:
- DEL/DEL2/NHL -> split season format YYYY/YY (e.g. 2025/26)
- WM/Olympia/Nationalmannschaften -> single year YYYY
- Other leagues prefer split season when a season range is provided,
  otherwise a single-year fallback is used when detectable.
"""

from __future__ import annotations

import argparse
import json
import os
import re
from collections import Counter
from dataclasses import dataclass
from datetime import datetime
from typing import Optional

SPLIT_SEASON_LEAGUES = {"DEL", "DEL2", "NHL"}
YEAR_ONLY_LEAGUES = {"WM", "OLYMPIA", "NATIONALMANNSCHAFTEN"}


@dataclass
class Result:
    path: str
    league: str
    before: str
    after: str


def parse_year_token(token: Optional[str]) -> Optional[int]:
    if not token:
        return None
    clean = token.strip()
    if not re.fullmatch(r"\d{2,4}", clean):
        return None
    value = int(clean)
    if len(clean) == 4:
        return value if 1900 <= value <= 2100 else None
    if len(clean) == 2:
        return 2000 + value if value <= 69 else 1900 + value
    return None


def extract_year(raw: str) -> Optional[int]:
    m4 = re.search(r"(?:19|20)\d{2}", raw)
    if m4:
        return parse_year_token(m4.group(0))
    m2 = re.search(r"\d{2}", raw)
    if m2:
        return parse_year_token(m2.group(0))
    return None


def normalize_split_season(raw: str) -> Optional[str]:
    match = re.search(r"(\d{2,4})\s*[\-/]\s*(\d{2,4})", raw)
    if match:
        start = parse_year_token(match.group(1))
        end = parse_year_token(match.group(2))
        if not start:
            return None
        end_year = end if end else start + 1
        return f"{start}/{end_year % 100:02d}"

    year = extract_year(raw)
    if year:
        return f"{year}/{(year + 1) % 100:02d}"
    return None


def normalize_year_only(raw: str) -> Optional[str]:
    year = extract_year(raw)
    return str(year) if year else None


def normalize_season(raw_season: str, league: Optional[str]) -> Optional[str]:
    raw = (raw_season or "").strip()
    if not raw:
        return None

    upper_raw = raw.upper()
    upper_league = (league or "").strip().upper()

    is_year_only = (
        upper_league in YEAR_ONLY_LEAGUES
        or "WM" in upper_raw
        or "OLYMPIA" in upper_raw
    )
    if is_year_only:
        return normalize_year_only(raw)

    if upper_league in SPLIT_SEASON_LEAGUES:
        return normalize_split_season(raw)

    # Generic fallback for other leagues:
    # prefer split season if possible, else year-only if detectable.
    return normalize_split_season(raw) or normalize_year_only(raw)


def infer_season_from_created_at(created_at: Optional[str], league: Optional[str]) -> Optional[str]:
    if not created_at:
        return None
    try:
        dt = datetime.fromisoformat(str(created_at).replace("Z", "+00:00"))
    except Exception:
        return None

    upper_league = (league or "").strip().upper()
    if upper_league in YEAR_ONLY_LEAGUES:
        return str(dt.year)

    # Split season inference for league-based competitions:
    # Jul-Dec => current year/start year; Jan-Jun => previous year/start year.
    start_year = dt.year if dt.month >= 7 else dt.year - 1
    return f"{start_year}/{(start_year + 1) % 100:02d}"


def iter_session_files(roots: list[str]) -> list[str]:
    files: list[str] = []
    for root in roots:
        if not os.path.isdir(root):
            continue
        for dirpath, _, filenames in os.walk(root):
            for filename in filenames:
                if filename.endswith(".json"):
                    files.append(os.path.join(dirpath, filename))
    return sorted(files)


def process_sessions(roots: list[str], apply_changes: bool) -> tuple[list[Result], Counter, Counter, list[tuple[str, str, str]], int]:
    files = iter_session_files(roots)
    before_counter: Counter = Counter()
    after_counter: Counter = Counter()
    changed: list[Result] = []
    unresolved: list[tuple[str, str, str]] = []
    inferred_missing_count = 0

    for path in files:
        with open(path, "r", encoding="utf-8") as f:
            payload = json.load(f)

        if not isinstance(payload, dict):
            continue

        game_info = payload.get("game_info")
        if not isinstance(game_info, dict):
            continue

        raw_season = game_info.get("season")
        league = str(game_info.get("league") or "")

        if raw_season is None or str(raw_season).strip() == "":
            inferred = infer_season_from_created_at(payload.get("created_at"), league)
            if not inferred:
                unresolved.append((path, league, "<missing>"))
                continue
            inferred_missing_count += 1
            changed.append(Result(path=path, league=league, before="<missing>", after=inferred))
            after_counter[inferred] += 1
            if apply_changes:
                payload["game_info"]["season"] = inferred
                with open(path, "w", encoding="utf-8") as f:
                    json.dump(payload, f, ensure_ascii=False, indent=2)
                    f.write("\n")
            continue

        raw_season_str = str(raw_season)
        before_counter[raw_season_str] += 1

        normalized = normalize_season(raw_season_str, league)
        if not normalized:
            unresolved.append((path, league, raw_season_str))
            continue

        after_counter[normalized] += 1

        if normalized == raw_season_str:
            continue

        changed.append(Result(path=path, league=league, before=raw_season_str, after=normalized))
        if apply_changes:
            payload["game_info"]["season"] = normalized
            with open(path, "w", encoding="utf-8") as f:
                json.dump(payload, f, ensure_ascii=False, indent=2)
                f.write("\n")

    return changed, before_counter, after_counter, unresolved, inferred_missing_count


def main() -> int:
    parser = argparse.ArgumentParser(description="Normalize session season fields.")
    parser.add_argument(
        "--apply",
        action="store_true",
        help="Write normalized season values back to files.",
    )
    parser.add_argument(
        "--roots",
        nargs="*",
        default=["data/academy/sessions", "backend/data/academy/sessions"],
        help="Session roots to scan.",
    )
    args = parser.parse_args()

    changed, before_counter, after_counter, unresolved, inferred_missing_count = process_sessions(args.roots, args.apply)

    print("=== Season Normalization Report ===")
    print(f"Mode: {'APPLY' if args.apply else 'DRY-RUN'}")
    print(f"Roots: {', '.join(args.roots)}")
    print(f"Found season formats: {len(before_counter)}")
    for season, count in before_counter.most_common():
        print(f"  {season!r}: {count}")

    print(f"\nNormalized output formats: {len(after_counter)}")
    for season, count in after_counter.most_common():
        print(f"  {season!r}: {count}")

    print(f"\nPatched sessions: {len(changed)}")
    print(f"  inferred from missing season: {inferred_missing_count}")
    for row in changed[:30]:
        print(f"  {row.path}: {row.before!r} -> {row.after!r} ({row.league})")
    if len(changed) > 30:
        print(f"  ... and {len(changed) - 30} more")

    print(f"\nUnresolved seasons: {len(unresolved)}")
    for path, league, raw in unresolved[:20]:
        print(f"  {path}: {raw!r} ({league})")
    if len(unresolved) > 20:
        print(f"  ... and {len(unresolved) - 20} more")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
