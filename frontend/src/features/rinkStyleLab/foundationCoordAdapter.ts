/**
 * Maps FoundationRink coordinates (400×240 ice) onto Detailed product metrics.
 * Does not invent geometry — only affine remap of the ice rectangle.
 */

import type { FoundationMarkerOverride, FoundationRinkRegionId } from '../foundation/types'
import { DETAILED_ICE, FOUNDATION_ICE } from './labGeometry.ts'

export type Point = { x: number; y: number }

export type IceRect = { x: number; y: number; w: number; h: number }

/** Pure remap between two ice rectangles (testable without metrics module). */
export function mapPointBetweenIce(
  cx: number,
  cy: number,
  from: IceRect,
  to: IceRect,
): Point {
  const nx = (cx - from.x) / from.w
  const ny = (cy - from.y) / from.h
  return {
    x: to.x + nx * to.w,
    y: to.y + ny * to.h,
  }
}

const FOUNDATION_MARKER_DEFAULTS: Record<
  string,
  { cx: number; cy: number; label: string; team?: 'blue' | 'red' | 'neutral'; hasPuck?: boolean; kind?: 'player' | 'puck' }
> = {
  goalie_spot: { cx: 48, cy: 120, label: 'Torwart', team: 'blue' },
  defense_left: { cx: 110, cy: 85, label: 'Verteidiger', team: 'red' },
  defense_right: { cx: 110, cy: 155, label: 'Verteidiger', team: 'red' },
  center_spot: { cx: 200, cy: 120, label: 'Center', team: 'blue' },
  wing_left: { cx: 240, cy: 55, label: 'Flügel', team: 'blue' },
  wing_right: { cx: 240, cy: 185, label: 'Flügel', team: 'blue' },
  puck_carrier: { cx: 250, cy: 120, label: 'Spieler', team: 'blue', hasPuck: true },
  support_player: { cx: 220, cy: 75, label: 'Mitspieler', team: 'blue' },
}

/** Ice-relative normalize (0–1) inside Foundation ice bounds. */
export function foundationPointToNorm(cx: number, cy: number): Point {
  return {
    x: (cx - FOUNDATION_ICE.x) / FOUNDATION_ICE.w,
    y: (cy - FOUNDATION_ICE.y) / FOUNDATION_ICE.h,
  }
}

/** Foundation px → Detailed SVG px (uses DETAILED_ICE mirror of product metrics). */
export function foundationPointToDetailed(cx: number, cy: number): Point {
  return mapPointBetweenIce(cx, cy, FOUNDATION_ICE, DETAILED_ICE)
}

/** Uniform scale for marker radii / stroke (height-based). */
export function foundationScaleToDetailed(): number {
  return DETAILED_ICE.h / FOUNDATION_ICE.h
}

export type ResolvedSceneMarker = {
  id: FoundationRinkRegionId
  x: number
  y: number
  label: string
  team: 'blue' | 'red' | 'neutral'
  hasPuck: boolean
  kind: 'player' | 'puck'
  radius: number
}

export function resolveSceneMarkers(
  showMarkers: FoundationRinkRegionId[],
  markerOverrides: Partial<Record<FoundationRinkRegionId, FoundationMarkerOverride>> = {},
  space: 'foundation' | 'detailed' = 'detailed',
): ResolvedSceneMarker[] {
  const scale = space === 'detailed' ? foundationScaleToDetailed() : 1
  const baseR = space === 'detailed' ? 12 * scale * 0.85 : 12

  return showMarkers.map((id) => {
    const def = FOUNDATION_MARKER_DEFAULTS[id] || {
      cx: FOUNDATION_ICE.x + FOUNDATION_ICE.w / 2,
      cy: FOUNDATION_ICE.y + FOUNDATION_ICE.h / 2,
      label: id,
      team: 'blue' as const,
    }
    const ov = markerOverrides[id] || {}
    const cx = ov.cx ?? def.cx
    const cy = ov.cy ?? def.cy
    const kind = ov.kind ?? (def.kind || 'player')
    const pos = space === 'detailed'
      ? foundationPointToDetailed(cx, cy)
      : { x: cx, y: cy }
    return {
      id,
      x: pos.x,
      y: pos.y,
      label: ov.label ?? def.label,
      team: (ov.team ?? def.team ?? 'blue') as 'blue' | 'red' | 'neutral',
      hasPuck: ov.hasPuck ?? def.hasPuck ?? kind === 'puck',
      kind,
      radius: kind === 'puck' ? baseR * 0.75 : baseR,
    }
  })
}

/** d4_weak_side puck sits low on Foundation ice — after map, must stay in bottom half of Detailed ice. */
export function isInBottomHalfDetailed(y: number): boolean {
  return y >= DETAILED_ICE.y + DETAILED_ICE.h / 2
}
