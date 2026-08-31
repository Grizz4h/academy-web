import { useEffect, useMemo, useRef, useState } from 'react'
import { selectLevelProgress } from '../../progression/selectors'
import { useRewards } from '../state/RewardContext'
import type { RewardEvent, RewardVisualTier } from '../types'
import { formatPux } from '../types'
import styles from './SessionRewardRecap.module.css'

export type SessionRewardRecapData = {
  grantedXp: number
  grantedPux: number
  previousXp: number
  nextXp: number
  rewardEvents: RewardEvent[]
}

type SessionRewardRecapProps = {
  data: SessionRewardRecapData
  loading?: boolean
}

const POPUP_TIERS = new Set<RewardVisualTier>(['bronze', 'silver', 'gold', 'mastery'])

function tierClass(tier?: RewardVisualTier): string {
  if (tier === 'silver') return styles.tierSilver
  if (tier === 'gold') return styles.tierGold
  if (tier === 'mastery') return styles.tierMastery
  return styles.tierBronze
}

function isAchievementPopupEvent(event: RewardEvent): boolean {
  if (event.kind !== 'achievement' && event.kind !== 'mastery') return false
  const tier = event.visualTier ?? 'bronze'
  return POPUP_TIERS.has(tier)
}

function popupAutoCloseMs(tier?: RewardVisualTier): number {
  if (tier === 'mastery') return 5600
  if (tier === 'gold') return 4800
  if (tier === 'silver') return 4000
  return 3400
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function useXpReveal(previousXp: number, nextXp: number, active: boolean) {
  const [shownXp, setShownXp] = useState(previousXp)
  const [levelFlash, setLevelFlash] = useState(false)
  const [levelUpBurst, setLevelUpBurst] = useState(false)
  const [phaseDone, setPhaseDone] = useState(!active)
  const [barPulse, setBarPulse] = useState(false)

  useEffect(() => {
    setShownXp(previousXp)
    setPhaseDone(false)
    setLevelFlash(false)
    setLevelUpBurst(false)
    setBarPulse(false)

    if (!active) {
      setPhaseDone(true)
      return
    }

    if (nextXp <= previousXp) {
      setShownXp(previousXp)
      setPhaseDone(true)
      return
    }

    const reduceMotion = typeof window !== 'undefined'
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduceMotion) {
      setShownXp(nextXp)
      setPhaseDone(true)
      return
    }

    const delta = nextXp - previousXp
    const duration = Math.min(2800, Math.max(1500, delta * 14))
    const startedAt = performance.now()
    let lastLevel = selectLevelProgress({
      xp: previousXp,
      unlockedAchievements: {},
      unlockedCosmetics: {},
      activityLog: [],
      unlockHistory: [],
    }).level
    let raf = 0
    const burstTimers: number[] = []
    setBarPulse(true)

    const tick = (now: number) => {
      const t = Math.min(1, (now - startedAt) / duration)
      const xp = Math.round(previousXp + delta * easeOutCubic(t))
      setShownXp(xp)
      const level = selectLevelProgress({
        xp,
        unlockedAchievements: {},
        unlockedCosmetics: {},
        activityLog: [],
        unlockHistory: [],
      }).level
      if (level > lastLevel) {
        lastLevel = level
        setLevelFlash(true)
        setLevelUpBurst(true)
        burstTimers.push(window.setTimeout(() => setLevelFlash(false), 1200))
        burstTimers.push(window.setTimeout(() => setLevelUpBurst(false), 1600))
      }
      if (t < 1) {
        raf = window.requestAnimationFrame(tick)
      } else {
        setShownXp(nextXp)
        setBarPulse(false)
        setPhaseDone(true)
      }
    }

    raf = window.requestAnimationFrame(tick)
    return () => {
      window.cancelAnimationFrame(raf)
      burstTimers.forEach((id) => window.clearTimeout(id))
    }
  }, [active, previousXp, nextXp])

  const progress = selectLevelProgress({
    xp: shownXp,
    unlockedAchievements: {},
    unlockedCosmetics: {},
    activityLog: [],
    unlockHistory: [],
  })

  return { shownXp, progress, levelFlash, levelUpBurst, phaseDone, barPulse }
}

export default function SessionRewardRecap({ data, loading = false }: SessionRewardRecapProps) {
  const { enqueueRewards } = useRewards()
  const popupedIdsRef = useRef<Set<string>>(new Set())
  const rootRef = useRef<HTMLElement | null>(null)
  const progressFocusRef = useRef<HTMLDivElement | null>(null)
  const [focusPulse, setFocusPulse] = useState(false)

  const achievementEvents = useMemo(
    () => data.rewardEvents.filter(isAchievementPopupEvent),
    [data.rewardEvents],
  )

  const canAnimate = !loading && data.grantedXp > 0
  const { shownXp, progress, levelFlash, levelUpBurst, phaseDone, barPulse } = useXpReveal(
    data.previousXp,
    Math.max(data.nextXp, data.previousXp + Math.max(0, data.grantedXp)),
    canAnimate,
  )
  const [visibleCount, setVisibleCount] = useState(0)

  useEffect(() => {
    popupedIdsRef.current = new Set()
  }, [data.previousXp, data.nextXp, data.rewardEvents])

  useEffect(() => {
    if (loading) return
    const reduceMotion = typeof window !== 'undefined'
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const node = progressFocusRef.current || rootRef.current
    const focusTimer = window.setTimeout(() => {
      node?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center', inline: 'nearest' })
      if (!reduceMotion) {
        setFocusPulse(true)
        window.setTimeout(() => setFocusPulse(false), 750)
      }
    }, 80)
    return () => window.clearTimeout(focusTimer)
  }, [loading, data.previousXp, data.nextXp, data.grantedXp])

  useEffect(() => {
    if (!phaseDone || loading) {
      setVisibleCount(0)
      return
    }
    if (achievementEvents.length === 0) return
    const reduceMotion = typeof window !== 'undefined'
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduceMotion) {
      setVisibleCount(achievementEvents.length)
      return
    }
    setVisibleCount(1)
    if (achievementEvents.length === 1) return
    const timers: number[] = []
    for (let i = 1; i < achievementEvents.length; i += 1) {
      timers.push(window.setTimeout(() => setVisibleCount(i + 1), i * 480))
    }
    return () => timers.forEach((id) => window.clearTimeout(id))
  }, [phaseDone, loading, achievementEvents.length])

  // After XP reveal, fire the tiered RewardPopup for each newly visible unlock.
  useEffect(() => {
    if (!phaseDone || loading || visibleCount <= 0) return
    const newlyVisible = achievementEvents
      .slice(0, visibleCount)
      .filter((event) => !popupedIdsRef.current.has(event.id))
    if (newlyVisible.length === 0) return

    newlyVisible.forEach((event) => popupedIdsRef.current.add(event.id))
    enqueueRewards(
      newlyVisible.map((event) => ({
        ...event,
        variant: event.variant === 'hero' ? 'hero' : 'popup',
        autoCloseMs: event.autoCloseMs && event.autoCloseMs > 0
          ? event.autoCloseMs
          : popupAutoCloseMs(event.visualTier),
      })),
    )
  }, [phaseDone, loading, visibleCount, achievementEvents, enqueueRewards])

  const gainedShown = Math.max(0, shownXp - data.previousXp)
  const barPct = Math.max(0, Math.min(100, progress.progress01 * 100))
  const startLevel = selectLevelProgress({
    xp: data.previousXp,
    unlockedAchievements: {},
    unlockedCosmetics: {},
    activityLog: [],
    unlockHistory: [],
  }).level

  return (
    <section
      ref={rootRef}
      className={`${styles.root} ${focusPulse ? styles.rootFocus : ''}`}
      data-tutorial-id="session-reward-recap"
      aria-live="polite"
    >
      <div className={styles.glow} aria-hidden="true" />
      <div className={styles.inner}>
        <header className={styles.header}>
          <p className={styles.eyebrow}>Match Rewards</p>
          <h2 className={styles.title}>Session belohnt</h2>
          <p className={styles.lead}>
            {loading
              ? 'Fortschritt wird ausgewertet…'
              : data.grantedXp > 0
                ? 'XP läuft ein — schau zu, wie dein Level wächst.'
                : 'Aktueller Stand nach dieser Session.'}
          </p>
        </header>

        <div ref={progressFocusRef} className={styles.progressFocus}>
          <div className={`${styles.levelStage} ${levelFlash ? styles.levelStageFlash : ''} ${levelUpBurst ? styles.levelStageBurst : ''}`}>
            <div className={styles.levelCore}>
              <div className={styles.levelRing} aria-hidden="true" />
              {levelUpBurst ? (
                <>
                  <div className={styles.burstRing} aria-hidden="true" />
                  <div className={styles.burstRingDelay} aria-hidden="true" />
                  <div className={styles.sparkles} aria-hidden="true">
                    <span /><span /><span /><span /><span /><span /><span /><span />
                  </div>
                </>
              ) : null}
              <p className={styles.levelLabel}>Level</p>
              <p className={`${styles.levelValue} ${levelFlash ? styles.levelPop : ''}`}>
                {progress.level}
              </p>
            </div>
            {progress.level > startLevel || levelUpBurst ? (
              <p className={`${styles.levelUpHint} ${levelUpBurst ? styles.levelUpHintPop : ''}`}>
                Level Up!
              </p>
            ) : (
              <p className={styles.levelSub}>Weiter zu Level {progress.level + 1}</p>
            )}
          </div>

          <div className={`${styles.xpPanel} ${barPulse ? styles.xpPanelLive : ''}`}>
            <div className={styles.xpTop}>
              <span className={styles.xpCaption}>Fortschritt</span>
              <span className={`${styles.xpGain} ${gainedShown > 0 ? styles.xpGainHot : ''}`}>
                {loading ? '…' : `+${gainedShown} XP`}
              </span>
            </div>

            <div
              className={styles.barTrack}
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={Math.max(1, progress.xpForNextLevel)}
              aria-valuenow={progress.xpIntoLevel}
              aria-label={`Level ${progress.level} Fortschritt`}
            >
              <div
                className={`${styles.barFill} ${barPulse ? styles.barFillPulse : ''}`}
                style={{ width: `${barPct}%` }}
              >
                <span className={styles.barSheen} aria-hidden="true" />
              </div>
            </div>

            <div className={styles.xpBottom}>
              <span>{progress.xpIntoLevel} / {progress.xpForNextLevel} XP in diesem Level</span>
              {data.grantedPux > 0 ? <span className={styles.puxChip}>{formatPux(data.grantedPux)}</span> : null}
            </div>
          </div>
        </div>

        {achievementEvents.length > 0 ? (
          <div className={styles.achievements}>
            <h3 className={styles.sectionTitle}>Freigeschaltet</h3>
            <ul className={styles.achievementList}>
              {achievementEvents.map((event, index) => {
                const visible = phaseDone && index < visibleCount
                return (
                  <li
                    key={event.id}
                    className={[
                      styles.achievementCard,
                      tierClass(event.visualTier),
                      visible ? styles.achievementIn : styles.achievementOut,
                    ].join(' ')}
                  >
                    <div className={styles.achievementIcon} aria-hidden="true">
                      {event.icon || (event.kind === 'mastery' ? 'M' : '★')}
                    </div>
                    <div className={styles.achievementText}>
                      <p className={styles.achievementEyebrow}>
                        {event.kind === 'mastery' ? 'Mastery' : 'Achievement'}
                        {event.visualTier ? ` · ${event.visualTier}` : ''}
                      </p>
                      <p className={styles.achievementTitle}>{event.title}</p>
                      {event.description ? (
                        <p className={styles.achievementDesc}>{event.description}</p>
                      ) : null}
                    </div>
                    {typeof event.amountPux === 'number' ? (
                      <div className={styles.achievementPux}>{formatPux(event.amountPux)}</div>
                    ) : null}
                  </li>
                )
              })}
            </ul>
          </div>
        ) : null}
      </div>
    </section>
  )
}
