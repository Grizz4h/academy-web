import t0Track from '../../../../data/academy/foundation/t0-track.json'
import { extractFoundationScenes, type FoundationScene } from './foundationScenes'

/** Live catalog from Track 0 JSON (read-only — curriculum not mutated). */
export const FOUNDATION_SCENES: FoundationScene[] = extractFoundationScenes(t0Track)

export function getFoundationScene(id: string): FoundationScene | undefined {
  return FOUNDATION_SCENES.find((s) => s.id === id)
}
