/**
 * Lab-wide Board Studio presentation — separate from per-scene drafts.
 * Never writes curriculum JSON.
 */

import { BODY_PUCK_LOCAL, puckLocalByBias } from './playerLocalPoint.ts'

export const GLOBAL_PLAYER_DISPLAY_KEY = 'rink-style-lab:player-display:v1'

/** Cool mid gray for Style Lab sticks (geometry unchanged). */
export const STYLE_LAB_STICK_COLOR = '#9CA3AF'

export type GlobalPlayerDisplaySettings = {
  version: 1
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

/** Default = stick blade tip (right-handed design space). */
const DEFAULT_BLADE = puckLocalByBias(1, 'right', 'skater')

export const DEFAULT_GLOBAL_PLAYER_DISPLAY: GlobalPlayerDisplaySettings = {
  version: 1,
  playerScale: 1,
  puckBias: 1,
  puckLocalX: DEFAULT_BLADE.x,
  puckLocalY: DEFAULT_BLADE.y,
}

export function clampPlayerScale(value: number): number {
  if (!Number.isFinite(value)) return 1
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
  // Migrate bias-only v1 payloads → explicit local tip
  const fromBias = puckLocalByBias(puckBias, 'right', 'skater')
  return {
    version: 1,
    playerScale,
    puckBias,
    puckLocalX: hasLocal ? Number(o.puckLocalX) : fromBias.x,
    puckLocalY: hasLocal ? Number(o.puckLocalY) : fromBias.y,
  }
}

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
    version: 1,
    puckBias,
    puckLocalX: local.x,
    puckLocalY: local.y,
  }
}

/** Body-adjacent preset for UI reset. */
export function bodyPuckLocalCanonical(): { x: number; y: number } {
  return { x: BODY_PUCK_LOCAL.x, y: BODY_PUCK_LOCAL.y }
}
