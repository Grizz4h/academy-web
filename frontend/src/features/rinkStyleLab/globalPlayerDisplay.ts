/**
 * Board Studio player presentation standards + Style Lab experiment storage.
 * Never writes curriculum JSON.
 *
 * Product / rendering authority is BOARD_STUDIO_PLAYER_DISPLAY_STANDARDS.
 * Style Lab may override via localStorage for experiments only (v2 key).
 */

import { BODY_PUCK_LOCAL, puckLocalByBias } from './playerLocalPoint.ts'

/**
 * Lab experiment storage. Bumped to v2 so pre-standard v1 values cannot
 * silently override the freigegebenen Code-Standards.
 */
export const GLOBAL_PLAYER_DISPLAY_KEY = 'rink-style-lab:player-display:v2'

/** Cool mid gray for Board Studio sticks (geometry unchanged). */
export const STYLE_LAB_STICK_COLOR = '#9CA3AF'

export type GlobalPlayerDisplaySettings = {
  version: 2
  /** Shared Board Studio footprint multiplier (0.2–1.5). */
  playerScale: number
  /**
   * Legacy slider along body→blade. Used only when puckLocalX/Y are absent.
   * 0 = body-adjacent, 1 = stick-blade tip.
   */
  puckBias: number
  /**
   * Canonical puck tip in **right-handed** design-space (body center origin).
   * Left-handed markers mirror X on apply. No ice / world coordinates.
   */
  puckLocalX: number
  puckLocalY: number
}

/**
 * Visually freigegebene Darstellung (Rink Style Lab, 2026-10-17).
 * Binding for all Board Studio players when no lab experiment is active.
 */
export const BOARD_STUDIO_PLAYER_DISPLAY_STANDARDS: GlobalPlayerDisplaySettings = {
  version: 2,
  playerScale: 0.6,
  puckBias: 1,
  puckLocalX: 16.130289239097504,
  puckLocalY: -8.270109294088925,
}

/** Alias — code default equals freigegebene Standards. */
export const DEFAULT_GLOBAL_PLAYER_DISPLAY: GlobalPlayerDisplaySettings = {
  ...BOARD_STUDIO_PLAYER_DISPLAY_STANDARDS,
}

export function clampPlayerScale(value: number): number {
  if (!Number.isFinite(value)) return BOARD_STUDIO_PLAYER_DISPLAY_STANDARDS.playerScale
  return Math.min(1.5, Math.max(0.2, value))
}

export function clampPuckBias(value: number): number {
  if (!Number.isFinite(value)) return 1
  return Math.min(1, Math.max(0, value))
}

export function normalizeGlobalPlayerDisplay(
  raw: unknown,
): GlobalPlayerDisplaySettings {
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_GLOBAL_PLAYER_DISPLAY }
  const o = raw as Record<string, unknown>
  const playerScale = clampPlayerScale(
    typeof o.playerScale === 'number' ? o.playerScale : DEFAULT_GLOBAL_PLAYER_DISPLAY.playerScale,
  )
  const puckBias = clampPuckBias(
    typeof o.puckBias === 'number' ? o.puckBias : DEFAULT_GLOBAL_PLAYER_DISPLAY.puckBias,
  )
  const hasLocal =
    typeof o.puckLocalX === 'number' && Number.isFinite(o.puckLocalX)
    && typeof o.puckLocalY === 'number' && Number.isFinite(o.puckLocalY)
  // Bias-only payloads → explicit local tip (lab experiments)
  const fromBias = puckLocalByBias(puckBias, 'right', 'skater')
  return {
    version: 2,
    playerScale,
    puckBias,
    puckLocalX: hasLocal ? Number(o.puckLocalX) : fromBias.x,
    puckLocalY: hasLocal ? Number(o.puckLocalY) : fromBias.y,
  }
}

/**
 * Style Lab only: optional experiment override from v2 storage.
 * Missing / corrupt / empty → code standards (never legacy v1).
 */
export function readGlobalPlayerDisplay(
  storage: Pick<Storage, 'getItem'> = localStorage,
): GlobalPlayerDisplaySettings {
  try {
    const raw = storage.getItem(GLOBAL_PLAYER_DISPLAY_KEY)
    if (!raw) return { ...DEFAULT_GLOBAL_PLAYER_DISPLAY }
    return normalizeGlobalPlayerDisplay(JSON.parse(raw))
  } catch {
    return { ...DEFAULT_GLOBAL_PLAYER_DISPLAY }
  }
}

/**
 * Raw stored fields for Dev inspect — never substitutes code defaults.
 * Missing / non-finite numbers → null ("Nicht gespeichert").
 */
export type StoredGlobalDisplayFields = {
  playerScale: number | null
  puckLocalX: number | null
  puckLocalY: number | null
  /** Storage key present and JSON parsed as object. */
  hasKey: boolean
}

function finiteNumberOrNull(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

export function readStoredGlobalDisplayFields(
  storage: Pick<Storage, 'getItem'> = localStorage,
): StoredGlobalDisplayFields {
  const empty: StoredGlobalDisplayFields = {
    playerScale: null,
    puckLocalX: null,
    puckLocalY: null,
    hasKey: false,
  }
  try {
    const raw = storage.getItem(GLOBAL_PLAYER_DISPLAY_KEY)
    if (!raw) return empty
    const parsed: unknown = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') {
      return { ...empty, hasKey: true }
    }
    const o = parsed as Record<string, unknown>
    return {
      hasKey: true,
      playerScale: finiteNumberOrNull(o.playerScale),
      puckLocalX: finiteNumberOrNull(o.puckLocalX),
      puckLocalY: finiteNumberOrNull(o.puckLocalY),
    }
  } catch {
    return empty
  }
}

/** Exact decimal form for display/copy (no toFixed rounding). */
export function formatStoredNumber(value: number): string {
  return JSON.stringify(value)
}

export function formatStoredGlobalDisplayCopyPayload(
  fields: StoredGlobalDisplayFields,
): string {
  return `${JSON.stringify(
    {
      playerScale: fields.playerScale,
      puckLocalX: fields.puckLocalX,
      puckLocalY: fields.puckLocalY,
    },
    null,
    2,
  )}\n`
}

export function writeGlobalPlayerDisplay(
  settings: GlobalPlayerDisplaySettings,
  storage: Pick<Storage, 'setItem'> = localStorage,
): void {
  const normalized = normalizeGlobalPlayerDisplay(settings)
  storage.setItem(GLOBAL_PLAYER_DISPLAY_KEY, JSON.stringify(normalized))
}

/** Apply bias preset into explicit local tip (right-handed). */
export function globalDisplayWithPuckBias(
  settings: GlobalPlayerDisplaySettings,
  bias: number,
): GlobalPlayerDisplaySettings {
  const puckBias = clampPuckBias(bias)
  const local = puckLocalByBias(puckBias, 'right', 'skater')
  return {
    ...settings,
    version: 2,
    puckBias,
    puckLocalX: local.x,
    puckLocalY: local.y,
  }
}

/** Body-adjacent preset for UI reset. */
export function bodyPuckLocalCanonical(): { x: number; y: number } {
  return { x: BODY_PUCK_LOCAL.x, y: BODY_PUCK_LOCAL.y }
}

/** Canonical puck tip from freigegebene Standards. */
export function standardPuckLocal(): { x: number; y: number } {
  return {
    x: BOARD_STUDIO_PLAYER_DISPLAY_STANDARDS.puckLocalX,
    y: BOARD_STUDIO_PLAYER_DISPLAY_STANDARDS.puckLocalY,
  }
}
