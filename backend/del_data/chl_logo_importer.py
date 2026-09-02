"""Download CHL team logos from Cloudinary (official chl.hockey asset pipeline)."""

from __future__ import annotations

import json
import os
from typing import Any, Dict, List, Optional, Tuple
from urllib.request import Request, urlopen

from .chl_schedule_importer import (
    _BASE,
    _SEASON_FEED_HINTS,
    _fetch_json,
    discover_schedule_feeds,
    slug_to_catalog_id,
)

_USER_AGENT = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
)
_CLOUDINARY = "https://res.cloudinary.com/chl-production/image/upload/chl-prod/assets/teams/"

# Catalog teams that already have DEL crests — reuse instead of duplicate files.
_REUSE_DEL = {
    "eisbaren_berlin": "eisbaren_berlin",
    "erc_ingolstadt": "erc_ingolstadt",
    "adler_mannheim": "adler_mannheim",
    "kolner_haie": "kolner_haie",
    "pinguins_bremerhaven": "fischtown_pinguins",
}


def _repo_root() -> str:
    return os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))


def _fetch(url: str) -> Optional[bytes]:
    try:
        request = Request(url, headers={"User-Agent": _USER_AGENT})
        with urlopen(request, timeout=25) as response:
            return response.read()
    except Exception as exc:
        print(f"[CHLLogoImporter] fetch failed {url}: {exc}")
        return None


def _collect_team_external_ids(seasons: Optional[List[str]] = None) -> Dict[str, Tuple[str, str]]:
    """catalog_id → (external_id, display_name) from schedule feeds."""
    feeds = discover_schedule_feeds()
    wanted = seasons or list(_SEASON_FEED_HINTS.keys())
    mapping: Dict[str, Tuple[str, str]] = {}
    for season in wanted:
        feed = feeds.get(season)
        if not feed:
            continue
        payload = _fetch_json(f"{_BASE}/api/s3?q={feed}")
        for match in (payload or {}).get("data") or []:
            teams = match.get("teams") or {}
            for side in ("home", "away"):
                team = teams.get(side) or {}
            name = (team.get("name") or "").strip()
            short = (team.get("shortName") or "").strip()
            if not name or short.upper() == "TBA" or name.upper() == "TBA":
                continue
            external_id = str(team.get("externalId") or "").strip()
            if not name or not external_id or external_id == "80":
                continue
            catalog_id = slug_to_catalog_id(name)
            if "bremerhaven" in catalog_id:
                catalog_id = "pinguins_bremerhaven"
            mapping[catalog_id] = (external_id, name)
    return mapping


def import_chl_team_logos(
    *,
    seasons: Optional[List[str]] = None,
    output_dir: Optional[str] = None,
    manifest_path: Optional[str] = None,
    del_manifest_path: Optional[str] = None,
) -> Dict[str, Any]:
    root = _repo_root()
    output_dir = output_dir or os.path.join(root, "frontend", "public", "teams", "chl")
    manifest_path = manifest_path or os.path.join(root, "frontend", "src", "data", "chlTeamLogos.json")
    del_manifest_path = del_manifest_path or os.path.join(root, "frontend", "src", "data", "delTeamLogos.json")

    del_logos: Dict[str, str] = {}
    if os.path.exists(del_manifest_path):
        with open(del_manifest_path, "r", encoding="utf-8") as handle:
            loaded = json.load(handle)
        if isinstance(loaded, dict):
            del_logos = {str(k): str(v) for k, v in loaded.items() if k and v}

    os.makedirs(output_dir, exist_ok=True)
    logos: Dict[str, str] = {}
    errors: List[str] = []
    teams = _collect_team_external_ids(seasons)

    for catalog_id, (external_id, name) in sorted(teams.items()):
        reuse = _REUSE_DEL.get(catalog_id)
        if reuse and del_logos.get(reuse):
            logos[catalog_id] = del_logos[reuse]
            print(f"[CHLLogoImporter] {catalog_id} reuse {del_logos[reuse]}")
            continue

        src = f"{_CLOUDINARY}{external_id}"
        payload = _fetch(src)
        if not payload or payload[:8] != b"\x89PNG\r\n\x1a\n":
            # Cloudinary sometimes returns JPEG/WebP without extension.
            if not payload or len(payload) < 100:
                errors.append(f"{catalog_id}: Logo fehlt ({name} / {external_id})")
                continue
        ext = ".png"
        if payload[:3] == b"GIF":
            ext = ".gif"
        elif payload[:2] == b"\xff\xd8":
            ext = ".jpg"
        elif payload[:4] == b"RIFF":
            ext = ".webp"

        filename = f"{catalog_id}{ext}"
        with open(os.path.join(output_dir, filename), "wb") as handle:
            handle.write(payload)
        logos[catalog_id] = f"/teams/chl/{filename}"
        print(f"[CHLLogoImporter] {catalog_id} ← {src}")

    with open(manifest_path, "w", encoding="utf-8") as handle:
        json.dump(logos, handle, ensure_ascii=False, indent=2)
        handle.write("\n")

    return {"ok": not errors, "count": len(logos), "logos": logos, "errors": errors}


if __name__ == "__main__":
    result = import_chl_team_logos(seasons=["2025/26", "2026/27"])
    print(json.dumps({k: result[k] for k in ("ok", "count", "errors")}, ensure_ascii=False, indent=2))
