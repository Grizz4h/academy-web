import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Card from '../components/Card'
import { UiChip, UiPill } from '../components/ui'
import {
  buildProgressionCoverageReport,
  coverageStatusLabel,
  PROGRESSION_LANE_LABELS,
  type ProgressionCoverageRow,
  type ProgressionLaneId,
  type RewardCoverageStatus,
} from '../features/progression/dev/progressionCoverage'
import { contentRegistry } from '../content/registry'
import styles from './DevProgression.module.css'

const LANE_FILTERS: Array<ProgressionLaneId | 'watchlist'> = [
  'watchlist',
  'grundprogression',
  'achievements',
  'daily',
  'weekly',
  'matchday',
  'challenge_other',
  'levels',
  'mastery',
  'collections',
  'cosmetic_pool',
]

const STATUS_FILTERS: Array<RewardCoverageStatus | 'all'> = [
  'all',
  'has_cosmetic',
  'currency_only',
  'empty',
]

function StatusPill({ status }: { status: RewardCoverageStatus }) {
  return (
    <span className={`${styles.statusPill} ${styles[`status_${status}`]}`}>
      {coverageStatusLabel(status)}
    </span>
  )
}

function RewardMeta({ row }: { row: ProgressionCoverageRow }) {
  const parts: string[] = []
  if (row.rewards.xp) parts.push(`${row.rewards.xp} XP`)
  if (row.rewards.pux) parts.push(`${row.rewards.pux} PUX`)
  if (row.rewards.cosmeticLabels.length) {
    parts.push(row.rewards.cosmeticLabels.join(', '))
  }
  return <span className={styles.rewardMeta}>{parts.join(' · ') || '—'}</span>
}

function groupRows(rows: ProgressionCoverageRow[]): Array<{ group: string; rows: ProgressionCoverageRow[] }> {
  const map = new Map<string, ProgressionCoverageRow[]>()
  for (const row of rows) {
    const list = map.get(row.group) || []
    list.push(row)
    map.set(row.group, list)
  }
  return Array.from(map.entries()).map(([group, groupRows]) => ({ group, rows: groupRows }))
}

export default function DevProgression() {
  const report = useMemo(() => buildProgressionCoverageReport(contentRegistry.challenges), [])
  const [lane, setLane] = useState<ProgressionLaneId | 'watchlist'>('watchlist')
  const [status, setStatus] = useState<RewardCoverageStatus | 'all'>('all')

  const activeRows = useMemo(() => {
    let rows: ProgressionCoverageRow[]
    if (lane === 'watchlist') {
      rows = [
        ...report.achievementsMissingCosmetic,
        ...report.challengesMissingCosmetic,
      ]
    } else {
      rows = report.lanes.find((item) => item.lane === lane)?.rows || []
    }
    if (status !== 'all') rows = rows.filter((row) => row.rewards.status === status)
    return rows
  }, [lane, report, status])

  const grouped = useMemo(() => groupRows(activeRows), [activeRows])
  const k = report.kpis

  return (
    <div className={`ui-page-shell ${styles.page}`}>
      <header className="ui-page-header">
        <h1 className="ui-page-title">Progression Cockpit</h1>
        <p className="ui-page-lead">
          Belohnungs-Coverage live aus Katalog/Content. Visueller Überblick beim Erweitern — Achievements ohne Cosmetic,
          Daily/Weekly/Matchday, Grundprogression, Vorrat.{' '}
          <Link to="/dev">Dev-Cockpit</Link>
          {' · '}
          <Link to="/dev/cosmetics">Cosmetics / Pool</Link>
        </p>
      </header>

      <section className={styles.kpiStrip} aria-label="Coverage KPIs">
        <div className={styles.kpi}>
          <strong>{k.achievementsTotal - k.achievementsWithCosmetic}</strong>
          <span>Achievements ohne Cosmetic</span>
        </div>
        <div className={styles.kpi}>
          <strong>{k.achievementsWithCosmetic}/{k.achievementsTotal}</strong>
          <span>Achievements mit Cosmetic</span>
        </div>
        <div className={styles.kpi}>
          <strong>{k.challengesWithCosmetic}/{k.challengesTotal}</strong>
          <span>Challenges mit Cosmetic</span>
        </div>
        <div className={styles.kpi}>
          <strong>{k.cosmeticsPool}</strong>
          <span>Cosmetic-Vorrat</span>
        </div>
        <div className={styles.kpi}>
          <strong>{k.cosmeticsAssigned}/{k.cosmeticsTotal}</strong>
          <span>Cosmetics zugewiesen</span>
        </div>
      </section>

      <Card surface="section">
        <h2 className="ui-section-title">Lanes</h2>
        <div className={styles.laneGrid}>
          {report.lanes.filter((item) => item.lane !== 'cosmetic_pool').map((item) => {
            const coverage = item.total === 0 ? 0 : Math.round((item.withCosmetic / item.total) * 100)
            return (
              <button
                key={item.lane}
                type="button"
                className={`${styles.laneCard} ${lane === item.lane ? styles.laneCardActive : ''}`}
                onClick={() => setLane(item.lane)}
              >
                <div className={styles.laneHead}>
                  <strong>{item.label}</strong>
                  <UiPill>{coverage}%</UiPill>
                </div>
                <div className={styles.laneMeta}>
                  <span className={styles.ok}>{item.withCosmetic} Cosmetic</span>
                  <span className={styles.warn}>{item.currencyOnly} nur Währung</span>
                  {item.empty > 0 && <span className={styles.bad}>{item.empty} leer</span>}
                </div>
                <div className={styles.barTrack} aria-hidden="true">
                  <div className={styles.barFill} style={{ width: `${coverage}%` }} />
                </div>
              </button>
            )
          })}
          <button
            type="button"
            className={`${styles.laneCard} ${styles.laneCardPool} ${lane === 'cosmetic_pool' ? styles.laneCardActive : ''}`}
            onClick={() => setLane('cosmetic_pool')}
          >
            <div className={styles.laneHead}>
              <strong>Cosmetic-Vorrat</strong>
              <UiPill>{k.cosmeticsPool}</UiPill>
            </div>
            <div className={styles.laneMeta}>
              <span>Parked für spätere Achievements / Shop</span>
            </div>
          </button>
        </div>
      </Card>

      <Card surface="primary">
        <div className={styles.panelHead}>
          <h2 className="ui-section-title">
            {lane === 'watchlist' ? 'Watchlist · ohne Cosmetic' : PROGRESSION_LANE_LABELS[lane]}
          </h2>
          <span className={styles.count}>{activeRows.length} Einträge</span>
        </div>

        <div className={styles.filters}>
          {LANE_FILTERS.map((id) => (
            <UiChip key={id} active={lane === id} onClick={() => setLane(id)}>
              {id === 'watchlist' ? 'Watchlist' : PROGRESSION_LANE_LABELS[id]}
            </UiChip>
          ))}
        </div>
        <div className={styles.filters}>
          {STATUS_FILTERS.map((id) => (
            <UiChip key={id} active={status === id} onClick={() => setStatus(id)} size="sm">
              {id === 'all' ? 'Alle Status' : coverageStatusLabel(id)}
            </UiChip>
          ))}
        </div>

        {grouped.length === 0 && (
          <p className={styles.empty}>Keine Einträge für diesen Filter — Coverage sieht hier gut aus.</p>
        )}

        {grouped.map(({ group, rows }) => (
          <section key={group} className={styles.group}>
            <h3 className={styles.groupTitle}>{group}</h3>
            <ul className={styles.rowList}>
              {rows.map((row) => (
                <li key={`${row.lane}:${row.id}`} className={styles.row} data-status={row.rewards.status}>
                  <div className={styles.rowMain}>
                    <div className={styles.rowTop}>
                      <code className={styles.rowId}>{row.id}</code>
                      {lane === 'watchlist' && (
                        <span className={styles.laneTag}>{PROGRESSION_LANE_LABELS[row.lane]}</span>
                      )}
                    </div>
                    <strong>{row.title}</strong>
                    {row.subtitle && <span className={styles.subtitle}>{row.subtitle}</span>}
                  </div>
                  <div className={styles.rowSide}>
                    <StatusPill status={row.rewards.status} />
                    <RewardMeta row={row} />
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </Card>
    </div>
  )
}
