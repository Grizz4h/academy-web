import type { Drill } from '../../api'
import { DrillGuideCard } from '../../components/DrillGuideCard'
import { OptionChips } from '../patternLog/OptionChips'
import { SimpleStructureSummary } from './SimpleStructureSummary'
import {
  canAddObservation,
  canEvaluateObservations,
  computeSimpleStructureResult,
  draftToObservation,
  emptyStructureDraft,
  findCompletedStructureAnswers,
  guidanceForIndex,
  isSimpleStructureComplete,
  observationToDraft,
  optionLabel,
  readStructureStage,
  resolveSimpleStructureConfig,
  toReflectionPayload,
} from './structureLogic'
import type { SimpleStructureDraft, SimpleStructureObservation } from './types'
import styles from './SimpleStructureDrill.module.css'

type Props = {
  drill: Drill
  answers: Record<string, any>
  setAnswers: (next: Record<string, any>) => void
  session?: { drafts?: Record<string, unknown>; checkins?: Array<{ answers?: Record<string, unknown> }> }
  phase?: string
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

function StructureSketch({
  structureType,
  focalLabel,
}: {
  structureType: string
  focalLabel: string
}) {
  if (structureType === 'single_option') {
    return (
      <div className={styles.sketch} aria-hidden="true">
        <div className={styles.sketchRow}>
          <span className={styles.dot}>Puckführer</span>
          <span className={styles.dot}>{focalLabel}</span>
        </div>
        <p className={styles.sketchCaption}>eine klare Option</p>
      </div>
    )
  }
  if (structureType === 'multiple_options') {
    return (
      <div className={styles.sketch} aria-hidden="true">
        <span className={styles.dot}>{focalLabel}</span>
        <div className={styles.sketchRow}>
          <span className={styles.dot}>Puckführer</span>
          <span className={styles.dot}>Mitspieler</span>
        </div>
        <p className={styles.sketchCaption}>mehrere Anschlussoptionen</p>
      </div>
    )
  }
  if (structureType === 'triangle') {
    return (
      <div className={styles.sketch} aria-hidden="true">
        <span className={styles.dot}>{focalLabel}</span>
        <div className={styles.sketchRow}>
          <span className={styles.dot}>Puckführer</span>
          <span className={styles.dot}>Mitspieler</span>
        </div>
        <p className={styles.sketchCaption}>keine perfekte Geometrie nötig</p>
      </div>
    )
  }
  if (structureType === 'coverage_structure') {
    return (
      <div className={styles.sketch} aria-hidden="true">
        <div className={styles.sketchRow}>
          <span className={styles.dot}>Puckführer</span>
          <span className={styles.dot}>Mitspieler</span>
        </div>
        <span className={styles.dot}>{focalLabel}</span>
        <p className={styles.sketchCaption}>Absicherung hinter der Aktion</p>
      </div>
    )
  }
  return (
    <div className={styles.sketch} aria-hidden="true">
      <div className={styles.sketchRow}>
        <span className={`${styles.dot} ${styles.dotMuted}`}>?</span>
        <span className={`${styles.dot} ${styles.dotMuted}`}>?</span>
        <span className={`${styles.dot} ${styles.dotMuted}`}>?</span>
      </div>
      <p className={styles.sketchCaption}>keine klare Struktur</p>
    </div>
  )
}

export function SimpleStructureDrill({ drill, answers, setAnswers, session, phase }: Props) {
  const cfg = resolveSimpleStructureConfig(drill?.config || {})
  const safeAnswers = answers || {}
  const stage = readStructureStage(safeAnswers, cfg.stageKey)
  const addingMore = safeAnswers[cfg.addingMoreKey] === true
  const observations: SimpleStructureObservation[] = Array.isArray(safeAnswers[cfg.logsKey])
    ? safeAnswers[cfg.logsKey]
    : []
  const borrowedAnswers = findCompletedStructureAnswers(cfg, safeAnswers, session)
  const usingBorrowed = !isSimpleStructureComplete(cfg, safeAnswers)
    && Boolean(borrowedAnswers)
    && !addingMore
    && observations.length === 0
  const draft: SimpleStructureDraft = {
    ...emptyStructureDraft(),
    ...(safeAnswers[cfg.draftKey] || {}),
  }
  const editIndexRaw = safeAnswers[cfg.editIndexKey]
  const editIndex = typeof editIndexRaw === 'number' ? editIndexRaw : null
  const count = observations.length
  const atMin = canEvaluateObservations(count, cfg.minObservations)
  const atMax = !canAddObservation(count, cfg.maxObservations)
  const isEditing = editIndex !== null && editIndex >= 0 && editIndex < observations.length
  const collecting = isEditing || addingMore
  const result = computeSimpleStructureResult(observations, cfg.structureOptions)
  const currentIndex = isEditing ? editIndex : count
  const guidance = guidanceForIndex(cfg, currentIndex)
  const canSave = Boolean(draftToObservation(draft, currentIndex, cfg.focalRole, isEditing ? observations[editIndex] : undefined))
  const guide = drill?.didactics?.observation_guide
  const compactHints = count >= 2
  const structureChoices = cfg.structureOptions.map((option) => ({
    value: option.id,
    label: option.label,
    description: compactHints ? undefined : option.hint,
  }))
  const patternChoices = cfg.patternOptions.map((option) => ({ value: option.id, label: option.label }))
  const nextFocusChoices = cfg.nextFocusOptions.map((option) => ({ value: option.id, label: option.label }))
  const progressGoal = count >= cfg.recommendedObservations ? cfg.maxObservations : cfg.recommendedObservations
  const selected = cfg.structureOptions.find((option) => option.id === draft.structureType)
  const canComplete = cfg.patternOptions.length === 0 || Boolean(String(safeAnswers[cfg.patternKey] || ''))

  const persistObservations = (next: SimpleStructureObservation[], extra: Record<string, unknown> = {}) => {
    const nextResult = computeSimpleStructureResult(next, cfg.structureOptions)
    patchAnswers(safeAnswers, setAnswers, {
      [cfg.logsKey]: next,
      [cfg.resultKey]: nextResult,
      [cfg.payloadKey]: toReflectionPayload(cfg, nextResult, {
        patternNoticed: String(safeAnswers[cfg.patternKey] || ''),
        nextFocus: String(safeAnswers[cfg.nextFocusKey] || ''),
        closingNote: String(safeAnswers[cfg.closingNoteKey] || ''),
      }),
      [cfg.draftKey]: emptyStructureDraft(),
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
      [cfg.draftKey]: emptyStructureDraft(),
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
    if (phase && !nextObservation.period) nextObservation.period = phase
    const next = [...observations]
    if (isEditing) next[editIndex] = { ...nextObservation, order: editIndex + 1 }
    else next.push({ ...nextObservation, order: next.length + 1 })
    persistObservations(next, {
      [cfg.stageKey]: next.length >= cfg.minObservations ? 'reflect' : 'collect',
    })
  }

  const completeDrill = () => {
    const nextResult = computeSimpleStructureResult(observations, cfg.structureOptions)
    patchAnswers(safeAnswers, setAnswers, {
      [cfg.stageKey]: 'complete',
      [cfg.resultKey]: nextResult,
      [cfg.payloadKey]: toReflectionPayload(cfg, nextResult, {
        patternNoticed: String(safeAnswers[cfg.patternKey] || ''),
        nextFocus: String(safeAnswers[cfg.nextFocusKey] || ''),
        closingNote: String(safeAnswers[cfg.closingNoteKey] || ''),
      }),
    })
  }

  if (usingBorrowed && borrowedAnswers) {
    const borrowedResult = computeSimpleStructureResult(
      Array.isArray(borrowedAnswers[cfg.logsKey]) ? borrowedAnswers[cfg.logsKey] as SimpleStructureObservation[] : [],
      cfg.structureOptions,
    )
    return (
      <div className={styles.drillRoot}>
        <span className={styles.completeBadge}>✓ {cfg.countNoun} in diesem Spiel abgeschlossen</span>
        <p className={styles.lead}>Weitere {cfg.countNoun} in diesem Drittel sind optional. Du kannst weitergehen.</p>
        <SimpleStructureSummary
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
        <SimpleStructureSummary
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
        <SimpleStructureSummary result={result} cfg={cfg} />
        <section className={`${styles.panel} ui-flat-mobile mobile-flatten-card`}>
          <h3 className={styles.panelTitle}>Kurze Reflexion</h3>
          {cfg.patternOptions.length > 0 && (
            <div className={styles.fieldBlock}>
              <div className={styles.fieldLabel}>{cfg.patternPrompt}</div>
              <OptionChips
                name="structurePattern"
                options={patternChoices}
                value={String(safeAnswers[cfg.patternKey] || '')}
                onChange={(next) => patchAnswers(safeAnswers, setAnswers, { [cfg.patternKey]: String(next) })}
              />
            </div>
          )}
          {cfg.nextFocusOptions.length > 0 && (
            <div className={styles.fieldBlock}>
              <div className={styles.fieldLabel}>{cfg.nextFocusPrompt}</div>
              <OptionChips
                name="structureNextFocus"
                options={nextFocusChoices}
                value={String(safeAnswers[cfg.nextFocusKey] || '')}
                onChange={(next) => patchAnswers(safeAnswers, setAnswers, { [cfg.nextFocusKey]: String(next) })}
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
          <h3 className={styles.panelTitle}>{cfg.structureGuideTitle}</h3>
          <p className={styles.lead}>{cfg.structureHint}</p>
          <ul className={styles.reminderList}>
            {cfg.structureOptions.filter((option) => !isOpenChoice(option.id)).map((option) => (
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
                  {index + 1}. {optionLabel(cfg.structureOptions, observation.structureType)}
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
          {guidance && <p className={styles.lead}>{guidance.guidance}</p>}
          <div className={styles.fieldBlock}>
            <div className={styles.fieldLabel}>{cfg.structurePrompt}</div>
            <OptionChips
              name="simpleStructureType"
              options={structureChoices}
              value={draft.structureType}
              onChange={(next) => patchAnswers(safeAnswers, setAnswers, {
                [cfg.draftKey]: { ...draft, structureType: String(next) },
              })}
            />
            {selected?.detail && <p className={styles.hint}>{selected.detail}</p>}
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
          {cfg.showSketch && selected && (
            <StructureSketch structureType={selected.id} focalLabel={cfg.focalRoleLabel} />
          )}
          <div className={styles.actions}>
            {isEditing && (
              <button
                type="button"
                className={styles.secondaryBtn}
                onClick={() => patchAnswers(safeAnswers, setAnswers, {
                  [cfg.editIndexKey]: null,
                  [cfg.draftKey]: emptyStructureDraft(),
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
