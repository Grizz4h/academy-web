export type DrillRendererVersion = 'v1' | 'v2' | 'v3' | 'v4'

type DrillLike = {
  drill_type?: string
  config?: {
    mechanic?: string
    mode?: string
  }
}

/**
 * Renderer selection is mechanic-driven, not track-letter-driven.
 *
 * - V4: Meta-Scan
 * - V1: A1 legacy only
 * - V2: everything else (including Track E period_checkin + modern mechanics)
 * - V3: deprecated leftover from piece-wise ChatGPT iteration; no longer selected
 */
export function pickRendererVersion(moduleId?: string, drill?: DrillLike | null): DrillRendererVersion {
  const type = String(drill?.drill_type || '').toLowerCase()

  if (type === 'meta_scan' || moduleId?.startsWith('M') || moduleId?.includes('META')) {
    return 'v4'
  }

  // A1 remains on the frozen legacy renderer.
  if (moduleId === 'A1') {
    return 'v1'
  }

  return 'v2'
}

/** @deprecated Prefer pickRendererVersion; kept for callers/tests that check V2 eligibility. */
export function usesV2DrillRenderer(drill?: DrillLike | null): boolean {
  if (!drill) return false
  return pickRendererVersion(undefined, drill) === 'v2'
}
