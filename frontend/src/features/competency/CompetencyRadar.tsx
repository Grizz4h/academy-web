import { useCallback, useId, useState } from 'react'
import { CompetencyScoutCard } from './CompetencyScoutCard'
import {
  accessibilitySummary,
  canShowScorePolygon,
  hasAnyRated,
  isFullyUnrated,
  meanRatedScore,
  nodeOpacity,
  profileProgressLabel,
  profileStoryLine,
  ratedCount,
} from './competencyLogic'
import { RADAR_CENTER, RADAR_RADIUS, nodePoint, radarPoint, radarPolygon } from './radarGeometry'
import type { CompetencyItem } from './types'
import styles from './CompetencyRadar.module.css'

/** Capability band thresholds as radar rings (plus outer rim). */
const BAND_RINGS = [20, 40, 60, 80, 100] as const

type CompetencyRadarProps = {
  competencies: readonly CompetencyItem[]
  title?: string
  /** Dev-only mock preview — not used in Account production flow */
  preview?: boolean
}

export { radarPolygon } from './radarGeometry'

export default function CompetencyRadar({
  competencies,
  title = 'Kompetenzprofil',
  preview = false,
}: CompetencyRadarProps) {
  const gradientId = useId().replace(/:/g, '')
  const glowId = useId().replace(/:/g, '')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const total = competencies.length
  const fullyUnrated = isFullyUnrated(competencies)
  const anyRated = hasAnyRated(competencies)
  const rated = ratedCount(competencies)
  const showPolygon = canShowScorePolygon(competencies)
  const progress = profileProgressLabel(competencies)
  const story = profileStoryLine(competencies)
  const centerScore = showPolygon ? meanRatedScore(competencies) : null
  const hasSelection = Boolean(selectedId)

  const highlight = useCallback((id: string) => {
    setSelectedId(id)
  }, [])

  const toggleSelected = (id: string) => {
    setSelectedId((prev) => (prev === id ? null : id))
  }

  return (
    <section className={styles.shell} aria-label={title} data-complete={showPolygon ? 'true' : 'false'}>
      <div className={styles.ambient} aria-hidden="true" />
      <ul className={styles.a11yList}>
        {competencies.map((item) => (
          <li key={item.competencyId}>{accessibilitySummary(item)}</li>
        ))}
      </ul>

      <div className={styles.heading}>
        <div>
          {preview ? <span className={styles.kicker}>Dev · Mock preview</span> : null}
          <h2 className={styles.title}>{title}</h2>
          {story ? <p className={styles.story}>{story}</p> : null}
        </div>
        <span className={`${styles.badge} ${progress.complete ? styles.badgeComplete : ''}`}>
          {progress.short}
        </span>
      </div>

      {fullyUnrated ? (
        <p className={styles.emptyLead}>
          Dein Kompetenzprofil entsteht mit deinen Lernaktivitäten. Noch liegen nicht genug
          Beobachtungen für eine Bewertung vor.
        </p>
      ) : showPolygon ? (
        <p className={styles.note}>
          {rated}/{total} Kompetenzen bewertet — Score zeigt beobachtetes Niveau, nicht XP oder
          Abschluss.
        </p>
      ) : (
        <p className={styles.emptyLead}>
          {rated}/{total} Achsen bewertet. Das Spinnennetz erscheint, sobald alle acht Kompetenzen
          Evidenz haben — unbewertete Achsen werden nicht als 0 dargestellt.
        </p>
      )}

      <div className={styles.layout}>
        <div className={styles.chartWrap}>
          <svg
            className={styles.chart}
            viewBox="0 0 320 320"
            role="img"
            aria-hidden={fullyUnrated ? undefined : true}
            aria-label={
              fullyUnrated
                ? 'Kompetenzradar ohne bewertete Achsen — acht Labels sichtbar, noch keine Evidenz'
                : undefined
            }
          >
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#62f6d5" />
                <stop offset="1" stopColor="#33a7ff" />
              </linearGradient>
              <radialGradient id={glowId} cx="50%" cy="50%" r="50%">
                <stop offset="0" stopColor="rgba(98, 246, 213, 0.35)" />
                <stop offset="0.55" stopColor="rgba(45, 212, 191, 0.12)" />
                <stop offset="1" stopColor="rgba(45, 212, 191, 0)" />
              </radialGradient>
            </defs>

            {showPolygon ? (
              <circle
                className={styles.centerGlow}
                cx={RADAR_CENTER}
                cy={RADAR_CENTER}
                r={RADAR_RADIUS * 0.42}
                fill={`url(#${glowId})`}
              />
            ) : null}

            {BAND_RINGS.map((level) => (
              <polygon
                key={level}
                className={`${styles.grid} ${level === 100 ? styles.gridOuter : styles.gridBand}`}
                points={competencies.map((_, index) => radarPoint(index, total, level)).join(' ')}
              />
            ))}

            {competencies.map((axis, index) => {
              const [x2, y2] = radarPoint(index, total, 100).split(',')
              const isActive = selectedId === axis.competencyId
              return (
                <line
                  key={axis.competencyId}
                  className={`${styles.axis} ${isActive ? styles.axisActive : ''} ${
                    hasSelection && !isActive ? styles.axisDim : ''
                  }`}
                  x1={RADAR_CENTER}
                  y1={RADAR_CENTER}
                  x2={x2}
                  y2={y2}
                />
              )
            })}

            {showPolygon ? (
              <>
                <polygon className={styles.scoreGlow} points={radarPolygon(competencies)} />
                <polygon
                  className={styles.score}
                  style={{ stroke: `url(#${gradientId})` }}
                  points={radarPolygon(competencies)}
                />
              </>
            ) : null}

            {competencies.map((item, index) => {
              const point = nodePoint(competencies, index)
              if (!point) return null
              const isActive = selectedId === item.competencyId
              return (
                <circle
                  key={item.competencyId}
                  className={`${styles.node} ${isActive ? styles.nodeActive : ''} ${
                    hasSelection && !isActive ? styles.nodeDim : ''
                  }`}
                  cx={point.x}
                  cy={point.y}
                  r={isActive ? 5.5 : 3.5}
                  opacity={nodeOpacity(item)}
                />
              )
            })}

            {showPolygon && centerScore != null ? (
              <g className={styles.centerGlyph}>
                <circle
                  className={styles.centerRing}
                  cx={RADAR_CENTER}
                  cy={RADAR_CENTER}
                  r={28}
                />
                <text
                  className={styles.centerValue}
                  x={RADAR_CENTER}
                  y={RADAR_CENTER - 2}
                  textAnchor="middle"
                  dominantBaseline="middle"
                >
                  {Math.round(centerScore)}
                </text>
                <text
                  className={styles.centerCaption}
                  x={RADAR_CENTER}
                  y={RADAR_CENTER + 14}
                  textAnchor="middle"
                >
                  Ø Score
                </text>
              </g>
            ) : (
              <circle
                className={styles.centerEmpty}
                cx={RADAR_CENTER}
                cy={RADAR_CENTER}
                r={6}
              />
            )}
          </svg>

          <div className={styles.axisLabels}>
            {competencies.map((item, index) => {
              const angle = -Math.PI / 2 + (index * Math.PI * 2) / total
              const labelRadius = RADAR_RADIUS + 22
              const x = RADAR_CENTER + Math.cos(angle) * labelRadius
              const y = RADAR_CENTER + Math.sin(angle) * labelRadius
              const isSelected = selectedId === item.competencyId
              return (
                <button
                  key={item.competencyId}
                  type="button"
                  className={`${styles.axisLabel} ${isSelected ? styles.axisLabelSelected : ''} ${
                    hasSelection && !isSelected ? styles.axisLabelDim : ''
                  }`}
                  style={{ left: `${(x / 320) * 100}%`, top: `${(y / 320) * 100}%` }}
                  onClick={() => toggleSelected(item.competencyId)}
                  aria-pressed={isSelected}
                >
                  {item.label}
                </button>
              )
            })}
          </div>
        </div>

        <div className={styles.side}>
          <div className={styles.stats} role="list">
            {competencies.map((item, index) => (
              <div key={item.competencyId} role="listitem">
                <CompetencyScoutCard
                  item={item}
                  selected={selectedId === item.competencyId}
                  onHighlight={highlight}
                  align={index % 2 === 0 ? 'left' : 'right'}
                />
              </div>
            ))}
          </div>
          {anyRated ? (
            <p className={styles.detailHint}>Kachel antippen für Score, Confidence und Evidenzbreite.</p>
          ) : null}
        </div>
      </div>
    </section>
  )
}
