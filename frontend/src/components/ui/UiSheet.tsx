import { useEffect, type ButtonHTMLAttributes, type KeyboardEvent, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { UiButton } from './UiButton'
import styles from './UiSheet.module.css'

type UiSheetProps = {
  open: boolean
  onClose: () => void
  title: string
  meta?: ReactNode
  label?: string
  overlayClassName?: string
  children: ReactNode
  onKeyDown?: (event: KeyboardEvent<HTMLDivElement>) => void
}

export function UiSheet({
  open,
  onClose,
  title,
  meta,
  label,
  overlayClassName,
  children,
  onKeyDown,
}: UiSheetProps) {
  useEffect(() => {
    if (!open) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [open])

  if (!open) return null

  return createPortal(
    <div
      className={[styles.overlay, overlayClassName].filter(Boolean).join(' ')}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-label={label || title}
        onKeyDown={(event) => {
          if (event.key === 'Escape') onClose()
          onKeyDown?.(event)
        }}
      >
        <div className={styles.header}>
          <h3 className={styles.title}>{title}</h3>
          {meta ? <p className={styles.meta}>{meta}</p> : null}
        </div>
        <div className={styles.body}>{children}</div>
      </div>
    </div>,
    document.body,
  )
}

type UiSheetActionsProps = {
  secondary?: ReactNode
  primary?: ReactNode
}

/** Standard sheet footer: Abbrechen links, primäre Aktion rechts. */
export function UiSheetActions({ secondary, primary }: UiSheetActionsProps) {
  if (!secondary && !primary) return null
  return (
    <div className={styles.actions}>
      {secondary ? <div className={styles.actionsStart}>{secondary}</div> : <div />}
      {primary ? <div className={styles.actionsEnd}>{primary}</div> : null}
    </div>
  )
}

type UiSheetChoiceProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  title: string
  hint?: string
}

export function UiSheetChoice({ title, hint, type = 'button', ...rest }: UiSheetChoiceProps) {
  return (
    <button type={type} className={styles.choice} {...rest}>
      <span className={styles.choiceTitle}>{title}</span>
      {hint ? <span className={styles.choiceHint}>{hint}</span> : null}
    </button>
  )
}

export function UiSheetChoiceList({ children }: { children: ReactNode }) {
  return <div className={styles.choiceList}>{children}</div>
}

export const uiSheetStyles = styles

export function UiSheetBack({
  children = '← Zurück',
  onClick,
}: {
  children?: ReactNode
  onClick: () => void
}) {
  return (
    <div className={styles.back}>
      <UiButton variant="ghost" size="sm" onClick={onClick}>
        {children}
      </UiButton>
    </div>
  )
}
