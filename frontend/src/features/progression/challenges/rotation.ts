import type { ChallengeDefinition, ChallengePool } from './types'

function hashString(value: string): number {
  let hash = 2166136261
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function pickDeterministicIds(input: {
  poolId: string
  rotationKey: string
  candidateIds: string[]
  count: number
  userId?: string
}): string[] {
  const unique = Array.from(new Set(input.candidateIds.filter(Boolean)))
  if (unique.length === 0) return []
  const take = Math.min(input.count, unique.length)
  const seed = hashString(`${input.poolId}|${input.rotationKey}|${input.userId || 'anon'}`)
  const rand = mulberry32(seed)
  const bag = [...unique]
  for (let i = bag.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1))
    const tmp = bag[i]
    bag[i] = bag[j]
    bag[j] = tmp
  }
  return bag.slice(0, take)
}

export function selectPoolChallenges(input: {
  pool: ChallengePool
  definitions: ChallengeDefinition[]
  rotationKey: string
  userId?: string
  isEligible: (definition: ChallengeDefinition) => boolean
}): ChallengeDefinition[] {
  const byId = new Map(input.definitions.map((item) => [item.id, item]))
  const candidates = input.pool.challengeIds
    .map((id) => byId.get(id))
    .filter((item): item is ChallengeDefinition => Boolean(item && item.enabled && input.isEligible(item)))
  const ids = pickDeterministicIds({
    poolId: input.pool.id,
    rotationKey: input.rotationKey,
    candidateIds: candidates.map((item) => item.id),
    count: input.pool.activeCount,
    userId: input.userId,
  })
  return ids.map((id) => byId.get(id)).filter((item): item is ChallengeDefinition => Boolean(item))
}
