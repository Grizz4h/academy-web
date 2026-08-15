import type { Curriculum } from '../../api'
import type { HockeyExperienceLevel } from '../../data/profile/types'
import {
  getFoundationModule,
  selectNextStepRecommendation,
  type NextStepRecommendation,
} from '../foundation/recommendations'

/**
 * Tutorial entry: new or beginner users get Foundation (no game picker).
 * Experienced users keep the normal academy recommendation.
 */
export function selectTutorialEntryRecommendation(args: {
  curriculum: Curriculum | undefined | null
  completedDrillIds: Set<string>
  hockeyExperience: HockeyExperienceLevel | null | undefined
}): NextStepRecommendation {
  const { curriculum, completedDrillIds, hockeyExperience } = args
  const treatAsBeginner = hockeyExperience !== 'familiar' && hockeyExperience !== 'advanced'
  if (treatAsBeginner && getFoundationModule(curriculum)) {
    return selectNextStepRecommendation({
      curriculum,
      completedDrillIds,
      hockeyExperience: 'beginner',
    })
  }
  return selectNextStepRecommendation({
    curriculum,
    completedDrillIds,
    hockeyExperience,
  })
}
