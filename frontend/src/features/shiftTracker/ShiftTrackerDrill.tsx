import type { Drill } from '../../api'
import { DrillGuideCard } from '../../components/DrillGuideCard'
import { OptionChips } from '../patternLog/OptionChips'
import { ShiftTrackerSummary } from './ShiftTrackerSummary'
import {
  canAddObservation,
  canEvaluateObservations,
  computeShiftTrackerResult,
  draftToObservation,
  emptyShiftDraft,
  findCompletedShiftAnswers,
  guidanceForIndex,
  isShiftTrackerComplete,
  observationToDraft,
  optionLabel,
  readShiftStage,
  resolveShiftTrackerConfig,
  toReflectionPayload,
} from './shiftLogic'
import type { ShiftObservation, ShiftObservationDraft } from './types'
import styles from './ShiftTrackerDrill.module.css'

type Props = {
  drill: Drill
  answers: Record<string, any>
  setAnswers: (next: Record<string, any>) => void
  session?: { drafts?: Record<string, unknown>; checkins?: Array<{ answers?: Record<string, unknown> }> }
}

function patchAnswers(
  answers: Record<string, any>,
  setAnswers: (next: Record<string, any>) => void,
  patch: Record<string, any>,
) {
  setAnswers({ ...(answers || {}), ...patch })
}

function isOpenChoice(id: string): boolean {
  return id === 'unsure' || id === 'unclear'
}

export function ShiftTrackerDrill({ drill, answers, setAnswers, session }: Props) {
  const cfg = resolveShiftTrackerConfig(drill?.config || {})
  const safeAnswers = answers || {}
  const stage = readShiftStage(safeAnswers, cfg.stageKey)
  const addingMore = safeAnswers[cfg.addingMoreKey] === true
  const observations: ShiftObservation[] = Array.isArray(safeAnswers[cfg.logsKey])
    ? safeAnswers[cfg.logsKey]
    : []
  const borrowedAnswers = findCompletedShiftAnswers(cfg, safeAnswers, session)
  const usingBorrowed = !isShiftTrackerComplete(cfg, safeAnswers)
    && Boolean(borrowedAnswers)
    && !addingMore
    && observations.length === 0
  const draft: ShiftObservationDraft = {
    ...emptyShiftDraft(),
    ...(safeAnswers[cfg.draftKey] || {}),
  }
  const editIndexRaw = safeAnswers[cfg.editIndexKey]
  const editIndex = typeof editIndexRaw === 'number' ? editIndexRaw : null
  const count = observations.length
  const atMin = canEvaluateObservations(count, cfg.minObservations)
  const atMax = !canAddObservation(count, cfg.maxObservations)
  const isEditing = editIndex !== null && editIndex >= 0 && editIndex < observations.length
  const collecting = isEditing || addingMore
  const result = computeShiftTrackerResult(observations, cfg.positionOptions, cfg.functionOptions)
  const currentIndex = isEditing ? editIndex : count
  const guidance = guidanceForIndex(cfg, currentIndex)
  const draftRequirements = {
    requireTrigger: cfg.showTriggerField,
    requireFunction: cfg.showFunctionField,
  }
  const canSave = Boolean(draftToObservation(
    draft,
    currentIndex,
    isEditing ? observations[editIndex] : undefined,
    draftRequirements,
  ))
  const guide = drill?.didactics?.observation_guide
  const positionChoices = cfg.positionOptions.map((option) => ({
    value: option.id,
    label: option.label,
    description: guidance?.reminderLevel === 'minimal' ? undefined : option.hint,
  }))
  const functionChoices = cfg.functionOptions.map((option) => ({
    value: option.id,
    label: option.label,
    description: guidance?.reminderLevel === 'minimal' ? undefined : option.hint,
  }))
  const triggerChoices = cfg.triggerOptions.map((option) => ({ value: option.id, label: option.label }))
  const patternChoices = cfg.patternOptions.map((option) => ({ value: option.id, label: option.label }))
  const hardestChoices = cfg.hardestOptions.map((option) => ({ value: option.id, label: option.label }))
  const progressGoal = count >= cfg.recommendedObservations ? cfg.maxObservations : cfg.recommendedObservations
  const showFullReminders = guidance?.reminderLevel === 'full'
  const showCompactReminders = guidance?.reminderLevel === 'compact'
  const selectedFunction = cfg.functionOptions.find((option) => option.id === draft.roleFunction)
  const canComplete = cfg.patternOptions.length === 0 || Boolean(String(safeAnswers[cfg.patternKey] || ''))

  const persistObservations = (next: ShiftObservation[], extra: Record<string, unknown> = {}) => {
    const nextResult = computeShiftTrackerResult(next, cfg.positionOptions, cfg.functionOptions)
    patchAnswers(safeAnswers, setAnswers, {
      [cfg.logsKey]: next,
      [cfg.resultKey]: nextResult,
      [cfg.payloadKey]: toReflectionPayload(cfg, nextResult, {
        patternNoticed: String(safeAnswers[cfg.patternKey] || ''),
        hardestSituation: String(safeAnswers[cfg.hardestKey] || ''),
        closingNote: String(safeAnswers[cfg.closingNoteKey] || ''),
      }),
      [cfg.draftKey]: emptyShiftDraft(),
      [cfg.editIndexKey]: null,
      [cfg.addingMoreKey]: false,
      ...extra,
    })
  }

  const startNextScan = () => {
    patchAnswers(safeAnswers, setAnswers, {
      [cfg.stageKey]: 'collect',
      [cfg.addingMoreKey]: true,
      [cfg.editIndexKey]: null,
      [cfg.draftKey]: emptyShiftDraft(),
    })
  }

  const saveObservation = () => {
    const nextObservation = draftToObservation(
      draft,
      currentIndex,
      isEditing ? observations[editIndex] : undefined,
      draftRequirements,
    )
    if (!nextObservation) return
    const next = [...observations]
    if (isEditing) next[editIndex] = { ...nextObservation, order: editIndex + 1 }
    else next.push({ ...nextObservation, order: next.length + 1 })
    persistObservations(next, {
      [cfg.stageKey]: next.length >= cfg.minObservations ? 'reflect' : 'collect',
    })
  }

  const completeDrill = () => {
    const nextResult = computeShiftTrackerResult(observations, cfg.positionOptions, cfg.functionOptions)
    patchAnswers(safeAnswers, setAnswers, {
      [cfg.stageKey]: 'complete',
      [cfg.resultKey]: nextResult,
      [cfg.payloadKey]: toReflectionPayload(cfg, nextResult, {
        patternNoticed: String(safeAnswers[cfg.patternKey] || ''),
        hardestSituation: String(safeAnswers[cfg.hardestKey] || ''),
        closingNote: String(safeAnswers[cfg.closingNoteKey] || ''),
      }),
    })
  }

  if (usingBorrowed && borrowedAnswers) {
    const borrowedResult = computeShiftTrackerResult(
      Array.isArray(borrowedAnswers[cfg.logsKey]) ? borrowedAnswers[cfg.logsKey] as ShiftObservation[] : [],
      cfg.positionOptions,
      cfg.functionOptions,
    )
    return (
      <div className={styles.drillRoot}>
        <span className={styles.completeBadge}>✓ {cfg.countNoun} in diesem Spiel abgeschlossen</span>
        <p className={styles.lead}>Weitere {cfg.countNoun} in diesem Drittel sind optional. Du kannst weitergehen.</p>
        <ShiftTrackerSummary
          result={borrowedResult}
          cfg={cfg}
          patternLabel={String(borrowedAnswers[cfg.patternKey] || '')}
        />
        <div className={styles.actions}>
          <button type="button" className={styles.secondaryBtn} onClick={startNextScan}>
            {cfg.scanButtonLabel}
          </button>
        </div>
      </div>
    )
  }

  if (stage === 'complete') {
    return (
      <div className={styles.drillRoot}>
        <span className={styles.completeBadge}>✓ {cfg.countNoun} abgeschlossen</span>
        <ShiftTrackerSummary
          result={result}
          cfg={cfg}
          patternLabel={String(safeAnswers[cfg.patternKey] || '')}
        />
        <div className={styles.actions}>
          <button type="button" className={styles.secondaryBtn} onClick={() => patchAnswers(safeAnswers, setAnswers, { [cfg.stageKey]: 'reflect' })}>
            Bearbeiten
          </button>
        </div>
      </div>
    )
  }

  if (stage === 'reflect' && atMin && !collecting) {
    return (
      <div className={styles.drillRoot}>
        <p className={styles.eyebrow}>{cfg.reflectEyebrow}</p>
        <h2 className={styles.title}>{drill.title}</h2>
        <ShiftTrackerSummary result={result} cfg={cfg} />
        <section className={`${styles.panel} ui-flat-mobile mobile-flatten-card`}>
          <h3 className={styles.panelTitle}>Kurze Reflexion</h3>
          {cfg.patternOptions.length > 0 && (
            <div className={styles.fieldBlock}>
              <div className={styles.fieldLabel}>{cfg.patternPrompt}</div>
              <OptionChips
                name="shiftPattern"
                options={patternChoices}
                value={String(safeAnswers[cfg.patternKey] || '')}
                onChange={(next) => patchAnswers(safeAnswers, setAnswers, { [cfg.patternKey]: String(next) })}
              />
            </div>
          )}
          {cfg.hardestOptions.length > 0 && (
            <div className={styles.fieldBlock}>
              <div className={styles.fieldLabel}>{cfg.hardestPrompt}</div>
              <OptionChips
                name="shiftHardest"
                options={hardestChoices}
                value={String(safeAnswers[cfg.hardestKey] || '')}
                onChange={(next) => patchAnswers(safeAnswers, setAnswers, { [cfg.hardestKey]: String(next) })}
              />
              <p className={styles.fieldHelp}>Optional. Der Marker selbst wird nicht bewertet.</p>
            </div>
          )}
          <div className={styles.fieldBlock}>
            <div className={styles.fieldLabel}>{cfg.closingNoteLabel}</div>
            <textarea
              className={styles.textarea}
              value={String(safeAnswers[cfg.closingNoteKey] || '')}
              onChange={(event) => patchAnswers(safeAnswers, setAnswers, { [cfg.closingNoteKey]: event.target.value })}
              maxLength={1500}
              placeholder={cfg.closingNotePlaceholder}
            />
          </div>
        </section>
        <div className={styles.actions}>
          {!atMax && (
            <button type="button" className={styles.secondaryBtn} onClick={startNextScan}>
              {cfg.scanButtonLabel}
            </button>
          )}
          <button
            type="button"
            className={styles.primaryBtn}
            disabled={!canComplete}
            onClick={completeDrill}
          >
            Abschluss ansehen
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.drillRoot}>
      <p className={styles.eyebrow}>{cfg.collectEyebrow}</p>
      <h2 className={styles.title}>{drill.title}</h2>
      {drill.description && <p className={styles.lead}>{drill.description}</p>}
      {cfg.whyThisDrill && <p className={styles.lead}>{cfg.whyThisDrill}</p>}
      {cfg.decisionRule && <p className={styles.rule}>{cfg.decisionRule}</p>}
      {cfg.coreHint && <p className={styles.hint}>{cfg.coreHint}</p>}
      {cfg.lineupHint && <p className={styles.fieldHelp}>{cfg.lineupHint}</p>}

      {cfg.relativeHeightHint && (
        <section className={`${styles.panel} ui-flat-mobile mobile-flatten-card`}>
          <h3 className={styles.panelTitle}>Low / Middle / High</h3>
          <p className={styles.lead}>{cfg.relativeHeightHint}</p>
          {(showFullReminders || !collecting) && (
            <ul className={styles.reminderList}>
              {cfg.positionOptions.filter((option) => !isOpenChoice(option.id)).map((option) => (
                <li key={option.id} className={styles.reminderItem}>
                  <p className={styles.reminderTitle}>{option.label}</p>
                  {option.hint && <p className={styles.anchorHint}>{option.hint}</p>}
                </li>
              ))}
            </ul>
          )}
          {showCompactReminders && collecting && (
            <p className={styles.disclaimer}>
              {cfg.positionOptions.filter((option) => !isOpenChoice(option.id)).map((option) => option.label).join(' · ')}
            </p>
          )}
        </section>
      )}

      {cfg.showFunctionField && cfg.functionOptions.length > 0 && (showFullReminders || !collecting) && (
        <section className={`${styles.panel} ui-flat-mobile mobile-flatten-card`}>
          <h3 className={styles.panelTitle}>{cfg.functionGuideTitle}</h3>
          <p className={styles.lead}>{cfg.functionHint}</p>
          <ul className={styles.reminderList}>
            {cfg.functionOptions.filter((option) => !isOpenChoice(option.id)).map((option) => (
              <li key={option.id} className={styles.reminderItem}>
                <p className={styles.reminderTitle}>{option.label}</p>
                {option.hint && <p className={styles.anchorHint}>{option.hint}</p>}
              </li>
            ))}
          </ul>
        </section>
      )}

      {cfg.markerExamples.length > 0 && !collecting && (
        <section className={`${styles.panel} ui-flat-mobile mobile-flatten-card`}>
          <h3 className={styles.panelTitle}>Wann scannen?</h3>
          <p className={styles.lead}>Sobald ein Wechselmoment erkennbar ist, Blick vom Puck lösen und den {cfg.targetRoleLabel} suchen. Du musst den Marker nicht benennen.</p>
          <ul className={styles.exampleList}>
            {cfg.markerExamples.map((example) => (
              <li key={example}>{example}</li>
            ))}
          </ul>
        </section>
      )}

      {guide && <DrillGuideCard guide={guide} />}

      {observations.length > 0 && (
        <section className={`${styles.panel} ui-flat-mobile mobile-flatten-card`}>
          <h3 className={styles.panelTitle}>Bisherige {cfg.countNoun}</h3>
          <ul className={styles.observationList}>
            {observations.map((observation, index) => (
              <li key={observation.id} className={styles.observationRow}>
                <p className={styles.observationMeta}>
                  {index + 1}. {optionLabel(cfg.positionOptions, observation.position)}
                  {observation.roleFunction
                    ? ` · ${optionLabel(cfg.functionOptions, observation.roleFunction)}`
                    : ''}
                </p>
                <div className={styles.rowActions}>
                  <button
                    type="button"
                    className={styles.secondaryBtn}
                    onClick={() => patchAnswers(safeAnswers, setAnswers, {
                      [cfg.stageKey]: 'collect',
                      [cfg.editIndexKey]: index,
                      [cfg.addingMoreKey]: false,
                      [cfg.draftKey]: observationToDraft(observation),
                    })}
                  >
                    Bearbeiten
                  </button>
                  <button
                    type="button"
                    className={styles.secondaryBtn}
                    onClick={() => persistObservations(
                      observations.filter((_, itemIndex) => itemIndex !== index).map((item, order) => ({ ...item, order: order + 1 })),
                      { [cfg.stageKey]: 'collect' },
                    )}
                  >
                    Entfernen
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {collecting ? (
        <section className={`${styles.panel} ui-flat-mobile mobile-flatten-card`}>
          <p className={styles.progress}>
            {cfg.countNounSingular} {currentIndex + 1}
            {' · '}
            {cfg.minObservations} minimum / {cfg.recommendedObservations} empfohlen / {cfg.maxObservations} maximum
          </p>
          {guidance && <p className={styles.lead}>{guidance.guidance}</p>}
          {cfg.showTriggerField && (
            <div className={styles.fieldBlock}>
              <div className={styles.fieldLabel}>{cfg.triggerPrompt}</div>
              <OptionChips
                name="shiftTrigger"
                options={triggerChoices}
                value={draft.trigger}
                onChange={(next) => patchAnswers(safeAnswers, setAnswers, {
                  [cfg.draftKey]: { ...draft, trigger: String(next) },
                })}
              />
            </div>
          )}
          <div className={styles.fieldBlock}>
            <div className={styles.fieldLabel}>{cfg.positionPrompt}</div>
            <OptionChips
              name="shiftPosition"
              options={positionChoices}
              value={draft.position}
              onChange={(next) => patchAnswers(safeAnswers, setAnswers, {
                [cfg.draftKey]: { ...draft, position: String(next) },
              })}
            />
          </div>
          {cfg.showFunctionField && (
            <div className={styles.fieldBlock}>
              <div className={styles.fieldLabel}>{cfg.functionPrompt}</div>
              <OptionChips
                name="shiftFunction"
                options={functionChoices}
                value={draft.roleFunction}
                onChange={(next) => patchAnswers(safeAnswers, setAnswers, {
                  [cfg.draftKey]: { ...draft, roleFunction: String(next) },
                })}
              />
              {cfg.functionHint && <p className={styles.fieldHelp}>{cfg.functionHint}</p>}
              {selectedFunction?.detail && <p className={styles.hint}>{selectedFunction.detail}</p>}
            </div>
          )}
          <div className={styles.actions}>
            {isEditing && (
              <button
                type="button"
                className={styles.secondaryBtn}
                onClick={() => patchAnswers(safeAnswers, setAnswers, {
                  [cfg.editIndexKey]: null,
                  [cfg.draftKey]: emptyShiftDraft(),
                  [cfg.addingMoreKey]: false,
                })}
              >
                Abbrechen
              </button>
            )}
            <button type="button" className={styles.primaryBtn} disabled={!canSave} onClick={saveObservation}>
              {cfg.saveButtonLabel}
            </button>
          </div>
        </section>
      ) : (
        <div className={styles.actions}>
          {!atMax && (
            <button type="button" className={styles.primaryBtn} onClick={startNextScan}>
              {cfg.scanButtonLabel}
            </button>
          )}
          {atMin && (
            <button type="button" className={styles.secondaryBtn} onClick={() => patchAnswers(safeAnswers, setAnswers, { [cfg.stageKey]: 'reflect' })}>
              Zur Reflexion
            </button>
          )}
        </div>
      )}
      <p className={styles.progress}>{count} / {progressGoal} {cfg.countNoun}</p>
    </div>
  )
}
