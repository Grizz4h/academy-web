import { Link } from 'react-router-dom'
import styles from './AppFooter.module.css'

/**
 * Site-wide legal footer — reachable from every main page.
 * Extend here when Datenschutz / AGB routes exist.
 */
export default function AppFooter() {
  const year = new Date().getFullYear()

  return (
    <footer className={styles.footer} role="contentinfo">
      <div className={styles.inner}>
        <nav className={styles.nav} aria-label="Rechtliches">
          <Link to="/legal" className={styles.link}>
            Legal
          </Link>
          <Link to="/impressum" className={styles.link}>
            Impressum
          </Link>
          <Link to="/datenschutz" className={styles.link}>
            Datenschutz
          </Link>
          <Link to="/kontakt" className={styles.link}>
            Kontakt
          </Link>
        </nav>
        <p className={styles.meta}>
          © {year} rInQ Tank
        </p>
      </div>
    </footer>
  )
}
