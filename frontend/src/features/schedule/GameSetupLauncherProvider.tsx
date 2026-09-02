import {
  createContext,
  useCallback,
  useContext,
  type ReactNode,
} from 'react'
import { useNavigate } from 'react-router-dom'
import type { CatalogGame } from '../../api'
import { stashGameSetupPrefill } from './gameSetupPrefill'

type GameSetupLauncherContextValue = {
  requestGameSetup: (game: CatalogGame) => void
}

const GameSetupLauncherContext = createContext<GameSetupLauncherContextValue | null>(null)

export function GameSetupLauncherProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate()

  const requestGameSetup = useCallback((game: CatalogGame) => {
    stashGameSetupPrefill(game)
    navigate('/curriculum')
  }, [navigate])

  return (
    <GameSetupLauncherContext.Provider value={{ requestGameSetup }}>
      {children}
    </GameSetupLauncherContext.Provider>
  )
}

export function useGameSetupLauncher(): GameSetupLauncherContextValue {
  const context = useContext(GameSetupLauncherContext)
  if (!context) {
    throw new Error('useGameSetupLauncher must be used within GameSetupLauncherProvider')
  }
  return context
}
