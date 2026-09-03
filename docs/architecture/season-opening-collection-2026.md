# OPENING FACEOFF 26/27 — Season Opening Collection

> Stand: 2026-09-03 · **Plan only** — noch keine Reward-, Event-, Grant- oder Besitzlogik implementieren.  
> Collection: `OPENING FACEOFF 26/27` · ID: `event_opening_faceoff_2026_27`

## Phase A — Asset-Preview (erledigt 2026-09-03)

- [x] SVGs: sticker / emblem / banner / avatar unter `frontend/public/profile/...`
- [x] Profile-Catalog-Einträge
- [x] `seasonOpeningFaceoff2627.ts` — 7 Cosmetics, `previewOnly`, `visibility: secret`, Achievement-Origins (noch ohne Engine)
- [x] Collection-Stub `event_opening_faceoff_2026_27` (secret, ohne completionRewards)
- [x] Frame CSS `frame_opening_faceoff_2627` + `prefers-reduced-motion`
- [x] `/dev/cosmetics` Showcase-Sektion

**Noch nicht:** Achievement-Catalog, Grants, Shop, Besitz-Unlocks, Server-Evaluator.

---

## Ziel

Erste saisonale Full Collection zum Saisonstart 2026/27: sieben Cluster-1-Cosmetics (SVG/CSS/Text), später über Event-Achievements freischaltbar. Visuell und technisch konsistent mit dem bestehenden Cosmetic-System; Art Direction = Moment unmittelbar vor dem ersten Bully.

**Diese Doku trennt drei Ebenen:**

| Ebene | Inhalt | Status laut Plan |
|-------|--------|------------------|
| **A · Asset-Preview** | Katalog-Einträge, SVGs/CSS/Text, `/dev/cosmetics` Showcase, `previewOnly` | nächster Implementierungsschritt nach Freigabe |
| **B · Event-Definition** | Achievement-IDs, Bedingungen, Zeitfenster, Collection-Metadaten | spezifizieren, noch nicht verdrahten |
| **C · Rewire** | Server-Evaluation, Grants, Idempotenz, Archivierung | später — erfordert Architektur-Lücken schließen |

---

## Geplante Cosmetics

| ID | Typ | Text / Name | Rarity (via Achievement) |
|----|-----|-------------|--------------------------|
| `sticker_opening_faceoff_2627` | sticker | — | Common |
| `tagline_new_season_new_read_2627` | tagline | `Neue Saison. Neuer Blick.` | Common |
| `emblem_opening_faceoff_2627` | emblem | — | Uncommon |
| `banner_opening_faceoff_2627` | banner | — | Uncommon |
| `avatar_opening_faceoff_2627` | avatar | — | Rare |
| `title_season_opener_2627` | title | `Season Opener 26/27` | Rare |
| `frame_opening_faceoff_2627` | frame | — | Epic |

**Explizit ausgeschlossen:** Puck-/Stick-Skins, Masken, sonstige 3D-Items, Mastery Coin. Keine PENNY-/DEL-/Liga-/Sponsor-/Vereinslogos.

### Art Direction (verbindlich für Assets)

- Palette: Midnight `#08131D`, Deep Ice `#102736`, rInQ-Türkis `#5191A2`, Ice White `#EAF7FA`, Arena Amber `#F2A65A`, Mittellinie ~`#B84A52`
- Motive: Bullykreis Draufsicht, Mittellinie, Puck + Schatten, Arena-Lichtkegel, Schlittschuhspuren, Kennzeichnung `26·27`, türkise Akzente
- Kein Merchandise-Look; eigene rInQ-Sprache

### SVG-Regeln

- Keine Rasterbilder, keine externen Ressourcen, keine eingebetteten Fonts
- Gradienten / Masken / ClipPaths: kollisionsfreie IDs — bei **`<img src>`** (empfohlen für Sticker/Emblem/Banner/Avatar) sind Dokument-IDs isoliert; bei **React-inlined SVG** `useId()`-Prefix wie `ScrapPuck` / Wasteland
- Animationen nur mit `prefers-reduced-motion: reduce`-Fallback (Vorbild: `AccountPillFrame.module.css`)
- Alle neuen Cosmetics zunächst `metadata.previewOnly: true`

---

## Geplante Event-Achievements (Ebene B — Definition only)

Collection-Window und Timezone **konfigurierbar** (siehe Lücken). Keine rückwirkende Freischaltung vor Eventstart.

| Achievement-ID | Bedingung (Soll) | Reward | Rarity |
|----------------|------------------|--------|--------|
| `event_2627_puck_drop` | 1 valide Session / Unit im Eventzeitraum | Sticker | Common |
| `event_2627_two_games_in` | valide Sessions in 2 unterschiedlichen `game_id` | Tagline | Common |
| `event_2627_open_toolbox` | 3 unterschiedliche `drill_id` im Zeitraum | Emblem | Uncommon |
| `event_2627_opening_week` | 4 valide Units an ≥ 2 Kalendertagen | Banner | Uncommon |
| `event_2627_full_sixty` | P1+P2+P3 desselben Spiels valide | Avatar + 100 XP | Rare |
| `event_2627_season_underway` | 8 valide Units an ≥ 3 Kalendertagen | Title + 150 XP | Rare |
| `event_2627_collection_complete` | alle sechs vorherigen Event-Achievements | Frame + 50 PUX | Epic · Meta · nicht client-claimbar |

**Leitplanken (Soll):**

- Lesen aus denselben **serverseitig validierten** Progression-Events / Units wie die Grundprogression
- Track 0 zählt nicht
- Derselbe Progression-Unit-Key nur einmal
- Client meldet Handlung; Server entscheidet Achievement + Reward
- Rewards einmalig / idempotent
- Cosmetics: **eine** Primärquelle = jeweiliges Event-Achievement (`origin: { type: 'achievement', achievementId }`)
- Keine Shop-Listings
- Besitz bleibt nach Eventende; Collection wird **archiviert** (UI), Cosmetics bleiben ausrüstbar

---

## Ist-Stand (Codebestand geprüft)

### 1. Cosmetics / Katalog

| Stück | Pfad |
|-------|------|
| Typen | `frontend/src/features/progression/types.ts` → `CosmeticType`, `CosmeticDefinition`, `RewardOrigin` |
| Master | `cosmetics/cosmeticCatalog.ts` |
| Extras | `cosmetics/phase2Cosmetics.ts`, Stick/Puck PoCs |
| Text | `cosmetics/textLooks.ts` |
| Spind-Filter | `lockerSelectors.ts` — Stick/Puck **ausgeblendet** (Dev only) |

Cluster-1-Typen für diese Collection: `avatar` · `banner` · `emblem` · `sticker` · `frame` · `title` · `tagline`.

`RewardOrigin` kennt bereits `{ type: 'event', eventId }` — **Bedeutung heute:** Progression-Hooks (`early_slot`, Track0-Bundle), **nicht** saisonale Live-Ops. Saison-Cosmetics sollen `origin: { type: 'achievement', achievementId: 'event_2627_…' }` tragen.

### 2. Asset-Konventionen

| Typ | Ablage | Render |
|-----|--------|--------|
| Avatar/Banner/Emblem/Sticker | `frontend/public/profile/{avatars,banners,emblems,stickers}/*.svg` + `data/profile/*Catalog.ts` | `<img>` |
| Frame | CSS in `AccountPillFrame.module.css` + `data-frame` | `AccountPillFrame` |
| Title/Tagline | `text` / `name` auf `CosmeticDefinition` | Identity Card / Text |
| Collection-Cover (React) | `assets/collections/` + `collectionArtwork.tsx` | optional Poster |

### 3. Renderer

Keine eigenen `*Renderer`-Klassen. Resolve: Catalog → URL / CSS / Text (`lockerSelectors.artworkFor`, Profile-Komponenten, `AccountPillFrame`, `textLooks`).

### 4. Title / Tagline / Lokalisierung

Einzelstring auf dem Cosmetic (`text` / `name`). **Kein i18n-Layer** (kein DE/EN-Map). Geplante Texte: Title EN-Label `Season Opener 26/27`, Tagline DE `Neue Saison. Neuer Blick.` — bewusst gemischt wie bestehende Katalog-Einträge.

### 5. Collections

`collectionCatalog.ts` / `collectionEngine.ts`:

```ts
CollectionDefinition = {
  id, name, description?, itemIds[], completionRewards?,
  visibility?: 'visible' | 'secret', artworkAssetId?
}
```

**Fehlt:** `status: live | archived`, Event-Fenster, Timezone, saisonale Metadaten. `secret` ≠ Archiv. Completion-Rewards laufen clientseitig über `processedEvents['collection_completed:{id}']` — für Event-Meta **nicht** als Ersatz für `event_2627_collection_complete` verwenden (Frame soll vom Meta-Achievement kommen, nicht von Collection-Completion parallel).

### 6. Achievements / Events / Server

| Stück | Pfad | Relevanz |
|-------|------|----------|
| Achievement-Engine | `achievements/achievementEngine.ts` | clientseitig über `activityLog` |
| Catalog | `achievementCatalog.ts` + `phase2Achievements.ts` | **keine** `event_*` IDs, **keine** Kategorie `event` |
| Conditions | `event_count`, `unique_count`, `field_count`, Track/Modul/Mechanic/… | siehe Expressibility |
| Challenges | `challenges/*`, `content/challenges/*` | Typ `event`/`seasonal` existiert; MVP-Campaigns disabled; Fenster ohne TZ |
| Unified Units | `backend/progression/{grants,unit_key,config}.py` | Server: Unit-Key, Track0-Skip, P1+P2+P3 Full-Game, Dedup |
| Phase-5 Doc | `docs/architecture/progression-implement-phase5.md` | Base grants server-authoritative; Achievements weiter client-eval |

### 7. `/dev/cosmetics`

`DevCosmetics.tsx`: Pool-Filter nach Typ (inkl. Stick/Puck), Visual-QA-Sektionen, **kein** Collection-Gruppierung. `previewOnly` nur annotiert. Stick/Puck + `Puck3DLab` leben hier (nicht mehr im Spind).

---

## Architektur-Abweichungen (kritisch)

Diese Anforderungen **weichen vom Ist ab** und müssen vor Rewire (Ebene C) geklärt oder gebaut werden:

| # | Anforderung | Ist | Abweichung |
|---|-------------|-----|------------|
| 1 | Event-Achievements aus **validierten Units** | Achievements lesen Client-`activityLog` (`session_completed` etc.) | Track-0-Sessions und nicht-unit-fähige Sessions können zählen; Units liegen in `processedUnits` serverseitig |
| 2 | Keine Retroaktivität vor Eventstart | Achievements recompute volle History; Challenges filtern `occurredAt` nicht hart gegen Window | Rebuild kann „nachträglich“ unlocken |
| 3 | Konfigurierbares Fenster + **Timezone** | Challenge `startsAt`/`endsAt` als ISO vs. `Date.now()`; Daily/Weekly = Browser-Lokalzeit | Kein `timezone`-Feld |
| 4 | Meta-Achievement nicht client-claimbar | Alle Tank-Achievements client-eval → Server akzeptiert Unlock-Liste | Kein Server-Allowlist / Server-Evaluator für Meta |
| 5 | P1+P2+P3 gleiches Spiel | Backend `_game_has_all_periods` für Full-Game-Bonus | **Keine** `AchievementCondition` dafür |
| 6 | Units an N Kalendertagen | Nicht als Condition | Fehlt (braucht Unit-Timestamps + TZ-Kalendertag) |
| 7 | Collection archivieren, Besitz behalten | Nur `visibility: secret` | Kein Archive-Lifecycle |
| 8 | `origin: event` = saisonal | `origin.event` = early slot / Track0 | Semantik-Kollision — saisonal über `achievement` origin + `event_*` IDs |
| 9 | Single primary source | Inventar-Doc strebt das an; Runtime historisch dual | Origin + Grant-Pfad müssen deckungsgleich und shop-frei sein |
| 10 | Achievement-Kategorie Event | Kategorien ohne `event` | Optional erweitern oder ID-Prefix + UI-Gruppierung |

**Was schon passt:**

- Cluster-1-Typen und Asset-Pipeline (public SVG + Catalog + CSS Frame + Text)
- `previewOnly` Metadata-Konvention
- Shop ist leer (`SHOP_LISTINGS = []`) — leicht freizuhalten
- Unit-Key-Dedup und Track-0-Ausschluss **auf Unit-Ebene** (Server)
- Besitz persistiert unabhängig von Collection-Sichtbarkeit
- Stick/Puck aus Spind entfernt → Dev

---

## Expressibility der sieben Bedingungen (heute)

| Achievement | Mit bestehendem Client-Achievement-Stack? | Bemerkung |
|-------------|-------------------------------------------|-----------|
| puck_drop | **Nein** (korrekt) | Braucht „1 Unit im Fenster“, nicht roh `session_completed` |
| two_games_in | **Annähernd** `unique_count` + `field: gameId` | Ohne Window/Unit-Validierung / Track0-Filter |
| open_toolbox | **Annähernd** `unique_count` + `drillId` | Gleiches Window/Unit-Problem |
| opening_week | **Nein** | 4 Units + ≥2 Kalendertage fehlen |
| full_sixty | **Nein** clientseitig | Server Full-Game-Logik existiert, nicht als Achievement |
| season_underway | **Nein** | 8 Units + ≥3 Tage |
| collection_complete | **Nein** | Keine Condition „andere Achievements unlocked“ |

**Schluss:** Ebene B kann als Daten/Spec angelegt werden; Ebene C braucht einen **Event-Achievement-Evaluator** (idealerweise Server), der `processedUnits` (+ Timestamps) und Unlock-Graph liest — nicht den bestehenden Client-`achievementEngine` unverändert.

---

## Plan: Wiederverwendung

1. Profile-Catalogs + `public/profile/...` für Sticker/Emblem/Banner/Avatar  
2. `AccountPillFrame` + neues `data-frame='frame_opening_faceoff_2627'` CSS  
3. `CosmeticDefinition` + Eintrag in `COSMETIC_CATALOG` (via Phase2- oder eigenes Season-File)  
4. `textLooks` Resolve für Title/Tagline  
5. `CollectionDefinition` erweitern **oder** paralleles `SeasonCollectionDefinition` (siehe unten)  
6. `/dev/cosmetics` um Collection-Showcase-Sektion  
7. Optional: React Cover in `collectionArtwork.tsx` (wie Wasteland) — nur wenn Poster nötig; sonst Banner als `artworkAssetId`  
8. Später: Server `processedUnits` / `grants.py` Patterns für Validität

---

## Plan: Neue / geänderte Dateien (nach Phasen)

### Phase A — Asset-Preview only (nach Plan-Freigabe)

```text
frontend/public/profile/stickers/sticker_opening_faceoff_2627.svg
frontend/public/profile/emblems/emblem_opening_faceoff_2627.svg
frontend/public/profile/banners/banner_opening_faceoff_2627.svg
frontend/public/profile/avatars/avatar_opening_faceoff_2627.svg
frontend/src/data/profile/{sticker,emblem,banner,avatar}Catalog.ts   # Einträge
frontend/src/features/progression/cosmetics/seasonOpeningFaceoff2627.ts  # NEU: Cosmetics + previewOnly
frontend/src/features/progression/cosmetics/cosmeticCatalog.ts         # importieren
frontend/src/components/profile/AccountPillFrame.module.css            # Frame
frontend/src/pages/DevCosmetics.tsx                                    # Showcase „OPENING FACEOFF 26/27“
frontend/src/features/progression/collections/collectionCatalog.ts     # optional stub collection (preview)
# optional:
frontend/src/assets/collections/openingFaceoff2627/*                   # React Poster
frontend/src/assets/collections/collectionArtwork.tsx
```

**Noch nicht:** Achievement-Catalog, Grants, Shop, Besitz-Unlocks, Server-Evaluator.

### Phase B — Event-Definition (Daten, ohne Rewire)

```text
# Spec / Config-Skeleton (Vorschlag)
frontend oder backend:
  event_opening_faceoff_2026_27 config:
    id, displayName, timezone, startsAt, endsAt, status: draft|live|archived
    achievements: [...]  # IDs + conditions + reward refs
docs/architecture/season-opening-collection-2026.md  # dieses Doc pflegen
```

Achievement-Definitionen können als **kommentierte / draft**-Struktur im Doc oder in einem `*.draft.ts` liegen, das der Engine **nicht** lädt, bis Phase C ready ist.

### Phase C — Rewire (später)

```text
backend/progression/ event achievement evaluator (NEU)
backend reward apply: idempotente Grants für event_* 
AchievementCondition Erweiterungen ODER separates EventCondition DSL
CollectionDefinition.status archive
Client: Event-UI / Spind Collection-Karte; Meta nicht claimbar
Tests (siehe unten)
```

---

## Collection-Struktur: neu oder erweitern?

**Empfehlung:** `CollectionDefinition` **erweitern**, kein paralleles System:

```ts
status?: 'live' | 'archived' | 'draft'  // default live/visible behavior
eventId?: string                         // 'event_opening_faceoff_2026_27'
timezone?: string                        // e.g. 'Europe/Berlin'
startsAt?: string
endsAt?: string
```

- `itemIds` = die sieben Cosmetic-IDs  
- **Kein** `completionRewards` für den Frame (vermeidet Doppel-Grant mit Meta-Achievement)  
- Archiv: Collection in Spind unter „Vergangene Events“ / ausgegraut; Items bleiben in Cosmetics-Tab owned  

Alternative nur wenn Season-Events stark von thematischen Collections abweichen: `SeasonCollectionDefinition` + Adapter in `selectCollectionProgress`. Unnötig für v1, wenn obige Felder reichen.

---

## Telemetrie / Ledger — fehlende Felder

Für korrekte Event-Evaluation fehlen bzw. sind unzureichend:

| Bedarf | Heute | Lücke |
|--------|-------|-------|
| Unit gewährt + Wann | `processedUnits[key].grantedAt` (prüfen) | Kalendertag in Event-TZ ableiten |
| Unit → `game_id`, `drill_id`, Scope P1/P2/P3 | Unit-Key `game\|scope\|drill` | Parser/API für Event-Conditions |
| Event-Fenster | — | Config `startsAt`/`endsAt`/`timezone` |
| Achievement-Unlock Graph | `unlockedAchievements` client | Server-side Unlock-Record für Meta + Idempotenz-Keys `event_ach:{id}` |
| „valide Session“ vs Unit | Sessions in activityLog | **Nur Units** zählen laut Spec |
| Retro-Schutz | — | Evaluation nur Events/Units mit `grantedAt ∈ [start, end]` |
| Grant-Idempotenz Cosmetic | teils `processedEvents` / unlock maps | Explizit `processedGrantKeys` / event grant keys |

---

## `/dev/cosmetics` — gemeinsame Darstellung der sieben

Neue Sektion **„OPENING FACEOFF 26/27“** (oberhalb oder unter Cluster-1-QA):

1. Kurzer Art-Direction-Hinweis + Palette-Swatches  
2. Grid: Sticker · Emblem · Banner · Avatar als `<img>`  
3. Frame: `AccountPillFrame frameId="frame_opening_faceoff_2627"`  
4. Title + Tagline als Textzeilen mit `<code>id</code>`  
5. Badge `previewOnly` · `collectionId=event_opening_faceoff_2026_27`  
6. Optional: Filter-Chip `collection: opening_faceoff` im Pool  

Keine Besitz-/Equip-Simulation nötig über bestehendes Dev-Preview hinaus.

---

## Tests (später, Phase C + Asset-Smoke)

| Test | Zweck |
|------|-------|
| Catalog smoke | Alle 7 IDs in `COSMETIC_CATALOG`, Typen korrekt, `previewOnly`, `collectionId`, Origin-Achievement-IDs |
| Asset resolve | Catalog `src` erreichbar / Frame CSS Selector vorhanden |
| Dev route | Showcase rendert ohne Crash |
| Unit window | Units vor Start zählen nicht; nach Ende keine neuen Unlocks; Besitz bleibt |
| Track0 | Foundation/LESSON erzeugt kein Event-Progress |
| Dedup | Doppelter Unit-Key zählt einmal |
| two_games / drills | unique game_id / drill_id |
| opening_week / season_underway | Kalendertage in konfigurierter TZ |
| full_sixty | P1+P2+P3 gleicher `game_id` |
| Meta | Unlock erst wenn 6/6; nicht über Client-Claim-API |
| Idempotenz | Doppel-Apply keine doppelten XP/PUX/Cosmetics |
| Archive | Collection `archived` → UI; Cosmetics equipable |
| Kein Shop | IDs nicht in `SHOP_LISTINGS` |

Phase A: nur Catalog-/Asset-Smoke und optional Snapshot der SVGs.

---

## Klare Trennung der Liefergegenstände

```text
[A Asset-Preview]          [B Event-Definition]           [C Rewire]
 SVG + Catalog + Frame      Achievement Specs              Server Evaluator
 previewOnly=true           Window/TZ Config               Grants + Idempotenz
 /dev/cosmetics Showcase    Collection metadata draft      Client Progress UI
 KEINE Unlocks              KEINE Engine-Verdrahtung       Archive + Meta-Guard
```

**Stop nach Plan:** Implementierung startet erst nach expliziter Freigabe, empfohlen zuerst **nur Phase A**.

---

## Offene Produkt-/Tech-Fragen

1. Event-Timezone Default: `Europe/Berlin`?  
2. Zählt „valide Session“ strikt = **Base-Unit** (ein Scope/Drill), oder FULL_GAME-Aggregat?  
3. Meta-Frame: auch Collection-UI „7/7 complete“ ohne zweiten Grant?  
4. Title-Sprache: EN beibehalten oder DE-Äquivalent?  
5. Soll `AchievementCategory` um `'event'` erweitert werden?

---

## Kurz-Checkliste Abweichungen (für Review)

- [ ] Server-Event-Achievements statt Client-`activityLog`-Counts  
- [ ] Window + Timezone + Anti-Retro  
- [ ] Conditions: Units, Kalendertage, Full-Sixty, Meta  
- [ ] Collection Archive-Feld  
- [ ] Origin-Semantik: seasonal ≠ `RewardOrigin.event` (early slot)  
- [ ] Kein Shop, kein Stick/Puck/Coin in Collection  
- [ ] Preview first (`previewOnly`)
