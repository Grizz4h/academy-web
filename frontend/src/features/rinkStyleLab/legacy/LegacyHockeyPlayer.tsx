/**
 * Simple Tank-style player token (circle + number) for Style Lab comparison.
 * Not the Board Studio compound marker.
 */

export type LegacyHockeyPlayerProps = {
  teamColor?: string
  number?: string
  rotation?: number
  showStick?: boolean
  x?: number
  y?: number
  scale?: number
  className?: string
}

const TOKEN_COLORS: Record<string, string> = {
  black: '#222222',
  white: '#f5f5f5',
  red: '#c62828',
  blue: '#1565c0',
  yellow: '#f9a825',
  green: '#2e7d32',
}

function resolveFill(teamColor: string): string {
  if (teamColor.startsWith('#')) return teamColor
  return TOKEN_COLORS[teamColor] ?? TOKEN_COLORS.blue
}

function labelFill(fill: string): string {
  const hex = fill.startsWith('#') ? fill : '#1565c0'
  const n = Number.parseInt(hex.slice(1), 16)
  if (!Number.isFinite(n)) return '#ffffff'
  const r = (n >> 16) & 255
  const g = (n >> 8) & 255
  const b = n & 255
  const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255
  return lum < 0.45 ? '#ffffff' : '#222222'
}

export function LegacyHockeyPlayer({
  teamColor = 'blue',
  number = '',
  rotation = 0,
  showStick = true,
  x = 0,
  y = 0,
  scale = 1,
  className,
}: LegacyHockeyPlayerProps) {
  const fill = resolveFill(teamColor)
  const textFill = labelFill(fill)
  const r = 14 * (Number.isFinite(scale) && scale > 0 ? scale : 1)

  return (
    <g
      className={className}
      data-hockey-player="legacy"
      transform={`translate(${x} ${y}) rotate(${rotation})`}
    >
      {showStick ? (
        <line
          data-player-part="legacy-stick"
          x1={r * 0.55}
          y1={2}
          x2={r * 1.55}
          y2={-r * 0.55}
          stroke="#2a3344"
          strokeWidth={2.2}
          strokeLinecap="round"
        />
      ) : null}
      <circle
        data-player-part="legacy-body"
        cx={0}
        cy={0}
        r={r}
        fill={fill}
        stroke="#152033"
        strokeWidth={1.6}
      />
      {number ? (
        <text
          data-player-part="legacy-label"
          x={0}
          y={0}
          dy="0.35em"
          textAnchor="middle"
          fontSize={r * 0.85}
          fontWeight={700}
          fontFamily="'Segoe UI', 'Helvetica Neue', Arial, sans-serif"
          fill={textFill}
          style={{ userSelect: 'none', pointerEvents: 'none' }}
        >
          {number}
        </text>
      ) : null}
    </g>
  )
}
