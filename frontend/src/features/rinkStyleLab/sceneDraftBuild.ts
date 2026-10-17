import type {
  FoundationMarkerOverride,
  FoundationRinkRegionId,
} from '../foundation/types'
import { foundationMarkerDefault } from './foundationCoordAdapter.ts'
import type { SceneMarkerEdit } from './sceneDraftTypes.ts'

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
      handedness: 'right',
      hasPuck: ov.hasPuck ?? def.hasPuck,
      puckOffsetX: 0,
      puckOffsetY: 0,
    }
  }
  return next
}

/**
 * Merge saved draft onto baseline.
 * Intentionally ignores draft `scale` / `puckPlacement` so old per-player values
 * cannot silently override global display settings.
 */
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
      id,
      cx: Number.isFinite(d.cx) ? d.cx : base.cx,
      cy: Number.isFinite(d.cy) ? d.cy : base.cy,
      label: typeof d.label === 'string' ? d.label : base.label,
      team: d.team === 'red' || d.team === 'neutral' || d.team === 'blue' ? d.team : base.team,
      rotation: Number.isFinite(d.rotation) ? d.rotation : base.rotation,
      handedness: d.handedness === 'left' ? 'left' : 'right',
      hasPuck: typeof d.hasPuck === 'boolean' ? d.hasPuck : base.hasPuck,
      // Scene puck offsets never load into authority — global puckLocal owns tip.
      puckOffsetX: 0,
      puckOffsetY: 0,
    }
  }
  return next
}

/** Persist only scene-local fields (no global scale / puck tip). */
export function sanitizeMarkerEditsForSave(
  edits: Partial<Record<FoundationRinkRegionId, SceneMarkerEdit>>,
): Partial<Record<FoundationRinkRegionId, SceneMarkerEdit>> {
  const next: Partial<Record<FoundationRinkRegionId, SceneMarkerEdit>> = {}
  for (const [id, edit] of Object.entries(edits)) {
    if (!edit) continue
    next[id as FoundationRinkRegionId] = {
      id: edit.id,
      cx: edit.cx,
      cy: edit.cy,
      label: edit.label,
      team: edit.team,
      rotation: edit.rotation,
      handedness: edit.handedness,
      hasPuck: edit.hasPuck,
      puckOffsetX: 0,
      puckOffsetY: 0,
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
