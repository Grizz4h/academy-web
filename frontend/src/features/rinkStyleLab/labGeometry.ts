/**
 * Read-only projections of existing rink ice bounds for lab overlays.
 * Not a third geometry — mirrors Foundation / Detailed constants.
 * DETAILED_* values must stay equal to `rinkGeometry/detailedMetrics`.
 */

export type IceHalf = 'top' | 'bottom'

/** FoundationRink ice rectangle (matches FoundationRink.tsx). */
export const FOUNDATION_VIEWBOX = { width: 400, height: 240 }
export const FOUNDATION_ICE = {
  x: 20,
  y: 20,
  w: 360,
  h: 200,
}

/** Mirrors DETAILED_RINK_VIEWBOX / DETAILED_RINK_SURFACE */
export const DETAILED_VIEWBOX = { width: 900, height: 620 }
export const DETAILED_ICE = {
  x: 30,
  y: 40,
  w: 840,
  h: 540,
}

export function halfForBand(
  half: IceHalf,
  weakSideBand: 'top' | 'bottom',
): 'weak' | 'strong' {
  return half === weakSideBand ? 'weak' : 'strong'
}
