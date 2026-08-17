import { useEffect, useState } from 'react'
import Card from '../../../components/Card'
import Pill from '../../../components/Pill'
import { DISPLAY_CURRENCY_LABEL, formatPux, type RewardEvent, type RewardVisualTier } from '../types'
import styles from './RewardPopup.module.css'

type RewardPopupProps = {
  event: RewardEvent
  isVisible: boolean
  onClose: () => void
}

function buildTierLabel(event: RewardEvent): string {
  if (event.kind === 'achievement') return 'Achievement'
  if (event.kind === 'mastery') return `${event.mastery || event.visualTier || 'mastery'} mastery`
  if (event.kind === 'currency') return DISPLAY_CURRENCY_LABEL
  return 'Reward'
}

// Stagger delays per tier — gold and mastery allow more breathing room
const STAGGER_DELAYS: Record<RewardVisualTier, [number, number, number, number]> = {
  bronze:  [0,   80,  140, 200],
  silver:  [0,  100,  200, 320],
  gold:    [60, 200,  360, 500],
  mastery: [80, 260,  440, 620],
}

function useTierStagger(tier: RewardVisualTier | undefined, active: boolean) {
  const delays = STAGGER_DELAYS[tier ?? 'bronze']
  const [stages, setStages] = useState([false, false, false, false])

  useEffect(() => {
    if (!active) { setStages([false, false, false, false]); return }
    const timers = delays.map((delay, i) =>
      window.setTimeout(() => setStages(prev => { const n = [...prev]; n[i] = true; return n }), delay)
    )
    return () => timers.forEach(window.clearTimeout)
  }, [active, tier]) // eslint-disable-line react-hooks/exhaustive-deps

  return stages
}

export default function RewardPopup({ event, isVisible, onClose }: RewardPopupProps) {
  const tier = event.visualTier ?? 'bronze'
  const tierClass = styles[`tier_${tier}`] ?? ''
  const rootClass = [styles.root, isVisible ? styles.rootVisible : ''].join(' ')
  const containerClass = event.variant === 'small' ? `${styles.stack} ${styles.toastStack}` : styles.stack
  const panelClass =
    event.variant === 'hero'
      ? styles.heroPanel
      : event.variant === 'small'
        ? styles.toastPanel
        : styles.panel

  const [stageIcon, stageEyebrow, stageTitle, stageAmount] = useTierStagger(event.visualTier, isVisible)

  // For small/toast variant skip stagger — show immediately
  const isToast = event.variant === 'small'

  return (
    <div className={rootClass} aria-live="polite" aria-atomic="true">
      {event.variant !== 'small' && (
        <button className={styles.overlay} onClick={onClose} aria-label="Reward schliessen" />
      )}

      {/* Gold/Mastery receive an extra ambient burst layer behind the panel */}
      {(tier === 'gold' || tier === 'mastery') && isVisible && event.variant !== 'small' && (
        <div className={`${styles.burstLayer} ${styles[`burst_${tier}`]}`} aria-hidden="true" />
      )}

      <div className={containerClass} onClick={onClose} role="presentation">
        <div className={`${panelClass} ${tierClass}`}>
          <Card className={styles.card}>
            <div className={styles.cardContent}>
              <div className={styles.header}>
                <div
                  className={`${styles.iconWrap} ${isToast || stageIcon ? styles.stageIn : styles.stageOut}`}
                >
                  {/* Pulse ring shown for silver/gold/mastery */}
                  {(tier === 'silver' || tier === 'gold' || tier === 'mastery') && (
                    <span className={`${styles.iconRing} ${styles[`ring_${tier}`]}`} aria-hidden="true" />
                  )}
                  {event.icon || 'RWD'}
                </div>

                <div className={styles.textBlock}>
                  <div
                    className={`${styles.eyebrowRow} ${isToast || stageEyebrow ? styles.stageIn : styles.stageOut}`}
                  >
                    <Pill>{buildTierLabel(event)}</Pill>
                    {event.visualTier && <Pill>{event.visualTier}</Pill>}
                  </div>
                  <h3
                    className={`${styles.title} ${isToast || stageTitle ? styles.stageIn : styles.stageOut}`}
                  >
                    {event.title}
                  </h3>
                  {event.description && (
                    <p
                      className={`${styles.description} ${isToast || stageTitle ? styles.stageIn : styles.stageOut}`}
                    >
                      {event.description}
                    </p>
                  )}
                </div>
              </div>

              <div className={styles.footer}>
                {typeof event.amountPux === 'number' ? (
                  <div
                    className={`${styles.amount} ${styles[`amount_${tier}`]} ${isToast || stageAmount ? styles.stageIn : styles.stageOut}`}
                  >
                    {formatPux(event.amountPux)}
                  </div>
                ) : (
                  <span />
                )}
                <button className={styles.closeButton} onClick={onClose}>
                  Bestätigen
                </button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
