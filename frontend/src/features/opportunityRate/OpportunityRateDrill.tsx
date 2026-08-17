import type { Drill } from '../../api'
import { DrillGuideCard } from '../../components/DrillGuideCard'
import { OptionChips } from '../patternLog/OptionChips'
import { SCENE_PERIOD_OPTIONS, formatGameTimeInput } from '../../utils/sceneHelpers'
import { OpportunityList } from './OpportunityList'
import { OutcomeDistribution } from './OutcomeDistribution'
import { RateDefinitionFields, RateExamplesAccordion } from './RateDefinitionFields'
import {
  canAddOpportunity,
  canEvaluate,
  canSaveOpportunityDraft,
  clarityOptions,
  cloneDefinition,
  computeOpportunityRate,
  countOnlyOptions,
  createObservationId,
  emptyOpportunityDraft,
  ensureUnclearOutcome,
  formatRateFraction,
  readStage,
  removeObservationAt,
  resolveOpportunityRateConfig,
  templatesForConfig,
  validObservations,
  validateOpportunityRateAnswers,
} from './rateLogic'
import type {
  OpportunityDraft,
  OpportunityObservation,
  OpportunityRateStage,
  RateDefinition,
} from './types'
import styles from './OpportunityRateDrill.module.css'

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

export function OpportunityRateDrill({ drill, answers, setAnswers }: Props) {
  const safeAnswers = answers || {}
  const cfg = resolveOpportunityRateConfig(drill?.config || {})
  const stage = readStage(safeAnswers, cfg.stageKey)
  const definition = (safeAnswers[cfg.definitionKey] || null) as RateDefinition | null
  const observations: OpportunityObservation[] = Array.isArray(safeAnswers[cfg.logsKey])
    ? safeAnswers[cfg.logsKey]
    : []
  const usable = validObservations(observations)
  const draft: OpportunityDraft = {
    ...emptyOpportunityDraft(),
    ...(safeAnswers[cfg.draftKey] || {}),
  }
  const editIndexRaw = safeAnswers[cfg.editIndexKey]
  const editIndex = typeof editIndexRaw === 'number' ? editIndexRaw : null
  const addingMore = safeAnswers[cfg.addingMoreKey] === true
  const count = usable.length
  const atMin = canEvaluate(count, cfg.minObservations)
  const atMax = !canAddOpportunity(count, cfg.maxObservations)
  const isEditing = editIndex !== null && editIndex >= 0 && editIndex < observations.length
  const collecting = Boolean(definition) && (isEditing || count < cfg.minObservations || (addingMore && !atMax))
  const templates = templatesForConfig(cfg)
  const result = definition ? computeOpportunityRate(definition, observations, cfg.unclearOutcomeId) : null
  const showLiveDistribution = Boolean(result && count >= 3)
  const progressGoal = count >= cfg.recommendedObservations ? cfg.maxObservations : cfg.recommendedObservations
  const progressPercent = Math.min(100, Math.round((count / progressGoal) * 100))
  const guide = drill?.didactics?.observation_guide
  const clarity = String(safeAnswers[cfg.clarityKey] || '')
  const showClarityHint = clarity === 'partly' || clarity === 'no'
  const isComplete = stage === 'complete'

  const setStage = (next: OpportunityRateStage, extra: Record<string, any> = {}) => {
    patchAnswers(safeAnswers, setAnswers, {
      ...extra,
      [cfg.stageKey]: next,
    })
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

  const updateDraft = (patch: Partial<OpportunityDraft>) => {
    patchAnswers(safeAnswers, setAnswers, {
      [cfg.draftKey]: { ...draft, ...patch },
    })
  }

  const clearDraft = (extra: Record<string, any> = {}) => {
    patchAnswers(safeAnswers, setAnswers, {
      ...extra,
      [cfg.draftKey]: emptyOpportunityDraft(),
      [cfg.editIndexKey]: null,
      [cfg.addingMoreKey]: false,
    })
  }

  const saveObservation = () => {
    if (!definition || !canSaveOpportunityDraft(draft, definition, cfg.supportsGameClock)) return
    if (isEditing) {
      const current = observations[editIndex!]
      if (!current) return
      const nextObs: OpportunityObservation = {
        ...current,
        outcomeId: draft.outcomeId,
        period: draft.period || undefined,
        gameClock: draft.gameClock.trim() || undefined,
        description: String(draft.description || '').trim() || undefined,
        sceneId: draft.sceneId.trim() || undefined,
        validOpportunity: true,
      }
      const nextLogs = observations.map((obs, idx) => (idx === editIndex ? nextObs : obs))
      clearDraft({ [cfg.logsKey]: nextLogs, [cfg.stageKey]: 'observe' })
      return
    }
    if (atMax) return
    const nextObs: OpportunityObservation = {
      id: createObservationId(),
      order: count + 1,
      outcomeId: draft.outcomeId,
      period: draft.period || undefined,
      gameClock: draft.gameClock.trim() || undefined,
      description: String(draft.description || '').trim() || undefined,
      sceneId: draft.sceneId.trim() || undefined,
      validOpportunity: true,
      createdAt: new Date().toISOString(),
    }
    const nextLogs = [...usable, nextObs].map((obs, idx) => ({ ...obs, order: idx + 1 }))
    clearDraft({ [cfg.logsKey]: nextLogs, [cfg.stageKey]: 'observe' })
  }

  const startEdit = (index: number) => {
    const obs = usable[index]
    if (!obs) return
    const rawIndex = observations.findIndex((item) => item.id === obs.id)
    patchAnswers(safeAnswers, setAnswers, {
      [cfg.editIndexKey]: rawIndex >= 0 ? rawIndex : index,
      [cfg.draftKey]: {
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
    const nextLogs = removeObservationAt(observations, rawIndex >= 0 ? rawIndex : index)
    const clearingEdit = editIndex === rawIndex
    patchAnswers(safeAnswers, setAnswers, {
      [cfg.logsKey]: nextLogs,
      ...(clearingEdit
        ? { [cfg.draftKey]: emptyOpportunityDraft(), [cfg.editIndexKey]: null, [cfg.addingMoreKey]: false }
        : editIndex !== null && rawIndex >= 0 && editIndex > rawIndex
          ? { [cfg.editIndexKey]: editIndex - 1 }
          : {}),
      [cfg.stageKey]: validObservations(nextLogs).length >= cfg.minObservations ? stage : 'observe',
    })
  }

  if (isComplete && definition && result) {
    return (
      <div className={styles.drillRoot}>
        <span className={styles.completeBadge}>✓ Opportunity-Rate abgeschlossen</span>
        <ResultSummary
          question={definition.question}
          result={result}
          sampleLimitNote={cfg.sampleLimitNote}
          conclusion={String(safeAnswers[cfg.conclusionKey] || '')}
        />
        <div className={styles.actions}>
          <button type="button" className={styles.secondaryBtn} onClick={() => setStage('review')}>
            Bearbeiten
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.drillRoot}>
      <p className={styles.eyebrow}>Opportunity → Event → Rate</p>
      <h2 className={styles.title}>{drill.title}</h2>
      {drill.description && <p className={styles.lead}>{drill.description}</p>}
      {drill.didactics?.explanation && <p className={styles.lead}>{drill.didactics.explanation}</p>}
      <p className={styles.rule}>{cfg.decisionRule}</p>
      <p className={styles.hint}>{cfg.coreHint}</p>
      {guide && <DrillGuideCard guide={guide} />}
      {cfg.examplesHelp && <RateExamplesAccordion help={cfg.examplesHelp} />}

      {stage === 'define' && (
        <RateDefinitionFields
          definition={definition}
          templates={templates}
          allowTemplates={cfg.allowTemplates}
          allowCustomDefinition={cfg.allowCustomDefinition}
          unclearOutcomeId={cfg.unclearOutcomeId}
          onChange={setDefinition}
          continueLabel="Beobachtung starten"
          onContinue={(next) => {
            setStage('observe', { [cfg.definitionKey]: cloneDefinition(next, cfg.unclearOutcomeId) })
          }}
        />
      )}

      {stage !== 'define' && definition && result && (
        <div className={styles.observeLayout}>
          <div className={styles.observeMain}>
            <div className={styles.progress}>
              <div className={styles.progressMeta}>
                <span>{count} / {progressGoal} Opportunities</span>
                {atMin && <span>Genug für erste Auswertung</span>}
              </div>
              <div className={styles.progressBar} aria-hidden>
                <div className={styles.progressFill} style={{ width: `${progressPercent}%` }} />
              </div>
            </div>

            <div className={styles.liveCounts}>
              <div><strong>{result.totalOpportunities}</strong> Opportunities</div>
              <div><strong>{result.targetCount}</strong> Target Events</div>
              {count > 0 && (
                <div className={styles.liveFraction}>{formatRateFraction(result.targetCount, result.totalOpportunities)}</div>
              )}
            </div>

            {stage === 'observe' && collecting && (
              <section className={`${styles.panel} ui-flat-mobile mobile-flatten-card`}>
                <h3 className={styles.panelTitle}>
                  {isEditing ? `Opportunity ${editIndex! + 1} ändern` : 'Neue Opportunity'}
                </h3>
                <p className={styles.lead}>Jede gespeicherte Zeile ist eine Opportunity – nicht nur ein Target Event.</p>

                <div className={styles.fieldBlock}>
                  <div className={styles.fieldLabel}>Wie endete diese Opportunity?</div>
                  <OptionChips
                    name="opportunityOutcome"
                    options={definition.outcomes.filter((outcome) => outcome.label.trim()).map((outcome) => ({
                      value: outcome.id,
                      label: outcome.id === definition.targetOutcomeId
                        ? `${outcome.label}  ← Target`
                        : outcome.label,
                      description: outcome.description,
                    }))}
                    value={draft.outcomeId}
                    onChange={(next) => updateDraft({ outcomeId: String(next) })}
                  />
                </div>

                {cfg.supportsGameClock && (
                  <div className={styles.row2}>
                    <div className={styles.fieldBlock}>
                      <div className={styles.fieldLabel}>Drittel (optional)</div>
                      <select
                        className={styles.select}
                        value={draft.period}
                        onChange={(event) => updateDraft({ period: event.target.value })}
                      >
                        <option value="">—</option>
                        {SCENE_PERIOD_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className={styles.fieldBlock}>
                      <div className={styles.fieldLabel}>Spieluhr (optional)</div>
                      <input
                        className={styles.input}
                        value={draft.gameClock}
                        placeholder="z. B. 12:43"
                        onChange={(event) => updateDraft({ gameClock: formatGameTimeInput(event.target.value) })}
                      />
                    </div>
                  </div>
                )}

                <div className={styles.fieldBlock}>
                  <div className={styles.fieldLabel}>Kurznotiz (optional)</div>
                  <input
                    className={styles.input}
                    value={draft.description}
                    maxLength={160}
                    placeholder="Kurzer Anker, falls nötig"
                    onChange={(event) => updateDraft({ description: event.target.value })}
                  />
                </div>

                <div className={styles.actions}>
                  <button
                    type="button"
                    className={styles.primaryBtn}
                    disabled={!canSaveOpportunityDraft(draft, definition, cfg.supportsGameClock)}
                    onClick={saveObservation}
                  >
                    {isEditing ? 'Opportunity speichern' : 'Opportunity speichern'}
                  </button>
                  {isEditing && (
                    <button type="button" className={styles.secondaryBtn} onClick={() => clearDraft()}>
                      Abbrechen
                    </button>
                  )}
                </div>
              </section>
            )}

            {stage === 'observe' && atMin && !collecting && (
              <div className={styles.actions}>
                <button type="button" className={styles.primaryBtn} onClick={() => setStage('review')}>
                  Auswerten
                </button>
                {!atMax && (
                  <button
                    type="button"
                    className={styles.secondaryBtn}
                    onClick={() => patchAnswers(safeAnswers, setAnswers, { [cfg.addingMoreKey]: true })}
                  >
                    + Weitere Opportunity
                  </button>
                )}
              </div>
            )}

            {stage === 'review' && (
              <section className={`${styles.panel} ui-flat-mobile mobile-flatten-card`}>
                <ResultSummary
                  question={definition.question}
                  result={result}
                  sampleLimitNote={cfg.sampleLimitNote}
                />

                <div className={styles.fieldBlock}>
                  <div className={styles.fieldLabel}>Was hätte dir gefehlt, wenn du nur das Target Event gezählt hättest?</div>
                  <OptionChips
                    name="countOnlyReflection"
                    options={countOnlyOptions()}
                    value={safeAnswers[cfg.countOnlyKey] || ''}
                    onChange={(next) => patchAnswers(safeAnswers, setAnswers, { [cfg.countOnlyKey]: next })}
                  />
                </div>

                <div className={styles.fieldBlock}>
                  <div className={styles.fieldLabel}>War deine Opportunity-Definition während der Beobachtung eindeutig?</div>
                  <OptionChips
                    name="opportunityDefinitionClarity"
                    options={clarityOptions()}
                    value={clarity}
                    onChange={(next) => patchAnswers(safeAnswers, setAnswers, { [cfg.clarityKey]: next })}
                  />
                </div>

                {showClarityHint && (
                  <p className={styles.hint}>
                    Eine Rate wird nur so gut wie ihr Nenner. Wenn ähnliche Situationen unterschiedlich ein- oder ausgeschlossen werden, wird der Vergleich unsauber.
                  </p>
                )}

                <div className={styles.fieldBlock}>
                  <div className={styles.fieldLabel}>Formuliere dein Ergebnis in einem Satz.</div>
                  <p className={styles.fieldHelp}>{cfg.conclusionHint}</p>
                  <textarea
                    className={styles.textarea}
                    value={safeAnswers[cfg.conclusionKey] || ''}
                    maxLength={400}
                    placeholder="In meinen beobachteten Situationen …"
                    onChange={(event) => patchAnswers(safeAnswers, setAnswers, { [cfg.conclusionKey]: event.target.value })}
                  />
                </div>

                <div className={styles.actions}>
                  <button
                    type="button"
                    className={styles.primaryBtn}
                    disabled={Boolean(validateOpportunityRateAnswers(cfg, {
                      ...safeAnswers,
                      [cfg.definitionKey]: definition,
                      [cfg.logsKey]: observations,
                    }))}
                    onClick={() => {
                      const error = validateOpportunityRateAnswers(cfg, {
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
                  <button type="button" className={styles.secondaryBtn} onClick={() => setStage('observe')}>
                    Zurück zur Beobachtung
                  </button>
                  <button type="button" className={styles.secondaryBtn} onClick={() => setStage('define')}>
                    Definition anpassen
                  </button>
                </div>
              </section>
            )}
          </div>

          <aside className={styles.observeSide}>
            <section className={`${styles.panel} ui-flat-mobile mobile-flatten-card`}>
              <h3 className={styles.panelTitle}>Deine Messfrage</h3>
              <p className={styles.lead}>{definition.question}</p>
              {showLiveDistribution && (
                <OutcomeDistribution items={result.distributionItems} total={result.totalOpportunities} compact />
              )}
              <OpportunityList
                observations={usable}
                definition={definition}
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
  question,
  result,
  sampleLimitNote,
  conclusion,
}: {
  question: string
  result: NonNullable<ReturnType<typeof computeOpportunityRate>>
  sampleLimitNote: string
  conclusion?: string
}) {
  return (
    <div className={styles.resultStack}>
      <div className={styles.resultBlock}>
        <div className={styles.resultLabel}>Deine Messfrage</div>
        <p className={styles.resultValue}>{question}</p>
      </div>
      <div className={styles.resultBlock}>
        <div className={styles.resultLabel}>Stichprobe</div>
        <p className={styles.resultValue}>{result.totalOpportunities} Opportunities</p>
      </div>
      <div className={styles.resultBlock}>
        <div className={styles.resultLabel}>Ergebnis</div>
        <p className={styles.rateHero}>
          <span>{formatRateFraction(result.targetCount, result.totalOpportunities)}</span>
          <span>{result.ratePercent} %</span>
        </p>
        {result.unclearCount > 0 && (
          <p className={styles.unclearNote}>{result.unclearCount} Outcome unklar – bleibt im Nenner.</p>
        )}
      </div>
      <div className={styles.resultBlock}>
        <div className={styles.resultLabel}>Verteilung</div>
        <OutcomeDistribution items={result.distributionItems} total={result.totalOpportunities} />
      </div>
      <p className={styles.sampleNote}>{sampleLimitNote}</p>
      {conclusion && (
        <div className={styles.resultBlock}>
          <div className={styles.resultLabel}>Deine Aussage</div>
          <p className={styles.resultValue}>{conclusion}</p>
        </div>
      )}
    </div>
  )
}
