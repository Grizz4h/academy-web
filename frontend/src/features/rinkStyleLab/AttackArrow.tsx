import { DETAILED_RINK_VIEWBOX } from '../rinkGeometry/detailedMetrics'
import type { FoundationAttackDirection } from '../foundation/types'
import { foundationPointToDetailed } from './foundationCoordAdapter'
import { FOUNDATION_VIEWBOX } from './labGeometry'
import styles from './AttackArrow.module.css'

type Props = {
  space: 'foundation' | 'detailed'
  attackDirection?: FoundationAttackDirection
}

/**
 * Same attack-direction cue as FoundationRink (path M175 30 …),
 * remapped onto Detailed ice when needed.
 */
export function AttackArrow({ space, attackDirection = 'right' }: Props) {
  // Foundation path anchors (viewBox coords)
  const tip = space === 'detailed' ? foundationPointToDetailed(225, 30) : { x: 225, y: 30 }
  const base = space === 'detailed' ? foundationPointToDetailed(175, 30) : { x: 175, y: 30 }
  const wing = space === 'detailed' ? foundationPointToDetailed(215, 22) : { x: 215, y: 22 }
  const wing2 = space === 'detailed' ? foundationPointToDetailed(215, 38) : { x: 215, y: 38 }

  const d = `M${base.x} ${base.y} L${tip.x} ${tip.y} L${wing.x} ${wing.y} M${tip.x} ${tip.y} L${wing2.x} ${wing2.y}`
  const vbW = space === 'detailed' ? DETAILED_RINK_VIEWBOX.width : FOUNDATION_VIEWBOX.width
  const flip = attackDirection === 'left'
    ? `translate(${vbW},0) scale(-1,1)`
    : undefined

  return (
    <g className={styles.arrow} transform={flip} aria-hidden="true">
      <path d={d} fill="none" className={styles.path} />
    </g>
  )
}
