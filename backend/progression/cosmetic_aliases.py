"""Canonical cosmetic ID aliases (Grundprogression Phase 3 rewire).

Ist shop_* IDs remain readable; grants and unlock keys use canonical IDs.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict, Optional

MIGRATION_ID = "cosmetic_migration_phase3_grundprogression_v1"

# Alias (Ist) → canonical
CANONICAL_BY_ALIAS: Dict[str, str] = {
    "frame_shop_basic": "frame_basic",
    "banner_shop_soft_ice": "banner_soft_ice",
    "frame_shop_rare_trim": "frame_rare_trim",
}

_aliases_acc: Dict[str, set[str]] = {}
for _alias, _canon in CANONICAL_BY_ALIAS.items():
    _aliases_acc.setdefault(_canon, set()).add(_alias)
ALIASES_BY_CANONICAL: Dict[str, frozenset[str]] = {
    k: frozenset(v) for k, v in _aliases_acc.items()
}


def canonical_cosmetic_id(cosmetic_id: Optional[str]) -> Optional[str]:
    if not cosmetic_id:
        return cosmetic_id
    return CANONICAL_BY_ALIAS.get(cosmetic_id, cosmetic_id)


def alias_ids_for(cosmetic_id: Optional[str]) -> frozenset[str]:
    """All IDs that represent the same cosmetic (canonical + aliases)."""
    if not cosmetic_id:
        return frozenset()
    canon = canonical_cosmetic_id(cosmetic_id) or cosmetic_id
    aliases = ALIASES_BY_CANONICAL.get(canon, frozenset())
    return frozenset({canon, *aliases})


def owns_cosmetic(state: Dict[str, Any], cosmetic_id: Optional[str]) -> bool:
    if not cosmetic_id:
        return False
    unlocked = state.get("unlockedCosmetics") or {}
    if not isinstance(unlocked, dict):
        return False
    for cid in alias_ids_for(cosmetic_id):
        if cid in unlocked:
            return True
    return False


def _min_unlocked_at(a: Any, b: Any) -> Any:
    if not a:
        return b
    if not b:
        return a
    return a if str(a) <= str(b) else b


def merge_alias_unlocks(state: Dict[str, Any]) -> bool:
    """Normalize unlock map to canonical keys (M2). Idempotent via migration marker.

    Returns True if state changed.
    """
    if state.get("cosmeticMigrationPhase3Id") == MIGRATION_ID and state.get(
        "cosmeticMigrationPhase3CompletedAt"
    ):
        # Still heal any stray alias keys without rewriting marker.
        return _merge_alias_keys(state)

    changed = _merge_alias_keys(state)
    now = datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")
    if state.get("cosmeticMigrationPhase3Id") != MIGRATION_ID:
        state["cosmeticMigrationPhase3Id"] = MIGRATION_ID
        changed = True
    if not state.get("cosmeticMigrationPhase3CompletedAt"):
        state["cosmeticMigrationPhase3CompletedAt"] = now
        changed = True
    return changed


def _merge_alias_keys(state: Dict[str, Any]) -> bool:
    unlocked = state.get("unlockedCosmetics")
    if not isinstance(unlocked, dict) or not unlocked:
        return False

    changed = False
    for alias, canon in CANONICAL_BY_ALIAS.items():
        alias_entry = unlocked.get(alias)
        canon_entry = unlocked.get(canon)
        if alias_entry is None and canon_entry is None:
            continue
        if alias_entry is not None and canon_entry is None:
            entry = dict(alias_entry) if isinstance(alias_entry, dict) else {"cosmeticId": canon}
            entry["cosmeticId"] = canon
            unlocked[canon] = entry
            del unlocked[alias]
            changed = True
            continue
        if alias_entry is None and canon_entry is not None:
            if isinstance(canon_entry, dict) and canon_entry.get("cosmeticId") != canon:
                canon_entry["cosmeticId"] = canon
                changed = True
            continue
        # Both exist → merge
        a = alias_entry if isinstance(alias_entry, dict) else {}
        c = canon_entry if isinstance(canon_entry, dict) else {}
        merged = {
            **c,
            **{k: v for k, v in a.items() if k not in c or c.get(k) in (None, "")},
            "cosmeticId": canon,
            "unlockedAt": _min_unlocked_at(a.get("unlockedAt"), c.get("unlockedAt")),
        }
        # Prefer earliest unlock; keep source from canonical if present else alias
        if not merged.get("sourceType"):
            merged["sourceType"] = a.get("sourceType") or c.get("sourceType")
        if not merged.get("sourceId"):
            merged["sourceId"] = a.get("sourceId") or c.get("sourceId")
        if a.get("earnKind") and not c.get("earnKind"):
            merged["earnKind"] = a.get("earnKind")
        unlocked[canon] = merged
        del unlocked[alias]
        changed = True

    # Favorites: map alias → canonical, dedupe
    favorites = state.get("favoriteCosmeticIds")
    if isinstance(favorites, list):
        next_fav: list[str] = []
        seen = set()
        for raw in favorites:
            cid = canonical_cosmetic_id(str(raw or "").strip()) or ""
            if not cid or cid in seen:
                if str(raw) != cid:
                    changed = True
                continue
            seen.add(cid)
            if cid != str(raw):
                changed = True
            next_fav.append(cid)
        if next_fav != favorites:
            state["favoriteCosmeticIds"] = next_fav
            changed = True

    return changed


def normalize_profile_equip(profile: Dict[str, Any]) -> bool:
    """Rewrite equipped cosmetic slots from alias → canonical. Returns True if changed."""
    changed = False

    frame_id = profile.get("frameId")
    if isinstance(frame_id, str) and frame_id in CANONICAL_BY_ALIAS:
        profile["frameId"] = CANONICAL_BY_ALIAS[frame_id]
        changed = True

    banner_id = profile.get("bannerId")
    if isinstance(banner_id, str) and banner_id in CANONICAL_BY_ALIAS:
        profile["bannerId"] = CANONICAL_BY_ALIAS[banner_id]
        changed = True

    avatar = profile.get("avatar")
    if isinstance(avatar, dict) and avatar.get("type") == "catalog":
        aid = avatar.get("avatarId")
        if isinstance(aid, str) and aid in CANONICAL_BY_ALIAS:
            avatar["avatarId"] = CANONICAL_BY_ALIAS[aid]
            changed = True

    emblem = profile.get("emblem")
    if isinstance(emblem, dict) and emblem.get("type") == "catalog":
        eid = emblem.get("emblemId")
        if isinstance(eid, str) and eid in CANONICAL_BY_ALIAS:
            emblem["emblemId"] = CANONICAL_BY_ALIAS[eid]
            changed = True

    stickers = profile.get("stickerIds")
    if isinstance(stickers, list):
        next_stickers = []
        stickers_changed = False
        for sid in stickers:
            canon = canonical_cosmetic_id(sid) if isinstance(sid, str) else sid
            if canon != sid:
                stickers_changed = True
            next_stickers.append(canon)
        if stickers_changed:
            profile["stickerIds"] = next_stickers
            changed = True

    return changed
