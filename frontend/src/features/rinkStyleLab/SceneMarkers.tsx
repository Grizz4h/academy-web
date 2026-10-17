import type { FoundationMarkerOverride, FoundationRinkRegionId } from '../foundation/types'
import { HockeyPlayer } from './boardStudio/HockeyPlayer.tsx'
import { resolveSceneMarkers } from './foundationCoordAdapter'
import type { PlayerStyleMode } from './playerStyleMode.ts'
import styles from './SceneMarkers.module.css'

type Props = {
  space: 'foundation' | 'detailed'
  showMarkers: FoundationRinkRegionId[]
  markerOverrides: Partial<Record<FoundationRinkRegionId, FoundationMarkerOverride>>
  /** Phase 3 — Phase-1/2 circle tokens vs Board Studio compound SVG. */
  playerFigureStyle?: PlayerStyleMode
}

function teamToColor(team: 'blue' | 'red' | 'neutral'): string {
  if (team === 'red') return 'red'
  if (team === 'neutral') return 'black'
  return 'blue'
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
}: Props) {
  const markers = resolveSceneMarkers(showMarkers, markerOverrides, space)
  const useBoardStudio = playerFigureStyle === 'boardStudio'

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
          // Design-space body ~12 units tall; match prior circle footprint.
          const scale = m.radius / 12
          return (
            <g key={m.id}>
              <HockeyPlayer
                id={`scene-${m.id}`}
                teamColor={teamToColor(m.team)}
                number={m.label || ''}
                rotation={0}
                showStick
                x={m.x}
                y={m.y}
                scale={scale}
              />
              {m.hasPuck ? (
                <circle
                  className={styles.puck}
                  r={Math.max(4, m.radius * 0.42)}
                  cx={m.x + m.radius * 0.72}
                  cy={m.y + m.radius * 0.55}
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
