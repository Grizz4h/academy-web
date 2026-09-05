# DEL Team-Fakten — Review (Saison 2026/27)

Quelle im Code: `frontend/src/data/delTeamFacts.ts`  
Konzept: `docs/content/del-team-facts-proposal.md` (freigegeben)

**Hard-Trennung zu CHL:** Kein Import / Alias aus `chlTeamFacts`. Überschneidende Clubs (Berlin, Mannheim, Ingolstadt, Haie, Bremerhaven) haben **eigene DEL-Einträge**. Werte dürfen inhaltlich gleich sein, müssen aber hier separat freigegeben/gepflegt werden.

Saisonstand 2026/27: **14 Clubs** · **Krefeld Pinguine** aufgestiegen · Dresden raus.

| Feld | Bedeutung |
|------|-----------|
| ID | Key in `delTeamFacts` / `delTeamLogos` |
| Name | Anzeigename im Popup |
| Stadt | Heimatstadt |
| Gegr. | Gründungsjahr |
| Arena | Heimspielstätte (Sponsoring-Name) |
| Kap. | Eishockey-Kapazität |
| Note | Kurzer Extra-Satz (optional) |

## Freigabe

- [x] Übersichtstabelle inhaltlich geprüft (Christoph)
- [x] In Detailkarten + `delTeamFacts.ts` übernommen
- [ ] Arena-Namen aktuell (Sponsoring)
- [ ] Kapazitäten plausibel (Eishockey, nicht Konzert)
- [ ] Notes faktisch ok / keine Übertreibung
- [ ] Überschneidungs-Clubs vs. CHL bewusst getrennt ok
- [x] Freigegeben am: 2026-09-04 _(Übersicht → Code)_

## Korrekturen (während Review)

| ID | Feld | Alt | Neu |
|----|------|-----|-----|
| `augsburger_panther` | Kap. | 6179 | 6218 |
| `eisbaren_berlin` | Note | 8× DEL-Meister | — |
| `grizzlys_wolfsburg` | Gegr. | 2004 | 1964 |
| `krefeld_pinguine` | Note | Aufstieg … 2026/27 | — |
| `lowen_frankfurt` | Arena | NIX Eissporthalle Frankfurt | Eissporthalle Frankfurt |
| `straubing_tigers` | Gegr. | 1947 | 1941 |

## Alle Clubs (14) — Übersicht

| ID | Name | Stadt | Gegr. | Arena | Kap. | Note |
|----|------|-------|-------|-------|------|------|
| `adler_mannheim` | Adler Mannheim | Mannheim | 1938 | SAP Arena | 13600 | — |
| `augsburger_panther` | Augsburger Panther | Augsburg | 1878 | Curt-Frenzel-Stadion | 6218 | — |
| `eisbaren_berlin` | Eisbären Berlin | Berlin | 1954 | Uber Arena | 14200 | — |
| `erc_ingolstadt` | ERC Ingolstadt | Ingolstadt | 1964 | Saturn Arena | 4591 | — |
| `fischtown_pinguins` | Pinguins Bremerhaven | Bremerhaven | 1974 | Eisarena Bremerhaven | 4674 | — |
| `grizzlys_wolfsburg` | Grizzlys Wolfsburg | Wolfsburg | 1964 | EisArena Wolfsburg | 4503 | — |
| `iserlohn_roosters` | Iserlohn Roosters | Iserlohn | 1959 | Balver Zinn Arena | 4967 | — |
| `kolner_haie` | Kölner Haie | Köln | 1972 | LANXESS arena | 18600 | Größte Eishockeyhalle Europas |
| `krefeld_pinguine` | Krefeld Pinguine | Krefeld | 1936 | Yayla Arena | 8029 | — |
| `lowen_frankfurt` | Löwen Frankfurt | Frankfurt | 2010 | Eissporthalle Frankfurt | 6990 | — |
| `nurnberg_ice_tigers` | Nürnberg Ice Tigers | Nürnberg | 1980 | PSD Bank Nürnberg Arena | 7672 | — |
| `red_bull_munchen` | EHC Red Bull München | München | 1998 | SAP Garden | 10796 | — |
| `schwenninger_wild_wings` | Schwenninger Wild Wings | Villingen-Schwenningen | 1904 | Helios Arena | 5135 | — |
| `straubing_tigers` | Straubing Tigers | Straubing | 1941 | Eisstadion am Pulverturm | 5635 | — |

## Detailkarten

### Adler Mannheim (`adler_mannheim`)

- **Name:** Adler Mannheim
- **Stadt:** Mannheim
- **Gegründet:** 1938
- **Arena:** SAP Arena
- **Kapazität:** 13600
- **Note:** —
- **CHL-Overlap:** ja — eigener DEL-Eintrag (nicht aus CHL gelinkt)

### Augsburger Panther (`augsburger_panther`)

- **Name:** Augsburger Panther
- **Stadt:** Augsburg
- **Gegründet:** 1878
- **Arena:** Curt-Frenzel-Stadion
- **Kapazität:** 6218
- **Note:** —

### Eisbären Berlin (`eisbaren_berlin`)

- **Name:** Eisbären Berlin
- **Stadt:** Berlin
- **Gegründet:** 1954
- **Arena:** Uber Arena
- **Kapazität:** 14200
- **Note:** —
- **CHL-Overlap:** ja — eigener DEL-Eintrag

### ERC Ingolstadt (`erc_ingolstadt`)

- **Name:** ERC Ingolstadt
- **Stadt:** Ingolstadt
- **Gegründet:** 1964
- **Arena:** Saturn Arena
- **Kapazität:** 4591
- **Note:** —
- **CHL-Overlap:** ja — eigener DEL-Eintrag

### Pinguins Bremerhaven (`fischtown_pinguins`)

- **Name:** Pinguins Bremerhaven
- **Stadt:** Bremerhaven
- **Gegründet:** 1974
- **Arena:** Eisarena Bremerhaven
- **Kapazität:** 4674
- **Note:** —
- **CHL-Overlap:** ja — eigener DEL-Eintrag

### Grizzlys Wolfsburg (`grizzlys_wolfsburg`)

- **Name:** Grizzlys Wolfsburg
- **Stadt:** Wolfsburg
- **Gegründet:** 1964
- **Arena:** EisArena Wolfsburg
- **Kapazität:** 4503
- **Note:** —

### Iserlohn Roosters (`iserlohn_roosters`)

- **Name:** Iserlohn Roosters
- **Stadt:** Iserlohn
- **Gegründet:** 1959
- **Arena:** Balver Zinn Arena
- **Kapazität:** 4967
- **Note:** —

### Kölner Haie (`kolner_haie`)

- **Name:** Kölner Haie
- **Stadt:** Köln
- **Gegründet:** 1972
- **Arena:** LANXESS arena
- **Kapazität:** 18600
- **Note:** _Größte Eishockeyhalle Europas_
- **CHL-Overlap:** ja — eigener DEL-Eintrag

### Krefeld Pinguine (`krefeld_pinguine`)

- **Name:** Krefeld Pinguine
- **Stadt:** Krefeld
- **Gegründet:** 1936
- **Arena:** Yayla Arena
- **Kapazität:** 8029
- **Note:** —

### Löwen Frankfurt (`lowen_frankfurt`)

- **Name:** Löwen Frankfurt
- **Stadt:** Frankfurt
- **Gegründet:** 2010
- **Arena:** Eissporthalle Frankfurt
- **Kapazität:** 6990
- **Note:** —

### Nürnberg Ice Tigers (`nurnberg_ice_tigers`)

- **Name:** Nürnberg Ice Tigers
- **Stadt:** Nürnberg
- **Gegründet:** 1980
- **Arena:** PSD Bank Nürnberg Arena
- **Kapazität:** 7672
- **Note:** —

### EHC Red Bull München (`red_bull_munchen`)

- **Name:** EHC Red Bull München
- **Stadt:** München
- **Gegründet:** 1998
- **Arena:** SAP Garden
- **Kapazität:** 10796
- **Note:** —

### Schwenninger Wild Wings (`schwenninger_wild_wings`)

- **Name:** Schwenninger Wild Wings
- **Stadt:** Villingen-Schwenningen
- **Gegründet:** 1904
- **Arena:** Helios Arena
- **Kapazität:** 5135
- **Note:** —

### Straubing Tigers (`straubing_tigers`)

- **Name:** Straubing Tigers
- **Stadt:** Straubing
- **Gegründet:** 1941
- **Arena:** Eisstadion am Pulverturm
- **Kapazität:** 5635
- **Note:** —

## Dynamik (nicht in dieser Tabelle)

Fürs Popup später aus `data/games/del_*.json`:

- **Nächstes Spiel** — immer
- **Letztes Spiel + Score** — nur wenn Spoilers aus

Dafür brauchen wir einen **regelmäßigen Ergebnis-Sync** des DEL-Spielplans (sonst veralten Scores). Details im Proposal.

## Quellen (Orientierung, kein Scrape)

- DEL-Zuschauertabelle / Vereinskapazitäten 2025/26
- Wikipedia / MagentaSport Arenen-Übersicht
- CHL-Review (nur als inhaltliche Vorlage für Overlap-Clubs, nicht als Code-Quelle)
- Krefeld: Yayla-Arena Wiki + DEL2 Clubseite (8029)
