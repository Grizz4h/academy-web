"""Download NHL team logos from assets.nhle.com."""

from __future__ import annotations

import json
import os
from typing import Any, Dict, List, Optional
from urllib.request import Request, urlopen

from .nhl_schedule_importer import _ABBREV_TO_ID, _API, _fetch_json, _localized

_USER_AGENT = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
)
_LOGO_URL = "https://assets.nhle.com/logos/nhl/svg/{abbrev}_light.svg"


def _repo_root() -> str:
    return os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))


def _fetch(url: str) -> Optional[bytes]:
    try:
        request = Request(url, headers={"User-Agent": _USER_AGENT})
        with urlopen(request, timeout=25) as response:
            return response.read()
    except Exception as exc:
        print(f"[NHLLogoImporter] fetch failed {url}: {exc}")
        return None


def import_nhl_team_logos(
    *,
    output_dir: Optional[str] = None,
    manifest_path: Optional[str] = None,
) -> Dict[str, Any]:
    root = _repo_root()
    output_dir = output_dir or os.path.join(root, "frontend", "public", "teams", "nhl")
    manifest_path = manifest_path or os.path.join(root, "frontend", "src", "data", "nhlTeamLogos.json")
    os.makedirs(output_dir, exist_ok=True)

    logos: Dict[str, str] = {}
    errors: List[str] = []

    standings = _fetch_json(f"{_API}/standings/now") or {}
    rows = standings.get("standings") or []
    teams: Dict[str, str] = {}
    for row in rows:
        abbrev = _localized(row.get("teamAbbrev")).upper()
        catalog_id = _ABBREV_TO_ID.get(abbrev)
        logo = row.get("teamLogo") or _LOGO_URL.format(abbrev=abbrev)
        if catalog_id and abbrev:
            teams[catalog_id] = logo

    # Fallback: known abbrev map even if standings omit a club.
    for abbrev, catalog_id in _ABBREV_TO_ID.items():
        teams.setdefault(catalog_id, _LOGO_URL.format(abbrev=abbrev))

    for catalog_id, src in sorted(teams.items()):
        payload = _fetch(src)
        if not payload or len(payload) < 50:
            errors.append(f"{catalog_id}: Logo fehlt ({src})")
            continue
        # NHL serves SVG; keep extension.
        ext = ".svg" if b"<svg" in payload[:200].lower() or src.endswith(".svg") else ".png"
        if payload[:8] == b"\x89PNG\r\n\x1a\n":
            ext = ".png"
        filename = f"{catalog_id}{ext}"
        with open(os.path.join(output_dir, filename), "wb") as handle:
            handle.write(payload)
        logos[catalog_id] = f"/teams/nhl/{filename}"
        print(f"[NHLLogoImporter] {catalog_id} ← {src}")

    with open(manifest_path, "w", encoding="utf-8") as handle:
        json.dump(logos, handle, ensure_ascii=False, indent=2)
        handle.write("\n")

    return {"ok": not errors, "count": len(logos), "logos": logos, "errors": errors}


if __name__ == "__main__":
    result = import_nhl_team_logos()
    print(json.dumps({k: result[k] for k in ("ok", "count", "errors")}, ensure_ascii=False, indent=2))
