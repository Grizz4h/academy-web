import { Link } from 'react-router-dom'
import Card from '../Card'
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

  return (
    <Card surface="section" className={styles.wrap}>
      <Link className={styles.cardLink} to="/progress#learning-progress">
        <header className={styles.header}>
          <h2 className={styles.heading}>Dein Lernfortschritt</h2>
          <span className={styles.link}>Gesamten Fortschritt ansehen</span>
        </header>
        {teaser.focus ? (
          <p className={styles.focus}>
            <strong>{teaser.focus.id}</strong>
            <span>{teaser.focus.title}</span>
            <span>{teaser.focus.completed} / {teaser.focus.total} Drills</span>
          </p>
        ) : null}
        {teaser.recent.length > 0 ? (
          <div className={styles.recent}>
            <span className={styles.kicker}>Zuletzt</span>
            {teaser.recent.map((item) => (
              <p key={item.drillId} className={styles.recentRow}>
                <span>{item.drillId}</span>
                <span>{item.sessions} {item.sessions === 1 ? 'Session' : 'Sessions'}</span>
              </p>
            ))}
          </div>
        ) : null}
      </Link>
    </Card>
  )
}
