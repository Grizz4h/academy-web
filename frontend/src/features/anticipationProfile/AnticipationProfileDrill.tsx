import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { Drill } from '../../api'
import { api } from '../../api'
import { useUser } from '../../context/UserContext'
import { DrillGuideCard } from '../../components/DrillGuideCard'
import { OptionChips } from '../patternLog/OptionChips'
import { cueCategoryLabel } from '../anticipationRead/readLogic'
import { AnticipationProfileSummary } from './AnticipationProfileSummary'
import {
  collectAnticipationObservations,
  computeAnticipationProfile,
  coveredSourceDrillIds,
  resolveAnticipationProfileConfig,
  readProfileStage,
  toReflectionPayload,
  validateAnticipationProfileAnswers,
} from './profileLogic'
import type { AnticipationProfileStage } from './types'
import styles from './AnticipationProfileDrill.module.css'

type Props = {
  drill: Drill
  answers: Record<string, any>
  setAnswers: (next: Record<string, any>) => void
}

const HARD_TO_UPDATE_OPTIONS = [
  { value: 'after_commit', label: 'Nachdem ich mich einmal festgelegt habe' },
  { value: 'rising_pressure', label: 'Wenn der Druck steigt' },
  { value: 'similar_options', label: 'Wenn zwei Aktionen ähnlich wahrscheinlich wirken' },
  { value: 'unclear', label: 'Unklar' },
]

function patchAnswers(
  answers: Record<string, any>,
  setAnswers: (next: Record<string, any>) => void,
  patch: Record<string, any>,
) {
  setAnswers({ ...(answers || {}), ...patch })
}

export function AnticipationProfileDrill({ drill, answers, setAnswers }: Props) {
  const { user } = useUser()
  const cfg = resolveAnticipationProfileConfig(drill?.config || {})
  const safeAnswers = answers || {}
  const stage = readProfileStage(safeAnswers, cfg.stageKey)
  const { data: sessions = [] } = useQuery({
    queryKey: ['sessions', user],
    queryFn: () => api.getSessions(user || undefined),
  })

  const observations = useMemo(
    () => collectAnticipationObservations(sessions, cfg),
    [sessions, cfg.logsKey, cfg.sourceDrillIds.join('|')],
  )
  const covered = useMemo(
    () => coveredSourceDrillIds(sessions, cfg.sourceDrillIds, cfg.logsKey),
    [sessions, cfg.sourceDrillIds.join('|'), cfg.logsKey],
  )
  const profile = useMemo(
    () => computeAnticipationProfile(observations, cfg, covered),
    [observations, covered, cfg.minReadsForProfile, cfg.frequentLimit, cfg.rareLimit],
  )

  const helpfulChoices = cfg.cueCatalog
    .filter((category) => category !== 'other')
    .map((category) => ({ value: category, label: cueCategoryLabel(category) }))
  const futureChoices = helpfulChoices

  const reviewError = validateAnticipationProfileAnswers(cfg, safeAnswers)
  const isComplete = stage === 'complete'
  const guide = drill?.didactics?.observation_guide

  const setStage = (next: AnticipationProfileStage) => {
    const reflectionAnswers = {
      [cfg.helpfulCueKey]: String(safeAnswers[cfg.helpfulCueKey] || ''),
      [cfg.futureCueKey]: String(safeAnswers[cfg.futureCueKey] || ''),
      [cfg.hardToUpdateKey]: String(safeAnswers[cfg.hardToUpdateKey] || ''),
    }
    patchAnswers(safeAnswers, setAnswers, {
      [cfg.stageKey]: next,
      [cfg.resultKey]: profile,
      [cfg.payloadKey]: toReflectionPayload(profile, {
        mostHelpfulCueCategory: reflectionAnswers[cfg.helpfulCueKey],
        futureCueCategory: reflectionAnswers[cfg.futureCueKey],
        hardToUpdateWhen: reflectionAnswers[cfg.hardToUpdateKey],
      }),
    })
  }

  if (isComplete) {
    return (
      <div className={styles.drillRoot}>
        <span className={styles.completeBadge}>✓ Anticipation Profile erstellt</span>
        <AnticipationProfileSummary
          profile={profile}
          insufficientHint={cfg.insufficientHint}
          categoryLabel={cueCategoryLabel}
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
      <p className={styles.eyebrow}>Reads → Muster → Fokus</p>
      <h2 className={styles.title}>{drill.title}</h2>
      {drill.description && <p className={styles.lead}>{drill.description}</p>}
      <p className={styles.lead}>{cfg.introText}</p>
      <p className={styles.rule}>{cfg.decisionRule}</p>
      <p className={styles.hint}>{cfg.coreHint}</p>
      {guide && <DrillGuideCard guide={guide} />}

      <AnticipationProfileSummary
        profile={profile}
        insufficientHint={cfg.insufficientHint}
        categoryLabel={cueCategoryLabel}
      />

      <section className={`${styles.panel} ui-flat-mobile mobile-flatten-card`}>
        <h3 className={styles.panelTitle}>Deine Reflexion</h3>
        <div className={styles.fieldBlock}>
          <div className={styles.fieldLabel}>Welche Hinweise helfen dir aktuell am meisten?</div>
          <OptionChips
            name="helpfulCue"
            options={helpfulChoices}
            value={String(safeAnswers[cfg.helpfulCueKey] || '')}
            onChange={(next) => patchAnswers(safeAnswers, setAnswers, { [cfg.helpfulCueKey]: String(next) })}
          />
        </div>
        <div className={styles.fieldBlock}>
          <div className={styles.fieldLabel}>Welche Hinweise möchtest du bewusster beobachten?</div>
          <OptionChips
            name="futureCue"
            options={futureChoices}
            value={String(safeAnswers[cfg.futureCueKey] || '')}
            onChange={(next) => patchAnswers(safeAnswers, setAnswers, { [cfg.futureCueKey]: String(next) })}
          />
        </div>
        <div className={styles.fieldBlock}>
          <div className={styles.fieldLabel}>Wann fällt es dir schwer, deine erste Erwartung anzupassen?</div>
          <OptionChips
            name="hardToUpdate"
            options={HARD_TO_UPDATE_OPTIONS}
            value={String(safeAnswers[cfg.hardToUpdateKey] || '')}
            onChange={(next) => patchAnswers(safeAnswers, setAnswers, { [cfg.hardToUpdateKey]: String(next) })}
          />
        </div>
        {reviewError && <p className={styles.hint}>{reviewError}</p>}
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.primaryBtn}
            disabled={Boolean(reviewError)}
            onClick={() => setStage('complete')}
          >
            Profil abschließen
          </button>
        </div>
        <p className={styles.fieldHelp}>
          Die KI-Reflexion bleibt optional und startet nur über den Button nach der Session – nicht automatisch.
        </p>
      </section>
    </div>
  )
}
