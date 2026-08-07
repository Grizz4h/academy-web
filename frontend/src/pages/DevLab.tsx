import { Link } from 'react-router-dom'
import { getHiddenNavTabs } from '../config/featureFlags'
import styles from './DevLab.module.css'

export default function DevLab() {
  const hidden = getHiddenNavTabs()

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Dev</h1>
      <p className={styles.lead}>
        Versteckte / unfertige Bereiche. In der Demo-Navigation ausgeblendet,
        hier weiter erreichbar. Wenn etwas fertig ist: in{' '}
        <code>featureFlags.ts</code> auf <code>navVisible: true</code> setzen.
      </p>

      <section className={styles.card}>
        <h2 className={styles.sectionTitle}>Unfertige Bereiche</h2>
        {hidden.length === 0 ? (
          <p className={styles.empty}>Aktuell ist nichts ausgeblendet.</p>
        ) : (
          <ul className={styles.list}>
            {hidden.map((item) => (
              <li key={item.to} className={styles.item}>
                <div className={styles.itemMain}>
                  <Link to={item.to} className={styles.link}>{item.label}</Link>
                  {item.note && <p className={styles.note}>{item.note}</p>}
                </div>
                <code className={styles.path}>{item.to}</code>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className={styles.hint}>
        Tipp: Logo fünfmal kurz antippen schaltet den Dev-Tab in der Nav ein/aus.
      </p>
    </div>
  )
}
