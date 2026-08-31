/** Attack direction on the observation rink (screen left/right). */

export type AttackDirection = 'left' | 'right'

export type AttackDirectionSessionLike = {
  current_phase?: string
  observed_team?: string
  observed_team_id?: string
  observed_team_name?: string
  game_info?: {
    observed_team?: string
    observed_team_id?: string
    observed_team_name?: string
    team_home?: string
    team_away?: string
    home_team_id?: string
    away_team_id?: string
  } | null
} | null | undefined

export function flipAttackDirection(direction: AttackDirection): AttackDirection {
  return direction === 'right' ? 'left' : 'right'
}

export function normalizeAttackDirection(
  value: unknown,
  fallback: AttackDirection = 'right',
): AttackDirection {
  return value === 'left' || value === 'right' ? value : fallback
}

export function inferPeriodNumber(phase?: unknown, sessionCurrentPhase?: unknown): number {
  const fromPhase = String(phase || sessionCurrentPhase || '').toUpperCase()
  if (fromPhase.startsWith('P')) {
    const n = Number(fromPhase.replace('P', ''))
    if (Number.isFinite(n) && n >= 1) return n
  }
  return 1
}

/** Home team attack direction for a regulation period (ends switch each period). */
export function homeAttackDirectionForPeriod(
  homeAttackDirectionP1: AttackDirection,
  period: number,
): AttackDirection {
  return period % 2 === 1
    ? homeAttackDirectionP1
    : flipAttackDirection(homeAttackDirectionP1)
}

function normalizeToken(value: unknown): string {
  return String(value || '').trim().toLowerCase()
}

/**
 * Infer observed-team attack direction from session (home/away + period).
 *
 * Prefer team IDs, then display names. If the observed side is unknown, still
 * apply the period flip for home — never drop period and fall back to a fixed
 * default (that bug made P2 look wrong).
 */
export function inferAutoAttackDirection(opts: {
  phase?: unknown
  session?: AttackDirectionSessionLike
  homeAttackDirectionP1?: unknown
}): AttackDirection {
  const homeP1 = normalizeAttackDirection(opts.homeAttackDirectionP1, 'right')
  const period = inferPeriodNumber(opts.phase, opts.session?.current_phase)
  const homeDirection = homeAttackDirectionForPeriod(homeP1, period)

  const gi = opts.session?.game_info || {}
  const observedId = normalizeToken(gi.observed_team_id || opts.session?.observed_team_id)
  const homeId = normalizeToken(gi.home_team_id)
  const awayId = normalizeToken(gi.away_team_id)

  if (observedId && homeId && observedId === homeId) return homeDirection
  if (observedId && awayId && observedId === awayId) return flipAttackDirection(homeDirection)

  const observedName = normalizeToken(
    gi.observed_team
    || gi.observed_team_name
    || opts.session?.observed_team
    || opts.session?.observed_team_name,
  )
  const homeName = normalizeToken(gi.team_home)
  const awayName = normalizeToken(gi.team_away)

  if (observedName && homeName && observedName === homeName) return homeDirection
  if (observedName && awayName && observedName === awayName) return flipAttackDirection(homeDirection)

  return homeDirection
}
