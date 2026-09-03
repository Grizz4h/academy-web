import type { CosmeticDefinition } from '../types'

export const OPENING_FACEOFF_COLLECTION_ID = 'event_opening_faceoff_2026_27'

const previewMeta = {
  previewOnly: true,
  seasonEventId: OPENING_FACEOFF_COLLECTION_ID,
} as const

/**
 * OPENING FACEOFF 26/27 — Phase A Asset-Preview only.
 * No grants / achievements wired yet. All entries are previewOnly + secret until event rewire.
 */
export const OPENING_FACEOFF_2627_COSMETICS: CosmeticDefinition[] = [
  {
    id: 'sticker_opening_faceoff_2627',
    type: 'sticker',
    name: 'Opening Faceoff',
    flavorText: 'Puck hängt. Eis wartet. Saison startet.',
    rarity: 'common',
    assetId: 'sticker_opening_faceoff_2627',
    collectionId: OPENING_FACEOFF_COLLECTION_ID,
    origin: { type: 'achievement', achievementId: 'event_2627_puck_drop' },
    visibility: 'secret',
    metadata: { ...previewMeta },
  },
  {
    id: 'tagline_new_season_new_read_2627',
    type: 'tagline',
    name: 'Neue Saison. Neuer Blick.',
    text: 'Neue Saison. Neuer Blick.',
    flavorText: 'Gleicher Sport. Frischer Look.',
    rarity: 'common',
    collectionId: OPENING_FACEOFF_COLLECTION_ID,
    origin: { type: 'achievement', achievementId: 'event_2627_two_games_in' },
    visibility: 'secret',
    metadata: { ...previewMeta },
  },
  {
    id: 'emblem_opening_faceoff_2627',
    type: 'emblem',
    name: 'Opening Faceoff',
    flavorText: 'Bullykreis. Mittellinie. Kurz vor dem Drop.',
    rarity: 'uncommon',
    assetId: 'emblem_opening_faceoff_2627',
    collectionId: OPENING_FACEOFF_COLLECTION_ID,
    origin: { type: 'achievement', achievementId: 'event_2627_open_toolbox' },
    visibility: 'secret',
    metadata: { ...previewMeta },
  },
  {
    id: 'banner_opening_faceoff_2627',
    type: 'banner',
    name: 'Opening Faceoff 26/27',
    flavorText: 'Arena-Licht. Frisches Eis. Volle Spielzeit.',
    rarity: 'uncommon',
    assetId: 'banner_opening_faceoff_2627',
    collectionId: OPENING_FACEOFF_COLLECTION_ID,
    origin: { type: 'achievement', achievementId: 'event_2627_opening_week' },
    visibility: 'secret',
    metadata: { ...previewMeta },
  },
  {
    id: 'avatar_opening_faceoff_2627',
    type: 'avatar',
    name: 'Faceoff Drop',
    flavorText: 'Lichtkegel. Puck. Der Moment davor.',
    rarity: 'rare',
    assetId: 'avatar_opening_faceoff_2627',
    collectionId: OPENING_FACEOFF_COLLECTION_ID,
    origin: { type: 'achievement', achievementId: 'event_2627_full_sixty' },
    visibility: 'secret',
    metadata: { ...previewMeta },
  },
  {
    id: 'title_season_opener_2627',
    type: 'title',
    name: 'Season Opener 26/27',
    text: 'Season Opener 26/27',
    flavorText: 'Opening night energy. Ohne Merchandise-Look.',
    rarity: 'rare',
    collectionId: OPENING_FACEOFF_COLLECTION_ID,
    origin: { type: 'achievement', achievementId: 'event_2627_season_underway' },
    visibility: 'secret',
    metadata: { ...previewMeta },
  },
  {
    id: 'frame_opening_faceoff_2627',
    type: 'frame',
    name: 'Opening Faceoff Frame',
    flavorText: 'Eisrand um die Account-Pille. Meta-Abschluss.',
    rarity: 'epic',
    collectionId: OPENING_FACEOFF_COLLECTION_ID,
    origin: { type: 'achievement', achievementId: 'event_2627_collection_complete' },
    visibility: 'secret',
    metadata: { ...previewMeta, cssClass: 'frame-opening-faceoff' },
  },
]

export const OPENING_FACEOFF_2627_COSMETIC_IDS = OPENING_FACEOFF_2627_COSMETICS.map((item) => item.id)
