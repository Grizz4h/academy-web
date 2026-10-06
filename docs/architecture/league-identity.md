# League / competition identity

Canonical **external** competition value:

```text
DNL
```

Age / team context is **not** part of the league string. U20 lives in team names
(`ERC Ingolstadt U20`) and in youth-name display helpers. Tank has no separate
age-group field today; this cleanup does not add one.

## Boundary

| Layer | Value | Examples |
|---|---|---|
| Domain / API / UI | `DNL` | `GET /api/scenes`, `GET /api/teams?league=DNL`, Scene Pool `league`, competition config |
| Internal catalog / filesystem | `U20_DNL` | `data/academy/teams_u20_dnl.json`, `data/games/u20_dnl_*.json`, `assets/team_logos/u20_dnl/` |

Consumers (including Board Studio) must not map `U20_DNL` → `DNL` themselves.
Tank owns that mapping in one place:

- Backend: `backend/league_identity.py`
- Frontend (UI catalogs / filters): `frontend/src/data/leagueIdentity.ts`

Do not scatter `if league === "DNL" → "U20_DNL"` through endpoints.

## Compatibility window

| Direction | Behavior |
|---|---|
| READ | Persistiertes `U20_DNL` wird vor der Antwort zu `DNL` normalisiert. GET schreibt die Datei nicht um. |
| WRITE | Neue Scene-/Domain-Writes speichern `DNL`. |
| QUERY | `DNL` und `U20_DNL` werden akzeptiert und intern als dieselbe Competition behandelt. |

`GET /api/teams?league=DNL&season=2026/27` liefert den bestehenden U20-DNL-Katalog
(Team-IDs und Namen unverändert). `?league=U20_DNL` tut dasselbe, die Antwort
trägt `league: "DNL"`.

Game-IDs bleiben `u20_dnl:{season}:{uuid}` — technische IDs, nicht die Domain-Liga.

## Optional later migration

A one-off rewrite of stored Scene JSON (`league: U20_DNL` → `DNL`) and of
`league` / `league_id` inside `data/games/u20_dnl_*.json` would be safe **after**
this API window, but is **not** required for clients. Do not run it as a live
production mutation until explicitly scheduled.
