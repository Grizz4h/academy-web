import type { CatalogGame } from '../../api'
import { TeamCrest } from './TeamCrest'
import {
  resolveCatalogTeamName,
  resolveGameTeamShortCode,
} from '../../data/teamShortCodes'
import {
  filterGamesForDate,
  formatGameStripStatusLabel,
  formatGameTimeLabel,
  localTodayIsoDate,
  uniqueMatchdaysForDate,
} from './gameCatalogUtils'
import { COMPETITION_CONFIGS } from '../../data/competitionConfig'
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
  /** When true, append official score next to status (creator calendar). */
  showScores?: boolean
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
  showScores = false,
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
    <section className={styles.wrap} aria-label={`Spiele ${league}`}>
      <div className={styles.header}>
        <div className={styles.titleBlock}>
          <h2 className={styles.title}>{league.replace(/_/g, ' ')}</h2>
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
          const homeName = resolveCatalogTeamName(game.home_team_name || game.home_team_id, game.league_id, game.season_id)
          const awayName = resolveCatalogTeamName(game.away_team_name || game.away_team_id, game.league_id, game.season_id)
          const home = resolveGameTeamShortCode(game.home_team_name || game.home_team_id, game.league_id, game.season_id)
          const away = resolveGameTeamShortCode(game.away_team_name || game.away_team_id, game.league_id, game.season_id)
          const time = formatGameTimeLabel(game.time, { omitSuffix: true, date: game.date })
          const leagueLabel = COMPETITION_CONFIGS[game.league_id]?.label || league.replace(/_/g, ' ')
          const status = formatGameStripStatusLabel(game)
          const statusClass = status === 'Live'
            ? styles.statusLive
            : status === 'Geplant'
              ? styles.statusScheduled
              : styles.statusEnded
          const metaParts = [
            time || null,
            game.matchday != null ? `ST ${game.matchday}` : null,
            game.phase_label || null,
            showScores && game.score ? `${game.score.home}:${game.score.away}` : null,
          ].filter(Boolean)

          const content = (
            <span className={styles.badge}>
              <TeamCrest name={homeName} teamId={game.home_team_id} size="sm" />
              <span className={styles.badgeCopy}>
                <span className={styles.badgeKicker}>{leagueLabel}</span>
                <span className={styles.badgePairing}>{home} – {away}</span>
                <span className={styles.badgeMetaRow}>
                  {metaParts.length > 0 ? (
                    <span className={styles.badgeMeta}>{metaParts.join(' · ')}</span>
                  ) : null}
                  <span className={`${styles.statusWord} ${statusClass}`}>{status}</span>
                </span>
              </span>
              <TeamCrest name={awayName} teamId={game.away_team_id} size="sm" />
            </span>
          )

          return (
            <li key={game.id}>
              {selectable && onSelectGame ? (
                <button
                  type="button"
                  className={styles.itemButton}
                  onClick={() => onSelectGame(game)}
                  title={`${homeName} vs ${awayName} · ${status}`}
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
