#!/usr/bin/env python3
"""Prune unfinished out-of-scope microfeedback slots from Postgres sessions.

Safe to re-run. Keeps:
  - slots for the session observation_scope
  - out-of-scope slots that are done or still have a check-in

Usage (from repo root, with .env.local loaded):

  backend/.venv/bin/python backend/scripts/prune_microfeedback_scope.py --dry-run
  backend/.venv/bin/python backend/scripts/prune_microfeedback_scope.py
"""

from __future__ import annotations

import argparse
import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]


def _load_env() -> None:
    for name in (".env.local", ".env"):
        path = ROOT / name
        if not path.exists():
            continue
        for line in path.read_text().splitlines():
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, value = line.split("=", 1)
            os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))


ACTIVE = {
    "FULL_GAME": ["P1", "P2", "P3"],
    "P1": ["P1"],
    "P2": ["P2"],
    "P3": ["P3"],
    "LESSON": [],
}


def normalize_scope(scope: str | None) -> str:
    value = (scope or "").strip().upper()
    return value if value in ACTIVE else "FULL_GAME"


def prune_microfeedback(scope: str | None, raw: object, checkins: object) -> tuple[dict, str]:
    scope_n = normalize_scope(scope)
    raw_dict = raw if isinstance(raw, dict) else {}
    checked: set[str] = set()
    if isinstance(checkins, list):
        for item in checkins:
            if not isinstance(item, dict):
                continue
            phase = str(item.get("phase") or "").strip().upper()
            if phase in {"P1", "P2", "P3"}:
                checked.add(phase)
    if scope_n == "LESSON":
        return {}, scope_n
    next_mf: dict = {}
    for phase in ACTIVE[scope_n]:
        existing = raw_dict.get(phase)
        next_mf[phase] = existing if isinstance(existing, dict) else {"done": False, "text": ""}
    for phase, payload in raw_dict.items():
        key = str(phase or "").strip().upper()
        if key in next_mf or key not in {"P1", "P2", "P3"}:
            continue
        if isinstance(payload, dict) and (payload.get("done") or key in checked):
            next_mf[key] = payload
    return next_mf, scope_n


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()
    _load_env()

    try:
        import psycopg
        from psycopg.types.json import Jsonb
    except ImportError:
        print("psycopg missing — use backend/.venv/bin/python", file=sys.stderr)
        return 1

    url = os.environ.get("DATABASE_URL") or os.environ.get("POSTGRES_URL")
    if not url:
        print("DATABASE_URL missing", file=sys.stderr)
        return 1

    scanned = 0
    changed = 0
    with psycopg.connect(url) as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT session_id, observation_scope, payload FROM sessions")
            rows = cur.fetchall()
            for session_id, observation_scope, payload in rows:
                scanned += 1
                doc = dict(payload) if isinstance(payload, dict) else {}
                raw = doc.get("microfeedback")
                next_mf, _scope_n = prune_microfeedback(
                    observation_scope or doc.get("observation_scope"),
                    raw,
                    doc.get("checkins") or [],
                )
                if next_mf == (raw if isinstance(raw, dict) else {}):
                    continue
                changed += 1
                if args.dry_run:
                    print(f"would prune {session_id}: {sorted((raw or {}).keys())} -> {sorted(next_mf.keys())}")
                    continue
                doc["microfeedback"] = next_mf
                if observation_scope:
                    doc["observation_scope"] = normalize_scope(observation_scope)
                cur.execute(
                    "UPDATE sessions SET payload = %s, updated_at = NOW() WHERE session_id = %s",
                    (Jsonb(doc), session_id),
                )
        if not args.dry_run:
            conn.commit()

    print(f"scanned={scanned} {'would_change' if args.dry_run else 'pruned'}={changed}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
