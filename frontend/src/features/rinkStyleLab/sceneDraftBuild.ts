import type {
  FoundationMarkerOverride,
  FoundationRinkRegionId,
} from '../foundation/types'
import { foundationMarkerDefault } from './foundationCoordAdapter.ts'
import type { SceneMarkerEdit } from './sceneDraftTypes.ts'
import { clampPlayerScale } from './sceneDraftStore.ts'

/** Baseline edits from Track-0 curriculum markers (Foundation space). */
export function buildBaselineMarkerEdits(
  showMarkers: FoundationRinkRegionId[],
  overrides: Partial<Record<FoundationRinkRegionId, FoundationMarkerOverride>>,
): Partial<Record<FoundationRinkRegionId, SceneMarkerEdit>> {
  const next: Partial<Record<FoundationRinkRegionId, SceneMarkerEdit>> = {}
  for (const id of showMarkers) {
    const def = foundationMarkerDefault(id)
    const ov = overrides[id] || {}
    next[id] = {
      id,
      cx: ov.cx ?? def.cx,
      cy: ov.cy ?? def.cy,
      label: ov.label ?? def.label,
      team: ov.team ?? def.team,
      rotation: 0,
      scale: 1,
      handedness: 'right',
      hasPuck: ov.hasPuck ?? def.hasPuck,
      puckPlacement: 'blade',
      puckOffsetX: 0,
      puckOffsetY: 0,
    }
  }
  return next
}

/** Merge saved draft onto baseline (draft wins per field present). */
export function mergeMarkerEdits(
  baseline: Partial<Record<FoundationRinkRegionId, SceneMarkerEdit>>,
  draft: Partial<Record<FoundationRinkRegionId, SceneMarkerEdit>> | undefined,
): Partial<Record<FoundationRinkRegionId, SceneMarkerEdit>> {
  if (!draft) return { ...baseline }
  const next: Partial<Record<FoundationRinkRegionId, SceneMarkerEdit>> = { ...baseline }
  for (const id of Object.keys(baseline) as FoundationRinkRegionId[]) {
    const base = baseline[id]
    const d = draft[id]
    if (!base) continue
    if (!d) {
      next[id] = { ...base }
      continue
    }
    next[id] = {
      ...base,
      ...d,
      id,
      scale: clampPlayerScale(d.scale ?? base.scale),
      rotation: Number.isFinite(d.rotation) ? d.rotation : base.rotation,
      puckOffsetX: Number.isFinite(d.puckOffsetX) ? d.puckOffsetX : 0,
      puckOffsetY: Number.isFinite(d.puckOffsetY) ? d.puckOffsetY : 0,
      puckPlacement: d.puckPlacement === 'body' ? 'body' : 'blade',
    }
  }
  return next
}

export function editsToFoundationOverrides(
  edits: Partial<Record<FoundationRinkRegionId, SceneMarkerEdit>>,
): Partial<Record<FoundationRinkRegionId, FoundationMarkerOverride>> {
  const next: Partial<Record<FoundationRinkRegionId, FoundationMarkerOverride>> = {}
  for (const [id, edit] of Object.entries(edits)) {
    if (!edit) continue
    next[id as FoundationRinkRegionId] = {
      cx: edit.cx,
      cy: edit.cy,
      label: edit.label,
      team: edit.team,
      hasPuck: edit.hasPuck,
    }
  }
  return next
}
