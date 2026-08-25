# Phase 5 — Implementierung (Checklist)

> Stand: 2026-08-25. Start nach Freigabe „los gehts“.  
> Voraussetzungen: Phase 1–4 Docs + eingefrorene Entscheidungen.  
> Feature-Flag: `ACADEMY_PROGRESSION_UNIFIED_PIPELINE=1` (Backend) · `VITE_PROGRESSION_UNIFIED_PIPELINE=1` (Frontend)

## Ziel dieses Sprints (5.1–5.4)

Ein Pfad für **Basis-Grants** (XP + PUX pro Progression Unit), Legacy Session-PUX aus, Server authoritative für Base.

---

## 5.1 Config-Skeleton

Neue Dateien:

```text
backend/progression/
├── __init__.py
├── config.py          # BASE_XP=100, BASE_PUX=10, FIRST_DRILL=25, flags
├── unit_key.py        # build_progression_unit_key
└── grants.py          # compute_unified_base_grants
```

Frontend:

```text
frontend/src/features/progression/unifiedPipeline.ts  # isUnifiedProgressionPipeline()
```

---

## 5.2 RewardState erweitern

In [`json_reward.py`](../../backend/repositories/json_reward.py) + [`types.ts`](../../frontend/src/features/rewards/types.ts):

```typescript
processedUnits: Record<string, { progressionUnitKey, sessionId, grantedAt, ruleIds[] }>
processedGrantKeys: Record<string, string>  // grant_idempotency_key → grantedAt
```

`merge_reward_state` + `pg_mapping` REWARD_TOP_KEYS ergänzen.

---

## 5.3 Server: Base Grants

In [`main.py`](../../backend/main.py) `_compute_reward_apply`:

1. Wenn `ACADEMY_PROGRESSION_UNIFIED_PIPELINE`:
   - `compute_unified_base_grants(state, activity_events, session_doc)`
   - `processedUnits` / `processedGrantKeys` setzen
   - `server_xp` / `server_pux` addieren
   - **Legacy `unlocked_masteries` ignorieren** (keine neuen Legacy-Tiers)
2. Session laden (bereits für dummy-Check) und an Mutator übergeben
3. Logging: grant applied / duplicate unit (structured)

Unit-Key aus Session/Event:

```text
game_id|observation_scope(P1|P2|P3|FULL_GAME)|drill_id
```

LESSON / Track 0 → kein Base-Grant (später `track0_completed`).

`full_game_completed`: wenn P1+P2+P3 für gleiches `game_id` in `processedUnits` (Drill egal).

---

## 5.4 Client: ein Pfad pro Session

[`Session.tsx`](../../frontend/src/pages/Session.tsx) `finalizeSessionRewards`:

```typescript
if (isUnifiedProgressionPipeline()) {
  // KEIN grantRewardResult / evaluateSessionRewards
} else {
  await grantRewardResult(rewardResult)  // Legacy
}
await ingestActivityEvents(progressionEvents)
```

[`buildActivityFromSources.ts`](../../frontend/src/features/progression/buildActivityFromSources.ts):

- `observationScope` auf `session_completed` Event setzen

[`progressionEngine.ts`](../../frontend/src/features/progression/progressionEngine.ts):

- Bei Unified: `session_completed` + `first_session_of_drill` **nicht** clientseitig XP geben (Server macht Base)

---

## Tests (5.3)

`backend/test_progression_unified.py`:

- Unit-Key aus P1-Session
- FULL_GAME historisch = eine Unit
- Duplicate unit → 0 XP
- LESSON → 0 Base
- first_drill Bonus einmal
- full_game nach P1+P2+P3

---

## Spätere Sprints (5.5–5.10)

| Step | Inhalt |
|---|---|
| 5.5 | Early-Slots (2/4/8–12), Track0, full_game Cosmetic-Hooks |
| 5.6 | Legacy Achievements read-only |
| 5.7 | `evaluateSessionRewards` entfernen |
| 5.8 | Gedeckelte Kurve (grandfather XP) |
| 5.9 | Persona-Simulation DevLab |
| 5.10 | Flag default on, Legacy dead code entfernen |

---

## Akzeptanz (Sprint 5.1–5.4)

- [ ] Flag off → Verhalten unverändert
- [ ] Flag on → keine Legacy-PUX pro Session
- [ ] Flag on → gleiche Unit + neue session_id → 0 Base-XP/PUX
- [ ] Flag on → Server addiert 100 XP + 10 PUX pro neuer Unit
- [ ] Achievements/Challenges laufen weiter (Client-Engine)

---

## Blocker

**Plan-Modus** erlaubt keine Code-Edits. Für Implementierung: **Agent-Modus** aktivieren und erneut „Phase 5 implementieren“ sagen.
