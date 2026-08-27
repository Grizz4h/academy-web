import { useCallback, useMemo, useState } from 'react'
import { api } from '../../api'
import { selectLevelProgress } from '../../features/progression'
import { formatPux } from '../../features/rewards/types'
import { useRewards } from '../../features/rewards'
import {
  HARNESS_SCENARIOS,
  STANDARD_JOURNEY_WEEKS,
  evaluateExpectation,
  levelFromPreviewState,
  unitCountFromState,
  type HarnessScenario,
  type PreviewGrantResult,
} from '../../dev/progressionHarness'
import { getLevelFromXp } from '../../features/progression/levelCurve'
import { UiButton } from '../ui'
import styles from './ProgressionHarnessPanel.module.css'

type ScenarioRun = {
  scenario: HarnessScenario
  preview?: PreviewGrantResult
  error?: string
  running?: boolean
}

type JourneyRow = {
  title: string
  grantedXp: number
  grantedPux: number
  totalXp: number
  totalPux: number
  level: number
  units: number
}

export default function ProgressionHarnessPanel() {
  const { rewardState } = useRewards()
  const level = selectLevelProgress(rewardState)
  const unitCount = Object.keys(rewardState.processedUnits || {}).length

  const [runs, setRuns] = useState<Record<string, ScenarioRun>>(() =>
    Object.fromEntries(HARNESS_SCENARIOS.map((scenario) => [scenario.id, { scenario }])),
  )
  const [journeyRows, setJourneyRows] = useState<JourneyRow[]>([])
  const [suiteRunning, setSuiteRunning] = useState(false)
  const [journeyRunning, setJourneyRunning] = useState(false)
  const [globalError, setGlobalError] = useState<string | null>(null)

  const passCount = useMemo(
    () =>
      HARNESS_SCENARIOS.filter((scenario) => {
        const run = runs[scenario.id]
        if (!run?.preview) return false
        return evaluateExpectation(run.preview, scenario.expect).ok
      }).length,
    [runs],
  )

  const journeyEnd = journeyRows.length > 0 ? journeyRows[journeyRows.length - 1] : null

  const previewScenario = useCallback(async (scenario: HarnessScenario) => {
    setRuns((prev) => ({
      ...prev,
      [scenario.id]: { scenario, running: true, error: undefined, preview: undefined },
    }))
    try {
      const preview = await api.previewProgressionGrants({
        activity_events: scenario.activityEvents,
        session_doc: scenario.sessionDoc,
        reward_state_snapshot: scenario.seedState,
        use_account_state: false,
      })
      setRuns((prev) => ({
        ...prev,
        [scenario.id]: { scenario, preview, running: false },
      }))
      return preview
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Preview fehlgeschlagen'
      setRuns((prev) => ({
        ...prev,
        [scenario.id]: { scenario, running: false, error: message },
      }))
      throw err
    }
  }, [])

  const runAllScenarios = useCallback(async () => {
    setGlobalError(null)
    setSuiteRunning(true)
    try {
      for (const scenario of HARNESS_SCENARIOS) {
        await previewScenario(scenario)
      }
    } catch (err) {
      setGlobalError(err instanceof Error ? err.message : 'Suite fehlgeschlagen')
    } finally {
      setSuiteRunning(false)
    }
  }, [previewScenario])

  const runJourney = useCallback(async () => {
    setGlobalError(null)
    setJourneyRunning(true)
    setJourneyRows([])
    try {
      const result = await api.runProgressionJourney()
      let cumXp = 0
      let cumPux = 0
      setJourneyRows(
        result.steps.map((step) => {
          cumXp += Number(step.granted_xp) || 0
          cumPux += Number(step.granted_pux) || 0
          // Prefer server totals; if backend forgot to accumulate xp into state, rebuild from grants.
          const totalXp = Number(step.total_xp) > 0 ? Number(step.total_xp) : cumXp
          const totalPux = Number(step.total_pux) > 0 ? Number(step.total_pux) : cumPux
          const level = Number(step.level) > 1 ? Number(step.level) : getLevelFromXp(totalXp)
          return {
            title: step.title,
            grantedXp: Number(step.granted_xp) || 0,
            grantedPux: Number(step.granted_pux) || 0,
            totalXp,
            totalPux,
            level,
            units: Number(step.units) || 0,
          }
        }),
      )
    } catch (err) {
      setGlobalError(err instanceof Error ? err.message : 'Journey fehlgeschlagen')
    } finally {
      setJourneyRunning(false)
    }
  }, [])

  return (
    <section className={styles.panel}>
      <h2 className="ui-section-title">Progression · Test-Suite</h2>
      <p className={styles.lead}>
        Alles hier ist Dry-Run — <strong>dein Account bleibt unverändert</strong>.
        Oben = echter Stand. Nach „4 Wochen Journey“ erscheint darunter die Simulation (nicht oben).
      </p>

      <p className={styles.sectionLabel}>Echter Account (ändert sich hier nicht)</p>
      <div className={styles.kpiRow}>
        <div className={styles.kpi}>
          <span className={styles.kpiLabel}>Level</span>
          <span className={styles.kpiValue}>L{level.level}</span>
        </div>
        <div className={styles.kpi}>
          <span className={styles.kpiLabel}>XP</span>
          <span className={styles.kpiValue}>{rewardState.xp?.toLocaleString('de-DE') ?? 0}</span>
        </div>
        <div className={styles.kpi}>
          <span className={styles.kpiLabel}>PUX</span>
          <span className={styles.kpiValue}>{formatPux(rewardState.currency?.PUX || 0)}</span>
        </div>
        <div className={styles.kpi}>
          <span className={styles.kpiLabel}>Units</span>
          <span className={styles.kpiValue}>{unitCount}</span>
        </div>
      </div>

      <div className={styles.toolbar}>
        <UiButton type="button" size="sm" variant="primary" disabled={suiteRunning || journeyRunning} onClick={() => void runAllScenarios()}>
          {suiteRunning ? 'Suite läuft…' : 'Alle Szenarien'}
        </UiButton>
        <UiButton type="button" size="sm" variant="secondary" disabled={suiteRunning || journeyRunning} onClick={() => void runJourney()}>
          {journeyRunning ? 'Journey läuft…' : `${STANDARD_JOURNEY_WEEKS} Wochen Journey`}
        </UiButton>
        {passCount > 0 && (
          <span className={styles.pass}>
            Szenarien: {passCount}/{HARNESS_SCENARIOS.length} grün
          </span>
        )}
      </div>

      {globalError && (
        <p className={styles.error}>
          {globalError}
          {!/Backend|404|Journey-API/i.test(globalError) && (
            <> · Tipp: <code>sudo systemctl restart academy-web</code></>
          )}
        </p>
      )}

      {journeyEnd && (
        <div className={styles.simBox}>
          <p className={styles.sectionLabel}>Simulation · 4-Wochen-Journey (nicht dein Account)</p>
          <div className={styles.kpiRow}>
            <div className={styles.kpiSim}>
              <span className={styles.kpiLabel}>Level</span>
              <span className={styles.kpiValue}>L{journeyEnd.level}</span>
            </div>
            <div className={styles.kpiSim}>
              <span className={styles.kpiLabel}>Σ XP</span>
              <span className={styles.kpiValue}>{journeyEnd.totalXp.toLocaleString('de-DE')}</span>
            </div>
            <div className={styles.kpiSim}>
              <span className={styles.kpiLabel}>Σ PUX</span>
              <span className={styles.kpiValue}>{journeyEnd.totalPux}</span>
            </div>
            <div className={styles.kpiSim}>
              <span className={styles.kpiLabel}>Units</span>
              <span className={styles.kpiValue}>{journeyEnd.units}</span>
            </div>
          </div>
          <details className={styles.journeyWrap} open>
            <summary>Schritte ({journeyRows.length})</summary>
            <div style={{ overflow: 'auto', marginTop: '0.55rem' }}>
              <table className={styles.journeyTable}>
                <thead>
                  <tr>
                    <th>Schritt</th>
                    <th>+XP</th>
                    <th>+PUX</th>
                    <th>Σ XP</th>
                    <th>Σ PUX</th>
                    <th>Level</th>
                    <th>Units</th>
                  </tr>
                </thead>
                <tbody>
                  {journeyRows.map((row) => (
                    <tr key={row.title}>
                      <td>{row.title}</td>
                      <td>{row.grantedXp > 0 ? `+${row.grantedXp}` : row.grantedXp}</td>
                      <td>{row.grantedPux > 0 ? `+${row.grantedPux}` : row.grantedPux}</td>
                      <td>{row.totalXp.toLocaleString('de-DE')}</td>
                      <td>{row.totalPux}</td>
                      <td>L{row.level}</td>
                      <td>{row.units}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </div>
      )}

      {!journeyEnd && !journeyRunning && (
        <p className={styles.hint}>
          Nach „4 Wochen Journey“ erscheint hier eine <strong>grüne Simulations-Box</strong> mit Level/XP —
          die Kacheln oben bleiben bei L1 / 0. Das ist Absicht.
        </p>
      )}

      <details className={styles.details}>
        <summary>Progression spürbar testen (Account wirklich leveln)</summary>
        <ol className={styles.feelList}>
          <li>DevLab → Dummy-Session anlegen und abschließen → Kacheln oben steigen.</li>
          <li>Oder echte DEL-Session spielen.</li>
          <li>Spind / PUX-Wallet checken.</li>
        </ol>
      </details>

      <p className={styles.sectionLabel}>Einzel-Szenarien (Regel-Checks, je Sandbox)</p>
      <div className={styles.scenarioList}>
        {HARNESS_SCENARIOS.map((scenario) => {
          const run = runs[scenario.id]
          const check = run?.preview ? evaluateExpectation(run.preview, scenario.expect) : null
          return (
            <article key={scenario.id} className={styles.scenario}>
              <div className={styles.scenarioHead}>
                <div>
                  <h3 className={styles.scenarioTitle}>{scenario.title}</h3>
                  <p className={styles.scenarioBlurb}>{scenario.blurb}</p>
                </div>
                <UiButton
                  type="button"
                  size="sm"
                  variant="ghost"
                  disabled={run?.running || suiteRunning}
                  onClick={() => void previewScenario(scenario)}
                >
                  {run?.running ? '…' : 'Preview'}
                </UiButton>
              </div>

              {run?.error && <p className={styles.error}>{run.error}</p>}

              {run?.preview && (
                <>
                  <div className={styles.resultRow}>
                    <span>+{run.preview.granted_xp} XP · +{run.preview.granted_pux} PUX</span>
                    <span>L{levelFromPreviewState(run.preview.state_after)} · {unitCountFromState(run.preview.state_after)} Units</span>
                    {check && (
                      <span className={check.ok ? styles.pass : styles.fail}>
                        {check.ok ? 'OK' : check.detail}
                      </span>
                    )}
                    {!check && <span className={styles.pending}>—</span>}
                  </div>
                  {run.preview.logs.length > 0 && (
                    <pre className={styles.logs}>{run.preview.logs.join('\n')}</pre>
                  )}
                </>
              )}
            </article>
          )
        })}
      </div>
    </section>
  )
}
