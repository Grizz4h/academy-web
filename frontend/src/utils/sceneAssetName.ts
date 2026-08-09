import { formatMatchupShortCodes } from '../data/teamShortCodes'
import { getSceneSource } from './sceneHelpers'
import type { SceneMarker } from '../api'

export const MANUAL_SCENE_SLUG = 'Manual'

export type SceneAssetNameInput = {
  sceneCode?: string | null
  teamHome?: string | null
  teamAway?: string | null
  period?: string | null
  gameTime?: string | null
  sourceType?: 'drill' | 'manual' | null
  drillId?: string | null
  /** Editorial slug from drill catalog (`sceneSlug`). */
  sceneSlug?: string | null
}

export type SceneAssetNameResult =
  | { ok: true; name: string }
  | { ok: false; missing: string[] }

const PERIOD_TOKEN_BY_VALUE: Record<string, string> = {
  P1: 'P1',
  P2: 'P2',
  P3: 'P3',
  OT: 'OT',
  SO: 'SO',
}

/** Defensive slug cleanup for already-editorial sceneSlug values. */
export function normalizeSceneSlug(raw: string | null | undefined): string | null {
  if (!raw) return null
  let value = String(raw).trim()
  if (!value) return null

  value = value
    .replace(/[/:\\]+/g, '-')
    .replace(/\s+/g, '-')
    .replace(/_+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')

  return value || null
}

/** `9:15` / `09:15` → `T09-15` */
export function formatSceneAssetClock(raw: string | null | undefined): string | null {
  const text = String(raw || '').trim()
  if (!text) return null

  const match = text.match(/^(\d{1,2})(?::(\d{1,2}))?$/)
  if (!match) return null

  const minutes = Number(match[1])
  const seconds = match[2] !== undefined ? Number(match[2]) : 0
  if (!Number.isFinite(minutes) || !Number.isFinite(seconds)) return null
  if (minutes < 0 || minutes > 99 || seconds < 0 || seconds > 59) return null

  return `T${String(minutes).padStart(2, '0')}-${String(seconds).padStart(2, '0')}`
}

export function formatSceneAssetPeriod(raw: string | null | undefined): string | null {
  const key = String(raw || '').trim().toUpperCase()
  if (!key) return null
  return PERIOD_TOKEN_BY_VALUE[key] || null
}

export function resolveSceneAssetSlug(input: SceneAssetNameInput): string | null {
  const sourceType = input.sourceType || (input.drillId ? 'drill' : 'manual')
  if (sourceType === 'manual') {
    return MANUAL_SCENE_SLUG
  }
  return normalizeSceneSlug(input.sceneSlug)
}

/**
 * Builds `{SCENE_ID}_{HOME-AWAY}_{PERIOD}_{TIME}_{DRILL_SLUG}` on demand.
 * Never invents team codes; never persists the result on the scene.
 */
export function generateSceneAssetName(input: SceneAssetNameInput): SceneAssetNameResult {
  const missing: string[] = []

  const sceneId = String(input.sceneCode || '').trim()
  if (!sceneId) missing.push('Szenen-ID')

  const matchup = formatMatchupShortCodes(input.teamHome, input.teamAway)
  if (!matchup) missing.push('Paarung')

  const period = formatSceneAssetPeriod(input.period)
  if (!period) missing.push('Drittel')

  const clock = formatSceneAssetClock(input.gameTime)
  if (!clock) missing.push('Spielzeit')

  const sourceType = input.sourceType || (input.drillId ? 'drill' : 'manual')
  const slug = resolveSceneAssetSlug({ ...input, sourceType })
  if (!slug) {
    missing.push(sourceType === 'manual' ? 'Quelle' : 'Drill-Slug')
  }

  if (missing.length > 0 || !sceneId || !matchup || !period || !clock || !slug) {
    return { ok: false, missing: [...new Set(missing)] }
  }

  return {
    ok: true,
    name: `${sceneId}_${matchup}_${period}_${clock}_${slug}`,
  }
}

export function generateSceneAssetNameFromScene(
  scene: Pick<
    SceneMarker,
    | 'scene_code'
    | 'internal_scene_id'
    | 'id'
    | 'team_home'
    | 'team_away'
    | 'period'
    | 'game_time'
    | 'source'
    | 'session_id'
    | 'drill_id'
  >,
  options?: { sceneSlug?: string | null },
): SceneAssetNameResult {
  const source = getSceneSource(scene)
  return generateSceneAssetName({
    sceneCode: scene.scene_code || scene.internal_scene_id || null,
    teamHome: scene.team_home,
    teamAway: scene.team_away,
    period: scene.period,
    gameTime: scene.game_time,
    sourceType: source.type,
    drillId: source.drill_id || scene.drill_id,
    sceneSlug: options?.sceneSlug,
  })
}

export async function copyTextToClipboard(text: string): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text)
    return true
  }

  if (typeof document === 'undefined') return false
  const area = document.createElement('textarea')
  area.value = text
  area.setAttribute('readonly', '')
  area.style.position = 'fixed'
  area.style.left = '-9999px'
  document.body.appendChild(area)
  area.select()
  const ok = document.execCommand('copy')
  document.body.removeChild(area)
  return ok
}
