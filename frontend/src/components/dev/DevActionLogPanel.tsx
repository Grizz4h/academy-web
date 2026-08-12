import { UiButton } from '../ui'
import {
  formatDevLogTime,
  type DevLogEntry,
  type DevLogLevel,
} from '../../dev/devActionLog'
import styles from './DevActionLogPanel.module.css'

type DevActionLogPanelProps = {
  entries: DevLogEntry[]
  onClear: () => void
  defaultOpen?: boolean
  title?: string
}

const LEVEL_CLASS: Record<DevLogLevel, string> = {
  info: styles.levelInfo,
  success: styles.levelSuccess,
  error: styles.levelError,
  warn: styles.levelWarn,
  pending: styles.levelPending,
}

export default function DevActionLogPanel({
  entries,
  onClear,
  defaultOpen = false,
  title = 'Aktivitätslog',
}: DevActionLogPanelProps) {
  const errorCount = entries.filter((entry) => entry.level === 'error').length
  const pendingCount = entries.filter((entry) => entry.level === 'pending').length

  return (
    <details className={styles.panel} open={defaultOpen}>
      <summary className={styles.summary}>
        <span>{title}</span>
        <span className={styles.summaryMeta}>
          {entries.length === 0
            ? 'leer'
            : `${entries.length} Eintrag${entries.length === 1 ? '' : 'e'}`
              + (pendingCount ? ` · ${pendingCount} läuft` : '')
              + (errorCount ? ` · ${errorCount} Fehler` : '')}
        </span>
      </summary>

      <div className={styles.body}>
        <div className={styles.toolbar}>
          <UiButton type="button" size="sm" variant="ghost" disabled={entries.length === 0} onClick={onClear}>
            Log leeren
          </UiButton>
        </div>

        {entries.length === 0 ? (
          <p className={styles.empty}>
            Aktionen aus dem Dev Cockpit erscheinen hier — Import, Seeds, Flags usw.
          </p>
        ) : (
          <ul className={styles.list}>
            {entries.map((entry) => (
              <li key={entry.id} className={`${styles.entry} ${LEVEL_CLASS[entry.level]}`}>
                <div className={styles.entryHead}>
                  <span className={styles.entryAction}>{entry.action}</span>
                  <time dateTime={entry.at}>{formatDevLogTime(entry.at)}</time>
                </div>
                <p className={styles.entryMessage}>{entry.message}</p>
                {entry.detail ? <pre className={styles.entryDetail}>{entry.detail}</pre> : null}
              </li>
            ))}
          </ul>
        )}
      </div>
    </details>
  )
}
