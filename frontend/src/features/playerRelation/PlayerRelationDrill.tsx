import type { Drill } from '../../api'
import { DrillGuideCard } from '../../components/DrillGuideCard'
import { OptionChips } from '../patternLog/OptionChips'
import { PlayerRelationSummary } from './PlayerRelationSummary'
import {
  canAddObservation,
  canEvaluateObservations,
  computePlayerRelationResult,
  draftToObservation,
  emptyRelationDraft,
  findCompletedRelationAnswers,
  isPlayerRelationComplete,
  observationToDraft,
  optionLabel,
  readRelationStage,
  resolvePlayerRelationConfig,
  toReflectionPayload,
} from './relationLogic'
import type { PlayerRelationDraft, PlayerRelationObservation } from './types'
import styles from './PlayerRelationDrill.module.css'

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

function toChoices(options: { id: string; label: string; hint?: string }[], compact: boolean) {
  return options.map((option) => ({
    value: option.id,
    label: option.label,
    description: compact ? undefined : option.hint,
  }))
}

export function PlayerRelationDrill({ drill, answers, setAnswers, session }: Props) {
  const cfg = resolvePlayerRelationConfig(drill?.config || {})
  const safeAnswers = answers || {}
  const stage = readRelationStage(safeAnswers, cfg.stageKey)
  const addingMore = safeAnswers[cfg.addingMoreKey] === true
  const observations: PlayerRelationObservation[] = Array.isArray(safeAnswers[cfg.logsKey])
    ? safeAnswers[cfg.logsKey]
    : []
  const borrowedAnswers = findCompletedRelationAnswers(cfg, safeAnswers, session)
  const usingBorrowed = !isPlayerRelationComplete(cfg, safeAnswers)
    && Boolean(borrowedAnswers)
    && !addingMore
    && observations.length === 0
  const draft: PlayerRelationDraft = {
    ...emptyRelationDraft(),
    ...(safeAnswers[cfg.draftKey] || {}),
  }
  const editIndexRaw = safeAnswers[cfg.editIndexKey]
  const editIndex = typeof editIndexRaw === 'number' ? editIndexRaw : null
  const count = observations.length
  const atMin = canEvaluateObservations(count, cfg.minObservations)
  const atMax = !canAddObservation(count, cfg.maxObservations)
  const isEditing = editIndex !== null && editIndex >= 0 && editIndex < observations.length
  const collecting = isEditing || addingMore
  const result = computePlayerRelationResult(observations, cfg)
  const currentIndex = isEditing ? editIndex : count
  const canSave = Boolean(draftToObservation(draft, currentIndex, cfg.focalRole, isEditing ? observations[editIndex] : undefined))
  const guide = drill?.didactics?.observation_guide
  const compactHints = count >= 2
  const puckChoices = toChoices(cfg.puckCarrierOptions, compactHints)
  const positionChoices = toChoices(cfg.positionOptions, compactHints)
  const relationChoices = toChoices(cfg.relationOptions, compactHints)
  const patternChoices = toChoices(cfg.patternOptions, false)
  const hardestChoices = toChoices(cfg.hardestOptions, false)
  const progressGoal = count >= cfg.recommendedObservations ? cfg.maxObservations : cfg.recommendedObservations
  const selectedRelation = cfg.relationOptions.find((option) => option.id === draft.relation)
  const selectedPuck = cfg.puckCarrierOptions.find((option) => option.id === draft.puckCarrierRole)
  const selectedPosition = cfg.positionOptions.find((option) => option.id === draft.focalPosition)
  const canComplete = cfg.patternOptions.length === 0 || Boolean(String(safeAnswers[cfg.patternKey] || ''))
  const showSketch = cfg.showSketch && Boolean(selectedPuck && selectedPosition && selectedRelation)

  const persistObservations = (next: PlayerRelationObservation[], extra: Record<string, unknown> = {}) => {
    const nextResult = computePlayerRelationResult(next, cfg)
    patchAnswers(safeAnswers, setAnswers, {
      [cfg.logsKey]: next,
      [cfg.resultKey]: nextResult,
      [cfg.payloadKey]: toReflectionPayload(cfg, nextResult, {
        patternNoticed: String(safeAnswers[cfg.patternKey] || ''),
        hardestSituation: String(safeAnswers[cfg.hardestKey] || ''),
        closingNote: String(safeAnswers[cfg.closingNoteKey] || ''),
      }),
      [cfg.draftKey]: emptyRelationDraft(),
      [cfg.editIndexKey]: null,
      [cfg.addingMoreKey]: false,
      ...extra,
    })
  }

  const startNext = () => {
    patchAnswers(safeAnswers, setAnswers, {
      [cfg.stageKey]: 'collect',
      [cfg.addingMoreKey]: true,
      [cfg.editIndexKey]: null,
      [cfg.draftKey]: emptyRelationDraft(),
    })
  }

  const saveObservation = () => {
    const nextObservation = draftToObservation(
      draft,
      currentIndex,
      cfg.focalRole,
      isEditing ? observations[editIndex] : undefined,
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
    const nextResult = computePlayerRelationResult(observations, cfg)
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
    const borrowedResult = computePlayerRelationResult(
      Array.isArray(borrowedAnswers[cfg.logsKey]) ? borrowedAnswers[cfg.logsKey] as PlayerRelationObservation[] : [],
      cfg,
    )
    return (
      <div className={styles.drillRoot}>
        <span className={styles.completeBadge}>✓ {cfg.countNoun} in diesem Spiel abgeschlossen</span>
        <p className={styles.lead}>Weitere {cfg.countNoun} in diesem Drittel sind optional. Du kannst weitergehen.</p>
        <PlayerRelationSummary
          result={borrowedResult}
          cfg={cfg}
          patternLabel={String(borrowedAnswers[cfg.patternKey] || '')}
        />
        <div className={styles.actions}>
          <button type="button" className={styles.secondaryBtn} onClick={startNext}>
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
        <PlayerRelationSummary
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
        <PlayerRelationSummary result={result} cfg={cfg} />
        <section className={`${styles.panel} ui-flat-mobile mobile-flatten-card`}>
          <h3 className={styles.panelTitle}>Kurze Reflexion</h3>
          {cfg.patternOptions.length > 0 && (
            <div className={styles.fieldBlock}>
              <div className={styles.fieldLabel}>{cfg.patternPrompt}</div>
              <OptionChips
                name="relationPattern"
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
                name="relationHardest"
                options={hardestChoices}
                value={String(safeAnswers[cfg.hardestKey] || '')}
                onChange={(next) => patchAnswers(safeAnswers, setAnswers, { [cfg.hardestKey]: String(next) })}
              />
              <p className={styles.fieldHelp}>Optional.</p>
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
            <button type="button" className={styles.secondaryBtn} onClick={startNext}>
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

      {!collecting && (
        <section className={`${styles.panel} ui-flat-mobile mobile-flatten-card`}>
          <h3 className={styles.panelTitle}>{cfg.relationGuideTitle}</h3>
          <p className={styles.lead}>{cfg.relationHint}</p>
          <ul className={styles.reminderList}>
            {cfg.relationOptions.filter((option) => !isOpenChoice(option.id)).map((option) => (
              <li key={option.id} className={styles.reminderItem}>
                <p className={styles.reminderTitle}>{option.label}</p>
                {option.hint && <p className={styles.anchorHint}>{option.hint}</p>}
              </li>
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
                  {index + 1}. {optionLabel(cfg.puckCarrierOptions, observation.puckCarrierRole)}
                  {' → '}
                  {cfg.focalRoleLabel} · {optionLabel(cfg.positionOptions, observation.focalPosition)}
                  {' · '}
                  {optionLabel(cfg.relationOptions, observation.relation)}
                </p>
                {observation.note ? (
                  <p className={styles.fieldHelp} style={{ marginTop: '0.25rem' }}>{observation.note}</p>
                ) : null}
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
          <div className={styles.fieldBlock}>
            <div className={styles.fieldLabel}>{cfg.puckCarrierPrompt}</div>
            <OptionChips
              name="relationPuckCarrier"
              options={puckChoices}
              value={draft.puckCarrierRole}
              onChange={(next) => patchAnswers(safeAnswers, setAnswers, {
                [cfg.draftKey]: { ...draft, puckCarrierRole: String(next) },
              })}
            />
          </div>
          <div className={styles.fieldBlock}>
            <div className={styles.fieldLabel}>{cfg.positionPrompt}</div>
            <OptionChips
              name="relationPosition"
              options={positionChoices}
              value={draft.focalPosition}
              onChange={(next) => patchAnswers(safeAnswers, setAnswers, {
                [cfg.draftKey]: { ...draft, focalPosition: String(next) },
              })}
            />
          </div>
          <div className={styles.fieldBlock}>
            <div className={styles.fieldLabel}>{cfg.relationPrompt}</div>
            <OptionChips
              name="relationType"
              options={relationChoices}
              value={draft.relation}
              onChange={(next) => patchAnswers(safeAnswers, setAnswers, {
                [cfg.draftKey]: { ...draft, relation: String(next) },
              })}
            />
            {cfg.relationHint && <p className={styles.fieldHelp}>{cfg.relationHint}</p>}
            {selectedRelation?.detail && <p className={styles.hint}>{selectedRelation.detail}</p>}
          </div>
          <div className={styles.fieldBlock}>
            <div className={styles.fieldLabel}>Kurze Notiz (optional)</div>
            <textarea
              className={styles.textarea}
              value={draft.note || ''}
              onChange={(event) => patchAnswers(safeAnswers, setAnswers, {
                [cfg.draftKey]: { ...draft, note: event.target.value },
              })}
              maxLength={500}
              rows={2}
              placeholder="Was hast du dir dabei gedacht?"
            />
          </div>
          {showSketch && selectedPuck && selectedPosition && selectedRelation && (
            <div className={styles.sketch} aria-hidden="true">
              <p className={styles.sketchNode}>{selectedPuck.label}</p>
              <p className={styles.sketchArrow}>↓</p>
              <p className={styles.sketchNode}>{cfg.focalRoleLabel} · {selectedPosition.label}</p>
              <p className={styles.sketchRelation}>{selectedRelation.label}</p>
            </div>
          )}
          <div className={styles.actions}>
            {isEditing && (
              <button
                type="button"
                className={styles.secondaryBtn}
                onClick={() => patchAnswers(safeAnswers, setAnswers, {
                  [cfg.editIndexKey]: null,
                  [cfg.draftKey]: emptyRelationDraft(),
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
            <button type="button" className={styles.primaryBtn} onClick={startNext}>
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
