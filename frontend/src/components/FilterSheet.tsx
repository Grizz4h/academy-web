import type { ReactNode } from 'react'
import { UiButton, UiSheet, UiSheetActions } from './ui'
import styles from './FilterSheet.module.css'

type FilterSheetProps = {
  open: boolean
  title?: string
  onClose: () => void
  onReset?: () => void
  onApply?: () => void
  children: ReactNode
  applyLabel?: string
  resetLabel?: string
}

export default function FilterSheet({
  open,
  title = 'Filter',
  onClose,
  onReset,
  onApply,
  children,
  applyLabel = 'Übernehmen',
  resetLabel = 'Zurücksetzen',
}: FilterSheetProps) {
  return (
    <UiSheet open={open} onClose={onClose} title={title} overlayClassName={styles.mobileOnly}>
      <div className={styles.fields}>{children}</div>
      <UiSheetActions
        secondary={
          onReset ? (
            <UiButton type="button" variant="ghost" onClick={onReset}>
              {resetLabel}
            </UiButton>
          ) : (
            <UiButton type="button" variant="secondary" onClick={onClose}>
              Abbrechen
            </UiButton>
          )
        }
        primary={
          <UiButton
            type="button"
            onClick={() => {
              onApply?.()
              onClose()
            }}
          >
            {applyLabel}
          </UiButton>
        }
      />
    </UiSheet>
  )
}

export function FilterSheetSection({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <div className={styles.section}>
      <div className={styles.sectionTitle}>{title}</div>
      {children}
    </div>
  )
}

export function FilterSheetRow({ children }: { children: ReactNode }) {
  return <div className={styles.row}>{children}</div>
}

export function FilterSheetStack({ children }: { children: ReactNode }) {
  return <div className={styles.stack}>{children}</div>
}
