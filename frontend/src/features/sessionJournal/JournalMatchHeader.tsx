import type { Session } from '../../api'
import { TeamCrest } from '../../components/game/TeamCrest'
import { UiPill } from '../../components/ui'
import {
  formatJournalDate,
  getSessionFocusLabel,
  getSessionMatchup,
  getSessionScopeLabel,
  getSessionStatusMeta,
} from './sessionMeta'
import styles from './sessionJournal.module.css'

type Props = {
  session: Session
}

export function JournalMatchHeader({ session }: Props) {
  const matchup = getSessionMatchup(session)
  const status = getSessionStatusMeta(session.state)
  const gameDate = formatJournalDate(session.game_info?.date || session.created_at)
  const league = session.game_info?.league?.replace(/_/g, ' ')
  const focus = getSessionFocusLabel(session)
  const scope = getSessionScopeLabel(session)

  return (
    <header className={styles.matchHeader}>
      <div className={styles.matchCrests}>
        {matchup.teamHome ? <TeamCrest name={matchup.teamHome} size="lg" /> : null}
        <span className={styles.matchVs}>vs</span>
        {matchup.teamAway ? <TeamCrest name={matchup.teamAway} size="lg" /> : null}
      </div>
      <h2 className={styles.matchHeadline}>{matchup.title}</h2>
      <p className={styles.matchSub}>
        {[gameDate, league, focus].filter(Boolean).join(' · ')}
      </p>
      <div className={styles.matchChips}>
        <UiPill tone={status.tone}>{status.label}</UiPill>
        <UiPill tone="neutral">{scope}</UiPill>
        {matchup.observedTeam ? (
          <UiPill tone="accent">Fokus: {matchup.observedTeam}</UiPill>
        ) : null}
        {session.module_id ? <UiPill tone="neutral">{session.module_id}</UiPill> : null}
      </div>
    </header>
  )
}
