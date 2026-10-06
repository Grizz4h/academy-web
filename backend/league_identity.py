"""Canonical Tank league / competition identity.

Domain/API competition:
    DNL

Age/team context (not a league string):
    U20  — lives in team names, e.g. "ERC Ingolstadt U20"

Internal catalog / filesystem key (may remain):
    U20_DNL
    teams_u20_dnl.json
    data/games/u20_dnl_*.json
    assets/team_logos/u20_dnl/

Consumers must not need this mapping. Query input may still send U20_DNL
during the compatibility window; external responses emit DNL.
"""

from __future__ import annotations

import re
from typing import Any, Dict, Optional

DOMAIN_LEAGUE_DNL = "DNL"
CATALOG_LEAGUE_DNL = "U20_DNL"
LOGO_FOLDER_DNL = "u20_dnl"

_DNL_FOLDED = frozenset({"DNL", "U20DNL", "U20"})


def fold_league_token(value: Optional[str]) -> str:
    return re.sub(r"[^A-Z0-9]+", "", str(value or "").strip().upper())


def is_dnl_league(value: Optional[str]) -> bool:
    return fold_league_token(value) in _DNL_FOLDED


def domain_league(value: Optional[str]) -> str:
    """External/canonical competition id. DNL aliases → DNL; others unchanged (stripped)."""
    text = str(value or "").strip()
    if is_dnl_league(text):
        return DOMAIN_LEAGUE_DNL
    return text


def persist_league(value: Optional[str]) -> Optional[str]:
    """League stored on Scene / session domain fields. New writes persist DNL."""
    text = str(value or "").strip()
    if not text:
        return None
    return domain_league(text)


def catalog_league(value: Optional[str]) -> str:
    """Internal catalog key for team JSON, games files, importer routing."""
    text = str(value or "").strip()
    if is_dnl_league(text):
        return CATALOG_LEAGUE_DNL
    return text


def logo_folder_league(value: Optional[str]) -> str:
    """Filesystem folder under assets/team_logos (lowercase)."""
    if is_dnl_league(value):
        return LOGO_FOLDER_DNL
    return str(value or "").strip().lower()


def leagues_equivalent(left: Optional[str], right: Optional[str]) -> bool:
    a = domain_league(left)
    b = domain_league(right)
    if not a or not b:
        return False
    return a == b or fold_league_token(a) == fold_league_token(b)


def apply_domain_league_fields(payload: Dict[str, Any]) -> Dict[str, Any]:
    """Copy-on-write: expose DNL on league / league_id without touching game ids."""
    out = dict(payload)
    if "league" in out and out.get("league") is not None:
        out["league"] = domain_league(out.get("league")) or out.get("league")
    if "league_id" in out and out.get("league_id") is not None:
        out["league_id"] = domain_league(out.get("league_id")) or out.get("league_id")
    return out
