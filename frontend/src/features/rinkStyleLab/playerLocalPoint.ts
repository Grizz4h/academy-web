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

/** Inverse of transformPlayerLocalPoint — world Detailed → design-space local. */
export function inverseTransformPlayerLocalPoint(options: {
  anchorX: number
  anchorY: number
  worldX: number
  worldY: number
  rotationDegrees: number
  outerScale: number
  bodyScale?: number
}): { x: number; y: number } {
  const bodyScale =
    options.bodyScale !== undefined && Number.isFinite(options.bodyScale) && options.bodyScale > 0
      ? options.bodyScale
      : 1
  const safeOuter =
    Number.isFinite(options.outerScale) && options.outerScale > 0 ? options.outerScale : 1
  const deg = Number.isFinite(options.rotationDegrees) ? options.rotationDegrees : 0
  const rad = (deg * Math.PI) / 180
  const cos = Math.cos(rad)
  const sin = Math.sin(rad)
  const dx = (options.worldX - options.anchorX) / safeOuter
  const dy = (options.worldY - options.anchorY) / safeOuter
  // Inverse clockwise rotate(θ): rotate(−θ)
  const lx = dx * cos + dy * sin
  const ly = -dx * sin + dy * cos
  return {
    x: lx / bodyScale,
    y: ly / bodyScale,
  }
}

/** Canonical (right-handed) local ↔ handedness-specific local (mirror X). */
export function mirrorLocalForHandedness(
  local: { x: number; y: number },
  handedness: PlayerHandedness,
): { x: number; y: number } {
  if (handedness !== 'left') return { x: local.x, y: local.y }
  return { x: -local.x, y: local.y }
}

export function stickBladeLocal(
  handedness: PlayerHandedness = 'right',
  marker: PlayerMarkerKind = 'skater',
): { x: number; y: number } {
  const geom: PlayerVisualGeometry = resolvePlayerVisualGeometry(marker, handedness)
  return { x: geom.stick.blade.x, y: geom.stick.blade.y }
}

/** Local puck tip: lerp body→blade by bias (0=body, 1=blade). */
export function puckLocalByBias(
  bias: number,
  handedness: PlayerHandedness = 'right',
  marker: PlayerMarkerKind = 'skater',
): { x: number; y: number } {
  const t = Number.isFinite(bias) ? Math.min(1, Math.max(0, bias)) : 1
  const blade = stickBladeLocal(handedness, marker)
  return {
    x: BODY_PUCK_LOCAL.x + (blade.x - BODY_PUCK_LOCAL.x) * t,
    y: BODY_PUCK_LOCAL.y + (blade.y - BODY_PUCK_LOCAL.y) * t,
  }
}

export function resolveScenePuckPoint(options: {
  anchorX: number
  anchorY: number
  rotationDegrees: number
  outerScale: number
  handedness?: PlayerHandedness
  marker?: PlayerMarkerKind
  /** @deprecated Prefer puckBias / puckLocal — body|blade maps to 0|1. */
  placement?: 'body' | 'blade'
  /** 0 = body-adjacent, 1 = stick-blade tip (fallback when puckLocal omitted). */
  puckBias?: number
  /**
   * Canonical right-handed design-space tip. Mirrored for left-handed markers.
   * Preferred over puckBias when set.
   */
  puckLocal?: { x: number; y: number }
}): { x: number; y: number } {
  const marker = options.marker || 'skater'
  const handedness = options.handedness || 'right'
  const bias =
    options.puckBias !== undefined
      ? options.puckBias
      : options.placement === 'body'
        ? 0
        : 1
  const canonical = options.puckLocal
    || puckLocalByBias(bias, 'right', marker)
  const local = mirrorLocalForHandedness(canonical, handedness)
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

/**
 * World puck (Detailed) → canonical right-handed design-space tip.
 * Accounts for rotation, outer scale, body scale, and handedness mirror.
 */
export function worldPuckToCanonicalLocal(options: {
  anchorX: number
  anchorY: number
  worldX: number
  worldY: number
  rotationDegrees: number
  outerScale: number
  handedness?: PlayerHandedness
  marker?: PlayerMarkerKind
}): { x: number; y: number } {
  const marker = options.marker || 'skater'
  const handedness = options.handedness || 'right'
  const handedLocal = inverseTransformPlayerLocalPoint({
    anchorX: options.anchorX,
    anchorY: options.anchorY,
    worldX: options.worldX,
    worldY: options.worldY,
    rotationDegrees: options.rotationDegrees,
    outerScale: options.outerScale,
    bodyScale: skaterBodyScale(marker),
  })
  return mirrorLocalForHandedness(handedLocal, handedness)
}
