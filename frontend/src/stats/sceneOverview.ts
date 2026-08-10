import type { SceneMarker } from '../api'

export type ScenePoolStatus = 'NEW' | 'PIPELINE' | 'ASSIGNED'

export type ScenePoolOverview = {
  total: number
  new: number
  pipeline: number
  assigned: number
}

export function normalizeScenePoolStatus(scene: Pick<SceneMarker, 'status'>): ScenePoolStatus {
  const value = String(scene.status || 'NEW').toUpperCase()
  if (value === 'ASSIGNED' || value === 'PIPELINE') return value
  return 'NEW'
}

export function computeScenePoolOverview(scenes: SceneMarker[]): ScenePoolOverview {
  let assigned = 0
  let pipeline = 0
  let neu = 0

  for (const scene of scenes) {
    const status = normalizeScenePoolStatus(scene)
    if (status === 'ASSIGNED') assigned += 1
    else if (status === 'PIPELINE') pipeline += 1
    else neu += 1
  }

  return {
    total: scenes.length,
    new: neu,
    pipeline,
    assigned,
  }
}

export type SceneInsightsOverview = {
  total: number
  published: number
  unpublished: number
  teamCount: number
  leagueFilter?: string
}

export function scenePoolStatusLabel(status: ScenePoolStatus): string {
  if (status === 'ASSIGNED') return 'Zugeordnet'
  if (status === 'PIPELINE') return 'Pipeline'
  return 'Neu'
}
