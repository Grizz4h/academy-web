import type { Drill } from '../../api'
import { DrillGuideCard } from '../../components/DrillGuideCard'
import { OptionChips } from '../patternLog/OptionChips'
import { CohortRateComparison } from '../cohortRateCompare/CohortRateComparison'
import { ConditionOutcomeMatrix } from '../conditionalOutcome/ConditionOutcomeMatrix'
import { ClaimLadder } from './ClaimLadder'
import { EvidenceProfileResult } from './EvidenceProfileResult'
import {
  CLAIM_LADDER_STEPS,
  CLAIM_LEVEL_HELP,
  DEFAULT_LIMITATION_OPTIONS,
  buildEvidenceProfile,
  ceilingFeedback,
  emptyDraft,
  evidenceStrengthOptions,
  groupsFromSample,
  isDraftComplete,
  isDraftStepReady,
  microfeedbackOptions,
  readClaimStage,
  readClaimStep,
  readProfiles,
  resolveClaimLadderConfig,
  temptingClaimOptions,
  validateClaimLadderAnswers,
} from './claimLogic'
import type {
  ClaimLadderDraft,
  ClaimLadderStage,
  ClaimLadderStep,
  EvidenceSynthesisCase,
} from './types'
import rateStyles from '../opportunityRate/OpportunityRateDrill.module.css'
import styles from './ClaimLadderDrill.module.css'

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

function CaseVisual({ caseDef }: { caseDef: EvidenceSynthesisCase }) {
  const sample = caseDef.evidenceInput
  const groups = groupsFromSample(sample)
  return (
    <div className={rateStyles.resultStack}>
      <span className={styles.practiceTag}>Übungsfall</span>
      <div className={rateStyles.resultBlock}>
        <div className={rateStyles.resultLabel}>Frage</div>
        <p className={rateStyles.resultValue}>{caseDef.question}</p>
      </div>
      {sample.matrix && (
        <ConditionOutcomeMatrix
          conditionLabel={sample.conditionLabel || 'Bedingung'}
          targetLabel={sample.targetLabel || 'Target'}
          matrix={sample.matrix}
        />
      )}
      {groups && (
        <CohortRateComparison
          title="Beobachtete Raten"
          groupA={groups[0]}
          groupB={groups[1]}
          percentagePointDifference={sample.differencePercentagePoints || 0}
          sampleImbalance={groups[0].totalOpportunities !== groups[1].totalOpportunities}
          showPercents
        />
      )}
      <p className={rateStyles.fieldHelp}>n = {sample.sampleSize} Opportunities</p>
      {caseDef.contextNotes && caseDef.contextNotes.length > 0 && (
        <ul className={styles.notes}>
          {caseDef.contextNotes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      )}
    </div>
  )
}

export function ClaimLadderDrill({ drill, answers, setAnswers }: Props) {
  const safeAnswers = answers || {}
  const cfg = resolveClaimLadderConfig(drill?.config || {})
  const stage = readClaimStage(safeAnswers, cfg.stageKey)
  const step = readClaimStep(safeAnswers, cfg.stepKey)
  const drafts = readProfiles(safeAnswers, cfg.profilesKey)
  const caseIndex = Math.min(cfg.cases.length - 1, Math.max(0, Number(safeAnswers[cfg.caseIndexKey] || 0)))
  const caseDef = cfg.cases[caseIndex]
  const draft = drafts[caseDef?.id] || emptyDraft(caseDef?.id)
  const guide = drill?.didactics?.observation_guide
  const stepIndex = CLAIM_LADDER_STEPS.indexOf(step)

  const setStage = (next: ClaimLadderStage, extra: Record<string, any> = {}) => {
    patchAnswers(safeAnswers, setAnswers, { ...extra, [cfg.stageKey]: next })
  }

  const writeDraft = (next: ClaimLadderDraft, extra: Record<string, any> = {}) => {
    if (!caseDef) return
    const merged = { ...next, caseId: caseDef.id }
    const nextDrafts = { ...drafts, [caseDef.id]: merged }
    const profile = isDraftComplete(merged, cfg) ? buildEvidenceProfile(caseDef, merged) : safeAnswers[cfg.profileKey]
    patchAnswers(safeAnswers, setAnswers, {
      ...extra,
      [cfg.profilesKey]: nextDrafts,
      [cfg.profileKey]: profile,
    })
  }

  const goStep = (next: ClaimLadderStep) => {
    patchAnswers(safeAnswers, setAnswers, { [cfg.stepKey]: next })
  }

  const advance = () => {
    if (!isDraftStepReady(step, draft, cfg)) return
    if (stepIndex < CLAIM_LADDER_STEPS.length - 1) {
      goStep(CLAIM_LADDER_STEPS[stepIndex + 1])
      return
    }
    if (caseIndex < cfg.cases.length - 1) {
      patchAnswers(safeAnswers, setAnswers, {
        [cfg.caseIndexKey]: caseIndex + 1,
        [cfg.stepKey]: 'case',
        [cfg.stageKey]: 'assess',
      })
      return
    }
    setStage('review')
  }

  if (stage === 'complete') {
    return (
      <div className={rateStyles.drillRoot}>
        <span className={rateStyles.completeBadge}>✓ Evidence Profile abgeschlossen</span>
        <ReviewBlock cfgCases={cfg.cases} drafts={drafts} />
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
      <p className={rateStyles.eyebrow}>Von Daten zur belastbaren Aussage</p>
      <h2 className={rateStyles.title}>{drill.title}</h2>
      {drill.description && <p className={rateStyles.lead}>{drill.description}</p>}
      {drill.didactics?.explanation && <p className={rateStyles.lead}>{drill.didactics.explanation}</p>}
      <p className={rateStyles.rule}>{cfg.decisionRule}</p>
      <p className={rateStyles.hint}>{cfg.coreHint}</p>
      {guide && <DrillGuideCard guide={guide} />}

      {stage === 'intro' && (
        <section className={`${rateStyles.panel} ui-flat-mobile mobile-flatten-card`}>
          <h3 className={rateStyles.panelTitle}>Wie weit darf deine Aussage gehen?</h3>
          <p className={rateStyles.lead}>
            Du hast gezählt, verglichen und Evidenz geprüft. Jetzt kommt der wichtigste Schritt:
            Eine gute Analyse klingt nicht maximal selbstsicher. Sie ist genau so stark formuliert,
            wie die vorhandene Evidenz es erlaubt.
          </p>
          <div className={rateStyles.actions}>
            <button
              type="button"
              className={rateStyles.primaryBtn}
              onClick={() => setStage('assess', { [cfg.caseIndexKey]: 0, [cfg.stepKey]: 'case' })}
            >
              Ersten Fall ansehen
            </button>
          </div>
        </section>
      )}

      {stage === 'assess' && caseDef && (
        <div className={styles.layout}>
          <section className={`${rateStyles.panel} ui-flat-mobile mobile-flatten-card`}>
            <h3 className={rateStyles.panelTitle}>
              Fall {caseIndex + 1} / {cfg.cases.length}: {caseDef.title}
            </h3>
            <CaseVisual caseDef={caseDef} />
          </section>
          <section className={`${rateStyles.panel} ui-flat-mobile mobile-flatten-card`}>
            <StepFields
              caseDef={caseDef}
              draft={draft}
              step={step}
              cfg={cfg}
              onChange={writeDraft}
            />
            <div className={rateStyles.actions}>
              <button
                type="button"
                className={rateStyles.primaryBtn}
                disabled={!isDraftStepReady(step, draft, cfg)}
                onClick={advance}
              >
                {step === 'next_test' && caseIndex === cfg.cases.length - 1
                  ? 'Zum Evidence Profile'
                  : step === 'next_test'
                    ? 'Nächster Fall'
                    : 'Weiter'}
              </button>
              {stepIndex > 0 && (
                <button
                  type="button"
                  className={rateStyles.secondaryBtn}
                  onClick={() => goStep(CLAIM_LADDER_STEPS[stepIndex - 1])}
                >
                  Zurück
                </button>
              )}
            </div>
          </section>
        </div>
      )}

      {stage === 'review' && (
        <section className={`${rateStyles.panel} ui-flat-mobile mobile-flatten-card`}>
          <h3 className={rateStyles.panelTitle}>Deine Evidence Profiles</h3>
          <ReviewBlock cfgCases={cfg.cases} drafts={drafts} />
          <div className={rateStyles.fieldBlock}>
            <div className={rateStyles.fieldLabel}>Was hat deine finale Formulierung am stärksten begrenzt?</div>
            <OptionChips
              name="claimLadderConstraint"
              options={microfeedbackOptions()}
              value={safeAnswers[cfg.microfeedbackKey] || ''}
              onChange={(next) => patchAnswers(safeAnswers, setAnswers, { [cfg.microfeedbackKey]: next })}
            />
          </div>
          <div className={rateStyles.fieldBlock}>
            <div className={rateStyles.fieldLabel}>Welche Claim-Stufe wäre verlockend gewesen, aber zu stark? (optional)</div>
            <OptionChips
              name="temptingClaimLevel"
              options={temptingClaimOptions()}
              value={safeAnswers[cfg.temptingClaimKey] || ''}
              onChange={(next) => patchAnswers(safeAnswers, setAnswers, { [cfg.temptingClaimKey]: next })}
            />
          </div>
          <div className={rateStyles.actions}>
            <button
              type="button"
              className={rateStyles.primaryBtn}
              disabled={Boolean(validateClaimLadderAnswers(cfg, {
                ...safeAnswers,
                [cfg.profilesKey]: drafts,
              }))}
              onClick={() => {
                const error = validateClaimLadderAnswers(cfg, {
                  ...safeAnswers,
                  [cfg.profilesKey]: drafts,
                })
                if (error) return
                const last = cfg.cases[cfg.cases.length - 1]
                const lastDraft = drafts[last.id]
                setStage('complete', {
                  [cfg.profileKey]: lastDraft ? buildEvidenceProfile(last, lastDraft) : safeAnswers[cfg.profileKey],
                })
              }}
            >
              Synthese abschließen
            </button>
            <button
              type="button"
              className={rateStyles.secondaryBtn}
              onClick={() => setStage('assess', { [cfg.stepKey]: 'next_test' })}
            >
              Zurück zu den Fällen
            </button>
          </div>
        </section>
      )}
    </div>
  )
}

function StepFields({
  caseDef,
  draft,
  step,
  cfg,
  onChange,
}: {
  caseDef: EvidenceSynthesisCase
  draft: ClaimLadderDraft
  step: ClaimLadderStep
  cfg: ReturnType<typeof resolveClaimLadderConfig>
  onChange: (next: ClaimLadderDraft) => void
}) {
  if (step === 'case') {
    return (
      <p className={rateStyles.lead}>
        Lies Frage, Zahlen und Kontext. Als Nächstes beschreibst du nur, was die Daten zeigen.
      </p>
    )
  }

  if (step === 'describe') {
    return (
      <>
        <div className={rateStyles.fieldBlock}>
          <div className={rateStyles.fieldLabel}>Was zeigen die Daten rein deskriptiv?</div>
          <OptionChips
            name="claim-describe"
            options={caseDef.descriptiveOptions}
            value={draft.descriptiveChoice || ''}
            onChange={(next) => onChange({ ...draft, descriptiveChoice: String(next) })}
          />
        </div>
        <div className={rateStyles.fieldBlock}>
          <div className={rateStyles.fieldLabel}>Oder kurz selbst (optional)</div>
          <input
            className={rateStyles.input}
            value={draft.descriptiveNote || ''}
            maxLength={180}
            placeholder="6/9 mit Support gegenüber 2/8 ohne Support."
            onChange={(event) => onChange({ ...draft, descriptiveNote: event.target.value })}
          />
        </div>
      </>
    )
  }

  if (step === 'evidence') {
    return (
      <div className={rateStyles.fieldBlock}>
        <div className={rateStyles.fieldLabel}>Wie stark trägt die Evidenz diese Fragestellung?</div>
        <p className={rateStyles.fieldHelp}>Evidence Strength und Claim Ceiling bleiben getrennt.</p>
        <OptionChips
          name="claim-evidence"
          options={evidenceStrengthOptions()}
          value={draft.evidenceStrength || ''}
          onChange={(next) => onChange({ ...draft, evidenceStrength: next as ClaimLadderDraft['evidenceStrength'] })}
        />
      </div>
    )
  }

  if (step === 'claim') {
    const feedback = ceilingFeedback(caseDef, draft.maxClaimLevel)
    return (
      <>
        <div className={rateStyles.fieldBlock}>
          <div className={rateStyles.fieldLabel}>Bis zu welcher Aussagestärke trägt diese Evidenz?</div>
          <p className={rateStyles.fieldHelp}>{cfg.claimHint}</p>
          <ClaimLadder
            selectedMaxLevel={draft.maxClaimLevel}
            examples={caseDef.claimExamples}
            onChange={(level) => onChange({ ...draft, maxClaimLevel: level })}
          />
        </div>
        <details className={`${rateStyles.examplesHelp} ui-flat-mobile mobile-flatten`}>
          <summary className={rateStyles.examplesSummary}>Was bedeuten die Claim-Stufen?</summary>
          <div className={rateStyles.examplesBody}>
            {CLAIM_LEVEL_HELP.map((item) => (
              <div key={item.level} className={rateStyles.exampleItem}>
                <p className={rateStyles.exampleTitle}>{item.title}</p>
                <p className={rateStyles.exampleDescription}>{item.body}</p>
              </div>
            ))}
          </div>
        </details>
        {feedback && <p className={styles.feedback}>{feedback}</p>}
      </>
    )
  }

  if (step === 'limitation') {
    return (
      <>
        <div className={rateStyles.fieldBlock}>
          <div className={rateStyles.fieldLabel}>Was begrenzt deine Aussage am stärksten?</div>
          <p className={rateStyles.fieldHelp}>Nur der wichtigste Grund – nicht fünf Haken.</p>
          <OptionChips
            name="claim-limitation"
            options={DEFAULT_LIMITATION_OPTIONS}
            value={draft.primaryLimitation || ''}
            onChange={(next) => onChange({ ...draft, primaryLimitation: next as ClaimLadderDraft['primaryLimitation'] })}
          />
        </div>
        {draft.primaryLimitation === 'other' && (
          <div className={rateStyles.fieldBlock}>
            <div className={rateStyles.fieldLabel}>Welche Limitation?</div>
            <input
              className={rateStyles.input}
              value={draft.primaryLimitationOther || ''}
              maxLength={160}
              onChange={(event) => onChange({ ...draft, primaryLimitationOther: event.target.value })}
            />
          </div>
        )}
      </>
    )
  }

  if (step === 'counterevidence') {
    const options = (caseDef.counterEvidence || ['Kein klares Gegenbeispiel']).map((text) => ({
      value: text,
      label: text,
    }))
    return (
      <div className={rateStyles.fieldBlock}>
        <div className={rateStyles.fieldLabel}>Welche Beobachtung widerspricht deiner vermuteten Aussage am stärksten?</div>
        <p className={rateStyles.fieldHelp}>
          Ein Gegenbeispiel macht deine Beobachtung nicht automatisch falsch. Es zeigt, dass deine Aussage präziser formuliert werden muss.
        </p>
        <OptionChips
          name="claim-counter"
          options={options}
          value={draft.counterEvidence || ''}
          onChange={(next) => onChange({ ...draft, counterEvidence: String(next) })}
        />
      </div>
    )
  }

  if (step === 'final_claim') {
    return (
      <div className={rateStyles.fieldBlock}>
        <div className={rateStyles.fieldLabel}>Formuliere die Aussage, die von dieser Evidenz getragen wird.</div>
        <p className={rateStyles.fieldHelp}>{cfg.scaffoldHint}</p>
        <textarea
          className={rateStyles.textarea}
          value={draft.finalClaim || ''}
          maxLength={500}
          placeholder="In meinen beobachteten Exit-Versuchen … Die Daten geben einen Hinweis, erlauben aber keine allgemeine oder kausale Aussage."
          onChange={(event) => onChange({ ...draft, finalClaim: event.target.value })}
        />
      </div>
    )
  }

  return (
    <>
      <div className={rateStyles.fieldBlock}>
        <div className={rateStyles.fieldLabel}>Welche nächste Beobachtung würde deine Aussage am besten stärken oder widerlegen?</div>
        <p className={rateStyles.fieldHelp}>{cfg.nextTestHint}</p>
        <textarea
          className={rateStyles.textarea}
          value={draft.nextObservationTest || ''}
          maxLength={320}
          placeholder="Weitere Exit-Versuche mit und ohne Support bei möglichst vergleichbarem Forecheckdruck."
          onChange={(event) => onChange({ ...draft, nextObservationTest: event.target.value })}
        />
      </div>
      <div className={rateStyles.fieldBlock}>
        <div className={rateStyles.fieldLabel}>Was müsste passieren, damit du deine Aussage zurücknehmen würdest? (optional)</div>
        <input
          className={rateStyles.input}
          value={draft.falsificationCondition || ''}
          maxLength={200}
          onChange={(event) => onChange({ ...draft, falsificationCondition: event.target.value })}
        />
      </div>
    </>
  )
}

function ReviewBlock({
  cfgCases,
  drafts,
}: {
  cfgCases: EvidenceSynthesisCase[]
  drafts: Record<string, ClaimLadderDraft>
}) {
  const cfg = resolveClaimLadderConfig()
  return (
    <div className={styles.reviewList}>
      {cfgCases.map((caseDef) => {
        const draft = drafts[caseDef.id]
        if (!draft || !isDraftComplete(draft, cfg)) {
          return (
            <p key={caseDef.id} className={rateStyles.fieldHelp}>
              {caseDef.title}: noch unvollständig.
            </p>
          )
        }
        return (
          <EvidenceProfileResult key={caseDef.id} profile={buildEvidenceProfile(caseDef, draft)} />
        )
      })}
    </div>
  )
}
