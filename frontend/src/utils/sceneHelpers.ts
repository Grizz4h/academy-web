import type { SceneMarker, SceneMetadataStatus, SceneSource } from '../api'

export const SCENE_PERIOD_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'P1', label: '1. Drittel' },
  { value: 'P2', label: '2. Drittel' },
  { value: 'P3', label: '3. Drittel' },
  { value: 'OT', label: 'Verlängerung' },
  { value: 'SO', label: 'Penaltyschießen' },
]

export const SCENE_PERIOD_LABELS: Record<string, string> = {
  PRE: 'Vor dem Spiel',
  P1: '1. Drittel',
  P2: '2. Drittel',
  P3: '3. Drittel',
  OT: 'Verlängerung',
  SO: 'Penaltyschießen',
  POST: 'Nach dem Spiel',
}

export function scenePeriodLabel(period?: string | null): string {
  if (!period) return '–'
  return SCENE_PERIOD_LABELS[period] ?? period
}

/** Format hockey clock input: "1243" → "12:43", "807" → "8:07". Leading zero not forced. */
export function formatGameTimeInput(raw: string): string {
  // Always work from digits so a premature colon (after 3 digits → "1:24")
  // does not swallow the 4th digit. Do not rely on input maxLength.
  const digits = raw.replace(/\D/g, '').slice(0, 4)
  if (!digits) return ''
  if (digits.length <= 2) return digits
  return `${digits.slice(0, digits.length - 2)}:${digits.slice(-2)}`
}

export function isValidGameTime(value: string): boolean {
  return /^\d{1,2}(:\d{1,2})?$/.test(value.trim())
}

export function getSceneSource(scene: Pick<SceneMarker, 'source' | 'session_id' | 'drill_id'>): SceneSource {
  const existing = scene.source
  if (existing?.type === 'manual') {
    return {
      type: 'manual',
      session_id: null,
      drill_id: null,
      observation_id: existing.observation_id ?? null,
    }
  }
  if (existing?.type === 'drill') {
    return {
      type: 'drill',
      session_id: existing.session_id ?? scene.session_id ?? null,
      drill_id: existing.drill_id ?? scene.drill_id ?? null,
      observation_id: existing.observation_id ?? null,
    }
  }
  if (scene.session_id) {
    return {
      type: 'drill',
      session_id: scene.session_id,
      drill_id: scene.drill_id ?? null,
      observation_id: null,
    }
  }
  return {
    type: 'manual',
    session_id: null,
    drill_id: null,
    observation_id: null,
  }
}

export function isManualScene(scene: Pick<SceneMarker, 'source' | 'session_id' | 'drill_id'>): boolean {
  return getSceneSource(scene).type === 'manual'
}

export function getSceneMetadataStatus(scene: SceneMarker): SceneMetadataStatus {
  if (scene.metadata_status === 'complete' || scene.metadata_status === 'incomplete') {
    return scene.metadata_status
  }
  const hasCore = Boolean(
    scene.game_time?.trim()
    && scene.period?.trim()
    && scene.team_home?.trim()
    && scene.team_away?.trim()
    && scene.note?.trim(),
  )
  const hasObserved = Boolean((scene.observed_team_name || scene.observed_team || '').trim())
  const hasCompetition = Boolean(scene.league?.trim() && scene.season?.trim())
  return hasCore && hasObserved && hasCompetition ? 'complete' : 'incomplete'
}
