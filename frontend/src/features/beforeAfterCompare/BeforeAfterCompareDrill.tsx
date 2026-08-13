import { useMemo } from 'react'
import type { Drill } from '../../api'
import { DrillGuideCard } from '../../components/DrillGuideCard'
import { OptionChips } from '../patternLog/OptionChips'
import {
  getChangeMagnitudeOptions,
  getConfidenceOptions,
  isCompareStateComplete,
  primaryChangeOptionsForSummary,
  resolveBeforeAfterCompareConfig,
  summarizeBeforeAfterCompare,
} from './compareLogic'
import { labelForOption } from './labels'
import { StateCompareSurface } from './StateCompareSurface'
import type { CompareStage, CompareState, CompareExamplesHelp, StateFieldConfig } from './types'
import styles from './BeforeAfterCompareDrill.module.css'

type Props = {
  drill: Drill
  answers: Record<string, any>
  setAnswers: (next: Record<string, any>) => void
}

function patchAnswers(
  answers: Record<string, any>,
  setAnswers: (next: Record<string, any>) => void,
  patch: Record<string, any>,
) {
  setAnswers({ ...(answers || {}), ...patch })
}

function CompareExamplesAccordion({ help }: { help: CompareExamplesHelp }) {
  return (
    <details className={`${styles.examplesHelp} ui-flat-mobile mobile-flatten`}>
      <summary className={styles.examplesSummary}>{help.title}</summary>
      <div className={styles.examplesBody}>
        {help.intro && <p className={styles.examplesIntro}>{help.intro}</p>}

        {help.suitable.length > 0 && (
          <ul className={styles.examplesList}>
            {help.suitable.map((example) => (
              <li key={example.title} className={styles.exampleItem}>
                <p className={styles.exampleTitle}>{example.title}</p>
                <p className={styles.exampleDescription}>{example.description}</p>
              </li>
            ))}
          </ul>
        )}

        {help.unsuitable.length > 0 && (
          <>
            <p className={styles.unsuitableTitle}>{help.unsuitableTitle}</p>
            <ul className={styles.unsuitableList}>
              {help.unsuitable.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </>
        )}

        {help.footer && <p className={styles.examplesFooter}>{help.footer}</p>}
      </div>
    </details>
  )
}

function StateCapturePanel({
  title,
  state,
  fields,
  onChange,
}: {
  title: string
  state: CompareState
  fields: StateFieldConfig[]
  onChange: (next: CompareState) => void
}) {
  return (
    <section className={`${styles.panel} ui-flat-mobile mobile-flatten-card`}>
      <h3 className={styles.title}>{title}</h3>
      {fields.map((field) => (
        <div key={field.id} className={styles.fieldBlock}>
          <div className={styles.fieldLabel}>{field.label}</div>
          {field.type === 'text' ? (
            <textarea
              className={styles.textarea}
              value={state[field.id] || ''}
              maxLength={field.maxChars || 500}
              placeholder="Kurze, typische Beschreibung für diesen Abschnitt …"
              onChange={(event) => onChange({ ...state, [field.id]: event.target.value })}
            />
          ) : (
            <OptionChips
              name={`${title}-${field.id}`}
              options={field.options || []}
              value={state[field.id] || ''}
              onChange={(next) => onChange({ ...state, [field.id]: String(next) })}
            />
          )}
        </div>
      ))}
    </section>
  )
}

export function BeforeAfterCompareDrill({ drill, answers, setAnswers }: Props) {
  const safeAnswers = answers || {}
  const cfg = resolveBeforeAfterCompareConfig(drill?.config || {})
  const stage = (safeAnswers[cfg.stageKey] || 'before') as CompareStage
  const before = (safeAnswers[cfg.beforeKey] || {}) as CompareState
  const after = (safeAnswers[cfg.afterKey] || {}) as CompareState

  const summary = useMemo(
    () => summarizeBeforeAfterCompare(cfg, before, after),
    [cfg, before, after],
  )

  const primaryOptions = useMemo(
    () => primaryChangeOptionsForSummary(summary),
    [summary],
  )

  const stableOptions = useMemo(
    () => summary.comparisons
      .filter((item) => item.status === 'same')
      .map((item) => ({ value: item.fieldId, label: item.label })),
    [summary],
  )

  const stableDimensions = Array.isArray(safeAnswers[cfg.stableDimensionsKey])
    ? safeAnswers[cfg.stableDimensionsKey]
    : []

  const updateStage = (nextStage: CompareStage) => {
    patchAnswers(safeAnswers, setAnswers, { [cfg.stageKey]: nextStage })
  }

  const guide = drill?.didactics?.observation_guide

  if (stage === 'complete') {
    return (
      <div className={styles.drillRoot}>
        <span className={styles.completeBadge}>✓ Vorher/Nachher-Vergleich abgeschlossen</span>
        <StateCompareSurface title={cfg.compareTitle} comparisons={summary.comparisons} />
        <div className={styles.resultBlock}>
          <div className={styles.resultLabel}>Wichtigste Veränderung</div>
          <p className={styles.resultValue}>
            {labelForOption(primaryOptions, String(safeAnswers[cfg.primaryChangeKey] || ''))}
          </p>
        </div>
        {stableDimensions.length > 0 && (
          <div className={styles.resultBlock}>
            <div className={styles.resultLabel}>Was blieb stabil?</div>
            <p className={styles.resultValue}>
              {stableDimensions
                .map((id: string) => cfg.stateFields.find((field) => field.id === id)?.label || id)
                .join(' · ')}
            </p>
          </div>
        )}
        <div className={styles.resultBlock}>
          <div className={styles.resultLabel}>Deine Beschreibung</div>
          <p className={styles.resultValue}>{safeAnswers[cfg.changeSummaryKey]}</p>
        </div>
        <div className={styles.resultBlock}>
          <div className={styles.resultLabel}>Confidence</div>
          <p className={styles.resultValue}>
            {labelForOption(getConfidenceOptions(), String(safeAnswers[cfg.confidenceKey] || ''))}
          </p>
        </div>
        <div className={styles.actions}>
          <button type="button" className={styles.secondaryBtn} onClick={() => updateStage('before')}>
            Vorher bearbeiten
          </button>
          <button type="button" className={styles.secondaryBtn} onClick={() => updateStage('after')}>
            Nachher bearbeiten
          </button>
          <button type="button" className={styles.secondaryBtn} onClick={() => updateStage('compare')}>
            Vergleich bearbeiten
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.drillRoot}>
      <p className={styles.eyebrow}>Before / After Compare</p>
      <h2 className={styles.title}>{drill.title}</h2>
      {drill.description && <p className={styles.lead}>{drill.description}</p>}
      {drill.didactics?.explanation && <p className={styles.lead}>{drill.didactics.explanation}</p>}
      <p className={styles.rule}>{cfg.comparisonRule}</p>
      <p className={styles.hint}>{cfg.decisionRule}</p>
      <p className={styles.lead}>{cfg.similarSituationsHint}</p>
      {cfg.examplesHelp && <CompareExamplesAccordion help={cfg.examplesHelp} />}
      {guide && <DrillGuideCard guide={guide} />}

      {stage === 'before' && (
        <>
          <StateCapturePanel
            title={cfg.beforeTitle}
            state={before}
            fields={cfg.stateFields}
            onChange={(next) => patchAnswers(safeAnswers, setAnswers, { [cfg.beforeKey]: next })}
          />
          <div className={styles.actions}>
            <button
              type="button"
              className={styles.primaryBtn}
              disabled={!isCompareStateComplete(before, cfg.stateFields)}
              onClick={() => updateStage('after')}
            >
              {cfg.submitBeforeLabel}
            </button>
          </div>
        </>
      )}

      {stage === 'after' && (
        <>
          <div className={styles.actions}>
            <button type="button" className={styles.secondaryBtn} onClick={() => updateStage('before')}>
              ← Vorher bearbeiten
            </button>
          </div>
          <StateCapturePanel
            title={cfg.afterTitle}
            state={after}
            fields={cfg.stateFields}
            onChange={(next) => patchAnswers(safeAnswers, setAnswers, { [cfg.afterKey]: next })}
          />
          <div className={styles.actions}>
            <button
              type="button"
              className={styles.primaryBtn}
              disabled={!isCompareStateComplete(after, cfg.stateFields)}
              onClick={() => updateStage('compare')}
            >
              {cfg.submitAfterLabel}
            </button>
          </div>
        </>
      )}

      {stage === 'compare' && (
        <>
          <div className={styles.actions}>
            <button type="button" className={styles.secondaryBtn} onClick={() => updateStage('before')}>
              Vorher bearbeiten
            </button>
            <button type="button" className={styles.secondaryBtn} onClick={() => updateStage('after')}>
              Nachher bearbeiten
            </button>
          </div>

          <StateCompareSurface title={cfg.compareTitle} comparisons={summary.comparisons} />

          <section className={`${styles.panel} ui-flat-mobile mobile-flatten-card`}>
            <h3 className={styles.title}>Was hat sich verändert?</h3>

            <div className={styles.fieldBlock}>
              <div className={styles.fieldLabel}>Welche Veränderung ist taktisch am relevantesten?</div>
              <OptionChips
                name="primaryChange"
                options={primaryOptions}
                value={safeAnswers[cfg.primaryChangeKey] || ''}
                onChange={(next) => patchAnswers(safeAnswers, setAnswers, { [cfg.primaryChangeKey]: next })}
              />
            </div>

            <div className={styles.fieldBlock}>
              <div className={styles.fieldLabel}>Was bleibt trotz der Veränderung stabil?</div>
              {stableOptions.length > 0 ? (
                <OptionChips
                  name="stableDimensions"
                  options={stableOptions}
                  multi
                  selectedValues={stableDimensions}
                  onChange={(next) => patchAnswers(safeAnswers, setAnswers, { [cfg.stableDimensionsKey]: next })}
                />
              ) : (
                <p className={styles.hint}>Keine Dimension wirkt stabil gleich — das ist okay.</p>
              )}
            </div>

            <div className={styles.fieldBlock}>
              <div className={styles.fieldLabel}>Wie deutlich ist der Unterschied zwischen Vorher und Nachher?</div>
              <OptionChips
                name="changeMagnitude"
                options={getChangeMagnitudeOptions()}
                value={safeAnswers[cfg.changeMagnitudeKey] || ''}
                onChange={(next) => patchAnswers(safeAnswers, setAnswers, { [cfg.changeMagnitudeKey]: next })}
              />
            </div>

            <div className={styles.fieldBlock}>
              <div className={styles.fieldLabel}>Beschreibe die Veränderung in einem Vorher–Nachher-Satz</div>
              <textarea
                className={styles.textarea}
                value={safeAnswers[cfg.changeSummaryKey] || ''}
                maxLength={1500}
                placeholder="Vorher …, später …"
                onChange={(event) => patchAnswers(safeAnswers, setAnswers, { [cfg.changeSummaryKey]: event.target.value })}
              />
            </div>

            <div className={styles.fieldBlock}>
              <div className={styles.fieldLabel}>
                Wie sicher bist du, dass du wirklich eine Veränderung und nicht nur unterschiedliche Einzelsituationen siehst?
              </div>
              <OptionChips
                name="confidence"
                options={getConfidenceOptions()}
                value={safeAnswers[cfg.confidenceKey] || ''}
                onChange={(next) => patchAnswers(safeAnswers, setAnswers, { [cfg.confidenceKey]: next })}
              />
            </div>
          </section>

          <div className={styles.actions}>
            <button
              type="button"
              className={styles.primaryBtn}
              onClick={() => updateStage('complete')}
            >
              {cfg.submitCompareLabel}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
