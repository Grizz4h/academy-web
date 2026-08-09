import type { CollectionDefinition } from '../types'

export const COLLECTIONS: CollectionDefinition[] = [
  {
    id: 'the_slot',
    name: 'The Slot',
    description: 'Wohnen im gefährlichsten Raum der Rink.',
    itemIds: [
      'title_slot_watcher',
      'emblem_slot_resident',
      'tagline_no_slot',
      'frame_slot',
      'sticker_slot',
    ],
    completionRewards: [
      { type: 'xp', amount: 200 },
      { type: 'pux', amount: 100 },
      { type: 'cosmetic', cosmeticId: 'banner_property_of_the_slot' },
    ],
    visibility: 'visible',
  },
  {
    id: 'blue_line_department',
    name: 'Blue Line Department',
    description: 'Clipboard optional. Entries & Clears ernst.',
    itemIds: [
      'title_blue_line_student',
      'emblem_blue_line_inspector',
      'sticker_entry',
      'sticker_exit',
      'title_ice_cartographer',
    ],
    completionRewards: [
      { type: 'xp', amount: 250 },
      { type: 'pux', amount: 120 },
      { type: 'cosmetic', cosmeticId: 'banner_blue_line_wizard' },
    ],
    visibility: 'visible',
  },
  {
    id: 'rink_rat_starter',
    name: 'Rink Rat Starter Set',
    description: 'Die Grundausstattung für echte Film-Room-Ratten.',
    itemIds: [
      'title_rink_rat',
      'sticker_tape',
      'title_puck_detective',
      'banner_neutral_01',
      'emblem_rink_01',
    ],
    completionRewards: [
      { type: 'xp', amount: 150 },
      { type: 'pux', amount: 80 },
      { type: 'cosmetic', cosmeticId: 'frame_rink_rat' },
    ],
    visibility: 'visible',
  },
  {
    id: 'neutral_zone_goblins',
    name: 'Neutral Zone Goblins',
    description: 'Zwischen den Linien wohnen die kleinen Chaos-Beobachter.',
    itemIds: [
      'title_neutral_zone_tourist',
      'emblem_goblin',
      'sticker_watch_the_center',
      'banner_neutral_zone_goblin_shop',
      'tagline_watch_the_center',
    ],
    completionRewards: [
      { type: 'xp', amount: 300 },
      { type: 'pux', amount: 150 },
      { type: 'cosmetic', cosmeticId: 'banner_neutral_zone_goblin_legend' },
    ],
    visibility: 'visible',
  },
]

export const COLLECTION_BY_ID: Record<string, CollectionDefinition> = Object.fromEntries(
  COLLECTIONS.map((item) => [item.id, item]),
)

export function getCollection(id: string): CollectionDefinition | undefined {
  return COLLECTION_BY_ID[id]
}

export function collectionCompletionEventId(collectionId: string): string {
  return `collection_completed:${collectionId}`
}
