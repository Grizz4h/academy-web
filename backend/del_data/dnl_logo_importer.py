"""Download U20 DNL logos — reuse DEL/DEL2 crests where clubs share identity,
otherwise pull hockeydata team-logo URLs discovered by the schedule importer.
"""

from __future__ import annotations

import json
import os
from typing import Any, Dict, List, Optional
from urllib.request import Request, urlopen

_USER_AGENT = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
)

# Parent-club crest reuse (U20 shares identity with DEL / DEL2 club).
_REUSE = {
    "erc_ingolstadt": "/teams/del/erc_ingolstadt.png",
    "augsburger_ev": "/teams/del/augsburger_panther.svg",
    "eisbaren_juniors_berlin": "/teams/del/eisbaren_berlin.png",
    "iserlohner_ec": "/teams/del/iserlohn_roosters.svg",
    "kolner_junghaie": "/teams/del/kolner_haie.svg",
    "jungadler_mannheim": "/teams/del/adler_mannheim.svg",
    "schwenninger_erc": "/teams/del/schwenninger_wild_wings.svg",
    "krefelder_ev_81": "/teams/del/krefeld_pinguine.png",
    "esc_dresden": "/teams/del2/eislowen_dresden.png",
    "ev_landshut": "/teams/del2/ev_landshut.png",
    "dusseldorfer_eg": "/teams/del2/dusseldorfer_eg.png",
    "sc_bietigheim_bissingen": "/teams/del2/bietigheim_steelers.png",
    "esv_kaufbeuren": "/teams/del2/esv_kaufbeuren.png",
    "starbulls_rosenheim": "/teams/del2/starbulls_rosenheim.png",
    "jung_eisbaren_regensburg": "/teams/del2/eisbaren_regensburg.png",
    "ehc_freiburg": "/teams/del2/ehc_freiburg.png",
    "ecdc_memmingen": "/teams/del2/ecdc_memmingen.png",
    "ravensburg_towerstars": "/teams/del2/ravensburg_towerstars.png",
    "ev_ravensburg": "/teams/del2/ravensburg_towerstars.png",
    "ec_bad_nauheim": "/teams/del2/ec_bad_nauheim.png",
    "rt_bad_nauheim": "/teams/del2/ec_bad_nauheim.png",
    "blue_devils_weiden": "/teams/del2/blue_devils_weiden.png",
    "1_ev_weiden": "/teams/del2/blue_devils_weiden.png",
    "fischtown_pinguins": "/teams/del/fischtown_pinguins.svg",
    "rev_bremerhaven": "/teams/del/fischtown_pinguins.svg",
    "grizzlys_wolfsburg": "/teams/del/grizzlys_wolfsburg.svg",
    "ehc_grizzly_adams_wolfsburg": "/teams/del/grizzlys_wolfsburg.svg",
    "lowen_frankfurt": "/teams/del/lowen_frankfurt.svg",
    "red_bull_munchen": "/teams/del/red_bull_munchen.svg",
    "rookie_bulls_munchen": "/teams/del/red_bull_munchen.svg",
}


def _repo_root() -> str:
    return os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))


def _fetch(url: str) -> Optional[bytes]:
    try:
        request = Request(
            url,
            headers={"User-Agent": _USER_AGENT, "Referer": "https://deb-online.live/"},
        )
        with urlopen(request, timeout=25) as response:
            return response.read()
    except Exception as exc:
        print(f"[DnlLogoImporter] fetch failed {url}: {exc}")
        return None


def import_dnl_team_logos(
    *,
    logo_hints: Optional[Dict[str, str]] = None,
    output_dir: Optional[str] = None,
    manifest_path: Optional[str] = None,
) -> Dict[str, Any]:
    root = _repo_root()
    output_dir = output_dir or os.path.join(root, "frontend", "public", "teams", "u20_dnl")
    manifest_path = manifest_path or os.path.join(root, "frontend", "src", "data", "u20DnlTeamLogos.json")
    hints_path = os.path.join(root, "data", "academy", "u20_dnl_logo_hints.json")
    os.makedirs(output_dir, exist_ok=True)

    if logo_hints is None and os.path.exists(hints_path):
        with open(hints_path, "r", encoding="utf-8") as handle:
            logo_hints = json.load(handle)
    logo_hints = logo_hints or {}

    logos: Dict[str, str] = {}
    errors: List[str] = []

    catalog_ids = sorted(set(_REUSE) | set(logo_hints))
    for catalog_id in catalog_ids:
        reuse = _REUSE.get(catalog_id)
        if reuse:
            logos[catalog_id] = reuse
            print(f"[DnlLogoImporter] {catalog_id} reuse {reuse}")
            continue
        src = (logo_hints.get(catalog_id) or "").replace("net//", "net/")
        if not src:
            errors.append(f"{catalog_id}: kein Logo")
            continue
        payload = _fetch(src)
        if not payload or len(payload) < 50:
            errors.append(f"{catalog_id}: Download fehlgeschlagen ({src})")
            continue
        ext = ".png"
        if payload[:8] == b"\x89PNG\r\n\x1a\n":
            ext = ".png"
        elif b"<svg" in payload[:200].lower():
            ext = ".svg"
        elif payload[:2] == b"\xff\xd8":
            ext = ".jpg"
        filename = f"{catalog_id}{ext}"
        with open(os.path.join(output_dir, filename), "wb") as handle:
            handle.write(payload)
        logos[catalog_id] = f"/teams/u20_dnl/{filename}"
        print(f"[DnlLogoImporter] {catalog_id} ← {src}")

    with open(manifest_path, "w", encoding="utf-8") as handle:
        json.dump(logos, handle, ensure_ascii=False, indent=2)
        handle.write("\n")

    return {"ok": not errors, "count": len(logos), "logos": logos, "errors": errors}


if __name__ == "__main__":
    result = import_dnl_team_logos()
    print(result["ok"], result["count"], result.get("errors"))
