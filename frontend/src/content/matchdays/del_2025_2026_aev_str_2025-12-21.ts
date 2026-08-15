import { createMatchdayChallengeSet, matchdayGroupMeta } from './createMatchdaySet'

/**
 * Prototype set from imported DEL 2025/26 schedule context BEFORE this puck drop.
 * Unused on purpose: this game's 2–3 result, sparse boxscore PP%, goalie rows.
 */
export const MATCHDAY_GAME_ID = 'del:2025_2026:21122025_augsburger-panther_gg_straubing-tigers_4151'
export const MATCHDAY_GROUP_ID = 'matchday_del_2025_2026_aev_str_2025-12-21'

const AEV_STR_DRAFT = {
  gameId: MATCHDAY_GAME_ID,
  groupId: MATCHDAY_GROUP_ID,
  homeTeamName: 'Augsburger Panther',
  awayTeamName: 'Straubing Tigers',
  shortLabel: 'AEV – STR',
}

export const MATCHDAY_AEV_STR_GROUP = matchdayGroupMeta(AEV_STR_DRAFT)

export const MATCHDAY_AEV_STR_20251221 = createMatchdayChallengeSet({
  ...AEV_STR_DRAFT,
  challenges: [
    {
      id: 'challenge_matchday_aev_str_20251221_form_check',
      title: 'Form Check',
      description:
        'Vor dem Puck: Straubing kommt mit LLWWW und 17–10 / +18 nach 27 Spielen. Augsburg steht 12–15 / −23, Form WLLLW, und hat die beiden bisherigen Duelle verloren (3–5, 4–9). Halte in einer Session zu diesem Spiel fest, wo du heute Straubings Stabilität erwartest — oder wo Augsburg das Muster knacken kann.',
      phase: 'pre_game',
      requirements: [
        {
          id: 'pregame_read',
          eventType: 'observation_created',
          target: 1,
          label: 'Pregame-Erwartung zu diesem Spiel',
          filters: { gameId: MATCHDAY_GAME_ID, requireRealSession: true },
        },
      ],
      rewards: [{ type: 'pux', amount: 20 }],
      presentation: { icon: '📋', category: 'matchday', difficulty: 'easy' },
      enabled: true,
    },
    {
      id: 'challenge_matchday_aev_str_20251221_pressure_watch',
      title: 'Pressure Watch',
      description:
        'Die Tabelle vor dem Spieltag ist eindeutig: Straubing +18, Augsburg −23. Beobachte zwei Sequenzen, in denen der erste kontrollierte Zugriff entsteht — Zone Exit Augsburg oder Zone Entry Straubing. Speichere sie als Szenen zu diesem Spiel.',
      phase: 'in_game',
      requirements: [
        {
          id: 'pressure_scenes',
          eventType: 'scene_saved',
          target: 2,
          label: 'Szenen zum Zugriff',
          filters: { gameId: MATCHDAY_GAME_ID, requireRealSession: true },
        },
      ],
      rewards: [
        { type: 'pux', amount: 40 },
        { type: 'xp', amount: 20 },
      ],
      presentation: { icon: '🎯', category: 'matchday', difficulty: 'medium' },
      enabled: true,
    },
    {
      id: 'challenge_matchday_aev_str_20251221_read_it_back',
      title: 'Read it Back',
      description:
        'Nach dem Spiel: Hast du Straubings Form in der Fläche gesehen — oder war das H2H-Muster (Augsburg 0–2) heute das relevantere Bild? Schreib eine kurze Reflection zur Session dieses Spiels.',
      phase: 'post_game',
      requirements: [
        {
          id: 'postgame_reflection',
          eventType: 'reflection_created',
          target: 1,
          label: 'Postgame Reflection zu diesem Spiel',
          filters: { gameId: MATCHDAY_GAME_ID, requireRealSession: true },
        },
      ],
      rewards: [{ type: 'pux', amount: 40 }],
      presentation: { icon: '📝', category: 'matchday', difficulty: 'easy' },
      enabled: true,
    },
  ],
})
