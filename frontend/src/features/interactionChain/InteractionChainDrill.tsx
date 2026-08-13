import type { Drill } from '../../api'
import { DrillGuideCard } from '../../components/DrillGuideCard'
import { OptionChips } from '../patternLog/OptionChips'
import {
  getAdjustmentDimensionOptions,
  getComparabilityOptions,
  getExampleCountOptions,
  getInteractionAssessmentOptions,
  getMagnitudeOptions,
  getProblemCategoryOptions,
  getProblemEffectOptions,
  getProblemEvidenceOptions,
  getResponseRepetitionOptions,
  getResponseTypeOptions,
  getTradeoffOptions,
  resolveInteractionChainConfig,
  validateInteractionChainAnswers,
  viewFromAnswers,
} from './chainLogic'
import { InteractionChainSurface } from './InteractionChainSurface'
import type { ChainExamplesHelp, InteractionChainStage } from './types'
import styles from './InteractionChainDrill.module.css'

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

function ExamplesAccordion({ help }: { help: ChainExamplesHelp }) {
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

function canAdvance(
  stage: InteractionChainStage,
  cfg: ReturnType<typeof resolveInteractionChainConfig>,
  answers: Record<string, any>,
): boolean {
  if (stage === 'problem') {
    const evidence = Array.isArray(answers[cfg.problemEvidenceKey]) ? answers[cfg.problemEvidenceKey] : []
    return Boolean(
      String(answers[cfg.problemDescriptionKey] || '').trim()
        && answers[cfg.problemCategoryKey]
        && evidence.length > 0,
    )
  }
  if (stage === 'adjustment') {
    return Boolean(
      String(answers[cfg.adjustmentDescriptionKey] || '').trim()
        && answers[cfg.adjustmentDimensionKey]
        && answers[cfg.changeMagnitudeKey],
    )
  }
  if (stage === 'response') {
    return Boolean(
      answers[cfg.responseTypeKey]
        && String(answers[cfg.responseDescriptionKey] || '').trim(),
    )
  }
  if (stage === 'assess') {
    return validateInteractionChainAnswers(cfg, answers) === null
  }
  return false
}

const STAGE_ORDER: InteractionChainStage[] = [
  'problem',
  'adjustment',
  'response',
  'assess',
  'complete',
]

export function InteractionChainDrill({ drill, answers, setAnswers }: Props) {
  const safeAnswers = answers || {}
  const cfg = resolveInteractionChainConfig(drill?.config || {})
  const stage = (safeAnswers[cfg.stageKey] || 'problem') as InteractionChainStage
  const evidence = Array.isArray(safeAnswers[cfg.problemEvidenceKey])
    ? (safeAnswers[cfg.problemEvidenceKey] as string[])
    : []

  const setStage = (next: InteractionChainStage) => {
    patchAnswers(safeAnswers, setAnswers, { [cfg.stageKey]: next })
  }

  const goNext = () => {
    const idx = STAGE_ORDER.indexOf(stage)
    if (idx < 0 || idx >= STAGE_ORDER.length - 1) return
    if (!canAdvance(stage, cfg, safeAnswers)) return
    setStage(STAGE_ORDER[idx + 1])
  }

  const goBack = () => {
    const idx = STAGE_ORDER.indexOf(stage)
    if (idx <= 0) return
    setStage(STAGE_ORDER[idx - 1])
  }

  const guide = drill?.didactics?.observation_guide
  const preview = viewFromAnswers(cfg, safeAnswers)
  const showPreview = Boolean(preview.problemDescription || preview.adjustmentDescription || preview.responseDescription)

  if (stage === 'complete') {
    return (
      <div className={styles.drillRoot}>
        <span className={styles.completeBadge}>✓ Adjustment-Kette erfasst</span>
        <InteractionChainSurface result={preview} />
        <div className={styles.actions}>
          <button type="button" className={styles.secondaryBtn} onClick={() => setStage('problem')}>
            Problem bearbeiten
          </button>
          <button type="button" className={styles.secondaryBtn} onClick={() => setStage('adjustment')}>
            Veränderung bearbeiten
          </button>
          <button type="button" className={styles.secondaryBtn} onClick={() => setStage('response')}>
            Reaktion bearbeiten
          </button>
          <button type="button" className={styles.secondaryBtn} onClick={() => setStage('assess')}>
            Einschätzung bearbeiten
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.drillRoot}>
      <p className={styles.eyebrow}>Interaction Chain</p>
      <h2 className={styles.title}>{drill.title}</h2>
      {drill.description && <p className={styles.lead}>{drill.description}</p>}
      {drill.didactics?.explanation && <p className={styles.lead}>{drill.didactics.explanation}</p>}
      <p className={styles.rule}>{cfg.decisionRule}</p>
      <p className={styles.hint}>{cfg.coreHint}</p>
      {cfg.examplesHelp && <ExamplesAccordion help={cfg.examplesHelp} />}
      {guide && <DrillGuideCard guide={guide} />}
      {showPreview && stage !== 'problem' && (
        <InteractionChainSurface title="Bisherige Kette" result={preview} compact />
      )}

      {stage === 'problem' && (
        <section className={`${styles.panel} ui-flat-mobile mobile-flatten-card`}>
          <div className={styles.fieldBlock}>
            <div className={styles.fieldLabel}>Welches wiederkehrende Problem beobachtest du vor der Veränderung?</div>
            <textarea
              className={styles.textarea}
              value={String(safeAnswers[cfg.problemDescriptionKey] || '')}
              maxLength={500}
              placeholder="z. B. Gegnerische Entries gelangen wiederholt zentral durch die Neutral Zone."
              onChange={(event) =>
                patchAnswers(safeAnswers, setAnswers, { [cfg.problemDescriptionKey]: event.target.value })
              }
            />
          </div>

          <div className={styles.fieldBlock}>
            <div className={styles.fieldLabel}>Problem-Kategorie</div>
            <OptionChips
              name="problem-category"
              options={getProblemCategoryOptions()}
              value={String(safeAnswers[cfg.problemCategoryKey] || '')}
              onChange={(next) =>
                patchAnswers(safeAnswers, setAnswers, { [cfg.problemCategoryKey]: String(next) })
              }
            />
          </div>

          <div className={styles.fieldBlock}>
            <div className={styles.fieldLabel}>Woran erkennst du, dass es sich wiederholt?</div>
            <OptionChips
              name="problem-evidence"
              multi
              options={getProblemEvidenceOptions()}
              selectedValues={evidence}
              onChange={(next) =>
                patchAnswers(safeAnswers, setAnswers, {
                  [cfg.problemEvidenceKey]: Array.isArray(next) ? next : [String(next)],
                })
              }
            />
          </div>

          <div className={styles.fieldBlock}>
            <div className={styles.fieldLabel}>Optional: Anzahl beobachteter Beispiele</div>
            <OptionChips
              name="problem-count"
              options={getExampleCountOptions()}
              value={String(safeAnswers[cfg.problemExampleCountKey] || '')}
              onChange={(next) =>
                patchAnswers(safeAnswers, setAnswers, { [cfg.problemExampleCountKey]: String(next) })
              }
            />
          </div>

          <div className={styles.fieldBlock}>
            <div className={styles.fieldLabel}>Optional: Scene-Hinweis (Problem)</div>
            <textarea
              className={styles.textarea}
              value={String(safeAnswers[cfg.problemSceneNoteKey] || '')}
              maxLength={120}
              placeholder="z. B. SC104"
              onChange={(event) =>
                patchAnswers(safeAnswers, setAnswers, { [cfg.problemSceneNoteKey]: event.target.value })
              }
            />
          </div>
        </section>
      )}

      {stage === 'adjustment' && (
        <section className={`${styles.panel} ui-flat-mobile mobile-flatten-card`}>
          <div className={styles.fieldBlock}>
            <div className={styles.fieldLabel}>Was verändert das Team sichtbar?</div>
            <p className={styles.lead}>Nicht warum — beobachtbares Verhalten.</p>
            <textarea
              className={styles.textarea}
              value={String(safeAnswers[cfg.adjustmentDescriptionKey] || '')}
              maxLength={500}
              placeholder="z. B. Die erste Linie bleibt tiefer und schließt die Mitte früher."
              onChange={(event) =>
                patchAnswers(safeAnswers, setAnswers, { [cfg.adjustmentDescriptionKey]: event.target.value })
              }
            />
          </div>

          <div className={styles.fieldBlock}>
            <div className={styles.fieldLabel}>Welche Dimension verändert sich?</div>
            <OptionChips
              name="adjustment-dimension"
              options={getAdjustmentDimensionOptions()}
              value={String(safeAnswers[cfg.adjustmentDimensionKey] || '')}
              onChange={(next) =>
                patchAnswers(safeAnswers, setAnswers, { [cfg.adjustmentDimensionKey]: String(next) })
              }
            />
          </div>

          <div className={styles.fieldBlock}>
            <div className={styles.fieldLabel}>Wie deutlich ist das Adjustment sichtbar?</div>
            <OptionChips
              name="change-magnitude"
              options={getMagnitudeOptions()}
              value={String(safeAnswers[cfg.changeMagnitudeKey] || '')}
              onChange={(next) =>
                patchAnswers(safeAnswers, setAnswers, { [cfg.changeMagnitudeKey]: String(next) })
              }
            />
          </div>

          <div className={styles.fieldBlock}>
            <div className={styles.fieldLabel}>Optional: Scene-Hinweis (Veränderung)</div>
            <textarea
              className={styles.textarea}
              value={String(safeAnswers[cfg.adjustmentSceneNoteKey] || '')}
              maxLength={120}
              placeholder="z. B. SC107"
              onChange={(event) =>
                patchAnswers(safeAnswers, setAnswers, { [cfg.adjustmentSceneNoteKey]: event.target.value })
              }
            />
          </div>
        </section>
      )}

      {stage === 'response' && (
        <section className={`${styles.panel} ui-flat-mobile mobile-flatten-card`}>
          <div className={styles.fieldBlock}>
            <div className={styles.fieldLabel}>
              Wie reagiert der Gegner bzw. die ursprüngliche Interaktion danach?
            </div>
            <OptionChips
              name="response-type"
              options={getResponseTypeOptions()}
              value={String(safeAnswers[cfg.responseTypeKey] || '')}
              onChange={(next) =>
                patchAnswers(safeAnswers, setAnswers, { [cfg.responseTypeKey]: String(next) })
              }
            />
          </div>

          <div className={styles.fieldBlock}>
            <div className={styles.fieldLabel}>Was passiert jetzt konkret anders?</div>
            <textarea
              className={styles.textarea}
              value={String(safeAnswers[cfg.responseDescriptionKey] || '')}
              maxLength={500}
              placeholder="z. B. Der Gegner trägt den Puck nicht mehr zentral, sondern nutzt häufiger die Außenbahn."
              onChange={(event) =>
                patchAnswers(safeAnswers, setAnswers, { [cfg.responseDescriptionKey]: event.target.value })
              }
            />
          </div>

          <div className={styles.fieldBlock}>
            <div className={styles.fieldLabel}>Wie oft hast du die neue Reaktion danach gesehen?</div>
            <OptionChips
              name="response-repetition"
              options={getResponseRepetitionOptions()}
              value={String(safeAnswers[cfg.responseRepetitionKey] || '')}
              onChange={(next) =>
                patchAnswers(safeAnswers, setAnswers, { [cfg.responseRepetitionKey]: String(next) })
              }
            />
          </div>

          <div className={styles.fieldBlock}>
            <div className={styles.fieldLabel}>Optional: Scene-Hinweis (Reaktion)</div>
            <textarea
              className={styles.textarea}
              value={String(safeAnswers[cfg.responseSceneNoteKey] || '')}
              maxLength={120}
              placeholder="z. B. SC110"
              onChange={(event) =>
                patchAnswers(safeAnswers, setAnswers, { [cfg.responseSceneNoteKey]: event.target.value })
              }
            />
          </div>
        </section>
      )}

      {stage === 'assess' && (
        <section className={`${styles.panel} ui-flat-mobile mobile-flatten-card`}>
          <p className={styles.hint}>{cfg.outcomeBiasHint}</p>

          <div className={styles.fieldBlock}>
            <div className={styles.fieldLabel}>Was passiert mit dem ursprünglichen Problem nach der Veränderung?</div>
            <OptionChips
              name="problem-effect"
              options={getProblemEffectOptions()}
              value={String(safeAnswers[cfg.problemEffectKey] || '')}
              onChange={(next) =>
                patchAnswers(safeAnswers, setAnswers, { [cfg.problemEffectKey]: String(next) })
              }
            />
          </div>

          {cfg.supportsTradeoff && (
            <>
              <div className={styles.fieldBlock}>
                <div className={styles.fieldLabel}>
                  Welche neue Möglichkeit entsteht durch das Adjustment möglicherweise für den Gegner?
                </div>
                <OptionChips
                  name="tradeoff"
                  options={getTradeoffOptions()}
                  value={String(safeAnswers[cfg.tradeoffKey] || '')}
                  onChange={(next) =>
                    patchAnswers(safeAnswers, setAnswers, { [cfg.tradeoffKey]: String(next) })
                  }
                />
              </div>
              <div className={styles.fieldBlock}>
                <div className={styles.fieldLabel}>Optional: Trade-off kurz beschreiben</div>
                <textarea
                  className={styles.textarea}
                  value={String(safeAnswers[cfg.tradeoffDetailKey] || '')}
                  maxLength={280}
                  placeholder="z. B. Mitte geschlossen, Außenbahn wird freier."
                  onChange={(event) =>
                    patchAnswers(safeAnswers, setAnswers, { [cfg.tradeoffDetailKey]: event.target.value })
                  }
                />
              </div>
            </>
          )}

          {cfg.supportsComparability && (
            <div className={styles.fieldBlock}>
              <div className={styles.fieldLabel}>
                Sind die Situationen vor und nach dem Adjustment ausreichend vergleichbar?
              </div>
              <OptionChips
                name="comparability"
                options={getComparabilityOptions()}
                value={String(safeAnswers[cfg.comparabilityKey] || '')}
                onChange={(next) =>
                  patchAnswers(safeAnswers, setAnswers, { [cfg.comparabilityKey]: String(next) })
                }
              />
            </div>
          )}

          <div className={styles.fieldBlock}>
            <div className={styles.fieldLabel}>
              Wie stark ist der Hinweis, dass die Veränderung die ursprüngliche Interaktion beeinflusst hat?
            </div>
            <p className={styles.lead}>Du entscheidest — nicht die Anzahl der Beispiele.</p>
            <OptionChips
              name="interaction-assessment"
              options={getInteractionAssessmentOptions()}
              value={String(safeAnswers[cfg.interactionAssessmentKey] || '')}
              onChange={(next) =>
                patchAnswers(safeAnswers, setAnswers, { [cfg.interactionAssessmentKey]: String(next) })
              }
            />
          </div>

          {cfg.requireSummary && (
            <div className={styles.fieldBlock}>
              <div className={styles.fieldLabel}>Formuliere die gesamte Kette in 2–3 Sätzen.</div>
              <p className={styles.helper}>{cfg.summaryHelper}</p>
              <textarea
                className={styles.textarea}
                value={String(safeAnswers[cfg.chainSummaryKey] || '')}
                maxLength={800}
                placeholder="Vorher kam der Gegner mehrfach kontrolliert durch die Mitte. Danach stand die erste Linie tiefer und priorisierte den zentralen Raum. In den folgenden Situationen wich der Gegner häufiger auf Entries über außen aus."
                onChange={(event) =>
                  patchAnswers(safeAnswers, setAnswers, { [cfg.chainSummaryKey]: event.target.value })
                }
              />
            </div>
          )}
        </section>
      )}

      <div className={styles.actions}>
        {stage !== 'problem' && (
          <button type="button" className={styles.secondaryBtn} onClick={goBack}>
            Zurück
          </button>
        )}
        <button
          type="button"
          className={styles.primaryBtn}
          disabled={!canAdvance(stage, cfg, safeAnswers)}
          onClick={goNext}
        >
          {stage === 'assess' ? 'Kette abschließen' : 'Weiter'}
        </button>
      </div>
    </div>
  )
}
