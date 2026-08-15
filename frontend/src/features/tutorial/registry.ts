import { MAIN_ONBOARDING } from './config/mainOnboarding'
import { TUTORIAL_ID } from './ids'
import type { TutorialDefinition } from './types'

const TUTORIALS: Record<string, TutorialDefinition> = {
  [TUTORIAL_ID.mainOnboarding]: MAIN_ONBOARDING,
}

export function getTutorialDefinition(tutorialId: string = TUTORIAL_ID.mainOnboarding): TutorialDefinition {
  return TUTORIALS[tutorialId] || MAIN_ONBOARDING
}

export function listTutorialIds(): string[] {
  return Object.keys(TUTORIALS)
}
