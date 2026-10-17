/**
 * Portable Board Studio hockey marker for rInQ Tank Style Lab.
 * Visuals come from vendored `buildPlayerVisual` — see ../SOURCE.md.
 */

import { buildPlayerVisual } from './playerPrimitives.ts'
import { derivePlayerMarkerPaints } from './playerMarkerPaints.ts'
import { resolvePlayerRenderAppearance } from './playerRenderAppearance.ts'
import { renderPlayerPrimitive } from './renderPlayerPrimitive.tsx'
import type { PlayerColor, PlayerHandedness, PlayerMarkerKind } from './playerVisual.ts'
import { normalizePlayerLabel } from './playerVisual.ts'

export type HockeyPlayerProps = {
  /** Board Studio fill token or `#RRGGBB`. */
  teamColor?: PlayerColor
  /** Jersey / label text (max 8 chars after normalize). */
  number?: string
  /** Body facing — SVG clockwise degrees. */
  rotation?: number
  /** When false, stick shaft/blade primitives are omitted. Default true. */
  showStick?: boolean
  /** Anchor X in parent SVG space. Default 0. */
  x?: number
  /** Anchor Y in parent SVG space. Default 0. */
  y?: number
  marker?: PlayerMarkerKind
  handedness?: PlayerHandedness
  /** Extra uniform scale on top of skater design scale. */
  scale?: number
  selected?: boolean
  includeHitArea?: boolean
  className?: string
  id?: string
}

export function HockeyPlayer({
  teamColor = 'blue',
  number = '',
  rotation = 0,
  showStick = true,
  x = 0,
  y = 0,
  marker = 'skater',
  handedness = 'right',
  scale = 1,
  selected = false,
  includeHitArea = false,
  className,
  id = 'style-lab-player',
}: HockeyPlayerProps) {
  const appearance = resolvePlayerRenderAppearance({
    id,
    visual: {
      fill: teamColor,
      label: number ? normalizePlayerLabel(String(number)) : '',
      marker: marker === 'goalie' ? 'goalie' : undefined,
      handedness,
    },
  })
  const paints = derivePlayerMarkerPaints(appearance)
  const visual = buildPlayerVisual({
    appearance,
    position: { x, y },
    rotationDegrees: rotation,
    selected,
    includeHitArea,
    paints,
  })

  const body = showStick
    ? visual.body
    : visual.body.filter(
        (p) => p.role !== 'stick-shaft' && p.role !== 'stick-blade',
      )

  const meta = { objectId: id }
  const safeScale = Number.isFinite(scale) && scale > 0 ? scale : 1
  const outerScale =
    Math.abs(safeScale - 1) > 1e-9
      ? `translate(${x} ${y}) scale(${safeScale}) translate(${-x} ${-y})`
      : undefined

  const content = (
    <>
      {visual.overlays
        .filter((p) => p.role === 'selection-halo')
        .map((p, i) => renderPlayerPrimitive(p, `halo-${i}`, meta))}
      <g data-player-body="true" transform={visual.bodyTransform}>
        {body.map((p, i) =>
          renderPlayerPrimitive(p, `body-${p.role}-${i}`, meta),
        )}
      </g>
      {visual.overlays
        .filter((p) => p.role !== 'selection-halo')
        .map((p, i) =>
          renderPlayerPrimitive(p, `overlay-${p.role}-${i}`, meta),
        )}
    </>
  )

  return (
    <g
      className={className}
      data-hockey-player="board-studio"
      data-player-fill={String(appearance.visual.fill)}
      data-player-marker={appearance.visual.marker === 'goalie' ? 'goalie' : 'hockey-v1'}
      data-player-anchor-x={x}
      data-player-anchor-y={y}
      data-player-rotation={visual.rotationDegrees}
      transform={outerScale}
    >
      {content}
    </g>
  )
}
