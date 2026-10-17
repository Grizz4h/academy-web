/**
 * Neutral skate pose + transform helpers (slice of Board Studio `skateStride.ts`).
 * Movement-driven stride resolution is omitted for Style Lab.
 */

export const SKATE_STRIDE_GEOMETRY = {
  width: 2.15,
  length: 3.35,
  rearAnchorY: 9.55,
  lateralX: 4.05,
  pushExtensionY: 3.15,
  plantExtensionY: 0.35,
  pushLateralExtra: 0.55,
  pushAngleDegrees: 8,
} as const

export type SkateSidePose = {
  x: number
  y: number
  rotationDegrees: number
}

export type SkateStridePose = {
  active: boolean
  phase: number
  left: SkateSidePose
  right: SkateSidePose
}

function sidePose(side: 'left' | 'right', extension: number): SkateSidePose {
  const g = SKATE_STRIDE_GEOMETRY
  const sign = side === 'left' ? -1 : 1
  const y =
    g.rearAnchorY +
    g.plantExtensionY +
    extension * (g.pushExtensionY - g.plantExtensionY)
  const x = sign * (g.lateralX + extension * g.pushLateralExtra)
  const rotationDegrees = sign * extension * g.pushAngleDegrees
  return { x, y, rotationDegrees }
}

export function createNeutralSkateStridePose(): SkateStridePose {
  const rest = 0.22
  return {
    active: false,
    phase: 0,
    left: sidePose('left', rest),
    right: sidePose('right', rest),
  }
}

export function skateTransformAttribute(
  cx: number,
  cy: number,
  rotationDegrees: number,
): string | undefined {
  if (
    !Number.isFinite(rotationDegrees) ||
    Math.abs(rotationDegrees) < 1e-9 ||
    !Number.isFinite(cx) ||
    !Number.isFinite(cy)
  ) {
    return undefined
  }
  return `rotate(${rotationDegrees} ${cx} ${cy})`
}
