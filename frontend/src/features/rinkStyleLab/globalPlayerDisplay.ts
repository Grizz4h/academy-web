/**
 * Lab-wide Board Studio presentation — separate from per-scene drafts.
 * Never writes curriculum JSON.
 */

export const GLOBAL_PLAYER_DISPLAY_KEY = 'rink-style-lab:player-display:v1'

/** Cool mid gray for Style Lab sticks (geometry unchanged). */
export const STYLE_LAB_STICK_COLOR = '#9CA3AF'

export type GlobalPlayerDisplaySettings = {
  version: 1
  /** Shared Board Studio footprint multiplier (0.2–1.5). */
  playerScale: number
  /**
   * Puck tip along body→blade in design space.
   * 0 = body-adjacent local, 1 = stick-blade tip.
   */
  puckBias: number
}

export const DEFAULT_GLOBAL_PLAYER_DISPLAY: GlobalPlayerDisplaySettings = {
  version: 1,
  playerScale: 1,
  puckBias: 1,
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
  return {
    version: 1,
    playerScale: clampPlayerScale(
      typeof o.playerScale === 'number' ? o.playerScale : DEFAULT_GLOBAL_PLAYER_DISPLAY.playerScale,
    ),
    puckBias: clampPuckBias(
      typeof o.puckBias === 'number' ? o.puckBias : DEFAULT_GLOBAL_PLAYER_DISPLAY.puckBias,
    ),
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
