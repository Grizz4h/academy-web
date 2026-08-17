import { Link } from 'react-router-dom'
import Card from '../Card'
import { UiPill, UiProgress } from '../ui'
import type { DrillAttempt, TrackProgressMap } from './drillActivity'
import { selectLearningTeaser } from './drillActivity'
import styles from './LearningProgressTeaser.module.css'

export function LearningProgressTeaser({
  trackProgress,
  attempts,
}: {
  trackProgress: TrackProgressMap
  attempts: DrillAttempt[]
}) {
  const teaser = selectLearningTeaser({ trackProgress, attempts })
  if (!teaser.focus && teaser.recent.length === 0) return null

  const focusComplete = Boolean(
    teaser.focus && teaser.focus.total > 0 && teaser.focus.completed >= teaser.focus.total,
  )

  return (
    <Card surface="section" className={styles.wrap}>
      <Link className={styles.cardLink} to="/progress#learning-progress">
        <header className={styles.header}>
          <h2 className={styles.heading}>Dein Lernfortschritt</h2>
          <span className={styles.link}>Gesamten Fortschritt ansehen</span>
        </header>
        {teaser.focus ? (
          <div className={styles.focus}>
            <div className={styles.focusTop}>
              <UiPill tone={focusComplete ? 'ok' : 'accent'}>
                {focusComplete ? 'Abgeschlossen' : 'Fokus'}
              </UiPill>
              <span className={styles.focusCount}>
                {teaser.focus.completed} / {teaser.focus.total} Drills
              </span>
            </div>
            <strong className={styles.focusTitle}>{teaser.focus.title}</strong>
            <UiProgress
              value={teaser.focus.completed}
              max={teaser.focus.total || 1}
              label={teaser.focus.title}
            />
          </div>
        ) : null}
        {teaser.recent.length > 0 ? (
          <div className={styles.recent}>
            <span className={styles.kicker}>Zuletzt</span>
            {teaser.recent.map((item) => (
              <p key={item.drillId} className={styles.recentRow}>
                <span className={styles.recentName}>{item.drillName}</span>
                <span>{item.sessions} {item.sessions === 1 ? 'Session' : 'Sessions'}</span>
              </p>
            ))}
          </div>
        ) : null}
      </Link>
    </Card>
  )
}
