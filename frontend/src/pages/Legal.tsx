import { Link } from 'react-router-dom'
import styles from './Legal.module.css'

const LEGAL_CARDS = [
  {
    to: '/impressum',
    title: 'Impressum',
    description: 'Anbieterkennzeichnung, Verantwortliche, Haftung und Urheberrecht.',
  },
  {
    to: '/datenschutz',
    title: 'Datenschutz',
    description: 'Informationen zur Verarbeitung personenbezogener Daten in rInQ Tank.',
  },
  {
    to: '/kontakt',
    title: 'Kontakt',
    description: 'Support, Feedback, fachliche Hinweise & Kooperationen.',
  },
] as const

export default function LegalPage() {
  return (
    <article className={`ui-page-shell ${styles.page}`}>
      <header className="ui-page-header">
        <h1 className={`ui-page-title ${styles.heading}`}>Legal</h1>
        <p className="ui-page-lead">
          Rechtliche Informationen und Kontakt zu rInQ Tank.
        </p>
      </header>

      <nav className={styles.grid} aria-label="Legal-Bereiche">
        {LEGAL_CARDS.map((card) => (
          <Link key={card.to} to={card.to} className={styles.card}>
            <span className={styles.accent} aria-hidden="true" />
            <span className={styles.cardTitle}>{card.title}</span>
            <span className={styles.cardDesc}>{card.description}</span>
          </Link>
        ))}
      </nav>
    </article>
  )
}
