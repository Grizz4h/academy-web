import { useEffect, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { UiButton } from '../../../components/ui'
import styles from './tutorial.module.css'

type Props = {
  title: string
  body?: string
  kicker?: string
  children?: ReactNode
  primaryLabel: string
  onPrimary: () => void
  secondaryLabel?: string
  onSecondary?: () => void
  quietLabel?: string
  onQuiet?: () => void
}

export function TutorialDialog({
  title,
  body,
  kicker,
  children,
  primaryLabel,
  onPrimary,
  secondaryLabel,
  onSecondary,
  quietLabel,
  onQuiet,
}: Props) {
  const primaryRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    primaryRef.current?.focus()
  }, [])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && onSecondary) onSecondary()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onSecondary])

  return createPortal(
    <div className={styles.dialogOverlay} role="presentation">
      <div
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="tutorial-dialog-title"
      >
        {kicker ? <p className={styles.kicker}>{kicker}</p> : null}
        <h2 id="tutorial-dialog-title" className={styles.title}>{title}</h2>
        {body ? <p className={styles.body}>{body}</p> : null}
        {children}
        <div className={styles.actions}>
          <UiButton type="button" block onClick={onPrimary}>
            {primaryLabel}
          </UiButton>
          {secondaryLabel && onSecondary ? (
            <UiButton type="button" variant="secondary" block onClick={onSecondary}>
              {secondaryLabel}
            </UiButton>
          ) : null}
          {quietLabel && onQuiet ? (
            <button type="button" className={styles.quiet} onClick={onQuiet}>
              {quietLabel}
            </button>
          ) : null}
        </div>
      </div>
    </div>,
    document.body,
  )
}
