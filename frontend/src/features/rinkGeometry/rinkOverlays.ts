/** Shared visual markings for the detailed hockey rink (interaction-agnostic). */

export type RinkOverlays = {
  zones: boolean
  goals: boolean
  crease: boolean
  faceoffDots: boolean
  labels: boolean
  defendingSide: 'left' | 'right'
  showDefendingHint: boolean
  attackDirection?: 'left' | 'right'
  /** Style Lab / optional: ice-ad chevrons */
  iceAds?: boolean
}

export const DETAILED_HOCKEY_RINK_PRESET: Partial<RinkOverlays> = {
  zones: true,
  goals: true,
  crease: true,
  faceoffDots: true,
  labels: false,
  defendingSide: 'left',
  showDefendingHint: false,
}

export function defaultDetailedOverlays(
  patch: Partial<RinkOverlays> = {},
): RinkOverlays {
  return {
    zones: true,
    goals: true,
    crease: true,
    faceoffDots: true,
    labels: false,
    defendingSide: 'left',
    showDefendingHint: false,
    attackDirection: 'right',
    iceAds: true,
    ...DETAILED_HOCKEY_RINK_PRESET,
    ...patch,
  }
}
