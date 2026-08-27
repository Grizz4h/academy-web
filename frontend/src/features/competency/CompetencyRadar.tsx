import { useId } from 'react'
import { COMPETENCY_AXES, type CompetencyRadarValue } from './types'
import styles from './CompetencyRadar.module.css'

type CompetencyRadarProps = {
  values: readonly CompetencyRadarValue[]
  title?: string
}

const CENTER = 160
const RADIUS = 105

function point(index: number, value: number, radius = RADIUS) {
  const angle = -Math.PI / 2 + (index * Math.PI * 2) / COMPETENCY_AXES.length
  const distance = radius * Math.max(0, Math.min(100, value)) / 100
  return `${CENTER + Math.cos(angle) * distance},${CENTER + Math.sin(angle) * distance}`
}

export function radarPolygon(values: readonly CompetencyRadarValue[]): string {
  const scores = new Map(values.map((item) => [item.competencyId, item.score]))
  return COMPETENCY_AXES.map((axis, index) => point(index, scores.get(axis.id) ?? 0)).join(' ')
}

export default function CompetencyRadar({ values, title = 'Competency Profile Preview' }: CompetencyRadarProps) {
  const gradientId = useId().replace(/:/g, '')
  const scores = new Map(values.map((item) => [item.competencyId, item.score]))

  return (
    <section className={styles.shell} aria-label={title}>
      <div className={styles.heading}>
        <div>
          <span className={styles.kicker}>Prototype · Mock data</span>
          <h2>{title}</h2>
        </div>
        <span className={styles.badge}>V1 / 8 axes</span>
      </div>
      <p className={styles.note}>Visuelle Vorschau – noch nicht aus deinen Leistungen berechnet.</p>

      <div className={styles.layout}>
        <svg className={styles.chart} viewBox="0 0 320 320" role="img" aria-label="Radar chart with eight mock competency scores">
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#62f6d5" />
              <stop offset="1" stopColor="#33a7ff" />
            </linearGradient>
          </defs>
          {[25, 50, 75, 100].map((level) => (
            <polygon key={level} className={styles.grid} points={COMPETENCY_AXES.map((_, index) => point(index, level)).join(' ')} />
          ))}
          {COMPETENCY_AXES.map((axis, index) => (
            <line key={axis.id} className={styles.axis} x1={CENTER} y1={CENTER} x2={point(index, 100).split(',')[0]} y2={point(index, 100).split(',')[1]} />
          ))}
          <polygon className={styles.scoreGlow} points={radarPolygon(values)} />
          <polygon className={styles.score} style={{ stroke: `url(#${gradientId})` }} points={radarPolygon(values)} />
          {COMPETENCY_AXES.map((axis, index) => {
            const [cx, cy] = point(index, scores.get(axis.id) ?? 0).split(',')
            return <circle key={axis.id} className={styles.node} cx={cx} cy={cy} r="3.5" />
          })}
        </svg>

        <div className={styles.stats}>
          {COMPETENCY_AXES.map((axis) => (
            <div className={styles.stat} key={axis.id} data-competency-axis={axis.id}>
              <span>{axis.label}</span>
              <strong>{Math.round(scores.get(axis.id) ?? 0)}</strong>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
