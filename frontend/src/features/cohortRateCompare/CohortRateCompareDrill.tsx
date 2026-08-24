import type { Drill } from '../../api'
import { DrillGuideCard } from '../../components/DrillGuideCard'
import { OptionChips } from '../patternLog/OptionChips'
import { SCENE_PERIOD_OPTIONS, formatGameTimeInput } from '../../utils/sceneHelpers'
import { OpportunityList } from '../opportunityRate/OpportunityList'
import { RateDefinitionFields, RateExamplesAccordion } from '../opportunityRate/RateDefinitionFields'
import {
  cloneDefinition,
  createObservationId,
  ensureUnclearOutcome,
  formatRateFraction,
  templatesForConfig,
  validObservations,
} from '../opportunityRate/rateLogic'
import { CohortRateComparison } from './CohortRateComparison'
import {
  applyDimensionTemplate,
  canAddCompareOpportunity,
  canEvaluateCompare,
  canSaveCohortDraft,
  comparabilityOptions,
  composeCompareQuestion,
  computeCohortRateCompare,
  emptyCohortDraft,
  emptyComparison,
  isComparisonReady,
  observationsForCohort,
  perceivedDifferenceOptions,
  readCompareStage,
  remainingForGroup,
  resolveCohortRateCompareConfig,
  updateComparisonQuestion,
  validateCohortRateCompareAnswers,
} from './compareLogic'
import { removeObservationAt } from '../opportunityRate/rateLogic'
import type { RateDefinition } from '../opportunityRate/types'
import type {
  CohortComparison,
  CohortId,
  CohortOpportunityDraft,
  CohortOpportunityObservation,
  CohortRateCompareStage,
} from './types'
import rateStyles from '../opportunityRate/OpportunityRateDrill.module.css'
import styles from './CohortRateCompareDrill.module.css'

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

export function CohortRateCompareDrill({ drill, answers, setAnswers }: Props) {
  const safeAnswers = answers || {}
  const cfg = resolveCohortRateCompareConfig(drill?.config || {})
  const stage = readCompareStage(safeAnswers, cfg.stageKey)
  const definition = (safeAnswers[cfg.definitionKey] || null) as RateDefinition | null
  const comparison = (safeAnswers[cfg.comparisonKey] || emptyComparison()) as CohortComparison
  const observations: CohortOpportunityObservation[] = Array.isArray(safeAnswers[cfg.logsKey])
    ? safeAnswers[cfg.logsKey]
    : []
  const usable = validObservations(observations) as CohortOpportunityObservation[]
  const draft: CohortOpportunityDraft = {
    ...emptyCohortDraft(),
    ...(safeAnswers[cfg.draftKey] || {}),
  }
  const editIndexRaw = safeAnswers[cfg.editIndexKey]
  const editIndex = typeof editIndexRaw === 'number' ? editIndexRaw : null
  const addingMore = safeAnswers[cfg.addingMoreKey] === true
  const count = usable.length
  const countA = observationsForCohort(usable, 'A').length
  const countB = observationsForCohort(usable, 'B').length
  const atMin = canEvaluateCompare(countA, countB, cfg.minObservations, cfg.minPerGroup)
  const atMax = !canAddCompareOpportunity(count, cfg.maxObservations)
  const isEditing = editIndex !== null && editIndex >= 0 && editIndex < observations.length
  const collecting = Boolean(definition) && (isEditing || !atMin || (addingMore && !atMax))
  const templates = templatesForConfig({
    allowTemplates: cfg.allowTemplates,
    templateIds: cfg.templateIds,
  })
  const result = definition
    ? computeCohortRateCompare(definition, comparison, observations, cfg.unclearOutcomeId)
    : null
  const progressGoal = count >= cfg.recommendedObservations ? cfg.maxObservations : cfg.recommendedObservations
  const progressPercent = Math.min(100, Math.round((count / progressGoal) * 100))
  const guide = drill?.didactics?.observation_guide
  const needA = remainingForGroup(countA, cfg.minPerGroup)
  const needB = remainingForGroup(countB, cfg.minPerGroup)
  const isComplete = stage === 'complete'

  const setStage = (next: CohortRateCompareStage, extra: Record<string, any> = {}) => {
    patchAnswers(safeAnswers, setAnswers, { ...extra, [cfg.stageKey]: next })
  }

  const setDefinition = (next: RateDefinition, extra: Record<string, any> = {}) => {
    patchAnswers(safeAnswers, setAnswers, {
      ...extra,
      [cfg.definitionKey]: {
        ...next,
        outcomes: ensureUnclearOutcome(next.outcomes || [], cfg.unclearOutcomeId),
      },
    })
  }

  const setComparison = (next: CohortComparison, extra: Record<string, any> = {}) => {
    patchAnswers(safeAnswers, setAnswers, {
      ...extra,
      [cfg.comparisonKey]: next,
    })
  }

  const updateDraft = (patch: Partial<CohortOpportunityDraft>) => {
    patchAnswers(safeAnswers, setAnswers, {
      [cfg.draftKey]: { ...draft, ...patch },
    })
  }

  const clearDraft = (extra: Record<string, any> = {}) => {
    patchAnswers(safeAnswers, setAnswers, {
      ...extra,
      [cfg.draftKey]: emptyCohortDraft(),
      [cfg.editIndexKey]: null,
      [cfg.addingMoreKey]: false,
    })
  }

  const saveObservation = () => {
    if (!definition || !canSaveCohortDraft(draft, definition, cfg.supportsGameClock)) return
    if (isEditing) {
      const current = observations[editIndex!]
      if (!current) return
      const nextObs: CohortOpportunityObservation = {
        ...current,
        cohortId: draft.cohortId as CohortId,
        outcomeId: draft.outcomeId,
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
    const nextObs: CohortOpportunityObservation = {
      id: createObservationId(),
      order: count + 1,
      cohortId: draft.cohortId as CohortId,
      outcomeId: draft.outcomeId,
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
        cohortId: obs.cohortId || '',
        outcomeId: obs.outcomeId || '',
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
    const nextLogs = removeObservationAt(observations, rawIndex >= 0 ? rawIndex : index) as CohortOpportunityObservation[]
    const nextUsable = validObservations(nextLogs) as CohortOpportunityObservation[]
    const clearingEdit = editIndex === rawIndex
    patchAnswers(safeAnswers, setAnswers, {
      [cfg.logsKey]: nextLogs,
      ...(clearingEdit
        ? { [cfg.draftKey]: emptyCohortDraft(), [cfg.editIndexKey]: null, [cfg.addingMoreKey]: false }
        : editIndex !== null && rawIndex >= 0 && editIndex > rawIndex
          ? { [cfg.editIndexKey]: editIndex - 1 }
          : {}),
      [cfg.stageKey]: canEvaluateCompare(
        observationsForCohort(nextUsable, 'A').length,
        observationsForCohort(nextUsable, 'B').length,
        cfg.minObservations,
        cfg.minPerGroup,
      ) ? stage : 'observe',
    })
  }

  if (isComplete && definition && result) {
    return (
      <div className={rateStyles.drillRoot}>
        <span className={rateStyles.completeBadge}>✓ Gruppenvergleich abgeschlossen</span>
        <ResultSummary
          definition={definition}
          comparison={comparison}
          result={result}
          sampleLimitNote={cfg.sampleLimitNote}
          comparability={String(safeAnswers[cfg.comparabilityKey] || '')}
          perceivedDifference={String(safeAnswers[cfg.differenceKey] || '')}
          confounder={String(safeAnswers[cfg.confounderKey] || '')}
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
      <p className={rateStyles.eyebrow}>Dieselbe Rate · zwei Gruppen</p>
      <h2 className={rateStyles.title}>{drill.title}</h2>
      {drill.description && <p className={rateStyles.lead}>{drill.description}</p>}
      {drill.didactics?.explanation && <p className={rateStyles.lead}>{drill.didactics.explanation}</p>}
      <p className={rateStyles.rule}>{cfg.decisionRule}</p>
      <p className={rateStyles.hint}>{cfg.coreHint}</p>
      {guide && <DrillGuideCard guide={guide} />}
      {cfg.examplesHelp && <RateExamplesAccordion help={cfg.examplesHelp} />}

      {stage === 'define' && (
        <RateDefinitionFields
          definition={definition}
          templates={templates}
          allowTemplates={cfg.allowTemplates}
          allowCustomDefinition={cfg.allowCustomDefinition}
          unclearOutcomeId={cfg.unclearOutcomeId}
          metricScopeNote="Diese Definition gilt für beide Gruppen identisch."
          onChange={setDefinition}
          continueLabel="Vergleich definieren"
          onContinue={(next) => {
            const cloned = cloneDefinition(next, cfg.unclearOutcomeId)
            const nextComparison = updateComparisonQuestion(comparison, cloned, {})
            setStage('compare', {
              [cfg.definitionKey]: cloned,
              [cfg.comparisonKey]: nextComparison,
            })
          }}
        />
      )}

      {stage === 'compare' && definition && (
        <section className={`${rateStyles.panel} ui-flat-mobile mobile-flatten-card`}>
          <h3 className={rateStyles.panelTitle}>Primäre Vergleichsdimension</h3>
          <p className={rateStyles.lead}>
            Lege eine primäre Vergleichsdimension fest. Messfrage, Ausgangssituation und Zielereignis bleiben in beiden Vergleichsgruppen gleich.
            Weitere sichtbare Kontextunterschiede dokumentierst du später — im Spiel lassen sie sich nicht vollständig konstant halten.
          </p>
          <p className={rateStyles.lead}><strong>Messfrage:</strong> {definition.question}</p>

          <div className={rateStyles.fieldBlock}>
            <div className={rateStyles.fieldLabel}>Primäre Vergleichsdimension</div>
            <div className={rateStyles.templateRow}>
              {cfg.dimensionTemplates.map((template) => (
                <button
                  key={template.id}
                  type="button"
                  className={`${rateStyles.templateBtn} ${comparison.templateId === template.id ? rateStyles.templateBtnActive : ''}`}
                  onClick={() => setComparison(updateComparisonQuestion(
                    applyDimensionTemplate(comparison, template),
                    definition,
                    {},
                  ))}
                >
                  {template.label}
                </button>
              ))}
            </div>
            <input
              className={rateStyles.input}
              value={comparison.dimensionLabel}
              maxLength={80}
              placeholder="z. B. Entry-Seite, Druckniveau, Support …"
              onChange={(event) => setComparison(updateComparisonQuestion(comparison, definition, {
                dimensionLabel: event.target.value,
              }))}
            />
          </div>

          <div className={rateStyles.fieldBlock}>
            <div className={rateStyles.fieldLabel}>Was zählt zu Gruppe A?</div>
            <input
              className={rateStyles.input}
              value={comparison.groupA.label}
              maxLength={80}
              placeholder="z. B. Entries über links"
              onChange={(event) => setComparison(updateComparisonQuestion(comparison, definition, {
                groupA: { ...comparison.groupA, label: event.target.value },
              }))}
            />
          </div>

          <div className={rateStyles.fieldBlock}>
            <div className={rateStyles.fieldLabel}>Was zählt zu Gruppe B?</div>
            <input
              className={rateStyles.input}
              value={comparison.groupB.label}
              maxLength={80}
              placeholder="z. B. Entries über rechts"
              onChange={(event) => setComparison(updateComparisonQuestion(comparison, definition, {
                groupB: { ...comparison.groupB, label: event.target.value },
              }))}
            />
          </div>

          <div className={rateStyles.fieldBlock}>
            <div className={rateStyles.fieldLabel}>Vergleichsfrage</div>
            <textarea
              className={rateStyles.textarea}
              value={comparison.question || composeCompareQuestion(definition.targetEventLabel, comparison.groupA.label, comparison.groupB.label)}
              maxLength={240}
              onChange={(event) => setComparison(updateComparisonQuestion(comparison, definition, {
                question: event.target.value,
              }))}
            />
          </div>

          <div className={rateStyles.actions}>
            <button
              type="button"
              className={rateStyles.primaryBtn}
              disabled={!isComparisonReady(comparison)}
              onClick={() => setStage('observe', { [cfg.comparisonKey]: comparison })}
            >
              Beobachtung starten
            </button>
            <button type="button" className={rateStyles.secondaryBtn} onClick={() => setStage('define')}>
              Messfrage anpassen
            </button>
          </div>
        </section>
      )}

      {(stage === 'observe' || stage === 'review') && definition && result && (
        <div className={rateStyles.observeLayout}>
          <div className={rateStyles.observeMain}>
            <div className={rateStyles.progress}>
              <div className={rateStyles.progressMeta}>
                <span>{count} / {progressGoal} Ausgangssituationen</span>
                {atMin && <span>Genug für ersten Vergleich (Übungsumfang)</span>}
              </div>
              <div className={rateStyles.progressBar} aria-hidden>
                <div className={rateStyles.progressFill} style={{ width: `${progressPercent}%` }} />
              </div>
            </div>

            <div className={styles.liveGroups}>
              <div className={styles.liveGroup}>
                <div>{comparison.groupA.label || 'Vergleichsgruppe A'}</div>
                <div>
                  <strong>{result.groupA.targetCount}</strong> Ziel ·{' '}
                  <strong>{result.groupA.evaluableCount}</strong> auswertbar ·{' '}
                  <strong>{result.groupA.totalOpportunities}</strong> gültig
                  {result.groupA.unclearCount > 0 ? <> · <strong>{result.groupA.unclearCount}</strong> unklar</> : null}
                </div>
                {result.groupA.evaluableCount > 0 && (
                  <div className={rateStyles.liveFraction}>
                    {formatRateFraction(result.groupA.targetCount, result.groupA.evaluableCount)}
                  </div>
                )}
              </div>
              <div className={styles.liveGroup}>
                <div>{comparison.groupB.label || 'Vergleichsgruppe B'}</div>
                <div>
                  <strong>{result.groupB.targetCount}</strong> Ziel ·{' '}
                  <strong>{result.groupB.evaluableCount}</strong> auswertbar ·{' '}
                  <strong>{result.groupB.totalOpportunities}</strong> gültig
                  {result.groupB.unclearCount > 0 ? <> · <strong>{result.groupB.unclearCount}</strong> unklar</> : null}
                </div>
                {result.groupB.evaluableCount > 0 && (
                  <div className={rateStyles.liveFraction}>
                    {formatRateFraction(result.groupB.targetCount, result.groupB.evaluableCount)}
                  </div>
                )}
              </div>
            </div>
            {needA > 0 && (
              <p className={styles.balanceHint}>
                Vergleichsgruppe A braucht noch {needA} Situation{needA === 1 ? '' : 'en'} für den empfohlenen Übungsumfang.
              </p>
            )}
            {needB > 0 && (
              <p className={styles.balanceHint}>
                Vergleichsgruppe B braucht noch {needB} Situation{needB === 1 ? '' : 'en'} für den empfohlenen Übungsumfang.
              </p>
            )}
            {atMin && result.sampleImbalance && (
              <p className={styles.balanceHint}>Die Vergleichsgruppen sind unterschiedlich groß.</p>
            )}

            {stage === 'observe' && collecting && (
              <section className={`${rateStyles.panel} ui-flat-mobile mobile-flatten-card`}>
                <h3 className={rateStyles.panelTitle}>
                  {isEditing ? `Ausgangssituation ${editIndex! + 1} ändern` : `Ausgangssituation #${count + 1}`}
                </h3>
                <p className={rateStyles.lead}>Jede Zeile ist eine gültige Ausgangssituation derselben Messfrage – zugeordnet zu einer Vergleichsgruppe.</p>

                <div className={rateStyles.fieldBlock}>
                  <div className={rateStyles.fieldLabel}>Vergleichsgruppe</div>
                  <div className={styles.cohortChoice}>
                    {(['A', 'B'] as CohortId[]).map((id) => (
                      <button
                        key={id}
                        type="button"
                        className={`${styles.cohortBtn} ${draft.cohortId === id ? styles.cohortBtnActive : ''}`}
                        onClick={() => updateDraft({ cohortId: id })}
                      >
                        {id === 'A' ? comparison.groupA.label || 'Gruppe A' : comparison.groupB.label || 'Gruppe B'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className={rateStyles.fieldBlock}>
                  <div className={rateStyles.fieldLabel}>Wie endete diese Ausgangssituation?</div>
                  <OptionChips
                    name="cohortOpportunityOutcome"
                    options={definition.outcomes.filter((outcome) => outcome.label.trim()).map((outcome) => ({
                      value: outcome.id,
                      label: outcome.id === definition.targetOutcomeId
                        ? `${outcome.label}  ← Zielereignis`
                        : outcome.label,
                      description: outcome.description,
                    }))}
                    value={draft.outcomeId}
                    onChange={(next) => updateDraft({ outcomeId: String(next) })}
                  />
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
                    placeholder="Kurzer Anker, falls nötig"
                    onChange={(event) => updateDraft({ description: event.target.value })}
                  />
                </div>

                <div className={rateStyles.actions}>
                  <button
                    type="button"
                    className={rateStyles.primaryBtn}
                    disabled={!canSaveCohortDraft(draft, definition, cfg.supportsGameClock)}
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
                  comparison={comparison}
                  result={result}
                  sampleLimitNote={cfg.sampleLimitNote}
                />

                <div className={rateStyles.fieldBlock}>
                  <div className={rateStyles.fieldLabel}>Wie vergleichbar waren die beiden Gruppen außer in deiner gewählten Dimension?</div>
                  <OptionChips
                    name="comparability"
                    options={comparabilityOptions()}
                    value={safeAnswers[cfg.comparabilityKey] || ''}
                    onChange={(next) => patchAnswers(safeAnswers, setAnswers, { [cfg.comparabilityKey]: next })}
                  />
                </div>

                <div className={rateStyles.fieldBlock}>
                  <div className={rateStyles.fieldLabel}>
                    Weitere sichtbare Unterschiede zwischen den Vergleichsgruppen (Gegnerdruck, Personal, Spielphase, Spielstand/Zeit, numerische Situation, Zone, Puckkontrolle, Bildqualität, Gruppengröße …)
                  </div>
                  <input
                    className={rateStyles.input}
                    value={safeAnswers[cfg.confounderKey] || ''}
                    maxLength={200}
                    placeholder="z. B. Rechts entstand deutlich mehr Gegnerdruck."
                    onChange={(event) => patchAnswers(safeAnswers, setAnswers, { [cfg.confounderKey]: event.target.value })}
                  />
                </div>

                <div className={rateStyles.fieldBlock}>
                  <div className={rateStyles.fieldLabel}>Wie wirkt der Unterschied in deiner Stichprobe?</div>
                  <OptionChips
                    name="perceivedDifference"
                    options={perceivedDifferenceOptions()}
                    value={safeAnswers[cfg.differenceKey] || ''}
                    onChange={(next) => patchAnswers(safeAnswers, setAnswers, { [cfg.differenceKey]: next })}
                  />
                </div>

                <div className={rateStyles.fieldBlock}>
                  <div className={rateStyles.fieldLabel}>Formuliere den Vergleich in 1–2 Sätzen.</div>
                  <p className={rateStyles.fieldHelp}>{cfg.conclusionHint}</p>
                  <p className={rateStyles.fieldHelp}>{cfg.wordingHelp}</p>
                  <textarea
                    className={rateStyles.textarea}
                    value={safeAnswers[cfg.conclusionKey] || ''}
                    maxLength={500}
                    placeholder="In meinen beobachteten Situationen …"
                    onChange={(event) => patchAnswers(safeAnswers, setAnswers, { [cfg.conclusionKey]: event.target.value })}
                  />
                </div>

                <div className={rateStyles.actions}>
                  <button
                    type="button"
                    className={rateStyles.primaryBtn}
                    disabled={Boolean(validateCohortRateCompareAnswers(cfg, {
                      ...safeAnswers,
                      [cfg.definitionKey]: definition,
                      [cfg.comparisonKey]: comparison,
                      [cfg.logsKey]: observations,
                    }))}
                    onClick={() => {
                      const error = validateCohortRateCompareAnswers(cfg, {
                        ...safeAnswers,
                        [cfg.definitionKey]: definition,
                        [cfg.comparisonKey]: comparison,
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
                  <button type="button" className={rateStyles.secondaryBtn} onClick={() => setStage('compare')}>
                    Vergleich anpassen
                  </button>
                </div>
              </section>
            )}
          </div>

          <aside className={rateStyles.observeSide}>
            <section className={`${rateStyles.panel} ui-flat-mobile mobile-flatten-card`}>
              <h3 className={rateStyles.panelTitle}>Deine Messfrage</h3>
              <p className={rateStyles.lead}>{definition.question}</p>
              <p className={rateStyles.lead}>Vergleich: {comparison.dimensionLabel}</p>
              <OpportunityList
                observations={usable}
                definition={definition}
                badgeFor={(obs) => {
                  const cohort = (obs as CohortOpportunityObservation).cohortId
                  if (cohort === 'A') return comparison.groupA.label || 'A'
                  if (cohort === 'B') return comparison.groupB.label || 'B'
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
  comparison,
  result,
  sampleLimitNote,
  comparability,
  perceivedDifference,
  confounder,
  conclusion,
}: {
  definition: RateDefinition
  comparison: CohortComparison
  result: NonNullable<ReturnType<typeof computeCohortRateCompare>>
  sampleLimitNote: string
  comparability?: string
  perceivedDifference?: string
  confounder?: string
  conclusion?: string
}) {
  const comparabilityLabel = comparabilityOptions().find((item) => item.value === comparability)?.label
  const differenceLabel = perceivedDifferenceOptions().find((item) => item.value === perceivedDifference)?.label

  return (
    <div className={rateStyles.resultStack}>
      <div className={rateStyles.resultBlock}>
        <div className={rateStyles.resultLabel}>Messfrage</div>
        <p className={rateStyles.resultValue}>{definition.question}</p>
      </div>
      <div className={rateStyles.resultBlock}>
        <div className={rateStyles.resultLabel}>Vergleich</div>
        <p className={rateStyles.resultValue}>{comparison.dimensionLabel}</p>
        {comparison.question && <p className={rateStyles.resultValue}>{comparison.question}</p>}
      </div>
      <CohortRateComparison
        groupA={result.groupA}
        groupB={result.groupB}
        percentagePointDifference={result.percentagePointDifference}
        sampleImbalance={result.sampleImbalance}
        showPercents
        showDistributions
      />
      <p className={rateStyles.sampleNote}>{sampleLimitNote}</p>
      {comparabilityLabel && (
        <div className={rateStyles.resultBlock}>
          <div className={rateStyles.resultLabel}>Vergleichbarkeit</div>
          <p className={rateStyles.resultValue}>{comparabilityLabel}</p>
        </div>
      )}
      {confounder && (
        <div className={rateStyles.resultBlock}>
          <div className={rateStyles.resultLabel}>Weitere sichtbare Kontextunterschiede</div>
          <p className={rateStyles.resultValue}>{confounder}</p>
        </div>
      )}
      {differenceLabel && (
        <div className={rateStyles.resultBlock}>
          <div className={rateStyles.resultLabel}>Beobachteter Unterschied</div>
          <p className={rateStyles.resultValue}>{differenceLabel}</p>
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
