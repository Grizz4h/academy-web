import type { CatalogGame } from '../../api'
import { formatGameStripStatusLabel } from '../../components/game/gameCatalogUtils'
import styles from './GameStripStatusIcon.module.css'

type GameStripStatusIconProps = {
  game: CatalogGame
}

/** Compact strip status — Live: red dot · Beendet: check · Geplant: nothing (time is enough). */
export function GameStripStatusIcon({ game }: GameStripStatusIconProps) {
  const status = formatGameStripStatusLabel(game)

  if (status === 'Geplant') return null

  return (
    <span className={styles.wrap} role="img" aria-label={status}>
      {status === 'Live' ? (
        <svg className={styles.live} viewBox="0 0 8 8" aria-hidden="true">
          <circle cx="4" cy="4" r="3" />
        </svg>
      ) : (
        <svg className={styles.ended} viewBox="0 0 10 10" aria-hidden="true">
          <path
            d="M2 5.3 4.1 7.2 8 2.8"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </span>
  )
}

export function gameStripStatusTitleSuffix(game: CatalogGame): string {
  return formatGameStripStatusLabel(game)
}
