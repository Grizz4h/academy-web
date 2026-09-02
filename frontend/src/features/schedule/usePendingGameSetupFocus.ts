import { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import type { Curriculum, Session } from '../../api'
import type { HockeyExperienceLevel } from '../../data/profile/types'
import { peekGameSetupPrefill, type GameSetupPrefill } from './gameSetupPrefill'
import { resolveSetupTrackChoices } from './resolveSetupTrackChoices'

export type PendingGameSetupFocus = {
  trackId: string
  moduleId: string
  nextStepLead: string
}

export function usePendingGameSetupFocus(args: {
  curriculum: Curriculum | null | undefined
  sessions: Session[] | null | undefined
  hockeyExperience?: HockeyExperienceLevel | null
  devMode?: boolean
  tutorialActive?: boolean
}): {
  prefill: GameSetupPrefill | null
  focus: PendingGameSetupFocus | null
  refreshPrefill: () => void
} {
  const location = useLocation()
  const [prefill, setPrefill] = useState(() => peekGameSetupPrefill())

  const refreshPrefill = () => {
    setPrefill(peekGameSetupPrefill())
  }

  useEffect(() => {
    refreshPrefill()
  }, [location.key])

  const focus = useMemo(() => {
    if (!prefill) return null
    const result = resolveSetupTrackChoices({
      curriculum: args.curriculum,
      sessions: args.sessions,
      hockeyExperience: args.hockeyExperience,
      devMode: args.devMode,
      tutorialActive: args.tutorialActive,
    })
    const choice = result.choices.find((item) => item.id === result.recommendedChoiceId) || result.choices[0]
    if (!choice) return null
    return {
      trackId: choice.trackId,
      moduleId: choice.moduleId,
      nextStepLead: result.nextStepLead,
    }
  }, [
    prefill,
    args.curriculum,
    args.sessions,
    args.hockeyExperience,
    args.devMode,
    args.tutorialActive,
  ])

  return { prefill, focus, refreshPrefill }
}
