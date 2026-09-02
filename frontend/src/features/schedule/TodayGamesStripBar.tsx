import { useUser } from '../../context/UserContext'
import { useGameSetupLauncher } from './GameSetupLauncherProvider'
import TodayGamesStrip from './TodayGamesStrip'
import { useTodayGamesSchedule } from './useTodayGamesSchedule'

/**
 * Live score strip under TopNav.
 * Real imported games only — hidden when nothing is scheduled today.
 * Dev dummy slate stays in DevLab and must never drive this bar.
 */
export default function TodayGamesStripBar() {
  const { user } = useUser()
  const { requestGameSetup } = useGameSetupLauncher()
  const { gamesByLeague, leaguesWithGames } = useTodayGamesSchedule({
    enabled: Boolean(user),
  })

  if (!user || leaguesWithGames.length === 0) return null

  return (
    <TodayGamesStrip
      gamesByLeague={gamesByLeague}
      onSelectGame={requestGameSetup}
    />
  )
}
