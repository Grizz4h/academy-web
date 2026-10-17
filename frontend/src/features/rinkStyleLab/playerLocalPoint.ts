/**
 * Transform a Board Studio design-space point into parent SVG (rink) coords.
 * Mirrors HockeyPlayer: bodyTransform translate→rotate→bodyScale, then outer scale about anchor.
 * No fixed world-space offsets.
 */

import { SKATER_MARKER_VISUAL_SCALE } from './boardStudio/localCore.ts'
import {
  resolvePlayerVisualGeometry,
  type PlayerVisualGeometry,
} from './boardStudio/playerVisualGeometry.ts'
import type { PlayerHandedness, PlayerMarkerKind } from './boardStudio/playerVisual.ts'

export type PlayerPuckPlacement = 'body' | 'blade' | 'compare'

/** Legacy Style-Lab body puck in design units (matches prior radius*0.72 / (radius/12)). */
export const BODY_PUCK_LOCAL = { x: 8.64, y: 6.6 } as const

export function skaterBodyScale(marker: PlayerMarkerKind = 'skater'): number {
  return marker === 'goalie' ? 1 : SKATER_MARKER_VISUAL_SCALE
}

/** SVG clockwise degrees → parent coords (y-down). */
export function transformPlayerLocalPoint(options: {
  anchorX: number
  anchorY: number
  localX: number
  localY: number
  rotationDegrees: number
  /** HockeyPlayer `scale` prop (outer uniform). */
  outerScale: number
  bodyScale?: number
}): { x: number; y: number } {
  const {
    anchorX,
    anchorY,
    localX,
    localY,
    rotationDegrees,
    outerScale,
  } = options
  const bodyScale =
    options.bodyScale !== undefined && Number.isFinite(options.bodyScale) && options.bodyScale > 0
      ? options.bodyScale
      : 1
  const safeOuter =
    Number.isFinite(outerScale) && outerScale > 0 ? outerScale : 1
  const deg = Number.isFinite(rotationDegrees) ? rotationDegrees : 0
  const rad = (deg * Math.PI) / 180
  const cos = Math.cos(rad)
  const sin = Math.sin(rad)
  const lx = localX * bodyScale
  const ly = localY * bodyScale
  // SVG rotate(θ): x' = x cos − y sin; y' = x sin + y cos (clockwise, y-down)
  const rx = lx * cos - ly * sin
  const ry = lx * sin + ly * cos
  return {
    x: anchorX + rx * safeOuter,
    y: anchorY + ry * safeOuter,
  }
}

export function stickBladeLocal(
  handedness: PlayerHandedness = 'right',
  marker: PlayerMarkerKind = 'skater',
): { x: number; y: number } {
  const geom: PlayerVisualGeometry = resolvePlayerVisualGeometry(marker, handedness)
  return { x: geom.stick.blade.x, y: geom.stick.blade.y }
}

export function resolveScenePuckPoint(options: {
  anchorX: number
  anchorY: number
  rotationDegrees: number
  outerScale: number
  handedness?: PlayerHandedness
  marker?: PlayerMarkerKind
  placement: 'body' | 'blade'
}): { x: number; y: number } {
  const marker = options.marker || 'skater'
  const handedness = options.handedness || 'right'
  const local =
    options.placement === 'blade'
      ? stickBladeLocal(handedness, marker)
      : BODY_PUCK_LOCAL
  return transformPlayerLocalPoint({
    anchorX: options.anchorX,
    anchorY: options.anchorY,
    localX: local.x,
    localY: local.y,
    rotationDegrees: options.rotationDegrees,
    outerScale: options.outerScale,
    bodyScale: skaterBodyScale(marker),
  })
}
