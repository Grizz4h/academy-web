import type { Drill } from '../../api'
import { DrillGuideCard } from '../../components/DrillGuideCard'
import { OptionChips } from '../patternLog/OptionChips'
import { SCENE_PERIOD_OPTIONS, formatGameTimeInput } from '../../utils/sceneHelpers'
import { CuePriorityPanel } from '../cuePriority/CuePriorityPanel'
import {
  assignCuePriority,
  cuePriorityLabel,
  cueReviewOptions,
  labeledCues,
} from '../cuePriority/cueLogic'
import type { CueReviewJudgement } from '../cuePriority/types'
import { ScenarioBranchMap } from '../scenarioBranches/ScenarioBranchMap'
import { ScenarioBranchPanel } from '../scenarioBranches/ScenarioBranchPanel'
import {
  alternativeOccurredOptions,
  formatTriggerLine,
  linearThinkingOptions,
  triggerRelevantOptions,
  usedTriggerDescriptions,
} from '../scenarioBranches/branchLogic'
import type { BranchTrigger } from '../scenarioBranches/types'
import { PredictionUpdatePanel } from '../predictionUpdate/PredictionUpdatePanel'
import {
  updateDecisionOptions,
  updateQualityOptions,
  usedUpdateTriggerDescriptions,
  updateDecisionLabel,
  updateQualityLabel,
} from '../predictionUpdate/updateLogic'
import type { UpdateDecision, UpdateQuality } from '../predictionUpdate/types'
import { AnticipationReadSummary } from './AnticipationReadSummary'
import {
  NONE_REFLECTION_ID,
  OTHER_ACTION_ID,
  UNCLEAR_REFLECTION_ID,
  actionChoiceOptions,
  canAddCue,
  canAddRead,
  canEvaluate,
  canSaveActualStep,
  canSaveAlternativeStep,
  canSaveBranchReviewStep,
  canSaveCueReviewStep,
  canSaveExpectStep,
  canSavePrioritizeStep,
  canSaveQualityStep,
  canSaveTriggersStep,
  canSaveUpdateDecideStep,
  canSaveUpdateInfoStep,
  canSaveUpdateReviewStep,
  computeAnticipationReadResult,
  confidenceLabel,
  confidenceOptions,
  createCueId,
  cueCategoryLabel,
  draftToObservation,
  emptyAnticipationDraft,
  emptyCue,
  formatReadMeta,
  isOtherActionSelected,
  nextAnticipationStep,
  normalizeCues,
  observationToDraft,
  outcomeMatchLabel,
  outcomeMatchOptions,
  overconfidenceOptions,
  readDraftStep,
  readQualityLabel,
  readQualityOptions,
  readStage,
  removeObservationAt,
  resolveAnticipationReadConfig,
  strongMismatchReads,
  usedCueCategories,
  validateAnticipationReadAnswers,
} from './readLogic'
import type {
  AnticipationCue,
  AnticipationDraft,
  AnticipationDraftStep,
  AnticipationExamplesHelp,
  AnticipationObservation,
  AnticipationReadStage,
} from './types'
import styles from './AnticipationReadDrill.module.css'

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

function SceneExamples({ help }: { help: AnticipationExamplesHelp }) {
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

function LockedLine({ label, value }: { label: string; value?: string }) {
  if (!value) return null
  return (
    <div className={styles.locked}>
      <div className={styles.lockedLabel}>{label}</div>
      <p className={styles.lockedValue}>{value}</p>
    </div>
  )
}

export function AnticipationReadDrill({ drill, answers, setAnswers }: Props) {
  const safeAnswers = answers || {}
  const cfg = resolveAnticipationReadConfig(drill?.config || {})
  const stage = readStage(safeAnswers, cfg.stageKey)
  const observations: AnticipationObservation[] = Array.isArray(safeAnswers[cfg.logsKey])
    ? safeAnswers[cfg.logsKey]
    : []
  const draft: AnticipationDraft = {
    ...emptyAnticipationDraft(),
    ...(safeAnswers[cfg.draftKey] || {}),
    cues: Array.isArray(safeAnswers[cfg.draftKey]?.cues)
      ? safeAnswers[cfg.draftKey].cues
      : emptyAnticipationDraft().cues,
    triggers: Array.isArray(safeAnswers[cfg.draftKey]?.triggers)
      ? safeAnswers[cfg.draftKey].triggers
      : emptyAnticipationDraft().triggers,
    updateTriggers: Array.isArray(safeAnswers[cfg.draftKey]?.updateTriggers)
      ? safeAnswers[cfg.draftKey].updateTriggers
      : emptyAnticipationDraft().updateTriggers,
  }
  const step = readDraftStep(draft)
  const editIndexRaw = safeAnswers[cfg.editIndexKey]
  const editIndex = typeof editIndexRaw === 'number' ? editIndexRaw : null
  const addingMore = safeAnswers[cfg.addingMoreKey] === true
  const count = observations.length
  const atMin = canEvaluate(count, cfg.minReads)
  const atMax = !canAddRead(count, cfg.maxReads)
  const isEditing = editIndex !== null && editIndex >= 0 && editIndex < observations.length
  const collecting = isEditing || count < cfg.minReads || (addingMore && !atMax)
  const result = computeAnticipationReadResult(observations, {
    selectedStrongReadDespiteMismatchId: String(safeAnswers[cfg.strongMismatchKey] || '') || undefined,
    mostHelpfulCueCategory: String(safeAnswers[cfg.helpfulCueKey] || '') || undefined,
    overconfidenceAssessment: safeAnswers[cfg.overconfidenceKey] || undefined,
    overweightedCueCategory: String(safeAnswers[cfg.overweightedCueKey] || '') || undefined,
    futureCueCategory: String(safeAnswers[cfg.futureCueKey] || '') || undefined,
    importantAlternativeReadId: String(safeAnswers[cfg.importantAlternativeKey] || '') || undefined,
    strongestTriggerDescription: String(safeAnswers[cfg.strongestTriggerKey] || '') || undefined,
    linearThinkingAssessment: safeAnswers[cfg.linearThinkingKey] || undefined,
    successfulUpdateReadId: String(safeAnswers[cfg.successfulUpdateKey] || '') || undefined,
    heldTooLongReadId: String(safeAnswers[cfg.heldTooLongKey] || '') || undefined,
    strongestUpdateInfo: String(safeAnswers[cfg.strongestUpdateInfoKey] || '') || undefined,
  })
  const progressGoal = count >= cfg.recommendedReads ? cfg.maxReads : cfg.recommendedReads
  const progressPercent = Math.min(100, Math.round((count / progressGoal) * 100))
  const guide = drill?.didactics?.observation_guide
  const actionOptions = actionChoiceOptions(cfg)
  const isComplete = stage === 'complete'
  const expectReady = canSaveExpectStep(draft, cfg)
  const prioritizeReady = canSavePrioritizeStep(draft, cfg)
  const alternativeReady = canSaveAlternativeStep(draft, cfg)
  const triggersReady = canSaveTriggersStep(draft, cfg)
  const actualReady = canSaveActualStep(draft, cfg)
  const qualityReady = canSaveQualityStep(draft)
  const cueReviewReady = canSaveCueReviewStep(draft, cfg)
  const branchReviewReady = canSaveBranchReviewStep(draft, cfg)
  const updateInfoReady = canSaveUpdateInfoStep(draft, cfg)
  const updateDecideReady = canSaveUpdateDecideStep(draft, cfg)
  const updateReviewReady = canSaveUpdateReviewStep(draft, cfg)

  const setStage = (next: AnticipationReadStage, extra: Record<string, any> = {}) => {
    const extras = {
      selectedStrongReadDespiteMismatchId: String(safeAnswers[cfg.strongMismatchKey] || extra[cfg.strongMismatchKey] || '') || undefined,
      mostHelpfulCueCategory: String(safeAnswers[cfg.helpfulCueKey] || extra[cfg.helpfulCueKey] || '') || undefined,
      overconfidenceAssessment: extra[cfg.overconfidenceKey] || safeAnswers[cfg.overconfidenceKey] || undefined,
      overweightedCueCategory: String(safeAnswers[cfg.overweightedCueKey] || extra[cfg.overweightedCueKey] || '') || undefined,
      futureCueCategory: String(safeAnswers[cfg.futureCueKey] || extra[cfg.futureCueKey] || '') || undefined,
      importantAlternativeReadId: String(safeAnswers[cfg.importantAlternativeKey] || extra[cfg.importantAlternativeKey] || '') || undefined,
      strongestTriggerDescription: String(safeAnswers[cfg.strongestTriggerKey] || extra[cfg.strongestTriggerKey] || '') || undefined,
      linearThinkingAssessment: extra[cfg.linearThinkingKey] || safeAnswers[cfg.linearThinkingKey] || undefined,
      successfulUpdateReadId: String(safeAnswers[cfg.successfulUpdateKey] || extra[cfg.successfulUpdateKey] || '') || undefined,
      heldTooLongReadId: String(safeAnswers[cfg.heldTooLongKey] || extra[cfg.heldTooLongKey] || '') || undefined,
      strongestUpdateInfo: String(safeAnswers[cfg.strongestUpdateInfoKey] || extra[cfg.strongestUpdateInfoKey] || '') || undefined,
    }
    patchAnswers(safeAnswers, setAnswers, {
      ...extra,
      [cfg.stageKey]: next,
      ...(next === 'complete'
        ? { [cfg.resultKey]: computeAnticipationReadResult(observations, extras) }
        : {}),
    })
  }

  const updateDraft = (patch: Partial<AnticipationDraft>) => {
    patchAnswers(safeAnswers, setAnswers, {
      [cfg.draftKey]: { ...draft, ...patch },
    })
  }

  const setDraftStep = (next: AnticipationDraftStep) => {
    updateDraft({ step: next })
  }

  const clearDraft = (extra: Record<string, any> = {}) => {
    patchAnswers(safeAnswers, setAnswers, {
      ...extra,
      [cfg.draftKey]: emptyAnticipationDraft(),
      [cfg.editIndexKey]: null,
      [cfg.addingMoreKey]: false,
    })
  }

  const setAction = (side: 'expected' | 'actual' | 'alternative' | 'updated', optionId: string) => {
    const usingOther = isOtherActionSelected(optionId, cfg.expectedActionOptions)
    const previous = side === 'expected'
      ? draft.expectedAction
      : side === 'alternative'
        ? draft.alternativeAction
        : side === 'updated'
          ? draft.updatedPrediction
          : draft.actualAction
    const nextText = usingOther
      ? (cfg.expectedActionOptions.includes(previous) ? '' : previous)
      : optionId
    if (side === 'expected') {
      updateDraft({ expectedActionOptionId: optionId, expectedAction: nextText })
      return
    }
    if (side === 'alternative') {
      updateDraft({ alternativeActionOptionId: optionId, alternativeAction: nextText })
      return
    }
    if (side === 'updated') {
      updateDraft({ updatedPredictionOptionId: optionId, updatedPrediction: nextText })
      return
    }
    updateDraft({ actualActionOptionId: optionId, actualAction: nextText })
  }

  const updateCue = (cueId: string, patch: Partial<AnticipationCue>) => {
    updateDraft({
      cues: draft.cues.map((cue) => (cue.id === cueId ? { ...cue, ...patch } : cue)),
    })
  }

  const addCue = () => {
    if (!canAddCue(draft.cues.length, cfg.maxCues)) return
    updateDraft({
      cues: [...draft.cues, emptyCue(cfg.cueCategories[0] || 'other')],
    })
  }

  const removeCue = (cueId: string) => {
    const next = draft.cues.filter((cue) => cue.id !== cueId)
    updateDraft({
      cues: next.length ? next : [{ ...emptyCue(cfg.cueCategories[0] || 'other'), id: createCueId() }],
    })
  }

  const saveObservation = () => {
    const existing = isEditing ? observations[editIndex!] : null
    const nextObs = draftToObservation(draft, cfg, existing, isEditing ? existing?.order || count : count + 1)
    if (!nextObs) return
    if (!isEditing && atMax) return
    const nextLogs = isEditing
      ? observations.map((obs, idx) => (idx === editIndex ? nextObs : obs))
      : [...observations, nextObs].map((obs, idx) => ({ ...obs, order: idx + 1 }))
    clearDraft({ [cfg.logsKey]: nextLogs, [cfg.stageKey]: 'observe' })
  }

  const goNextFrom = (current: AnticipationDraftStep) => {
    const next = nextAnticipationStep(current, cfg)
    if (next === 'save') {
      saveObservation()
      return
    }
    setDraftStep(next)
  }

  const nextLabel = (current: AnticipationDraftStep): string => {
    const next = nextAnticipationStep(current, cfg)
    if (next === 'save') return isEditing ? 'Erwartung speichern' : 'Erwartung speichern'
    if (next === 'prioritize') return 'Weiter zur Gewichtung'
    if (next === 'alternative') return 'Weiter zum Alternativszenario'
    if (next === 'triggers') return 'Weiter zu den Auslösern'
    if (next === 'actual') return 'Weiter zur tatsächlichen Aktion'
    if (next === 'quality') return 'Weiter zur Nachprüfung der Begründung'
    if (next === 'cueReview') return 'Weiter zur Hinweis-Nachprüfung'
    if (next === 'branchReview') return 'Weiter zum Branch-Check'
    if (next === 'updateInfo') return 'Weiter zur neuen Information'
    if (next === 'updateDecide') return 'Weiter zur Update-Entscheidung'
    if (next === 'updateReview') return 'Weiter zum Timing'
    return 'Weiter'
  }

  const startEdit = (index: number) => {
    const obs = observations[index]
    if (!obs) return
    patchAnswers(safeAnswers, setAnswers, {
      [cfg.editIndexKey]: index,
      [cfg.draftKey]: observationToDraft(obs, cfg.expectedActionOptions),
      [cfg.stageKey]: 'observe',
      [cfg.addingMoreKey]: true,
    })
  }

  const removeObservation = (index: number) => {
    const nextLogs = removeObservationAt(observations, index)
    const clearingEdit = editIndex === index
    patchAnswers(safeAnswers, setAnswers, {
      [cfg.logsKey]: nextLogs,
      ...(clearingEdit
        ? { [cfg.draftKey]: emptyAnticipationDraft(), [cfg.editIndexKey]: null, [cfg.addingMoreKey]: false }
        : editIndex !== null && editIndex > index
          ? { [cfg.editIndexKey]: editIndex - 1 }
          : {}),
      [cfg.stageKey]: nextLogs.length >= cfg.minReads ? stage : 'observe',
    })
  }

  const mismatchChoices = [
    ...strongMismatchReads(observations).map((obs) => ({
      value: obs.id,
      label: `${formatReadMeta(obs)} · ${obs.expectedAction} → ${obs.actualAction}`,
    })),
    { value: NONE_REFLECTION_ID, label: 'keiner' },
    { value: UNCLEAR_REFLECTION_ID, label: 'unklar' },
  ]
  const helpfulCueChoices = usedCueCategories(observations).map((category) => ({
    value: category,
    label: cueCategoryLabel(category),
  }))
  const cueChoices = [
    ...helpfulCueChoices,
    { value: NONE_REFLECTION_ID, label: 'keiner' },
    { value: UNCLEAR_REFLECTION_ID, label: 'unklar' },
  ]
  const futureCueChoices = cfg.cueCategories.map((category) => ({
    value: category,
    label: cueCategoryLabel(category),
  }))
  const alternativeReadChoices = [
    ...observations.map((obs) => ({
      value: obs.id,
      label: `${formatReadMeta(obs)} · ${obs.expectedAction}${obs.alternativeAction ? ` / ${obs.alternativeAction}` : ''}`,
    })),
    { value: NONE_REFLECTION_ID, label: 'keiner' },
    { value: UNCLEAR_REFLECTION_ID, label: 'unklar' },
  ]
  const strongestTriggerChoices = [
    ...usedTriggerDescriptions(observations).map((description) => ({
      value: description,
      label: description,
    })),
    { value: NONE_REFLECTION_ID, label: 'keiner' },
    { value: UNCLEAR_REFLECTION_ID, label: 'unklar' },
  ]
  const reviewError = stage === 'review' ? validateAnticipationReadAnswers(cfg, safeAnswers) : null
  const primaryAction = draft.expectedAction || draft.expectedActionOptionId
  const alternativeAction = draft.alternativeAction || draft.alternativeActionOptionId
  const triggerLines = (draft.triggers || [])
    .map((trigger) => formatTriggerLine(trigger, cueCategoryLabel))
    .filter(Boolean)
  const updateTriggerLines = (draft.updateTriggers || [])
    .map((trigger) => formatTriggerLine(trigger, cueCategoryLabel))
    .filter(Boolean)
  const updateReadChoices = [
    ...observations.map((obs) => ({
      value: obs.id,
      label: `${formatReadMeta(obs)} · ${obs.expectedAction}${obs.updatedPrediction && obs.updateDecision === 'change' ? ` → ${obs.updatedPrediction}` : ''}`,
    })),
    { value: NONE_REFLECTION_ID, label: 'keiner' },
    { value: UNCLEAR_REFLECTION_ID, label: 'unklar' },
  ]
  const strongestUpdateInfoChoices = [
    ...usedUpdateTriggerDescriptions(observations).map((description) => ({
      value: description,
      label: description,
    })),
    { value: NONE_REFLECTION_ID, label: 'keiner' },
    { value: UNCLEAR_REFLECTION_ID, label: 'unklar' },
  ]

  const renderActionField = (
    side: 'expected' | 'actual' | 'alternative' | 'updated',
    optionId: string,
    freeText: string,
    question: string,
  ) => (
    <div className={styles.fieldBlock}>
      <div className={styles.fieldLabel}>{question}</div>
      {actionOptions.length > 0 ? (
        <OptionChips
          name={`${side}Action`}
          options={actionOptions}
          value={optionId || (freeText && isOtherActionSelected(optionId, cfg.expectedActionOptions) ? OTHER_ACTION_ID : '')}
          onChange={(next) => setAction(side, String(next))}
        />
      ) : null}
      {(actionOptions.length === 0 || isOtherActionSelected(optionId, cfg.expectedActionOptions)) && (
        <input
          className={styles.input}
          value={freeText}
          maxLength={80}
          placeholder="Konkrete nächste Aktion"
          onChange={(event) => updateDraft(
            side === 'expected'
              ? { expectedAction: event.target.value, expectedActionOptionId: actionOptions.length ? OTHER_ACTION_ID : '' }
              : side === 'alternative'
                ? { alternativeAction: event.target.value, alternativeActionOptionId: actionOptions.length ? OTHER_ACTION_ID : '' }
                : side === 'updated'
                  ? { updatedPrediction: event.target.value, updatedPredictionOptionId: actionOptions.length ? OTHER_ACTION_ID : '' }
                  : { actualAction: event.target.value, actualActionOptionId: actionOptions.length ? OTHER_ACTION_ID : '' },
          )}
        />
      )}
      {side === 'expected' && (
        <p className={styles.fieldHelp}>
          {cfg.supportsPredictionUpdate
            ? 'Erste Einschätzung – du darfst sie später aktualisieren.'
            : cfg.supportsScenarioBranches
              ? 'Deine Hauptoption – was passiert wahrscheinlich?'
              : 'Wähle die Aktion, die du aktuell für am wahrscheinlichsten hältst.'}
        </p>
      )}
      {side === 'alternative' && (
        <p className={styles.fieldHelp}>Nicht fünf Möglichkeiten – die wahrscheinlichste andere Entwicklung.</p>
      )}
      {side === 'updated' && (
        <p className={styles.fieldHelp}>Was ist jetzt wahrscheinlicher?</p>
      )}
    </div>
  )

  const completeLabel = cfg.supportsPredictionUpdate
    ? '✓ Erwartung aktualisieren abgeschlossen'
    : cfg.supportsScenarioBranches
      ? '✓ Alternativszenarien abgeschlossen'
      : cfg.supportsCuePriority
        ? '✓ Hinweisrollen abgeschlossen'
        : '✓ Situationslesen abgeschlossen'

  const eyebrow = cfg.supportsPredictionUpdate
    ? 'Situation → Erwartung → Neue Information → Aktualisieren → Aktion'
    : cfg.supportsScenarioBranches
      ? 'Situation → Primäre Erwartung → Alternativszenario → Auslöser → Aktion'
      : cfg.supportsCuePriority
        ? 'Situation → Erwartung → Hinweise → Rollen → Aktion'
        : 'Situation → Erwartung → Hinweise → Aktion'

  if (isComplete) {
    return (
      <div className={styles.drillRoot}>
        <span className={styles.completeBadge}>
          {completeLabel}
        </span>
        <AnticipationReadSummary result={result} categoryLabel={cueCategoryLabel} />
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
      <p className={styles.eyebrow}>
        {eyebrow}
      </p>
      <h2 className={styles.title}>{drill.title}</h2>
      {drill.description && <p className={styles.lead}>{drill.description}</p>}
      <p className={styles.lead}>{cfg.introText}</p>
      <p className={styles.rule}>{cfg.decisionRule}</p>
      <p className={styles.hint}>{cfg.coreHint}</p>
      {guide && <DrillGuideCard guide={guide} />}
      {cfg.examplesHelp && <SceneExamples help={cfg.examplesHelp} />}

      <div className={styles.progress}>
        <div className={styles.progressMeta}>
          <span>{count} / {progressGoal} Erwartungen</span>
          {atMin && <span>Du hast genug Einträge für eine erste Auswertung.</span>}
        </div>
        <div className={styles.progressBar} aria-hidden>
          <div className={styles.progressFill} style={{ width: `${progressPercent}%` }} />
        </div>
      </div>

      {stage === 'observe' && collecting && (
        <section className={`${styles.panel} ui-flat-mobile mobile-flatten-card`}>
          <h3 className={styles.panelTitle}>
            {isEditing ? `Erwartung #${observations[editIndex!]?.order || editIndex! + 1}` : `Erwartung #${count + 1}`}
          </h3>

          {step !== 'expect' && (
            <>
              {cfg.supportsScenarioBranches && (
                <ScenarioBranchMap
                  situation={draft.situationLabel}
                  primary={primaryAction}
                  alternative={alternativeAction}
                  triggers={triggerLines}
                />
              )}
              <LockedLine label={cfg.supportsScenarioBranches ? 'Primäre Erwartung' : 'Erwartung'} value={primaryAction} />
              <LockedLine label="Sicherheit der ursprünglichen Erwartung" value={confidenceLabel(draft.confidence)} />
              <LockedLine
                label="Hinweise"
                value={normalizeCues(draft.cues, cfg.maxCues).map((cue) => {
                  const priority = cuePriorityLabel(cue.priority)
                  const body = `${cueCategoryLabel(cue.category)} · ${cue.label}`
                  return priority ? `${priority}: ${body}` : body
                }).join(' · ')}
              />
              {cfg.supportsScenarioBranches && step !== 'alternative' && (
                <LockedLine label="Alternativszenario" value={alternativeAction} />
              )}
              {cfg.supportsScenarioBranches && step !== 'alternative' && step !== 'triggers' && triggerLines.length > 0 && (
                <LockedLine label="Auslöser" value={triggerLines.join(' · ')} />
              )}
              {cfg.supportsPredictionUpdate && step !== 'updateInfo' && updateTriggerLines.length > 0 && (
                <LockedLine label="Neue Information" value={updateTriggerLines.join(' · ')} />
              )}
              {cfg.supportsPredictionUpdate && step !== 'updateInfo' && step !== 'updateDecide' && draft.updateDecision && (
                <LockedLine
                  label="Aktualisierung"
                  value={draft.updateDecision === 'change'
                    ? `Erwartung geändert → ${draft.updatedPrediction || draft.updatedPredictionOptionId}`
                    : draft.updateDecision === 'no_new_info'
                      ? 'Keine relevante neue Information sichtbar'
                      : draft.updateDecision === 'unclear'
                        ? 'Nicht sicher beurteilbar'
                        : `Ursprüngliche Erwartung beibehalten${draft.updateReason ? ` · ${draft.updateReason}` : ''}`}
                />
              )}
            </>
          )}

          {step === 'expect' && (
            <>
              <div className={styles.fieldBlock}>
                <div className={styles.fieldLabel}>Situation (optional)</div>
                <input
                  className={styles.input}
                  value={draft.situationLabel}
                  maxLength={80}
                  placeholder="z. B. Zoneneintritt an der blauen Linie"
                  onChange={(event) => updateDraft({ situationLabel: event.target.value })}
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

              <div className={styles.expectGrid}>
                <div className={styles.fieldBlock}>
                  {renderActionField(
                    'expected',
                    draft.expectedActionOptionId,
                    draft.expectedAction,
                    cfg.supportsScenarioBranches
                      ? 'Was passiert wahrscheinlich? (primäre Erwartung)'
                      : 'Was passiert als Nächstes am wahrscheinlichsten?',
                  )}
                  {cfg.supportsConfidence && (
                    <div className={styles.fieldBlock}>
                      <div className={styles.fieldLabel}>Sicherheit der ursprünglichen Erwartung</div>
                      <OptionChips
                        name="readConfidence"
                        options={confidenceOptions()}
                        value={draft.confidence}
                        onChange={(next) => updateDraft({ confidence: next as AnticipationDraft['confidence'] })}
                      />
                    </div>
                  )}
                </div>

                <div className={styles.fieldBlock}>
                  <div className={styles.fieldLabel}>Welche Hinweise sprechen für deine Erwartung?</div>
                  <p className={styles.fieldHelp}>
                    {cfg.minCues}–{cfg.maxCues} Hinweise{cfg.supportsCuePriority ? `, empfohlen ${cfg.recommendedCues}` : ''}.
                    Kategorie plus kurzer Freitext.
                  </p>
                  <div className={styles.cueList}>
                    {draft.cues.map((cue, index) => (
                      <div key={cue.id || index} className={styles.cueRow}>
                        <select
                          className={styles.select}
                          value={cue.category || 'other'}
                          onChange={(event) => updateCue(cue.id, { category: event.target.value })}
                        >
                          {cfg.cueCategories.map((category) => (
                            <option key={category} value={category}>{cueCategoryLabel(category)}</option>
                          ))}
                        </select>
                        <input
                          className={styles.input}
                          value={cue.label}
                          maxLength={80}
                          placeholder="sichtbarer Hinweis"
                          onChange={(event) => updateCue(cue.id, { label: event.target.value })}
                        />
                        {draft.cues.length > 1 && (
                          <div className={styles.cueActions}>
                            <button type="button" className={styles.actionBtn} onClick={() => removeCue(cue.id)}>
                              Hinweis entfernen
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  {canAddCue(draft.cues.length, cfg.maxCues) && (
                    <div className={styles.actions}>
                      <button type="button" className={styles.secondaryBtn} onClick={addCue}>
                        + Hinweis
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className={styles.actions}>
                <button
                  type="button"
                  className={styles.primaryBtn}
                  disabled={!expectReady}
                  onClick={() => goNextFrom('expect')}
                >
                  {nextLabel('expect')}
                </button>
                {isEditing && (
                  <button type="button" className={styles.secondaryBtn} onClick={() => clearDraft()}>
                    Abbrechen
                  </button>
                )}
              </div>
            </>
          )}

          {step === 'prioritize' && cfg.supportsCuePriority && (
            <>
              <CuePriorityPanel
                cues={labeledCues(draft.cues)}
                formatCategory={cueCategoryLabel}
                onChange={(cueId, priority) => updateDraft({ cues: assignCuePriority(draft.cues, cueId, priority) })}
              />
              <div className={styles.actions}>
                <button
                  type="button"
                  className={styles.primaryBtn}
                  disabled={!prioritizeReady}
                  onClick={() => goNextFrom('prioritize')}
                >
                  {nextLabel('prioritize')}
                </button>
              </div>
            </>
          )}

          {step === 'alternative' && cfg.supportsScenarioBranches && (
            <>
              <p className={styles.fieldHelp}>
                Die Begrenzung auf eine Alternative dient der Übung. Weitere Spielmöglichkeiten können bestehen.
                Wenn keine realistische Alternative formulierbar ist, verwirf diese Szene und wähle eine andere.
              </p>
              {renderActionField(
                'alternative',
                draft.alternativeActionOptionId,
                draft.alternativeAction,
                'Was wäre die wahrscheinlichste andere nächste Aktion?',
              )}
              <div className={styles.actions}>
                <button
                  type="button"
                  className={styles.primaryBtn}
                  disabled={!alternativeReady}
                  onClick={() => goNextFrom('alternative')}
                >
                  {nextLabel('alternative')}
                </button>
                <button
                  type="button"
                  className={styles.secondaryBtn}
                  onClick={() => clearDraft({ [cfg.stageKey]: 'observe' })}
                >
                  Szene ungeeignet – neu wählen
                </button>
              </div>
            </>
          )}

          {step === 'triggers' && cfg.supportsScenarioBranches && (
            <>
              <ScenarioBranchPanel
                triggers={draft.triggers}
                minTriggers={cfg.minTriggers}
                maxTriggers={cfg.maxTriggers}
                suggestions={cfg.triggerSuggestions}
                cueCategories={cfg.cueCategories}
                categoryLabel={cueCategoryLabel}
                onChange={(triggers: BranchTrigger[]) => updateDraft({ triggers })}
              />
              <div className={styles.actions}>
                <button
                  type="button"
                  className={styles.primaryBtn}
                  disabled={!triggersReady}
                  onClick={() => goNextFrom('triggers')}
                >
                  {nextLabel('triggers')}
                </button>
              </div>
            </>
          )}

          {step === 'updateInfo' && cfg.supportsPredictionUpdate && (
            <>
              <PredictionUpdatePanel
                initialPrediction={primaryAction}
                triggers={draft.updateTriggers}
                minTriggers={cfg.minUpdateTriggers}
                maxTriggers={cfg.maxUpdateTriggers}
                suggestions={cfg.updateTriggerSuggestions}
                cueCategories={cfg.cueCategories}
                categoryLabel={cueCategoryLabel}
                onChangeTriggers={(triggers: BranchTrigger[]) => updateDraft({ updateTriggers: triggers })}
              />
              <div className={styles.actions}>
                <button
                  type="button"
                  className={styles.primaryBtn}
                  disabled={!updateInfoReady}
                  onClick={() => goNextFrom('updateInfo')}
                >
                  {nextLabel('updateInfo')}
                </button>
              </div>
            </>
          )}

          {step === 'updateDecide' && cfg.supportsPredictionUpdate && (
            <>
              <LockedLine label="Neue Information" value={updateTriggerLines.join(' · ')} />
              <div className={styles.fieldBlock}>
                <div className={styles.fieldLabel}>Bleibt deine Erwartung bestehen – oder ändert sie sich?</div>
                <OptionChips
                  name="updateDecision"
                  options={updateDecisionOptions()}
                  value={draft.updateDecision}
                  onChange={(next) => updateDraft({ updateDecision: String(next) as UpdateDecision })}
                />
                <p className={styles.fieldHelp}>
                  Beibehalten und Ändern sind beide gültig. Ohne relevante neue Information oder wenn unsicher: das explizit wählen.
                </p>
              </div>
              {draft.updateDecision === 'change' && renderActionField(
                'updated',
                draft.updatedPredictionOptionId,
                draft.updatedPrediction,
                'Was ist jetzt die aktualisierte Erwartung?',
              )}
              {(draft.updateDecision === 'keep' || draft.updateDecision === 'no_new_info') && (
                <div className={styles.fieldBlock}>
                  <div className={styles.fieldLabel}>
                    {draft.updateDecision === 'no_new_info'
                      ? 'Kurznotiz (optional): Warum war keine relevante neue Information sichtbar?'
                      : 'Warum reicht die neue Information noch nicht für eine Änderung?'}
                  </div>
                  <input
                    className={styles.input}
                    value={draft.updateReason}
                    maxLength={120}
                    placeholder="z. B. Unterstützung bleibt verfügbar"
                    onChange={(event) => updateDraft({ updateReason: event.target.value })}
                  />
                </div>
              )}
              <div className={styles.actions}>
                <button
                  type="button"
                  className={styles.primaryBtn}
                  disabled={!updateDecideReady}
                  onClick={() => goNextFrom('updateDecide')}
                >
                  {nextLabel('updateDecide')}
                </button>
              </div>
            </>
          )}

          {step === 'actual' && (
            <>
              <div className={styles.actualGrid}>
                {renderActionField('actual', draft.actualActionOptionId, draft.actualAction, 'Was ist tatsächlich passiert?')}
                <div className={styles.fieldBlock}>
                  <div className={styles.fieldLabel}>Stimmt die tatsächliche Aktion mit deiner Erwartung überein?</div>
                  <OptionChips
                    name="outcomeMatch"
                    options={outcomeMatchOptions()}
                    value={draft.outcomeMatch}
                    onChange={(next) => updateDraft({ outcomeMatch: next as AnticipationDraft['outcomeMatch'] })}
                  />
                </div>
              </div>
              <div className={styles.actions}>
                <button
                  type="button"
                  className={styles.primaryBtn}
                  disabled={!actualReady}
                  onClick={() => goNextFrom('actual')}
                >
                  {nextLabel('actual')}
                </button>
              </div>
            </>
          )}

          {step === 'quality' && (
            <>
              <LockedLine label="Tatsächliche Aktion" value={draft.actualAction || draft.actualActionOptionId} />
              <LockedLine label="Übereinstimmung" value={outcomeMatchLabel(draft.outcomeMatch)} />
              <div className={styles.fieldBlock}>
                <div className={styles.fieldLabel}>Wie war die ursprüngliche Erwartung durch sichtbare Hinweise gestützt?</div>
                <OptionChips
                  name="readQuality"
                  options={readQualityOptions()}
                  value={draft.readQuality}
                  onChange={(next) => updateDraft({ readQuality: next as AnticipationDraft['readQuality'] })}
                />
                <p className={styles.fieldHelp}>Eine Übereinstimmung beweist keine hohe Qualität. Eine Abweichung beweist keine schlechte Antizipation.</p>
              </div>
              <div className={styles.fieldBlock}>
                <div className={styles.fieldLabel}>Kurznotiz (optional)</div>
                <input
                  className={styles.input}
                  value={draft.note}
                  maxLength={160}
                  onChange={(event) => updateDraft({ note: event.target.value })}
                />
              </div>
              <div className={styles.actions}>
                <button
                  type="button"
                  className={styles.primaryBtn}
                  disabled={!qualityReady}
                  onClick={() => goNextFrom('quality')}
                >
                  {nextLabel('quality')}
                </button>
              </div>
            </>
          )}

          {step === 'cueReview' && cfg.supportsCuePriority && (
            <>
              <LockedLine label="Tatsächliche Aktion" value={draft.actualAction || draft.actualActionOptionId} />
              <LockedLine label="Übereinstimmung" value={outcomeMatchLabel(draft.outcomeMatch)} />
              <LockedLine label="Merkmale der Begründung" value={readQualityLabel(draft.readQuality)} />
              <div className={styles.fieldBlock}>
                <div className={styles.fieldLabel}>War dein Haupthinweis vor der Aktion klar sichtbar, und blieb er für die ursprüngliche Erwartung relevant?</div>
                <OptionChips
                  name="cueReview"
                  options={cueReviewOptions()}
                  value={draft.cueReview}
                  onChange={(next) => updateDraft({ cueReview: String(next) as CueReviewJudgement })}
                />
                <p className={styles.fieldHelp}>
                  Die tatsächliche Aktion schreibt die Hinweisrollen nicht automatisch um. Ein abweichender Verlauf macht den Haupthinweis nicht automatisch irrelevant.
                </p>
              </div>
              <div className={styles.actions}>
                <button
                  type="button"
                  className={styles.primaryBtn}
                  disabled={!cueReviewReady}
                  onClick={() => goNextFrom('cueReview')}
                >
                  {nextLabel('cueReview')}
                </button>
              </div>
            </>
          )}

          {step === 'branchReview' && cfg.supportsScenarioBranches && (
            <>
              <LockedLine label="Tatsächliche Aktion" value={draft.actualAction || draft.actualActionOptionId} />
              <LockedLine label="Alternativszenario" value={alternativeAction} />
              <div className={styles.fieldBlock}>
                <div className={styles.fieldLabel}>Ist deine Alternative eingetreten?</div>
                <OptionChips
                  name="alternativeOccurred"
                  options={alternativeOccurredOptions()}
                  value={draft.alternativeOccurred}
                  onChange={(next) => updateDraft({ alternativeOccurred: next as AnticipationDraft['alternativeOccurred'] })}
                />
              </div>
              <div className={styles.fieldBlock}>
                <div className={styles.fieldLabel}>Wurde der definierte Auslöser sichtbar – und blieb er für die Verzweigung relevant?</div>
                <OptionChips
                  name="triggerRelevant"
                  options={triggerRelevantOptions()}
                  value={draft.triggerRelevant}
                  onChange={(next) => updateDraft({ triggerRelevant: next as AnticipationDraft['triggerRelevant'] })}
                />
                <p className={styles.fieldHelp}>
                  Das Eintreten der Alternative ohne den erwarteten Auslöser bestätigt die Verzweigung nicht automatisch.
                </p>
              </div>
              <div className={styles.actions}>
                <button
                  type="button"
                  className={styles.primaryBtn}
                  disabled={!branchReviewReady}
                  onClick={() => goNextFrom('branchReview')}
                >
                  {nextLabel('branchReview')}
                </button>
              </div>
            </>
          )}

          {step === 'updateReview' && cfg.supportsPredictionUpdate && (
            <>
              <LockedLine label="Tatsächliche Aktion" value={draft.actualAction || draft.actualActionOptionId} />
              <LockedLine
                label="Aktualisierung"
                value={draft.updateDecision === 'change'
                  ? `Erwartung geändert → ${draft.updatedPrediction || draft.updatedPredictionOptionId}`
                  : draft.updateDecision === 'no_new_info'
                    ? 'Keine relevante neue Information sichtbar'
                    : draft.updateDecision === 'unclear'
                      ? 'Nicht sicher beurteilbar'
                      : 'Ursprüngliche Erwartung beibehalten'}
              />
              <div className={styles.fieldBlock}>
                <div className={styles.fieldLabel}>Wie verlief die Aktualisierung relativ zum Auftreten der neuen Information? (keine Geschwindigkeitswertung)</div>
                <OptionChips
                  name="updateQuality"
                  options={updateQualityOptions()}
                  value={draft.updateQuality}
                  onChange={(next) => updateDraft({ updateQuality: String(next) as UpdateQuality })}
                />
                <p className={styles.fieldHelp}>
                  Diese Kategorien beschreiben den Ablauf. Sie werden nicht in Punkte, Reaktionsgeschwindigkeit oder Kompetenz übersetzt.
                </p>
              </div>
              <div className={styles.actions}>
                <button
                  type="button"
                  className={styles.primaryBtn}
                  disabled={!updateReviewReady}
                  onClick={() => goNextFrom('updateReview')}
                >
                  {nextLabel('updateReview')}
                </button>
              </div>
            </>
          )}
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
              onClick={() => patchAnswers(safeAnswers, setAnswers, { [cfg.addingMoreKey]: true, [cfg.draftKey]: emptyAnticipationDraft() })}
            >
              + Weitere Erwartung beobachten
            </button>
          )}
        </div>
      )}

      <section className={`${styles.panel} ui-flat-mobile mobile-flatten-card`}>
        <h3 className={styles.panelTitle}>Gespeicherte Erwartungen</h3>
        {observations.length === 0 ? (
          <p className={styles.empty}>Noch kein Eintrag. Zuerst die Erwartung, dann die tatsächliche Aktion.</p>
        ) : (
          <ol className={styles.readList}>
            {observations.map((obs, index) => (
              <li key={obs.id} className={styles.readRow}>
                <div className={styles.readMeta}>{formatReadMeta(obs)}</div>
                <div className={styles.readTitle}>
                  {obs.expectedAction}
                  {obs.alternativeAction ? ` / ${obs.alternativeAction}` : ''}
                  {obs.actualAction ? ` → ${obs.actualAction}` : ''}
                </div>
                <p className={styles.readNote}>
                  {[
                    confidenceLabel(obs.confidence),
                    outcomeMatchLabel(obs.outcomeMatch),
                    readQualityLabel(obs.readQuality),
                    obs.alternativeOccurred ? `Alt. ${obs.alternativeOccurred === 'yes' ? 'eingetreten' : 'nicht eingetreten'}` : '',
                    obs.updateDecision ? updateDecisionLabel(obs.updateDecision) : '',
                    obs.updateQuality ? updateQualityLabel(obs.updateQuality) : '',
                  ].filter(Boolean).join(' · ')}
                </p>
                {obs.supportingCues?.length ? (
                  <p className={styles.readNote}>
                    {obs.supportingCues.map((cue) => {
                      const priority = cuePriorityLabel(cue.priority)
                      const body = `${cueCategoryLabel(cue.category)} · ${cue.label}`
                      return priority ? `${priority}: ${body}` : body
                    }).join(' · ')}
                  </p>
                ) : null}
                {obs.branchTriggers?.length ? (
                  <p className={styles.readNote}>
                    Wenn: {obs.branchTriggers.map((trigger) => formatTriggerLine(trigger, cueCategoryLabel)).join(' · ')}
                  </p>
                ) : null}
                {obs.updateTriggers?.length ? (
                  <p className={styles.readNote}>
                    Neu: {obs.updateTriggers.map((trigger) => formatTriggerLine(trigger, cueCategoryLabel)).join(' · ')}
                    {obs.updateDecision === 'change' && obs.updatedPrediction ? ` → ${obs.updatedPrediction}` : ''}
                  </p>
                ) : null}
                {stage === 'observe' && (
                  <div className={styles.actions}>
                    <button type="button" className={styles.actionBtn} onClick={() => startEdit(index)}>ändern</button>
                    <button type="button" className={styles.actionBtn} onClick={() => removeObservation(index)}>entfernen</button>
                  </div>
                )}
              </li>
            ))}
          </ol>
        )}
      </section>

      {stage === 'review' && (
        <section className={`${styles.panel} ui-flat-mobile mobile-flatten-card`}>
          <AnticipationReadSummary result={result} categoryLabel={cueCategoryLabel} />

          {cfg.supportsPredictionUpdate ? (
            <>
              <div className={styles.fieldBlock}>
                <div className={styles.fieldLabel}>Bei welcher Situation hast du deine Erwartung aufgrund neuer Information verändert?</div>
                <OptionChips
                  name="successfulUpdate"
                  options={updateReadChoices}
                  value={String(safeAnswers[cfg.successfulUpdateKey] || '')}
                  onChange={(next) => patchAnswers(safeAnswers, setAnswers, { [cfg.successfulUpdateKey]: String(next) })}
                />
              </div>
              <div className={styles.fieldBlock}>
                <div className={styles.fieldLabel}>Bei welcher Situation hast du sie trotz neuer Information beibehalten?</div>
                <OptionChips
                  name="heldTooLong"
                  options={updateReadChoices}
                  value={String(safeAnswers[cfg.heldTooLongKey] || '')}
                  onChange={(next) => patchAnswers(safeAnswers, setAnswers, { [cfg.heldTooLongKey]: String(next) })}
                />
              </div>
              <div className={styles.fieldBlock}>
                <div className={styles.fieldLabel}>Welche zusätzliche Information hätte eine Änderung gerechtfertigt?</div>
                <OptionChips
                  name="strongestUpdateInfo"
                  options={strongestUpdateInfoChoices}
                  value={String(safeAnswers[cfg.strongestUpdateInfoKey] || '')}
                  onChange={(next) => patchAnswers(safeAnswers, setAnswers, { [cfg.strongestUpdateInfoKey]: String(next) })}
                />
              </div>
            </>
          ) : cfg.supportsScenarioBranches ? (
            <>
              <div className={styles.fieldBlock}>
                <div className={styles.fieldLabel}>Bei welcher Erwartung war dein Alternativszenario besonders wichtig?</div>
                <OptionChips
                  name="importantAlternative"
                  options={alternativeReadChoices}
                  value={String(safeAnswers[cfg.importantAlternativeKey] || '')}
                  onChange={(next) => patchAnswers(safeAnswers, setAnswers, { [cfg.importantAlternativeKey]: String(next) })}
                />
              </div>
              <div className={styles.fieldBlock}>
                <div className={styles.fieldLabel}>Welcher Auslöser hätte deine Erwartung am stärksten verändert?</div>
                <OptionChips
                  name="strongestTrigger"
                  options={strongestTriggerChoices}
                  value={String(safeAnswers[cfg.strongestTriggerKey] || '')}
                  onChange={(next) => patchAnswers(safeAnswers, setAnswers, { [cfg.strongestTriggerKey]: String(next) })}
                />
              </div>
              <div className={styles.fieldBlock}>
                <div className={styles.fieldLabel}>War die Szene noch offen genug für beide Szenarien?</div>
                <OptionChips
                  name="linearThinking"
                  options={linearThinkingOptions()}
                  value={String(safeAnswers[cfg.linearThinkingKey] || '')}
                  onChange={(next) => patchAnswers(safeAnswers, setAnswers, { [cfg.linearThinkingKey]: String(next) })}
                />
              </div>
            </>
          ) : cfg.supportsCuePriority ? (
            <>
              <div className={styles.fieldBlock}>
                <div className={styles.fieldLabel}>Welche Hinweisart hast du am häufigsten für Erwartungen genutzt?</div>
                <OptionChips
                  name="helpfulCue"
                  options={helpfulCueChoices}
                  value={String(safeAnswers[cfg.helpfulCueKey] || '')}
                  onChange={(next) => patchAnswers(safeAnswers, setAnswers, { [cfg.helpfulCueKey]: String(next) })}
                />
              </div>
              <div className={styles.fieldBlock}>
                <div className={styles.fieldLabel}>Welche Hinweisart war möglicherweise zu allgemein oder überbewertet?</div>
                <OptionChips
                  name="overweightedCue"
                  options={cueChoices}
                  value={String(safeAnswers[cfg.overweightedCueKey] || '')}
                  onChange={(next) => patchAnswers(safeAnswers, setAnswers, { [cfg.overweightedCueKey]: String(next) })}
                />
              </div>
              <div className={styles.fieldBlock}>
                <div className={styles.fieldLabel}>Welche Hinweisart möchtest du als Nächstes bewusst dokumentieren?</div>
                <OptionChips
                  name="futureCue"
                  options={futureCueChoices}
                  value={String(safeAnswers[cfg.futureCueKey] || '')}
                  onChange={(next) => patchAnswers(safeAnswers, setAnswers, { [cfg.futureCueKey]: String(next) })}
                />
              </div>
            </>
          ) : (
            <>
          <div className={styles.fieldBlock}>
            <div className={styles.fieldLabel}>
              Bei welcher Erwartung wich die tatsächliche Aktion ab, obwohl die Hinweise vor der Aktion sichtbar und konkret waren?
            </div>
            <OptionChips
              name="strongMismatch"
              options={mismatchChoices}
              value={String(safeAnswers[cfg.strongMismatchKey] || '')}
              onChange={(next) => patchAnswers(safeAnswers, setAnswers, { [cfg.strongMismatchKey]: String(next) })}
            />
          </div>

          {helpfulCueChoices.length > 0 && (
            <div className={styles.fieldBlock}>
              <div className={styles.fieldLabel}>Welche Hinweisart hast du am häufigsten genutzt, um eine Erwartung zu bilden?</div>
              <OptionChips
                name="helpfulCue"
                options={helpfulCueChoices}
                value={String(safeAnswers[cfg.helpfulCueKey] || '')}
                onChange={(next) => patchAnswers(safeAnswers, setAnswers, { [cfg.helpfulCueKey]: String(next) })}
              />
            </div>
          )}

          <div className={styles.fieldBlock}>
            <div className={styles.fieldLabel}>Wann warst du dir zu sicher?</div>
            <OptionChips
              name="overconfidence"
              options={overconfidenceOptions()}
              value={String(safeAnswers[cfg.overconfidenceKey] || '')}
              onChange={(next) => patchAnswers(safeAnswers, setAnswers, { [cfg.overconfidenceKey]: String(next) })}
            />
          </div>

          {safeAnswers[cfg.overconfidenceKey] === 'single' && observations.length > 0 && (
            <div className={styles.fieldBlock}>
              <div className={styles.fieldLabel}>Welche Erwartung?</div>
              <OptionChips
                name="overconfidenceRead"
                options={observations.map((obs) => ({
                  value: obs.id,
                  label: `${formatReadMeta(obs)} · ${obs.expectedAction}`,
                }))}
                value={String(safeAnswers[cfg.overconfidenceReadKey] || '')}
                onChange={(next) => patchAnswers(safeAnswers, setAnswers, { [cfg.overconfidenceReadKey]: String(next) })}
              />
            </div>
          )}
            </>
          )}

          {reviewError && <p className={styles.hint}>{reviewError}</p>}

          <div className={styles.actions}>
            <button
              type="button"
              className={styles.primaryBtn}
              disabled={Boolean(reviewError)}
              onClick={() => setStage('complete')}
            >
              Auswertung abschließen
            </button>
            <button type="button" className={styles.secondaryBtn} onClick={() => setStage('observe')}>
              Zurück zu den Erwartungen
            </button>
          </div>
        </section>
      )}
    </div>
  )
}
