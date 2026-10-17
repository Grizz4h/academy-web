import type { ReactNode } from 'react'
import { DetailedHockeyRinkLayers, DETAILED_RINK_VIEWBOX } from '../rinkGeometry'
import type { RinkOverlays } from '../rinkGeometry'
import { DETAILED_ICE } from './labGeometry'
import { LearningHalfOverlay } from './LearningHalfOverlay'
import type { StyleLabLearning, StyleLabMarkings } from './presets'
import type { IceHalf } from './labGeometry'
import styles from './stages.module.css'

type Props = {
  markings: StyleLabMarkings
  learning: StyleLabLearning
  onSelectHalf?: (half: IceHalf) => void
  /** Optional scene markers as SVG children (lab-drawn, not Foundation markers). */
  children?: ReactNode
}

export function DetailedStage({ markings, learning, onSelectHalf, children }: Props) {
  const overlays: RinkOverlays = {
    zones: markings.goalLines,
    goals: markings.goals,
    crease: markings.crease,
    faceoffDots: markings.faceoffDots,
    labels: markings.labels,
    defendingSide: 'left',
    showDefendingHint: false,
    attackDirection: 'right',
    iceAds: markings.iceAds,
  }

  return (
    <svg
      className={styles.stageSvg}
      viewBox={`0 0 ${DETAILED_RINK_VIEWBOX.width} ${DETAILED_RINK_VIEWBOX.height}`}
      role="img"
      aria-label="Detailed rink (product metrics)"
    >
      {/* Base layer — existing DetailedHockeyRinkLayers */}
      <g id="rink-base">
        <DetailedHockeyRinkLayers overlays={overlays} />
        {/* Center / blue lines are always painted by the base component today.
            Toggles for centerLine/blueLines are noted in the lab UI as limited
            until base supports finer marking flags. */}
      </g>
      <g id="scene-layer">{children}</g>
      {(learning.showWeakStrong || learning.showHitboxes || learning.showFeedback) && (
        <LearningHalfOverlay
          ice={DETAILED_ICE}
          weakSideBand={learning.weakSideBand}
          showHitboxes={learning.showHitboxes || learning.showWeakStrong}
          showFeedback={learning.showFeedback}
          feedbackSide={learning.feedbackSide}
          onSelectHalf={onSelectHalf}
        />
      )}
    </svg>
  )
}
