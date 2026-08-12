import type { CatalogGame } from '../../api'
import {
  filterGamesForDate,
  formatGameStatusLabel,
  formatGameTimeLabel,
  localTodayIsoDate,
  uniqueMatchdaysForDate,
} from './gameCatalogUtils'
import styles from './TodayMatchdaySlate.module.css'

type TodayMatchdaySlateProps = {
  league: string
  games: CatalogGame[]
  date?: string
  onSelectGame?: (game: CatalogGame) => void
  onLeagueChange?: (league: string) => void
  leagueOptions?: string[]
  selectable?: boolean
  hint?: string
}

function formatTodayLabel(date: string): string {
  const parsed = new Date(`${date}T12:00:00`)
  if (Number.isNaN(parsed.getTime())) return date
  return parsed.toLocaleDateString('de-DE', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

export default function TodayMatchdaySlate({
  league,
  games,
  date = localTodayIsoDate(),
  onSelectGame,
  onLeagueChange,
  leagueOptions,
  selectable = Boolean(onSelectGame),
  hint,
}: TodayMatchdaySlateProps) {
  const todayGames = filterGamesForDate(games, date)
  if (todayGames.length === 0) return null

  const matchdays = uniqueMatchdaysForDate(games, date)
  const matchdayLabel = matchdays.length === 1
    ? `Spieltag ${matchdays[0]}`
    : matchdays.length > 1
      ? `Spieltage ${matchdays.join(', ')}`
      : 'Spieltag'

  return (
    <section className={styles.wrap} aria-label={`Heutige Spiele ${league}`}>
      <div className={styles.header}>
        <div className={styles.titleBlock}>
          <h2 className={styles.title}>Heute in {league.replace(/_/g, ' ')}</h2>
          <p className={styles.subtitle}>
            {formatTodayLabel(date)} · {matchdayLabel} · {todayGames.length}{' '}
            {todayGames.length === 1 ? 'Paarung' : 'Paarungen'}
          </p>
        </div>
        {leagueOptions && leagueOptions.length > 1 && onLeagueChange ? (
          <select
            className={`appSelect ${styles.leagueSelect}`}
            value={league}
            onChange={(event) => onLeagueChange(event.target.value)}
            aria-label="Liga für Tagesprogramm"
          >
            {leagueOptions.map((option) => (
              <option key={option} value={option}>{option.replace(/_/g, ' ')}</option>
            ))}
          </select>
        ) : null}
      </div>

      <ul className={styles.list}>
        {todayGames.map((game) => {
          const home = game.home_team_name || game.home_team_id
          const away = game.away_team_name || game.away_team_id
          const status = formatGameStatusLabel(game)
          const statusClass = game.status === 'live'
            ? styles.statusLive
            : game.status === 'scheduled'
              ? styles.statusScheduled
              : ''
          const content = (
            <>
              <span className={styles.timeCol}>{formatGameTimeLabel(game.time) || '–'}</span>
              <span className={styles.pairing}>
                <strong>{home}</strong>
                {' vs '}
                <strong>{away}</strong>
                {game.matchday ? (
                  <span className={styles.meta}>Spieltag {game.matchday}</span>
                ) : null}
              </span>
              <span className={`${styles.statusCol} ${statusClass}`}>{status}</span>
            </>
          )

          return (
            <li key={game.id}>
              {selectable && onSelectGame ? (
                <button
                  type="button"
                  className={styles.itemButton}
                  onClick={() => onSelectGame(game)}
                  title={`${home} vs ${away} übernehmen`}
                >
                  {content}
                </button>
              ) : (
                <div className={styles.item}>{content}</div>
              )}
            </li>
          )
        })}
      </ul>

      {hint ? <p className={styles.hint}>{hint}</p> : null}
      {selectable && onSelectGame ? (
        <p className={styles.hint}>Tippe eine Paarung, um Teams und Spieltag zu übernehmen.</p>
      ) : null}
    </section>
  )
}
