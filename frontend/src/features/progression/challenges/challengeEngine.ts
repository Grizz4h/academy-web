import { isProgressionEligibleEvent } from '../activityEvents'
import type { CosmeticUnlock, RinkActivityEvent } from '../types'
import { applyChallengeRewards } from './grants'
import {
  campaignRotationKey,
  challengeCompletionEventId,
  challengeInstanceKey,
  matchdayRotationKey,
  onceRotationKey,
} from './ids'
import { applyEventToProgress } from './requirementEngine'
import { selectPoolChallenges } from './rotation'
import { getRotationKey, isWithinWindow } from './time'
import { resolveVenueIdForGame } from '../../../data/venues/resolveVenue'
import type {
  CampaignDefinition,
  ChallengeDefinition,
  ChallengeEvaluateResult,
  ChallengePool,
  ChallengeProgress,
  ChallengeRotationState,
  MatchdayContext,
  RequirementProgress,
} from './types'

function emptyRotation(now: Date): ChallengeRotationState {
  return {
    dailyKey: getRotationKey('daily', now),
    weeklyKey: getRotationKey('weekly', now),
    dailyIds: [],
    weeklyIds: [],
    matchdayGameId: null,
    matchdayChallengeIds: [],
    campaignIds: [],
  }
}

function blankRequirements(definition: ChallengeDefinition): RequirementProgress[] {
  return definition.requirements.map((item) => ({
    requirementId: item.id,
    current: 0,
    target: item.target,
    completed: item.target <= 0,
  }))
}

function createProgress(
  definition: ChallengeDefinition,
  rotationKey: string,
  boundGameId?: string,
  boundVenueId?: string,
): ChallengeProgress {
  return {
    instanceKey: challengeInstanceKey(definition.id, rotationKey),
    challengeId: definition.id,
    rotationKey,
    status: 'active',
    requirements: blankRequirements(definition),
    countedEventIds: [],
    boundGameId,
    boundVenueId,
    rewardClaimed: false,
  }
}

export function boundGameIdFor(
  definition: ChallengeDefinition,
  matchday: MatchdayContext | null,
): string | undefined {
  if (definition.context?.gameId) return definition.context.gameId
  if (definition.context?.bindGame === 'today' || definition.type === 'matchday') return matchday?.gameId
  return undefined
}

function isChallengeAvailable(definition: ChallengeDefinition, now: Date, matchday: MatchdayContext | null): boolean {
  if (!definition.enabled) return false
  if (definition.availability && !isWithinWindow(definition.availability.startsAt, definition.availability.endsAt, now)) {
    return false
  }
  if (definition.context?.bindGame === 'today') return Boolean(matchday)
  if (definition.type === 'matchday' && !definition.context?.gameId) return Boolean(matchday)
  return true
}

function rotationKeyFor(
  definition: ChallengeDefinition,
  rotation: ChallengeRotationState,
  matchday: MatchdayContext | null,
): string {
  if (definition.rotationScope === 'once') return onceRotationKey(definition.id)
  if (definition.rotationScope === 'venue') {
    const venueId = matchday?.game ? resolveVenueIdForGame(matchday.game) : undefined
    return onceRotationKey(`${definition.id}:${venueId || 'none'}`)
  }
  if (definition.type === 'daily') return rotation.dailyKey
  if (definition.type === 'weekly') return rotation.weeklyKey
  if (definition.type === 'matchday') return matchdayRotationKey(definition.context?.gameId || matchday?.gameId || 'none')
  if (definition.campaignId) return campaignRotationKey(definition.campaignId)
  if (definition.type === 'event' || definition.type === 'seasonal') {
    return definition.availability?.startsAt
      ? `window:${definition.id}:${definition.availability.startsAt}`
      : onceRotationKey(definition.id)
  }
  return onceRotationKey(definition.id)
}

export function listActiveDefinitions(input: {
  definitions: ChallengeDefinition[]
  pools: ChallengePool[]
  campaigns?: CampaignDefinition[]
  rotation: ChallengeRotationState
  matchday: MatchdayContext | null
  now: Date
  userId?: string
}): ChallengeDefinition[] {
  const dailyPool = input.pools.find((item) => item.type === 'daily')
  const weeklyPool = input.pools.find((item) => item.type === 'weekly')
  const eligible = (definition: ChallengeDefinition) => isChallengeAvailable(definition, input.now, input.matchday)

  const selected: ChallengeDefinition[] = []
  if (dailyPool) {
    selected.push(
      ...selectPoolChallenges({
        pool: dailyPool,
        definitions: input.definitions,
        rotationKey: input.rotation.dailyKey,
        userId: input.userId,
        isEligible: eligible,
      }),
    )
  }
  if (weeklyPool) {
    selected.push(
      ...selectPoolChallenges({
        pool: weeklyPool,
        definitions: input.definitions,
        rotationKey: input.rotation.weeklyKey,
        userId: input.userId,
        isEligible: eligible,
      }),
    )
  }

  for (const definition of input.definitions) {
    if (!definition.enabled) continue
    if (definition.type === 'matchday' && eligible(definition)) selected.push(definition)
    if ((definition.type === 'event' || definition.type === 'seasonal' || definition.type === 'collection') && eligible(definition)) {
      selected.push(definition)
    }
  }

  const campaignNow = input.campaigns || []
  for (const campaign of campaignNow) {
    if (campaign.enabled === false) continue
    if (!isWithinWindow(campaign.startsAt, campaign.endsAt, input.now)) continue
    for (const challengeId of campaign.challengeIds) {
      const definition = input.definitions.find((item) => item.id === challengeId)
      if (definition && definition.enabled) selected.push(definition)
    }
  }

  const seen = new Set<string>()
  return selected.filter((item) => {
    if (seen.has(item.id)) return false
    seen.add(item.id)
    return true
  })
}

export function syncChallengeRotation(input: {
  definitions: ChallengeDefinition[]
  pools: ChallengePool[]
  campaigns?: CampaignDefinition[]
  progress: Record<string, ChallengeProgress>
  rotation?: ChallengeRotationState | null
  matchday: MatchdayContext | null
  now?: Date
  userId?: string
}): { rotation: ChallengeRotationState; progress: Record<string, ChallengeProgress>; changed: boolean } {
  const now = input.now || new Date()
  const nextRotation: ChallengeRotationState = {
    ...(input.rotation || emptyRotation(now)),
    dailyKey: getRotationKey('daily', now),
    weeklyKey: getRotationKey('weekly', now),
    matchdayGameId: input.matchday?.gameId || null,
  }

  const active = listActiveDefinitions({
    definitions: input.definitions,
    pools: input.pools,
    campaigns: input.campaigns,
    rotation: nextRotation,
    matchday: input.matchday,
    now,
    userId: input.userId,
  })

  nextRotation.dailyIds = active.filter((item) => item.type === 'daily').map((item) => item.id)
  nextRotation.weeklyIds = active.filter((item) => item.type === 'weekly').map((item) => item.id)
  nextRotation.matchdayChallengeIds = active.filter((item) => item.type === 'matchday').map((item) => item.id)
  nextRotation.campaignIds = (input.campaigns || [])
    .filter((item) => item.enabled !== false && isWithinWindow(item.startsAt, item.endsAt, now))
    .map((item) => item.id)

  const progress = { ...input.progress }
  let changed = JSON.stringify(input.rotation || {}) !== JSON.stringify(nextRotation)

  const activeKeys = new Set<string>()
  for (const definition of active) {
    const rotationKey = rotationKeyFor(definition, nextRotation, input.matchday)
    const instanceKey = challengeInstanceKey(definition.id, rotationKey)
    activeKeys.add(instanceKey)
    if (!progress[instanceKey]) {
      progress[instanceKey] = createProgress(
        definition,
        rotationKey,
        boundGameIdFor(definition, input.matchday),
        input.matchday?.game ? resolveVenueIdForGame(input.matchday.game) : undefined,
      )
      changed = true
    } else if (progress[instanceKey].status === 'expired') {
      // keep expired history; a new key would have been created for a new window
    }
  }

  for (const [key, item] of Object.entries(progress)) {
    if (item.status === 'completed' || item.status === 'expired') continue
    if (activeKeys.has(key)) continue
    const definition = input.definitions.find((entry) => entry.id === item.challengeId)
    if (definition?.type === 'daily' || definition?.type === 'weekly' || definition?.type === 'matchday') {
      progress[key] = { ...item, status: 'expired' }
      changed = true
    }
  }

  return { rotation: nextRotation, progress, changed }
}

export function evaluateChallenges(input: {
  events: RinkActivityEvent[]
  definitions: ChallengeDefinition[]
  pools: ChallengePool[]
  campaigns?: CampaignDefinition[]
  progress: Record<string, ChallengeProgress>
  processedEvents: Record<string, unknown>
  rotation?: ChallengeRotationState | null
  matchday: MatchdayContext | null
  unlockedCosmetics: Record<string, CosmeticUnlock>
  now?: Date
  userId?: string
}): ChallengeEvaluateResult {
  const now = input.now || new Date()
  const synced = syncChallengeRotation({
    definitions: input.definitions,
    pools: input.pools,
    campaigns: input.campaigns,
    progress: input.progress,
    rotation: input.rotation,
    matchday: input.matchday,
    now,
    userId: input.userId,
  })

  const progress = { ...synced.progress }
  const workingCosmetics = { ...input.unlockedCosmetics }
  const completedThisPass = new Set<string>()

  let grantedXp = 0
  let grantedPux = 0
  const unlockedCosmetics: CosmeticUnlock[] = []
  const unlockHistory: ChallengeEvaluateResult['unlockHistory'] = []
  const rewardEvents: Array<Record<string, unknown>> = []
  const processedEventIds: string[] = []
  const puxTransactions: ChallengeEvaluateResult['puxTransactions'] = []
  let changed = synced.changed

  const active = listActiveDefinitions({
    definitions: input.definitions,
    pools: input.pools,
    campaigns: input.campaigns,
    rotation: synced.rotation,
    matchday: input.matchday,
    now,
    userId: input.userId,
  })

  for (const event of input.events) {
    if (!isProgressionEligibleEvent(event)) continue

    for (const definition of active) {
      const rotationKey = rotationKeyFor(definition, synced.rotation, input.matchday)
      const instanceKey = challengeInstanceKey(definition.id, rotationKey)
      const current = progress[instanceKey]
      if (!current || current.status === 'expired') continue
      if (current.status === 'completed' && current.rewardClaimed) continue

      const next = applyEventToProgress(current, definition.requirements, event)
      if (next === current) continue
      progress[instanceKey] = next
      changed = true

      if (next.status !== 'completed' || next.rewardClaimed) continue
      const completionId = challengeCompletionEventId(instanceKey)
      if (input.processedEvents[completionId] || processedEventIds.includes(completionId) || completedThisPass.has(instanceKey)) {
        continue
      }
      completedThisPass.add(instanceKey)
      const granted = applyChallengeRewards({
        definition,
        progress: next,
        occurredAt: event.occurredAt,
        alreadyCosmetics: workingCosmetics,
      })
      grantedXp += granted.xp
      grantedPux += granted.pux
      for (const cosmetic of granted.cosmetics) {
        unlockedCosmetics.push(cosmetic)
        workingCosmetics[cosmetic.cosmeticId] = cosmetic
      }
      unlockHistory.push(...granted.history)
      rewardEvents.push(...granted.rewardEvents)
      puxTransactions.push(...granted.puxTransactions)
      processedEventIds.push(completionId)
      progress[instanceKey] = { ...next, rewardClaimed: true, completedAt: next.completedAt || event.occurredAt }
    }
  }

  // Completions that already reached target without a new matching event (e.g. empty requirements) — skip.

  return {
    progress,
    rotation: synced.rotation,
    grantedXp,
    grantedPux,
    unlockedCosmetics,
    unlockHistory,
    rewardEvents,
    processedEventIds,
    puxTransactions,
    completedInstanceKeys: Array.from(completedThisPass),
    changed: changed || processedEventIds.length > 0,
  }
}

export function getActiveProgressViews(input: {
  definitions: ChallengeDefinition[]
  pools: ChallengePool[]
  campaigns?: CampaignDefinition[]
  progress: Record<string, ChallengeProgress>
  rotation: ChallengeRotationState
  matchday: MatchdayContext | null
  now?: Date
  userId?: string
}): Array<{ definition: ChallengeDefinition; progress: ChallengeProgress }> {
  const now = input.now || new Date()
  const active = listActiveDefinitions({
    definitions: input.definitions,
    pools: input.pools,
    campaigns: input.campaigns,
    rotation: input.rotation,
    matchday: input.matchday,
    now,
    userId: input.userId,
  })
  return active.map((definition) => {
    const rotationKey = rotationKeyFor(definition, input.rotation, input.matchday)
    const instanceKey = challengeInstanceKey(definition.id, rotationKey)
    const fallback = createProgress(
      definition,
      rotationKey,
      boundGameIdFor(definition, input.matchday),
      input.matchday?.game ? resolveVenueIdForGame(input.matchday.game) : undefined,
    )
    return {
      definition,
      progress: input.progress[instanceKey] || fallback,
    }
  })
}
