export type TutorialStatus = 'not_started' | 'in_progress' | 'completed' | 'dismissed'

export type TutorialPlacement = 'top' | 'bottom' | 'left' | 'right' | 'center'

export type TutorialStepKind = 'explain' | 'show' | 'do' | 'confirm'

export type TutorialActionRequirement =
  | { type: 'click'; targetId: string }
  | { type: 'route'; match: string }
  | { type: 'event'; name: string }
  | { type: 'acknowledge' }

export type TutorialWhen = {
  feature?: string
}

export type TutorialStep = {
  id: string
  kind: TutorialStepKind
  route?: string
  targetId?: string
  title: string
  body: string
  placement?: TutorialPlacement
  action?: TutorialActionRequirement
  canSkip?: boolean
  optional?: boolean
  /** Dim stays visible, but the page remains usable (e.g. finish a lesson first). */
  allowPageInteraction?: boolean
  when?: TutorialWhen
}

export type TutorialDefinition = {
  id: string
  version: number
  title: string
  steps: TutorialStep[]
}

export type TutorialProgress = {
  tutorialId: string
  version: number
  status: TutorialStatus
  currentStepId?: string
  completedStepIds: string[]
  startedAt?: string
  completedAt?: string
  dismissedAt?: string
}

export type TutorialSurface = 'none' | 'welcome' | 'resume' | 'active' | 'complete' | 'end-confirm'

export type TutorialContextValue = {
  tutorialId: string
  version: number
  progress: TutorialProgress
  definition: TutorialDefinition
  steps: TutorialStep[]
  currentStep: TutorialStep | null
  currentIndex: number
  stepCount: number
  surface: TutorialSurface
  active: boolean
  isSurfaceOpen: boolean
  entryModuleId: string | null
  targetMissing: boolean
  start: () => void
  resume: () => void
  later: () => void
  dismiss: () => void
  complete: () => void
  restart: () => void
  resetState: () => void
  /** DEV: reset tutorial + force welcome surface (ignores prior sessions). */
  simulateNewProfile: () => void
  next: () => void
  back: () => void
  goToStep: (stepId: string) => void
  requestEnd: () => void
  cancelEnd: () => void
  confirmEnd: () => void
}
