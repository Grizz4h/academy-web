import { Link, useLocation } from 'react-router-dom'
import styles from './LegalPager.module.css'
import { LEGAL_PUBLIC_PATHS } from '../content/legalMeta'

const LEGAL_PAGES = [
  { path: LEGAL_PUBLIC_PATHS.impressum, label: 'Impressum' },
  { path: LEGAL_PUBLIC_PATHS.datenschutz, label: 'Datenschutz' },
  { path: LEGAL_PUBLIC_PATHS.agb, label: 'AGB' },
  { path: LEGAL_PUBLIC_PATHS.widerruf, label: 'Widerruf' },
  { path: LEGAL_PUBLIC_PATHS.kontakt, label: 'Kontakt' },
] as const

/** Named prev/next between legal detail pages + link back to overview. */
export default function LegalPager() {
  const { pathname } = useLocation()
  const index = LEGAL_PAGES.findIndex((page) => page.path === pathname)
  if (index < 0) return null

  const prev = index > 0 ? LEGAL_PAGES[index - 1] : null
  const next = index < LEGAL_PAGES.length - 1 ? LEGAL_PAGES[index + 1] : null

  return (
    <nav className={styles.pager} aria-label="Weitere Legal-Seiten">
      <div className={styles.side}>
        {prev ? (
          <Link to={prev.path} className={styles.link}>
            ← {prev.label}
          </Link>
        ) : (
          <span />
        )}
      </div>
      <Link to={LEGAL_PUBLIC_PATHS.hub} className={styles.hub}>
        Legal
      </Link>
      <div className={`${styles.side} ${styles.sideEnd}`}>
        {next ? (
          <Link to={next.path} className={styles.link}>
            {next.label} →
          </Link>
        ) : (
          <span />
        )}
      </div>
    </nav>
  )
}
