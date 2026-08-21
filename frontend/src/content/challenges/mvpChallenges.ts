import type { ChallengeDefinition } from '../../features/progression/challenges/types'

export const MVP_CHALLENGES: ChallengeDefinition[] = [
  {
    id: 'challenge_daily_one_more_read',
    type: 'daily',
    title: 'One More Read',
    description: 'Schließe eine echte Observation ab. Kein Dummy, kein Durchklicken — ein echter Blick aufs Spiel.',
    requirements: [
      {
        id: 'real_observation',
        eventType: 'observation_created',
        target: 1,
        label: 'Echte Observation',
        filters: { requireRealSession: true },
      },
    ],
    rewards: [{ type: 'pux', amount: 25 }],
    presentation: { icon: '👀', category: 'daily', difficulty: 'easy' },
    enabled: true,
  },
  {
    id: 'challenge_daily_look_again',
    type: 'daily',
    title: 'Look Again',
    description: 'Speichere eine Szene im Szenenpool. Noch ein Blick, noch ein Cut.',
    requirements: [
      {
        id: 'save_scene',
        eventType: 'scene_saved',
        target: 1,
        label: 'Szene gespeichert',
        filters: { requireRealSession: true },
      },
    ],
    rewards: [{ type: 'pux', amount: 20 }],
    presentation: { icon: '🎞️', category: 'daily', difficulty: 'easy' },
    enabled: true,
  },
  {
    id: 'challenge_weekly_read_the_game',
    type: 'weekly',
    title: 'Read the Game',
    description: 'Schließe diese Woche drei echte Academy-Sessions ab.',
    requirements: [
      {
        id: 'sessions_this_week',
        eventType: 'session_completed',
        target: 3,
        label: 'Echte Sessions',
        filters: { requireRealSession: true },
      },
    ],
    rewards: [
      { type: 'pux', amount: 100 },
      { type: 'xp', amount: 80 },
    ],
    presentation: { icon: '📖', category: 'weekly', difficulty: 'medium' },
    enabled: true,
  },
  {
    id: 'challenge_weekly_pattern_hunter',
    type: 'weekly',
    title: 'Pattern Hunter',
    description: 'Speichere diese Woche drei echte Szenen. Dasselbe Muster, anderer Clip — oder drei neue Reads.',
    requirements: [
      {
        id: 'scenes_this_week',
        eventType: 'scene_saved',
        target: 3,
        label: 'Szenen',
        filters: { requireRealSession: true },
      },
    ],
    rewards: [{ type: 'pux', amount: 75 }],
    presentation: { icon: '🧲', category: 'weekly', difficulty: 'medium' },
    enabled: true,
  },
  {
    id: 'challenge_matchday_tonights_read',
    type: 'matchday',
    title: "Tonight's Read",
    description: 'Schließe eine echte Observation zu dem heutigen Spiel ab.',
    requirements: [
      {
        id: 'matchday_observation',
        eventType: 'observation_created',
        target: 1,
        label: 'Observation zum Spiel',
        filters: {
          gameId: '$matchday',
          requireRealSession: true,
        },
      },
    ],
    rewards: [
      { type: 'pux', amount: 40 },
      { type: 'cosmetic', cosmeticId: 'sticker_matchday_first_read' },
    ],
    context: { bindGame: 'today', phase: 'in_game' },
    collectionId: 'matchday_moments',
    presentation: { icon: '🏟️', category: 'matchday', difficulty: 'medium' },
    enabled: true,
  },
  {
    id: 'challenge_matchday_home_ice',
    type: 'matchday',
    title: 'HOME ICE',
    description:
      'Begleite ein Heimspiel vor Ort mit RINK Tank und schließe dort eine qualifizierende Session ab.',
    requirements: [
      {
        id: 'verified_home_session',
        eventType: 'session_completed',
        target: 1,
        label: 'Verifizierte Heim-Session',
        filters: {
          gameId: '$matchday',
          requireRealSession: true,
          requireGameContext: true,
          requireVenueVerification: true,
          homeAwayRole: 'home',
        },
      },
    ],
    rewards: [
      { type: 'pux', amount: 50 },
      { type: 'cosmetic', cosmeticId: 'title_home_ice' },
    ],
    context: { bindGame: 'today', phase: 'in_game' },
    collectionId: 'arena_passport',
    presentation: { icon: '🏠', category: 'matchday', difficulty: 'medium', celebration: 'hero' },
    enabled: true,
  },
  {
    id: 'challenge_matchday_on_the_road',
    type: 'matchday',
    title: 'ON THE ROAD',
    description:
      'Besuche mit RINK Tank ein Auswärtsspiel und schließe dort eine qualifizierende Session ab.',
    requirements: [
      {
        id: 'verified_away_session',
        eventType: 'session_completed',
        target: 1,
        label: 'Verifizierte Auswärts-Session',
        filters: {
          gameId: '$matchday',
          requireRealSession: true,
          requireGameContext: true,
          requireVenueVerification: true,
          homeAwayRole: 'away',
        },
      },
    ],
    rewards: [
      { type: 'pux', amount: 100 },
      { type: 'cosmetic', cosmeticId: 'title_on_the_road' },
    ],
    context: { bindGame: 'today', phase: 'in_game' },
    collectionId: 'arena_passport',
    presentation: { icon: '🚌', category: 'matchday', difficulty: 'hard', celebration: 'hero' },
    enabled: true,
  },
  {
    id: 'challenge_matchday_first_visit',
    type: 'matchday',
    title: 'FIRST VISIT',
    description:
      'Erstes verifiziertes RINK-Tank-Erlebnis in dieser Arena. Einmal pro Halle.',
    requirements: [
      {
        id: 'first_verified_venue_session',
        eventType: 'session_completed',
        target: 1,
        label: 'Erste Arena-Session',
        filters: {
          gameId: '$matchday',
          requireRealSession: true,
          requireGameContext: true,
          requireVenueVerification: true,
          requireFirstVenueVisit: true,
        },
      },
    ],
    rewards: [
      { type: 'pux', amount: 40 },
      { type: 'cosmetic', cosmeticId: 'title_first_visit' },
    ],
    context: { bindGame: 'today', phase: 'in_game' },
    collectionId: 'arena_passport',
    rotationScope: 'venue',
    presentation: { icon: '🎟️', category: 'matchday', difficulty: 'medium', celebration: 'hero' },
    enabled: true,
  },
  {
    id: 'challenge_collection_survive_the_shift',
    type: 'collection',
    title: 'Survive the Shift',
    description: 'Schließe eine echte Observation ab. Eine Schicht auf hartem Eis — oder was davon übrig ist.',
    requirements: [
      {
        id: 'survive_session',
        eventType: 'session_completed',
        target: 1,
        label: 'Echte Session',
        filters: { requireRealSession: true },
      },
    ],
    rewards: [
      { type: 'pux', amount: 30 },
      { type: 'cosmetic', cosmeticId: 'puck_wasteland_scrap' },
    ],
    collectionId: 'wasteland',
    presentation: { icon: '⚙️', category: 'collection', difficulty: 'medium' },
    enabled: false,
  },
  {
    id: 'challenge_collection_ice_cut',
    type: 'collection',
    title: 'Ice Cut',
    description: 'Schließe eine echte Observation ab. Danach ist die Bahn bereit — Fresh Sheet für die Zamboni-Collection.',
    requirements: [
      {
        id: 'ice_cut_session',
        eventType: 'session_completed',
        target: 1,
        label: 'Echte Session',
        filters: { requireRealSession: true },
      },
    ],
    rewards: [
      { type: 'pux', amount: 25 },
      { type: 'cosmetic', cosmeticId: 'sticker_fresh_sheet' },
    ],
    collectionId: 'zamboni',
    presentation: { icon: '🧊', category: 'collection', difficulty: 'easy' },
    enabled: true,
  },
]
