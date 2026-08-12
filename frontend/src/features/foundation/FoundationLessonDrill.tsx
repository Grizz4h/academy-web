import { useEffect, useMemo } from 'react'
import type { Drill } from '../../api'
import { getHockeyTermDefinition } from './hockeyTerms'
import FoundationRink from './FoundationRink'
import type {
  FoundationLessonConfig,
  FoundationLessonStep,
  FoundationRinkRegionId,
} from './types'
import styles from './FoundationLessonDrill.module.css'

type Props = {
  drill: Drill
  answers: Record<string, unknown>
  setAnswers: (next: Record<string, unknown>) => void
}

type StepState = {
  selectedRegion?: FoundationRinkRegionId | null
  selectedOptionId?: string | null
  revealed?: boolean
  correct?: boolean
}

const LEARNING_TAP_REGIONS: FoundationRinkRegionId[] = [
  'defensive_zone',
  'neutral_zone',
  'offensive_zone',
  'slot',
  'net_front',
  'goalie_spot',
  'puck_carrier',
  'support_player',
  'faceoff_dot',
  'blue_line_near',
  'blue_line_far',
  'center_line',
]

function readConfig(drill: Drill): FoundationLessonConfig {
  const raw = (drill.config || {}) as FoundationLessonConfig
  return {
    trackStep: raw.trackStep,
    trackStepLabel: raw.trackStepLabel,
    trackStepTotal: raw.trackStepTotal || 5,
    learningMode: raw.learningMode !== false,
    steps: Array.isArray(raw.steps) ? raw.steps : [],
  }
}

function isStepComplete(step: FoundationLessonStep, state: StepState | undefined): boolean {
  if (!state?.revealed) return false
  if (step.type === 'completion_summary') return true
  return Boolean(state.correct)
}

export default function FoundationLessonDrill({ drill, answers, setAnswers }: Props) {
  const config = useMemo(() => readConfig(drill), [drill])
  const steps = config.steps
  const stepIndex = typeof answers.stepIndex === 'number' ? answers.stepIndex : 0
  const clampedIndex = Math.min(Math.max(0, stepIndex), Math.max(0, steps.length - 1))
  const step = steps[clampedIndex]
  const stepStates = (answers.stepStates as Record<string, StepState> | undefined) || {}
  const currentState = step ? stepStates[step.id] || {} : {}

  const updateState = (patch: Partial<StepState>) => {
    if (!step) return
    const nextStates = {
      ...stepStates,
      [step.id]: { ...currentState, ...patch },
    }
    setAnswers({ ...answers, stepIndex: clampedIndex, stepStates: nextStates })
  }

  useEffect(() => {
    if (!step || step.type !== 'completion_summary') return
    if (currentState.revealed) return
    const nextStates = {
      ...stepStates,
      [step.id]: { ...currentState, revealed: true, correct: true },
    }
    setAnswers({
      ...answers,
      stepIndex: clampedIndex,
      stepStates: nextStates,
      foundationComplete: true,
    })
    // intentionally only when landing on summary step
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step?.id, step?.type])

  const goNext = () => {
    if (clampedIndex >= steps.length - 1) {
      setAnswers({
        ...answers,
        stepIndex: clampedIndex,
        foundationComplete: true,
        stepStates,
      })
      return
    }
    setAnswers({
      ...answers,
      stepIndex: clampedIndex + 1,
      stepStates,
    })
  }

  const goPrev = () => {
    if (clampedIndex <= 0) return
    setAnswers({ ...answers, stepIndex: clampedIndex - 1, stepStates })
  }

  if (!step) {
    return <div className={styles.wrap}>Kein Foundation-Inhalt konfiguriert.</div>
  }

  const term = step.termId ? getHockeyTermDefinition(step.termId) : null
  const progressLabel = config.trackStep && config.trackStepLabel
    ? `${config.trackStep} / ${config.trackStepTotal} ${config.trackStepLabel}`
    : `Schritt ${clampedIndex + 1} / ${steps.length}`

  const handleRegion = (region: FoundationRinkRegionId) => {
    if (currentState.revealed && currentState.correct) return
    const correct = (step.correctRegions || []).includes(region)
    updateState({
      selectedRegion: region,
      revealed: true,
      correct,
    })
  }

  const handleOption = (optionId: string) => {
    if (currentState.revealed && currentState.correct) return
    const correct = optionId === step.correctOptionId
    updateState({
      selectedOptionId: optionId,
      revealed: true,
      correct,
    })
  }

  const interactiveRegions: FoundationRinkRegionId[] =
    step.type === 'identify_region'
      ? Array.from(new Set([
          ...(step.correctRegions || []),
          ...(step.showMarkers || []),
          ...LEARNING_TAP_REGIONS,
        ]))
      : []

  const canAdvance = isStepComplete(step, currentState)
  const allDone = Boolean(answers.foundationComplete) || (
    clampedIndex === steps.length - 1 && canAdvance
  )

  return (
    <div className={styles.wrap}>
      <div className={styles.progressBar}>
        <span className={styles.badge}>FOUNDATION</span>
        <span className={styles.progressText}>{progressLabel}</span>
        <span className={styles.stepFrac}>
          {clampedIndex + 1}/{steps.length}
        </span>
      </div>

      <h3 className={styles.prompt}>{step.prompt}</h3>

      {(step.type === 'identify_region' || Boolean(step.showMarkers?.length) || Boolean(step.highlightRegions?.length)) && (
        <FoundationRink
          attackDirection={step.attackDirection || 'right'}
          highlightRegions={
            currentState.revealed && currentState.correct
              ? (step.highlightRegions || step.correctRegions || [])
              : (step.highlightRegions || [])
          }
          interactiveRegions={interactiveRegions}
          selectedRegion={currentState.selectedRegion || null}
          showMarkers={step.showMarkers || []}
          onSelectRegion={step.type === 'identify_region' ? handleRegion : undefined}
          disabled={Boolean(currentState.correct)}
        />
      )}

      {step.type === 'scenario_choice' && (
        <div className={styles.options} role="listbox" aria-label="Antwortoptionen">
          {(step.options || []).map((opt) => {
            const selected = currentState.selectedOptionId === opt.id
            const showResult = currentState.revealed && selected
            return (
              <button
                key={opt.id}
                type="button"
                className={[
                  styles.option,
                  selected ? styles.optionSelected : '',
                  showResult && currentState.correct ? styles.optionCorrect : '',
                  showResult && !currentState.correct ? styles.optionWrong : '',
                ].filter(Boolean).join(' ')}
                onClick={() => handleOption(opt.id)}
                disabled={Boolean(currentState.correct)}
              >
                {opt.label}
              </button>
            )
          })}
        </div>
      )}

      {step.type === 'completion_summary' && (
        <div className={styles.summary}>
          <ul className={styles.summaryList}>
            {(step.summaryItems || []).map((item) => (
              <li key={item}>✓ {item}</li>
            ))}
          </ul>
          {typeof step.learnedTermsCount === 'number' && (
            <p className={styles.termsCount}>{step.learnedTermsCount} Begriffe kennengelernt</p>
          )}
          {step.explanation && <p className={styles.summaryLead}>{step.explanation}</p>}
        </div>
      )}

      {currentState.revealed && step.type !== 'completion_summary' && (
        <div className={`${styles.feedback} ${currentState.correct ? styles.feedbackOk : styles.feedbackSoft}`}>
          {currentState.correct ? (
            <>
              {term && (
                <div className={styles.termBlock}>
                  <strong>{term.term}</strong>
                  <p>{step.explanation || term.short}</p>
                </div>
              )}
              {!term && step.explanation && <p>{step.explanation}</p>}
              {step.whyImportant && (
                <p className={styles.why}>
                  <span>Warum wichtig?</span> {step.whyImportant}
                </p>
              )}
            </>
          ) : (
            <p>{step.gentleWrong || 'Noch nicht — versuch es noch einmal.'}</p>
          )}
        </div>
      )}

      <div className={styles.nav}>
        <button type="button" className={styles.navBtn} onClick={goPrev} disabled={clampedIndex === 0}>
          Zurück
        </button>
        {clampedIndex < steps.length - 1 ? (
          <button
            type="button"
            className={`${styles.navBtn} ${styles.navPrimary}`}
            onClick={goNext}
            disabled={!canAdvance}
          >
            Weiter
          </button>
        ) : (
          <button
            type="button"
            className={`${styles.navBtn} ${styles.navPrimary}`}
            onClick={() => setAnswers({ ...answers, foundationComplete: true, stepStates, stepIndex: clampedIndex })}
            disabled={!canAdvance}
          >
            {allDone ? '✓ Lektion fertig' : 'Lektion fertig markieren'}
          </button>
        )}
      </div>
      {allDone && (
        <p className={styles.completeHint}>
          Fertig. Tippe unten auf <strong>Session abschließen</strong>, um die Lektion zu speichern.
        </p>
      )}
    </div>
  )
}
