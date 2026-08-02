export type ObservationScope = 'FULL_GAME' | 'P1' | 'P2' | 'P3'
export type PeriodPhase = 'P1' | 'P2' | 'P3'

export const ACTIVE_PERIODS_BY_SCOPE: Record<ObservationScope, PeriodPhase[]> = {
  FULL_GAME: ['P1', 'P2', 'P3'],
  P1: ['P1'],
  P2: ['P2'],
  P3: ['P3'],
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
