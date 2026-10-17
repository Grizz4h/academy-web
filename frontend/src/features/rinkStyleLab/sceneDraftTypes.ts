import type { FoundationMarkerTeam, FoundationRinkRegionId } from '../foundation/types'
import type { PlayerHandedness } from './boardStudio/playerVisual.ts'

/**
 * Per-marker lab edit (Foundation ice coords).
 * Scale + puck tip are **global** (`globalPlayerDisplay`) — not stored as scene standards.
 * Legacy draft fields `scale` / `puckPlacement` may still appear in localStorage; loaders ignore them.
 */
export type SceneMarkerEdit = {
  id: FoundationRinkRegionId
  cx: number
  cy: number
  label: string
  team: FoundationMarkerTeam
  rotation: number
  handedness: PlayerHandedness
  hasPuck: boolean
  /**
   * @deprecated Ignored on load/save — global puckLocal is the tip.
   * Kept for older localStorage payloads only.
   */
  puckOffsetX: number
  puckOffsetY: number
  /** @deprecated Ignored on load — global playerScale wins. */
  scale?: number
  /** @deprecated Ignored on load — global puckLocal wins. */
  puckPlacement?: 'body' | 'blade'
}

export type SceneDraftDocument = {
  version: 1
  sceneId: string
  updatedAt: string
  markers: Partial<Record<FoundationRinkRegionId, SceneMarkerEdit>>
}

export type SceneDraftStoreFile = {
  version: 1
  scenes: Record<string, SceneDraftDocument>
}

export type DragTarget =
  | { kind: 'player'; id: FoundationRinkRegionId }
  | { kind: 'puck'; id: FoundationRinkRegionId }

