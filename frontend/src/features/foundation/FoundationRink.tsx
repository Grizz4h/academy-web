import type { FoundationAttackDirection, FoundationRinkRegionId } from './types'
import styles from './FoundationRink.module.css'

type MarkerSpec = {
  id: FoundationRinkRegionId
  cx: number
  cy: number
  label: string
  kind: 'player' | 'puck' | 'zone'
}

const MARKERS: Record<string, MarkerSpec> = {
  goalie_spot: { id: 'goalie_spot', cx: 48, cy: 120, label: 'G', kind: 'player' },
  defense_left: { id: 'defense_left', cx: 110, cy: 85, label: 'LD', kind: 'player' },
  defense_right: { id: 'defense_right', cx: 110, cy: 155, label: 'RD', kind: 'player' },
  center_spot: { id: 'center_spot', cx: 200, cy: 120, label: 'C', kind: 'player' },
  wing_left: { id: 'wing_left', cx: 240, cy: 55, label: 'LW', kind: 'player' },
  wing_right: { id: 'wing_right', cx: 240, cy: 185, label: 'RW', kind: 'player' },
  puck_carrier: { id: 'puck_carrier', cx: 250, cy: 120, label: 'P', kind: 'puck' },
  support_player: { id: 'support_player', cx: 220, cy: 75, label: 'S', kind: 'player' },
}

/** Zone edges meet exactly at the blue lines — no gap, no overlap. */
const ZONE_Y = 20
const ZONE_H = 200
const BLUE_NEAR = 140
const BLUE_FAR = 270
const ICE_LEFT = 20
const ICE_RIGHT = 380

type FoundationRinkProps = {
  attackDirection?: FoundationAttackDirection
  highlightRegions?: FoundationRinkRegionId[]
  interactiveRegions?: FoundationRinkRegionId[]
  selectedRegion?: FoundationRinkRegionId | null
  showMarkers?: FoundationRinkRegionId[]
  onSelectRegion?: (region: FoundationRinkRegionId) => void
  disabled?: boolean
}

function flipX(x: number, attack: FoundationAttackDirection): number {
  return attack === 'left' ? 400 - x : x
}

export default function FoundationRink({
  attackDirection = 'right',
  highlightRegions = [],
  interactiveRegions = [],
  selectedRegion = null,
  showMarkers = [],
  onSelectRegion,
  disabled = false,
}: FoundationRinkProps) {
  const attack = attackDirection
  const isInteractive = (id: FoundationRinkRegionId) =>
    !disabled && interactiveRegions.includes(id) && Boolean(onSelectRegion)

  const regionClass = (id: FoundationRinkRegionId) => {
    const parts = [styles.region]
    if (highlightRegions.includes(id)) parts.push(styles.highlighted)
    if (selectedRegion === id) parts.push(styles.selected)
    if (isInteractive(id)) parts.push(styles.interactive)
    return parts.join(' ')
  }

  const handle = (id: FoundationRinkRegionId) => {
    if (!isInteractive(id) || !onSelectRegion) return
    onSelectRegion(id)
  }

  // Weak side is a half-rink overlay — only when that step actually needs it
  const weakSideActive =
    selectedRegion === 'weak_side'
    || highlightRegions.includes('weak_side')
    || isInteractive('weak_side')

  return (
    <div className={styles.wrap}>
      <svg
        className={styles.svg}
        viewBox="0 0 400 240"
        role="img"
        aria-label="Hockey-Rink zur Regionenauswahl"
      >
        <g transform={attack === 'left' ? 'translate(400,0) scale(-1,1)' : undefined}>
          <rect className={styles.board} x="12" y="12" width="376" height="216" rx="36" />

          {/* Zones: DZ | NZ | OZ — abut at blue lines */}
          <rect
            className={regionClass('defensive_zone')}
            x={ICE_LEFT}
            y={ZONE_Y}
            width={BLUE_NEAR - ICE_LEFT}
            height={ZONE_H}
            onClick={() => handle('defensive_zone')}
          />
          <rect
            className={regionClass('neutral_zone')}
            x={BLUE_NEAR}
            y={ZONE_Y}
            width={BLUE_FAR - BLUE_NEAR}
            height={ZONE_H}
            onClick={() => handle('neutral_zone')}
          />
          <rect
            className={regionClass('offensive_zone')}
            x={BLUE_FAR}
            y={ZONE_Y}
            width={ICE_RIGHT - BLUE_FAR}
            height={ZONE_H}
            onClick={() => handle('offensive_zone')}
          />

          {/* Lines on top of zone fills */}
          <line
            className={`${styles.blueLine} ${regionClass('blue_line_near')}`}
            x1={BLUE_NEAR}
            y1={ZONE_Y}
            x2={BLUE_NEAR}
            y2={ZONE_Y + ZONE_H}
            onClick={() => handle('blue_line_near')}
          />
          <line
            className={`${styles.redLine} ${regionClass('center_line')}`}
            x1="200"
            y1={ZONE_Y}
            x2="200"
            y2={ZONE_Y + ZONE_H}
            onClick={() => handle('center_line')}
          />
          <line
            className={`${styles.blueLine} ${regionClass('blue_line_far')}`}
            x1={BLUE_FAR}
            y1={ZONE_Y}
            x2={BLUE_FAR}
            y2={ZONE_Y + ZONE_H}
            onClick={() => handle('blue_line_far')}
          />
          <line
            className={`${styles.goalLine} ${regionClass('goal_line')}`}
            x1="48"
            y1="70"
            x2="48"
            y2="170"
            onClick={() => handle('goal_line')}
          />
          <line className={styles.goalLine} x1="352" y1="70" x2="352" y2="170" />

          {/* Slot + net front (offensive end) */}
          <rect
            className={regionClass('slot')}
            x="300"
            y="85"
            width="40"
            height="70"
            rx="8"
            onClick={() => handle('slot')}
          />
          <rect
            className={regionClass('net_front')}
            x="332"
            y="100"
            width="18"
            height="40"
            rx="4"
            onClick={() => handle('net_front')}
          />

          {/* Goals */}
          <rect className={styles.goal} x="36" y="105" width="12" height="30" rx="2" />
          <rect className={styles.goal} x="352" y="105" width="12" height="30" rx="2" />

          {/* Faceoff dots */}
          <circle
            className={regionClass('faceoff_dot')}
            cx="85"
            cy="70"
            r="8"
            onClick={() => handle('faceoff_dot')}
          />
          <circle className={styles.dot} cx="85" cy="170" r="8" />
          <circle className={styles.dot} cx="315" cy="70" r="8" />
          <circle className={styles.dot} cx="315" cy="170" r="8" />
          <circle className={styles.dot} cx="200" cy="120" r="10" />

          {weakSideActive && (
            <rect
              className={`${regionClass('weak_side')} ${styles.weakSide}`}
              x={ICE_LEFT}
              y={ZONE_Y}
              width={200 - ICE_LEFT}
              height={ZONE_H}
              onClick={() => handle('weak_side')}
            />
          )}

          {/* Attack arrow hint */}
          <path
            className={styles.attackArrow}
            d="M175 30 L225 30 L215 22 M225 30 L215 38"
            fill="none"
          />
        </g>

        {showMarkers.map((id) => {
          const m = MARKERS[id]
          if (!m) return null
          const cx = flipX(m.cx, attack)
          const cy = m.cy
          const interactive = isInteractive(id)
          return (
            <g
              key={id}
              className={`${styles.marker} ${selectedRegion === id ? styles.markerSelected : ''} ${interactive ? styles.interactive : ''}`}
              onClick={() => handle(id)}
              transform={`translate(${cx}, ${cy})`}
            >
              <circle r={m.kind === 'puck' ? 10 : 14} className={m.kind === 'puck' ? styles.puck : styles.player} />
              <text y={4} textAnchor="middle" className={styles.markerLabel}>
                {m.label}
              </text>
            </g>
          )
        })}
      </svg>

      <div className={styles.legend} aria-hidden="true">
        <span>DZ</span>
        <span>NZ</span>
        <span>OZ</span>
        <span className={styles.legendAttack}>
          Angriff {attack === 'right' ? '→' : '←'}
        </span>
      </div>
    </div>
  )
}
