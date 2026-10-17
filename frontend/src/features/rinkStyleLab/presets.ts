import type { FoundationMarkerOverride, FoundationRinkRegionId } from '../foundation/types'

export type StyleLabMode = 'compare' | 'design'
export type StyleLabBase = 'foundation' | 'detailed'
export type MarkerStyleVariant = 'role' | 'team' | 'neutral'

export type ScenePresetId = 'empty' | 'one_player' | 'three_blue' | 'weak_strong'

export type StyleLabMarkings = {
  faceoffDots: boolean
  goalLines: boolean
  goals: boolean
  crease: boolean
  labels: boolean
  iceAds: boolean
  centerLine: boolean
  blueLines: boolean
}

export type StyleLabLearning = {
  showWeakStrong: boolean
  weakSideBand: 'top' | 'bottom'
  showHitboxes: boolean
  showFeedback: boolean
  /** which half is treated as selected feedback target */
  feedbackSide: 'weak' | 'strong' | null
}

export const DEFAULT_MARKINGS: StyleLabMarkings = {
  faceoffDots: true,
  goalLines: true,
  goals: true,
  crease: true,
  labels: false,
  iceAds: true,
  centerLine: true,
  blueLines: true,
}

export const DEFAULT_LEARNING: StyleLabLearning = {
  showWeakStrong: false,
  weakSideBand: 'top',
  showHitboxes: false,
  showFeedback: false,
  feedbackSide: null,
}

export type ScenePreset = {
  id: ScenePresetId
  label: string
  showMarkers: FoundationRinkRegionId[]
  markerOverrides: Partial<Record<FoundationRinkRegionId, FoundationMarkerOverride>>
  learning?: Partial<StyleLabLearning>
}

export const SCENE_PRESETS: ScenePreset[] = [
  {
    id: 'empty',
    label: 'Leer',
    showMarkers: [],
    markerOverrides: {},
  },
  {
    id: 'one_player',
    label: '1 Spieler + Puck',
    showMarkers: ['puck_carrier'],
    markerOverrides: {
      puck_carrier: {
        cx: 250,
        cy: 130,
        label: 'Blau',
        team: 'blue',
        hasPuck: true,
      },
    },
  },
  {
    id: 'three_blue',
    label: '3× Team Blau',
    showMarkers: ['puck_carrier', 'support_player', 'wing_left'],
    markerOverrides: {
      puck_carrier: { cx: 250, cy: 130, label: 'Blau', team: 'blue', hasPuck: true },
      support_player: { cx: 225, cy: 85, label: 'Blau', team: 'blue' },
      wing_left: { cx: 270, cy: 45, label: 'Blau', team: 'blue' },
    },
  },
  {
    id: 'weak_strong',
    label: 'Weak / Strong Side',
    showMarkers: ['puck_carrier'],
    markerOverrides: {
      puck_carrier: {
        cx: 255,
        cy: 185,
        label: 'Blau · Puck',
        team: 'blue',
        hasPuck: true,
      },
    },
    learning: {
      showWeakStrong: true,
      weakSideBand: 'top',
      showHitboxes: true,
      showFeedback: false,
      feedbackSide: null,
    },
  },
]

/** Apply marker style variant without changing positions. */
export function applyMarkerStyleVariant(
  overrides: Partial<Record<FoundationRinkRegionId, FoundationMarkerOverride>>,
  markers: FoundationRinkRegionId[],
  variant: MarkerStyleVariant,
): Partial<Record<FoundationRinkRegionId, FoundationMarkerOverride>> {
  const next: Partial<Record<FoundationRinkRegionId, FoundationMarkerOverride>> = { ...overrides }
  for (const id of markers) {
    const base = next[id] || {}
    if (variant === 'team') {
      next[id] = {
        ...base,
        label: base.team === 'red' ? 'Rot' : 'Blau',
        team: base.team || 'blue',
      }
    } else if (variant === 'neutral') {
      next[id] = {
        ...base,
        label: id === 'puck_carrier' && base.hasPuck ? 'Spieler' : 'Spieler',
        team: 'neutral',
      }
    } else {
      // role-ish defaults
      const roleLabel =
        id === 'puck_carrier' ? 'Spieler'
          : id === 'support_player' ? 'Mitspieler'
            : id === 'wing_left' || id === 'wing_right' ? 'Flügel'
              : id === 'goalie_spot' ? 'Torwart'
                : 'Spieler'
      next[id] = { ...base, label: roleLabel }
    }
  }
  return next
}
