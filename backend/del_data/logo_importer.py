"""Download PENNY DEL team logos into the frontend public folder.

Uses the same team config as the roster importer. No second source.
"""

from __future__ import annotations

import json
import os
import re
from typing import Any, Dict, List, Optional
from urllib.request import Request, urlopen

BASE_URL = "https://www.penny-del.org"
USER_AGENT = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
)


def _repo_root() -> str:
    return os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))


def _fetch(url: str) -> Optional[bytes]:
    try:
        request = Request(url, headers={"User-Agent": USER_AGENT})
        with urlopen(request, timeout=20) as response:
            return response.read()
    except Exception as exc:
        print(f"[LogoImporter] fetch failed {url}: {exc}")
        return None


def _overview_url(team: Dict[str, Any]) -> str:
    explicit = (team.get("overview_url") or "").strip()
    if explicit:
        return explicit
    slug = (team.get("slug") or "").strip()
    return f"{BASE_URL}/teams/{slug}/uebersicht"


def _norm(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", " ", (value or "").lower()).strip()


def _names_match(alt: str, team_name: str) -> bool:
    left = _norm(alt)
    right = _norm(team_name)
    if not left or not right:
        return False
    return left == right or left in right or right in left


def _pick_logo_src(html: str, team_name: str) -> Optional[str]:
    images = re.findall(
        r'<img\b[^>]*\balt="([^"]*)"[^>]*\bsrc="([^"]+)"[^>]*>|'
        r'<img\b[^>]*\bsrc="([^"]+)"[^>]*\balt="([^"]*)"[^>]*>',
        html,
        re.I,
    )
    candidates: List[str] = []
    for alt_a, src_a, src_b, alt_b in images:
        alt = alt_a or alt_b
        src = src_a or src_b
        if "fileadmin/" not in src:
            continue
        if "billboard" in src.lower() or ".jpg" in src.lower():
            continue
        if not _names_match(alt, team_name):
            continue
        if "team" not in src.lower() and "images/teams/" not in src:
            continue
        candidates.append(src)
    if not candidates:
        return None
    svgs = [src for src in candidates if src.lower().endswith(".svg")]
    originals = [src for src in candidates if "/images/teams/" in src]
    return (svgs or originals or candidates)[0]


def import_team_logos(
    config_path: Optional[str] = None,
    output_dir: Optional[str] = None,
    manifest_path: Optional[str] = None,
) -> Dict[str, Any]:
    root = _repo_root()
    config_path = config_path or os.path.join(root, "data", "academy", "penny_del_import_teams.json")
    output_dir = output_dir or os.path.join(root, "frontend", "public", "teams", "del")
    manifest_path = manifest_path or os.path.join(root, "frontend", "src", "data", "delTeamLogos.json")

    with open(config_path, "r", encoding="utf-8") as handle:
        teams = json.load(handle)

    os.makedirs(output_dir, exist_ok=True)
    existing: Dict[str, str] = {}
    if os.path.exists(manifest_path):
        with open(manifest_path, "r", encoding="utf-8") as handle:
            loaded = json.load(handle)
        if isinstance(loaded, dict):
            existing = {str(key): str(value) for key, value in loaded.items() if key and value}
    logos: Dict[str, str] = dict(existing)
    errors: List[str] = []

    for team in teams:
        catalog_id = (team.get("catalog_id") or "").strip()
        name = (team.get("team") or "").strip()
        if not catalog_id or not name:
            continue
        existing_src = existing.get(catalog_id, "")
        if existing_src.lower().endswith(".png"):
            local_png = os.path.join(output_dir, os.path.basename(existing_src.split("?")[0]))
            if os.path.exists(local_png):
                logos[catalog_id] = existing_src
                print(f"[LogoImporter] {catalog_id} keep local png")
                continue
        html_bytes = _fetch(_overview_url(team))
        if not html_bytes:
            errors.append(f"{catalog_id}: übersicht nicht erreichbar")
            continue
        html = html_bytes.decode("utf-8", errors="ignore")
        src = _pick_logo_src(html, name)
        if not src:
            errors.append(f"{catalog_id}: kein Logo auf der Übersicht")
            continue
        absolute = src if src.startswith("http") else f"{BASE_URL}{src}"
        payload = _fetch(absolute)
        if not payload:
            errors.append(f"{catalog_id}: download fehlgeschlagen {absolute}")
            continue
        ext = os.path.splitext(src.split("?")[0])[1].lower() or ".svg"
        filename = f"{catalog_id}{ext}"
        with open(os.path.join(output_dir, filename), "wb") as handle:
            handle.write(payload)
        logos[catalog_id] = f"/teams/del/{filename}"
        print(f"[LogoImporter] {catalog_id} ← {absolute}")

    with open(manifest_path, "w", encoding="utf-8") as handle:
        json.dump(logos, handle, ensure_ascii=False, indent=2)
        handle.write("\n")

    return {"ok": not errors, "count": len(logos), "logos": logos, "errors": errors}


if __name__ == "__main__":
    result = import_team_logos()
    print(json.dumps({k: result[k] for k in ("ok", "count", "errors")}, ensure_ascii=False, indent=2))
