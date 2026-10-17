import type { ReactNode } from 'react'
import { DetailedHockeyRinkLayers, DETAILED_RINK_VIEWBOX } from '../rinkGeometry'
import type { RinkOverlays } from '../rinkGeometry'
import type { FoundationAttackDirection } from '../foundation/types'
import { AttackArrow } from './AttackArrow'
import { DETAILED_ICE } from './labGeometry'
import { LearningHalfOverlay } from './LearningHalfOverlay'
import type { StyleLabLearning, StyleLabMarkings } from './presets'
import type { IceHalf } from './labGeometry'
import styles from './stages.module.css'

type Props = {
  markings: StyleLabMarkings
  learning: StyleLabLearning
  markingIntensity?: number
  showAttackArrow?: boolean
  attackDirection?: FoundationAttackDirection
  onSelectHalf?: (half: IceHalf) => void
  /** Scene layer children (markers). */
  children?: ReactNode
}

export function DetailedStage({
  markings,
  learning,
  markingIntensity = 1,
  showAttackArrow = false,
  attackDirection = 'right',
  onSelectHalf,
  children,
}: Props) {
  const overlays: RinkOverlays = {
    zones: markings.goalLines,
    goals: markings.goals,
    crease: markings.crease,
    faceoffDots: markings.faceoffDots,
    labels: markings.labels,
    defendingSide: 'left',
    showDefendingHint: false,
    attackDirection,
    iceAds: markings.iceAds,
    blueLines: markings.blueLines,
    centerLine: markings.centerLine,
    centerFaceoffCircle: markings.centerFaceoffCircle,
    markingIntensity,
  }

  return (
    <div className={styles.stageFrame}>
      <svg
        className={styles.stageSvg}
        viewBox={`0 0 ${DETAILED_RINK_VIEWBOX.width} ${DETAILED_RINK_VIEWBOX.height}`}
        role="img"
        aria-label="Detailed rink with Foundation scene"
      >
        <g id="rink-base">
          <DetailedHockeyRinkLayers overlays={overlays} />
        </g>
        <g id="scene-layer">
          {showAttackArrow && (
            <AttackArrow space="detailed" attackDirection={attackDirection} />
          )}
          {children}
        </g>
        <g id="learning-layer">
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
        </g>
      </svg>
    </div>
  )
}
