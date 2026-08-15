# Reward- & Challenge-Content

Die Challenge-Schicht sitzt **auf** der bestehenden Progression (XP, Pux, Achievements, Collections, Locker). Kein zweites Reward-System.

Regel: keine losen Aufgaben, keine losen Belohnungen. Jede Challenge zahlt auf XP / Pux / Cosmetic / Collection ein.

## So fügst du morgen etwas hinzu

### 1. Reward (Cosmetic / Collection Item)

1. Asset nach `frontend/public/profile/…` (falls sichtbar).
2. Catalog-Eintrag (`avatarCatalog` / `bannerCatalog` / `emblemCatalog`) wenn nötig, `starter: false`.
3. Cosmetic in `frontend/src/features/progression/cosmetics/phase2Cosmetics.ts`:

```ts
{
  id: 'sticker_example',
  type: 'sticker',
  name: 'Example',
  rarity: 'uncommon',
  collectionId: 'matchday_moments', // optional
  origin: { type: 'challenge', challengeId: 'challenge_daily_one_more_read' },
}
```

Keine Display-Namen als IDs. IDs sind immutable.

### 2. Challenge

Neue Datei oder Eintrag in `frontend/src/content/challenges/mvpChallenges.ts` (später eigene Dateien, in die Registry aufnehmen):

```ts
{
  id: 'challenge_weekly_entry_reads_01',
  type: 'weekly',
  title: 'Blue Line Reads',
  description: 'Beobachte diese Woche fünf Entries.',
  requirements: [
    {
      id: 'entry_observations',
      eventType: 'observation_created',
      target: 5,
      filters: { trackIds: ['D3'], requireRealSession: true },
    },
  ],
  rewards: [{ type: 'pux', amount: 100 }],
  enabled: true,
}
```

ID in den passenden Pool in `frontend/src/content/challenges/pools.ts` legen.

Keine React-Business-Logic. Die Engine liest die Definition.

### 3. Weekly / Daily Pool

`MVP_CHALLENGE_POOLS`: `challengeIds` + `activeCount`. Rotation ist deterministisch (`Datum + User + Pool`).

### 4. Matchday Challenge

`type: 'matchday'` und `filters.gameId: '$matchday'` plus `context.bindGame: 'today'`.

Wird nur gewählt, wenn `resolveMatchdayContext` ein **echtes** heutiges Spiel findet (keine Dummy-Fixtures).

### 5. Collection Item

Collection in `collectionCatalog.ts` um `itemIds` ergänzen. Cosmetic `collectionId` + `origin` setzen. Completion-Rewards bleiben `RewardGrant[]`.

### 6. Event / Campaign

`frontend/src/content/challenges/pools.ts` → `MVP_CAMPAIGNS`. `startsAt` / `endsAt` / `challengeIds`. Kein Battle Pass.

## Domain Events

User-Aktion → `RinkActivityEvent` → Requirement Engine → Progress → Completion → bestehende Reward Grants.

Aktuell u. a.: `session_completed`, `observation_created`, `scene_created`/`scene_saved`, `reflection_created`, `prediction_completed`, `game_observation_completed`.

Dummy (`isDummy` / `is_dummy`) erzeugt **keinen** Progress.

## Dev

`/dev/content` — Validation, Reachability, Filter, Requirement simulieren.

## Tests

```bash
npx --yes tsx src/features/progression/challenges/challengeEngine.test.ts
npx --yes tsx src/features/progression/phase2.test.ts
```
