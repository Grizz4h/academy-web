/**
 * VISUAL PROTOTYPE ONLY.
 * These are deliberately non-authoritative placeholder values.
 * Do not use as hockey reference data.
 *
 * Later this file is the swap point: DEMO_RINK_SPEC → a sourced IIHF/DEL spec.
 */

export type RinkSpec = {
  lengthM: number
  widthM: number
  cornerRadiusM: number
  goalLineOffsetM: number
  blueLineOffsetFromCenterM: number
  faceoffCircleDiameterM: number
  /** Placeholder net opening (not a rulebook value). */
  goalWidthM: number
  /** Placeholder net depth toward the end boards. */
  goalDepthM: number
  /** Placeholder: faceoff spot distance from the goal line toward center. */
  endZoneFaceoffOffsetFromGoalLineM: number
  /** Placeholder: faceoff spot distance from the long axis. */
  faceoffSpotOffsetFromLongAxisM: number
}

export const DEMO_RINK_SPEC: RinkSpec = {
  lengthM: 58,
  widthM: 28,
  cornerRadiusM: 7,
  goalLineOffsetM: 4,
  blueLineOffsetFromCenterM: 9,
  faceoffCircleDiameterM: 8,
  goalWidthM: 2,
  goalDepthM: 1,
  endZoneFaceoffOffsetFromGoalLineM: 6,
  faceoffSpotOffsetFromLongAxisM: 6.5,
}

export type BlueprintViewMode = 'basic' | 'technical'
