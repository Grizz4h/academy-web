import styles from './MiniRinkPreview.module.css'

export type MiniRinkPoint = { x: number; y: number }

export type MiniRinkPaintStroke = MiniRinkPoint[]

export type MiniRinkPaintLayer = {
  layerId?: string
  color?: string
  strokes: MiniRinkPaintStroke[]
}

export type MiniRinkPath = {
  start: MiniRinkPoint
  end: MiniRinkPoint
}

export type MiniRinkPreviewProps = {
  width?: number
  height?: number
  paint?: MiniRinkPaintLayer[]
  path?: MiniRinkPath | null
  markers?: MiniRinkPoint[]
  players?: Array<MiniRinkPoint & { label?: string }>
  zoneHint?: { x: number; y: number; w: number; h: number } | null
  className?: string
  title?: string
}

const DEFAULT_PAINT_COLORS = ['#22c55e', '#ef4444', '#38bdf8', '#fbbf24', '#a78bfa']

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0.5
  return Math.min(1, Math.max(0, n))
}

function strokeToPath(stroke: MiniRinkPaintStroke, w: number, h: number): string {
  if (!stroke.length) return ''
  return stroke
    .map((p, i) => {
      const x = clamp01(p.x) * w
      const y = clamp01(p.y) * h
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`
    })
    .join(' ')
}

/** Lightweight read-only rink thumbnail (SVG). Coords are normalized 0–1. */
export function MiniRinkPreview({
  width = 120,
  height = 72,
  paint = [],
  path = null,
  markers = [],
  players = [],
  zoneHint = null,
  className,
  title,
}: MiniRinkPreviewProps) {
  const padX = width * 0.06
  const padY = height * 0.1
  const rinkW = width - padX * 2
  const rinkH = height - padY * 2
  const rx = Math.min(rinkW, rinkH) * 0.18
  const cx = padX + rinkW / 2
  const leftBlue = padX + rinkW * 0.33
  const rightBlue = padX + rinkW * 0.67

  const toX = (x: number) => padX + clamp01(x) * rinkW
  const toY = (y: number) => padY + clamp01(y) * rinkH

  return (
    <svg
      className={[styles.rink, className].filter(Boolean).join(' ')}
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={title || 'Rink-Vorschau'}
    >
      <rect
        x={padX}
        y={padY}
        width={rinkW}
        height={rinkH}
        rx={rx}
        ry={rx}
        className={styles.ice}
      />
      <line x1={cx} y1={padY + 1} x2={cx} y2={padY + rinkH - 1} className={styles.centerLine} />
      <line x1={leftBlue} y1={padY + 1} x2={leftBlue} y2={padY + rinkH - 1} className={styles.blueLine} />
      <line x1={rightBlue} y1={padY + 1} x2={rightBlue} y2={padY + rinkH - 1} className={styles.blueLine} />
      <circle cx={cx} cy={padY + rinkH / 2} r={Math.min(rinkW, rinkH) * 0.12} className={styles.faceoff} />

      {zoneHint && (
        <rect
          x={toX(zoneHint.x)}
          y={toY(zoneHint.y)}
          width={clamp01(zoneHint.w) * rinkW}
          height={clamp01(zoneHint.h) * rinkH}
          className={styles.zoneHint}
        />
      )}

      {paint.map((layer, layerIdx) => {
        const color = layer.color || DEFAULT_PAINT_COLORS[layerIdx % DEFAULT_PAINT_COLORS.length]
        return (layer.strokes || []).map((stroke, strokeIdx) => {
          if (!stroke?.length) return null
          if (stroke.length === 1) {
            return (
              <circle
                key={`p-${layerIdx}-${strokeIdx}`}
                cx={toX(stroke[0].x)}
                cy={toY(stroke[0].y)}
                r={2.4}
                fill={color}
                opacity={0.9}
              />
            )
          }
          const d = strokeToPath(stroke, rinkW, rinkH)
          if (!d) return null
          // Path was built in rink-local space; shift by pad.
          const shifted = d.replace(/([ML])([\d.]+) ([\d.]+)/g, (_, cmd, x, y) => {
            return `${cmd}${(Number(x) + padX).toFixed(1)} ${(Number(y) + padY).toFixed(1)}`
          })
          return (
            <path
              key={`p-${layerIdx}-${strokeIdx}`}
              d={shifted}
              fill="none"
              stroke={color}
              strokeWidth={2.2}
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={0.85}
            />
          )
        })
      })}

      {path?.start && path?.end && (() => {
        const x1 = toX(path.start.x)
        const y1 = toY(path.start.y)
        const x2 = toX(path.end.x)
        const y2 = toY(path.end.y)
        const dx = x2 - x1
        const dy = y2 - y1
        const len = Math.hypot(dx, dy) || 1
        const ux = dx / len
        const uy = dy / len
        const head = Math.min(6, len * 0.28)
        const tipX = x2
        const tipY = y2
        const leftX = tipX - head * ux + head * 0.45 * uy
        const leftY = tipY - head * uy - head * 0.45 * ux
        const rightX = tipX - head * ux - head * 0.45 * uy
        const rightY = tipY - head * uy + head * 0.45 * ux
        return (
          <g>
            <line x1={x1} y1={y1} x2={x2} y2={y2} className={styles.pathLine} />
            <circle cx={x1} cy={y1} r={2.2} className={styles.pathDot} />
            <polygon points={`${tipX},${tipY} ${leftX},${leftY} ${rightX},${rightY}`} className={styles.pathArrow} />
          </g>
        )
      })()}

      {markers.map((m, i) => (
        <circle key={`m-${i}`} cx={toX(m.x)} cy={toY(m.y)} r={3} className={styles.marker} />
      ))}

      {players.map((p, i) => (
        <g key={`pl-${i}`}>
          <circle cx={toX(p.x)} cy={toY(p.y)} r={3.2} className={styles.player} />
          {p.label ? (
            <text x={toX(p.x)} y={toY(p.y) - 4.5} className={styles.playerLabel} textAnchor="middle">
              {p.label.slice(0, 2)}
            </text>
          ) : null}
        </g>
      ))}
    </svg>
  )
}
