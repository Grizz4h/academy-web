import type { RinkSpec } from './rinkSpec'

/** viewBox units per meter. Geometry stays in meters; SVG only scales. */
export const SVG_METER = 10

export type Point = { x: number; y: number }

export type RinkLayout = {
  viewBox: string
  rink: { x: number; y: number; w: number; h: number; r: number }
  center: Point
  goalLineLeftX: number
  goalLineRightX: number
  blueLeftX: number
  blueRightX: number
  circleR: number
  leftGoal: { x: number; y: number; w: number; h: number }
  rightGoal: { x: number; y: number; w: number; h: number }
  centerFaceoff: Point
  endZoneFaceoffs: Point[]
  outlinePath: string
  pad: number
}

export function roundedRectPath(x: number, y: number, w: number, h: number, r: number): string {
  const radius = Math.min(r, w / 2, h / 2)
  return [
    `M ${x + radius} ${y}`,
    `L ${x + w - radius} ${y}`,
    `A ${radius} ${radius} 0 0 1 ${x + w} ${y + radius}`,
    `L ${x + w} ${y + h - radius}`,
    `A ${radius} ${radius} 0 0 1 ${x + w - radius} ${y + h}`,
    `L ${x + radius} ${y + h}`,
    `A ${radius} ${radius} 0 0 1 ${x} ${y + h - radius}`,
    `L ${x} ${y + radius}`,
    `A ${radius} ${radius} 0 0 1 ${x + radius} ${y}`,
    'Z',
  ].join(' ')
}

export function layoutRink(spec: RinkSpec, padM = 7): RinkLayout {
  const pad = padM * SVG_METER
  const w = spec.lengthM * SVG_METER
  const h = spec.widthM * SVG_METER
  const r = spec.cornerRadiusM * SVG_METER
  const x = pad
  const y = pad
  const cx = x + w / 2
  const cy = y + h / 2
  const m = SVG_METER

  const goalLineLeftX = x + spec.goalLineOffsetM * m
  const goalLineRightX = x + w - spec.goalLineOffsetM * m
  const blueLeftX = cx - spec.blueLineOffsetFromCenterM * m
  const blueRightX = cx + spec.blueLineOffsetFromCenterM * m
  const circleR = (spec.faceoffCircleDiameterM / 2) * m

  const goalH = spec.goalWidthM * m
  const goalW = spec.goalDepthM * m
  const goalY = cy - goalH / 2

  const spotY = spec.faceoffSpotOffsetFromLongAxisM * m
  const leftSpotX = goalLineLeftX + spec.endZoneFaceoffOffsetFromGoalLineM * m
  const rightSpotX = goalLineRightX - spec.endZoneFaceoffOffsetFromGoalLineM * m

  const viewW = w + pad * 2
  const viewH = h + pad * 2

  return {
    viewBox: `0 0 ${viewW} ${viewH}`,
    rink: { x, y, w, h, r },
    center: { x: cx, y: cy },
    goalLineLeftX,
    goalLineRightX,
    blueLeftX,
    blueRightX,
    circleR,
    leftGoal: { x: goalLineLeftX - goalW, y: goalY, w: goalW, h: goalH },
    rightGoal: { x: goalLineRightX, y: goalY, w: goalW, h: goalH },
    centerFaceoff: { x: cx, y: cy },
    endZoneFaceoffs: [
      { x: leftSpotX, y: cy - spotY },
      { x: leftSpotX, y: cy + spotY },
      { x: rightSpotX, y: cy - spotY },
      { x: rightSpotX, y: cy + spotY },
    ],
    outlinePath: roundedRectPath(x, y, w, h, r),
    pad,
  }
}
