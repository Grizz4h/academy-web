import type { DrillAttempt } from './drillActivity'
import './DrillActivityHeatmap.css'

const PREVIEW_ROWS = 6
const MS_PER_DAY = 24 * 60 * 60 * 1000

type DrillActivityHeatmapProps = {
  attempts: DrillAttempt[]
  weeks?: number
}

function localDateKey(date: Date): string {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function addDays(base: Date, days: number): Date {
  const next = new Date(base)
  next.setDate(next.getDate() + days)
  return next
}

function startOfWeekMonday(date: Date): Date {
  const dayStart = startOfLocalDay(date)
  const diff = (dayStart.getDay() + 6) % 7
  return addDays(dayStart, -diff)
}

function isoWeekNumber(date: Date): number {
  const local = startOfLocalDay(date)
  const day = (local.getDay() + 6) % 7
  const thursday = addDays(local, 3 - day)
  const firstThursday = new Date(thursday.getFullYear(), 0, 4)
  const firstThursdayDay = (firstThursday.getDay() + 6) % 7
  const weekOneThursday = addDays(firstThursday, 3 - firstThursdayDay)
  return 1 + Math.round((thursday.getTime() - weekOneThursday.getTime()) / (7 * MS_PER_DAY))
}

function weekIntensity(count: number): number {
  if (count <= 0) return 0
  if (count === 1) return 1
  if (count === 2) return 2
  if (count <= 4) return 3
  return 4
}

function buildWeekRange(weeks: number) {
  const currentWeekStart = startOfWeekMonday(new Date())
  return Array.from({ length: weeks }, (_, index) => {
    const start = addDays(currentWeekStart, (index - (weeks - 1)) * 7)
    return {
      key: localDateKey(start),
      isoWeek: isoWeekNumber(start),
      label: `KW ${isoWeekNumber(start)}`,
    }
  })
}

function DrillRows({
  rows,
  weekRange,
}: {
  rows: Array<{
    drillId: string
    drillName: string
    moduleId?: string
    trackTitle?: string
    drillNumber?: number
    weekMap: Map<string, number>
    totalAttempts: number
  }>
  weekRange: ReturnType<typeof buildWeekRange>
}) {
  return (
    <>
      {rows.map(({ drillId, drillName, moduleId, trackTitle, drillNumber, weekMap, totalAttempts }) => (
        <div key={drillId} className="drill-row">
          <div className="drill-info">
            <div className="drill-primary">
              <span className="drill-name" title={drillName}>{drillName}</span>
              <span className="drill-total">{totalAttempts}×</span>
            </div>
            {(moduleId || trackTitle || drillNumber !== undefined) && (
              <div className="drill-meta">
                {moduleId && <span className="drill-module">{moduleId}</span>}
                {trackTitle && <span className="drill-track">→ {trackTitle}</span>}
                {drillNumber !== undefined && <span className="drill-number">#{drillNumber}</span>}
              </div>
            )}
          </div>

          <div className="activity-grid" style={{ gridTemplateColumns: `repeat(${weekRange.length}, minmax(0, 1fr))` }}>
            {weekRange.map((week) => {
              const count = weekMap.get(week.key) || 0
              const intensity = weekIntensity(count)
              return (
                <div
                  key={week.key}
                  className={`activity-cell intensity-${intensity}`}
                  title={`${week.label}: ${count} ${count === 1 ? 'Durchlauf' : 'Durchläufe'}`}
                  data-count={count}
                />
              )
            })}
          </div>
        </div>
      ))}
    </>
  )
}

export function DrillActivityHeatmap({
  attempts,
  weeks = 8,
}: DrillActivityHeatmapProps) {
  const weekRange = buildWeekRange(weeks)
  const weekKeys = new Set(weekRange.map((week) => week.key))

  const activityMap = new Map<string, Map<string, number>>()
  const drillMeta = new Map<string, DrillAttempt>()

  attempts.forEach((attempt) => {
    const parsed = new Date(attempt.timestamp)
    if (Number.isNaN(parsed.getTime())) return
    const key = localDateKey(startOfWeekMonday(parsed))
    if (!weekKeys.has(key)) return

    if (!activityMap.has(attempt.drillId)) {
      activityMap.set(attempt.drillId, new Map())
    }
    const weekMap = activityMap.get(attempt.drillId)!
    weekMap.set(key, (weekMap.get(key) || 0) + 1)
    drillMeta.set(attempt.drillId, attempt)
  })

  const drillStats = Array.from(activityMap.entries()).map(([drillId, weekMap]) => {
    const drill = drillMeta.get(drillId)
    const totalAttempts = Array.from(weekMap.values()).reduce((sum, count) => sum + count, 0)
    return {
      drillId,
      drillName: drill?.drillName || 'Unknown Drill',
      moduleId: drill?.moduleId,
      trackTitle: drill?.trackTitle,
      drillNumber: drill?.drillNumber,
      weekMap,
      totalAttempts,
    }
  }).sort((a, b) => b.totalAttempts - a.totalAttempts)

  const preview = drillStats.slice(0, PREVIEW_ROWS)
  const extra = drillStats.slice(PREVIEW_ROWS)
  const totalAttempts = drillStats.reduce((sum, drill) => sum + drill.totalAttempts, 0)

  if (drillStats.length === 0) {
    return (
      <div className="drill-activity-heatmap">
        <h3>Lernfortschritt nach Drill</h3>
        <p className="no-data">Noch keine Drill-Daten in den letzten {weeks} Wochen.</p>
      </div>
    )
  }

  return (
    <div className="drill-activity-heatmap">
      <h3>Lernfortschritt nach Drill</h3>
      <p className="heatmap-subtitle">
        Letzte {weeks} Wochen · {totalAttempts} Durchläufe
      </p>

      <div className="heatmap-axis" aria-hidden="true">
        <div className="drill-info" />
        <div className="activity-grid" style={{ gridTemplateColumns: `repeat(${weekRange.length}, minmax(0, 1fr))` }}>
          {weekRange.map((week) => (
            <span key={week.key} className="week-label">{week.isoWeek}</span>
          ))}
        </div>
      </div>

      <div className="heatmap-scroll">
        <DrillRows rows={preview} weekRange={weekRange} />
      </div>

      {extra.length > 0 ? (
        <details className="ui-more ui-more--flush heatmap-more">
          <summary className="ui-more__summary">
            <span>Weitere Drills · {extra.length}</span>
            <span className="ui-more__chevron" aria-hidden="true" />
          </summary>
          <div className="ui-more__body">
            <DrillRows rows={extra} weekRange={weekRange} />
          </div>
        </details>
      ) : null}

      <div className="heatmap-legend" aria-hidden="true">
        <span>pro Woche</span>
        {[0, 1, 2, 3, 4].map((level) => (
          <div key={level} className={`legend-cell intensity-${level}`} />
        ))}
      </div>
    </div>
  )
}
