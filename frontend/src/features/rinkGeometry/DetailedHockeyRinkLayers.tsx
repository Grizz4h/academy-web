import { getDetailedRinkMetrics, type DetailedRinkMetrics } from './detailedMetrics'
import type { RinkOverlays } from './rinkOverlays'

function iceAdChevronPath(scale = 1): string {
  const w = 22 * scale
  const h = 14 * scale
  return `M ${-w * 0.42} ${-h / 2} L ${w * 0.4} 0 L ${-w * 0.42} ${h / 2} L ${-w * 0.2} ${h / 2} L ${w * 0.24} 0 L ${-w * 0.2} ${-h / 2} Z`
}

function IceAdChevronBand({
  startX,
  endX,
  y,
  direction,
  count,
  scale = 1,
  opacity = 0.4,
}: {
  startX: number
  endX: number
  y: number
  direction: 'left' | 'right'
  count: number
  scale?: number
  opacity?: number
}) {
  const span = endX - startX
  if (span <= 0 || count < 1) return null
  const step = span / (count + 1)
  return (
    <g
      opacity={opacity}
      fill="rgba(226, 232, 240, 0.82)"
      stroke="rgba(203, 213, 225, 0.55)"
      strokeWidth={1.15 * scale}
      strokeLinejoin="round"
    >
      {Array.from({ length: count }, (_, index) => {
        const x = startX + step * (index + 1)
        const transform = direction === 'right'
          ? `translate(${x} ${y})`
          : `translate(${x} ${y}) scale(-1 1)`
        return <path key={`${y}-${index}`} d={iceAdChevronPath(scale)} transform={transform} />
      })}
    </g>
  )
}

/** In-ice advertising vibe: desaturated chevrons, readable but not UI-loud. */
function PlayDirectionIceAds({
  metrics,
  attackDirection,
}: {
  metrics: DetailedRinkMetrics
  attackDirection: 'left' | 'right'
}) {
  const boardInset = metrics.rinkHeight * 0.078
  const topY = metrics.rinkY + boardInset
  const bottomY = metrics.rinkY + metrics.rinkHeight - boardInset
  const nzPad = metrics.rinkWidth * 0.018
  const zonePad = metrics.rinkWidth * 0.03
  return (
    <g aria-hidden="true">
      <IceAdChevronBand
        startX={metrics.leftBlueLineX + nzPad}
        endX={metrics.rightBlueLineX - nzPad}
        y={topY}
        direction={attackDirection}
        count={5}
        scale={1.35}
        opacity={0.42}
      />
      <IceAdChevronBand
        startX={metrics.leftBlueLineX + nzPad}
        endX={metrics.rightBlueLineX - nzPad}
        y={bottomY}
        direction={attackDirection}
        count={5}
        scale={1.35}
        opacity={0.42}
      />
      <IceAdChevronBand
        startX={metrics.leftGoalLineX + zonePad}
        endX={metrics.leftBlueLineX - nzPad}
        y={topY}
        direction={attackDirection}
        count={3}
        scale={1.12}
        opacity={0.32}
      />
      <IceAdChevronBand
        startX={metrics.leftGoalLineX + zonePad}
        endX={metrics.leftBlueLineX - nzPad}
        y={bottomY}
        direction={attackDirection}
        count={3}
        scale={1.12}
        opacity={0.32}
      />
      <IceAdChevronBand
        startX={metrics.rightBlueLineX + nzPad}
        endX={metrics.rightGoalLineX - zonePad}
        y={topY}
        direction={attackDirection}
        count={3}
        scale={1.12}
        opacity={0.32}
      />
      <IceAdChevronBand
        startX={metrics.rightBlueLineX + nzPad}
        endX={metrics.rightGoalLineX - zonePad}
        y={bottomY}
        direction={attackDirection}
        count={3}
        scale={1.12}
        opacity={0.32}
      />
    </g>
  )
}

export type DetailedHockeyRinkLayersProps = {
  overlays: RinkOverlays
  defensiveLabel?: string
  offensiveLabel?: string
}

/** Shared detailed rink markings (900×620). Interaction layers stay outside this base. */
export function DetailedHockeyRinkLayers({
  overlays,
  defensiveLabel = 'Defensive Zone',
  offensiveLabel = 'Offensive Zone',
}: DetailedHockeyRinkLayersProps) {
  const m = getDetailedRinkMetrics()
  const attackDirection = overlays.attackDirection
    || (overlays.defendingSide === 'left' ? 'right' : 'left')
  const showIceAds = overlays.iceAds !== false

  return (
    <>
      <rect
        x={m.rinkX}
        y={m.rinkY}
        width={m.rinkWidth}
        height={m.rinkHeight}
        rx="110"
        ry="110"
        fill="rgba(240,248,255,0.08)"
        stroke="rgba(255,255,255,0.38)"
        strokeWidth="4"
      />
      <line
        x1={m.rinkCenterX}
        y1={m.rinkY + 4}
        x2={m.rinkCenterX}
        y2={m.rinkY + m.rinkHeight - 4}
        stroke="rgba(255,120,120,0.55)"
        strokeWidth="4"
      />
      <line
        x1={m.leftBlueLineX}
        y1={m.rinkY + 4}
        x2={m.leftBlueLineX}
        y2={m.rinkY + m.rinkHeight - 4}
        stroke="rgba(86,153,255,0.75)"
        strokeWidth="4"
      />
      <line
        x1={m.rightBlueLineX}
        y1={m.rinkY + 4}
        x2={m.rightBlueLineX}
        y2={m.rinkY + m.rinkHeight - 4}
        stroke="rgba(86,153,255,0.75)"
        strokeWidth="4"
      />
      <circle
        cx={m.rinkCenterX}
        cy={m.rinkCenterY}
        r={m.faceoffRadius}
        fill="none"
        stroke="rgba(255,255,255,0.22)"
        strokeWidth="3"
      />

      {overlays.faceoffDots && (
        <>
          <circle cx={m.leftZoneFaceoffX} cy={m.topFaceoffY} r={m.faceoffRadius} fill="none" stroke="rgba(255,255,255,0.24)" strokeWidth="3" />
          <circle cx={m.leftZoneFaceoffX} cy={m.bottomFaceoffY} r={m.faceoffRadius} fill="none" stroke="rgba(255,255,255,0.24)" strokeWidth="3" />
          <circle cx={m.rightZoneFaceoffX} cy={m.topFaceoffY} r={m.faceoffRadius} fill="none" stroke="rgba(255,255,255,0.24)" strokeWidth="3" />
          <circle cx={m.rightZoneFaceoffX} cy={m.bottomFaceoffY} r={m.faceoffRadius} fill="none" stroke="rgba(255,255,255,0.24)" strokeWidth="3" />
          <circle cx={m.leftZoneFaceoffX} cy={m.topFaceoffY} r="4" fill="rgba(239,68,68,0.92)" />
          <circle cx={m.leftZoneFaceoffX} cy={m.bottomFaceoffY} r="4" fill="rgba(239,68,68,0.92)" />
          <circle cx={m.rightZoneFaceoffX} cy={m.topFaceoffY} r="4" fill="rgba(239,68,68,0.92)" />
          <circle cx={m.rightZoneFaceoffX} cy={m.bottomFaceoffY} r="4" fill="rgba(239,68,68,0.92)" />
          {m.neutralDots.map((dot, idx) => (
            <circle key={`neutral-dot-${idx}`} cx={dot.x} cy={dot.y} r="3.2" fill="rgba(203,213,225,0.78)" />
          ))}
        </>
      )}

      {overlays.zones && (
        <>
          <line x1={m.leftGoalLineX} y1={m.rinkY + 6} x2={m.leftGoalLineX} y2={m.rinkY + m.rinkHeight - 6} stroke="rgba(248,113,113,0.62)" strokeWidth="2.5" />
          <line x1={m.rightGoalLineX} y1={m.rinkY + 6} x2={m.rightGoalLineX} y2={m.rinkY + m.rinkHeight - 6} stroke="rgba(248,113,113,0.62)" strokeWidth="2.5" />
        </>
      )}

      {overlays.goals && (
        <>
          <line x1={m.leftGoalLineX} y1={m.rinkCenterY - m.goalHalf} x2={m.leftGoalLineX} y2={m.rinkCenterY + m.goalHalf} stroke="rgba(220,38,38,0.94)" strokeWidth="3.2" />
          <line x1={m.leftGoalLineX} y1={m.rinkCenterY - m.goalHalf} x2={m.leftGoalLineX - m.goalDepth} y2={m.rinkCenterY - m.goalHalf} stroke="rgba(248,113,113,0.84)" strokeWidth="2.2" />
          <line x1={m.leftGoalLineX} y1={m.rinkCenterY + m.goalHalf} x2={m.leftGoalLineX - m.goalDepth} y2={m.rinkCenterY + m.goalHalf} stroke="rgba(248,113,113,0.84)" strokeWidth="2.2" />
          <line x1={m.leftGoalLineX - m.goalDepth} y1={m.rinkCenterY - m.goalHalf} x2={m.leftGoalLineX - m.goalDepth} y2={m.rinkCenterY + m.goalHalf} stroke="rgba(203,213,225,0.42)" strokeWidth="1.6" />
          <path d={`M ${m.leftGoalLineX - m.goalDepth} ${m.rinkCenterY - m.goalHalf} L ${m.leftGoalLineX} ${m.rinkCenterY - m.goalHalf} L ${m.leftGoalLineX} ${m.rinkCenterY + m.goalHalf} L ${m.leftGoalLineX - m.goalDepth} ${m.rinkCenterY + m.goalHalf} Z`} fill="rgba(148,163,184,0.08)" stroke="none" />

          <line x1={m.rightGoalLineX} y1={m.rinkCenterY - m.goalHalf} x2={m.rightGoalLineX} y2={m.rinkCenterY + m.goalHalf} stroke="rgba(220,38,38,0.94)" strokeWidth="3.2" />
          <line x1={m.rightGoalLineX} y1={m.rinkCenterY - m.goalHalf} x2={m.rightGoalLineX + m.goalDepth} y2={m.rinkCenterY - m.goalHalf} stroke="rgba(248,113,113,0.84)" strokeWidth="2.2" />
          <line x1={m.rightGoalLineX} y1={m.rinkCenterY + m.goalHalf} x2={m.rightGoalLineX + m.goalDepth} y2={m.rinkCenterY + m.goalHalf} stroke="rgba(248,113,113,0.84)" strokeWidth="2.2" />
          <line x1={m.rightGoalLineX + m.goalDepth} y1={m.rinkCenterY - m.goalHalf} x2={m.rightGoalLineX + m.goalDepth} y2={m.rinkCenterY + m.goalHalf} stroke="rgba(203,213,225,0.42)" strokeWidth="1.6" />
          <path d={`M ${m.rightGoalLineX + m.goalDepth} ${m.rinkCenterY - m.goalHalf} L ${m.rightGoalLineX} ${m.rinkCenterY - m.goalHalf} L ${m.rightGoalLineX} ${m.rinkCenterY + m.goalHalf} L ${m.rightGoalLineX + m.goalDepth} ${m.rinkCenterY + m.goalHalf} Z`} fill="rgba(148,163,184,0.08)" stroke="none" />
        </>
      )}

      {overlays.crease && (
        <>
          <path d={`M ${m.leftGoalLineX} ${m.rinkCenterY - m.creaseRadius} A ${m.creaseRadius} ${m.creaseRadius} 0 0 1 ${m.leftGoalLineX} ${m.rinkCenterY + m.creaseRadius}`} fill="rgba(56,189,248,0.08)" stroke="rgba(56,189,248,0.72)" strokeWidth="2.4" />
          <path d={`M ${m.rightGoalLineX} ${m.rinkCenterY - m.creaseRadius} A ${m.creaseRadius} ${m.creaseRadius} 0 0 0 ${m.rightGoalLineX} ${m.rinkCenterY + m.creaseRadius}`} fill="rgba(56,189,248,0.08)" stroke="rgba(56,189,248,0.72)" strokeWidth="2.4" />
        </>
      )}

      {showIceAds && <PlayDirectionIceAds metrics={m} attackDirection={attackDirection} />}

      {overlays.labels && overlays.zones && (
        <>
          <text x={m.rinkX + m.rinkWidth * 0.08} y={m.rinkY + 18} fontSize="11" fill="rgba(148,163,184,0.62)">{defensiveLabel}</text>
          <text x={m.rinkCenterX - 32} y={m.rinkY + 18} fontSize="11" fill="rgba(148,163,184,0.62)">Neutral Zone</text>
          <text x={m.rinkRight - m.rinkWidth * 0.26} y={m.rinkY + 18} fontSize="11" fill="rgba(148,163,184,0.62)">{offensiveLabel}</text>
        </>
      )}
    </>
  )
}
