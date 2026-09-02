import type { ReactNode } from 'react'
import Card from '../components/Card'
import styles from './Curriculum.module.css'

type CurriculumTrackPanelProps = {
  trackId: string
  open: boolean
  onToggle: () => void
  eyebrow?: ReactNode
  title: ReactNode
  titleTutorialId?: string
  moduleCountLabel: string
  foundation?: boolean
  cluster?: boolean
  children: ReactNode
}

export function CurriculumTrackPanel({
  trackId,
  open,
  onToggle,
  eyebrow,
  title,
  titleTutorialId,
  moduleCountLabel,
  foundation = false,
  cluster = false,
  children,
}: CurriculumTrackPanelProps) {
  return (
    <Card
      surface="section"
      elevation="quiet"
      className={[
        styles.trackCard,
        foundation ? styles.trackFoundation : '',
        cluster ? styles.trackCluster : '',
      ].filter(Boolean).join(' ')}
    >
      <details
        id={`curriculum-track-${trackId}`}
        className={`ui-more ui-more--flush ${styles.trackDetails}`}
        open={open}
      >
        <summary
          className={`ui-more__summary ${styles.trackSummary}`}
          onClick={(event) => {
            event.preventDefault()
            onToggle()
          }}
        >
          <div className={styles.trackSummaryMain}>
            {eyebrow}
            <h2
              className={styles.trackTitle}
              {...(titleTutorialId ? { 'data-tutorial-id': titleTutorialId } : {})}
            >
              {title}
            </h2>
          </div>
          <div className={styles.trackMeta}>
            <span>{moduleCountLabel}</span>
            <span className="ui-more__chevron" aria-hidden="true" />
          </div>
        </summary>
        <div className="ui-more__body">
          {children}
        </div>
      </details>
    </Card>
  )
}
