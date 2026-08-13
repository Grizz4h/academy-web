import type { PredictionEntry, PredictionResolution, PredictionSessionSummary as PredictionSessionSummaryData } from '../../api'
import type { ReactNode } from 'react'
import type { PredictionFieldDefinition, PredictionOption, PredictionTemplate } from './types'
import { PredictionComparison } from './PredictionComparison'
import { comparePredictionForTemplate, usesExactCompare } from './predictCompare'
import { evaluableAccuracyText } from './predictService'
import {
  getActualOutcomeLabel,
  getConfidenceLabel,
  getCueLabel,
  getFieldOptionLabel,
  getOutcomeFieldLabel,
  getPredictionOptionLabel,
  getReflectionReadLabel,
  getResolutionLabel,
} from './predictLabels'
import styles from './PredictComponents.module.css'

export type PredictionDraft = {
  context: Record<string, string>
  predictedValue?: string
  cues: string[]
  confidence?: 'low' | 'medium' | 'high'
  note: string
  gameTime: string
}

export type PredictionRevealDraft = {
  actualValue?: string
  resolution?: PredictionResolution
  missedCue?: string
  outcome: Record<string, string>
  reflectionReads: string[]
  alternativeSolution?: string
  note: string
}

export function emptyPredictionDraft(): PredictionDraft {
  return { context: {}, cues: [], note: '', gameTime: '' }
}

export function emptyRevealDraft(): PredictionRevealDraft {
  return { outcome: {}, reflectionReads: [], note: '' }
}

function groupedPredictionOptions(options: PredictionOption[], groups?: PredictionTemplate['optionGroups']) {
  if (!groups?.length) {
    return [{ id: 'all', label: undefined as string | undefined, options }]
  }

  const used = new Set<string>()
  const result: Array<{ id: string; label?: string; options: PredictionOption[] }> = groups.map((group) => {
    const grouped = group.optionValues
      .map((value) => options.find((option) => option.value === value))
      .filter((option): option is PredictionOption => Boolean(option))
    grouped.forEach((option) => used.add(option.value))
    return { id: group.id, label: group.label, options: grouped }
  })

  const leftover = options.filter((option) => !used.has(option.value))
  if (leftover.length) {
    result.push({ id: 'other', options: leftover })
  }
  return result
}

function ChoiceList(props: {
  name: string
  options: PredictionOption[]
  groups?: PredictionTemplate['optionGroups']
  value?: string
  selectedValues?: string[]
  multi?: boolean
  maxSelect?: number
  onChange: (next: string | string[]) => void
}) {
  const sections = groupedPredictionOptions(props.options, props.groups)

  const toggleMulti = (value: string) => {
    const current = props.selectedValues || []
    if (current.includes(value)) {
      props.onChange(current.filter((item) => item !== value))
      return
    }
    const maxSelect = props.maxSelect || 0
    if (maxSelect && current.length >= maxSelect) return
    props.onChange([...current, value])
  }

  return (
    <div className={styles.choiceList}>
      {sections.map((section) => (
        <div key={section.id} className={styles.choiceList}>
          {section.label && <p className={styles.groupLabel}>{section.label}</p>}
          {section.options.map((option) => {
            const checked = props.multi
              ? (props.selectedValues || []).includes(option.value)
              : props.value === option.value
            return (
              <label
                key={`${props.name}-${option.value}`}
                className={`${styles.choice} ${checked ? styles.choiceSelected : ''}`}
              >
                <input
                  className={styles.choiceInput}
                  type={props.multi ? 'checkbox' : 'radio'}
                  name={props.name}
                  value={option.value}
                  checked={checked}
                  onChange={() => {
                    if (props.multi) toggleMulti(option.value)
                    else props.onChange(option.value)
                  }}
                />
                <span className={styles.choiceText}>
                  <span className={styles.choiceTitle}>{option.label}</span>
                  {option.description && (
                    <span className={styles.choiceDescription}>{option.description}</span>
                  )}
                </span>
              </label>
            )
          })}
        </div>
      ))}
    </div>
  )
}

function FieldBlock(props: {
  field: PredictionFieldDefinition
  name: string
  value?: string
  selectedValues?: string[]
  onChange: (next: string | string[]) => void
}) {
  const multi = (props.field.maxSelect || 1) > 1
  return (
    <div className={styles.fieldBlock}>
      <div className={styles.fieldLabel}>{props.field.prompt}</div>
      <ChoiceList
        name={props.name}
        options={props.field.options}
        value={props.value}
        selectedValues={props.selectedValues}
        multi={multi}
        maxSelect={props.field.maxSelect}
        onChange={props.onChange}
      />
    </div>
  )
}

export function ObservationHelp(props: { template: PredictionTemplate }) {
  const guide = props.template.observationGuide
  return (
    <details className={styles.help}>
      <summary>Gute Situationen für diesen Predict</summary>
      <ul className={styles.helpList}>
        {guide.suitableSituations.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      {guide.unsuitableSituations.length > 0 && (
        <>
          <p className={styles.groupLabel}>Nicht ideal</p>
          <ul className={styles.helpList}>
            {guide.unsuitableSituations.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </>
      )}
    </details>
  )
}

export function LabModuleNavigation(props: {
  modules: Array<{ id: string; label: string; description: string; enabled: boolean }>
  activeId: string
  onSelect: (moduleId: string) => void
}) {
  return (
    <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
      {props.modules.map((module) => (
        <button
          key={module.id}
          className="btn"
          onClick={() => props.onSelect(module.id)}
          style={{
            background: props.activeId === module.id ? '#80e0fa' : 'rgba(81,145,162,0.2)',
            color: props.activeId === module.id ? '#031019' : '#d8e1ff',
            border: '1px solid rgba(129, 196, 214, 0.5)',
            minHeight: '42px',
          }}
        >
          {module.label}
        </button>
      ))}
    </div>
  )
}

export function PredictModule(props: {
  templateCount: number
  onStart: () => void
}) {
  return (
    <div className="card ui-flat-mobile" style={{ marginBottom: 0 }}>
      <p className={styles.eyebrow}>Predict</p>
      <h2 className={styles.title} style={{ marginTop: '0.25rem' }}>Was möchtest du vorhersagen?</h2>
      <p className={styles.lead}>Spielsituationen lesen und die nächste Aktion vorhersagen.</p>
      <p style={{ color: 'rgba(216,225,255,0.8)' }}>
        Verfügbare Übungen: {props.templateCount}
      </p>
      <button className="btn" onClick={props.onStart} style={{ minHeight: '46px', marginTop: '0.4rem' }}>
        Predict-Session starten
      </button>
    </div>
  )
}

export function PredictionTemplatePicker(props: {
  templates: PredictionTemplate[]
  selectedTemplateId: string
  onSelectTemplate: (templateId: string) => void
}) {
  return (
    <div className="card ui-flat-mobile" style={{ marginBottom: 0 }}>
      <p className={styles.eyebrow}>Predict</p>
      <h2 className={styles.title} style={{ marginTop: '0.25rem' }}>Was möchtest du vorhersagen?</h2>
      {!props.templates.length && <p>Aktuell sind keine Predict-Übungen verfügbar.</p>}
      <div className={styles.root} style={{ marginTop: '0.85rem' }}>
        {props.templates.map((template) => {
          const selected = props.selectedTemplateId === template.id
          return (
            <button
              key={template.id}
              onClick={() => props.onSelectTemplate(template.id)}
              className={`${styles.templateCard} ${selected ? styles.templateCardSelected : ''}`}
            >
              {template.shortTitle && <div className={styles.eyebrow}>{template.shortTitle}</div>}
              <div style={{ fontWeight: 700, margin: '0.2rem 0 0.3rem' }}>{template.title}</div>
              <div style={{ color: 'rgba(216,225,255,0.9)', fontSize: '0.92rem' }}>{template.description}</div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function PredictionSessionSetup(props: {
  children: ReactNode
}) {
  return (
    <div className="card" style={{ marginBottom: 0 }}>
      <h2 style={{ marginTop: 0 }}>Session-Setup</h2>
      {props.children}
    </div>
  )
}

export function PredictionObservationState(props: {
  template: PredictionTemplate
  hasOpenPrediction: boolean
  resolvedCount?: number
  onStartPrediction: () => void
}) {
  const startLabel = (props.resolvedCount || 0) > 0
    ? (props.template.nextSituationLabel || '+ Nächste Situation')
    : (props.template.observationStartLabel || 'Prediction abgeben')

  return (
    <div className="card primary-card ui-flat-mobile" style={{ marginBottom: 0 }}>
      <h2 style={{ marginTop: 0 }}>{startLabel}</h2>
      <p>{props.template.observationStartPrompt || props.template.situationTrigger}</p>
      {props.template.coreHints?.map((hint) => (
        <p key={hint} className={styles.rule}>{hint}</p>
      ))}
      <ObservationHelp template={props.template} />
      <button
        className="btn"
        onClick={props.onStartPrediction}
        disabled={props.hasOpenPrediction}
        style={{ minHeight: '50px', width: '100%', marginTop: '0.6rem' }}
      >
        {startLabel}
      </button>
    </div>
  )
}

export function ConfidenceSelector(props: {
  template: PredictionTemplate
  selectedValue?: string
  onChange: (value: 'low' | 'medium' | 'high') => void
}) {
  if (!props.template.confidence.enabled) return null
  return (
    <div className={styles.fieldBlock}>
      <div className={styles.fieldLabel}>{props.template.confidence.question}</div>
      <ChoiceList
        name="predict-confidence"
        options={props.template.confidence.options}
        value={props.selectedValue}
        onChange={(value) => props.onChange(value as 'low' | 'medium' | 'high')}
      />
    </div>
  )
}

export function isPredictionDraftValid(template: PredictionTemplate, draft: PredictionDraft): boolean {
  const contextReady = (template.contextFields || []).every((field) => {
    if (field.required === false) return true
    return Boolean(draft.context[field.id])
  })
  const cueReady = !template.cueField || template.cueField.required === false || draft.cues.length > 0
  const confidenceReady = !template.confidence.enabled || Boolean(draft.confidence)
  return Boolean(draft.predictedValue && contextReady && cueReady && confidenceReady)
}

export function PredictionInputForm(props: {
  template: PredictionTemplate
  draft: PredictionDraft
  periodLabel?: string
  onChange: (patch: Partial<PredictionDraft>) => void
  onCancelUnclear: () => void
  onSave: () => void
  saving?: boolean
}) {
  const isValid = isPredictionDraftValid(props.template, props.draft)
  const lockLabel = props.template.lockLabel || 'Prediction festlegen'

  return (
    <div className="card primary-card ui-flat-mobile" style={{ marginBottom: 0 }}>
      <p className={styles.eyebrow}>Situation lesen</p>
      <h2 className={styles.title} style={{ marginTop: '0.2rem' }}>Prediction erfassen</h2>
      {props.template.coreHints?.map((hint) => (
        <p key={hint} className={styles.rule}>{hint}</p>
      ))}
      <ObservationHelp template={props.template} />

      {props.template.captureGameClock && (
        <div className={styles.clockRow}>
          <div className={styles.fieldBlock}>
            <div className={styles.fieldLabel}>Drittel</div>
            <div>{props.periodLabel || '–'}</div>
          </div>
          <div className={styles.fieldBlock}>
            <label className={styles.fieldLabel} htmlFor="predict-game-time">Spielzeit (optional)</label>
            <input
              id="predict-game-time"
              className={styles.clockInput}
              inputMode="numeric"
              placeholder="11:34"
              value={props.draft.gameTime}
              onChange={(event) => props.onChange({ gameTime: event.target.value })}
            />
          </div>
        </div>
      )}

      {(props.template.contextFields || []).map((field) => (
        <FieldBlock
          key={field.id}
          field={field}
          name={`context-${field.id}`}
          value={props.draft.context[field.id]}
          onChange={(value) => props.onChange({
            context: { ...props.draft.context, [field.id]: String(value) },
          })}
        />
      ))}

      <div className={styles.fieldBlock}>
        <div className={styles.fieldLabel}>{props.template.predictionPrompt}</div>
        <ChoiceList
          name="predict-choice"
          options={props.template.predictionOptions}
          groups={props.template.optionGroups}
          value={props.draft.predictedValue}
          onChange={(value) => props.onChange({ predictedValue: String(value) })}
        />
      </div>

      {props.template.cueField && (
        <FieldBlock
          field={props.template.cueField}
          name="predict-cue"
          selectedValues={props.draft.cues}
          onChange={(value) => props.onChange({
            cues: Array.isArray(value) ? value : [value],
          })}
        />
      )}

      <ConfidenceSelector
        template={props.template}
        selectedValue={props.draft.confidence}
        onChange={(confidence) => props.onChange({ confidence })}
      />

      {props.template.note?.enabled && (
        <div className={styles.fieldBlock}>
          <label className={styles.fieldLabel} htmlFor="predict-note">{props.template.note.label}</label>
          <textarea
            id="predict-note"
            className={styles.textarea}
            value={props.draft.note}
            onChange={(event) => props.onChange({ note: event.target.value })}
            placeholder={props.template.note.placeholder}
            maxLength={props.template.note.maxChars || 300}
          />
        </div>
      )}

      <div className={styles.actions}>
        <button className="btn" onClick={props.onSave} disabled={!isValid || props.saving} style={{ minHeight: '48px', width: '100%' }}>
          {lockLabel}
        </button>
        <button
          onClick={props.onCancelUnclear}
          style={{ minHeight: '44px', width: '100%', border: '1px solid rgba(255,255,255,0.22)', borderRadius: '8px', background: 'transparent', color: '#d8e1ff', cursor: 'pointer' }}
        >
          Situation nicht klar genug
        </button>
      </div>
    </div>
  )
}

export function OpenPredictionCard(props: {
  template: PredictionTemplate
  entry: PredictionEntry
  justLocked?: boolean
  onResolve: () => void
  onEdit?: () => void
}) {
  return (
    <div className="card primary-card ui-flat-mobile" style={{ marginBottom: 0 }}>
      <div className={`${styles.lockBanner} ${props.justLocked ? styles.lockPulse : ''}`}>
        🔒 {props.template.lockedStatusLabel || 'Prediction gespeichert'}
      </div>
      <p className={styles.lead} style={{ marginTop: '0.85rem' }}>
        Lass die Szene weiterlaufen. Trage die tatsächliche Lösung erst ein, wenn die Entscheidung sichtbar ist.
      </p>
      <PredictionComparison
        predictedLabel={getPredictionOptionLabel(props.template, props.entry.predictedValue, true)}
        predictedEyebrow="Deine Prediction"
        actualEyebrow="Reality"
      />
      <p style={{ margin: 0 }}>
        Sicherheit: <strong>{getConfidenceLabel(props.template, props.entry.confidence)}</strong>
      </p>
      {props.entry.predictionCues?.length ? (
        <p style={{ margin: 0 }}>
          Hinweis: <strong>{props.entry.predictionCues.map((cue) => getCueLabel(props.template, cue)).join(', ')}</strong>
        </p>
      ) : null}
      <div className={styles.actions}>
        <button className="btn" onClick={props.onResolve} style={{ width: '100%', minHeight: '48px' }}>
          Tatsächliche Lösung eintragen
        </button>
        {props.onEdit && (
          <button
            onClick={props.onEdit}
            style={{ minHeight: '44px', width: '100%', border: '1px solid rgba(255,255,255,0.22)', borderRadius: '8px', background: 'transparent', color: '#d8e1ff', cursor: 'pointer' }}
          >
            Prediction ändern
          </button>
        )}
      </div>
    </div>
  )
}

export function PredictionResolutionForm(props: {
  template: PredictionTemplate
  openEntry: PredictionEntry
  draft: PredictionRevealDraft
  onChange: (patch: Partial<PredictionRevealDraft>) => void
  onResolve: () => void
  onBack?: () => void
  saving?: boolean
}) {
  const exact = usesExactCompare(props.template)
  const match = props.draft.actualValue
    ? comparePredictionForTemplate(props.template, props.openEntry.predictedValue, props.draft.actualValue)
    : null
  const canResolve = Boolean(props.draft.actualValue && (exact || props.draft.resolution))

  return (
    <div className="card primary-card ui-flat-mobile" style={{ marginBottom: 0 }}>
      <p className={styles.eyebrow}>Reveal</p>
      <h2 className={styles.title} style={{ marginTop: '0.2rem' }}>Was ist tatsächlich passiert?</h2>

      <div className={styles.fieldBlock}>
        <div className={styles.fieldLabel}>{props.template.resolution.actualOutcomePrompt}</div>
        <ChoiceList
          name="actual-outcome"
          options={props.template.resolution.actualOutcomeOptions}
          groups={props.template.optionGroups}
          value={props.draft.actualValue}
          onChange={(value) => props.onChange({ actualValue: String(value) })}
        />
      </div>

      {props.draft.actualValue && (
        <PredictionComparison
          predictedLabel={getPredictionOptionLabel(props.template, props.openEntry.predictedValue, true)}
          actualLabel={getActualOutcomeLabel(props.template, props.draft.actualValue, true)}
          match={match}
        />
      )}

      {!exact && (
        <div className={styles.fieldBlock}>
          <div className={styles.fieldLabel}>{props.template.resolution.evaluationPrompt}</div>
          <ChoiceList
            name="prediction-resolution"
            options={props.template.resolution.evaluationOptions}
            value={props.draft.resolution}
            onChange={(value) => props.onChange({ resolution: value as PredictionResolution })}
          />
        </div>
      )}

      {props.template.resolution.outcomeField && (
        <FieldBlock
          field={props.template.resolution.outcomeField}
          name="predict-outcome"
          value={props.draft.outcome[props.template.resolution.outcomeField.id]}
          onChange={(value) => props.onChange({
            outcome: {
              ...props.draft.outcome,
              [props.template.resolution.outcomeField!.id]: String(value),
            },
          })}
        />
      )}

      {props.template.resolution.reflectionField && (
        <FieldBlock
          field={props.template.resolution.reflectionField}
          name="predict-reflection"
          value={props.draft.reflectionReads[0]}
          selectedValues={props.draft.reflectionReads}
          onChange={(value) => props.onChange({
            reflectionReads: Array.isArray(value) ? value : [value],
          })}
        />
      )}

      {props.template.resolution.alternativeSolutionField && (
        <FieldBlock
          field={props.template.resolution.alternativeSolutionField}
          name="predict-alternative"
          value={props.draft.alternativeSolution}
          onChange={(value) => props.onChange({ alternativeSolution: String(value) })}
        />
      )}

      {props.template.missedCue?.enabled && (
        <div className={styles.fieldBlock}>
          <label className={styles.fieldLabel} htmlFor="missed-cue">{props.template.missedCue.prompt}</label>
          <select
            id="missed-cue"
            className="appSelect"
            value={props.draft.missedCue || ''}
            onChange={(event) => props.onChange({ missedCue: event.target.value })}
          >
            <option value="">Optional auswählen</option>
            {props.template.missedCue.options.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
      )}

      {props.template.note?.enabled && (
        <div className={styles.fieldBlock}>
          <label className={styles.fieldLabel} htmlFor="reveal-note">{props.template.note.label}</label>
          <textarea
            id="reveal-note"
            className={styles.textarea}
            value={props.draft.note}
            onChange={(event) => props.onChange({ note: event.target.value })}
            placeholder={props.template.note.placeholder}
            maxLength={props.template.note.maxChars || 300}
          />
        </div>
      )}

      <button className="btn" onClick={props.onResolve} disabled={!canResolve || props.saving} style={{ width: '100%', minHeight: '48px', marginTop: '0.4rem' }}>
        Auflösung speichern
      </button>
      {props.onBack && (
        <button
          onClick={props.onBack}
          style={{ minHeight: '44px', width: '100%', marginTop: '0.55rem', border: '1px solid rgba(255,255,255,0.22)', borderRadius: '8px', background: 'transparent', color: '#d8e1ff', cursor: 'pointer' }}
        >
          Zurück zur gespeicherten Prediction
        </button>
      )}
    </div>
  )
}

export function PredictionProgress(props: {
  summary: PredictionSessionSummaryData
  minimumResolvedPredictions: number
  recommendedPredictions?: number
}) {
  const reached = props.summary.resolved >= props.minimumResolvedPredictions
  const target = props.recommendedPredictions || props.minimumResolvedPredictions
  return (
    <div className="card ui-flat-mobile" style={{ marginBottom: 0 }}>
      <h3 style={{ marginTop: 0 }}>Fortschritt</h3>
      <p style={{ margin: 0 }}>
        {props.summary.resolved} von {props.minimumResolvedPredictions} Mindest-Predictions abgeschlossen
      </p>
      {target > props.minimumResolvedPredictions && (
        <p style={{ margin: '0.25rem 0 0' }}>Ziel: {target}</p>
      )}
      {reached && <p style={{ marginBottom: 0, color: '#9ee5b4' }}>Mindestziel erreicht</p>}
    </div>
  )
}

function countRows(
  counts: Record<string, number> | undefined,
  labelFor: (value: string) => string,
) {
  if (!counts) return null
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([value, count]) => (
      <p key={value} className={styles.counts}>
        {labelFor(value)}: {count}×
      </p>
    ))
}

export function PredictionSessionSummary(props: {
  template: PredictionTemplate
  summary: PredictionSessionSummaryData
  insight: string | null
}) {
  const exact = usesExactCompare(props.template)
  const accuracy = evaluableAccuracyText(props.summary)

  return (
    <div className="card ui-flat-mobile" style={{ marginBottom: 0 }}>
      <p className={styles.eyebrow}>{props.template.shortTitle || 'Predict'}</p>
      <h3 className={styles.title} style={{ marginTop: '0.2rem' }}>{props.template.title}</h3>
      <p style={{ marginTop: 0 }}>{props.summary.total} Predictions</p>
      {exact ? (
        <>
          <p style={{ margin: '0.2rem 0' }}>{props.summary.correct} exakt getroffen</p>
          <p style={{ margin: '0.2rem 0' }}>{props.summary.incorrect} anders gelöst</p>
          <p style={{ margin: '0.2rem 0' }}>{props.summary.unjudgeable} nicht auswertbar</p>
        </>
      ) : (
        <>
          <p style={{ margin: '0.2rem 0' }}>{props.summary.correct} eingetroffen</p>
          <p style={{ margin: '0.2rem 0' }}>{props.summary.partial} teilweise eingetroffen</p>
          <p style={{ margin: '0.2rem 0' }}>{props.summary.incorrect} nicht eingetroffen</p>
          <p style={{ margin: '0.2rem 0' }}>{props.summary.unjudgeable} nicht beurteilbar</p>
        </>
      )}
      {accuracy && <p className={styles.hint}>{accuracy}</p>}

      {props.summary.cueCounts && (
        <div style={{ marginTop: '0.9rem' }}>
          <h4 style={{ margin: '0 0 0.35rem' }}>Welche Hinweise hast du am häufigsten genutzt?</h4>
          {countRows(props.summary.cueCounts, (value) => getCueLabel(props.template, value))}
        </div>
      )}

      {props.summary.reflectionReadCounts && (
        <div style={{ marginTop: '0.9rem' }}>
          <h4 style={{ margin: '0 0 0.35rem' }}>Wo lagst du häufig daneben?</h4>
          {countRows(props.summary.reflectionReadCounts, (value) => getReflectionReadLabel(props.template, value))}
        </div>
      )}

      {props.summary.actualValueCounts && (
        <div style={{ marginTop: '0.9rem' }}>
          <h4 style={{ margin: '0 0 0.35rem' }}>Tatsächliche Drucklösungen</h4>
          <p className={styles.lead}>Nur in dieser Session – kein universelles Spieler- oder Teamprofil.</p>
          {countRows(props.summary.actualValueCounts, (value) => getActualOutcomeLabel(props.template, value, true))}
        </div>
      )}

      <p style={{ margin: '0.8rem 0 0.2rem' }}>
        Am häufigsten erwartet: <strong>{getPredictionOptionLabel(props.template, props.summary.mostPredictedValue)}</strong>
      </p>
      <p style={{ margin: '0.2rem 0 0.8rem' }}>
        Tatsächlich am häufigsten: <strong>{getActualOutcomeLabel(props.template, props.summary.mostActualValue)}</strong>
      </p>
      {props.insight && <p style={{ marginBottom: 0, color: 'rgba(216,225,255,0.88)' }}>{props.insight}</p>}
    </div>
  )
}

export function CompactPredictionCard(props: {
  template: PredictionTemplate
  entry: PredictionEntry
  index: number
}) {
  const match = props.entry.actualValue
    ? comparePredictionForTemplate(props.template, props.entry.predictedValue, props.entry.actualValue)
    : null
  const matchLabel = match === 'exact'
    ? '✓ getroffen'
    : match === 'unjudgeable'
      ? 'nicht auswertbar'
      : props.entry.resolution
        ? getResolutionLabel(props.template, props.entry.resolution)
        : 'offen'

  return (
    <div className={styles.compactCard}>
      <div className={styles.compactTitle}>Prediction {props.index}</div>
      <div>Du: {getPredictionOptionLabel(props.template, props.entry.predictedValue, true)}</div>
      <div>Tatsächlich: {getActualOutcomeLabel(props.template, props.entry.actualValue, true)}</div>
      <div>{matchLabel}</div>
      <div>Confidence: {getConfidenceLabel(props.template, props.entry.confidence)}</div>
      {props.entry.outcome && props.template.resolution.outcomeField && (
        <div>
          Outcome: {getOutcomeFieldLabel(props.template, props.entry.outcome[props.template.resolution.outcomeField.id])}
        </div>
      )}
    </div>
  )
}

export function PredictionHistoryDetails(props: {
  template: PredictionTemplate
  entries: PredictionEntry[]
}) {
  const resolved = props.entries.filter((entry) => Boolean(entry.resolution))
  if (!resolved.length) return null
  return (
    <div className="card ui-flat-mobile" style={{ marginBottom: 0 }}>
      <h3 style={{ marginTop: 0 }}>Bisherige Predictions</h3>
      <div style={{ display: 'grid', gap: '0.65rem' }}>
        {resolved.map((entry, index) => (
          <CompactPredictionCard
            key={entry.id}
            template={props.template}
            entry={entry}
            index={entry.order || index + 1}
          />
        ))}
      </div>
    </div>
  )
}

export function getContextSummary(template: PredictionTemplate, entry: PredictionEntry): string | null {
  if (!template.contextFields?.length || !entry.context) return null
  return template.contextFields
    .map((field) => getFieldOptionLabel(field.options, entry.context?.[field.id]))
    .filter((label) => label && label !== '-')
    .join(' · ')
}
