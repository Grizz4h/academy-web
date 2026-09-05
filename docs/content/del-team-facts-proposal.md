# DEL Club-Infos — Popup-Konzept

Status: **Konzept freigegeben** · Statische Fakten in Review (`del-team-facts-review.md`) · UI-Wiring noch offen.

Vergleich: CHL nutzt statische Club-Fakten (`chlTeamFacts.ts`). DEL bekommt dieselbe Interaktion (1. Klick Auswahl · 2. Klick Infos), mit DEL-Feldern + optional Saison-Kontext aus unserem Spielplan.

## Interaktion (wie CHL)

- Desktop + Mobile gleich
- 1. Klick/Tap auf Kachel → Team beobachten
- 2. Klick auf bereits gewählte Kachel → Popup
- Klick auf Popup / Kachel / woanders / andere Kachel → schließen
- Andere Kachel bei offenem Popup → schließen + neues Team wählen (dann wieder 2. Klick für Infos)

## Hard-Trennung CHL ↔ DEL

Überschneidende Clubs (Berlin, Mannheim, Ingolstadt, Haie, Bremerhaven) **nicht** aus `chlTeamFacts` wiederverwenden.

| Schicht | CHL | DEL |
|---------|-----|-----|
| Statische Fakten | `chlTeamFacts.ts` | `delTeamFacts.ts` (eigene Kopien) |
| Review | `chl-team-facts-review.md` | `del-team-facts-review.md` |
| Spielplan / Scores | `chl_*.json` | `del_*.json` |

Gleiche Arena/Stadt-Werte sind ok — aber getrennte Pflege und Freigabe.

## Was wir schon haben (Datenlage)

| Quelle | Inhalt |
|--------|--------|
| `data/games/del_*.json` | Spielplan inkl. `status`, `score`, Teams, Datum |
| `delTeamLogos.json` + Crests | 14 Clubs (26/27 inkl. Krefeld) |
| Spoiler-Toggle | `hideSpoilers` — Ergebnisse ausblenden |

Damit sind **Live-/Saison-Kontext-Infos** möglich, ohne neue Scrape-Quelle.

## Empfohlene Popup-Inhalte (DEL)

### A. Immer (statisch, spoilerfrei)

Kurzer Club-Steckbrief — analog CHL, aber schlanker:

| Feld | Beispiel | Warum |
|------|----------|--------|
| Name + Stadt | Eisbären Berlin · Berlin | Orientierung |
| Arena (+ Kapazität) | Uber Arena (14200) | Identity / Venue |
| Gegründet | 1954 | optional, nice-to-have |
| Kurz-Note | z. B. Meistertitel | nur wenn knapp & geprüft |

Kein Länderflaggen-Festival nötig (alles DE).

### B. Saison-Kontext aus unserem Spielplan (dynamisch)

Nur aus `del_*.json` der **aktuell gewählten Saison** ableiten:

| Feld | Spoiler **an** (Ergebnisse versteckt) | Spoiler **aus** (Ergebnisse sichtbar) |
|------|----------------------------------------|----------------------------------------|
| Nächstes Spiel | Datum · Gegner · Heim/Auswärts · Uhrzeit | gleich |
| Letztes Spiel | Datum · Gegner · Heim/Auswärts (**ohne** Score) | Datum · Gegner · **Ergebnis** |
| Optional: Form | „letzte 5: gespielt“ / Striche | z. B. `W-W-L-OTw-L` oder `3W–2L` |

**Dein Beispiel** „letztes Ergebnis gegen wen“ gehört in die Spoiler-**aus**-Spalte; bei Spoiler **an** nur Gegner + Datum, kein Score.

### Ergebnis-Sync (Pflicht, wenn Scores angezeigt werden)

Wenn wir „letztes Spiel“ **mit Ergebnis** zeigen, muss der DEL-Spielplan **regelmäßig Ergebnisse nachziehen** (bestehende PennyDel-Pipeline / Importer — keine zweite Quelle).

Sonst: Popup zeigt veraltete oder leere Scores, obwohl Spoilers aus sind.

| Spoiler | Sync-Bedarf |
|---------|-------------|
| Nur nächstes Spiel + letztes ohne Score | Datum/Gegner reichen; Score-Sync weniger kritisch |
| Letztes Spiel **mit** Score (Spoilers aus) | **regelmäßiger Ergebnis-Sync** erforderlich |

V1-Empfehlung: Sync ohnehin mit dem normalen Schedule-Import mitlaufen lassen (Status + Score), sobald der dynamische Block live geht.

### C. Bewusst nicht in V1

- Tabellenplatz / Punkte (bräuchte Standings-Pipeline)
- Scorer, Torschützen
- Verletzungen / Aufstellungen
- Live-Ticker
- Scraping penny-del.org für Extra-Bios

## UX-Skizze (Popover)

```text
Eisbären Berlin
Berlin · Uber Arena (14 200)

Nächstes Spiel
Fr 12.09. · vs. Adler Mannheim (H) · 19:30

Letztes Spiel          ← nur wenn Spoiler aus: mit Score
So 07.09. · @ Kölner Haie · 2:4
```

Bei Spoiler an:

```text
Letztes Spiel
So 07.09. · @ Kölner Haie · gespielt
```

## Datenregeln

1. „Letztes / nächstes“ immer relativ zu **heute** (Europe/Berlin), Team = beobachtetes bzw. angeklicktes Club.
2. Nur Spiele der gewählten Saison + Phase-sensibel? Vorschlag V1: **gesamte Saison-Datei** (Hauptrunde+Playoffs gemischt nach Datum).
3. Kein Score, wenn `hideSpoilers` oder Score fehlt.
4. Statische Fakten in `delTeamFacts.ts` — Review-Doc freigeben, bevor Notes live gehen.
5. CHL-Overlap: immer `getDelTeamFacts`, nie CHL-Resolver für DEL-Kacheln.

## Umsetzungsreihenfolge

1. ~~`delTeamFacts.ts` + Review-Markdown~~ → Review durch Christoph  
2. Popup-Mechanik in LiveObservationPanel für `league === 'DEL'` (gleiche Klick-Logik)  
3. Dynamischer Block „Nächstes / Letztes Spiel“ aus Catalog-Games + Spoiler-Gate + **Ergebnis-Sync im Import**  
4. Optional später: Form der letzten 5

## Entschieden / Annahmen

1. Statische Notes in V1 ok, wenn im Review freigegeben (sonst leer lassen).  
2. Letztes/nächstes Spiel V1: **nur DEL-Datei** (kein CHL/Cup-Mix).  
3. Popup am Heim- und Auswärts-Crest zeigt Infos **dieses** Clubs (wie CHL).  
4. CHL ↔ DEL Fakten hart getrennt.
