import { useEffect, useMemo, useState } from 'react'
import type { CatalogGame } from '../../api'
import { COMPETITION_CONFIGS } from '../../data/competitionConfig'
import { UiChip, UiPill } from '../../components/ui'
import TodayMatchdaySlate from '../../components/game/TodayMatchdaySlate'
import { localTodayIsoDate } from '../../components/game/gameCatalogUtils'
import type { ScheduleLeague } from './scheduleLeagues'
import { SCHEDULE_LEAGUES } from './scheduleLeagues'
import { useSpoilerProtection } from './useSpoilerProtection'
import styles from './TodayGamesBanner.module.css'

type TodayGamesBannerProps = {
  gamesByLeague: Partial<Record<ScheduleLeague, CatalogGame[]>>
  date?: string
  onSelectGame?: (game: CatalogGame) => void
  hint?: string
  /** DevLab dummy slate — shows preview badge, no real import data. */
  devPreview?: boolean
}

function leagueLabel(league: ScheduleLeague): string {
  return COMPETITION_CONFIGS[league]?.label || league.replace(/_/g, ' ')
}

export default function TodayGamesBanner({
  gamesByLeague,
  date = localTodayIsoDate(),
  onSelectGame,
  hint,
  devPreview = false,
}: TodayGamesBannerProps) {
  const [hideSpoilers] = useSpoilerProtection()
  const leaguesWithGames = useMemo(
    () => SCHEDULE_LEAGUES.filter((league) => (gamesByLeague[league]?.length ?? 0) > 0),
    [gamesByLeague],
  )

  const [activeLeague, setActiveLeague] = useState<ScheduleLeague>(() => leaguesWithGames[0] || 'DEL')

  useEffect(() => {
    if (leaguesWithGames.length > 0 && !leaguesWithGames.includes(activeLeague)) {
      setActiveLeague(leaguesWithGames[0])
    }
  }, [activeLeague, leaguesWithGames])

  if (leaguesWithGames.length === 0) return null

  const totalGames = leaguesWithGames.reduce(
    (sum, league) => sum + (gamesByLeague[league]?.length ?? 0),
    0,
  )
  const activeGames = gamesByLeague[activeLeague] || []

  return (
    <section className={styles.wrap} aria-label="Spiele heute">
      <div className={styles.summary}>
        <div className={styles.titleRow}>
          <h2 className={styles.title}>Spiele heute</h2>
          {devPreview ? (
            <UiPill tone="warn">DEV · Dummy</UiPill>
          ) : null}
        </div>
        <p className={styles.lead}>
          {totalGames} {totalGames === 1 ? 'Paarung' : 'Paarungen'}
          {leaguesWithGames.length > 1 ? ` in ${leaguesWithGames.length} Ligen` : ''}
        </p>
      </div>

      {leaguesWithGames.length > 1 ? (
        <div className={styles.chips} role="tablist" aria-label="Liga">
          {leaguesWithGames.map((league) => (
            <UiChip
              key={league}
              size="sm"
              active={activeLeague === league}
              onClick={() => setActiveLeague(league)}
              aria-label={`${leagueLabel(league)} (${gamesByLeague[league]?.length ?? 0})`}
            >
              {leagueLabel(league)} ({gamesByLeague[league]?.length ?? 0})
            </UiChip>
          ))}
        </div>
      ) : null}

      <TodayMatchdaySlate
        league={leagueLabel(activeLeague)}
        games={activeGames}
        date={date}
        onSelectGame={onSelectGame}
        showScores={!hideSpoilers}
        hint={hint || (onSelectGame
          ? 'Tippe eine Paarung — Session-Vorbereitung übernimmt Liga, Teams und Spieltag.'
          : undefined)}
      />
    </section>
  )
}
