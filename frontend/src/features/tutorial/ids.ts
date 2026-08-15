/** Stable tutorial target IDs. Use with data-tutorial-id. */

export const TUTORIAL_ID = {
  mainOnboarding: 'main_onboarding',
} as const

export const TUTORIAL_TARGET = {
  navStart: 'nav-start',
  navAcademy: 'nav-academy',
  navHistory: 'nav-history',
  navLocker: 'nav-locker',
  navStats: 'nav-stats',
  navScenes: 'nav-scenes',
  navAccount: 'nav-account',
  homeNextStep: 'home-next-step',
  homeStartT0: 'home-start-t0',
  homeStartA1: 'home-start-a1',
  academyTitle: 'academy-title',
  academyTrackList: 'academy-track-list',
  academyEntryStart: 'academy-entry-start',
  academyEntryTrack: 'academy-entry-track',
  setupMain: 'setup-main',
  setupStart: 'setup-start',
  sessionDrill: 'session-drill',
  sessionAdvance: 'session-advance',
  sessionResult: 'session-result',
  historyList: 'history-list',
  lockerHome: 'locker-home',
  accountIdentity: 'account-identity',
} as const

export type TutorialTargetId = (typeof TUTORIAL_TARGET)[keyof typeof TUTORIAL_TARGET]

const NAV_TARGET_BY_PATH: Record<string, TutorialTargetId> = {
  '/': TUTORIAL_TARGET.navStart,
  '/curriculum': TUTORIAL_TARGET.navAcademy,
  '/history': TUTORIAL_TARGET.navHistory,
  '/locker': TUTORIAL_TARGET.navLocker,
  '/progress': TUTORIAL_TARGET.navStats,
  '/ringabout': TUTORIAL_TARGET.navScenes,
}

export function navTutorialTarget(path: string): TutorialTargetId | undefined {
  return NAV_TARGET_BY_PATH[path]
}

export function tutorialTargetProps(id: string) {
  return { 'data-tutorial-id': id }
}
