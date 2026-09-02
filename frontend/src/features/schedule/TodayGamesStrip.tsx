import { useMemo, useRef } from 'react'
import type { CatalogGame } from '../../api'
import { UiPill } from '../../components/ui'
import { formatGameTimeLabel } from '../../components/game/gameCatalogUtils'
import { resolveCatalogTeamName } from '../../data/teamShortCodes'
import { GameStripStatusIcon, gameStripStatusTitleSuffix } from './GameStripStatusIcon'
import {
  flattenTodayGames,
  leagueStripLabel,
  pairingStripLabel,
} from './flattenTodayGames'
import type { ScheduleLeague } from './scheduleLeagues'
import { useTodayGamesStripScroll } from './useTodayGamesStripScroll'
import styles from './TodayGamesStrip.module.css'

type TodayGamesStripProps = {
  gamesByLeague: Partial<Record<ScheduleLeague, CatalogGame[]>>
  onSelectGame?: (game: CatalogGame) => void
  devPreview?: boolean
}

function StripItem({
  game,
  onSelect,
}: {
  game: CatalogGame
  onSelect?: (game: CatalogGame) => void
}) {
  const homeFull = resolveCatalogTeamName(game.home_team_name || game.home_team_id, game.league_id, game.season_id)
  const awayFull = resolveCatalogTeamName(game.away_team_name || game.away_team_id, game.league_id, game.season_id)
  const statusLabel = gameStripStatusTitleSuffix(game)

  return (
    <button
      type="button"
      className={styles.item}
      onClick={() => onSelect?.(game)}
      title={`${homeFull} vs ${awayFull} · ${statusLabel}`}
    >
      <span className={styles.league}>{leagueStripLabel(game.league_id)}</span>
      <span className={styles.time}>{formatGameTimeLabel(game.time, { omitSuffix: true }) || '–'}</span>
      <span className={styles.pairing}>{pairingStripLabel(game)}</span>
      <GameStripStatusIcon game={game} />
    </button>
  )
}

export default function TodayGamesStrip({
  gamesByLeague,
  onSelectGame,
  devPreview = false,
}: TodayGamesStripProps) {
  const games = useMemo(() => flattenTodayGames(gamesByLeague), [gamesByLeague])
  const barRef = useRef<HTMLElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const loopRef = useRef<HTMLDivElement>(null)

  // Always attach for press/tap lock; auto-scroll only kicks in with 2+ games.
  useTodayGamesStripScroll(scrollRef, loopRef, games.length > 1, { hoverRef: barRef })

  if (games.length === 0) return null

  const items = games.map((game) => (
    <StripItem key={game.id} game={game} onSelect={onSelectGame} />
  ))
  const loopItems = games.map((game) => (
    <StripItem key={`${game.id}-loop`} game={game} onSelect={onSelectGame} />
  ))

  return (
    <section ref={barRef} className={styles.bar} aria-label="Spiele heute">
      <div className={styles.inner}>
        <div className={styles.label}>
          <span>Heute</span>
          {devPreview ? <UiPill tone="warn">DEV</UiPill> : null}
        </div>
        <div ref={scrollRef} className={styles.viewport}>
          <div ref={loopRef} className={styles.track}>
            {items}
            {games.length > 1 ? (
              <>
                <span className={styles.divider} aria-hidden="true" />
                {loopItems}
              </>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  )
}
