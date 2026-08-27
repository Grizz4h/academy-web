/**
 * DevLab progression harness — synthetic events + scenario journeys for server preview.
 */

import { getLevelFromXp } from '../features/progression/levelCurve'

export type HarnessScenarioId =
  | 'first_p1_unit'
  | 'duplicate_unit'
  | 'first_drill_bonus'
  | 'full_game_bonus'
  | 'track0_bundle'
  | 'early_slot_2'
  | 'dummy_blocked'
  | 'lesson_blocked'

export type HarnessScenario = {
  id: HarnessScenarioId
  title: string
  blurb: string
  /** Empty = sandbox state; set for chained steps */
  seedState?: Record<string, unknown>
  activityEvents: Array<Record<string, unknown>>
  sessionDoc?: Record<string, unknown>
  expect?: { minXp?: number; maxXp?: number; minPux?: number; maxPux?: number; logIncludes?: string }
}

export type PreviewGrantResult = {
  granted_xp: number
  granted_pux: number
  cosmetics: Array<Record<string, unknown>>
  logs: string[]
  state_after: {
    xp: number
    currency: { PUX: number }
    processedUnits: Record<string, unknown>
    processedGrantKeys: Record<string, unknown>
    unlockedCosmetics: Record<string, unknown>
  }
}

export type JourneyStepResult = {
  scenarioId: HarnessScenarioId
  title: string
  preview: PreviewGrantResult
  level: number
  unitCount: number
}

const GAME = 'del:2025:999'
const EVAL = '2026-01-01T12:00:00.000Z'

function sessionDoc(input: {
  id: string
  drill: string
  scope: string
  gameId?: string
  isDummy?: boolean
}): Record<string, unknown> {
  return {
    id: input.id,
    state: 'COMPLETED',
    is_dummy: input.isDummy === true,
    game_id: input.gameId ?? GAME,
    drill_id: input.drill,
    module_id: input.drill.split('_')[0] || 'C1',
    observation_scope: input.scope,
  }
}

function sessionEvent(input: {
  id: string
  sessionId: string
  drill: string
  scope: string
  isFirstDrill?: boolean
  isDummy?: boolean
}): Record<string, unknown> {
  return {
    id: input.id,
    type: 'session_completed',
    occurredAt: EVAL,
    sessionId: input.sessionId,
    drillId: input.drill,
    trackId: input.drill.split('_')[0] || 'C1',
    observationScope: input.scope,
    gameId: GAME,
    leagueId: 'DEL',
    isDummy: input.isDummy === true,
    isFirstSessionOfDrill: input.isFirstDrill === true,
  }
}

function seedUnits(units: string[]): Record<string, unknown> {
  const processedUnits: Record<string, unknown> = {}
  for (const key of units) {
    processedUnits[key] = {
      progressionUnitKey: key,
      sessionId: `seed-${key}`,
      grantedAt: EVAL,
      ruleIds: ['base_unit_xp'],
    }
  }
  return {
    xp: units.length * 100,
    currency: { PUX: units.length * 10 },
    processedUnits,
    processedGrantKeys: {},
    unlockedCosmetics: {},
  }
}

export const HARNESS_SCENARIOS: HarnessScenario[] = [
  {
    id: 'first_p1_unit',
    title: 'Erste P1-Unit',
    blurb: 'Neue game+scope+drill → 100 XP + 10 PUX',
    activityEvents: [
      sessionEvent({
        id: 'sess:first-p1',
        sessionId: 'sess-first-p1',
        drill: 'C1_D1',
        scope: 'P1',
        isFirstDrill: true,
      }),
    ],
    sessionDoc: sessionDoc({ id: 'sess-first-p1', drill: 'C1_D1', scope: 'P1' }),
    expect: { minXp: 125, maxXp: 125, minPux: 10, maxPux: 10, logIncludes: 'grant:base_unit' },
  },
  {
    id: 'duplicate_unit',
    title: 'Duplicate Unit (Anti-Farm)',
    blurb: 'Gleiche Unit nochmal → 0 Grants',
    seedState: seedUnits([`${GAME}|P1|C1_D1`]),
    activityEvents: [
      sessionEvent({
        id: 'sess:dup',
        sessionId: 'sess-dup',
        drill: 'C1_D1',
        scope: 'P1',
      }),
    ],
    sessionDoc: sessionDoc({ id: 'sess-dup', drill: 'C1_D1', scope: 'P1' }),
    expect: { minXp: 0, maxXp: 0, minPux: 0, maxPux: 0, logIncludes: 'skip:unit_duplicate' },
  },
  {
    id: 'first_drill_bonus',
    title: 'First-Drill-Bonus',
    blurb: 'Erster Abschluss eines Drill-IDs → +25 XP einmalig',
    activityEvents: [
      sessionEvent({
        id: 'sess:first-drill',
        sessionId: 'sess-first-drill',
        drill: 'D2_03',
        scope: 'P2',
        isFirstDrill: true,
      }),
    ],
    sessionDoc: sessionDoc({ id: 'sess-first-drill', drill: 'D2_03', scope: 'P2' }),
    expect: { minXp: 125, maxXp: 125 },
  },
  {
    id: 'full_game_bonus',
    title: 'Full-Game-Bonus',
    blurb: 'P1+P2+P3 für dasselbe Spiel → Bonus + Cosmetic-Hook',
    seedState: seedUnits([
      `${GAME}|P1|C1_D1`,
      `${GAME}|P2|C1_D2`,
      `${GAME}|P3|C1_D3`,
    ]),
    activityEvents: [
      sessionEvent({
        id: 'sess:full-game',
        sessionId: 'sess-full-game',
        drill: 'C1_D4',
        scope: 'P3',
      }),
    ],
    sessionDoc: sessionDoc({ id: 'sess-full-game', drill: 'C1_D4', scope: 'P3' }),
    expect: { minXp: 100, logIncludes: 'grant:full_game' },
  },
  {
    id: 'track0_bundle',
    title: 'Track 0 Bundle',
    blurb: 'track0_completed → 100 XP + 25 PUX + frame_basic',
    activityEvents: [
      {
        id: 'track0_completed:dev-user',
        type: 'track0_completed',
        occurredAt: EVAL,
        trackId: 'T0',
        userId: 'dev-user',
      },
    ],
    expect: { minXp: 100, minPux: 25, logIncludes: 'grant:track0_bundle' },
  },
  {
    id: 'early_slot_2',
    title: 'Early Slot · 2 Units',
    blurb: 'Zweite validierte Unit → emblem_arrow_01',
    seedState: seedUnits([`${GAME}|P1|C1_D1`]),
    activityEvents: [
      sessionEvent({
        id: 'sess:slot2',
        sessionId: 'sess-slot2',
        drill: 'C1_D2',
        scope: 'P1',
      }),
    ],
    sessionDoc: sessionDoc({ id: 'sess-slot2', drill: 'C1_D2', scope: 'P1' }),
    expect: { minXp: 100, logIncludes: 'grant:early_slot:2' },
  },
  {
    id: 'dummy_blocked',
    title: 'Dummy blockiert',
    blurb: 'is_dummy Session → 0 serverseitige Grants',
    activityEvents: [
      sessionEvent({
        id: 'sess:dummy',
        sessionId: 'sess-dummy',
        drill: 'C1_D1',
        scope: 'P1',
        isDummy: true,
      }),
    ],
    sessionDoc: sessionDoc({ id: 'sess-dummy', drill: 'C1_D1', scope: 'P1', isDummy: true }),
    expect: { minXp: 0, maxXp: 0 },
  },
  {
    id: 'lesson_blocked',
    title: 'Lesson blockiert',
    blurb: 'LESSON-Scope → kein Base-Unit-Grant',
    activityEvents: [
      sessionEvent({
        id: 'sess:lesson',
        sessionId: 'sess-lesson',
        drill: 'T0_01',
        scope: 'LESSON',
      }),
    ],
    sessionDoc: sessionDoc({ id: 'sess-lesson', drill: 'T0_01', scope: 'LESSON' }),
    expect: { minXp: 0, maxXp: 0 },
  },
]

/** Four-week Standard journey (4 units/week) — chained server preview. */
export const STANDARD_JOURNEY_WEEKS = 4
export const STANDARD_JOURNEY_UNITS_PER_WEEK = 4

export function buildStandardJourneyEvents(): Array<{ title: string; activityEvents: Array<Record<string, unknown>>; sessionDoc: Record<string, unknown> }> {
  const steps: Array<{ title: string; activityEvents: Array<Record<string, unknown>>; sessionDoc: Record<string, unknown> }> = []
  let unit = 0
  for (let week = 1; week <= STANDARD_JOURNEY_WEEKS; week += 1) {
    for (let slot = 1; slot <= STANDARD_JOURNEY_UNITS_PER_WEEK; slot += 1) {
      unit += 1
      const sessionId = `journey-w${week}-u${slot}`
      const drill = `C1_D${unit}`
      steps.push({
        title: `W${week} · Unit ${unit} (${drill} P1)`,
        activityEvents: [
          sessionEvent({
            id: `journey:${sessionId}`,
            sessionId,
            drill,
            scope: 'P1',
            isFirstDrill: unit === 1,
          }),
        ],
        sessionDoc: sessionDoc({ id: sessionId, drill, scope: 'P1' }),
      })
    }
  }
  return steps
}

export function evaluateExpectation(
  preview: PreviewGrantResult,
  expect: HarnessScenario['expect'],
): { ok: boolean; detail: string } {
  if (!expect) return { ok: true, detail: '—' }
  const xp = preview.granted_xp
  const pux = preview.granted_pux
  if (expect.minXp != null && xp < expect.minXp) return { ok: false, detail: `XP ${xp} < ${expect.minXp}` }
  if (expect.maxXp != null && xp > expect.maxXp) return { ok: false, detail: `XP ${xp} > ${expect.maxXp}` }
  if (expect.minPux != null && pux < expect.minPux) return { ok: false, detail: `PUX ${pux} < ${expect.minPux}` }
  if (expect.maxPux != null && pux > expect.maxPux) return { ok: false, detail: `PUX ${pux} > ${expect.maxPux}` }
  if (expect.logIncludes && !preview.logs.some((line) => line.includes(expect.logIncludes!))) {
    return { ok: false, detail: `Log fehlt: ${expect.logIncludes}` }
  }
  return { ok: true, detail: 'OK' }
}

export function levelFromPreviewState(stateAfter: PreviewGrantResult['state_after']): number {
  return getLevelFromXp(stateAfter.xp)
}

export function unitCountFromState(stateAfter: PreviewGrantResult['state_after']): number {
  return Object.keys(stateAfter.processedUnits || {}).length
}
