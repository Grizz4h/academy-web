import { useEffect, useState } from 'react'
import { getTutorialAnchorRect } from '../positioning'
import { resolveLiveTutorialTarget } from '../waitForTarget'
import styles from './tutorial.module.css'

const PAD = 8

type Rect = { top: number; left: number; width: number; height: number }

export function TutorialSpotlight({
  targetId,
  allowPageInteraction = false,
}: {
  targetId?: string
  allowPageInteraction?: boolean
}) {
  const [rect, setRect] = useState<Rect | null>(null)

  useEffect(() => {
    if (!targetId) {
      setRect(null)
      return
    }

    const update = () => {
      const node = resolveLiveTutorialTarget(targetId)
      if (!node) {
        setRect(null)
        return
      }
      const next = getTutorialAnchorRect(node)
      setRect({
        top: next.top - PAD,
        left: next.left - PAD,
        width: next.width + PAD * 2,
        height: next.height + PAD * 2,
      })
    }

    update()
    const interval = window.setInterval(update, 250)
    window.addEventListener('resize', update)
    window.addEventListener('scroll', update, true)
    return () => {
      window.clearInterval(interval)
      window.removeEventListener('resize', update)
      window.removeEventListener('scroll', update, true)
    }
  }, [targetId])

  if (!rect) {
    if (allowPageInteraction) return null
    return <div className={styles.dimPane} style={{ inset: 0 }} />
  }

  const top = Math.max(0, rect.top)
  const left = Math.max(0, rect.left)
  const width = Math.max(0, rect.width)
  const height = Math.max(0, rect.height)

  if (allowPageInteraction) {
    return (
      <div
        className={`${styles.ring} ${styles.ringPulse}`}
        style={{ top, left, width, height }}
        aria-hidden="true"
      />
    )
  }

  return (
    <>
      <div className={styles.dimPane} style={{ top: 0, left: 0, right: 0, height: top }} />
      <div className={styles.dimPane} style={{ top, left: 0, width: left, height }} />
      <div className={styles.dimPane} style={{ top, left: left + width, right: 0, height }} />
      <div className={styles.dimPane} style={{ top: top + height, left: 0, right: 0, bottom: 0 }} />
      <div
        className={`${styles.ring} ${styles.ringPulse}`}
        style={{ top, left, width, height }}
        aria-hidden="true"
      />
    </>
  )
}
