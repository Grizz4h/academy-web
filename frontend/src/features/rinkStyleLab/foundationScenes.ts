/**
 * Read-only projection of Track 0 rink scenes for the Style Lab.
 * Curriculum JSON is not modified — we only select steps that use the rink.
 */

import type { FoundationAttackDirection, FoundationMarkerOverride, FoundationRinkRegionId } from '../foundation/types'
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
  /** Matches Foundation hideAttackArrow — false means show arrow */
  showAttackArrow: boolean
  weakSideBand?: 'top' | 'bottom'
  correctRegions?: FoundationRinkRegionId[]
  learning?: Partial<StyleLabLearning>
}

type RawStep = {
  id?: string
  type?: string
  prompt?: string
  showMarkers?: string[]
  markerOverrides?: Record<string, FoundationMarkerOverride>
  attackDirection?: string
  hideAttackArrow?: boolean
  weakSideBand?: 'top' | 'bottom'
  correctRegions?: string[]
}

type RawDrill = {
  id?: string
  title?: string
  config?: { steps?: RawStep[] }
}

type RawTrackFile = {
  track?: { modules?: Array<{ drills?: RawDrill[] }> }
}

function isRinkScene(step: RawStep): boolean {
  if (Array.isArray(step.showMarkers) && step.showMarkers.length > 0) return true
  if (step.weakSideBand) return true
  if (step.type === 'identify_region') return true
  return false
}

/** Extract lab scenes from a t0-track.json-shaped object. */
export function extractFoundationScenes(raw: RawTrackFile): FoundationScene[] {
  const drills = raw.track?.modules?.[0]?.drills || []
  const scenes: FoundationScene[] = []
  for (const drill of drills) {
    const steps = drill.config?.steps || []
    for (const step of steps) {
      if (!step.id || !isRinkScene(step)) continue
      const showMarkers = (step.showMarkers || []) as FoundationRinkRegionId[]
      const weakSideBand = step.weakSideBand
      const isWeak = weakSideBand === 'top' || weakSideBand === 'bottom'
        || (step.correctRegions || []).includes('weak_side')
      scenes.push({
        id: step.id,
        drillId: String(drill.id || ''),
        label: `${drill.id || '?'} · ${step.id}`,
        prompt: String(step.prompt || step.id),
        type: String(step.type || ''),
        showMarkers,
        markerOverrides: (step.markerOverrides || {}) as FoundationScene['markerOverrides'],
        attackDirection: step.attackDirection === 'left' ? 'left' : 'right',
        showAttackArrow: step.hideAttackArrow !== true && showMarkers.length === 0,
        weakSideBand,
        correctRegions: step.correctRegions as FoundationRinkRegionId[] | undefined,
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
