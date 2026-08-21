import type { Drill } from '../../api'
import { DrillGuideCard } from '../../components/DrillGuideCard'
import { OptionChips } from '../patternLog/OptionChips'
import { RoleIdentificationSummary } from './RoleIdentificationSummary'
import {
  canAddObservation,
  canEvaluateObservations,
  computeRoleIdentificationResult,
  draftToObservation,
  emptyRoleDraft,
  findCompletedRoleAnswers,
  isRoleIdentificationComplete,
  observationStepForIndex,
  observationToDraft,
  optionLabel,
  readRoleStage,
  resolveRoleIdentificationConfig,
  showsLineupHint,
  showsSearchAnchors,
  toReflectionPayload,
} from './roleLogic'
import type { FoundStatus, RoleObservation, RoleObservationDraft } from './types'
import styles from './RoleIdentificationDrill.module.css'

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

export function RoleIdentificationDrill({ drill, answers, setAnswers, session }: Props) {
  const cfg = resolveRoleIdentificationConfig(drill?.config || {})
  const safeAnswers = answers || {}
  const stage = readRoleStage(safeAnswers, cfg.stageKey)
  const borrowedAnswers = findCompletedRoleAnswers(cfg, safeAnswers, session)
  const addingMore = safeAnswers[cfg.addingMoreKey] === true
  const observations: RoleObservation[] = Array.isArray(safeAnswers[cfg.logsKey])
    ? safeAnswers[cfg.logsKey]
    : []
  const usingBorrowed = !isRoleIdentificationComplete(cfg, safeAnswers)
    && Boolean(borrowedAnswers)
    && !addingMore
    && observations.length === 0
  const draft: RoleObservationDraft = {
    ...emptyRoleDraft(),
    ...(safeAnswers[cfg.draftKey] || {}),
  }
  const editIndexRaw = safeAnswers[cfg.editIndexKey]
  const editIndex = typeof editIndexRaw === 'number' ? editIndexRaw : null
  const count = observations.length
  const atMin = canEvaluateObservations(count, cfg.minObservations)
  const atMax = !canAddObservation(count, cfg.maxObservations)
  const isEditing = editIndex !== null && editIndex >= 0 && editIndex < observations.length
  // Always show the collect form until min is reached — even if a draft left stage=reflect early.
  const collecting = isEditing || count < cfg.minObservations || (addingMore && !atMax)
  const result = computeRoleIdentificationResult(observations)
  const currentIndex = isEditing ? editIndex : count
  const step = observationStepForIndex(cfg, currentIndex)
  const canSave = Boolean(draftToObservation(draft, currentIndex, isEditing ? observations[editIndex] : undefined, step?.id))
  const guide = drill?.didactics?.observation_guide
  const foundOptions = cfg.foundOptions.map((option) => ({ value: option.id, label: option.label }))
  const hintOptions = cfg.hintOptions.map((option) => ({ value: option.id, label: option.label }))
  const progressGoal = count >= cfg.recommendedObservations ? cfg.maxObservations : cfg.recommendedObservations

  const updateDraft = (patch: Partial<RoleObservationDraft>) => {
    patchAnswers(safeAnswers, setAnswers, {
      [cfg.draftKey]: { ...draft, ...patch },
    })
  }

  const persistObservations = (next: RoleObservation[], extra: Record<string, unknown> = {}) => {
    const nextResult = computeRoleIdentificationResult(next)
    patchAnswers(safeAnswers, setAnswers, {
      [cfg.logsKey]: next,
      [cfg.resultKey]: nextResult,
      [cfg.payloadKey]: toReflectionPayload(cfg, nextResult, String(safeAnswers[cfg.closingNoteKey] || '')),
      [cfg.draftKey]: emptyRoleDraft(),
      [cfg.editIndexKey]: null,
      [cfg.addingMoreKey]: false,
      ...extra,
    })
  }

  const saveObservation = () => {
    const nextObservation = draftToObservation(
      draft,
      currentIndex,
      isEditing ? observations[editIndex] : undefined,
      step?.id,
    )
    if (!nextObservation) return
    const next = [...observations]
    if (isEditing) next[editIndex] = { ...nextObservation, order: editIndex + 1 }
    else next.push({ ...nextObservation, order: next.length + 1 })
    const nextCount = next.length
    persistObservations(next, {
      [cfg.stageKey]: nextCount >= cfg.minObservations ? 'reflect' : 'collect',
      [cfg.addingMoreKey]: false,
    })
  }

  const startNextObservation = () => {
    patchAnswers(safeAnswers, setAnswers, {
      [cfg.stageKey]: 'collect',
      [cfg.addingMoreKey]: true,
      [cfg.editIndexKey]: null,
      [cfg.draftKey]: emptyRoleDraft(),
    })
  }

  const completeDrill = () => {
    const nextResult = computeRoleIdentificationResult(observations)
    patchAnswers(safeAnswers, setAnswers, {
      [cfg.stageKey]: 'complete',
      [cfg.resultKey]: nextResult,
      [cfg.payloadKey]: toReflectionPayload(cfg, nextResult, String(safeAnswers[cfg.closingNoteKey] || '')),
    })
  }

  if (usingBorrowed && borrowedAnswers) {
    const borrowedResult = computeRoleIdentificationResult(
      Array.isArray(borrowedAnswers[cfg.logsKey])
        ? borrowedAnswers[cfg.logsKey] as RoleObservation[]
        : [],
    )
    return (
      <div className={styles.drillRoot}>
        <span className={styles.completeBadge}>✓ Suche in diesem Spiel abgeschlossen</span>
        <p className={styles.lead}>
          Weitere Situationen in diesem Drittel sind optional. Du kannst weitergehen.
        </p>
        <RoleIdentificationSummary result={borrowedResult} cfg={cfg} />
        <div className={styles.actions}>
          <button type="button" className={styles.secondaryBtn} onClick={startNextObservation}>
            Noch eine Situation
          </button>
        </div>
      </div>
    )
  }

  if (stage === 'complete') {
    return (
      <div className={styles.drillRoot}>
        <span className={styles.completeBadge}>✓ Suche abgeschlossen</span>
        <RoleIdentificationSummary result={result} cfg={cfg} />
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
        <p className={styles.eyebrow}>Suchstrategie</p>
        <h2 className={styles.title}>{drill.title}</h2>
        {observations.length > 0 && (
          <section className={`${styles.panel} ui-flat-mobile mobile-flatten-card`}>
            <h3 className={styles.panelTitle}>Bisherige Beobachtungen</h3>
            <ul className={styles.observationList}>
              {observations.map((observation, index) => (
                <li key={observation.id} className={styles.observationRow}>
                  <p className={styles.observationMeta}>
                    {index + 1}. {optionLabel(cfg.foundOptions, observation.found, true)}
                    {' · '}
                    {optionLabel(cfg.hintOptions, observation.helpfulHint)}
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
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}
        <RoleIdentificationSummary result={result} cfg={cfg} />
        <section className={`${styles.panel} ui-flat-mobile mobile-flatten-card`}>
          <h3 className={styles.panelTitle}>Kurze Reflexion</h3>
          <div className={styles.fieldBlock}>
            <div className={styles.fieldLabel}>{cfg.closingPrompt}</div>
            <textarea
              className={styles.textarea}
              value={String(safeAnswers[cfg.closingNoteKey] || '')}
              onChange={(event) => patchAnswers(safeAnswers, setAnswers, { [cfg.closingNoteKey]: event.target.value })}
              maxLength={1500}
              placeholder={cfg.closingNotePlaceholder}
            />
            <p className={styles.fieldHelp}>Optional. Ein Satz reicht.</p>
          </div>
        </section>
        <div className={styles.actions}>
          {!atMax && (
            <button type="button" className={styles.secondaryBtn} onClick={startNextObservation}>
              Noch eine Situation
            </button>
          )}
          <button type="button" className={styles.primaryBtn} onClick={completeDrill}>
            Abschluss ansehen
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.drillRoot}>
      <p className={styles.eyebrow}>Rolle finden</p>
      <h2 className={styles.title}>{drill.title}</h2>
      {drill.description && <p className={styles.lead}>{drill.description}</p>}
      {cfg.whyThisRole && <p className={styles.lead}>{cfg.whyThisRole}</p>}
      {cfg.decisionRule && <p className={styles.rule}>{cfg.decisionRule}</p>}
      {cfg.coreHint && <p className={styles.hint}>{cfg.coreHint}</p>}
      {showsLineupHint(cfg.guidanceMode) && cfg.lineupHint && (
        <p className={styles.hint}>{cfg.lineupHint}</p>
      )}
      {showsSearchAnchors(cfg.guidanceMode) && cfg.searchAnchors.length > 0 && (
        <section className={`${styles.panel} ui-flat-mobile mobile-flatten-card`}>
          <h3 className={styles.panelTitle}>Suchhilfen</h3>
          <ul className={styles.anchorList}>
            {cfg.searchAnchors.map((anchor) => (
              <li key={anchor.id} className={styles.anchorItem}>
                <p className={styles.anchorTitle}>{anchor.label}</p>
                {anchor.hint && <p className={styles.anchorHint}>{anchor.hint}</p>}
              </li>
            ))}
          </ul>
          {cfg.searchAnchorsDisclaimer && <p className={styles.disclaimer}>{cfg.searchAnchorsDisclaimer}</p>}
        </section>
      )}
      {guide && <DrillGuideCard guide={guide} />}

      {observations.length > 0 && (
        <section className={`${styles.panel} ui-flat-mobile mobile-flatten-card`}>
          <h3 className={styles.panelTitle}>Bisherige Beobachtungen</h3>
          <ul className={styles.observationList}>
            {observations.map((observation, index) => (
              <li key={observation.id} className={styles.observationRow}>
                <p className={styles.observationMeta}>
                  {index + 1}. {optionLabel(cfg.foundOptions, observation.found, true)}
                  {' · '}
                  {optionLabel(cfg.hintOptions, observation.helpfulHint)}
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
                      { [cfg.stageKey]: 'collect', [cfg.addingMoreKey]: false },
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
            Beobachtung {currentIndex + 1}
            {' · '}
            {cfg.minObservations} minimum / {cfg.recommendedObservations} empfohlen / {cfg.maxObservations} maximum
          </p>
          {step && (
            <div className={styles.fieldBlock}>
              <h3 className={styles.panelTitle}>{step.title}</h3>
              <p className={styles.lead}>{step.guidance}</p>
            </div>
          )}
          <div className={styles.fieldBlock}>
            <div className={styles.fieldLabel}>Konntest du den {cfg.targetRoleLabel} wiederfinden?</div>
            <OptionChips
              name="roleFound"
              options={foundOptions}
              value={draft.found}
              onChange={(next) => updateDraft({ found: String(next) as FoundStatus })}
            />
          </div>
          <div className={styles.fieldBlock}>
            <div className={styles.fieldLabel}>Welcher Hinweis hat dir am meisten geholfen?</div>
            <OptionChips
              name="roleHint"
              options={hintOptions}
              value={draft.helpfulHint}
              onChange={(next) => updateDraft({ helpfulHint: String(next) })}
            />
          </div>
          <div className={styles.fieldBlock}>
            <div className={styles.fieldLabel}>Kurze Notiz (optional)</div>
            <textarea
              className={styles.textarea}
              value={draft.note}
              onChange={(event) => updateDraft({ note: event.target.value })}
              maxLength={1500}
              placeholder="Nur wenn etwas hängen bleibt."
            />
          </div>
          <div className={styles.actions}>
            {isEditing && (
              <button
                type="button"
                className={styles.secondaryBtn}
                onClick={() => patchAnswers(safeAnswers, setAnswers, {
                  [cfg.editIndexKey]: null,
                  [cfg.draftKey]: emptyRoleDraft(),
                  [cfg.addingMoreKey]: false,
                })}
              >
                Abbrechen
              </button>
            )}
            <button type="button" className={styles.primaryBtn} disabled={!canSave} onClick={saveObservation}>
              Beobachtung speichern
            </button>
          </div>
        </section>
      ) : (
        <div className={styles.actions}>
          {atMin && (
            <button type="button" className={styles.primaryBtn} onClick={() => patchAnswers(safeAnswers, setAnswers, { [cfg.stageKey]: 'reflect' })}>
              Zur Reflexion
            </button>
          )}
          {!atMax && (
            <button type="button" className={styles.secondaryBtn} onClick={startNextObservation}>
              Noch eine Situation
            </button>
          )}
        </div>
      )}
      <p className={styles.progress}>
        {count} / {progressGoal} Situationen
      </p>
    </div>
  )
}
