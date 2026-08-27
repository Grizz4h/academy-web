import styles from '../pages/Impressum.module.css'

/** Shared banner for draft legal documents. */
export default function LegalDraftBanner({ children }: { children?: string }) {
  return (
    <p className={styles.todo} role="note" style={{ display: 'block', marginBottom: '0.85rem' }}>
      <strong>TODO JURISTISCHE PRÜFUNG:</strong>{' '}
      {children
        || 'Arbeitsentwurf für den Pre-Launch — vor echtem Paid Launch prüfen. Keine Garantie auf Rechtssicherheit.'}
    </p>
  )
}
