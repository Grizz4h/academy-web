import { useMemo, useState } from 'react'
import {
  EARLY_SLOT_UNITS,
  PERSONA_LABELS,
  REFERENCE_LEVELS,
  SIM_MODE_LABELS,
  formatWeeksDuration,
  phase2Level5Week,
  runPersonaSimSuite,
  type SimMode,
} from '../../dev/progressionPersonaSim'
import styles from './ProgressionPersonaSimPanel.module.css'

const WEEK_OPTIONS = [26, 52, 104] as const
const PHASE2_WARN_WEEKS = 4

export default function ProgressionPersonaSimPanel() {
  const [weeks, setWeeks] = useState<number>(52)
  const [mode, setMode] = useState<SimMode>('isolated_base')

  const suite = useMemo(() => runPersonaSimSuite(mode, weeks), [mode, weeks])
  const standardResult = suite.results.find((entry) => entry.persona === 'standard')

  return (
    <section className={styles.panel}>
      <h2 className="ui-section-title">Progression · Persona-Simulation</h2>
      <p className={styles.lead}>
        Phase-2-Kalibrierung — zwei Läufe ohne Server-Writes. Isoliert = nur Base-Unit (100 XP).
        Realistisch = Track 0, First-Drill, Full-Game alle 3 Units, Track-Abschluss alle 20 Units.
      </p>

      <div className={styles.controls}>
        <label className={styles.field}>
          Modus
          <select className="appSelect" value={mode} onChange={(e) => setMode(e.target.value as SimMode)}>
            {(Object.keys(SIM_MODE_LABELS) as SimMode[]).map((key) => (
              <option key={key} value={key}>
                {SIM_MODE_LABELS[key]}
              </option>
            ))}
          </select>
        </label>
        <label className={styles.field}>
          Horizont
          <select className="appSelect" value={weeks} onChange={(e) => setWeeks(Number(e.target.value))}>
            {WEEK_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option} Wochen
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Persona</th>
              <th>Level {weeks} Wo.</th>
              <th>Units</th>
              <th>XP</th>
              <th>PUX</th>
              {REFERENCE_LEVELS.map((level) => (
                <th key={level}>L{level}</th>
              ))}
              {EARLY_SLOT_UNITS.map((slot) => (
                <th key={slot}>Slot {slot}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {suite.results.map((result) => {
              const last = result.weeks[result.weeks.length - 1]
              const level5Week = phase2Level5Week(result)
              const level5Class =
                result.persona === 'standard' &&
                mode === 'isolated_base' &&
                level5Week != null &&
                level5Week > PHASE2_WARN_WEEKS
                  ? styles.warn
                  : undefined
              return (
                <tr key={result.persona}>
                  <td>{PERSONA_LABELS[result.persona]}</td>
                  <td>{last?.level ?? '—'}</td>
                  <td>{last?.units ?? '—'}</td>
                  <td>{last?.xp?.toLocaleString('de-DE') ?? '—'}</td>
                  <td>{last?.pux?.toLocaleString('de-DE') ?? '—'}</td>
                  {REFERENCE_LEVELS.map((level) => (
                    <td key={level} className={level === 5 ? level5Class : undefined}>
                      {formatWeeksDuration(result.milestoneWeeks[`level_${level}`])}
                    </td>
                  ))}
                  {EARLY_SLOT_UNITS.map((slot) => (
                    <td key={slot}>{formatWeeksDuration(result.milestoneWeeks[`unit_${slot}`])}</td>
                  ))}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <p className={styles.hint}>
        Referenz isoliert / Standard: Level 5 ≈ 12 Units ≈ 3 Wochen.
        {mode === 'isolated_base' && standardResult ? (
          <>
            {' '}
            Aktuell Standard L5 in{' '}
            <strong>{formatWeeksDuration(phase2Level5Week(standardResult))}</strong>.
          </>
        ) : null}
      </p>

      <details className={styles.details}>
        <summary>Wochenverlauf (Standard)</summary>
        <div className={styles.sparkWrap}>
          {(standardResult?.weeks || [])
            .filter((_, index) => index % Math.max(1, Math.floor(weeks / 13)) === 0 || index === weeks - 1)
            .map((snap) => (
              <div key={snap.week} className={styles.sparkRow}>
                <span className={styles.sparkLabel}>W{snap.week}</span>
                <span>L{snap.level}</span>
                <span>{snap.units}u</span>
                <span>{snap.xp.toLocaleString('de-DE')} XP</span>
              </div>
            ))}
        </div>
      </details>
    </section>
  )
}
