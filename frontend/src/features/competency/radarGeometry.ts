import { nodePlotValue, radarPlotValue } from './competencyLogic'
import type { CompetencyItem } from './types'

export const RADAR_CENTER = 160
export const RADAR_RADIUS = 105

export function radarPoint(index: number, total: number, value: number, radius = RADAR_RADIUS): string {
  const angle = -Math.PI / 2 + (index * Math.PI * 2) / total
  const distance = (radius * Math.max(0, Math.min(100, value))) / 100
  return `${RADAR_CENTER + Math.cos(angle) * distance},${RADAR_CENTER + Math.sin(angle) * distance}`
}

export function radarPolygon(competencies: readonly CompetencyItem[]): string {
  const total = competencies.length
  if (total === 0) return ''
  return competencies
    .map((item, index) => radarPoint(index, total, radarPlotValue(item)))
    .join(' ')
}

export function nodePoint(
  competencies: readonly CompetencyItem[],
  index: number,
): { x: number; y: number } | null {
  const total = competencies.length
  const item = competencies[index]
  if (!item) return null
  const value = nodePlotValue(item)
  if (value == null) return null
  const [x, y] = radarPoint(index, total, value).split(',').map(Number)
  return { x, y }
}
