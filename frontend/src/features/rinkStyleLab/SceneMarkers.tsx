import type { FoundationMarkerOverride, FoundationRinkRegionId } from '../foundation/types'
import { resolveSceneMarkers } from './foundationCoordAdapter'
import styles from './SceneMarkers.module.css'

type Props = {
  space: 'foundation' | 'detailed'
  showMarkers: FoundationRinkRegionId[]
  markerOverrides: Partial<Record<FoundationRinkRegionId, FoundationMarkerOverride>>
}

/**
 * Scene layer: players / puck. Positions come from Foundation coords via adapter
 * when space === 'detailed'.
 */
export function SceneMarkers({ space, showMarkers, markerOverrides }: Props) {
  const markers = resolveSceneMarkers(showMarkers, markerOverrides, space)

  return (
    <g className={styles.scene} aria-label="Scene markers">
      {markers.map((m) => {
        const teamClass = m.team === 'red' ? styles.red : m.team === 'neutral' ? styles.neutral : styles.blue
        const lonePuck = m.kind === 'puck'
        return (
          <g key={m.id} transform={`translate(${m.x}, ${m.y})`}>
            {!lonePuck && <circle r={m.radius} className={teamClass} />}
            {(m.hasPuck || lonePuck) && (
              <circle
                className={styles.puck}
                r={lonePuck ? m.radius : Math.max(4, m.radius * 0.42)}
                cx={lonePuck ? 0 : m.radius * 0.72}
                cy={lonePuck ? 0 : m.radius * 0.55}
              />
            )}
            <text y={m.radius + (space === 'detailed' ? 16 : 14)} textAnchor="middle" className={styles.caption}>
              {m.label}
            </text>
          </g>
        )
      })}
    </g>
  )
}
