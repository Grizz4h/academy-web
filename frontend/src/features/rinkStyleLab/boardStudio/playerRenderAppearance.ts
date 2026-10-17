/**
 * Token / hex → concrete SVG paints (Board Studio `playerRenderAppearance.ts`).
 * See ../SOURCE.md.
 */

import type { PlayerColor, PlayerColorToken, PlayerVisual } from './playerVisual.ts'
import {
  isPlayerColorToken,
  normalizePlayerColor,
  resolvePlayerVisual,
} from './playerVisual.ts'

export interface PlayerColorStyle {
  fill: string
  stroke: string
  labelFill: string
}

const PLAYER_COLOR_STYLES: Record<PlayerColorToken, PlayerColorStyle> = {
  black: { fill: '#222222', stroke: '#f5f5f5', labelFill: '#f5f5f5' },
  white: { fill: '#f5f5f5', stroke: '#222222', labelFill: '#222222' },
  red: { fill: '#c62828', stroke: '#ffffff', labelFill: '#ffffff' },
  blue: { fill: '#1565c0', stroke: '#ffffff', labelFill: '#ffffff' },
  yellow: { fill: '#f9a825', stroke: '#222222', labelFill: '#222222' },
  green: { fill: '#2e7d32', stroke: '#ffffff', labelFill: '#ffffff' },
}

function relativeLuminance(hex: string): number {
  const n = Number.parseInt(hex.slice(1), 16)
  const r = ((n >> 16) & 255) / 255
  const g = ((n >> 8) & 255) / 255
  const b = (n & 255) / 255
  const lin = (c: number) =>
    c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
}

function styleForHexFill(hex: string): PlayerColorStyle {
  const lightLabel = relativeLuminance(hex) < 0.45
  return {
    fill: hex,
    stroke: lightLabel ? '#ffffff' : '#222222',
    labelFill: lightLabel ? '#ffffff' : '#222222',
  }
}

export function playerColorStyle(color: PlayerColor): PlayerColorStyle {
  if (isPlayerColorToken(color)) {
    return PLAYER_COLOR_STYLES[color]
  }
  const hex = normalizePlayerColor(color)
  if (hex && !isPlayerColorToken(hex)) {
    return styleForHexFill(hex)
  }
  return PLAYER_COLOR_STYLES.black
}

export interface PlayerRenderAppearance {
  fill: string
  stroke: string
  labelFill: string
  label: string
  visual: PlayerVisual & { label: string; handedness: 'left' | 'right' }
}

export function resolvePlayerRenderAppearance(player: {
  id?: string
  visual?: PlayerVisual | null
}): PlayerRenderAppearance {
  const visual = resolvePlayerVisual(player)
  const style = playerColorStyle(visual.fill)
  return {
    fill: style.fill,
    stroke: style.stroke,
    labelFill: style.labelFill,
    label: visual.label,
    visual,
  }
}
