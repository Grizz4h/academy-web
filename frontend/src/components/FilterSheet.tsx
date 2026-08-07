import type { ReactNode } from 'react'
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
  if (!open) return null

  return (
    <div
      className={`sheetOverlay ${styles.overlay}`}
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className={`sheetPanel ${styles.panel}`}>
        <div className="sheetHeader">
          <div className="sheetTitle">{title}</div>
          <button type="button" className="sheetClose" onClick={onClose}>
            Schließen
          </button>
        </div>
        <div className={`sheetContent ${styles.content}`}>{children}</div>
        <div className="sheetFooter">
          {onReset && (
            <button type="button" className="sheetReset" onClick={onReset}>
              {resetLabel}
            </button>
          )}
          <button
            type="button"
            className="sheetApply"
            onClick={() => {
              onApply?.()
              onClose()
            }}
          >
            {applyLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
