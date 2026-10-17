/**
 * Product detailed-rink metrics (900×620).
 * Extracted for reuse by DrillRenderer and Dev Style Lab.
 * Not yet declared canonical — Style Lab compares before we lock geometry.
 */

export const DETAILED_RINK_VIEWBOX = { width: 900, height: 620 }
export const DETAILED_RINK_SURFACE = { x: 30, y: 40, width: 840, height: 540 }

/**
 * Fraction of the ice surface from each end boards to the blue line.
 * Slightly tactical-board compressed vs literal NHL (~0.375 / NZ 25%):
 * end zones read larger, NZ a bit narrower.
 */
export const DETAILED_RINK_BLUE_LINE_FROM_END = 0.38

/** Blue-line x as fraction of the detailed viewBox (for zone_boundaries). Matches painted blue lines. */
export const DETAILED_RINK_ZONE_BOUNDARIES = {
  left_blue_line_x:
    (DETAILED_RINK_SURFACE.x + DETAILED_RINK_SURFACE.width * DETAILED_RINK_BLUE_LINE_FROM_END)
    / DETAILED_RINK_VIEWBOX.width,
  right_blue_line_x:
    (DETAILED_RINK_SURFACE.x
      + DETAILED_RINK_SURFACE.width * (1 - DETAILED_RINK_BLUE_LINE_FROM_END))
    / DETAILED_RINK_VIEWBOX.width,
}

export type DetailedRinkMetrics = ReturnType<typeof getDetailedRinkMetrics>

/** Geometry aligned with C1_D1 / paintable detailed rink visuals. */
export function getDetailedRinkMetrics() {
  const rinkX = DETAILED_RINK_SURFACE.x
  const rinkY = DETAILED_RINK_SURFACE.y
  const rinkWidth = DETAILED_RINK_SURFACE.width
  const rinkHeight = DETAILED_RINK_SURFACE.height
  const rinkRight = rinkX + rinkWidth
  const rinkCenterX = rinkX + rinkWidth / 2
  const rinkCenterY = rinkY + rinkHeight / 2
  const leftBlueLineX = rinkX + rinkWidth * DETAILED_RINK_BLUE_LINE_FROM_END
  const rightBlueLineX = rinkX + rinkWidth * (1 - DETAILED_RINK_BLUE_LINE_FROM_END)
  const leftGoalLineX = rinkX + rinkWidth * 0.11
  const rightGoalLineX = rinkRight - rinkWidth * 0.11
  const goalMouth = rinkHeight * 0.078
  const goalHalf = goalMouth / 2
  const goalDepth = rinkWidth * 0.018
  const creaseRadius = rinkHeight * 0.100
  const faceoffRadius = rinkHeight * 0.100
  const leftZoneFaceoffX = rinkX + rinkWidth * 0.26
  const rightZoneFaceoffX = rinkRight - rinkWidth * 0.26
  const topFaceoffY = rinkCenterY - rinkHeight * 0.26
  const bottomFaceoffY = rinkCenterY + rinkHeight * 0.26
  const neutralOffsetX = rinkWidth * 0.08
  const neutralOffsetY = rinkHeight * 0.22
  const neutralDots = [
    { x: rinkCenterX - neutralOffsetX, y: rinkCenterY - neutralOffsetY },
    { x: rinkCenterX - neutralOffsetX, y: rinkCenterY + neutralOffsetY },
    { x: rinkCenterX + neutralOffsetX, y: rinkCenterY - neutralOffsetY },
    { x: rinkCenterX + neutralOffsetX, y: rinkCenterY + neutralOffsetY },
  ]
  return {
    rinkX,
    rinkY,
    rinkWidth,
    rinkHeight,
    rinkRight,
    rinkCenterX,
    rinkCenterY,
    leftBlueLineX,
    rightBlueLineX,
    leftGoalLineX,
    rightGoalLineX,
    goalHalf,
    goalDepth,
    creaseRadius,
    faceoffRadius,
    leftZoneFaceoffX,
    rightZoneFaceoffX,
    topFaceoffY,
    bottomFaceoffY,
    neutralDots,
  }
}
