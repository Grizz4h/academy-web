/** Option order for Track 0 quiz answers — random per session, stable while answering. */

/** Fisher–Yates with Math.random(). Does not mutate the input array. */
export function shuffleRandom<T>(items: T[]): T[] {
  const next = items.slice()
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    const tmp = next[i]
    next[i] = next[j]
    next[j] = tmp
  }
  return next
}

/**
 * Resolve a stable option order for a foundation step.
 * Prefers a previously stored order (session persistence); otherwise shuffles randomly once.
 */
export function resolveStableOptionOrder<T extends { id: string }>(
  options: T[],
  storedIds: string[] | undefined,
): { ordered: T[]; ids: string[]; created: boolean } {
  const byId = new Map(options.map((opt) => [opt.id, opt]))
  if (Array.isArray(storedIds) && storedIds.length > 0) {
    const ordered: T[] = []
    const seen = new Set<string>()
    for (const id of storedIds) {
      const opt = byId.get(id)
      if (opt && !seen.has(id)) {
        ordered.push(opt)
        seen.add(id)
      }
    }
    for (const opt of options) {
      if (!seen.has(opt.id)) ordered.push(opt)
    }
    return { ordered, ids: ordered.map((opt) => opt.id), created: false }
  }
  const ordered = shuffleRandom(options)
  return { ordered, ids: ordered.map((opt) => opt.id), created: true }
}
