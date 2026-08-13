import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import type { Session } from '../../api'
import { UiButtonLink } from '../../components/ui'
import { getSessionRoute } from '../lab/sessionRouting'
import {
  buildPastDrillRecap,
  formatSessionDate,
  formatSessionMatchup,
  isSameMatchup,
} from './pastDrillSessions'
import styles from './PastDrillSessions.module.css'

type Props = {
  sessions: Session[]
  drillId?: string
  homeTeam?: string
  awayTeam?: string
}

export function PastDrillSessions({ sessions, drillId, homeTeam, awayTeam }: Props) {
  const recap = useMemo(() => buildPastDrillRecap(sessions, drillId), [sessions, drillId])
  if (!recap) return null

  const { latest, older, count, reflection, reflectionSession, reflectionIsFromLatest } = recap
  const observed = latest.game_info?.observed_team || latest.observed_team
  const sameMatchup = isSameMatchup(latest, homeTeam, awayTeam)
    || older.some((session) => isSameMatchup(session, homeTeam, awayTeam))
  const caution = reflection?.content.cautions.find((item) => item.trim())
  const focus = reflection?.content.nextObservationFocus?.trim()

  return (
    <div className={`card ${styles.card}`}>
      <div className={styles.header}>
        <p className={styles.eyebrow}>Vergangene Sessions</p>
        <h2 className={styles.title}>Beim letzten Mal</h2>
        <p className={styles.lead}>
          {count === 1
            ? 'Diesen Drill schon einmal gemacht — hier der Fokus für heute.'
            : `Diesen Drill ${count}× gemacht — lies kurz, worauf du heute achten wolltest.`}
        </p>
      </div>

      <div className={styles.featured}>
        <div className={styles.meta}>
          <div className={styles.metaRow}>
            <span className={styles.date}>{formatSessionDate(latest.created_at)}</span>
            {sameMatchup && <span className={styles.badge}>Diese Paarung</span>}
          </div>
          <p className={styles.matchup}>{formatSessionMatchup(latest)}</p>
          {observed && <p className={styles.observed}>Beobachtet: {observed}</p>}
        </div>

        {focus ? (
          <div className={styles.focus}>
            <p className={styles.focusLabel}>
              {reflectionIsFromLatest
                ? 'Beim nächsten Mal beobachten'
                : `Letzter KI-Tipp · ${formatSessionDate(reflectionSession?.created_at)}`}
            </p>
            <p className={styles.focusText}>{focus}</p>
            {caution && <p className={styles.caution}>△ {caution}</p>}
          </div>
        ) : (
          <p className={styles.emptyTip}>
            Noch keine KI-Reflexion zu diesem Drill. Session öffnen, um nachzulesen, was du notiert hast.
          </p>
        )}

        <div className={styles.actions}>
          <UiButtonLink to={getSessionRoute(latest)} size="sm">
            Letzte Session öffnen
          </UiButtonLink>
        </div>
      </div>

      {older.length > 0 && (
        <div className={styles.older}>
          <p className={styles.olderTitle}>Weitere mit diesem Drill</p>
          {older.map((session) => (
            <Link key={session.id} to={getSessionRoute(session)} className={styles.olderLink}>
              <span>{formatSessionDate(session.created_at)}</span>
              <span className={styles.olderMeta}>{formatSessionMatchup(session)}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
