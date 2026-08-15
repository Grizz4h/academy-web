import type { TutorialProgress, TutorialStatus } from './types'

const STORAGE_PREFIX = 'academy.tutorial.'

export function emptyProgress(tutorialId: string, version: number): TutorialProgress {
  return {
    tutorialId,
    version,
    status: 'not_started',
    completedStepIds: [],
  }
}

export function readLocalProgress(user: string, tutorialId: string, version: number): TutorialProgress {
  try {
    const raw = localStorage.getItem(storageKey(user, tutorialId))
    if (!raw) return emptyProgress(tutorialId, version)
    const parsed = JSON.parse(raw) as TutorialProgress
    return normalizeProgress(parsed, tutorialId, version)
  } catch {
    return emptyProgress(tutorialId, version)
  }
}

export function writeLocalProgress(user: string, progress: TutorialProgress): void {
  try {
    localStorage.setItem(storageKey(user, progress.tutorialId), JSON.stringify(progress))
  } catch {
    // private mode / quota
  }
}

export function clearLocalProgress(user: string, tutorialId: string): void {
  try {
    localStorage.removeItem(storageKey(user, tutorialId))
  } catch {
    // ignore
  }
}

export function progressFromPreferences(
  preferences: Record<string, unknown> | undefined,
  tutorialId: string,
  version: number,
): TutorialProgress | null {
  const tutorials = preferences?.tutorials
  if (!tutorials || typeof tutorials !== 'object') return null
  const entry = (tutorials as Record<string, unknown>)[tutorialId]
  if (!entry || typeof entry !== 'object') return null
  return normalizeProgress(entry as TutorialProgress, tutorialId, version)
}

export function mergeTutorialPreferences(
  preferences: Record<string, unknown> | undefined,
  progress: TutorialProgress,
): Record<string, unknown> {
  const current = preferences && typeof preferences === 'object' ? { ...preferences } : {}
  const tutorials = current.tutorials && typeof current.tutorials === 'object'
    ? { ...(current.tutorials as Record<string, unknown>) }
    : {}
  tutorials[progress.tutorialId] = progress
  current.tutorials = tutorials
  return current
}

export function pickFresherProgress(local: TutorialProgress, remote: TutorialProgress | null): TutorialProgress {
  if (!remote) return local
  const localRank = statusRank(local.status)
  const remoteRank = statusRank(remote.status)
  if (remoteRank > localRank) return remote
  if (localRank > remoteRank) return local
  const localSteps = local.completedStepIds?.length || 0
  const remoteSteps = remote.completedStepIds?.length || 0
  return remoteSteps > localSteps ? remote : local
}

function storageKey(user: string, tutorialId: string): string {
  return `${STORAGE_PREFIX}${user}.${tutorialId}`
}

function normalizeProgress(value: TutorialProgress, tutorialId: string, version: number): TutorialProgress {
  const status = isStatus(value.status) ? value.status : 'not_started'
  return {
    tutorialId,
    version: typeof value.version === 'number' ? value.version : version,
    status,
    currentStepId: typeof value.currentStepId === 'string' ? value.currentStepId : undefined,
    completedStepIds: Array.isArray(value.completedStepIds)
      ? value.completedStepIds.filter((id): id is string => typeof id === 'string')
      : [],
    startedAt: typeof value.startedAt === 'string' ? value.startedAt : undefined,
    completedAt: typeof value.completedAt === 'string' ? value.completedAt : undefined,
    dismissedAt: typeof value.dismissedAt === 'string' ? value.dismissedAt : undefined,
  }
}

function isStatus(value: unknown): value is TutorialStatus {
  return value === 'not_started' || value === 'in_progress' || value === 'completed' || value === 'dismissed'
}

function statusRank(status: TutorialStatus): number {
  if (status === 'completed') return 3
  if (status === 'in_progress') return 2
  if (status === 'dismissed') return 1
  return 0
}
