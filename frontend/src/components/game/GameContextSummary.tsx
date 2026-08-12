import type { CatalogGame, GameInfo } from '../../api'
import {
  catalogGameContextHint,
  formatGameScoreShort,
  isCatalogArchiveGame,
  isGamePastWithoutScore,
  pairingHeadToHeadSummary,
  pairingMeetings,
  pennyDelSpieldetailsUrl,
} from './gameCatalogUtils'
import styles from './GameContextSummary.module.css'

type GameContextSummaryProps = {
  game?: CatalogGame | null
  gameInfo?: GameInfo | null
  compact?: boolean
  catalogGames?: CatalogGame[]
  perspectiveTeam?: string
  /** Show import vs live distinction (default: true when game from catalog) */
  showImportChrome?: boolean
  /** Render as section inside a parent card (no nested box) */
  embedded?: boolean
}

function formatDate(value?: string): string {
  if (!value) return ''
  const date = new Date(value.includes('T') ? value : `${value}T12:00:00`)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function formatScore(game?: CatalogGame | null): string | null {
  if (game?.score) return `${game.score.home} : ${game.score.away}`
  return null
}

function formatPeriods(game?: CatalogGame | null): string | null {
  const periods = game?.score?.periods
  if (!periods?.length) return null
  return periods.map((period: { home: number; away: number }, index: number) => `D${index + 1} ${period.home}:${period.away}`).join(' · ')
}

export default function GameContextSummary({
  game,
  gameInfo,
  compact = false,
  catalogGames,
  perspectiveTeam,
  showImportChrome,
  embedded = false,
}: GameContextSummaryProps) {
  const home = game?.home_team_name || gameInfo?.team_home
  const away = game?.away_team_name || gameInfo?.team_away
  if (!home || !away) return null

  const score = formatScore(game)
  const status = game?.status || (score ? 'final' : 'scheduled')
  const date = formatDate(game?.date || gameInfo?.date)
  const phase = game?.phase_label || gameInfo?.competition_phase_label
  const matchday = game?.matchday || gameInfo?.competition_unit_value || gameInfo?.matchday
  const season = gameInfo?.season || game?.season_id
  const periods = formatPeriods(game)
  const detailsUrl = pennyDelSpieldetailsUrl(game)
  const staleResult = isGamePastWithoutScore(game)
  const meetings = catalogGames?.length ? pairingMeetings(catalogGames, home, away) : []
  const h2h = pairingHeadToHeadSummary(meetings, perspectiveTeam || home)
  const isArchive = isCatalogArchiveGame(game)
  const importChrome = showImportChrome ?? Boolean(game?.source?.provider || game?.id?.startsWith('del:'))
  const contextHint = catalogGameContextHint(game)

  return (
    <div
      className={[
        styles.wrap,
        compact ? styles.compact : '',
        importChrome ? styles.importWrap : '',
        embedded ? styles.embedded : '',
        embedded && isArchive ? styles.embeddedArchive : '',
        embedded && !isArchive ? styles.embeddedPlan : '',
      ].filter(Boolean).join(' ')}
    >
      {importChrome && (
        <div className={styles.sourceBar}>
          <span className={isArchive ? styles.badgeArchive : styles.badgePlan}>
            {isArchive ? 'Archiv · Ergebnis' : 'Spielplan · Termin'}
          </span>
          <span className={styles.sourceProvider}>PENNY DEL Import</span>
        </div>
      )}
      {importChrome && contextHint && (
        <p className={styles.contextHint}>{contextHint}</p>
      )}
      <div className={styles.matchup}>
        <span>{home}</span>
        {score ? <strong className={styles.score}>{score}</strong> : <span className={styles.vs}>vs</span>}
        <span>{away}</span>
      </div>
      <div className={styles.meta}>
        {status === 'final' && <span className={styles.badge}>Final</span>}
        {status === 'scheduled' && !staleResult && <span className={styles.badgeMuted}>Geplant</span>}
        {staleResult && <span className={styles.badgeWarn}>Ergebnis fehlt</span>}
        {game?.time && <span>{game.time.slice(0, 5)} Uhr</span>}
        {date && <span>{date}</span>}
        {season && <span>{gameInfo?.league || game?.league_id} · {season}</span>}
        {phase && <span>{phase}</span>}
        {matchday && <span>Spieltag {matchday}</span>}
        {detailsUrl && (
          <a href={detailsUrl} target="_blank" rel="noreferrer" className={styles.externalLink}>
            PENNY Details
          </a>
        )}
      </div>
      {periods && <div className={styles.periods}>{periods}</div>}
      {staleResult && (
        <p className={styles.hint}>
          Spieltermin liegt in der Vergangenheit — Spielplan in Dev neu synchronisieren für Ergebnis.
        </p>
      )}
      {meetings.length > 1 && (
        <div className={styles.meetings}>
          <div className={styles.meetingsTitle}>
            Saison-Duell (Import) · {meetings.length} Spiele
            {h2h ? ` · Bilanz ${perspectiveTeam || home}: ${h2h}` : ''}
          </div>
          <ul className={styles.meetingsList}>
            {meetings.map((meeting) => {
              const isCurrent = meeting.id === game?.id
              return (
                <li key={meeting.id} className={isCurrent ? styles.meetingCurrent : undefined}>
                  <span>ST {meeting.matchday ?? '?'}</span>
                  <span>{formatDate(meeting.date)}</span>
                  <span>{formatGameScoreShort(meeting)}</span>
                  {isCurrent && <span className={styles.meetingTag}>ausgewählt</span>}
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}
