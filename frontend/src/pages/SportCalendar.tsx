import { useMemo, useState } from 'react'
import type { CatalogGame } from '../api'
import Card from '../components/Card'
import TodayMatchdaySlate from '../components/game/TodayMatchdaySlate'
import { SpoilerProtectionToggle } from '../components/game/SpoilerProtectionToggle'
import { COMPETITION_CONFIGS } from '../data/competitionConfig'
import { useGameSetupLauncher } from '../features/schedule/GameSetupLauncherProvider'
import { SCHEDULE_LEAGUES, type ScheduleLeague } from '../features/schedule/scheduleLeagues'
import { useScheduleLeaguesGames } from '../features/schedule/useScheduleLeaguesGames'
import { useSpoilerProtection } from '../features/schedule/useSpoilerProtection'
import { localTodayIsoDate } from '../components/game/gameCatalogUtils'
import styles from './SportCalendar.module.css'

function leagueLabel(league: ScheduleLeague): string {
  return COMPETITION_CONFIGS[league]?.label || league.replace(/_/g, ' ')
}

function monthLabel(date: Date): string {
  return date.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })
}

function buildMonthGrid(viewMonth: Date): Array<{ iso: string; inMonth: boolean; day: number }> {
  const year = viewMonth.getFullYear()
  const month = viewMonth.getMonth()
  const first = new Date(year, month, 1)
  const startOffset = (first.getDay() + 6) % 7
  const cells: Array<{ iso: string; inMonth: boolean; day: number }> = []

  for (let index = 0; index < 42; index += 1) {
    const dayNumber = index - startOffset + 1
    const cellDate = new Date(year, month, dayNumber)
    const iso = `${cellDate.getFullYear()}-${String(cellDate.getMonth() + 1).padStart(2, '0')}-${String(cellDate.getDate()).padStart(2, '0')}`
    cells.push({
      iso,
      inMonth: cellDate.getMonth() === month,
      day: cellDate.getDate(),
    })
  }

  return cells
}

function gamesByDate(games: CatalogGame[]): Map<string, CatalogGame[]> {
  const map = new Map<string, CatalogGame[]>()
  games.forEach((game) => {
    if (!game.date) return
    const bucket = map.get(game.date) || []
    bucket.push(game)
    map.set(game.date, bucket)
  })
  return map
}

export default function SportCalendarPage() {
  const { requestGameSetup } = useGameSetupLauncher()
  const [hideSpoilers] = useSpoilerProtection()
  const [viewMonth, setViewMonth] = useState(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1)
  })
  const [selectedDate, setSelectedDate] = useState(localTodayIsoDate())

  const { allGames, gamesByLeague, isLoading } = useScheduleLeaguesGames({
    referenceDate: viewMonth,
  })

  const dateIndex = useMemo(() => gamesByDate(allGames), [allGames])
  const monthCells = useMemo(() => buildMonthGrid(viewMonth), [viewMonth])
  const selectedGames = dateIndex.get(selectedDate) || []
  const today = localTodayIsoDate()

  const selectedByLeague = useMemo(() => {
    const out: Partial<Record<ScheduleLeague, CatalogGame[]>> = {}
    SCHEDULE_LEAGUES.forEach((league) => {
      const games = (gamesByLeague[league] || []).filter((game) => game.date === selectedDate)
      if (games.length > 0) out[league] = games
    })
    return out
  }, [gamesByLeague, selectedDate])

  const shiftMonth = (delta: number) => {
    setViewMonth((current) => new Date(current.getFullYear(), current.getMonth() + delta, 1))
  }

  const handleSelectGame = (game: CatalogGame) => {
    requestGameSetup(game)
  }

  return (
    <div className={`${styles.page} ui-page-shell`}>
      <header className="ui-page-header">
        <h1 className="ui-page-title">Sport-Kalender</h1>
        <p className="ui-page-lead">
          Importierte Spielpläne für DEL, DEL2, CHL, U20 DNL und NHL — Creator-Ansicht.
        </p>
      </header>

      <Card surface="primary" className={styles.calendarCard}>
        <div className={styles.monthNav}>
          <button type="button" className={styles.monthBtn} onClick={() => shiftMonth(-1)} aria-label="Vorheriger Monat">
            ‹
          </button>
          <h2 className={styles.monthTitle}>{monthLabel(viewMonth)}</h2>
          <button type="button" className={styles.monthBtn} onClick={() => shiftMonth(1)} aria-label="Nächster Monat">
            ›
          </button>
        </div>

        <div className={styles.weekdays} aria-hidden="true">
          {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map((label) => (
            <span key={label}>{label}</span>
          ))}
        </div>

        <div className={styles.grid} role="grid" aria-label={`Kalender ${monthLabel(viewMonth)}`}>
          {monthCells.map((cell) => {
            const count = cell.inMonth ? (dateIndex.get(cell.iso)?.length ?? 0) : 0
            const isSelected = cell.iso === selectedDate
            const isToday = cell.iso === today
            return (
              <button
                key={cell.iso}
                type="button"
                role="gridcell"
                className={[
                  styles.day,
                  !cell.inMonth ? styles.dayOutside : '',
                  count > 0 ? styles.dayHasGames : '',
                  isSelected ? styles.daySelected : '',
                  isToday ? styles.dayToday : '',
                ].filter(Boolean).join(' ')}
                disabled={!cell.inMonth}
                onClick={() => setSelectedDate(cell.iso)}
                aria-pressed={isSelected}
                aria-label={`${cell.day}. ${count > 0 ? `${count} Spiele` : 'Keine Spiele'}`}
              >
                <span className={styles.dayNumber}>{cell.day}</span>
                {count > 0 ? <span className={styles.dayBadge}>{count}</span> : null}
              </button>
            )
          })}
        </div>

        {isLoading ? <p className={styles.note}>Spielpläne werden geladen …</p> : null}
      </Card>

      <Card surface="section" className={styles.detailCard}>
        <div className={styles.detailHeader}>
          <h2 className="ui-section-title">
            {new Date(`${selectedDate}T12:00:00`).toLocaleDateString('de-DE', {
              weekday: 'long',
              day: '2-digit',
              month: 'long',
              year: 'numeric',
            })}
          </h2>
          <SpoilerProtectionToggle className={styles.spoilerToggle} />
        </div>

        {selectedGames.length === 0 ? (
          <p className={styles.note}>Keine importierten Spiele an diesem Tag.</p>
        ) : (
          <div className={styles.leagueBlocks}>
            {SCHEDULE_LEAGUES.map((league) => {
              const games = selectedByLeague[league]
              if (!games?.length) return null
              return (
                <div key={league} className={styles.leagueBlock}>
                  <TodayMatchdaySlate
                    league={leagueLabel(league)}
                    games={games}
                    date={selectedDate}
                    onSelectGame={handleSelectGame}
                    showScores={!hideSpoilers}
                  />
                </div>
              )
            })}
          </div>
        )}
      </Card>
    </div>
  )
}
