import type { MasteryDefinition } from '../types'

/** Domain mastery coins — prestige collectibles, not equipable in Phase 2. */
export const MASTERY_COIN_IDS = {
  defensive_zone: 'coin_defensive_zone',
  neutral_zone: 'coin_neutral_zone',
  offensive_zone: 'coin_offensive_zone',
  powerplay: 'coin_powerplay',
  penalty_kill: 'coin_penalty_kill',
  entries_clears: 'coin_entries_clears',
} as const

/**
 * Track mastery: thresholds are min completed runs per drill in the track.
 * 1 = Track Complete, 3 = Mastery I, 5 = Mastery II.
 */
export const TRACK_MASTERY_DEFINITIONS: MasteryDefinition[] = [
  {
    id: 'track_mastery_c1',
    scope: 'track',
    targetId: 'C1',
    name: 'C1 – Foundations',
    description: 'Wiederholte Sessions über alle C1-Drills.',
    milestones: [
      {
        threshold: 1,
        label: 'Track Complete',
        rewards: [
          { type: 'xp', amount: 150 },
          { type: 'pux', amount: 75 },
        ],
      },
      {
        threshold: 3,
        label: 'Mastery I',
        rewards: [
          { type: 'xp', amount: 200 },
          { type: 'pux', amount: 100 },
          { type: 'cosmetic', cosmeticId: MASTERY_COIN_IDS.defensive_zone },
        ],
      },
      {
        threshold: 5,
        label: 'Mastery II',
        rewards: [
          { type: 'xp', amount: 300 },
          { type: 'pux', amount: 150 },
          { type: 'cosmetic', cosmeticId: 'title_c1_obsessed' },
        ],
      },
    ],
  },
  {
    id: 'track_mastery_c2',
    scope: 'track',
    targetId: 'C2',
    name: 'C2 – Neutral Zone',
    description: 'Neutral Zone wiederholen, bis die Struktur sitzt.',
    milestones: [
      {
        threshold: 1,
        label: 'Track Complete',
        rewards: [
          { type: 'xp', amount: 200 },
          { type: 'pux', amount: 100 },
          { type: 'cosmetic', cosmeticId: MASTERY_COIN_IDS.neutral_zone },
        ],
      },
      {
        threshold: 3,
        label: 'Mastery I',
        rewards: [
          { type: 'xp', amount: 250 },
          { type: 'pux', amount: 125 },
        ],
      },
      {
        threshold: 5,
        label: 'Mastery II',
        rewards: [
          { type: 'xp', amount: 350 },
          { type: 'pux', amount: 175 },
          { type: 'cosmetic', cosmeticId: 'title_nz_obsessed' },
        ],
      },
    ],
  },
  {
    id: 'track_mastery_d2',
    scope: 'track',
    targetId: 'D2',
    name: 'D2 – Defensive Zone',
    milestones: [
      {
        threshold: 1,
        label: 'Track Complete',
        rewards: [
          { type: 'xp', amount: 200 },
          { type: 'pux', amount: 100 },
          { type: 'cosmetic', cosmeticId: MASTERY_COIN_IDS.defensive_zone },
        ],
      },
      {
        threshold: 3,
        label: 'Mastery I',
        rewards: [
          { type: 'xp', amount: 250 },
          { type: 'pux', amount: 125 },
        ],
      },
      {
        threshold: 5,
        label: 'Mastery II',
        rewards: [
          { type: 'xp', amount: 350 },
          { type: 'pux', amount: 175 },
        ],
      },
    ],
  },
  {
    id: 'track_mastery_d3',
    scope: 'track',
    targetId: 'D3',
    name: 'D3 – Entries & Clears',
    milestones: [
      {
        threshold: 1,
        label: 'Track Complete',
        rewards: [
          { type: 'xp', amount: 250 },
          { type: 'pux', amount: 125 },
          { type: 'cosmetic', cosmeticId: MASTERY_COIN_IDS.entries_clears },
        ],
      },
      {
        threshold: 3,
        label: 'Mastery I',
        rewards: [
          { type: 'xp', amount: 300 },
          { type: 'pux', amount: 150 },
        ],
      },
      {
        threshold: 5,
        label: 'Mastery II',
        rewards: [
          { type: 'xp', amount: 400 },
          { type: 'pux', amount: 200 },
          { type: 'cosmetic', cosmeticId: 'title_blue_line_obsessed' },
        ],
      },
    ],
  },
]

/** Generic drill mastery milestones applied to any drill via runtime evaluation. */
export const DRILL_MASTERY_MILESTONES = [
  {
    threshold: 1,
    label: 'Familiar',
    rewards: [{ type: 'xp' as const, amount: 25 }],
  },
  {
    threshold: 3,
    label: 'Trained',
    rewards: [{ type: 'pux' as const, amount: 40 }],
  },
  {
    threshold: 5,
    label: 'Mastered',
    rewards: [
      { type: 'xp' as const, amount: 100 },
      { type: 'pux' as const, amount: 60 },
    ],
  },
  {
    threshold: 10,
    label: 'Obsessed',
    rewards: [
      { type: 'xp' as const, amount: 200 },
      { type: 'pux' as const, amount: 100 },
      { type: 'cosmetic' as const, cosmeticId: 'title_drill_obsessed' },
    ],
  },
]

export function drillMasteryId(drillId: string): string {
  return `drill_mastery:${drillId}`
}

export function masteryMilestoneEventId(masteryId: string, threshold: number): string {
  return `mastery_milestone:${masteryId}:${threshold}`
}

export const TRACK_MASTERY_BY_ID: Record<string, MasteryDefinition> = Object.fromEntries(
  TRACK_MASTERY_DEFINITIONS.map((item) => [item.id, item]),
)

export function getTrackMastery(trackId: string): MasteryDefinition | undefined {
  return TRACK_MASTERY_DEFINITIONS.find((item) => item.targetId === trackId)
}
