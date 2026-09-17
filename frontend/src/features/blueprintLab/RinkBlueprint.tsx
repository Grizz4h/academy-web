import { useId } from 'react'
import { layoutRink } from './rinkGeometry'
import { DEMO_RINK_SPEC, type BlueprintViewMode, type RinkSpec } from './rinkSpec'
import styles from './RinkBlueprint.module.css'

export type RinkBlueprintProps = {
  spec?: RinkSpec
  mode?: BlueprintViewMode
  className?: string
}

function DimLine({
  x1,
  y1,
  x2,
  y2,
  label,
  markerId,
}: {
  x1: number
  y1: number
  x2: number
  y2: number
  label: string
  markerId: string
}) {
  const mx = (x1 + x2) / 2
  const my = (y1 + y2) / 2
  const horizontal = Math.abs(x2 - x1) >= Math.abs(y2 - y1)
  return (
    <g>
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        className={styles.dimLine}
        markerStart={`url(#${markerId})`}
        markerEnd={`url(#${markerId})`}
      />
      <text
        x={mx}
        y={my}
        className={styles.dimLabel}
        textAnchor="middle"
        dominantBaseline="middle"
        dx={horizontal ? 0 : -11}
        dy={horizontal ? -8 : 0}
      >
        {label}
      </text>
    </g>
  )
}

export function RinkBlueprint({
  spec = DEMO_RINK_SPEC,
  mode = 'basic',
  className,
}: RinkBlueprintProps) {
  const uid = useId().replace(/:/g, '')
  const clipId = `rink-clip-${uid}`
  const markerId = `dim-arrow-${uid}`
  const layout = layoutRink(spec)
  const { rink, center } = layout
  const technical = mode === 'technical'

  const lengthY = rink.y + rink.h + 28
  const widthX = rink.x - 28
  const tick = 6

  return (
    <svg
      className={[styles.svg, className].filter(Boolean).join(' ')}
      viewBox={layout.viewBox}
      role="img"
      aria-label="Technische Rink-Zeichnung, Demo-Maße"
    >
      <defs>
        <clipPath id={clipId}>
          <path d={layout.outlinePath} />
        </clipPath>
        <marker
          id={markerId}
          viewBox="0 0 10 10"
          refX="5"
          refY="5"
          markerWidth="4.5"
          markerHeight="4.5"
          orient="auto-start-reverse"
        >
          <path d="M 0 1.5 L 9 5 L 0 8.5 Z" className={styles.arrowHead} />
        </marker>
      </defs>

      <g id="rink-outline">
        <path d={layout.outlinePath} className={styles.ice} />
        <path d={layout.outlinePath} className={styles.boards} />
      </g>

      <g id="rink-markings" clipPath={`url(#${clipId})`}>
        <line
          x1={layout.blueLeftX}
          y1={rink.y}
          x2={layout.blueLeftX}
          y2={rink.y + rink.h}
          className={styles.blueLine}
        />
        <line
          x1={layout.blueRightX}
          y1={rink.y}
          x2={layout.blueRightX}
          y2={rink.y + rink.h}
          className={styles.blueLine}
        />
        <line
          x1={center.x}
          y1={rink.y}
          x2={center.x}
          y2={rink.y + rink.h}
          className={styles.centerLine}
        />
        <line
          x1={layout.goalLineLeftX}
          y1={rink.y}
          x2={layout.goalLineLeftX}
          y2={rink.y + rink.h}
          className={styles.goalLine}
        />
        <line
          x1={layout.goalLineRightX}
          y1={rink.y}
          x2={layout.goalLineRightX}
          y2={rink.y + rink.h}
          className={styles.goalLine}
        />
        <circle
          cx={center.x}
          cy={center.y}
          r={layout.circleR}
          className={styles.circle}
        />
        {layout.endZoneFaceoffs.map((spot, index) => (
          <circle
            key={`circle-${index}`}
            cx={spot.x}
            cy={spot.y}
            r={layout.circleR}
            className={styles.circle}
          />
        ))}
      </g>

      <g id="goals">
        <rect
          x={layout.leftGoal.x}
          y={layout.leftGoal.y}
          width={layout.leftGoal.w}
          height={layout.leftGoal.h}
          className={styles.goal}
        />
        <rect
          x={layout.rightGoal.x}
          y={layout.rightGoal.y}
          width={layout.rightGoal.w}
          height={layout.rightGoal.h}
          className={styles.goal}
        />
      </g>

      <g id="faceoff">
        <circle cx={center.x} cy={center.y} r={2.4} className={styles.dot} />
        {layout.endZoneFaceoffs.map((spot, index) => (
          <circle key={`dot-${index}`} cx={spot.x} cy={spot.y} r={2.2} className={styles.dot} />
        ))}
      </g>

      <g id="basic-dimensions">
        <line x1={rink.x} y1={lengthY - tick} x2={rink.x} y2={lengthY + tick} className={styles.dimTick} />
        <line
          x1={rink.x + rink.w}
          y1={lengthY - tick}
          x2={rink.x + rink.w}
          y2={lengthY + tick}
          className={styles.dimTick}
        />
        <DimLine
          x1={rink.x}
          y1={lengthY}
          x2={rink.x + rink.w}
          y2={lengthY}
          label={`${spec.lengthM} m`}
          markerId={markerId}
        />
        <line x1={widthX - tick} y1={rink.y} x2={widthX + tick} y2={rink.y} className={styles.dimTick} />
        <line
          x1={widthX - tick}
          y1={rink.y + rink.h}
          x2={widthX + tick}
          y2={rink.y + rink.h}
          className={styles.dimTick}
        />
        <DimLine
          x1={widthX}
          y1={rink.y}
          x2={widthX}
          y2={rink.y + rink.h}
          label={`${spec.widthM} m`}
          markerId={markerId}
        />
      </g>

      <g id="detail-dimensions" className={technical ? styles.layerOn : styles.layerOff}>
        <DimLine
          x1={rink.x}
          y1={rink.y - 22}
          x2={layout.goalLineLeftX}
          y2={rink.y - 22}
          label={`${spec.goalLineOffsetM} m`}
          markerId={markerId}
        />
        <line
          x1={layout.goalLineLeftX}
          y1={rink.y - 22}
          x2={layout.goalLineLeftX}
          y2={rink.y}
          className={styles.dimGuide}
        />
        <DimLine
          x1={layout.endZoneFaceoffs[0].x - layout.circleR}
          y1={layout.endZoneFaceoffs[0].y - layout.circleR - 16}
          x2={layout.endZoneFaceoffs[0].x + layout.circleR}
          y2={layout.endZoneFaceoffs[0].y - layout.circleR - 16}
          label={`Ø ${spec.faceoffCircleDiameterM} m`}
          markerId={markerId}
        />
        <path
          d={`M ${rink.x + rink.r} ${rink.y} A ${rink.r} ${rink.r} 0 0 0 ${rink.x} ${rink.y + rink.r}`}
          className={styles.radiusGuide}
        />
        <DimLine
          x1={rink.x + 8}
          y1={rink.y + rink.r + 18}
          x2={rink.x + rink.r}
          y2={rink.y + 8}
          label={`R ${spec.cornerRadiusM} m`}
          markerId={markerId}
        />
      </g>

      <g id="labels">
        <text x={center.x} y={rink.y + 16} className={styles.inkLabel} textAnchor="middle">
          Mittellinie
        </text>
        <g className={technical ? styles.layerOn : styles.layerOff}>
          <text
            x={layout.blueLeftX}
            y={rink.y + rink.h - 12}
            className={styles.inkLabel}
            textAnchor="middle"
          >
            Blaue Linie
          </text>
          <text
            x={layout.goalLineLeftX + 18}
            y={center.y}
            className={styles.inkLabel}
            textAnchor="start"
            dominantBaseline="middle"
          >
            Torlinie
          </text>
        </g>
      </g>
    </svg>
  )
}
