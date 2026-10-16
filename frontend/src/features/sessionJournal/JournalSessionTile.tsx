import type { Session } from '../../api'
import { TeamCrest } from '../../components/game/TeamCrest'
import { UiPill } from '../../components/ui'
import selectStyles from '../../components/selection/selectableTile.module.css'
import { isDummySession } from '../../utils/sessionEligibility'
import { countSessionObservations } from './collectObservations'
import {
  formatJournalDate,
  getSessionFocusLabel,
  getSessionMatchup,
  getSessionStatusMeta,
  type JournalSceneEntry,
} from './sessionMeta'
import styles from './sessionJournal.module.css'

type Props = {
  session: Session
  sceneEntries?: JournalSceneEntry[]
  active?: boolean
  selectionMode?: boolean
  selected?: boolean
  onSelect: () => void
  onToggleSelect?: (id: string) => void
}

export function JournalSessionTile({
  session,
  sceneEntries = [],
  active = false,
  selectionMode = false,
  selected = false,
  onSelect,
  onToggleSelect,
}: Props) {
  const status = getSessionStatusMeta(session.state)
  const matchup = getSessionMatchup(session)
  const drillLabel = getSessionFocusLabel(session)
  const gameDate = formatJournalDate(session.game_info?.date || session.created_at)
  const obsCount = countSessionObservations(session)
  const sceneCount = sceneEntries.length
  const hasReflection = Boolean(session.ai_reflection)
  const isDummy = isDummySession(session)
  const isLabPredict = session.learning_area === 'lab' && session.lab_mode === 'predict'
  const league = session.game_info?.league?.replace(/_/g, ' ')

  const shellClass = [
    styles.tile,
    active ? styles.tileActive : '',
    selectionMode ? styles.tileSelecting : '',
    selectStyles.shell,
    selectionMode ? selectStyles.shellSelecting : '',
    selectionMode && !selected ? selectStyles.shellDimmed : '',
    selectionMode && selected ? selectStyles.shellSelected : '',
  ].filter(Boolean).join(' ')

  return (
    <button
      type="button"
      className={shellClass}
      aria-pressed={selectionMode ? selected : active}
      onClick={() => {
        if (selectionMode) {
          onToggleSelect?.(session.id)
          return
        }
        onSelect()
      }}
    >
      {selectionMode ? (
        <span
          className={`${selectStyles.checkbox} ${selected ? selectStyles.checkboxOn : ''}`}
          aria-hidden="true"
        >
          {selected ? <span className={selectStyles.checkMark} /> : null}
        </span>
      ) : null}

      <div className={styles.tileTop}>
        <div className={styles.identity}>
          {matchup.observedTeam ? (
            <TeamCrest name={matchup.observedTeam} size="md" />
          ) : matchup.teamHome ? (
            <TeamCrest name={matchup.teamHome} size="sm" />
          ) : null}
          <div className={styles.identityText}>
            <span className={styles.kicker}>
              {matchup.observedTeam ? 'Beobachtet' : 'Begegnung'}
            </span>
            <h3 className={styles.matchTitle}>
              {matchup.observedTeam || matchup.title}
            </h3>
            {matchup.observedTeam && matchup.opponentTeam ? (
              <p className={styles.vsLine}>vs {matchup.opponentTeam}</p>
            ) : matchup.observedTeam && matchup.teamHome && matchup.teamAway ? (
              <p className={styles.vsLine}>{matchup.title}</p>
            ) : null}
          </div>
        </div>
        <UiPill tone={status.tone}>{status.label}</UiPill>
      </div>

      <div className={styles.tileMeta}>
        {gameDate ? <span>{gameDate}</span> : null}
        {league ? <span>{league}</span> : null}
        <span>{drillLabel}</span>
      </div>

      <div className={styles.badgeRow}>
        <span className={styles.badge}>
          {obsCount} {obsCount === 1 ? 'Beobachtung' : 'Beobachtungen'}
        </span>
        <span className={styles.badge}>
          {sceneCount} {sceneCount === 1 ? 'Szene' : 'Szenen'}
        </span>
        {hasReflection ? <span className={`${styles.badge} ${styles.badgeIce}`}>KI-Reflexion</span> : null}
        {isDummy ? <span className={styles.badge}>DEV · DUMMY</span> : null}
        {isLabPredict ? <span className={styles.badge}>Lab · Predict</span> : null}
      </div>
    </button>
  )
}
