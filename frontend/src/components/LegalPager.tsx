import { Link, useLocation } from 'react-router-dom'
import styles from './LegalPager.module.css'

const LEGAL_PAGES = [
  { path: '/impressum', label: 'Impressum' },
  { path: '/datenschutz', label: 'Datenschutz' },
  { path: '/kontakt', label: 'Kontakt' },
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
      <Link to="/legal" className={styles.hub}>
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
