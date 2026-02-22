#!/usr/bin/env python3
import argparse
import json
import os
import shutil
from datetime import datetime
from pathlib import Path


def parse_created_at(created_at: str | None) -> datetime:
    if created_at:
        try:
            return datetime.fromisoformat(created_at.replace("Z", "+00:00"))
        except ValueError:
            pass
    return datetime.now()


def target_path(sessions_root: Path, source_file: Path, created_at: str | None) -> Path:
    dt = parse_created_at(created_at)
    year = f"{dt.year:04d}"
    month = f"{dt.month:02d}"
    return sessions_root / year / month / source_file.name


def load_created_at(session_file: Path) -> str | None:
    try:
        data = json.loads(session_file.read_text(encoding="utf-8"))
        value = data.get("created_at")
        return value if isinstance(value, str) else None
    except Exception:
        return None


def main() -> int:
    parser = argparse.ArgumentParser(description="Migrate flat session JSON files into year/month folders")
    parser.add_argument("--dry-run", action="store_true", help="Show planned moves without changing files")
    args = parser.parse_args()

    repo_root = Path(__file__).resolve().parents[1]
    sessions_root = repo_root / "data" / "academy" / "sessions"

    if not sessions_root.exists():
        print("sessions directory not found:", sessions_root)
        return 1

    moved = 0
    skipped = 0

    flat_files = [p for p in sessions_root.iterdir() if p.is_file() and p.suffix == ".json"]

    for source in sorted(flat_files):
        created_at = load_created_at(source)
        dest = target_path(sessions_root, source, created_at)

        if dest == source:
            skipped += 1
            continue

        if dest.exists():
            if source.read_bytes() == dest.read_bytes():
                print(f"skip identical: {source} -> {dest}")
                if not args.dry_run:
                    source.unlink()
                skipped += 1
                continue

            stem = dest.stem
            suffix = dest.suffix
            dest = dest.with_name(f"{stem}_migrated_{int(datetime.now().timestamp())}{suffix}")

        print(f"move: {source} -> {dest}")
        if not args.dry_run:
            dest.parent.mkdir(parents=True, exist_ok=True)
            shutil.move(str(source), str(dest))
        moved += 1

    print(f"done: moved={moved} skipped={skipped}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
