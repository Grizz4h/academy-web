export type CapabilityBand = {
  id: string
  label: string
  min: number
  max: number
}

export const CAPABILITY_BANDS: readonly CapabilityBand[] = [
  { min: 0, max: 20, id: 'exposure', label: 'Exposure' },
  { min: 21, max: 40, id: 'recognition', label: 'Recognition' },
  { min: 41, max: 60, id: 'connection', label: 'Connection' },
  { min: 61, max: 80, id: 'integration', label: 'Integration' },
  { min: 81, max: 100, id: 'analytical_transfer', label: 'Analytical Transfer' },
] as const

export function capabilityBandForScore(score: number): CapabilityBand | null {
  const clamped = Math.max(0, Math.min(100, score))
  return CAPABILITY_BANDS.find((band) => clamped >= band.min && clamped <= band.max) ?? null
}
