/**
 * Player visual types + palette (slice of Board Studio `packages/core/src/playerVisual.ts`).
 * See ../SOURCE.md.
 */

import { normalizeHexRrggbb } from './hexColor.ts'

export type PlayerColorToken =
  | 'black'
  | 'white'
  | 'red'
  | 'blue'
  | 'yellow'
  | 'green'

export type PlayerColor = PlayerColorToken | string

export const PLAYER_COLORS: readonly PlayerColorToken[] = [
  'black',
  'white',
  'red',
  'blue',
  'yellow',
  'green',
] as const

export type PlayerMarkerKind = 'skater' | 'goalie'
export type PlayerHandedness = 'left' | 'right'

export interface PlayerVisual {
  fill: PlayerColor
  label?: string
  marker?: PlayerMarkerKind
  handedness?: PlayerHandedness
}

export const DEFAULT_PLAYER_VISUAL: PlayerVisual = {
  fill: 'black',
}

export const PLAYER_LABEL_MAX_LENGTH = 8

export function isPlayerColorToken(value: unknown): value is PlayerColorToken {
  return (
    typeof value === 'string' &&
    (PLAYER_COLORS as readonly string[]).includes(value)
  )
}

export function normalizePlayerColor(value: unknown): PlayerColor | undefined {
  if (isPlayerColorToken(value)) {
    return value
  }
  return normalizeHexRrggbb(value)
}

export function normalizePlayerLabel(label: string): string {
  const trimmed = label.trim()
  if (trimmed.length === 0) {
    return ''
  }
  return trimmed.length > PLAYER_LABEL_MAX_LENGTH
    ? trimmed.slice(0, PLAYER_LABEL_MAX_LENGTH)
    : trimmed
}

export function resolvePlayerVisual(input: {
  id?: string
  visual?: PlayerVisual | null
}): PlayerVisual & { label: string; handedness: PlayerHandedness } {
  const rawFill = input.visual?.fill ?? DEFAULT_PLAYER_VISUAL.fill
  const fill = normalizePlayerColor(rawFill) ?? DEFAULT_PLAYER_VISUAL.fill
  const authoredLabel = input.visual?.label
  const isGoalie = input.visual?.marker === 'goalie'
  const label =
    authoredLabel !== undefined && authoredLabel.length > 0
      ? normalizePlayerLabel(authoredLabel)
      : ''
  const handedness: PlayerHandedness =
    input.visual?.handedness === 'left' ? 'left' : 'right'

  const resolved: PlayerVisual & { label: string; handedness: PlayerHandedness } =
    { fill, label, handedness }
  if (isGoalie) {
    resolved.marker = 'goalie'
  }
  return resolved
}

export function isPlayerMarkerKind(value: unknown): value is PlayerMarkerKind {
  return value === 'skater' || value === 'goalie'
}
