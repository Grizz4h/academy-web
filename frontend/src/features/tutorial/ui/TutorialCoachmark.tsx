import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { autoUpdate, flip, offset, shift, useFloating } from '@floating-ui/react'
import { UiButton } from '../../../components/ui'
import { getFloatingPadding, getNavInset, getTutorialAnchorRect } from '../positioning'
import { resolveLiveTutorialTarget } from '../waitForTarget'
import type { TutorialStep } from '../types'
import styles from './tutorial.module.css'

const MOBILE_MQ = '(max-width: 768px)'

type Props = {
  step: TutorialStep
  index: number
  total: number
  targetMissing: boolean
  allowPageInteraction?: boolean
  onNext: () => void
  onBack: () => void
  onEnd: () => void
}

export function TutorialCoachmark({
  step,
  index,
  total,
  targetMissing,
  allowPageInteraction = false,
  onNext,
  onBack,
  onEnd,
}: Props) {
  const [mobile, setMobile] = useState(() => window.matchMedia(MOBILE_MQ).matches)
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)
  const [dockAboveSticky, setDockAboveSticky] = useState(false)
  const [navInset, setNavInset] = useState(() => getNavInset())
  const isDo = step.kind === 'do'
  const isCenter = step.placement === 'center' || !step.targetId || targetMissing

  useEffect(() => {
    const mq = window.matchMedia(MOBILE_MQ)
    const sync = () => setMobile(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  useEffect(() => {
    const sync = () => setNavInset(getNavInset())
    sync()
    window.addEventListener('resize', sync)
    window.addEventListener('scroll', sync, true)
    return () => {
      window.removeEventListener('resize', sync)
      window.removeEventListener('scroll', sync, true)
    }
  }, [])

  useEffect(() => {
    if (!step.targetId || isCenter) {
      setAnchor(null)
      setDockAboveSticky(false)
      return
    }
    const sync = () => {
      const node = resolveLiveTutorialTarget(step.targetId!)
      setAnchor(node)
      setDockAboveSticky(Boolean(
        document.querySelector('[data-session-sticky="true"]')
        || node?.closest('[data-session-sticky="true"]'),
      ))
    }
    sync()
    const timer = window.setInterval(sync, 300)
    return () => window.clearInterval(timer)
  }, [step.targetId, isCenter])

  const padding = useMemo(() => getFloatingPadding(navInset), [navInset])
  const preferred = step.placement === 'top' || step.placement === 'left' || step.placement === 'right'
    ? step.placement
    : 'bottom'

  const { refs, floatingStyles } = useFloating({
    placement: preferred,
    middleware: [
      offset(16),
      flip({ padding, fallbackAxisSideDirection: 'start' }),
      shift({ padding }),
    ],
    whileElementsMounted: autoUpdate,
  })

  useEffect(() => {
    if (!anchor) {
      refs.setReference(null)
      return
    }
    refs.setReference({
      getBoundingClientRect: () => getTutorialAnchorRect(anchor),
      contextElement: anchor,
    })
  }, [anchor, refs, navInset])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onEnd()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onEnd])

  const card = (
    <div
      ref={refs.setFloating}
      className={[
        styles.coach,
        mobile || isCenter ? styles.coachMobile : '',
        mobile && dockAboveSticky ? styles.coachMobileAboveSticky : '',
      ].filter(Boolean).join(' ')}
      style={{
        ['--tutorial-nav-inset' as string]: `${navInset}px`,
        ...(!mobile && !isCenter && anchor ? floatingStyles : {}),
      }}
      role="dialog"
      aria-modal={allowPageInteraction ? undefined : true}
      aria-labelledby="tutorial-coach-title"
    >
      <p className={styles.stepMeta}>Schritt {index + 1} von {total}</p>
      <h2 id="tutorial-coach-title" className={styles.coachTitle}>{step.title}</h2>
      <p className={styles.coachBody}>{step.body}</p>
      {isDo ? (
        <p className={styles.doHint}>
          {allowPageInteraction
            ? 'Erst die Übung durchklicken. Der Knopf unten wird danach aktiv.'
            : 'Tippe auf das markierte Element.'}
        </p>
      ) : null}
      {targetMissing && !isDo ? (
        <p className={styles.coachBody}>Der Bereich ist gerade nicht sichtbar. Du kannst trotzdem weitergehen.</p>
      ) : null}
      <div className={styles.coachActions}>
        <UiButton type="button" variant="ghost" size="sm" onClick={index === 0 ? onEnd : onBack}>
          {index === 0 ? 'Tutorial beenden' : 'Zurück'}
        </UiButton>
        {isDo ? (
          <button type="button" className={styles.quiet} onClick={onEnd}>
            Tutorial beenden
          </button>
        ) : (
          <UiButton type="button" onClick={onNext}>
            Weiter
          </UiButton>
        )}
      </div>
    </div>
  )

  return createPortal(card, document.body)
}
