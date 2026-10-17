/**
 * SVG mapping for player primitives (from Board Studio `PlayerView.tsx`).
 * See ../SOURCE.md.
 */

import {
  padRectTransformAttribute,
  type PlayerPrimitive,
} from './playerPrimitives.ts'

export function renderPlayerPrimitive(
  p: PlayerPrimitive,
  key: string,
  meta?: { objectId?: string },
) {
  switch (p.role) {
    case 'selection-halo':
      return (
        <circle
          key={key}
          data-selection-halo="true"
          cx={p.cx}
          cy={p.cy}
          r={p.r}
          fill="none"
          stroke={p.stroke}
          strokeWidth={p.strokeWidth}
          style={{ pointerEvents: 'none' }}
        />
      )
    case 'stick-shaft':
    case 'stick-blade':
      return (
        <g key={key} style={{ pointerEvents: 'none' }} transform={p.transform}>
          <polyline
            data-player-part={p.role}
            points={p.points}
            fill="none"
            stroke={p.outline}
            strokeWidth={p.strokeWidth + 1.2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <polyline
            data-player-part={p.role}
            points={p.points}
            fill="none"
            stroke={p.stroke}
            strokeWidth={p.strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      )
    case 'left-skate':
    case 'right-skate':
      return (
        <ellipse
          key={key}
          data-player-part={p.role}
          cx={p.cx}
          cy={p.cy}
          rx={p.rx}
          ry={p.ry}
          fill={p.fill}
          stroke={p.stroke}
          strokeWidth={p.strokeWidth}
          transform={p.transform}
          style={{ pointerEvents: 'none' }}
        />
      )
    case 'torso':
      return (
        <path
          key={key}
          data-player-part="torso"
          d={p.d}
          fill={p.fill}
          stroke={p.stroke}
          strokeWidth={p.strokeWidth}
          strokeLinejoin="round"
          style={{ pointerEvents: 'none' }}
        />
      )
    case 'torso-trim':
      return (
        <path
          key={key}
          data-player-part="torso-trim"
          d={p.d}
          fill="none"
          stroke={p.stroke}
          strokeWidth={p.strokeWidth}
          strokeLinejoin="round"
          opacity={0.85}
          style={{ pointerEvents: 'none' }}
        />
      )
    case 'left-pad':
    case 'right-pad':
    case 'blocker': {
      const transform = padRectTransformAttribute(
        p.x,
        p.y,
        p.width,
        p.height,
        p.rotationDegrees,
      )
      return (
        <rect
          key={key}
          data-player-part={p.role}
          x={p.x}
          y={p.y}
          width={p.width}
          height={p.height}
          rx={p.rx}
          fill={p.fill}
          stroke={p.stroke}
          strokeWidth={p.strokeWidth}
          transform={transform}
          style={{ pointerEvents: 'none' }}
        />
      )
    }
    case 'left-glove':
    case 'right-glove':
    case 'helmet':
      return (
        <circle
          key={key}
          data-player-part={p.role}
          cx={p.cx}
          cy={p.cy}
          r={p.r}
          fill={p.fill}
          stroke={p.stroke}
          strokeWidth={p.strokeWidth}
          transform={p.transform}
          style={{ pointerEvents: 'none' }}
        />
      )
    case 'helmet-highlight':
      return (
        <circle
          key={key}
          data-player-part={p.role}
          cx={p.cx}
          cy={p.cy}
          r={p.r}
          fill={p.fill}
          transform={p.transform}
          style={{ pointerEvents: 'none' }}
        />
      )
    case 'helmet-visor':
      return (
        <ellipse
          key={key}
          data-player-part="helmet-visor"
          cx={p.cx}
          cy={p.cy}
          rx={p.rx}
          ry={p.ry}
          fill={p.fill}
          transform={p.transform}
          style={{ pointerEvents: 'none' }}
        />
      )
    case 'label':
      return (
        <text
          key={key}
          data-object-label={meta?.objectId}
          data-player-part="label"
          x={p.x}
          y={p.y}
          dy={p.dy}
          textAnchor={p.textAnchor}
          dominantBaseline={p.dominantBaseline}
          fontSize={p.fontSize}
          fontWeight={p.fontWeight}
          fontFamily={p.fontFamily}
          fill={p.fill}
          style={{ pointerEvents: 'none', userSelect: 'none' }}
        >
          {p.text}
        </text>
      )
    case 'hit-area':
      return (
        <circle
          key={key}
          data-player-hit-area="true"
          cx={p.cx}
          cy={p.cy}
          r={p.r}
          fill="transparent"
          stroke="none"
        />
      )
    default: {
      const _exhaustive: never = p
      return _exhaustive
    }
  }
}
