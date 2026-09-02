"""Download DEL2 team logos from del-2.org club pages into the frontend public folder."""

from __future__ import annotations

import json
import os
import re
from typing import Any, Dict, List, Optional
from urllib.request import Request, urlopen

BASE_URL = "https://www.del-2.org"
USER_AGENT = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
)


def _repo_root() -> str:
    return os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))


def _fetch(url: str) -> Optional[bytes]:
    try:
        request = Request(url, headers={"User-Agent": USER_AGENT})
        with urlopen(request, timeout=25) as response:
            return response.read()
    except Exception as exc:
        print(f"[DEL2LogoImporter] fetch failed {url}: {exc}")
        return None


def _norm(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", " ", (value or "").lower()).strip()


def _names_match(alt: str, team_name: str) -> bool:
    left = _norm(alt)
    right = _norm(team_name)
    if not left or not right:
        return False
    return left == right or left in right or right in left


def _pick_logo_src(html: str, team_name: str) -> Optional[str]:
    """Prefer the large club crest on the club detail page."""
    hero = re.search(
        r'<img\b[^>]*class="[^"]*img-fluid[^"]*bg-white[^"]*"[^>]*\bsrc="([^"]+)"[^>]*\balt="([^"]*)"[^>]*>|'
        r'<img\b[^>]*\balt="([^"]*)"[^>]*\bsrc="([^"]+)"[^>]*class="[^"]*img-fluid[^"]*bg-white[^"]*"[^>]*>',
        html,
        re.I,
    )
    if hero:
        src_a, alt_a, alt_b, src_b = hero.groups()
        src = src_a or src_b
        alt = alt_a or alt_b
        if src and _names_match(alt, team_name):
            return src

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
        if not src or "clubohnebild" in src:
            continue
        if "assets.holema.de" not in src:
            continue
        if not _names_match(alt, team_name):
            continue
        candidates.append(src)
    if not candidates:
        return None
    return candidates[0]


def import_del2_team_logos(
    config_path: Optional[str] = None,
    output_dir: Optional[str] = None,
    manifest_path: Optional[str] = None,
    del_manifest_path: Optional[str] = None,
) -> Dict[str, Any]:
    root = _repo_root()
    config_path = config_path or os.path.join(root, "data", "academy", "del2_import_teams.json")
    output_dir = output_dir or os.path.join(root, "frontend", "public", "teams", "del2")
    manifest_path = manifest_path or os.path.join(root, "frontend", "src", "data", "del2TeamLogos.json")
    del_manifest_path = del_manifest_path or os.path.join(root, "frontend", "src", "data", "delTeamLogos.json")

    with open(config_path, "r", encoding="utf-8") as handle:
        teams = json.load(handle)

    del_logos: Dict[str, str] = {}
    if os.path.exists(del_manifest_path):
        with open(del_manifest_path, "r", encoding="utf-8") as handle:
            loaded = json.load(handle)
        if isinstance(loaded, dict):
            del_logos = {str(key): str(value) for key, value in loaded.items() if key and value}

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

        reuse_del = (team.get("reuse_del_logo") or "").strip()
        if reuse_del:
            reused = del_logos.get(reuse_del)
            if reused:
                logos[catalog_id] = reused
                print(f"[DEL2LogoImporter] {catalog_id} reuse {reused}")
            else:
                errors.append(f"{catalog_id}: DEL-Logo {reuse_del} fehlt")
            continue

        direct_url = (team.get("logo_url") or "").strip()
        club_path = (team.get("club_path") or "").strip()
        src = None
        if direct_url:
            src = direct_url
        elif club_path:
            page_url = club_path if club_path.startswith("http") else f"{BASE_URL}{club_path}"
            html_bytes = _fetch(page_url)
            if not html_bytes:
                errors.append(f"{catalog_id}: Clubseite nicht erreichbar")
                continue
            html = html_bytes.decode("utf-8", errors="ignore")
            src = _pick_logo_src(html, name)
            if not src:
                errors.append(f"{catalog_id}: kein Logo auf {club_path}")
                continue
        else:
            errors.append(f"{catalog_id}: kein club_path/logo_url")
            continue

        payload = _fetch(src)
        if not payload:
            errors.append(f"{catalog_id}: Download fehlgeschlagen {src}")
            continue

        ext = os.path.splitext(src.split("?")[0])[1].lower()
        if ext not in {".png", ".jpg", ".jpeg", ".webp", ".svg"}:
            ext = ".png"
        filename = f"{catalog_id}{ext}"
        with open(os.path.join(output_dir, filename), "wb") as handle:
            handle.write(payload)
        logos[catalog_id] = f"/teams/del2/{filename}"
        print(f"[DEL2LogoImporter] {catalog_id} ← {src}")

    with open(manifest_path, "w", encoding="utf-8") as handle:
        json.dump(logos, handle, ensure_ascii=False, indent=2)
        handle.write("\n")

    return {"ok": not errors, "count": len(logos), "logos": logos, "errors": errors}


if __name__ == "__main__":
    result = import_del2_team_logos()
    print(json.dumps({k: result[k] for k in ("ok", "count", "errors")}, ensure_ascii=False, indent=2))
