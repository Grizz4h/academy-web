import { useMemo } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { CatalogGame, CatalogGameStats, GamePlayerStatRow } from '../../api'
import { api } from '../../api'
import {
  buildMatchdaySeasonContext,
  formatGameScoreShort,
  formatGoalDiff,
  formatSeasonForm,
  isCatalogArchiveGame,
} from './gameCatalogUtils'
import { isDummyCatalogGame } from '../../features/schedule/scheduleLayer'
import styles from './GameStatsDevPanel.module.css'

type GameStatsDevPanelProps = {
  game: CatalogGame
  catalogGames?: CatalogGame[]
  perspectiveTeam?: string
  exampleGamesWithStats?: CatalogGame[]
  onImported?: (game: CatalogGame) => void
  compact?: boolean
  /** Render as section inside parent Import card (no nested box) */
  embedded?: boolean
}

const TEAM_STAT_LABELS: Record<string, string> = {
  shots_on_goal: 'Schüsse auf Tor',
  total_shots: 'Schüsse gesamt',
  penalty_minutes: 'Strafminuten',
  power_plays: 'Powerplays',
  power_play_goals: 'PP-Tore',
  faceoffs_won: 'Bullies gewonnen',
  shooting_pct: 'Schusseffizienz',
  power_play_pct: 'PP-%',
  shorthanded_goals: 'Unterzahltore',
}

function formatDate(value?: string): string {
  if (!value) return ''
  const date = new Date(`${value}T12:00:00`)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function topScorers(game: CatalogGame, limit = 5) {
  return (game.stats?.players || []).flatMap((teamBlock) =>
    (teamBlock.players || [])
      .filter((player) => typeof player.points === 'number' && player.points > 0)
      .map((player) => ({
        ...player,
        team_name: teamBlock.team_name,
      })),
  )
    .sort((a, b) => (b.points || 0) - (a.points || 0))
    .slice(0, limit)
}

function teamBoxscoreRows(game: CatalogGame, teamName?: string, limit = 6): GamePlayerStatRow[] {
  if (!teamName) return []
  const block = (game.stats?.players || []).find((entry) => entry.team_name === teamName)
  if (!block) return []
  return [...(block.players || [])]
    .filter((player) => player.position_group !== 'goalie')
    .sort((a, b) => (b.points || 0) - (a.points || 0) || String(a.name).localeCompare(String(b.name)))
    .slice(0, limit)
}

function formatTeamStats(stats: CatalogGameStats | null | undefined) {
  if (!stats?.team) return []
  return Object.entries(stats.team).map(([key, metric]) => ({
    key,
    label: TEAM_STAT_LABELS[key] || metric.label || key,
    home: metric.home,
    away: metric.away,
  }))
}

function formatExampleLabel(game: CatalogGame): string {
  const day = game.matchday ? `ST ${game.matchday}` : 'ST ?'
  const date = game.date ? formatDate(game.date) : ''
  const home = game.home_team_name || '?'
  const away = game.away_team_name || '?'
  return `${day}${date ? ` · ${date}` : ''} · ${home} vs ${away}`
}

export default function GameStatsDevPanel({
  game,
  catalogGames = [],
  perspectiveTeam,
  exampleGamesWithStats = [],
  onImported,
  compact = false,
  embedded = false,
}: GameStatsDevPanelProps) {
  const queryClient = useQueryClient()

  const dummyGame = isDummyCatalogGame(game)
  const { data: freshGame } = useQuery({
    queryKey: ['game', game.id],
    queryFn: () => api.getGame(game.id),
    enabled: Boolean(game.id) && !dummyGame,
    staleTime: 15_000,
  })

  const displayGame = freshGame || game
  const hasStats = Boolean(displayGame.stats?.imported_at)
  const canImport = !dummyGame && isCatalogArchiveGame(displayGame) && Boolean(displayGame.source?.external_id)
  const homeTeam = displayGame.home_team_name || 'Heim'
  const awayTeam = displayGame.away_team_name || 'Auswärts'
  const observedTeam = perspectiveTeam && [homeTeam, awayTeam].includes(perspectiveTeam)
    ? perspectiveTeam
    : homeTeam

  const seasonContext = useMemo(
    () => (catalogGames.length ? buildMatchdaySeasonContext(catalogGames, displayGame) : null),
    [catalogGames, displayGame],
  )

  const importMutation = useMutation({
    mutationFn: () => api.importDelGameStats(displayGame.id),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['games'] })
      queryClient.invalidateQueries({ queryKey: ['game', displayGame.id] })
      if (result.game) onImported?.(result.game)
    },
  })

  const teamMetrics = formatTeamStats(displayGame.stats)
  const scorers = topScorers(displayGame)
  const observedRows = teamBoxscoreRows(displayGame, observedTeam)
  const scoreLabel = displayGame.score
    ? `${displayGame.score.home}:${displayGame.score.away}`
    : null

  const hasBoxscoreAgg = Boolean(
    seasonContext
    && (seasonContext.home.gamesWithBoxscore > 0 || seasonContext.away.gamesWithBoxscore > 0),
  )

  return (
    <div
      className={[
        styles.wrap,
        compact ? styles.compact : '',
        hasStats ? styles.hasStats : '',
        embedded ? styles.embedded : '',
      ].filter(Boolean).join(' ')}
    >
      <div className={styles.header}>
        <span className={styles.badge}>DEV · Spielstats Vorschau</span>
        <span className={styles.meta}>
          {hasStats ? 'Import vorhanden' : 'Noch nicht importiert'}
          {displayGame.stats?.imported_at
            ? ` · ${new Date(displayGame.stats.imported_at).toLocaleString('de-DE')}`
            : ''}
        </span>
      </div>

      {!embedded && (
        <div className={styles.matchupBar}>
          <span>{homeTeam}</span>
          {scoreLabel ? <strong className={styles.score}>{scoreLabel}</strong> : <span className={styles.vs}>vs</span>}
          <span>{awayTeam}</span>
          {displayGame.matchday ? <span className={styles.matchday}>Spieltag {displayGame.matchday}</span> : null}
        </div>
      )}

      {seasonContext && (seasonContext.home.scheduledThrough > 0 || seasonContext.away.scheduledThrough > 0) && (
        <div className={styles.seasonSlice}>
          <div className={styles.metricsTitle}>
            Bis Spieltag {seasonContext.matchday ?? '?'} · Saison-Slice (Spielplan)
          </div>
          <p className={styles.hint}>
            {seasonContext.seasonNotStarted
              ? 'Noch keine Ergebnisse bis zu diesem Spieltag — Anzeige aus dem Spielplan (angesetzte Spiele).'
              : 'Aus Katalog-Ergebnissen inkl. dieses Spiels. Punkte ≈ 3 je Sieg (OT/SO im Import nicht getrennt).'}
          </p>
          <div className={styles.statsTableWrap}>
            <table className={styles.statsTable}>
              <thead>
                <tr>
                  <th>Team</th>
                  <th>bis ST</th>
                  <th>gespielt</th>
                  <th>S-N</th>
                  <th>Pkt</th>
                  <th>Tore</th>
                  <th>Diff</th>
                  <th>Form</th>
                </tr>
              </thead>
              <tbody>
                {[seasonContext.home, seasonContext.away].map((slice) => (
                  <tr
                    key={slice.team}
                    className={slice.team === observedTeam ? styles.observedTableRow : undefined}
                  >
                    <td>{slice.team}</td>
                    <td>{slice.scheduledThrough}</td>
                    <td>{slice.gp}</td>
                    <td>
                      {slice.gp > 0 ? `${slice.wins}-${slice.losses}` : '–'}
                    </td>
                    <td>{slice.gp > 0 ? slice.points : '–'}</td>
                    <td>
                      {slice.gp > 0 ? `${slice.gf}:${slice.ga}` : '–'}
                    </td>
                    <td>{slice.gp > 0 ? formatGoalDiff(slice.gf, slice.ga) : '–'}</td>
                    <td>{formatSeasonForm(slice.form)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className={styles.sliceStack} aria-label="Saison-Slice mobil">
            {[seasonContext.home, seasonContext.away].map((slice) => (
              <div
                key={`stack-${slice.team}`}
                className={`${styles.sliceCard} ${slice.team === observedTeam ? styles.sliceCardObserved : ''}`}
              >
                <div className={styles.sliceCardTitle}>{slice.team}</div>
                <div className={styles.sliceCardGrid}>
                  <span>bis ST</span><strong>{slice.scheduledThrough}</strong>
                  <span>gespielt</span><strong>{slice.gp}</strong>
                  <span>S-N</span><strong>{slice.gp > 0 ? `${slice.wins}-${slice.losses}` : '–'}</strong>
                  <span>Pkt</span><strong>{slice.gp > 0 ? slice.points : '–'}</strong>
                  <span>Tore</span><strong>{slice.gp > 0 ? `${slice.gf}:${slice.ga}` : '–'}</strong>
                  <span>Diff</span><strong>{slice.gp > 0 ? formatGoalDiff(slice.gf, slice.ga) : '–'}</strong>
                  <span>Form</span><strong>{formatSeasonForm(slice.form)}</strong>
                </div>
              </div>
            ))}
          </div>

          {seasonContext.h2h.length > 0 && (
            <div className={styles.h2hBlock}>
              <div className={styles.metricsTitle}>
                H2H bis ST {seasonContext.matchday ?? '?'}
                {seasonContext.h2hSummaryHome
                  ? ` · Bilanz ${homeTeam}: ${seasonContext.h2hSummaryHome}`
                  : ` · ${seasonContext.h2h.length} Termin${seasonContext.h2h.length === 1 ? '' : 'e'}`}
                {seasonContext.h2hScheduled > 0
                  ? ` · ${seasonContext.h2hPlayed} gespielt / ${seasonContext.h2hScheduled} geplant`
                  : ''}
              </div>
              <ul className={styles.h2hList}>
                {seasonContext.h2h.map((meeting) => (
                  <li key={meeting.id} className={meeting.id === displayGame.id ? styles.h2hCurrent : undefined}>
                    <span>ST {meeting.matchday ?? '?'}</span>
                    <span>{formatDate(meeting.date)}</span>
                    <span>
                      {meeting.home_team_name}{' '}
                      {meeting.score ? formatGameScoreShort(meeting) : 'vs'}{' '}
                      {meeting.away_team_name}
                    </span>
                    {!meeting.score ? <span className={styles.h2hTag}>geplant</span> : null}
                    {meeting.id === displayGame.id ? <span className={styles.h2hTag}>dieses Spiel</span> : null}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {hasBoxscoreAgg && (
            <div className={styles.boxscoreAgg}>
              <div className={styles.metricsTitle}>Boxscore-Summen bis ST (nur importierte Spiele)</div>
              <p className={styles.hint}>
                Heim: {seasonContext.home.gamesWithBoxscore}/{seasonContext.home.gp} · Auswärts:{' '}
                {seasonContext.away.gamesWithBoxscore}/{seasonContext.away.gp} mit Stats-Import
              </p>
              <div className={styles.statsTableWrap}>
                <table className={styles.statsTable}>
                  <thead>
                    <tr>
                      <th>Kennzahl</th>
                      <th>{homeTeam}</th>
                      <th>{awayTeam}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>SOG (für)</td>
                      <td>{seasonContext.home.sogFor}</td>
                      <td>{seasonContext.away.sogFor}</td>
                    </tr>
                    <tr>
                      <td>SOG (gegen)</td>
                      <td>{seasonContext.home.sogAgainst}</td>
                      <td>{seasonContext.away.sogAgainst}</td>
                    </tr>
                    <tr>
                      <td>PIM</td>
                      <td>{seasonContext.home.pim}</td>
                      <td>{seasonContext.away.pim}</td>
                    </tr>
                    <tr>
                      <td>PP-Tore / PP</td>
                      <td>
                        {seasonContext.home.ppGoals}/{seasonContext.home.ppOpportunities}
                      </td>
                      <td>
                        {seasonContext.away.ppGoals}/{seasonContext.away.ppOpportunities}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {!hasStats && (
        <div className={styles.emptyState}>
          <p className={styles.lead}>
            Für diese Paarung liegen noch keine Boxscore-Daten im Katalog.
            Dev → DEL Data → <strong>Spielstats sync (Batch)</strong> oder hier <strong>Stats laden</strong>.
          </p>
          {exampleGamesWithStats.length > 0 && (
            <div className={styles.examples}>
              <div className={styles.metricsTitle}>Paarungen mit Stats (Beispiele)</div>
              <ul className={styles.examplesList}>
                {exampleGamesWithStats.slice(0, 6).map((example) => (
                  <li key={example.id}>{formatExampleLabel(example)}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <div className={styles.actions}>
        <button
          type="button"
          className="btn btn-sm"
          disabled={!canImport || importMutation.isPending}
          onClick={() => importMutation.mutate()}
        >
          {importMutation.isPending ? 'Import läuft…' : hasStats ? 'Stats neu laden' : 'Stats laden'}
        </button>
        {displayGame.stats?.overview_url && (
          <a href={displayGame.stats.overview_url} target="_blank" rel="noreferrer" className={styles.link}>
            PENNY Übersicht
          </a>
        )}
        {displayGame.stats?.boxscore_url && (
          <a href={displayGame.stats.boxscore_url} target="_blank" rel="noreferrer" className={styles.link}>
            PENNY Boxscore
          </a>
        )}
      </div>

      {importMutation.isError && (
        <p className={styles.error}>{String((importMutation.error as Error)?.message || 'Import fehlgeschlagen')}</p>
      )}

      {hasStats && teamMetrics.length > 0 && (
        <div className={styles.metrics}>
          <div className={styles.metricsTitle}>Match Statistics (dieses Spiel)</div>
          <div className={styles.statsTableWrap}>
            <table className={styles.statsTable}>
              <thead>
                <tr>
                  <th>Kennzahl</th>
                  <th>{homeTeam}</th>
                  <th>{awayTeam}</th>
                </tr>
              </thead>
              <tbody>
                {teamMetrics.map((metric) => (
                  <tr key={metric.key}>
                    <td>{metric.label}</td>
                    <td>{metric.home ?? '–'}</td>
                    <td>{metric.away ?? '–'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {hasStats && scorers.length > 0 && (
        <div className={styles.scorers}>
          <div className={styles.metricsTitle}>Top Scorer (dieses Spiel)</div>
          <ul className={styles.scorersList}>
            {scorers.map((player) => (
              <li
                key={`${player.team_name}-${player.number}-${player.name}`}
                className={player.team_name === observedTeam ? styles.observedRow : undefined}
              >
                <span>{player.name}</span>
                <span className={styles.scorerMeta}>
                  {player.team_name} · #{player.number} · {player.goals}G {player.assists}A ({player.points} P)
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {hasStats && observedRows.length > 0 && (
        <div className={styles.boxscore}>
          <div className={styles.metricsTitle}>Boxscore-Vorschau · {observedTeam}</div>
          <div className={styles.statsTableWrap}>
            <table className={styles.statsTable}>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Spieler</th>
                  <th>G</th>
                  <th>A</th>
                  <th>P</th>
                  <th>SOG</th>
                  <th>TOI</th>
                </tr>
              </thead>
              <tbody>
                {observedRows.map((player) => (
                  <tr key={`${player.number}-${player.name}`}>
                    <td>{player.number || '–'}</td>
                    <td>{player.name}</td>
                    <td>{player.goals ?? '–'}</td>
                    <td>{player.assists ?? '–'}</td>
                    <td>{player.points ?? '–'}</td>
                    <td>{player.sog ?? '–'}</td>
                    <td>{player.toi ?? '–'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {hasStats && (displayGame.stats?.warnings?.length || 0) > 0 && (
        <p className={styles.hint}>Warnungen: {displayGame.stats?.warnings?.join(' · ')}</p>
      )}
    </div>
  )
}
