import type { FoundationMarkerOverride, FoundationRinkRegionId } from '../foundation/types'
import { HockeyPlayer } from './boardStudio/HockeyPlayer.tsx'
import type { PlayerHandedness } from './boardStudio/playerVisual.ts'
import { resolveSceneMarkers } from './foundationCoordAdapter'
import {
  resolveScenePuckPoint,
  type PlayerPuckPlacement,
} from './playerLocalPoint.ts'
import type { PlayerStyleMode } from './playerStyleMode.ts'
import styles from './SceneMarkers.module.css'

type Props = {
  space: 'foundation' | 'detailed'
  showMarkers: FoundationRinkRegionId[]
  markerOverrides: Partial<Record<FoundationRinkRegionId, FoundationMarkerOverride>>
  /** Phase 3 — Phase-1/2 circle tokens vs Board Studio compound SVG. */
  playerFigureStyle?: PlayerStyleMode
  /** Multiplier on footprint scale (radius/12). Default 1. Range typically 0.2–1.5. */
  playerScale?: number
  /** Body facing degrees (SVG clockwise). Labels stay upright via HockeyPlayer overlays. */
  playerRotation?: number
  playerHandedness?: PlayerHandedness
  /** Board Studio only — body vs stick-blade puck (or both for compare). */
  puckPlacement?: PlayerPuckPlacement
}

function teamToColor(team: 'blue' | 'red' | 'neutral'): string {
  if (team === 'red') return 'red'
  if (team === 'neutral') return 'black'
  return 'blue'
}

function clampScale(value: number | undefined): number {
  if (!Number.isFinite(value)) return 1
  return Math.min(1.5, Math.max(0.2, Number(value)))
}

/**
 * Scene layer: players / puck. Positions come from Foundation coords via adapter
 * when space === 'detailed'.
 */
export function SceneMarkers({
  space,
  showMarkers,
  markerOverrides,
  playerFigureStyle = 'legacy',
  playerScale = 1,
  playerRotation = 0,
  playerHandedness = 'right',
  puckPlacement = 'body',
}: Props) {
  const markers = resolveSceneMarkers(showMarkers, markerOverrides, space)
  const useBoardStudio = playerFigureStyle === 'boardStudio'
  const scaleMul = clampScale(playerScale)
  const rotation = Number.isFinite(playerRotation) ? playerRotation : 0

  return (
    <g className={styles.scene} aria-label="Scene markers">
      {markers.map((m) => {
        const teamClass = m.team === 'red' ? styles.red : m.team === 'neutral' ? styles.neutral : styles.blue
        const lonePuck = m.kind === 'puck'
        const captionY = m.radius + (space === 'detailed' ? 16 : 14)

        if (lonePuck) {
          return (
            <g key={m.id} transform={`translate(${m.x}, ${m.y})`}>
              <circle className={styles.puck} r={m.radius} cx={0} cy={0} />
              <text y={captionY} textAnchor="middle" className={styles.caption}>
                {m.label}
              </text>
            </g>
          )
        }

        if (useBoardStudio) {
          // Design-space body ~12 units tall; match prior circle footprint, then lab multiplier.
          const outerScale = (m.radius / 12) * scaleMul
          const puckR = Math.max(4, m.radius * 0.42 * scaleMul)
          const showBody = puckPlacement === 'body' || puckPlacement === 'compare'
          const showBlade = puckPlacement === 'blade' || puckPlacement === 'compare'
          const bodyPuck = m.hasPuck && showBody
            ? resolveScenePuckPoint({
                anchorX: m.x,
                anchorY: m.y,
                rotationDegrees: rotation,
                outerScale,
                handedness: playerHandedness,
                placement: 'body',
              })
            : null
          const bladePuck = m.hasPuck && showBlade
            ? resolveScenePuckPoint({
                anchorX: m.x,
                anchorY: m.y,
                rotationDegrees: rotation,
                outerScale,
                handedness: playerHandedness,
                placement: 'blade',
              })
            : null

          return (
            <g key={m.id}>
              <HockeyPlayer
                id={`scene-${m.id}`}
                teamColor={teamToColor(m.team)}
                number={m.label || ''}
                rotation={rotation}
                showStick
                x={m.x}
                y={m.y}
                scale={outerScale}
                handedness={playerHandedness}
              />
              {bodyPuck ? (
                <circle
                  className={styles.puck}
                  r={puckR}
                  cx={bodyPuck.x}
                  cy={bodyPuck.y}
                  opacity={puckPlacement === 'compare' ? 0.45 : 1}
                  data-puck-placement="body"
                />
              ) : null}
              {bladePuck ? (
                <circle
                  className={puckPlacement === 'compare' ? styles.puckBlade : styles.puck}
                  r={puckR}
                  cx={bladePuck.x}
                  cy={bladePuck.y}
                  data-puck-placement="blade"
                />
              ) : null}
            </g>
          )
        }

        return (
          <g key={m.id} transform={`translate(${m.x}, ${m.y})`}>
            <circle r={m.radius} className={teamClass} />
            {m.hasPuck ? (
              <circle
                className={styles.puck}
                r={Math.max(4, m.radius * 0.42)}
                cx={m.radius * 0.72}
                cy={m.radius * 0.55}
              />
            ) : null}
            <text y={captionY} textAnchor="middle" className={styles.caption}>
              {m.label}
            </text>
          </g>
        )
      })}
    </g>
  )
}
