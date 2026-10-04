export type ObservationScope = 'FULL_GAME' | 'P1' | 'P2' | 'P3' | 'LESSON'
/** Setup selection before the user picks a scope — must not imply P1. */
export type ObservationScopeSelection = ObservationScope | ''
export type PeriodPhase = 'P1' | 'P2' | 'P3'

export const ACTIVE_PERIODS_BY_SCOPE: Record<ObservationScope, PeriodPhase[]> = {
  FULL_GAME: ['P1', 'P2', 'P3'],
  P1: ['P1'],
  P2: ['P2'],
  P3: ['P3'],
  /** Single-pass lesson (Track 0 / foundation) — no live periods */
  LESSON: ['P1'],
}

/**
 * New session/lab setup: no Drittel/Umfang preselected.
 * P1 must only appear after an explicit user choice (or foundation → LESSON).
 */
export const DEFAULT_OBSERVATION_SCOPE: ObservationScopeSelection = ''

export function hasExplicitObservationScope(
  scope?: string | null,
): scope is ObservationScope {
  const value = String(scope || '').trim().toUpperCase()
  return value === 'FULL_GAME' || value === 'P1' || value === 'P2' || value === 'P3' || value === 'LESSON'
}

export const OBSERVATION_SCOPE_OPTIONS: Array<{ value: ObservationScope; label: string }> = [
  { value: 'FULL_GAME', label: 'Gesamtes Spiel' },
  { value: 'P1', label: '1. Drittel' },
  { value: 'P2', label: '2. Drittel' },
  { value: 'P3', label: '3. Drittel' },
]

export function getObservationScopeLabel(scope?: string | null): string {
  switch (scope) {
    case 'P1':
      return '1. Drittel'
    case 'P2':
      return '2. Drittel'
    case 'P3':
      return '3. Drittel'
    case 'LESSON':
      return 'Lektion'
    case 'FULL_GAME':
    case undefined:
    case null:
    case '':
      return 'Gesamtes Spiel'
    default:
      return scope
  }
}

export function getActivePeriodsForScope(scope?: string | null): PeriodPhase[] {
  const normalized = (scope || '').trim().toUpperCase() as ObservationScope
  return ACTIVE_PERIODS_BY_SCOPE[normalized] || ACTIVE_PERIODS_BY_SCOPE.FULL_GAME
}

export function isLessonScope(scope?: string | null): boolean {
  return (scope || '').trim().toUpperCase() === 'LESSON'
}

export function normalizeObservationScope(scope?: string | null): ObservationScope | string {
  const value = (scope || '').trim().toUpperCase()
  if (value === 'P1' || value === 'P2' || value === 'P3' || value === 'FULL_GAME' || value === 'LESSON') {
    return value
  }
  return 'FULL_GAME'
}

/** Next live phase for this observation scope. P1-only sessions go P1 → POST, never P2/P3. */
export function getNextPhaseForScope(
  phase: string | null | undefined,
  scope?: string | null,
): PeriodPhase | 'POST' | null {
  const periods = getActivePeriodsForScope(scope)
  const first = periods[0] || 'P1'
  const normalized = String(phase || '').trim().toUpperCase()
  if (normalized === 'POST') return null
  if (normalized === 'PRE' || normalized === '') return first
  if (normalized === 'P1' || normalized === 'P2' || normalized === 'P3') {
    const currentIndex = periods.indexOf(normalized as PeriodPhase)
    if (currentIndex === -1) return first
    if (currentIndex === periods.length - 1) return 'POST'
    return periods[currentIndex + 1]
  }
  return first
}

export function getPreviousPhaseForScope(
  phase: string | null | undefined,
  scope?: string | null,
): PeriodPhase | null {
  const periods = getActivePeriodsForScope(scope)
  const normalized = String(phase || '').trim().toUpperCase()
  if (normalized !== 'P1' && normalized !== 'P2' && normalized !== 'P3') return null
  const currentIndex = periods.indexOf(normalized as PeriodPhase)
  if (currentIndex <= 0) return null
  return periods[currentIndex - 1]
}
