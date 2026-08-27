#!/usr/bin/env python3
"""One-shot development_data_cleanup for all local reward/profile JSON files.

Test accounts only — does not implement product grandfathering (Rev. B path A).

Usage:
  python3 backend/scripts/dev_cosmetic_cleanup_all.py
  python3 backend/scripts/dev_cosmetic_cleanup_all.py --reset-progression
"""

from __future__ import annotations

import argparse
import json
import os
import sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
BACKEND = os.path.join(ROOT, "backend")
if BACKEND not in sys.path:
    sys.path.insert(0, BACKEND)

from progression.cosmetic_cleanup import (  # noqa: E402
    development_data_cleanup_profile,
    development_data_cleanup_reward_state,
)


def _load(path: str) -> dict:
    with open(path, "r", encoding="utf-8") as fh:
        data = json.load(fh)
    return data if isinstance(data, dict) else {}


def _save(path: str, data: dict) -> None:
    with open(path, "w", encoding="utf-8") as fh:
        json.dump(data, fh, indent=2, ensure_ascii=False)
        fh.write("\n")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--reset-progression",
        action="store_true",
        help="Also wipe XP/PUX/units (full default reward state)",
    )
    parser.add_argument(
        "--rewards-dir",
        default=os.path.join(ROOT, "data", "academy", "rewards"),
    )
    parser.add_argument(
        "--profiles-dir",
        default=os.path.join(ROOT, "data", "academy", "profiles"),
    )
    args = parser.parse_args()

    reward_count = 0
    for name in sorted(os.listdir(args.rewards_dir)):
        if not name.endswith(".json") or name.endswith(".lock"):
            continue
        path = os.path.join(args.rewards_dir, name)
        state = _load(path)
        cleaned = development_data_cleanup_reward_state(
            state,
            reset_progression=args.reset_progression,
        )
        _save(path, cleaned)
        reward_count += 1
        print(f"reward cleaned: {name}")

    profile_count = 0
    if os.path.isdir(args.profiles_dir):
        for name in sorted(os.listdir(args.profiles_dir)):
            if not name.endswith(".json") or name.endswith(".lock"):
                continue
            path = os.path.join(args.profiles_dir, name)
            profile = _load(path)
            development_data_cleanup_profile(profile)
            _save(path, profile)
            profile_count += 1
            print(f"profile cleaned: {name}")

    print(
        f"done: {reward_count} rewards, {profile_count} profiles "
        f"(reset_progression={args.reset_progression})"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
