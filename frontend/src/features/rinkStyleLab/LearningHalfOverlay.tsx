import type { IceHalf } from './labGeometry'
import styles from './LearningHalfOverlay.module.css'

type Props = {
  /** Parent SVG must already use matching viewBox coordinates. */
  ice: { x: number; y: number; w: number; h: number }
  weakSideBand: 'top' | 'bottom'
  showHitboxes: boolean
  showFeedback: boolean
  feedbackSide: 'weak' | 'strong' | null
  onSelectHalf?: (half: IceHalf) => void
}

/**
 * Lab-only learning layer: equal half hitboxes + optional feedback wash.
 * Uses parent rink ice bounds — does not invent geometry.
 */
export function LearningHalfOverlay({
  ice,
  weakSideBand,
  showHitboxes,
  showFeedback,
  feedbackSide,
  onSelectHalf,
}: Props) {
  const halfH = ice.h / 2
  const topIsWeak = weakSideBand === 'top'

  const feedbackHalf: IceHalf | null = !showFeedback || !feedbackSide
    ? null
    : feedbackSide === 'weak'
      ? (topIsWeak ? 'top' : 'bottom')
      : (topIsWeak ? 'bottom' : 'top')

  const feedbackY = feedbackHalf === 'bottom' ? ice.y + halfH : ice.y

  return (
    <g className={styles.layer} aria-label="Learning layer">
      {showHitboxes && (
        <>
          <rect
            className={styles.hitbox}
            x={ice.x}
            y={ice.y}
            width={ice.w}
            height={halfH}
            data-ice-half="top"
            onClick={() => onSelectHalf?.('top')}
          />
          <rect
            className={styles.hitbox}
            x={ice.x}
            y={ice.y + halfH}
            width={ice.w}
            height={halfH}
            data-ice-half="bottom"
            onClick={() => onSelectHalf?.('bottom')}
          />
        </>
      )}
      {feedbackHalf && (
        <rect
          className={styles.feedback}
          x={ice.x}
          y={feedbackY}
          width={ice.w}
          height={halfH}
          pointerEvents="none"
        />
      )}
    </g>
  )
}
