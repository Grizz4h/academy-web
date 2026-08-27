#!/usr/bin/env python3
"""Read-only cosmetic inventory (Phase 3). No reward/catalog mutations.

Run: python3 frontend/scripts/inventory_cosmetics.py
Writes: docs/architecture/cosmetic-inventory-phase3.md
"""

from __future__ import annotations

import json
import os
import re
from collections import defaultdict
from datetime import date
from pathlib import Path

REPO = Path(__file__).resolve().parents[2]
FRONTEND = REPO / "frontend"
SRC = FRONTEND / "src"
PUBLIC = FRONTEND / "public" / "profile"
REWARDS = REPO / "data" / "academy" / "rewards"
FRAME_CSS = SRC / "components" / "profile" / "AccountPillFrame.module.css"
BACKEND_CFG = REPO / "backend" / "progression" / "config.py"
OUT = REPO / "docs" / "architecture" / "cosmetic-inventory-phase3.md"


def read(path: Path) -> str:
    return path.read_text(encoding="utf-8") if path.exists() else ""


def walk(dir_path: Path, suffix: str | None = None) -> list[Path]:
    if not dir_path.exists():
        return []
    out: list[Path] = []
    for root, _, files in os.walk(dir_path):
        for name in files:
            p = Path(root) / name
            if suffix is None or p.suffix == suffix:
                out.append(p)
    return out


def extract_object_blocks(text: str, start_marker: str) -> list[str]:
    """Extract top-level `{...}` object literals after a marker (best-effort)."""
    idx = text.find(start_marker)
    if idx < 0:
        return []
    # find first '[' after marker
    lb = text.find("[", idx)
    if lb < 0:
        return []
    depth = 0
    objs: list[str] = []
    i = lb
    obj_start = None
    while i < len(text):
        ch = text[i]
        if ch == "[":
            depth += 1
        elif ch == "]":
            depth -= 1
            if depth == 0:
                break
        elif ch == "{" and depth == 1:
            obj_start = i
        elif ch == "}" and depth == 1 and obj_start is not None:
            objs.append(text[obj_start : i + 1])
            obj_start = None
        i += 1
    return objs


def field(obj: str, key: str) -> str | None:
    m = re.search(rf"{key}\s*:\s*'([^']+)'", obj)
    if m:
        return m.group(1)
    m = re.search(rf'{key}\s*:\s*"([^"]+)"', obj)
    if m:
        return m.group(1)
    return None


def parse_mastery_coin_ids() -> dict[str, str]:
    text = read(SRC / "features/progression/mastery/masteryCatalog.ts")
    out: dict[str, str] = {}
    block = re.search(r"MASTERY_COIN_IDS\s*=\s*\{([\s\S]*?)\}", text)
    if not block:
        return out
    for m in re.finditer(r"(\w+)\s*:\s*'([^']+)'", block.group(1)):
        out[m.group(1)] = m.group(2)
    return out


def expand_coin_refs(text: str, coin_map: dict[str, str]) -> str:
    def repl(m: re.Match[str]) -> str:
        key = m.group(1)
        if key not in coin_map:
            return m.group(0)
        return f"cosmeticId: '{coin_map[key]}'"

    return re.sub(r"cosmeticId:\s*MASTERY_COIN_IDS\.(\w+)", repl, text)


def parse_catalog_cosmetics() -> dict[str, dict]:
    """Parse COSMETIC definitions from catalog + phase2 + puck/stick files."""
    coin_map = parse_mastery_coin_ids()
    files = [
        SRC / "features/progression/cosmetics/cosmeticCatalog.ts",
        SRC / "features/progression/cosmetics/phase2Cosmetics.ts",
        SRC / "features/progression/cosmetics/puckSkins.ts",
        SRC / "features/progression/cosmetics/stickSkins.ts",
    ]
    items: dict[str, dict] = {}
    for path in files:
        text = expand_coin_refs(read(path), coin_map)
        # Resolve id: MASTERY_COIN_IDS.x
    for path in files:
        text = expand_coin_refs(read(path), coin_map)
        # Resolve id: MASTERY_COIN_IDS.x
        text = re.sub(
            r"id:\s*MASTERY_COIN_IDS\.(\w+)",
            lambda m: f"id: '{coin_map.get(m.group(1), m.group(0))}'",
            text,
        )
        text = re.sub(r"id:\s*PUCK_MODEL_CLASSIC_ID", "id: 'puck_model_classic'", text)
        text = re.sub(r"id:\s*STICK_MODEL_COMPOSITE_ID", "id: 'stick_model_composite'", text)
        # Match objects that look like cosmetic defs with id + type
        for m in re.finditer(
            r"\{\s*id:\s*'([^']+)'\s*,\s*type:\s*'([^']+)'([\s\S]*?)\n\s*\}",
            text,
        ):
            cid, ctype, body = m.group(1), m.group(2), m.group(3)
            # Skip skin registry entries that are not cosmetics (id: classic without type puckSkin etc. already filtered by type)
            name_m = re.search(r"name:\s*'((?:\\'|[^'])*)'", body)
            rarity_m = re.search(r"rarity:\s*'([^']+)'", body)
            coll_m = re.search(r"collectionId:\s*'([^']+)'", body)
            asset_m = re.search(r"assetId:\s*'([^']+)'", body)
            origin_m = re.search(r"origin:\s*\{\s*type:\s*'([^']+)'", body)
            superseded = re.search(r"supersededBy:\s*'([^']+)'", body)
            preview = "previewOnly: true" in body or "previewOnly:true" in body
            items[cid] = {
                "id": cid,
                "type": ctype,
                "name": name_m.group(1) if name_m else cid,
                "rarity": rarity_m.group(1) if rarity_m else "–",
                "collectionId": coll_m.group(1) if coll_m else None,
                "assetId": asset_m.group(1) if asset_m else cid,
                "origin": origin_m.group(1) if origin_m else "?",
                "supersededBy": superseded.group(1) if superseded else None,
                "previewOnly": preview,
                "inCatalog": True,
            }
    return items


def parse_profile_catalog(path: Path, default_type: str) -> list[dict]:
    text = read(path)
    rows = []
    for m in re.finditer(
        r"\{\s*id:\s*'([^']+)'\s*,\s*label:\s*'((?:\\'|[^'])*)'([\s\S]*?)\}",
        text,
    ):
        body = m.group(3)
        starter = True
        if re.search(r"starter:\s*false", body):
            starter = False
        src_m = re.search(r"src:\s*'([^']+)'", body)
        rows.append(
            {
                "id": m.group(1),
                "label": m.group(2),
                "type": default_type,
                "starter": starter,
                "src": src_m.group(1) if src_m else None,
            }
        )
    return rows


def parse_title_catalog() -> list[dict]:
    text = read(SRC / "data/profile/profileTitleCatalog.ts")
    rows = []
    for m in re.finditer(r"\{\s*id:\s*'([^']+)'\s*,\s*label:\s*'((?:\\'|[^'])*)'", text):
        rows.append({"id": f"title_catalog_{m.group(1)}", "label": m.group(2), "raw": m.group(1)})
    return rows


def parse_tagline_presets() -> list[dict]:
    text = read(SRC / "features/progression/cosmetics/cosmeticCatalog.ts")
    rows = []
    block = re.search(r"TAGLINE_PRESETS[\s\S]*?=\s*\[([\s\S]*?)\]", text)
    if not block:
        return rows
    for m in re.finditer(r"id:\s*'([^']+)'\s*,\s*text:\s*'((?:\\'|[^'])*)'", block.group(1)):
        rows.append({"id": m.group(1), "text": m.group(2)})
    return rows


def collect_grants() -> dict[str, set[str]]:
    grants: dict[str, set[str]] = defaultdict(set)
    coin_map = parse_mastery_coin_ids()

    def add_from_file(path: Path, prefix: str) -> None:
        text = expand_coin_refs(read(path), coin_map)
        for m in re.finditer(r"cosmeticId:\s*'([^']+)'", text):
            cid = m.group(1)
            start = max(0, m.start() - 800)
            window = text[start : m.start()]
            ids = re.findall(r"\bid:\s*'([^']+)'", window)
            entity = ids[-1] if ids else "?"
            level = re.findall(r"\blevel:\s*(\d+)", window)
            if prefix == "level" and level:
                grants[cid].add(f"level:{level[-1]}")
            elif prefix == "shop":
                grants[cid].add(f"shop:{entity}")
            else:
                grants[cid].add(f"{prefix}:{entity}")

    add_from_file(SRC / "features/progression/levelSystem.ts", "level")
    add_from_file(SRC / "features/progression/achievements/achievementCatalog.ts", "achievement")
    add_from_file(SRC / "features/progression/achievements/phase2Achievements.ts", "achievement")
    add_from_file(SRC / "features/progression/mastery/masteryCatalog.ts", "mastery")
    add_from_file(SRC / "content/challenges/mvpChallenges.ts", "challenge")
    add_from_file(SRC / "features/progression/shop/shopCatalog.ts", "shop")

    # Collections: members + completion
    coll_text = read(SRC / "features/progression/collections/collectionCatalog.ts")
    for block in extract_object_blocks(coll_text, "COLLECTIONS"):
        cid = field(block, "id")
        if not cid:
            continue
        items = re.findall(r"itemIds:\s*\[([^\]]*)\]", block)
        if items:
            for item_id in re.findall(r"'([^']+)'", items[0]):
                grants[item_id].add(f"collection_member:{cid}")
        for cos in re.findall(r"cosmeticId:\s*'([^']+)'", block):
            grants[cos].add(f"collection_complete:{cid}")

    # Backend
    cfg = read(BACKEND_CFG)
    m = re.search(r'TRACK0_BUNDLE_COSMETIC_ID\s*=\s*"([^"]+)"', cfg)
    if m:
        grants[m.group(1)].add("backend:track0_bundle")
    m = re.search(r'FULL_GAME_BONUS_COSMETIC_ID\s*=\s*"([^"]+)"', cfg)
    if m:
        grants[m.group(1)].add("backend:full_game_bonus")
    early = re.search(r"EARLY_SLOT_COSMETICS[\s\S]*?\{([\s\S]*?)\}", cfg)
    if early:
        for em in re.finditer(r'(\d+)\s*:\s*"([^"]+)"', early.group(1)):
            grants[em.group(2)].add(f"backend:early_slot:{em.group(1)}")

    return grants


def shop_prices() -> dict[str, int]:
    text = read(SRC / "features/progression/shop/shopCatalog.ts")
    prices: dict[str, int] = {}
    for m in re.finditer(r"cosmeticId:\s*'([^']+)'\s*,\s*pricePux:\s*(\d+)", text):
        prices[m.group(1)] = int(m.group(2))
    return prices


def public_assets() -> set[str]:
    names: set[str] = set()
    for p in walk(PUBLIC):
        names.add(p.stem)
    return names


def frame_css_ids() -> set[str]:
    text = read(FRAME_CSS)
    return set(re.findall(r"data-frame='(frame_[^']+)'", text))


def scan_observed() -> tuple[dict[str, int], dict[str, int], dict[str, int], int]:
    by_id: dict[str, int] = defaultdict(int)
    source_types: dict[str, int] = defaultdict(int)
    earn_kinds: dict[str, int] = defaultdict(int)
    files = 0
    for path in walk(REWARDS, ".json"):
        files += 1
        try:
            doc = json.loads(path.read_text(encoding="utf-8"))
        except Exception:
            continue
        unlocks = doc.get("unlockedCosmetics") or {}
        if not isinstance(unlocks, dict):
            continue
        for cid, entry in unlocks.items():
            by_id[cid] += 1
            if isinstance(entry, dict):
                source_types[entry.get("sourceType") or "(none)"] += 1
                earn_kinds[entry.get("earnKind") or "(none)"] += 1
            else:
                source_types["(none)"] += 1
                earn_kinds["(none)"] += 1
    return dict(by_id), dict(source_types), dict(earn_kinds), files


def asset_status(row: dict, assets: set[str], frames: set[str]) -> str:
    t = row["type"]
    if t in ("title", "tagline"):
        return "text-only"
    if t == "frame":
        return "CSS-only" if row["id"] in frames else "fehlt (kein Frame-CSS)"
    if t in ("stick", "puck", "puckModel", "puckSkin", "stickModel", "stickSkin"):
        if row.get("supersededBy"):
            return f"superseded→{row['supersededBy']}"
        if row.get("previewOnly"):
            return "React/PoC (previewOnly)"
        return "3D/PoC"
    aid = row.get("assetId") or row["id"]
    if aid in assets or row["id"] in assets:
        return "vorhanden"
    return "fehlt"


def build_rows() -> tuple[list[dict], dict, dict, dict, int, list[str]]:
    cosmetics = parse_catalog_cosmetics()
    # Ensure starters from profile catalogs
    for p, t in [
        (SRC / "data/profile/avatarCatalog.ts", "avatar"),
        (SRC / "data/profile/bannerCatalog.ts", "banner"),
        (SRC / "data/profile/emblemCatalog.ts", "emblem"),
    ]:
        for a in parse_profile_catalog(p, t):
            if a["starter"] and a["id"] not in cosmetics:
                cosmetics[a["id"]] = {
                    "id": a["id"],
                    "type": t,
                    "name": a["label"],
                    "rarity": "common",
                    "collectionId": None,
                    "assetId": a["id"],
                    "origin": "starter",
                    "inCatalog": True,
                }
            elif a["starter"] and a["id"] in cosmetics:
                cosmetics[a["id"]]["origin"] = "starter"

    for t in parse_title_catalog():
        if t["id"] not in cosmetics:
            cosmetics[t["id"]] = {
                "id": t["id"],
                "type": "title",
                "name": t["label"],
                "rarity": "common",
                "collectionId": None,
                "assetId": t["raw"],
                "origin": "starter",
                "inCatalog": True,
            }

    for tg in parse_tagline_presets():
        if tg["id"] not in cosmetics:
            cosmetics[tg["id"]] = {
                "id": tg["id"],
                "type": "tagline",
                "name": tg["text"],
                "rarity": "common",
                "collectionId": None,
                "assetId": tg["id"],
                "origin": "starter" if tg["id"] == "tagline_starter" else "achievement",
                "inCatalog": True,
            }

    grants = collect_grants()
    prices = shop_prices()
    assets = public_assets()
    frames = frame_css_ids()
    observed, source_types, earn_kinds, files = scan_observed()

    # Mark starters in grants
    for cid, row in cosmetics.items():
        if row.get("origin") == "starter":
            grants[cid].add("starter")

    extras: dict[str, dict] = {}
    for p, t in [
        (SRC / "data/profile/avatarCatalog.ts", "avatar"),
        (SRC / "data/profile/bannerCatalog.ts", "banner"),
        (SRC / "data/profile/emblemCatalog.ts", "emblem"),
        (SRC / "data/profile/stickerCatalog.ts", "sticker"),
        (SRC / "data/profile/coinCatalog.ts", "masteryCoin"),
    ]:
        for a in parse_profile_catalog(p, t):
            if a["id"] not in cosmetics:
                extras[a["id"]] = {
                    "id": a["id"],
                    "type": t,
                    "name": a["label"],
                    "rarity": "–",
                    "collectionId": None,
                    "assetId": a["id"],
                    "origin": "profile_only",
                    "inCatalog": False,
                    "src": a.get("src"),
                }

    rows: list[dict] = []
    all_ids = set(cosmetics) | set(extras) | set(observed) | set(grants)

    for cid in sorted(all_ids):
        base = cosmetics.get(cid) or extras.get(cid) or {
            "id": cid,
            "type": "?",
            "name": "(nur Unlock/Grant)",
            "rarity": "–",
            "collectionId": None,
            "assetId": cid,
            "origin": "?",
            "inCatalog": False,
        }
        sources = sorted(grants.get(cid, set()))
        # soft origin evidence
        if not sources and base.get("origin") and base["origin"] not in ("?", "profile_only"):
            sources = [f"origin:{base['origin']}"]

        shop = f"ja ({prices[cid]} PUX)" if cid in prices else "nein"
        coll = base.get("collectionId") or "–"
        # collection from grants
        coll_hits = [s.split(":", 1)[1] for s in sources if s.startswith("collection_")]
        if coll == "–" and coll_hits:
            coll = ", ".join(sorted(set(coll_hits)))

        asset = asset_status(base, assets, frames)
        if not base.get("inCatalog") and base.get("src") and asset == "fehlt":
            asset = "profile-src" if (PUBLIC / Path(base["src"]).name).exists() or (cid in assets) else asset
        if cid in assets and asset.startswith("fehlt"):
            asset = "vorhanden"

        ownable = bool(sources) or base.get("origin") == "starter" or cid in observed
        problems: list[str] = []
        grant_like = [
            s
            for s in sources
            if not s.startswith("origin:") and not s.startswith("collection_member:")
        ]
        prestige = any(
            s.startswith(p)
            for s in grant_like
            for p in (
                "achievement:",
                "mastery:",
                "level:",
                "backend:early_slot",
                "backend:track0",
                "backend:full_game",
                "collection_complete:",
                "challenge:",
            )
        )
        in_shop = any(s.startswith("shop:") for s in grant_like)
        if base.get("inCatalog") and not grant_like and "starter" not in sources:
            problems.append("definiert, kein Grant-Pfad")
        if any(s.endswith("(no listing)") or s == "origin:pux_shop" for s in sources) and not in_shop:
            if base.get("origin") == "pux_shop" or "origin:pux_shop" in sources:
                problems.append("Shop-Origin ohne Listing")
        if asset.startswith("fehlt"):
            problems.append("Asset fehlt")
        if prestige and in_shop:
            problems.append("Dual path: Prestige/Progression + Shop")
        if not base.get("inCatalog"):
            problems.append("außerhalb COSMETIC_CATALOG")
        if cid == "coin_offensive_zone":
            problems.append("kein C3-Mastery-Grant")
        if cid in observed and not base.get("inCatalog"):
            problems.append("Nutzer besitzt ID, Locker-Katalog kennt sie nicht")
        if base.get("name") == "(nur Unlock/Grant)":
            problems.append("Unlock/Grant ohne Katalog-Eintrag")

        # Detect shop-origin without listing via catalog origin
        if base.get("inCatalog") and base.get("origin") == "pux_shop" and not in_shop:
            if "Shop-Origin ohne Listing" not in problems:
                problems.append("Shop-Origin ohne Listing")

        rows.append(
            {
                "id": cid,
                "type": base["type"],
                "name": base["name"],
                "rarity": base.get("rarity") or "–",
                "asset": asset,
                "sources": sources,
                "shop": shop,
                "collection": coll,
                "ownable": ownable,
                "problems": problems,
                "inCatalog": bool(base.get("inCatalog")),
                "observed": observed.get(cid, 0),
            }
        )

    # orphan assets
    referenced = set()
    for r in rows:
        referenced.add(r["id"])
    for a in parse_profile_catalog(SRC / "data/profile/avatarCatalog.ts", "avatar"):
        referenced.add(a["id"])
    for a in parse_profile_catalog(SRC / "data/profile/bannerCatalog.ts", "banner"):
        referenced.add(a["id"])
    for a in parse_profile_catalog(SRC / "data/profile/emblemCatalog.ts", "emblem"):
        referenced.add(a["id"])
    for a in parse_profile_catalog(SRC / "data/profile/stickerCatalog.ts", "sticker"):
        referenced.add(a["id"])
    for a in parse_profile_catalog(SRC / "data/profile/coinCatalog.ts", "masteryCoin"):
        referenced.add(a["id"])
    orphan_assets = sorted(assets - referenced)

    return rows, source_types, earn_kinds, observed, files, orphan_assets


def esc(s: str) -> str:
    return s.replace("|", "\\|").replace("\n", " ")


def main() -> None:
    rows, source_types, earn_kinds, observed, files, orphan_assets = build_rows()
    catalog_n = sum(1 for r in rows if r["inCatalog"])
    extra_n = sum(1 for r in rows if not r["inCatalog"])
    problem_n = sum(1 for r in rows if r["problems"])
    shop_n = len(shop_prices())
    today = date.today().isoformat()

    table_lines = [
        "| ID | Typ | Asset | Seltenheit | Quellen (Ist) | Shop | Collection | Besitz möglich | Observed | Probleme |",
        "|---|---|---|---|---|---|---|---|---:|---|",
    ]
    for r in rows:
        sources = ", ".join(r["sources"]) if r["sources"] else "–"
        problems = "; ".join(r["problems"]) if r["problems"] else "–"
        table_lines.append(
            f"| `{r['id']}` | {r['type']} | {esc(r['asset'])} | {r['rarity']} | {esc(sources)} | {esc(r['shop'])} | {esc(r['collection'])} | {'ja' if r['ownable'] else 'nein'} | {r['observed']} | {esc(problems)} |"
        )

    by_problem: dict[str, list[str]] = defaultdict(list)
    for r in rows:
        for p in r["problems"]:
            by_problem[p].append(r["id"])

    problem_sections = []
    for problem in sorted(by_problem):
        ids = "\n".join(f"- `{i}`" for i in by_problem[problem])
        problem_sections.append(f"### {problem}\n\n{ids}\n")
    if orphan_assets:
        problem_sections.append(
            "### Asset vorhanden, kein Katalog-/Profile-Bezug\n\n"
            + "\n".join(f"- `{a}`" for a in orphan_assets)
            + "\n"
        )

    st_lines = "\n".join(f"- `{k}`: {v}" for k, v in sorted(source_types.items(), key=lambda x: -x[1])) or "_kein Scan / leer_"
    ek_lines = "\n".join(f"- `{k}`: {v}" for k, v in sorted(earn_kinds.items(), key=lambda x: -x[1])) or "_kein Scan / leer_"
    top_obs = sorted(observed.items(), key=lambda x: -x[1])[:40]
    top_lines = "\n".join(f"- `{i}`: {n}" for i, n in top_obs) or "_keine_"

    doc = f"""# Cosmetic-Inventar — Phase 3

> Stand: {today}. **Read-only Inventar** aus Code, Assets und lokalem Reward-State.  
> **Keine Rewiring-, Alias-Apply- oder Besitz-Migration in diesem Dokument.**  
> Nächster Schritt: fachliche Sortierung + Migrationsmatrix im Review — kein Rewire ohne Freigabe.

Verwandt: [progression-inventory-phase3.md](./progression-inventory-phase3.md) (Progression summarisch), [rewards-content.md](../rewards-content.md) (Ops).

Generator: `python3 frontend/scripts/inventory_cosmetics.py` (nur lesen + dieses Doc schreiben).

---

## Soll-Architektur (noch nicht implementiert)

Vier Dinge sauber trennen:

```mermaid
flowchart TD
  A["Cosmetic-Katalog<br/>Was ist das?"] --> D["Nutzer-Inventar"]
  B["Reward-Regeln<br/>Wofür bekommt man es?"] --> D
  C["Shop-Angebote<br/>Wo kann man es kaufen?"] --> D
  D --> E["Locker<br/>Was besitzt der Nutzer?"]
```

Heute sind Katalog-Origin, Shop-Listing und Grant-Pfade oft **vermischt** (z. B. Early-Slot + Shop auf derselben ID).

---

## Quellenverzeichnis (belegt)

| Quelle | Pfad |
|--------|------|
| Master-Katalog | `frontend/src/features/progression/cosmetics/cosmeticCatalog.ts` |
| Phase-2 Cosmetics | `…/cosmetics/phase2Cosmetics.ts` |
| Puck/Stick PoC | `…/cosmetics/puckSkins.ts`, `stickSkins.ts` |
| Profile-Pools | `frontend/src/data/profile/{{avatar,banner,emblem,sticker,coin,profileTitle}}Catalog.ts` |
| Shop | `frontend/src/features/progression/shop/shopCatalog.ts` |
| Level | `frontend/src/features/progression/levelSystem.ts` |
| Achievements | `…/achievements/achievementCatalog.ts`, `phase2Achievements.ts` |
| Mastery | `…/mastery/masteryCatalog.ts` |
| Challenges | `frontend/src/content/challenges/mvpChallenges.ts` |
| Collections | `…/collections/collectionCatalog.ts` |
| Backend Slots | `backend/progression/config.py` (`EARLY_SLOT_*`, `TRACK0_*`, `FULL_GAME_*`) |
| Assets | `frontend/public/profile/**` |
| Frame-Look | `frontend/src/components/profile/AccountPillFrame.module.css` |
| Generator | `frontend/scripts/inventory_cosmetics.py` |

---

## Kennzahlen

| Metrik | Wert |
|--------|-----:|
| Katalog-IDs (geparst) | {catalog_n} |
| Extra-IDs (Profile/Unlock außerhalb Katalog) | {extra_n} |
| Zeilen mit ≥1 Problem | {problem_n} |
| Shop-Listings (Preis-Map) | {shop_n} |
| Reward-JSON-Dateien gescannt | {files} |
| Unique observed Unlock-IDs | {len(observed)} |

---

## Vollständige Inventar-Tabelle

Spalten **visuelle Intensität / Prestige / Verfügbarkeit / Qualität / Set** bewusst **nicht** vorbefüllt (TBD für Review).

{chr(10).join(table_lines)}

---

## Fehlerreport

{chr(10).join(problem_sections)}

### Weitere bekannte Drift

- Backend schreibt `earnKind: "earned"` (Track0 / Early / Full-Game); Frontend-`CosmeticUnlock.earnKind`-Union kennt `earned` nicht → Typ-Drift.
- `metadata.cssClass` (`frame-basic` …) ungenutzt; Frame-Look über `data-frame='frame_*'`.
- Text-Resolve-Aliases in `textLooks.ts` (Match über `text` / `profileTitleId` / `title_catalog_${{raw}}`) — **keine** feste Alias-Map.

---

## Alias-Stub (nicht anwenden)

Nur bekannte Soft-Mappings — **keine Migration ausgeführt**.

| Legacy / Alt | Vorgeschlagene kanonische ID | Hinweis |
|---|---|---|
| `puck_model_standard_01` | `puck_model_classic` | `metadata.supersededBy` in phase2Cosmetics |
| Profile-Title-Slug / Label-String | `title_catalog_*` oder Reward-Title-ID | `resolveTextCosmetic` Prefer Starter |
| *(weitere)* | TBD | Nach Review |

Regeln für spätere Migration (Freeze):

- eine dauerhafte kanonische ID pro Cosmetic
- alte IDs bleiben als Alias lesbar
- Migration idempotent; Besitz nie entziehen
- doppelte alte Unlocks → ein Item
- neue Grants nur kanonische ID

---

## Klassifikation (TBD — Review)

Jedes Item später unabhängig von der Ist-Quelle bewerten:

| Achse | Status |
|---|---|
| Kategorie | Ist-Spalte `Typ` (aus Katalog) |
| Seltenheit | Ist-Spalte; **fachlich nicht korrigiert** |
| visuelle Intensität 1–5 | TBD |
| Prestige | TBD |
| Verfügbarkeit | TBD |
| Qualität (releasefähig / überarbeiten / entfernen) | TBD |
| Set | TBD (Collection-Spalte nur Ist-Bezug) |

---

## Reward-Slots (Grundprogression) — leer

Keine Zuweisung in diesem Auftrag. Wenn nichts Passendes existiert → Artwork-Lücke markieren, nicht degradieren.

| Slot | gewünschte Klasse | konkretes Item |
|---|---|---|
| Onboarding / Starter | Starter/Common | TBD |
| 2 valide Units | Common | TBD (heute Backend: `title_shop_quiet_observer` — Dual Shop) |
| 4 Units | Common | TBD (heute: `title_shop_glass_leaner` — Dual Shop) |
| 8–12 Units | starkes Common/Uncommon | TBD (heute 10: `emblem_shop_simple_crest` — Dual Shop) |
| Kapitel-Meilenstein | Uncommon/Rare | TBD |
| langfristig | einfaches Epic | TBD |

---

## Appendix: Observed Unlock-IDs (anonym)

Scan: `data/academy/rewards/*.json` — nur Häufigkeiten, keine Usernamen.

### sourceType Frequenzen

{st_lines}

### earnKind Frequenzen

{ek_lines}

### Top observed IDs

{top_lines}

---

## Abnahme (dieses Inventar)

- [x] Katalog- und Extra-IDs gelistet
- [x] Quellen belegt (Code-Pfade oben)
- [x] Fehlerreport generiert
- [x] Anonymer Unlock-Scan (falls Reward-JSON vorhanden)
- [x] Kein Rewire / kein Alias-Apply / kein Besitz geschrieben

**Freeze:** Nächster Schritt = fachliche Sortierung + Migrationsmatrix hier im Chat.
"""

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(doc, encoding="utf-8")
    print(f"Wrote {OUT}")
    print(f"catalog={catalog_n} extras={extra_n} problems={problem_n} observed_files={files}")


if __name__ == "__main__":
    main()
