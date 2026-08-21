export type DrillRendererVersion = 'v2' | 'v4'

type DrillLike = {
  drill_type?: string
  config?: {
    mechanic?: string
    mode?: string
  }
}

/**
 * Product rendering is V2 + feature modules + curriculum config.
 * Track letters do not select a renderer.
 *
 * - V4: Meta-Scan only (parked; may later fold into V2 + config)
 * - V2: every other drill, including A1–E and Track 0
 */
export function pickRendererVersion(moduleId?: string, drill?: DrillLike | null): DrillRendererVersion {
  const type = String(drill?.drill_type || '').toLowerCase()

  if (type === 'meta_scan' || moduleId?.startsWith('M') || moduleId?.includes('META')) {
    return 'v4'
  }

  return 'v2'
}

/** @deprecated Prefer pickRendererVersion; kept for callers/tests that check V2 eligibility. */
export function usesV2DrillRenderer(drill?: DrillLike | null): boolean {
  if (!drill) return false
  return pickRendererVersion(undefined, drill) === 'v2'
}
