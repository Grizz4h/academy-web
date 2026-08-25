/** Phase 2 piecewise level curve (units ≈ sessions at 100 XP base). */

export const PROGRESSION_CURVE_VERSION = 2

export const BASE_XP_PER_UNIT = 100

/** Units required to advance from `level` → `level + 1`. */
export function unitsRequiredForLevel(level: number): number {
  if (level < 1) return 1
  if (level === 1) return 1
  if (level === 2) return 3
  if (level <= 4) return 4
  if (level <= 9) return 6
  if (level <= 24) return 8
  return 10
}

export function xpRequiredForLevel(level: number): number {
  if (level < 1) return 0
  return unitsRequiredForLevel(level) * BASE_XP_PER_UNIT
}

/** Cumulative XP required to reach the start of `level` (level 1 = 0). */
export function cumulativeXpForLevel(level: number): number {
  if (level <= 1) return 0
  let total = 0
  for (let l = 1; l < level; l += 1) {
    total += xpRequiredForLevel(l)
  }
  return total
}

export function getLevelFromXp(totalXp: number): number {
  const xp = Math.max(0, Math.floor(totalXp || 0))
  let level = 1
  let remaining = xp
  while (remaining >= xpRequiredForLevel(level)) {
    remaining -= xpRequiredForLevel(level)
    level += 1
    if (level > 500) break
  }
  return level
}

/** Legacy curve (v1): 100 × n^1.35 — used only for grandfather migration. */
export function xpRequiredForLevelLegacy(level: number): number {
  if (level < 1) return 0
  return Math.round(BASE_XP_PER_UNIT * Math.pow(level, 1.35))
}

export function getLevelFromXpLegacy(totalXp: number): number {
  const xp = Math.max(0, Math.floor(totalXp || 0))
  let level = 1
  let remaining = xp
  while (remaining >= xpRequiredForLevelLegacy(level)) {
    remaining -= xpRequiredForLevelLegacy(level)
    level += 1
    if (level > 500) break
  }
  return level
}

export type CurveMigrationSlice = {
  xp: number
  progressionCurveVersion?: number
  levelGrandfatherFloor?: number
}

/** Preserve displayed level when switching from legacy curve to capped table. */
export function migrateProgressionCurve(state: CurveMigrationSlice): {
  progressionCurveVersion: number
  levelGrandfatherFloor?: number
} {
  const currentVersion = state.progressionCurveVersion ?? 1
  if (currentVersion >= PROGRESSION_CURVE_VERSION) {
    return {
      progressionCurveVersion: currentVersion,
      levelGrandfatherFloor: state.levelGrandfatherFloor,
    }
  }

  const oldLevel = getLevelFromXpLegacy(state.xp || 0)
  const newLevel = getLevelFromXp(state.xp || 0)
  let levelGrandfatherFloor = state.levelGrandfatherFloor

  if (newLevel < oldLevel) {
    levelGrandfatherFloor = Math.max(levelGrandfatherFloor ?? 1, oldLevel)
  }

  return {
    progressionCurveVersion: PROGRESSION_CURVE_VERSION,
    levelGrandfatherFloor:
      levelGrandfatherFloor && levelGrandfatherFloor > 1 ? levelGrandfatherFloor : undefined,
  }
}

export type LevelProgressView = {
  level: number
  computedLevel: number
  grandfatherFloor?: number
  xpIntoLevel: number
  xpForNextLevel: number
  xpToNextLevel: number
  progress01: number
  totalXp: number
}

export function getXpProgressForLevel(
  totalXp: number,
  options?: { grandfatherFloor?: number },
): LevelProgressView {
  const safeTotal = Math.max(0, Math.floor(totalXp || 0))
  const computedLevel = getLevelFromXp(safeTotal)
  const floor = Math.max(1, options?.grandfatherFloor ?? 1)
  const level = Math.max(computedLevel, floor)

  if (level > computedLevel) {
    const xpForNextLevel = xpRequiredForLevel(level)
    return {
      level,
      computedLevel,
      grandfatherFloor: options?.grandfatherFloor,
      xpIntoLevel: 0,
      xpForNextLevel,
      xpToNextLevel: xpForNextLevel,
      progress01: 0,
      totalXp: safeTotal,
    }
  }

  const floorXp = cumulativeXpForLevel(level)
  const xpIntoLevel = safeTotal - floorXp
  const xpForNextLevel = xpRequiredForLevel(level)
  const xpToNextLevel = Math.max(0, xpForNextLevel - xpIntoLevel)
  const progress01 = xpForNextLevel > 0 ? Math.min(1, xpIntoLevel / xpForNextLevel) : 1

  return {
    level,
    computedLevel,
    grandfatherFloor: options?.grandfatherFloor,
    xpIntoLevel,
    xpForNextLevel,
    xpToNextLevel,
    progress01,
    totalXp: safeTotal,
  }
}

/** Levels crossed when going from previousXp → nextXp (exclusive of starting level). */
export function levelsGainedBetween(previousXp: number, nextXp: number): number[] {
  const from = getLevelFromXp(previousXp)
  const to = getLevelFromXp(nextXp)
  if (to <= from) return []
  const gained: number[] = []
  for (let level = from + 1; level <= to; level += 1) {
    gained.push(level)
  }
  return gained
}
