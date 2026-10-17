import type { FoundationMarkerTeam, FoundationRinkRegionId } from '../foundation/types'
import type { PlayerHandedness } from './boardStudio/playerVisual.ts'
import type { PlayerPuckPlacement } from './playerLocalPoint.ts'

/** Per-marker lab edit (Foundation ice coords for position — matches curriculum shape). */
export type SceneMarkerEdit = {
  id: FoundationRinkRegionId
  cx: number
  cy: number
  label: string
  team: FoundationMarkerTeam
  rotation: number
  /** Multiplier on footprint scale (0.2–1.5). */
  scale: number
  handedness: PlayerHandedness
  hasPuck: boolean
  /** Default puck tip: body vs stick blade (not compare in drafts). */
  puckPlacement: Exclude<PlayerPuckPlacement, 'compare'>
  /**
   * Offset from default tip in Detailed SVG units after placement transform.
   * (0,0) = puck sits on body/blade tip.
   */
  puckOffsetX: number
  puckOffsetY: number
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
