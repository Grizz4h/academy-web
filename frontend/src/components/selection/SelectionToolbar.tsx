import type { ReactNode } from 'react'
import { UiButton } from '../ui'
import styles from './selectionToolbar.module.css'

type Props = {
  active: boolean
  selectedCount: number
  totalCount: number
  itemLabelSingular?: string
  itemLabelPlural?: string
  onEnter: () => void
  onExit: () => void
  onSelectAll: () => void
  onClear: () => void
  onDeleteSelected?: () => void
  deletePending?: boolean
  disabled?: boolean
  trailing?: ReactNode
}

export function SelectionToolbar({
  active,
  selectedCount,
  totalCount,
  itemLabelSingular = 'Eintrag',
  itemLabelPlural = 'Einträge',
  onEnter,
  onExit,
  onSelectAll,
  onClear,
  onDeleteSelected,
  deletePending = false,
  disabled = false,
  trailing,
}: Props) {
  if (!active) {
    return (
      <div className={styles.bar}>
        <div className={styles.grow} />
        {trailing}
        <UiButton type="button" variant="ghost" size="sm" onClick={onEnter} disabled={disabled || totalCount === 0}>
          Auswählen
        </UiButton>
      </div>
    )
  }

  const label = selectedCount === 1 ? itemLabelSingular : itemLabelPlural

  return (
    <div className={styles.bar}>
      <p className={styles.count}>
        {selectedCount > 0
          ? `${selectedCount} ${label} ausgewählt`
          : 'Tippe Kacheln zum Auswählen'}
      </p>
      <div className={styles.actions}>
        {selectedCount < totalCount ? (
          <UiButton type="button" variant="ghost" size="sm" onClick={onSelectAll}>
            Alle
          </UiButton>
        ) : (
          <UiButton type="button" variant="ghost" size="sm" onClick={onClear}>
            Keine
          </UiButton>
        )}
        {onDeleteSelected ? (
          <UiButton
            type="button"
            variant="secondary"
            size="sm"
            onClick={onDeleteSelected}
            disabled={selectedCount === 0 || deletePending}
          >
            {deletePending ? 'Löschen…' : 'Löschen'}
          </UiButton>
        ) : null}
        <UiButton type="button" variant="primary" size="sm" onClick={onExit}>
          Fertig
        </UiButton>
      </div>
    </div>
  )
}
