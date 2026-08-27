import type { ReactNode } from 'react'
import Card from '../components/Card'
import LegalPager from '../components/LegalPager'
import { RINQ_CONTACT_EMAIL, RINK_ABOUT_IT_LINKS, buildProblemReportMailto } from '../content/legal'
import styles from './Kontakt.module.css'

function ContactEmail() {
  return (
    <a className={styles.mail} href={`mailto:${RINQ_CONTACT_EMAIL}`}>
      {RINQ_CONTACT_EMAIL}
    </a>
  )
}

/** Simple stroke icons — no third-party icon library. */
function PlatformIcon({ platform }: { platform: string }) {
  const common = {
    viewBox: '0 0 24 24',
    fill: 'none' as const,
    'aria-hidden': true as const,
    className: styles.icon,
  }
  let art: ReactNode
  switch (platform) {
    case 'TikTok':
      art = (
        <>
          <path d="M14 4v9.2a3.8 3.8 0 1 1-2.6-3.6" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
          <path d="M14 6.2c1.2 1.4 2.8 2.2 4.5 2.3" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
        </>
      )
      break
    case 'Instagram':
      art = (
        <>
          <rect x="4.5" y="4.5" width="15" height="15" rx="4" stroke="currentColor" strokeWidth="1.75" />
          <circle cx="12" cy="12" r="3.4" stroke="currentColor" strokeWidth="1.75" />
          <circle cx="16.6" cy="7.5" r="1" fill="currentColor" />
        </>
      )
      break
    case 'YouTube':
      art = (
        <>
          <rect x="3.5" y="6.5" width="17" height="11" rx="3" stroke="currentColor" strokeWidth="1.75" />
          <path d="M11 9.8v4.4l4-2.2-4-2.2Z" fill="currentColor" />
        </>
      )
      break
    case 'X':
    default:
      art = (
        <path
          d="M5.5 5.5 12 12m0 0 6.5 6.5M12 12l6.5-6.5M12 12l-6.5 6.5"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
        />
      )
  }
  return <svg {...common}>{art}</svg>
}

export default function KontaktPage() {
  return (
    <article className={`ui-page-shell ${styles.page}`}>
      <header className="ui-page-header">
        <h1 className="ui-page-title">Kontakt</h1>
        <p className="ui-page-lead">
          Support und Accountfragen zu rInQ Tank — sowie weiterführender Hockey-Content beim
          verwandten Projekt Rink About It.
        </p>
      </header>

      <Card surface="section" className={styles.sectionCard}>
        <h2 className="ui-section-title">Support</h2>
        <p className={styles.body}>
          Für Fragen zu Konto, Lernfortschritt oder der Plattform erreichst du uns per E-Mail:
        </p>
        <p className={styles.body}>
          <ContactEmail />
        </p>
        <p className={styles.body}>
          <a className={styles.mail} href={buildProblemReportMailto()}>
            Problem melden
          </a>
          {' '}
          (öffnet eine vorgefüllte E-Mail mit App-Version und aktuellem Pfad).
        </p>
      </Card>

      <Card surface="section" className={styles.sectionCard}>
        <h2 className="ui-section-title">Mehr Hockey-Content</h2>
        <p className={styles.body}>
          Weitere Hockey-Inhalte, Beobachtungen und kurze Erklärformate findest du bei Rink About It.
        </p>
        <ul className={styles.socialList}>
          {RINK_ABOUT_IT_LINKS.map((item) => (
            <li key={item.platform}>
              <a
                className={styles.socialLink}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
              >
                <PlatformIcon platform={item.platform} />
                <span>{item.platform}</span>
              </a>
            </li>
          ))}
        </ul>
        <p className={styles.hint}>
          Für Support- und Accountfragen nutze bitte den direkten Kontakt per E-Mail.
        </p>
        <p className={styles.hint}>
          Beim Aufruf externer Plattformen gelten die Datenschutzbestimmungen des jeweiligen Anbieters.
        </p>
      </Card>

      <LegalPager />
    </article>
  )
}
