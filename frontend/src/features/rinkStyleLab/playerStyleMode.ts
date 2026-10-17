export type PlayerStyleMode = 'legacy' | 'boardStudio'

export function isPlayerStyleMode(value: unknown): value is PlayerStyleMode {
  return value === 'legacy' || value === 'boardStudio'
}
