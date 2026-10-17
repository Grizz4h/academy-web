/**
 * Product detailed-rink metrics (900×620).
 * Extracted for reuse by DrillRenderer and Dev Style Lab.
 * Not yet declared canonical — Style Lab compares before we lock geometry.
 */

export const DETAILED_RINK_VIEWBOX = { width: 900, height: 620 }
export const DETAILED_RINK_SURFACE = { x: 30, y: 40, width: 840, height: 540 }

/**
 * Crease radius as a fraction of ice height.
 * Maps rule 6 ft crease onto the board short axis (ice height ↔ 85 ft width).
 * → creaseRadius = 540 * (6/85) ≈ 38.1176 SVG units (was 54 @ 0.100).
 */
export const DETAILED_CREASE_RULE_FEET = 6
export const DETAILED_ICE_WIDTH_FEET = 85
export const DETAILED_CREASE_RADIUS_OF_HEIGHT =
  DETAILED_CREASE_RULE_FEET / DETAILED_ICE_WIDTH_FEET

/**
 * NHL faceoff lateral offset from the long centre line (22 ft).
 * Scaled on the short ice axis (height ↔ 85 ft), same as crease.
 * Shared by end-zone circle centres and NZ faceoff dots.
 */
export const DETAILED_FACEOFF_LATERAL_FEET = 22
export const DETAILED_FACEOFF_LATERAL_OF_HEIGHT =
  DETAILED_FACEOFF_LATERAL_FEET / DETAILED_ICE_WIDTH_FEET

/**
 * NHL end-zone faceoff: 20 ft from the goal line toward the blue line.
 * Placed as a fraction of the painted end-zone depth (goal line → blue),
 * which on a full NHL rink is 64 ft (75 − 11). Avoids arbitrary pixel offsets
 * on this length-compressed tactical board.
 */
export const DETAILED_END_ZONE_FACEOFF_FROM_GOAL_FEET = 20
export const DETAILED_END_ZONE_GOAL_TO_BLUE_FEET = 64
export const DETAILED_END_ZONE_FACEOFF_OF_DEPTH =
  DETAILED_END_ZONE_FACEOFF_FROM_GOAL_FEET / DETAILED_END_ZONE_GOAL_TO_BLUE_FEET

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
  /**
   * Goal crease: NHL/IIHF semicircle radius 6 ft from goal-line center.
   * Scaled on the short ice axis (height ↔ 85 ft rink width).
   * Previously `rinkHeight * 0.100` (= 54) ≈ 1.42× rule size — see crease-audit.md.
   * Faceoff circles keep the prior radius (unchanged marking).
   */
  const creaseRadius = rinkHeight * DETAILED_CREASE_RADIUS_OF_HEIGHT
  const faceoffRadius = rinkHeight * 0.100
  // Lateral: shared 22 ft axis for end-zone centres and NZ dots
  const faceoffLateral = rinkHeight * DETAILED_FACEOFF_LATERAL_OF_HEIGHT
  const topFaceoffY = rinkCenterY - faceoffLateral
  const bottomFaceoffY = rinkCenterY + faceoffLateral
  // End-zone X: 20/64 of goal→blue depth (toward goal line vs prior 0.26 fraction)
  const leftEndZoneDepth = leftBlueLineX - leftGoalLineX
  const rightEndZoneDepth = rightGoalLineX - rightBlueLineX
  const leftZoneFaceoffX =
    leftGoalLineX + leftEndZoneDepth * DETAILED_END_ZONE_FACEOFF_OF_DEPTH
  const rightZoneFaceoffX =
    rightGoalLineX - rightEndZoneDepth * DETAILED_END_ZONE_FACEOFF_OF_DEPTH
  // NZ length positions unchanged (still offset from centre); Y aligns with end zones
  const neutralOffsetX = rinkWidth * 0.08
  const neutralDots = [
    { x: rinkCenterX - neutralOffsetX, y: topFaceoffY },
    { x: rinkCenterX - neutralOffsetX, y: bottomFaceoffY },
    { x: rinkCenterX + neutralOffsetX, y: topFaceoffY },
    { x: rinkCenterX + neutralOffsetX, y: bottomFaceoffY },
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
