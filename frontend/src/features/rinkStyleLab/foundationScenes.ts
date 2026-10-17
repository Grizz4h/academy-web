/**
 * Read-only projection of Track 0 rink scenes for the Style Lab.
 * Curriculum JSON is not modified — we only select steps that use the rink.
 */

import type {
  FoundationAttackDirection,
  FoundationMarkerOverride,
  FoundationMarkerTeam,
  FoundationRinkRegionId,
} from '../foundation/types'
import type { StyleLabLearning } from './presets'

export type FoundationScene = {
  id: string
  drillId: string
  label: string
  prompt: string
  type: string
  showMarkers: FoundationRinkRegionId[]
  markerOverrides: Partial<Record<FoundationRinkRegionId, FoundationMarkerOverride>>
  attackDirection: FoundationAttackDirection
  /**
   * Scene wants a direction cue (Foundation: arrow; Detailed lab: board chevrons).
   * Matches Foundation hideAttackArrow + no-markers rule.
   */
  showAttackArrow: boolean
  weakSideBand?: 'top' | 'bottom'
  correctRegions?: FoundationRinkRegionId[]
  learning?: Partial<StyleLabLearning>
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  return value as Record<string, unknown>
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined
}

function asBool(value: unknown): boolean | undefined {
  return typeof value === 'boolean' ? value : undefined
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is string => typeof item === 'string')
}

function parseTeam(value: unknown): FoundationMarkerTeam | undefined {
  if (value === 'blue' || value === 'red' || value === 'neutral') return value
  return undefined
}

function parseMarkerOverride(value: unknown): FoundationMarkerOverride {
  const raw = asRecord(value) || {}
  const kind = raw.kind === 'player' || raw.kind === 'puck' ? raw.kind : undefined
  return {
    cx: typeof raw.cx === 'number' ? raw.cx : undefined,
    cy: typeof raw.cy === 'number' ? raw.cy : undefined,
    label: asString(raw.label),
    team: parseTeam(raw.team),
    kind,
    hasPuck: asBool(raw.hasPuck),
  }
}

function parseMarkerOverrides(
  value: unknown,
): Partial<Record<FoundationRinkRegionId, FoundationMarkerOverride>> {
  const raw = asRecord(value)
  if (!raw) return {}
  const next: Partial<Record<FoundationRinkRegionId, FoundationMarkerOverride>> = {}
  for (const [key, entry] of Object.entries(raw)) {
    next[key as FoundationRinkRegionId] = parseMarkerOverride(entry)
  }
  return next
}

function isRinkScene(step: Record<string, unknown>): boolean {
  const markers = asStringArray(step.showMarkers)
  if (markers.length > 0) return true
  if (step.weakSideBand === 'top' || step.weakSideBand === 'bottom') return true
  if (step.type === 'identify_region') return true
  return false
}

/**
 * Extract lab scenes from a t0-track.json-shaped object.
 * Accepts `unknown` so Vite JSON imports (wide inferred types) typecheck.
 */
export function extractFoundationScenes(raw: unknown): FoundationScene[] {
  const root = asRecord(raw)
  const track = asRecord(root?.track)
  const modules = Array.isArray(track?.modules) ? track.modules : []
  const firstModule = asRecord(modules[0])
  const drills = Array.isArray(firstModule?.drills) ? firstModule.drills : []

  const scenes: FoundationScene[] = []
  for (const drillRaw of drills) {
    const drill = asRecord(drillRaw)
    if (!drill) continue
    const config = asRecord(drill.config)
    const steps = Array.isArray(config?.steps) ? config.steps : []
    for (const stepRaw of steps) {
      const step = asRecord(stepRaw)
      if (!step) continue
      const id = asString(step.id)
      if (!id || !isRinkScene(step)) continue

      const showMarkers = asStringArray(step.showMarkers) as FoundationRinkRegionId[]
      const weakSideBand = step.weakSideBand === 'bottom' ? 'bottom'
        : step.weakSideBand === 'top' ? 'top'
          : undefined
      const correctRegions = asStringArray(step.correctRegions) as FoundationRinkRegionId[]
      const isWeak = weakSideBand != null || correctRegions.includes('weak_side')
      const drillId = asString(drill.id) || '?'

      scenes.push({
        id,
        drillId,
        label: `${drillId} · ${id}`,
        prompt: asString(step.prompt) || id,
        type: asString(step.type) || '',
        showMarkers,
        markerOverrides: parseMarkerOverrides(step.markerOverrides),
        attackDirection: asString(step.attackDirection) === 'left' ? 'left' : 'right',
        showAttackArrow: asBool(step.hideAttackArrow) !== true && showMarkers.length === 0,
        weakSideBand,
        correctRegions: correctRegions.length ? correctRegions : undefined,
        learning: isWeak
          ? {
              showWeakStrong: true,
              weakSideBand: weakSideBand || 'top',
              showHitboxes: true,
              showFeedback: false,
              feedbackSide: null,
            }
          : undefined,
      })
    }
  }
  return scenes
}
