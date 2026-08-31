import type { Session } from '../api'
import { TeamCrest } from '../components/game/TeamCrest'
import { UiPill } from '../components/ui'
import { formatCompetitionContext } from '../data/competitionConfig'
import { getObservationScopeLabel } from '../utils/observationScope'
import styles from './SessionGameInfo.module.css'

type SessionGameInfoProps = {
  session: Session
  isFoundationSession: boolean
  activeDrillTitle?: string | null
  note: string
  onNoteChange: (value: string) => void
}

function formatGameDate(value?: string): string | null {
  if (!value) return null
  const date = new Date(value.includes('T') ? value : `${value}T12:00:00`)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('de-DE', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function TeamSide({
  name,
  teamId,
  observed,
}: {
  name: string
  teamId?: string
  observed: boolean
}) {
  return (
    <div className={[styles.teamCol, observed ? styles.teamColObserved : ''].filter(Boolean).join(' ')}>
      <span className={styles.crestSlot}>
        <TeamCrest name={name} teamId={teamId} size="md" />
      </span>
      <p className={[styles.teamName, observed ? styles.teamNameObserved : ''].filter(Boolean).join(' ')}>
        {name}
      </p>
      {observed ? <span className={styles.observedChip}>Beobachtet</span> : null}
    </div>
  )
}

function SessionNote({
  note,
  onNoteChange,
  className,
}: {
  note: string
  onNoteChange: (value: string) => void
  className?: string
}) {
  return (
    <div className={[styles.noteBlock, className].filter(Boolean).join(' ')}>
      <label htmlFor="session-note" className={styles.noteLabel}>
        Notiz
      </label>
      <textarea
        id="session-note"
        className={styles.noteField}
        value={note}
        onChange={(event) => onNoteChange(event.target.value)}
        rows={2}
        placeholder="Was hast du im Blick?"
      />
    </div>
  )
}

export function SessionGameInfo({
  session,
  isFoundationSession,
  activeDrillTitle,
  note,
  onNoteChange,
}: SessionGameInfoProps) {
  const game = session.game_info
  const home = game?.team_home || ''
  const away = game?.team_away || ''
  const observed =
    game?.observed_team_name
    || game?.observed_team
    || session.observed_team_name
    || session.observed_team
    || ''
  const competition = game ? (formatCompetitionContext(game) || game.matchday || '') : ''
  const dateLabel = formatGameDate(game?.date)
  const scopeLabel = getObservationScopeLabel(session.observation_scope)

  const meta = (
    <div className={styles.metaRow}>
      {dateLabel ? <UiPill>{dateLabel}</UiPill> : null}
      {game?.league ? <UiPill>{game.league.replace(/_/g, ' ')}</UiPill> : null}
      {game?.season ? <UiPill>{game.season}</UiPill> : null}
      {competition ? <UiPill>{competition}</UiPill> : null}
      <UiPill>{scopeLabel}</UiPill>
      {activeDrillTitle ? <UiPill tone="accent">{activeDrillTitle}</UiPill> : null}
    </div>
  )

  return (
    <section className={styles.root} aria-label={isFoundationSession ? 'Lektion' : 'Spiel'}>
      <header className={styles.header}>
        <div>
          <p className={styles.kicker}>{isFoundationSession ? 'Foundation' : 'Live-Session'}</p>
          <h2 className={styles.title}>{isFoundationSession ? 'Lektion' : 'Spiel'}</h2>
        </div>
      </header>

      {isFoundationSession ? (
        <>
          <p className={styles.foundationLead}>
            {session.module_id}
            {session.drill_id ? ` · ${session.drill_id}` : ''}
          </p>
          <div className={styles.metaRow}>
            <UiPill>{scopeLabel}</UiPill>
            {activeDrillTitle ? <UiPill tone="accent">{activeDrillTitle}</UiPill> : null}
          </div>
          <p className={styles.foundationHint}>Keine Live-Paarung nötig.</p>
          <SessionNote note={note} onNoteChange={onNoteChange} />
        </>
      ) : game && home && away ? (
        <>
          <div className={styles.desktopRow}>
            <div className={styles.matchBoard} aria-label={`${home} gegen ${away}`}>
              <TeamSide name={home} teamId={game.home_team_id} observed={observed === home} />
              <div className={styles.vs} aria-hidden="true">vs</div>
              <TeamSide name={away} teamId={game.away_team_id} observed={observed === away} />
            </div>
            <SessionNote note={note} onNoteChange={onNoteChange} className={styles.noteAside} />
          </div>
          {meta}
        </>
      ) : (
        <>
          <p className={styles.foundationLead}>Keine Spiel-Info verfügbar</p>
          <div className={styles.metaRow}>
            {observed ? <UiPill tone="accent">Beobachtet: {observed}</UiPill> : null}
            {session.goal ? <UiPill>{session.goal}</UiPill> : null}
            {session.state ? <UiPill>{session.state}</UiPill> : null}
            <UiPill>{scopeLabel}</UiPill>
          </div>
          <SessionNote note={note} onNoteChange={onNoteChange} />
        </>
      )}
    </section>
  )
}
