import type { CampaignDefinition, ChallengePool } from '../../features/progression/challenges/types'

export const MVP_CHALLENGE_POOLS: ChallengePool[] = [
  {
    id: 'pool_daily_mvp',
    type: 'daily',
    challengeIds: ['challenge_daily_one_more_read', 'challenge_daily_look_again'],
    activeCount: 2,
  },
  {
    id: 'pool_weekly_mvp',
    type: 'weekly',
    challengeIds: ['challenge_weekly_read_the_game', 'challenge_weekly_pattern_hunter'],
    activeCount: 2,
  },
]

/** Architecture stub — no 2027 content. Window is closed so it never activates. */
export const MVP_CAMPAIGNS: CampaignDefinition[] = [
  {
    id: 'campaign_content_engine_stub',
    title: 'Campaign Engine Stub',
    description: 'Platzhalter, damit Campaigns validiert und im Inspector sichtbar sind. Nicht aktiv.',
    startsAt: '2010-01-01T00:00:00.000Z',
    endsAt: '2010-01-02T00:00:00.000Z',
    challengeIds: [],
    enabled: false,
  },
]
