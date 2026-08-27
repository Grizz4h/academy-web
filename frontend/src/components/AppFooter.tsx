import { Link } from 'react-router-dom'
import { buildProblemReportMailto } from '../content/legal'
import { LEGAL_PUBLIC_PATHS } from '../content/legalMeta'
import styles from './AppFooter.module.css'

/**
 * Site-wide legal footer — reachable from every main page.
 */
export default function AppFooter() {
  const year = new Date().getFullYear()

  return (
    <footer className={styles.footer} role="contentinfo">
      <div className={styles.inner}>
        <nav className={styles.nav} aria-label="Rechtliches">
          <Link to={LEGAL_PUBLIC_PATHS.hub} className={styles.link}>
            Legal
          </Link>
          <Link to={LEGAL_PUBLIC_PATHS.impressum} className={styles.link}>
            Impressum
          </Link>
          <Link to={LEGAL_PUBLIC_PATHS.datenschutz} className={styles.link}>
            Datenschutz
          </Link>
          <Link to={LEGAL_PUBLIC_PATHS.agb} className={styles.link}>
            AGB
          </Link>
          <Link to={LEGAL_PUBLIC_PATHS.widerruf} className={styles.link}>
            Widerruf
          </Link>
          <Link to={LEGAL_PUBLIC_PATHS.kontakt} className={styles.link}>
            Kontakt
          </Link>
          <Link to={LEGAL_PUBLIC_PATHS.kuendigen} className={styles.link}>
            Vertrag kündigen
          </Link>
          <Link to={LEGAL_PUBLIC_PATHS.widerrufAntrag} className={styles.link}>
            Vertrag widerrufen
          </Link>
          <a className={styles.link} href={buildProblemReportMailto()}>
            Problem melden
          </a>
        </nav>
        <p className={styles.meta}>
          © {year} rInQ Tank
        </p>
      </div>
    </footer>
  )
}
