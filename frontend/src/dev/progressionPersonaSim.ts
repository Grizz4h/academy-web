/**
 * Phase 2 persona projection — DevLab tuning (no server writes).
 * Two modes: isolated base units vs. realistic new-user bonuses.
 */

import {
  BASE_XP_PER_UNIT,
  cumulativeXpForLevel,
  getLevelFromXp,
} from '../features/progression/levelCurve'

export const BASE_PUX_PER_UNIT = 10
export const FIRST_DRILL_BONUS_XP = 25
export const TRACK0_BUNDLE_XP = 100
export const TRACK0_BUNDLE_PUX = 25
export const FULL_GAME_BONUS_XP = 25
export const FULL_GAME_BONUS_PUX = 10
export const TRACK_COMPLETED_XP = 500

export const EARLY_SLOT_UNITS = [2, 4, 10, 24, 48] as const
export const REFERENCE_LEVELS = [5, 10, 25, 50] as const

export type PersonaId = 'locker' | 'standard' | 'intensive'
export type SimMode = 'isolated_base' | 'realistic_new_user'

export const PERSONA_LABELS: Record<PersonaId, string> = {
  locker: 'Locker (2/Woche)',
  standard: 'Standard (4/Woche)',
  intensive: 'Intensiv (9/Woche)',
}

export const PERSONA_WEEKLY_SESSIONS: Record<PersonaId, number> = {
  locker: 2,
  standard: 4,
  intensive: 9,
}

export const SIM_MODE_LABELS: Record<SimMode, string> = {
  isolated_base: 'Isoliert — nur Base-Unit',
  realistic_new_user: 'Realistisch — Track 0 + Boni',
}

export type SimWeekSnapshot = {
  week: number
  units: number
  xp: number
  pux: number
  level: number
}

export type MilestoneKey =
  | `unit_${number}`
  | `level_${number}`

export type PersonaSimResult = {
  persona: PersonaId
  mode: SimMode
  sessionsPerWeek: number
  weeks: SimWeekSnapshot[]
  milestoneWeeks: Partial<Record<MilestoneKey, number>>
}

export type PersonaSimSuite = {
  mode: SimMode
  weeks: number
  results: PersonaSimResult[]
}

function trackCompletedCount(units: number, unitsPerTrack: number): number {
  return Math.floor(units / unitsPerTrack)
}

export function simulatePersona(
  persona: PersonaId,
  mode: SimMode,
  totalWeeks = 52,
  options?: {
    unitsPerTrack?: number
    maxFirstDrillBonuses?: number
  },
): PersonaSimResult {
  const sessionsPerWeek = PERSONA_WEEKLY_SESSIONS[persona]
  const unitsPerTrack = options?.unitsPerTrack ?? 20
  const maxFirstDrillBonuses = options?.maxFirstDrillBonuses ?? 24

  let xp = 0
  let pux = 0
  let units = 0
  let firstDrillBonuses = 0
  let tracksGranted = 0

  const weeks: SimWeekSnapshot[] = []
  const milestoneWeeks: Partial<Record<MilestoneKey, number>> = {}

  const noteMilestone = (key: MilestoneKey, week: number) => {
    if (milestoneWeeks[key] == null) milestoneWeeks[key] = week
  }

  if (mode === 'realistic_new_user') {
    xp += TRACK0_BUNDLE_XP
    pux += TRACK0_BUNDLE_PUX
  }

  for (let week = 1; week <= totalWeeks; week += 1) {
    for (let session = 0; session < sessionsPerWeek; session += 1) {
      units += 1
      xp += BASE_XP_PER_UNIT
      pux += BASE_PUX_PER_UNIT

      for (const slot of EARLY_SLOT_UNITS) {
        if (units === slot) noteMilestone(`unit_${slot}`, week)
      }

      if (mode === 'realistic_new_user') {
        if (firstDrillBonuses < maxFirstDrillBonuses) {
          xp += FIRST_DRILL_BONUS_XP
          firstDrillBonuses += 1
        }
        if (units % 3 === 0) {
          xp += FULL_GAME_BONUS_XP
          pux += FULL_GAME_BONUS_PUX
        }
      }
    }

    if (mode === 'realistic_new_user') {
      const targetTracks = trackCompletedCount(units, unitsPerTrack)
      while (tracksGranted < targetTracks) {
        tracksGranted += 1
        xp += TRACK_COMPLETED_XP
      }
    }

    const level = getLevelFromXp(xp)
    weeks.push({ week, units, xp, pux, level })

    for (const targetLevel of REFERENCE_LEVELS) {
      if (level >= targetLevel) {
        noteMilestone(`level_${targetLevel}`, week)
      }
    }
  }

  return {
    persona,
    mode,
    sessionsPerWeek,
    weeks,
    milestoneWeeks,
  }
}

export function runPersonaSimSuite(mode: SimMode, totalWeeks = 52): PersonaSimSuite {
  const personas: PersonaId[] = ['locker', 'standard', 'intensive']
  return {
    mode,
    weeks: totalWeeks,
    results: personas.map((persona) => simulatePersona(persona, mode, totalWeeks)),
  }
}

export function formatWeeksDuration(weeks: number | null | undefined): string {
  if (weeks == null) return '—'
  if (weeks < 5) return `${weeks} Wo.`
  const months = weeks / 4.345
  if (months < 2) return `${weeks} Wo.`
  return `${months.toFixed(1)} Mo. (${weeks} Wo.)`
}

/** Phase-2 sanity targets (isolated base, standard persona). */
export const PHASE2_REFERENCE = {
  level5Units: 12,
  level5WeeksStandard: 3,
  level10Units: 42,
  level25Units: 162,
} as const

export function phase2Level5Week(result: PersonaSimResult): number | null {
  return result.milestoneWeeks.level_5 ?? null
}

export function xpForLevel(level: number): number {
  return cumulativeXpForLevel(level)
}
