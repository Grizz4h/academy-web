import { Link } from 'react-router-dom'
import { RinkStyleLab } from '../features/rinkStyleLab/RinkStyleLab'
import styles from './DevRinkStyleLab.module.css'

export default function DevRinkStyleLabPage() {
  return (
    <article className={`ui-page-shell ${styles.page}`}>
      <header className="ui-page-header">
        <p className={styles.kicker}>Dev · Visual Grammar</p>
        <h1 className="ui-page-title">Rink Style Lab</h1>
        <p className="ui-page-lead">
          Detailed-Geometrie als Basis: Track-0-Szenen mappen, Markierungsintensität,
          Learning-Overlays und Spielerfiguren (Legacy / Board Studio) — ohne produktive Migration.
        </p>
      </header>

      <RinkStyleLab />

      <p className={styles.back}>
        <Link to="/dev">Dev-Cockpit</Link>
        {' · '}
        <Link to="/dev/track0-blueprint">Blueprint Lab</Link>
        {' · '}
        <Link to="/dev/ui">UI Kit</Link>
      </p>
    </article>
  )
}
