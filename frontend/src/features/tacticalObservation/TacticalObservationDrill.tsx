import type { Drill } from '../../api'
import { DrillGuideCard } from '../../components/DrillGuideCard'
import { OptionChips } from '../patternLog/OptionChips'
import { TacticalObservationSummary } from './TacticalObservationSummary'
import {
  canAddObservation,
  canEvaluateObservations,
  computeTacticalObservationResult,
  draftToObservation,
  emptyTacticalDraft,
  encodeLayerValues,
  findCompletedTacticalAnswers,
  findGuideLayer,
  formatLayerValue,
  getObservationValue,
  isTacticalObservationComplete,
  observationToDraft,
  readTacticalStage,
  resolveTacticalObservationConfig,
  toReflectionPayload,
  syncMultiSelectValues,
  decodeLayerValues,
} from './tacticalLogic'
import type { TacticalObservation, TacticalObservationDraft } from './types'
import styles from './TacticalObservationDrill.module.css'

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
  return id === 'unsure' || id === 'unclear' || id === 'none'
}

function toChoices(options: { id: string; label: string; hint?: string }[], compact: boolean) {
  return options.map((option) => ({
    value: option.id,
    label: option.label,
    description: compact ? undefined : option.hint,
  }))
}

export function TacticalObservationDrill({ drill, answers, setAnswers, session, phase }: Props) {
  const cfg = resolveTacticalObservationConfig(drill?.config || {})
  const safeAnswers = answers || {}
  const stage = readTacticalStage(safeAnswers, cfg.stageKey)
  const addingMore = safeAnswers[cfg.addingMoreKey] === true
  const observations: TacticalObservation[] = Array.isArray(safeAnswers[cfg.logsKey])
    ? safeAnswers[cfg.logsKey]
    : []
  const borrowedAnswers = findCompletedTacticalAnswers(cfg, safeAnswers, session)
  const usingBorrowed = !isTacticalObservationComplete(cfg, safeAnswers)
    && Boolean(borrowedAnswers)
    && !addingMore
    && observations.length === 0
  const draft: TacticalObservationDraft = {
    ...emptyTacticalDraft(cfg),
    ...(safeAnswers[cfg.draftKey] || {}),
  }
  const editIndexRaw = safeAnswers[cfg.editIndexKey]
  const editIndex = typeof editIndexRaw === 'number' ? editIndexRaw : null
  const count = observations.length
  const atMin = canEvaluateObservations(count, cfg.minObservations)
  const atMax = !canAddObservation(count, cfg.maxObservations)
  const isEditing = editIndex !== null && editIndex >= 0 && editIndex < observations.length
  const collecting = isEditing || addingMore
  const result = computeTacticalObservationResult(observations, cfg)
  const currentIndex = isEditing ? editIndex : count
  const canSave = Boolean(draftToObservation(draft, cfg, currentIndex, isEditing ? observations[editIndex] : undefined))
  const guide = drill?.didactics?.observation_guide
  const compactHints = count >= 2
  const patternChoices = toChoices(cfg.patternOptions, false)
  const progressGoal = count >= cfg.recommendedObservations ? cfg.maxObservations : cfg.recommendedObservations
  const guideLayer = findGuideLayer(cfg)
  const canComplete = cfg.patternOptions.length === 0 || Boolean(String(safeAnswers[cfg.patternKey] || ''))

  const persistObservations = (next: TacticalObservation[], extra: Record<string, unknown> = {}) => {
    const nextResult = computeTacticalObservationResult(next, cfg)
    patchAnswers(safeAnswers, setAnswers, {
      [cfg.logsKey]: next,
      [cfg.resultKey]: nextResult,
      [cfg.payloadKey]: toReflectionPayload(cfg, nextResult, {
        patternNoticed: String(safeAnswers[cfg.patternKey] || ''),
        closingNote: String(safeAnswers[cfg.closingNoteKey] || ''),
      }),
      [cfg.draftKey]: emptyTacticalDraft(cfg),
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
      [cfg.draftKey]: emptyTacticalDraft(cfg),
    })
  }

  const saveObservation = () => {
    const nextObservation = draftToObservation(
      draft,
      cfg,
      currentIndex,
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
    const nextResult = computeTacticalObservationResult(observations, cfg)
    patchAnswers(safeAnswers, setAnswers, {
      [cfg.stageKey]: 'complete',
      [cfg.resultKey]: nextResult,
      [cfg.payloadKey]: toReflectionPayload(cfg, nextResult, {
        patternNoticed: String(safeAnswers[cfg.patternKey] || ''),
        closingNote: String(safeAnswers[cfg.closingNoteKey] || ''),
      }),
    })
  }

  const formatObservationSummary = (observation: TacticalObservation) => (
    cfg.layers.map((layer) => formatLayerValue(layer, getObservationValue(observation, layer.fieldKey))).join(' · ')
  )

  if (usingBorrowed && borrowedAnswers) {
    const borrowedResult = computeTacticalObservationResult(
      Array.isArray(borrowedAnswers[cfg.logsKey]) ? borrowedAnswers[cfg.logsKey] as TacticalObservation[] : [],
      cfg,
    )
    return (
      <div className={styles.drillRoot}>
        <span className={styles.completeBadge}>✓ {cfg.countNoun} in diesem Spiel abgeschlossen</span>
        <p className={styles.lead}>Weitere {cfg.countNoun} in diesem Drittel sind optional. Du kannst weitergehen.</p>
        <TacticalObservationSummary
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
        <TacticalObservationSummary
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
        <TacticalObservationSummary result={result} cfg={cfg} />
        <section className={`${styles.panel} ui-flat-mobile mobile-flatten-card`}>
          <h3 className={styles.panelTitle}>Kurze Reflexion</h3>
          {cfg.patternOptions.length > 0 && (
            <div className={styles.fieldBlock}>
              <div className={styles.fieldLabel}>{cfg.patternPrompt}</div>
              <OptionChips
                name="tacticalPattern"
                options={patternChoices}
                value={String(safeAnswers[cfg.patternKey] || '')}
                onChange={(next) => patchAnswers(safeAnswers, setAnswers, { [cfg.patternKey]: String(next) })}
              />
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

      {!collecting && guideLayer && (
        <section className={`${styles.panel} ui-flat-mobile mobile-flatten-card`}>
          <h3 className={styles.panelTitle}>{guideLayer.guideTitle || guideLayer.resultTitle}</h3>
          {guideLayer.hint && <p className={styles.lead}>{guideLayer.hint}</p>}
          <ul className={styles.reminderList}>
            {guideLayer.options.filter((option) => !isOpenChoice(option.id)).map((option) => (
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
                  {index + 1}. {formatObservationSummary(observation)}
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
                      [cfg.draftKey]: observationToDraft(observation, cfg),
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
          {cfg.layers.map((layer) => {
            const selectedIds = decodeLayerValues(draft[layer.fieldKey] || '')
            const selected = layer.multiSelect
              ? layer.options.find((option) => selectedIds.includes(option.id) && option.detail)
              : layer.options.find((option) => option.id === draft[layer.fieldKey])
            return (
              <div key={layer.id} className={styles.fieldBlock}>
                <div className={styles.fieldLabel}>{layer.prompt}</div>
                <OptionChips
                  name={`tactical-${layer.id}`}
                  options={toChoices(layer.options, compactHints)}
                  multi={Boolean(layer.multiSelect)}
                  value={layer.multiSelect ? undefined : (draft[layer.fieldKey] || '')}
                  selectedValues={layer.multiSelect ? selectedIds : undefined}
                  onChange={(next) => {
                    const encoded = layer.multiSelect
                      ? encodeLayerValues(
                          syncMultiSelectValues(selectedIds, Array.isArray(next) ? next : [String(next)], layer.options),
                          layer.options,
                        )
                      : String(next)
                    patchAnswers(safeAnswers, setAnswers, {
                      [cfg.draftKey]: { ...draft, [layer.fieldKey]: encoded },
                    })
                  }}
                />
                {selected?.detail && <p className={styles.hint}>{selected.detail}</p>}
              </div>
            )
          })}
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
          <div className={styles.actions}>
            {isEditing && (
              <button
                type="button"
                className={styles.secondaryBtn}
                onClick={() => patchAnswers(safeAnswers, setAnswers, {
                  [cfg.editIndexKey]: null,
                  [cfg.draftKey]: emptyTacticalDraft(cfg),
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
