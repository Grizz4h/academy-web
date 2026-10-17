/**
 * Stick swing SVG helper only (Board Studio `stickPossessionSwing.ts`).
 * Possession resolution is intentionally omitted for Style Lab.
 */

export function stickSwingTransformAttribute(
  pivotX: number,
  pivotY: number,
  swingDegrees: number,
): string | undefined {
  if (
    !Number.isFinite(swingDegrees) ||
    Math.abs(swingDegrees) < 1e-9 ||
    !Number.isFinite(pivotX) ||
    !Number.isFinite(pivotY)
  ) {
    return undefined
  }
  return `rotate(${swingDegrees} ${pivotX} ${pivotY})`
}
