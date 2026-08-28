import { useId, useState } from 'react'
import { capabilityLabelForItem, formatRatioPercent, hasAnyRated, isFullyUnrated, ratedCount, accessibilitySummary, nodeOpacity } from './competencyLogic'
import { RADAR_CENTER, RADAR_RADIUS, nodePoint, radarPoint, radarPolygon } from './radarGeometry'
import type { CompetencyItem } from './types'
import styles from './CompetencyRadar.module.css'

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
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const total = competencies.length
  const fullyUnrated = isFullyUnrated(competencies)
  const anyRated = hasAnyRated(competencies)
  const rated = ratedCount(competencies)
  const selected = competencies.find((item) => item.competencyId === selectedId) ?? null

  return (
    <section className={styles.shell} aria-label={title}>
      <ul className={styles.a11yList}>
        {competencies.map((item) => (
          <li key={item.competencyId}>{accessibilitySummary(item)}</li>
        ))}
      </ul>

      <div className={styles.heading}>
        <div>
          {preview ? <span className={styles.kicker}>Dev · Mock preview</span> : null}
          <h2 className={styles.title}>{title}</h2>
        </div>
        <span className={styles.badge}>8 Achsen</span>
      </div>

      {fullyUnrated ? (
        <p className={styles.emptyLead}>
          Dein Kompetenzprofil entsteht mit deinen Analysen. Noch nicht genügend Evidenz vorhanden.
        </p>
      ) : (
        <p className={styles.note}>
          {rated}/{total} Kompetenzen bewertet — Score zeigt beobachtetes Niveau, nicht XP oder Abschluss.
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
            </defs>
            {[25, 50, 75, 100].map((level) => (
              <polygon
                key={level}
                className={styles.grid}
                points={competencies.map((_, index) => radarPoint(index, total, level)).join(' ')}
              />
            ))}
            {competencies.map((axis, index) => {
              const [x2, y2] = radarPoint(index, total, 100).split(',')
              return (
                <line
                  key={axis.competencyId}
                  className={styles.axis}
                  x1={RADAR_CENTER}
                  y1={RADAR_CENTER}
                  x2={x2}
                  y2={y2}
                />
              )
            })}
            {anyRated ? (
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
              const { x, y } = nodePoint(competencies, index)
              const isUnrated = item.status !== 'rated'
              return (
                <circle
                  key={item.competencyId}
                  className={isUnrated ? styles.nodeUnrated : styles.node}
                  cx={x}
                  cy={y}
                  r={isUnrated ? 3 : 3.5}
                  opacity={nodeOpacity(item)}
                />
              )
            })}
          </svg>
          <div className={styles.axisLabels} aria-hidden="true">
            {competencies.map((item, index) => {
              const angle = -Math.PI / 2 + (index * Math.PI * 2) / total
              const labelRadius = RADAR_RADIUS + 22
              const x = RADAR_CENTER + Math.cos(angle) * labelRadius
              const y = RADAR_CENTER + Math.sin(angle) * labelRadius
              return (
                <span
                  key={item.competencyId}
                  className={styles.axisLabel}
                  style={{ left: `${(x / 320) * 100}%`, top: `${(y / 320) * 100}%` }}
                >
                  {item.label}
                </span>
              )
            })}
          </div>
        </div>

        <div className={styles.side}>
          <div className={styles.stats} role="list">
            {competencies.map((item) => {
              const isSelected = selectedId === item.competencyId
              const band = capabilityLabelForItem(item)
              return (
                <button
                  key={item.competencyId}
                  type="button"
                  className={`${styles.stat} ${isSelected ? styles.statSelected : ''}`}
                  data-competency-axis={item.competencyId}
                  data-status={item.status}
                  onClick={() => setSelectedId(isSelected ? null : item.competencyId)}
                  aria-pressed={isSelected}
                >
                  <span className={styles.statLabel}>{item.label}</span>
                  <span className={styles.statValue}>
                    {item.status === 'rated' ? (
                      <>
                        <strong>{Math.round(item.score)}</strong>
                        {band ? <span className={styles.statBand}>{band}</span> : null}
                      </>
                    ) : (
                      <em className={styles.unrated}>Noch nicht bewertet</em>
                    )}
                  </span>
                </button>
              )
            })}
          </div>

          {selected ? (
            <div className={styles.detail} aria-live="polite">
              <h3 className={styles.detailTitle}>{selected.label}</h3>
              {selected.status === 'rated' ? (
                <dl className={styles.detailGrid}>
                  <div><dt>Score</dt><dd>{Math.round(selected.score)}</dd></div>
                  <div><dt>Confidence</dt><dd>{formatRatioPercent(selected.confidence)}</dd></div>
                  <div><dt>Breadth</dt><dd>{formatRatioPercent(selected.breadth)}</dd></div>
                  <div><dt>Evidence</dt><dd>{selected.evidenceCount}</dd></div>
                  <div><dt>Highest Evidence Level</dt><dd>{selected.highestEvidenceLevel}</dd></div>
                  {capabilityLabelForItem(selected) ? (
                    <div><dt>Capability Band</dt><dd>{capabilityLabelForItem(selected)}</dd></div>
                  ) : null}
                </dl>
              ) : (
                <p className={styles.detailMuted}>
                  Für diese Kompetenz liegt noch keine auswertbare Evidenz vor.
                </p>
              )}
              {selected.status === 'rated' ? (
                <p className={styles.detailHint}>
                  Confidence: Sicherheit der Schätzung · Breadth: Vielfalt der Evidenzbasis (nicht Fortschritt zu 100%).
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  )
}
