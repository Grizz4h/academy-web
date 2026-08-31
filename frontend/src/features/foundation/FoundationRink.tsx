import type {
  FoundationAttackDirection,
  FoundationMarkerOverride,
  FoundationMarkerTeam,
  FoundationRinkRegionId,
} from './types'
import styles from './FoundationRink.module.css'

type MarkerSpec = {
  id: FoundationRinkRegionId
  cx: number
  cy: number
  label: string
  kind: 'player' | 'puck' | 'zone'
  team?: FoundationMarkerTeam
  hasPuck?: boolean
}

const MARKERS: Record<string, MarkerSpec> = {
  goalie_spot: { id: 'goalie_spot', cx: 48, cy: 120, label: 'Torwart', kind: 'player', team: 'blue' },
  defense_left: { id: 'defense_left', cx: 110, cy: 85, label: 'Verteidiger', kind: 'player', team: 'red' },
  defense_right: { id: 'defense_right', cx: 110, cy: 155, label: 'Verteidiger', kind: 'player', team: 'red' },
  center_spot: { id: 'center_spot', cx: 200, cy: 120, label: 'Center', kind: 'player', team: 'blue' },
  wing_left: { id: 'wing_left', cx: 240, cy: 55, label: 'Flügel', kind: 'player', team: 'blue' },
  wing_right: { id: 'wing_right', cx: 240, cy: 185, label: 'Flügel', kind: 'player', team: 'blue' },
  // Recognition cue = attached puck, not the word "Puckführer"
  puck_carrier: { id: 'puck_carrier', cx: 250, cy: 120, label: 'Spieler', kind: 'player', team: 'blue', hasPuck: true },
  support_player: { id: 'support_player', cx: 220, cy: 75, label: 'Mitspieler', kind: 'player', team: 'blue' },
}

/** Zone edges meet exactly at the blue lines — no gap, no overlap.
 *  Same tactical NZ compression as the academy detailed rink (~38% / 24% / 38%). */
const ZONE_Y = 20
const ZONE_H = 200
const ICE_LEFT = 20
const ICE_RIGHT = 380
const BLUE_NEAR = ICE_LEFT + (ICE_RIGHT - ICE_LEFT) * 0.38
const BLUE_FAR = ICE_LEFT + (ICE_RIGHT - ICE_LEFT) * 0.62

type FoundationRinkProps = {
  attackDirection?: FoundationAttackDirection
  highlightRegions?: FoundationRinkRegionId[]
  interactiveRegions?: FoundationRinkRegionId[]
  selectedRegion?: FoundationRinkRegionId | null
  showMarkers?: FoundationRinkRegionId[]
  markerOverrides?: Partial<Record<FoundationRinkRegionId, FoundationMarkerOverride>>
  weakSideBand?: 'top' | 'bottom'
  hideAttackArrow?: boolean
  onSelectRegion?: (region: FoundationRinkRegionId) => void
  disabled?: boolean
}

function flipX(x: number, attack: FoundationAttackDirection): number {
  return attack === 'left' ? 400 - x : x
}

function teamClass(team: FoundationMarkerTeam | undefined, kind: MarkerSpec['kind']): string {
  if (kind === 'puck') return styles.puck
  if (team === 'red') return styles.playerRed
  if (team === 'blue') return styles.playerBlue
  return styles.player
}

export default function FoundationRink({
  attackDirection = 'right',
  highlightRegions = [],
  interactiveRegions = [],
  selectedRegion = null,
  showMarkers = [],
  markerOverrides = {},
  weakSideBand = 'top',
  hideAttackArrow = false,
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

  // Only reveal weak-side overlay after selection / correct feedback — never while merely tappable
  const weakSideActive =
    selectedRegion === 'weak_side'
    || highlightRegions.includes('weak_side')

  const weakY = weakSideBand === 'bottom' ? ZONE_Y + ZONE_H / 2 : ZONE_Y
  const showDirectionArrow = !hideAttackArrow && showMarkers.length === 0

  const resolvedMarkers = showMarkers.map((id) => {
    const base = MARKERS[id]
    if (!base) return null
    const override = markerOverrides[id] || {}
    const kind = override.kind ?? base.kind
    const hasPuck = override.hasPuck ?? base.hasPuck ?? kind === 'puck'
    return {
      ...base,
      cx: override.cx ?? base.cx,
      cy: override.cy ?? base.cy,
      label: override.label ?? base.label,
      team: override.team ?? base.team,
      kind,
      hasPuck: kind === 'puck' ? true : Boolean(hasPuck),
    }
  }).filter(Boolean) as MarkerSpec[]

  const hasTeams = resolvedMarkers.some((m) => m.team === 'blue' || m.team === 'red')
  const hasPuckLegend = resolvedMarkers.some((m) => m.hasPuck)

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

          <rect className={styles.goal} x="36" y="105" width="12" height="30" rx="2" />
          <rect className={styles.goal} x="352" y="105" width="12" height="30" rx="2" />

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
              y={weakY}
              width={ICE_RIGHT - ICE_LEFT}
              height={ZONE_H / 2}
              onClick={() => handle('weak_side')}
            />
          )}

          {showDirectionArrow && (
            <path
              className={styles.attackArrow}
              d="M175 30 L225 30 L215 22 M225 30 L215 38"
              fill="none"
            />
          )}
        </g>

        {resolvedMarkers.map((m) => {
          const cx = flipX(m.cx, attack)
          const cy = m.cy
          const interactive = isInteractive(m.id)
          const lonePuck = m.kind === 'puck'
          const showPlayer = !lonePuck
          const showPuck = Boolean(m.hasPuck)
          return (
            <g
              key={m.id}
              className={`${styles.marker} ${selectedRegion === m.id ? styles.markerSelected : ''} ${interactive ? styles.interactive : ''}`}
              onClick={() => handle(m.id)}
              transform={`translate(${cx}, ${cy})`}
            >
              {showPlayer ? (
                <circle r={12} className={teamClass(m.team, 'player')} />
              ) : null}
              {showPuck ? (
                <circle
                  className={styles.puck}
                  r={lonePuck ? 9 : 5}
                  cx={lonePuck ? 0 : 9}
                  cy={lonePuck ? 0 : 7}
                />
              ) : null}
              <text y={showPlayer ? 24 : 18} textAnchor="middle" className={styles.markerCaption}>
                {m.label}
              </text>
            </g>
          )
        })}
      </svg>

      <div className={styles.legend}>
        <span>Defensivzone</span>
        <span>Neutralzone</span>
        <span>Offensivzone</span>
        {hasTeams && (
          <>
            <span className={styles.legendBlue}>Blau</span>
            <span className={styles.legendRed}>Rot</span>
          </>
        )}
        {hasPuckLegend ? <span className={styles.legendPuck}>gelber Punkt = Puck</span> : null}
        <span className={styles.legendAttack}>
          Angriff {attack === 'right' ? '→' : '←'}
        </span>
      </div>
    </div>
  )
}
