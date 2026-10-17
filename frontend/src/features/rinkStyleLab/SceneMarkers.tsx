import type { PointerEvent as ReactPointerEvent } from 'react'
import type { FoundationRinkRegionId } from '../foundation/types'
import { HockeyPlayer } from './boardStudio/HockeyPlayer.tsx'
import {
  foundationPointToDetailed,
  foundationScaleToDetailed,
} from './foundationCoordAdapter'
import { clampPlayerScale } from './globalPlayerDisplay.ts'
import { resolveScenePuckPoint } from './playerLocalPoint.ts'
import type { PlayerStyleMode } from './playerStyleMode.ts'
import type { SceneMarkerEdit } from './sceneDraftTypes.ts'
import styles from './SceneMarkers.module.css'

export type PuckDragPreview = {
  id: FoundationRinkRegionId
  /** Detailed SVG offset from the global tip (session-only until adopted). */
  dx: number
  dy: number
}

type Props = {
  space: 'foundation' | 'detailed'
  markerEdits: Partial<Record<FoundationRinkRegionId, SceneMarkerEdit>>
  playerFigureStyle?: PlayerStyleMode
  /** Shared Board Studio size (global). */
  globalPlayerScale?: number
  /** Canonical right-handed design-space puck tip (global). */
  globalPuckLocal?: { x: number; y: number }
  /** Session drag preview — not persisted to scene drafts. */
  puckDragPreview?: PuckDragPreview | null
  /** Lab scene editor — select / drag */
  editable?: boolean
  selectedId?: FoundationRinkRegionId | null
  selectedPuckId?: FoundationRinkRegionId | null
  onSelectPlayer?: (id: FoundationRinkRegionId) => void
  onSelectPuck?: (id: FoundationRinkRegionId) => void
  onPointerDownPlayer?: (id: FoundationRinkRegionId, e: ReactPointerEvent) => void
  onPointerDownPuck?: (id: FoundationRinkRegionId, e: ReactPointerEvent) => void
}

function teamToColor(team: 'blue' | 'red' | 'neutral'): string {
  if (team === 'red') return 'red'
  if (team === 'neutral') return 'black'
  return 'blue'
}

function markerRadius(space: 'foundation' | 'detailed'): number {
  if (space === 'detailed') {
    return 12 * foundationScaleToDetailed() * 0.85
  }
  return 12
}

/**
 * Scene layer: players / puck from per-marker lab edits (Foundation positions).
 */
export function SceneMarkers({
  space,
  markerEdits,
  playerFigureStyle = 'legacy',
  globalPlayerScale = 1,
  globalPuckLocal,
  puckDragPreview = null,
  editable = false,
  selectedId = null,
  selectedPuckId = null,
  onSelectPlayer,
  onSelectPuck,
  onPointerDownPlayer,
  onPointerDownPuck,
}: Props) {
  const useBoardStudio = playerFigureStyle === 'boardStudio'
  const baseR = markerRadius(space)
  const scaleMul = clampPlayerScale(globalPlayerScale)
  const entries = Object.values(markerEdits).filter(Boolean) as SceneMarkerEdit[]

  return (
    <g className={styles.scene} aria-label="Scene markers">
      {entries.map((edit) => {
        const pos = space === 'detailed'
          ? foundationPointToDetailed(edit.cx, edit.cy)
          : { x: edit.cx, y: edit.cy }
        const teamClass = edit.team === 'red' ? styles.red : edit.team === 'neutral' ? styles.neutral : styles.blue
        const captionY = baseR + (space === 'detailed' ? 16 : 14)
        const selected = selectedId === edit.id
        const puckSelected = selectedPuckId === edit.id

        if (useBoardStudio) {
          const outerScale = (baseR / 12) * scaleMul
          const puckR = Math.max(4, baseR * 0.42 * scaleMul)
          const tip = edit.hasPuck
            ? resolveScenePuckPoint({
                anchorX: pos.x,
                anchorY: pos.y,
                rotationDegrees: edit.rotation,
                outerScale,
                handedness: edit.handedness,
                puckLocal: globalPuckLocal,
                puckBias: 1,
              })
            : null
          const preview =
            puckDragPreview && puckDragPreview.id === edit.id
              ? puckDragPreview
              : null
          const puckPos = tip
            ? {
                x: tip.x + (preview?.dx || 0),
                y: tip.y + (preview?.dy || 0),
              }
            : null

          return (
            <g key={edit.id} data-marker-id={edit.id}>
              {selected ? (
                <circle
                  className={styles.selection}
                  cx={pos.x}
                  cy={pos.y}
                  r={baseR * scaleMul + 10}
                />
              ) : null}
              <g
                className={editable ? styles.interactive : undefined}
                onClick={(e) => {
                  if (!editable) return
                  e.stopPropagation()
                  onSelectPlayer?.(edit.id)
                }}
                onPointerDown={(e) => {
                  if (!editable) return
                  e.stopPropagation()
                  onPointerDownPlayer?.(edit.id, e)
                }}
              >
                <HockeyPlayer
                  id={`scene-${edit.id}`}
                  teamColor={teamToColor(edit.team)}
                  number={edit.label || ''}
                  rotation={edit.rotation}
                  showStick
                  x={pos.x}
                  y={pos.y}
                  scale={outerScale}
                  handedness={edit.handedness}
                />
                {/* Invisible hit target — compound SVG has no large fill */}
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={Math.max(18, baseR * scaleMul)}
                  fill="transparent"
                  className={editable ? styles.hitTarget : undefined}
                />
              </g>
              {puckPos ? (
                <g
                  className={editable ? styles.interactive : undefined}
                  onClick={(e) => {
                    if (!editable) return
                    e.stopPropagation()
                    onSelectPuck?.(edit.id)
                  }}
                  onPointerDown={(e) => {
                    if (!editable) return
                    e.stopPropagation()
                    onPointerDownPuck?.(edit.id, e)
                  }}
                >
                  {puckSelected ? (
                    <circle
                      className={styles.selection}
                      cx={puckPos.x}
                      cy={puckPos.y}
                      r={puckR + 6}
                    />
                  ) : null}
                  <circle
                    className={styles.puck}
                    r={puckR}
                    cx={puckPos.x}
                    cy={puckPos.y}
                    data-puck-placement={edit.puckPlacement}
                  />
                </g>
              ) : null}
            </g>
          )
        }

        return (
          <g
            key={edit.id}
            transform={`translate(${pos.x}, ${pos.y})`}
            className={editable ? styles.interactive : undefined}
            onClick={(e) => {
              if (!editable) return
              e.stopPropagation()
              onSelectPlayer?.(edit.id)
            }}
            onPointerDown={(e) => {
              if (!editable) return
              e.stopPropagation()
              onPointerDownPlayer?.(edit.id, e)
            }}
          >
            {selected ? <circle className={styles.selection} r={baseR + 8} /> : null}
            <circle r={baseR} className={teamClass} />
            {edit.hasPuck ? (
              <circle
                className={styles.puck}
                r={Math.max(4, baseR * 0.42)}
                cx={baseR * 0.72}
                cy={baseR * 0.55}
                onClick={(e) => {
                  if (!editable) return
                  e.stopPropagation()
                  onSelectPuck?.(edit.id)
                }}
                onPointerDown={(e) => {
                  if (!editable || !useBoardStudio) return
                  e.stopPropagation()
                  onPointerDownPuck?.(edit.id, e)
                }}
              />
            ) : null}
            <text y={captionY} textAnchor="middle" className={styles.caption}>
              {edit.label}
            </text>
          </g>
        )
      })}
    </g>
  )
}
