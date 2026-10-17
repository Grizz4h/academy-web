import type { FoundationMarkerOverride, FoundationRinkRegionId } from '../foundation/types'
import { DETAILED_ICE, FOUNDATION_ICE, FOUNDATION_VIEWBOX } from './labGeometry'
import styles from './SceneMarkers.module.css'

type Props = {
  space: 'foundation' | 'detailed'
  showMarkers: FoundationRinkRegionId[]
  markerOverrides: Partial<Record<FoundationRinkRegionId, FoundationMarkerOverride>>
}

/** Map Foundation marker coords into Detailed ice space (same relative placement). */
function mapToDetailed(cx: number, cy: number): { x: number; y: number } {
  const nx = (cx - FOUNDATION_ICE.x) / FOUNDATION_ICE.w
  const ny = (cy - FOUNDATION_ICE.y) / FOUNDATION_ICE.h
  return {
    x: DETAILED_ICE.x + nx * DETAILED_ICE.w,
    y: DETAILED_ICE.y + ny * DETAILED_ICE.h,
  }
}

const DEFAULTS: Record<string, { cx: number; cy: number; label: string; team?: string; hasPuck?: boolean }> = {
  puck_carrier: { cx: 250, cy: 120, label: 'Spieler', team: 'blue', hasPuck: true },
  support_player: { cx: 220, cy: 75, label: 'Mitspieler', team: 'blue' },
  wing_left: { cx: 240, cy: 55, label: 'Flügel', team: 'blue' },
  wing_right: { cx: 240, cy: 185, label: 'Flügel', team: 'blue' },
  defense_left: { cx: 110, cy: 85, label: 'Verteidiger', team: 'red' },
  goalie_spot: { cx: 48, cy: 120, label: 'Torwart', team: 'blue' },
}

/**
 * Lab scene layer for Detailed stage — reuses Foundation marker positions,
 * does not define a new rink geometry.
 */
export function SceneMarkers({ space, showMarkers, markerOverrides }: Props) {
  const scale = space === 'detailed' ? DETAILED_ICE.w / FOUNDATION_ICE.w : 1
  const r = space === 'detailed' ? 14 * (DETAILED_ICE.h / FOUNDATION_ICE.h) : 12

  return (
    <g className={styles.scene} aria-label="Scene markers">
      {showMarkers.map((id) => {
        const def = DEFAULTS[id] || { cx: FOUNDATION_VIEWBOX.width / 2, cy: FOUNDATION_VIEWBOX.height / 2, label: id }
        const ov = markerOverrides[id] || {}
        const cx = ov.cx ?? def.cx
        const cy = ov.cy ?? def.cy
        const label = ov.label ?? def.label
        const team = ov.team ?? def.team ?? 'blue'
        const hasPuck = ov.hasPuck ?? def.hasPuck ?? false
        const pos = space === 'detailed' ? mapToDetailed(cx, cy) : { x: cx, y: cy }
        const teamClass = team === 'red' ? styles.red : team === 'neutral' ? styles.neutral : styles.blue
        return (
          <g key={id} transform={`translate(${pos.x}, ${pos.y})`}>
            <circle r={r} className={teamClass} />
            {hasPuck && (
              <circle
                className={styles.puck}
                r={space === 'detailed' ? 7 : 5}
                cx={r * 0.75}
                cy={r * 0.55}
              />
            )}
            <text y={r + 14 * scale} textAnchor="middle" className={styles.caption}>
              {label}
            </text>
          </g>
        )
      })}
    </g>
  )
}
