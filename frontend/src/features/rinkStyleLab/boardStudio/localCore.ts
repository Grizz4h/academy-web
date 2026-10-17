/**
 * Minimal stand-ins for `@rinq/core` constants used by the player marker.
 * Vendored for Tank Style Lab — not a Board Studio package dependency.
 */

export type Point = { x: number; y: number }

/** Domain / SVG clockwise degrees — Board Studio default facing. */
export const DEFAULT_PLAYER_ROTATION_DEGREES = 0

/**
 * Skater markers are drawn slightly larger than design space
 * (`SKATER_MARKER_VISUAL_SCALE` in Board Studio `puckPossession.ts`).
 */
export const SKATER_MARKER_VISUAL_SCALE = 1.08
