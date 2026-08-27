import { Link } from 'react-router-dom'
import Card from '../components/Card'
import { UiActionRow, UiButton } from '../components/ui'
import { useUser } from '../context/UserContext'
import { useBillingPortal } from '../features/billing'
import { LEGAL_PUBLIC_PATHS } from '../content/legalMeta'
import styles from './Impressum.module.css'

/**
 * Public cancel entry — reuses Stripe Customer Portal (no second subscription engine).
 */
export default function VertragKuendigenPage() {
  const { user } = useUser()
  const portal = useBillingPortal()

  return (
    <article className={`ui-page-shell ${styles.page}`}>
      <header className="ui-page-header">
        <h1 className={`ui-page-title ${styles.heading}`}>Vertrag kündigen</h1>
        <p className="ui-page-lead">
          Kündigung des rInQ-Premium-Abonnements zum Ende des aktuellen Abrechnungszeitraums
          (soweit so in Stripe konfiguriert).
        </p>
      </header>

      <Card surface="section" className={styles.sectionCard}>
        <h2 className="ui-section-title">So funktioniert die Kündigung</h2>
        <ul className={styles.list}>
          <li>Die Kündigung läuft über das Stripe Customer Portal.</li>
          <li>
            Solange Stripe „Cancel at period end“ setzt, bleibt Premium bis zum Periodenende
            aktiv.
          </li>
          <li>
            Das ist keine Ausübung des gesetzlichen Widerrufsrechts — dafür siehe{' '}
            <Link className={styles.mail} to={LEGAL_PUBLIC_PATHS.widerruf}>
              Widerrufsbelehrung
            </Link>
            .
          </li>
        </ul>

        {!user ? (
          <p className={styles.body}>
            Bitte zuerst <Link className={styles.mail} to="/">anmelden</Link>, um dein Abo zu
            verwalten.
          </p>
        ) : (
          <UiActionRow>
            <UiButton
              type="button"
              disabled={portal.isPending}
              onClick={() => portal.mutate()}
            >
              {portal.isPending ? 'Weiterleitung…' : 'Zum Kundenportal (kündigen)'}
            </UiButton>
            <UiButton type="button" variant="secondary" onClick={() => { window.location.href = '/account' }}>
              Zum Account
            </UiButton>
          </UiActionRow>
        )}

        {portal.error ? (
          <p className={styles.todo} role="alert">
            {(portal.error as Error).message}
          </p>
        ) : null}

        <p className={styles.body}>
          Weitere Infos: <Link className={styles.mail} to={LEGAL_PUBLIC_PATHS.agb}>AGB § 9</Link>
          {' · '}
          <Link className={styles.mail} to={LEGAL_PUBLIC_PATHS.kontakt}>Kontakt</Link>
        </p>
      </Card>
    </article>
  )
}
