#!/usr/bin/env python3
"""
Backfill achievement state for all users based on their existing session history.

Logic mirrors the frontend reward engine exactly:
  - deriveRewardFacts      → computed from COMPLETED sessions
  - evaluateAchievements   → condition checks against facts
  - device_type            → not checkable server-side; device achievements skipped
  - note_length            → not stored per session; skipped (would need noteText)
  - completion_hour_between → uses post.completed_at hour (local UTC)

Run: python3 scripts/backfill_achievements.py
     python3 scripts/backfill_achievements.py --dry-run   (preview only, no write)
"""

import json
import os
import sys
from datetime import datetime, timezone
from collections import defaultdict

# ── Config ────────────────────────────────────────────────────────────────────

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR   = os.path.join(SCRIPT_DIR, "..")
DATA_DIR   = os.path.join(ROOT_DIR, "data", "academy")
SESSIONS_DIR = os.path.join(DATA_DIR, "sessions")
REWARDS_DIR  = os.path.join(DATA_DIR, "rewards")

DRY_RUN = "--dry-run" in sys.argv

# ── Achievement definitions (mirrored from achievements.ts) ───────────────────

ACHIEVEMENTS = [
    {"id": "first-drill-complete",    "condition": {"type": "completed_drills_total",   "min": 1},  "PUX": 10},
    {"id": "ten-drills-complete",      "condition": {"type": "completed_drills_total",   "min": 10}, "PUX": 25},
    {"id": "fifty-drills-complete",    "condition": {"type": "completed_drills_total",   "min": 50}, "PUX": 50},
    {"id": "three-completed-in-a-row", "condition": {"type": "completed_session_streak", "min": 3},  "PUX": 20},
    {"id": "seven-active-days",        "condition": {"type": "active_days_total",        "min": 7},  "PUX": 35},
    {"id": "five-distinct-drills",     "condition": {"type": "distinct_drills_total",    "min": 5},  "PUX": 20},
    {"id": "ten-distinct-drills",      "condition": {"type": "distinct_drills_total",    "min": 10}, "PUX": 35},
    # current_session_drill_count needs live session context — evaluated per-session below
    {"id": "five-drills-one-session",  "condition": {"type": "current_session_drill_count", "min": 5},  "PUX": 25},
    {"id": "ten-drills-one-session",   "condition": {"type": "current_session_drill_count", "min": 10}, "PUX": 50},
    # completion_hour_between uses UTC hour from post.completed_at
    {"id": "early-bird",       "condition": {"type": "completion_hour_between", "start": 4,  "end": 6},  "PUX": 10},
    {"id": "night-owl",        "condition": {"type": "completion_hour_between", "start": 0,  "end": 3},  "PUX": 15},
    {"id": "prime-time-scout", "condition": {"type": "completion_hour_between", "start": 19, "end": 22}, "PUX": 15},
    # device_type and note_length cannot be determined from stored session data — skipped
]

SKIPPED_CONDITIONS = {"device_type", "note_length"}


# ── Helpers ───────────────────────────────────────────────────────────────────

def load_json(path):
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def save_json(path, data):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def iter_session_files():
    for root, _, files in os.walk(SESSIONS_DIR):
        for fname in files:
            if fname.endswith(".json"):
                yield os.path.join(root, fname)


def to_day_key(date_str):
    """Return YYYY-MM-DD or None for an ISO date string."""
    if not date_str:
        return None
    try:
        dt = datetime.fromisoformat(date_str.replace("Z", "+00:00"))
        return dt.strftime("%Y-%m-%d")
    except Exception:
        return None


def completion_hour(date_str):
    """Return UTC hour (0-23) or -1 if invalid (sentinel: never matches a time window)."""
    if not date_str:
        return -1
    try:
        dt = datetime.fromisoformat(date_str.replace("Z", "+00:00"))
        return dt.hour
    except Exception:
        return -1


def matches_hour_window(hour, start, end):
    if hour < 0:
        return False  # invalid date sentinel
    if start <= end:
        return start <= hour <= end
    return hour >= start or hour <= end  # wraps midnight


def build_completed_session_streak(sessions_sorted_newest_first):
    """Count consecutive COMPLETED sessions from most recent."""
    streak = 0
    for s in sessions_sorted_newest_first:
        if s.get("state") != "COMPLETED":
            break
        streak += 1
    return streak


# ── Per-user fact derivation and achievement evaluation ───────────────────────

def derive_facts_global(completed_sessions):
    """Facts derived across ALL completed sessions (cumulative totals)."""
    completed_drills = []
    for s in completed_sessions:
        completed_drills.extend(s.get("drills") or [])

    completed_day_keys = set()
    for s in completed_sessions:
        post = s.get("post") or {}
        day = to_day_key(post.get("completed_at") or s.get("created_at"))
        if day:
            completed_day_keys.add(day)

    distinct_drill_ids = set(d.get("id") for d in completed_drills if d.get("id"))

    return {
        "completed_drills_total": len(completed_drills),
        "distinct_drills_total": len(distinct_drill_ids),
        "active_days_total": len(completed_day_keys),
    }


def evaluate_for_user(user_key, sessions, existing_state):
    """
    Evaluate which achievements to backfill for a user.
    Returns list of (achievement_id, unlocked_at, pux).
    """
    already_unlocked = set(existing_state.get("unlockedAchievements", {}).keys())
    already_processed = set(existing_state.get("processedSessions", {}).keys())

    completed_sessions = [s for s in sessions if s.get("state") == "COMPLETED"]
    completed_sessions_sorted = sorted(
        completed_sessions,
        key=lambda s: s.get("post", {}).get("completed_at") or s.get("created_at") or "",
    )
    all_sorted_newest = sorted(
        sessions,
        key=lambda s: s.get("created_at") or "",
        reverse=True,
    )

    global_facts = derive_facts_global(completed_sessions)
    streak = build_completed_session_streak(all_sorted_newest)

    to_unlock = []  # (id, unlocked_at, pux)

    for ach in ACHIEVEMENTS:
        ach_id = ach["id"]
        cond   = ach["condition"]
        ctype  = cond["type"]

        if ach_id in already_unlocked:
            continue

        if ctype in SKIPPED_CONDITIONS:
            continue

        # ── Cumulative conditions ─────────────────────────────────────────────
        if ctype == "completed_drills_total":
            if global_facts["completed_drills_total"] >= cond["min"]:
                # Unlock at the session where the threshold was crossed
                unlocked_at = _find_drill_threshold_session(completed_sessions_sorted, cond["min"])
                to_unlock.append((ach_id, unlocked_at, ach["PUX"]))

        elif ctype == "distinct_drills_total":
            if global_facts["distinct_drills_total"] >= cond["min"]:
                unlocked_at = _find_distinct_drill_threshold_session(completed_sessions_sorted, cond["min"])
                to_unlock.append((ach_id, unlocked_at, ach["PUX"]))

        elif ctype == "active_days_total":
            if global_facts["active_days_total"] >= cond["min"]:
                unlocked_at = _find_active_day_threshold_session(completed_sessions_sorted, cond["min"])
                to_unlock.append((ach_id, unlocked_at, ach["PUX"]))

        elif ctype == "completed_session_streak":
            if streak >= cond["min"]:
                # Unlock at earliest session that forms the required streak
                if len(all_sorted_newest) >= cond["min"]:
                    target = all_sorted_newest[cond["min"] - 1]
                    unlocked_at = (target.get("post") or {}).get("completed_at") or target.get("created_at") or _now()
                    to_unlock.append((ach_id, unlocked_at, ach["PUX"]))

        # ── Per-session conditions ────────────────────────────────────────────
        elif ctype == "current_session_drill_count":
            # Check if any single completed session had enough drills
            match = next(
                (s for s in completed_sessions_sorted
                 if len(s.get("progress", {}).get("completed_drills") or s.get("drills") or []) >= cond["min"]),
                None,
            )
            if match:
                unlocked_at = (match.get("post") or {}).get("completed_at") or match.get("created_at") or _now()
                to_unlock.append((ach_id, unlocked_at, ach["PUX"]))

        elif ctype == "completion_hour_between":
            match = next(
                (s for s in completed_sessions_sorted
                 if matches_hour_window(
                     completion_hour((s.get("post") or {}).get("completed_at")),
                     cond["start"], cond["end"],
                 )),
                None,
            )
            if match:
                unlocked_at = (match.get("post") or {}).get("completed_at") or match.get("created_at") or _now()
                to_unlock.append((ach_id, unlocked_at, ach["PUX"]))

    return to_unlock


# ── Threshold helpers ─────────────────────────────────────────────────────────

def _now():
    return datetime.now(timezone.utc).isoformat()


def _find_drill_threshold_session(sorted_sessions, target):
    count = 0
    for s in sorted_sessions:
        count += len(s.get("drills") or [])
        if count >= target:
            return (s.get("post") or {}).get("completed_at") or s.get("created_at") or _now()
    return _now()


def _find_distinct_drill_threshold_session(sorted_sessions, target):
    seen = set()
    for s in sorted_sessions:
        for d in s.get("drills") or []:
            if d.get("id"):
                seen.add(d["id"])
        if len(seen) >= target:
            return (s.get("post") or {}).get("completed_at") or s.get("created_at") or _now()
    return _now()


def _find_active_day_threshold_session(sorted_sessions, target):
    seen_days = set()
    for s in sorted_sessions:
        post = s.get("post") or {}
        day = to_day_key(post.get("completed_at") or s.get("created_at"))
        if day:
            seen_days.add(day)
        if len(seen_days) >= target:
            return post.get("completed_at") or s.get("created_at") or _now()
    return _now()


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    print(f"{'[DRY-RUN] ' if DRY_RUN else ''}Backfilling achievements from sessions in {SESSIONS_DIR}\n")

    # Load all sessions grouped by normalised user key
    user_sessions = defaultdict(list)
    for path in iter_session_files():
        try:
            s = load_json(path)
            ukey = (s.get("user") or "").strip().lower()
            if ukey:
                user_sessions[ukey].append(s)
        except Exception as e:
            print(f"  WARN: could not load {path}: {e}")

    for user_key, sessions in sorted(user_sessions.items()):
        reward_path = os.path.join(REWARDS_DIR, f"{user_key}.json")
        if os.path.exists(reward_path):
            try:
                existing = load_json(reward_path)
            except Exception:
                existing = {}
        else:
            existing = {}

        to_unlock = evaluate_for_user(user_key, sessions, existing)

        completed_count = sum(1 for s in sessions if s.get("state") == "COMPLETED")
        print(f"User: {user_key}")
        print(f"  Sessions total: {len(sessions)}  |  completed: {completed_count}")

        if not to_unlock:
            print("  → nothing new to unlock\n")
            continue

        for ach_id, unlocked_at, pux in to_unlock:
            mark = "[DRY-RUN] " if DRY_RUN else ""
            print(f"  {mark}✓ {ach_id}  (at {unlocked_at}, +{pux} PUX)")

        if not DRY_RUN:
            # Merge into existing state
            already = existing.get("unlockedAchievements") or {}
            currency = existing.get("currency") or {"PUX": 0}
            total_pux = sum(p for _, _, p in to_unlock)

            for ach_id, unlocked_at, _pux in to_unlock:
                if ach_id not in already:
                    already[ach_id] = {"id": ach_id, "unlockedAt": unlocked_at}

            currency["PUX"] = int(currency.get("PUX") or 0) + total_pux

            new_state = {
                "currency": currency,
                "unlockedAchievements": already,
                "unlockedMasteries": existing.get("unlockedMasteries") or {},
                "processedSessions": existing.get("processedSessions") or {},
                "lastUpdatedAt": _now(),
            }
            save_json(reward_path, new_state)
            print(f"  → saved to {reward_path}  (+{total_pux} PUX total)")

        print()

    print("Done.")


if __name__ == "__main__":
    main()
