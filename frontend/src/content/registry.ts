import { MVP_CHALLENGES } from './challenges/mvpChallenges'
import { MATCHDAY_CHALLENGE_SETS } from './matchdays'
import { MVP_CAMPAIGNS, MVP_CHALLENGE_POOLS } from './challenges/pools'
import { COLLECTIONS } from '../features/progression/collections/collectionCatalog'
import { COSMETIC_CATALOG } from '../features/progression/cosmetics/cosmeticCatalog'
import { auditRewardReachability, validateContent } from '../features/progression/challenges/validation'
import { validateHomeLockerIntegrity } from '../features/progression/tasks/taskViews'
import { validateVenueCatalog } from '../data/venues'
import type { CatalogGame } from '../api'

export const contentRegistry = {
  challenges: [...MVP_CHALLENGES, ...MATCHDAY_CHALLENGE_SETS],
  campaigns: MVP_CAMPAIGNS,
  pools: MVP_CHALLENGE_POOLS,
  collections: COLLECTIONS,
  rewards: COSMETIC_CATALOG,
}

export function getContentRegistry() {
  return contentRegistry
}

export function getChallenge(id: string) {
  return contentRegistry.challenges.find((item) => item.id === id)
}

export function runContentValidation(games: CatalogGame[] = []) {
  return [
    ...validateContent({
      challenges: contentRegistry.challenges,
      campaigns: contentRegistry.campaigns,
      pools: contentRegistry.pools,
    }),
    ...validateHomeLockerIntegrity({
      challenges: contentRegistry.challenges,
      campaigns: contentRegistry.campaigns,
      pools: contentRegistry.pools,
    }),
    ...validateVenueCatalog(games).map((issue) => ({
      severity: issue.severity,
      code: issue.code,
      message: issue.message,
      entityType: 'venue' as const,
      entityId: issue.venueId || issue.gameId,
    })),
  ]
}

export function runRewardReachabilityAudit() {
  return auditRewardReachability({ challenges: contentRegistry.challenges })
}
