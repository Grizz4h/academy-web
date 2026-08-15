import type { ChallengeDefinition, ChallengePhase } from '../../features/progression/challenges/types'

export type MatchdayGroupMeta = {
  id: string
  gameId: string
  homeTeamName: string
  awayTeamName: string
  shortLabel: string
}

export type MatchdaySetDraft = {
  gameId: string
  groupId: string
  homeTeamName: string
  awayTeamName: string
  shortLabel?: string
  challenges: Array<
    Omit<ChallengeDefinition, 'type' | 'context' | 'matchdayGroupId'> & {
      phase: ChallengePhase
    }
  >
}

/**
 * Authoring helper for the next matchday:
 * 1. Pick a catalog gameId
 * 2. Write texts + requirements in one file
 * 3. Register the returned array in content/matchdays/index.ts
 *
 * No new React surface. No runtime AI.
 */
export function matchdayGroupMeta(draft: Omit<MatchdaySetDraft, 'challenges'>): MatchdayGroupMeta {
  return {
    id: draft.groupId,
    gameId: draft.gameId,
    homeTeamName: draft.homeTeamName,
    awayTeamName: draft.awayTeamName,
    shortLabel: draft.shortLabel || `${draft.homeTeamName} – ${draft.awayTeamName}`,
  }
}

export function createMatchdayChallengeSet(draft: MatchdaySetDraft): ChallengeDefinition[] {
  return draft.challenges.map((item) => {
    const { phase, ...challenge } = item
    return {
      ...challenge,
      type: 'matchday',
      enabled: challenge.enabled,
      matchdayGroupId: draft.groupId,
      context: {
        gameId: draft.gameId,
        phase,
      },
    }
  })
}
