import { Link } from 'react-router-dom'
import styles from './NotFound.module.css'

export default function NotFoundPage() {
  return (
    <article className={`ui-page-shell ${styles.page}`}>
      <header className="ui-page-header">
        <p className={styles.code} aria-hidden="true">
          404
        </p>
        <h1 className={`ui-page-title ${styles.heading}`}>Seite nicht gefunden</h1>
        <p className="ui-page-lead">
          Diese Adresse gibt es in rInQ Tank nicht — oder der Link ist veraltet.
        </p>
      </header>
      <div className={styles.actions}>
        <Link to="/" className={styles.primary}>
          Zur Übersicht
        </Link>
        <Link to="/curriculum" className={styles.secondary}>
          Zur Akademie
        </Link>
        <Link to="/kontakt" className={styles.secondary}>
          Kontakt
        </Link>
      </div>
    </article>
  )
}
