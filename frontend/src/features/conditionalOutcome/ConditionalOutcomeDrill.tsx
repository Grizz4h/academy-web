import type { Drill } from '../../api'
import { DrillGuideCard } from '../../components/DrillGuideCard'
import { OptionChips } from '../patternLog/OptionChips'
import { SCENE_PERIOD_OPTIONS, formatGameTimeInput } from '../../utils/sceneHelpers'
import { OpportunityList } from '../opportunityRate/OpportunityList'
import { RateExamplesAccordion } from '../opportunityRate/RateDefinitionFields'
import {
  canAddOpportunity,
  createObservationId,
  formatRateFraction,
  removeObservationAt,
  validObservations,
} from '../opportunityRate/rateLogic'
import { CohortRateComparison } from '../cohortRateCompare/CohortRateComparison'
import { ConditionOutcomeMatrix } from './ConditionOutcomeMatrix'
import {
  CONDITION_TEMPLATES,
  canEvaluateConditional,
  canSaveConditionalDraft,
  comparabilityOptions,
  composeConditionalQuestion,
  computeConditionalOutcome,
  counterexampleAssessmentOptions,
  definitionFromTemplate,
  descriptiveDifference,
  emptyConditionalDefinition,
  emptyConditionalDraft,
  hypothesisAssessmentOptions,
  hypothesisOptions,
  isConditionalDefinitionReady,
  observationsForCondition,
  readConditionalStage,
  remainingForBucket,
  resolveConditionalOutcomeConfig,
  syntheticRateDefinition,
  updateConditionalDefinition,
  validateConditionalOutcomeAnswers,
} from './conditionLogic'
import type {
  ConditionState,
  ConditionalDefinition,
  ConditionalDraft,
  ConditionalHypothesis,
  ConditionalObservation,
  ConditionalStage,
  OutcomeState,
} from './types'
import rateStyles from '../opportunityRate/OpportunityRateDrill.module.css'
import styles from './ConditionalOutcomeDrill.module.css'

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

function toListObservations(items: ConditionalObservation[]) {
  return items.map((item) => ({
    ...item,
    outcomeId: item.outcomeState,
  }))
}

export function ConditionalOutcomeDrill({ drill, answers, setAnswers }: Props) {
  const safeAnswers = answers || {}
  const cfg = resolveConditionalOutcomeConfig(drill?.config || {})
  const stage = readConditionalStage(safeAnswers, cfg.stageKey)
  const definition = (safeAnswers[cfg.definitionKey] || emptyConditionalDefinition()) as ConditionalDefinition
  const hypothesis = (safeAnswers[cfg.hypothesisKey] || '') as ConditionalHypothesis | ''
  const observations: ConditionalObservation[] = Array.isArray(safeAnswers[cfg.logsKey])
    ? safeAnswers[cfg.logsKey]
    : []
  const usable = validObservations(observations) as ConditionalObservation[]
  const draft: ConditionalDraft = {
    ...emptyConditionalDraft(),
    ...(safeAnswers[cfg.draftKey] || {}),
  }
  const editIndexRaw = safeAnswers[cfg.editIndexKey]
  const editIndex = typeof editIndexRaw === 'number' ? editIndexRaw : null
  const addingMore = safeAnswers[cfg.addingMoreKey] === true
  const count = usable.length
  const present = observationsForCondition(usable, 'present').length
  const absent = observationsForCondition(usable, 'absent').length
  const atMin = canEvaluateConditional(present, absent, count, cfg.minObservations, cfg.minPresent, cfg.minAbsent)
  const atMax = !canAddOpportunity(count, cfg.maxObservations)
  const isEditing = editIndex !== null && editIndex >= 0 && editIndex < observations.length
  const collecting = isEditing || !atMin || (addingMore && !atMax)
  const result = computeConditionalOutcome(definition, observations, hypothesis || undefined)
  const progressGoal = count >= cfg.recommendedObservations ? cfg.maxObservations : cfg.recommendedObservations
  const progressPercent = Math.min(100, Math.round((count / progressGoal) * 100))
  const guide = drill?.didactics?.observation_guide
  const needPresent = remainingForBucket(present, cfg.minPresent)
  const needAbsent = remainingForBucket(absent, cfg.minAbsent)
  const isComplete = stage === 'complete'
  const listDefinition = syntheticRateDefinition(definition)

  const setStage = (next: ConditionalStage, extra: Record<string, any> = {}) => {
    patchAnswers(safeAnswers, setAnswers, { ...extra, [cfg.stageKey]: next })
  }

  const setDefinition = (next: ConditionalDefinition, extra: Record<string, any> = {}) => {
    patchAnswers(safeAnswers, setAnswers, { ...extra, [cfg.definitionKey]: next })
  }

  const updateDraft = (patch: Partial<ConditionalDraft>) => {
    patchAnswers(safeAnswers, setAnswers, { [cfg.draftKey]: { ...draft, ...patch } })
  }

  const clearDraft = (extra: Record<string, any> = {}) => {
    patchAnswers(safeAnswers, setAnswers, {
      ...extra,
      [cfg.draftKey]: emptyConditionalDraft(),
      [cfg.editIndexKey]: null,
      [cfg.addingMoreKey]: false,
    })
  }

  const saveObservation = () => {
    if (!canSaveConditionalDraft(draft, cfg.supportsGameClock)) return
    if (isEditing) {
      const current = observations[editIndex!]
      if (!current) return
      const nextObs: ConditionalObservation = {
        ...current,
        conditionState: draft.conditionState as ConditionState,
        outcomeState: draft.outcomeState as OutcomeState,
        period: draft.period || undefined,
        gameClock: draft.gameClock.trim() || undefined,
        description: String(draft.description || '').trim() || undefined,
        sceneId: draft.sceneId.trim() || undefined,
        validOpportunity: true,
      }
      clearDraft({
        [cfg.logsKey]: observations.map((obs, idx) => (idx === editIndex ? nextObs : obs)),
        [cfg.stageKey]: 'observe',
      })
      return
    }
    if (atMax) return
    const nextObs: ConditionalObservation = {
      id: createObservationId(),
      order: count + 1,
      conditionState: draft.conditionState as ConditionState,
      outcomeState: draft.outcomeState as OutcomeState,
      outcomeId: draft.outcomeState,
      period: draft.period || undefined,
      gameClock: draft.gameClock.trim() || undefined,
      description: String(draft.description || '').trim() || undefined,
      sceneId: draft.sceneId.trim() || undefined,
      validOpportunity: true,
      createdAt: new Date().toISOString(),
    }
    clearDraft({
      [cfg.logsKey]: [...usable, nextObs].map((obs, idx) => ({ ...obs, order: idx + 1 })),
      [cfg.stageKey]: 'observe',
    })
  }

  const startEdit = (index: number) => {
    const obs = usable[index]
    if (!obs) return
    const rawIndex = observations.findIndex((item) => item.id === obs.id)
    patchAnswers(safeAnswers, setAnswers, {
      [cfg.editIndexKey]: rawIndex >= 0 ? rawIndex : index,
      [cfg.draftKey]: {
        conditionState: obs.conditionState || '',
        outcomeState: obs.outcomeState || '',
        period: obs.period || '',
        gameClock: obs.gameClock || '',
        description: obs.description || '',
        sceneId: obs.sceneId || '',
      },
      [cfg.stageKey]: 'observe',
      [cfg.addingMoreKey]: true,
    })
  }

  const removeObservation = (index: number) => {
    const target = usable[index]
    if (!target) return
    const rawIndex = observations.findIndex((item) => item.id === target.id)
    const nextLogs = removeObservationAt(observations, rawIndex >= 0 ? rawIndex : index) as ConditionalObservation[]
    const nextUsable = validObservations(nextLogs) as ConditionalObservation[]
    const clearingEdit = editIndex === rawIndex
    patchAnswers(safeAnswers, setAnswers, {
      [cfg.logsKey]: nextLogs,
      ...(clearingEdit
        ? { [cfg.draftKey]: emptyConditionalDraft(), [cfg.editIndexKey]: null, [cfg.addingMoreKey]: false }
        : editIndex !== null && rawIndex >= 0 && editIndex > rawIndex
          ? { [cfg.editIndexKey]: editIndex - 1 }
          : {}),
      [cfg.stageKey]: canEvaluateConditional(
        observationsForCondition(nextUsable, 'present').length,
        observationsForCondition(nextUsable, 'absent').length,
        nextUsable.length,
        cfg.minObservations,
        cfg.minPresent,
        cfg.minAbsent,
      ) ? stage : 'observe',
    })
  }

  if (isComplete) {
    return (
      <div className={rateStyles.drillRoot}>
        <span className={rateStyles.completeBadge}>✓ Bedingter Zusammenhang abgeschlossen</span>
        <ResultSummary
          definition={definition}
          hypothesis={hypothesis || undefined}
          result={result}
          sampleLimitNote={cfg.sampleLimitNote}
          comparability={String(safeAnswers[cfg.comparabilityKey] || '')}
          hypothesisAssessment={String(safeAnswers[cfg.hypothesisAssessmentKey] || '')}
          alternative={String(safeAnswers[cfg.alternativeKey] || '')}
          extraDimension={String(safeAnswers[cfg.extraDimensionKey] || '')}
          conclusion={String(safeAnswers[cfg.conclusionKey] || '')}
        />
        <div className={rateStyles.actions}>
          <button type="button" className={rateStyles.secondaryBtn} onClick={() => setStage('review')}>
            Bearbeiten
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={rateStyles.drillRoot}>
      <p className={rateStyles.eyebrow}>Wenn X, dann häufiger Y?</p>
      <h2 className={rateStyles.title}>{drill.title}</h2>
      {drill.description && <p className={rateStyles.lead}>{drill.description}</p>}
      {drill.didactics?.explanation && <p className={rateStyles.lead}>{drill.didactics.explanation}</p>}
      <p className={rateStyles.rule}>{cfg.decisionRule}</p>
      <p className={rateStyles.hint}>{cfg.coreHint}</p>
      {guide && <DrillGuideCard guide={guide} />}
      {cfg.examplesHelp && <RateExamplesAccordion help={cfg.examplesHelp} />}

      {stage === 'define' && (
        <section className={`${rateStyles.panel} ui-flat-mobile mobile-flatten-card`}>
          <h3 className={rateStyles.panelTitle}>Ausgangssituation, Bedingung, Ergebnis</h3>
          <p className={rateStyles.lead}>
            Drei getrennte Dinge: welche Situationen zählen, welche Bedingung du prüfst, welches Ergebnis du zählst.
          </p>

          <div className={rateStyles.fieldBlock}>
            <div className={rateStyles.fieldLabel}>Optionale Templates</div>
            <div className={rateStyles.templateRow}>
              {CONDITION_TEMPLATES.map((template) => (
                <button
                  key={template.id}
                  type="button"
                  className={`${rateStyles.templateBtn} ${definition.templateId === template.id ? rateStyles.templateBtnActive : ''}`}
                  onClick={() => setDefinition(definitionFromTemplate(template))}
                >
                  <span>{template.title}</span>
                  <small>{template.description}</small>
                </button>
              ))}
            </div>
          </div>

          <div className={rateStyles.fieldBlock}>
            <div className={rateStyles.fieldLabel}>Welche Situationen zählen überhaupt mit?</div>
            <input
              className={rateStyles.input}
              value={definition.opportunityLabel}
              maxLength={160}
              placeholder="z. B. jeder Exit-Versuch"
              onChange={(event) => setDefinition(updateConditionalDefinition(definition, {
                opportunityLabel: event.target.value,
              }))}
            />
          </div>

          <div className={rateStyles.fieldBlock}>
            <div className={rateStyles.fieldLabel}>Welche Bedingung prüfst du?</div>
            <input
              className={rateStyles.input}
              value={definition.condition.label}
              maxLength={160}
              placeholder="z. B. Weak-Side-Support vorhanden"
              onChange={(event) => setDefinition(updateConditionalDefinition(definition, {
                conditionLabel: event.target.value,
              }))}
            />
          </div>

          <div className={rateStyles.fieldBlock}>
            <div className={rateStyles.fieldLabel}>Welches Zielereignis möchtest du zählen?</div>
            <input
              className={rateStyles.input}
              value={definition.targetEventLabel}
              maxLength={160}
              placeholder="z. B. kontrollierter Exit"
              onChange={(event) => setDefinition(updateConditionalDefinition(definition, {
                targetEventLabel: event.target.value,
              }))}
            />
          </div>

          <div className={rateStyles.fieldBlock}>
            <div className={rateStyles.fieldLabel}>Messfrage</div>
            <textarea
              className={rateStyles.textarea}
              value={definition.question || composeConditionalQuestion(definition.targetEventLabel, definition.condition.label)}
              maxLength={240}
              onChange={(event) => setDefinition(updateConditionalDefinition(definition, {
                question: event.target.value,
              }))}
            />
          </div>

          <div className={rateStyles.fieldBlock}>
            <div className={rateStyles.fieldLabel}>Was erwartest du?</div>
            <OptionChips
              name="conditionalHypothesis"
              options={hypothesisOptions()}
              value={hypothesis}
              onChange={(next) => patchAnswers(safeAnswers, setAnswers, { [cfg.hypothesisKey]: next })}
            />
          </div>

          <div className={rateStyles.actions}>
            <button
              type="button"
              className={rateStyles.primaryBtn}
              disabled={!isConditionalDefinitionReady(definition) || !hypothesis}
              onClick={() => setStage('observe')}
            >
              Beobachtung starten
            </button>
          </div>
        </section>
      )}

      {(stage === 'observe' || stage === 'review') && (
        <div className={rateStyles.observeLayout}>
          <div className={rateStyles.observeMain}>
            <div className={rateStyles.progress}>
              <div className={rateStyles.progressMeta}>
                <span>{count} / {progressGoal} Opportunities</span>
                {atMin && <span>Genug für erste Auswertung</span>}
              </div>
              <div className={rateStyles.progressBar} aria-hidden>
                <div className={rateStyles.progressFill} style={{ width: `${progressPercent}%` }} />
              </div>
            </div>

            <div className={styles.liveGroups}>
              <div className={styles.liveGroup}>
                <div>{count} gültige Ausgangssituationen</div>
                <div>Bedingung vorhanden: <strong>{present}</strong></div>
                <div>Bedingung nicht vorhanden: <strong>{absent}</strong></div>
              </div>
              {result.withCondition.evaluableCount > 0 && (
                <div className={rateStyles.liveFraction}>
                  Zielereignis mit Bedingung: {formatRateFraction(result.withCondition.targetCount, result.withCondition.evaluableCount)}
                  {result.withCondition.outcomeUnclear > 0
                    ? ` · ${result.withCondition.outcomeUnclear} unklar`
                    : ''}
                </div>
              )}
              {result.withoutCondition.evaluableCount > 0 && (
                <div className={rateStyles.liveFraction}>
                  Zielereignis ohne Bedingung: {formatRateFraction(result.withoutCondition.targetCount, result.withoutCondition.evaluableCount)}
                  {result.withoutCondition.outcomeUnclear > 0
                    ? ` · ${result.withoutCondition.outcomeUnclear} unklar`
                    : ''}
                </div>
              )}
            </div>
            {needPresent > 0 && (
              <p className={styles.balanceHint}>
                Noch {needPresent} Situation{needPresent === 1 ? '' : 'en'} mit Bedingung für den empfohlenen Übungsumfang.
              </p>
            )}
            {needAbsent > 0 && (
              <p className={styles.balanceHint}>
                Noch {needAbsent} Situation{needAbsent === 1 ? '' : 'en'} ohne Bedingung für den empfohlenen Übungsumfang.
              </p>
            )}
            {atMin && result.sampleImbalance && (
              <p className={styles.balanceHint}>Die beiden Gruppen sind unterschiedlich groß.</p>
            )}

            {stage === 'observe' && collecting && (
              <section className={`${rateStyles.panel} ui-flat-mobile mobile-flatten-card`}>
                <h3 className={rateStyles.panelTitle}>
                  {isEditing ? `Ausgangssituation ${editIndex! + 1} ändern` : `Ausgangssituation #${count + 1}`}
                </h3>
                <p className={rateStyles.lead}>Zuerst die Bedingung, dann das Ergebnis. Zusammenauftreten ist keine Ursache.</p>

                <div className={rateStyles.fieldBlock}>
                  <div className={rateStyles.fieldLabel}>{definition.condition.label || 'Bedingung'}?</div>
                  <div className={styles.choiceRow}>
                    {([
                      ['present', 'vorhanden'],
                      ['absent', 'nicht vorhanden'],
                      ['unclear', 'unklar'],
                    ] as Array<[ConditionState, string]>).map(([value, label]) => (
                      <button
                        key={value}
                        type="button"
                        className={`${styles.choiceBtn} ${draft.conditionState === value ? styles.choiceBtnActive : ''}`}
                        onClick={() => updateDraft({ conditionState: value })}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className={rateStyles.fieldBlock}>
                  <div className={rateStyles.fieldLabel}>{definition.targetEventLabel || 'Zielereignis'}?</div>
                  <div className={styles.choiceRow}>
                    {([
                      ['target', 'ja'],
                      ['other', 'nein'],
                      ['unclear', 'unklar'],
                    ] as Array<[OutcomeState, string]>).map(([value, label]) => (
                      <button
                        key={value}
                        type="button"
                        className={`${styles.choiceBtn} ${draft.outcomeState === value ? styles.choiceBtnActive : ''}`}
                        onClick={() => updateDraft({ outcomeState: value })}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {cfg.supportsGameClock && (
                  <div className={rateStyles.row2}>
                    <div className={rateStyles.fieldBlock}>
                      <div className={rateStyles.fieldLabel}>Drittel (optional)</div>
                      <select
                        className={rateStyles.select}
                        value={draft.period}
                        onChange={(event) => updateDraft({ period: event.target.value })}
                      >
                        <option value="">—</option>
                        {SCENE_PERIOD_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className={rateStyles.fieldBlock}>
                      <div className={rateStyles.fieldLabel}>Spieluhr (optional)</div>
                      <input
                        className={rateStyles.input}
                        value={draft.gameClock}
                        placeholder="z. B. 12:43"
                        onChange={(event) => updateDraft({ gameClock: formatGameTimeInput(event.target.value) })}
                      />
                    </div>
                  </div>
                )}

                <div className={rateStyles.fieldBlock}>
                  <div className={rateStyles.fieldLabel}>Kurznotiz (optional)</div>
                  <input
                    className={rateStyles.input}
                    value={draft.description}
                    maxLength={160}
                    onChange={(event) => updateDraft({ description: event.target.value })}
                  />
                </div>

                <div className={rateStyles.actions}>
                  <button
                    type="button"
                    className={rateStyles.primaryBtn}
                    disabled={!canSaveConditionalDraft(draft, cfg.supportsGameClock)}
                    onClick={saveObservation}
                  >
                    Ausgangssituation speichern
                  </button>
                  {isEditing && (
                    <button type="button" className={rateStyles.secondaryBtn} onClick={() => clearDraft()}>
                      Abbrechen
                    </button>
                  )}
                </div>
              </section>
            )}

            {stage === 'observe' && atMin && !collecting && (
              <div className={rateStyles.actions}>
                <button type="button" className={rateStyles.primaryBtn} onClick={() => setStage('review')}>
                  Auswerten
                </button>
                {!atMax && (
                  <button
                    type="button"
                    className={rateStyles.secondaryBtn}
                    onClick={() => patchAnswers(safeAnswers, setAnswers, { [cfg.addingMoreKey]: true })}
                  >
                    + Weitere Ausgangssituation
                  </button>
                )}
              </div>
            )}

            {stage === 'review' && (
              <section className={`${rateStyles.panel} ui-flat-mobile mobile-flatten-card`}>
                <ResultSummary
                  definition={definition}
                  hypothesis={hypothesis || undefined}
                  result={result}
                  sampleLimitNote={cfg.sampleLimitNote}
                />

                <div className={rateStyles.fieldBlock}>
                  <div className={rateStyles.fieldLabel}>Hat sich deine ursprüngliche Erwartung bestätigt?</div>
                  <OptionChips
                    name="hypothesisAssessment"
                    options={hypothesisAssessmentOptions()}
                    value={safeAnswers[cfg.hypothesisAssessmentKey] || ''}
                    onChange={(next) => patchAnswers(safeAnswers, setAnswers, { [cfg.hypothesisAssessmentKey]: next })}
                  />
                </div>

                <div className={rateStyles.fieldBlock}>
                  <div className={rateStyles.fieldLabel}>Wie vergleichbar waren die Situationen mit und ohne Bedingung sonst?</div>
                  <OptionChips
                    name="comparability"
                    options={comparabilityOptions()}
                    value={safeAnswers[cfg.comparabilityKey] || ''}
                    onChange={(next) => patchAnswers(safeAnswers, setAnswers, { [cfg.comparabilityKey]: next })}
                  />
                </div>

                <div className={rateStyles.fieldBlock}>
                  <div className={rateStyles.fieldLabel}>Welche andere Erklärung könnte ebenfalls zu diesem Muster passen?</div>
                  <textarea
                    className={rateStyles.textarea}
                    value={safeAnswers[cfg.alternativeKey] || ''}
                    maxLength={300}
                    placeholder="z. B. Situationen mit Support entstanden häufiger bei geringerem Forecheckdruck."
                    onChange={(event) => patchAnswers(safeAnswers, setAnswers, { [cfg.alternativeKey]: event.target.value })}
                  />
                </div>

                <div className={rateStyles.fieldBlock}>
                  <div className={rateStyles.fieldLabel}>Welche weitere Dimension war möglicherweise unterschiedlich? (optional)</div>
                  <input
                    className={rateStyles.input}
                    value={safeAnswers[cfg.extraDimensionKey] || ''}
                    maxLength={160}
                    placeholder="Druck, Zone, Game State, Shift-Zeit …"
                    onChange={(event) => patchAnswers(safeAnswers, setAnswers, { [cfg.extraDimensionKey]: event.target.value })}
                  />
                </div>

                <div className={rateStyles.fieldBlock}>
                  <div className={rateStyles.fieldLabel}>Gab es Situationen, die deiner Erwartung widersprochen haben?</div>
                  <OptionChips
                    name="counterexampleAssessment"
                    options={counterexampleAssessmentOptions()}
                    value={safeAnswers[cfg.counterexampleKey] || ''}
                    onChange={(next) => patchAnswers(safeAnswers, setAnswers, { [cfg.counterexampleKey]: next })}
                  />
                </div>

                <div className={rateStyles.fieldBlock}>
                  <div className={rateStyles.fieldLabel}>Formuliere den beobachteten Zusammenhang, ohne eine Ursache zu behaupten.</div>
                  <p className={rateStyles.fieldHelp}>{cfg.conclusionHint}</p>
                  <p className={rateStyles.fieldHelp}>{cfg.wordingHelp}</p>
                  <textarea
                    className={rateStyles.textarea}
                    value={safeAnswers[cfg.conclusionKey] || ''}
                    maxLength={500}
                    placeholder="In meinen beobachteten Situationen trat … häufiger auf, wenn …"
                    onChange={(event) => patchAnswers(safeAnswers, setAnswers, { [cfg.conclusionKey]: event.target.value })}
                  />
                </div>

                <div className={rateStyles.actions}>
                  <button
                    type="button"
                    className={rateStyles.primaryBtn}
                    disabled={Boolean(validateConditionalOutcomeAnswers(cfg, {
                      ...safeAnswers,
                      [cfg.definitionKey]: definition,
                      [cfg.logsKey]: observations,
                    }))}
                    onClick={() => {
                      const error = validateConditionalOutcomeAnswers(cfg, {
                        ...safeAnswers,
                        [cfg.definitionKey]: definition,
                        [cfg.logsKey]: observations,
                      })
                      if (error) return
                      setStage('complete')
                    }}
                  >
                    Auswertung abschließen
                  </button>
                  <button type="button" className={rateStyles.secondaryBtn} onClick={() => setStage('observe')}>
                    Zurück zur Beobachtung
                  </button>
                  <button type="button" className={rateStyles.secondaryBtn} onClick={() => setStage('define')}>
                    Definition anpassen
                  </button>
                </div>
              </section>
            )}
          </div>

          <aside className={rateStyles.observeSide}>
            <section className={`${rateStyles.panel} ui-flat-mobile mobile-flatten-card`}>
              <h3 className={rateStyles.panelTitle}>Deine Messfrage</h3>
              <p className={rateStyles.lead}>{definition.question}</p>
              <OpportunityList
                observations={toListObservations(usable)}
                definition={listDefinition}
                badgeFor={(obs) => {
                  const item = obs as ConditionalObservation
                  if (item.conditionState === 'present') return 'vorhanden'
                  if (item.conditionState === 'absent') return 'nicht'
                  if (item.conditionState === 'unclear') return 'Bedingung unklar'
                  return undefined
                }}
                onEdit={stage === 'observe' ? startEdit : undefined}
                onRemove={stage === 'observe' ? removeObservation : undefined}
              />
            </section>
          </aside>
        </div>
      )}
    </div>
  )
}

function ResultSummary({
  definition,
  hypothesis,
  result,
  sampleLimitNote,
  comparability,
  hypothesisAssessment,
  alternative,
  extraDimension,
  conclusion,
}: {
  definition: ConditionalDefinition
  hypothesis?: ConditionalHypothesis
  result: ReturnType<typeof computeConditionalOutcome>
  sampleLimitNote: string
  comparability?: string
  hypothesisAssessment?: string
  alternative?: string
  extraDimension?: string
  conclusion?: string
}) {
  const comparabilityLabel = comparabilityOptions().find((item) => item.value === comparability)?.label
  const hypothesisLabel = hypothesisOptions().find((item) => item.value === hypothesis)?.label
  const assessmentLabel = hypothesisAssessmentOptions().find((item) => item.value === hypothesisAssessment)?.label

  return (
    <div className={rateStyles.resultStack}>
      <div className={rateStyles.resultBlock}>
        <div className={rateStyles.resultLabel}>Messfrage</div>
        <p className={rateStyles.resultValue}>{definition.question}</p>
      </div>
      {hypothesisLabel && (
        <div className={rateStyles.resultBlock}>
          <div className={rateStyles.resultLabel}>Deine Erwartung</div>
          <p className={rateStyles.resultValue}>{hypothesisLabel}</p>
        </div>
      )}
      <div className={styles.resultLayout}>
        <ConditionOutcomeMatrix
          conditionLabel={definition.condition.label}
          targetLabel={definition.targetEventLabel}
          matrix={result.matrix}
        />
        <CohortRateComparison
          title="Stichprobenrate (Zielereignisse / auswertbar)"
          groupA={{
            id: 'A',
            label: 'Mit Bedingung',
            totalOpportunities: result.withCondition.total,
            evaluableCount: result.withCondition.evaluableCount,
            targetCount: result.withCondition.targetCount,
            otherCount: result.withCondition.otherCount,
            rate: result.withCondition.rate,
            ratePercent: result.withCondition.ratePercent,
            unclearCount: result.withCondition.outcomeUnclear,
            outcomeDistribution: {},
            distributionItems: [],
            rateSummary: result.withCondition.rateSummary,
          }}
          groupB={{
            id: 'B',
            label: 'Ohne Bedingung',
            totalOpportunities: result.withoutCondition.total,
            evaluableCount: result.withoutCondition.evaluableCount,
            targetCount: result.withoutCondition.targetCount,
            otherCount: result.withoutCondition.otherCount,
            rate: result.withoutCondition.rate,
            ratePercent: result.withoutCondition.ratePercent,
            unclearCount: result.withoutCondition.outcomeUnclear,
            outcomeDistribution: {},
            distributionItems: [],
            rateSummary: result.withoutCondition.rateSummary,
          }}
          percentagePointDifference={result.percentagePointDifference}
          sampleImbalance={result.sampleImbalance}
          showPercents
        />
      </div>
      <p className={rateStyles.sampleNote}>{descriptiveDifference(result)} {sampleLimitNote}</p>
      {result.counterexampleSummary && (
        <div className={rateStyles.resultBlock}>
          <div className={rateStyles.resultLabel}>Gegenfälle</div>
          <p className={rateStyles.resultValue}>{result.counterexampleSummary}</p>
        </div>
      )}
      {assessmentLabel && (
        <div className={rateStyles.resultBlock}>
          <div className={rateStyles.resultLabel}>Erwartung bestätigt?</div>
          <p className={rateStyles.resultValue}>{assessmentLabel}</p>
        </div>
      )}
      {comparabilityLabel && (
        <div className={rateStyles.resultBlock}>
          <div className={rateStyles.resultLabel}>Vergleichbarkeit</div>
          <p className={rateStyles.resultValue}>{comparabilityLabel}</p>
        </div>
      )}
      {alternative && (
        <div className={rateStyles.resultBlock}>
          <div className={rateStyles.resultLabel}>Alternative Erklärung</div>
          <p className={rateStyles.resultValue}>{alternative}</p>
        </div>
      )}
      {extraDimension && (
        <div className={rateStyles.resultBlock}>
          <div className={rateStyles.resultLabel}>Weitere Dimension</div>
          <p className={rateStyles.resultValue}>{extraDimension}</p>
        </div>
      )}
      {conclusion && (
        <div className={rateStyles.resultBlock}>
          <div className={rateStyles.resultLabel}>Deine Aussage</div>
          <p className={rateStyles.resultValue}>{conclusion}</p>
        </div>
      )}
    </div>
  )
}
