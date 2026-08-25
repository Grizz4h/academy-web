/** Phase 5 — unified server-evaluated base grants (default-on). Set VITE_PROGRESSION_UNIFIED_PIPELINE=0 to opt out. */
export function isUnifiedProgressionPipeline(): boolean {
  const flag =
    typeof import.meta !== 'undefined' && import.meta.env
      ? import.meta.env.VITE_PROGRESSION_UNIFIED_PIPELINE
      : undefined
  if (flag === '0' || flag === 'false' || flag === 'no' || flag === 'off') return false
  return true
}
