import styles from './SyncStatusChip.module.css'

export type SyncStatus = 'saved' | 'saving' | 'offline' | 'error' | 'idle'

const LABELS: Record<SyncStatus, string> = {
  idle: 'Bereit',
  saved: 'Gespeichert',
  saving: 'Sync…',
  offline: 'Offline',
  error: 'Sync fehlgeschlagen',
}

export default function SyncStatusChip({ status }: { status: SyncStatus }) {
  return (
    <span
      className={`${styles.chip} ${styles[status]}`}
      data-status={status}
      aria-live="polite"
    >
      <span className={styles.dot} aria-hidden="true" />
      {LABELS[status]}
    </span>
  )
}
