import { useEffect, useState, type CSSProperties } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import Card from '../components/Card'
import LegalDraftBanner from '../components/LegalDraftBanner'
import { UiActionRow, UiButton, UiButtonLink } from '../components/ui'
import { api } from '../api'
import { useUser } from '../context/UserContext'
import { RINQ_CONTACT_EMAIL } from '../content/legal'
import { LEGAL_PUBLIC_PATHS } from '../content/legalMeta'
import styles from './Impressum.module.css'

type Receipt = {
  id: string
  received_at: string
  status: string
  outside_window?: boolean
  awaiting_email_confirm?: boolean
  contact_email?: string | null
  contract_ref?: string
}

function formatReceivedLocal(iso: string): { date: string; time: string } {
  try {
    const d = new Date(iso)
    return {
      date: new Intl.DateTimeFormat('de-DE', {
        dateStyle: 'medium',
        timeZone: 'Europe/Berlin',
      }).format(d),
      time: new Intl.DateTimeFormat('de-DE', {
        timeStyle: 'short',
        timeZone: 'Europe/Berlin',
      }).format(d),
    }
  } catch {
    return { date: iso, time: '' }
  }
}

/**
 * Electronic withdrawal — public + authenticated.
 * Confirmed action required; Stripe cancel/refund runs server-side when eligible.
 */
export default function VertragWiderrufenPage() {
  const { user } = useUser()
  const [searchParams, setSearchParams] = useSearchParams()
  const [step, setStep] = useState<'form' | 'confirm'>('form')
  const [displayName, setDisplayName] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [note, setNote] = useState('')
  const [receipt, setReceipt] = useState<Receipt | null>(null)
  const [confirmTokenDone, setConfirmTokenDone] = useState(false)

  useEffect(() => {
    if (user) {
      setDisplayName((prev) => prev || user)
    }
  }, [user])

  const submit = useMutation({
    mutationFn: () =>
      api.submitWithdrawalRequest({
        confirmed: true,
        note: note.trim() || undefined,
        display_name: displayName.trim() || undefined,
        contact_email: contactEmail.trim() || undefined,
      }),
    onSuccess: (data) => {
      setReceipt({
        id: data.id,
        received_at: data.received_at,
        status: data.status,
        outside_window: data.outside_window,
        awaiting_email_confirm: data.awaiting_email_confirm,
        contact_email: data.contact_email,
        contract_ref: data.contract_ref,
      })
    },
  })

  const confirmToken = useMutation({
    mutationFn: (token: string) => api.confirmWithdrawalRequest(token),
    onSuccess: (data) => {
      setConfirmTokenDone(true)
      setReceipt({
        id: data.id,
        received_at: data.received_at,
        status: data.status,
        outside_window: data.outside_window,
        contact_email: data.contact_email,
        contract_ref: data.contract_ref,
      })
      setSearchParams({}, { replace: true })
    },
  })

  useEffect(() => {
    const token = searchParams.get('confirm')
    if (!token || confirmTokenDone || confirmToken.isPending || confirmToken.isSuccess) return
    confirmToken.mutate(token)
    // Intentionally once per token in URL
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  const when = receipt ? formatReceivedLocal(receipt.received_at) : null

  return (
    <article className={`ui-page-shell ${styles.page}`}>
      <header className="ui-page-header">
        <h1 className={`ui-page-title ${styles.heading}`}>Vertrag widerrufen</h1>
        <p className="ui-page-lead">
          Wenn du dein rInQ-Abonnement innerhalb der Widerrufsfrist widerrufen möchtest, kannst du
          deinen Widerruf hier elektronisch übermitteln.
        </p>
      </header>

      <LegalDraftBanner>
        TODO LEGAL REVIEW: konkrete Widerrufsbelehrung und Einordnung des rInQ-Abos vor Paid Launch
        anwaltlich prüfen.
      </LegalDraftBanner>

      <Card surface="section" className={styles.sectionCard}>
        <h2 className="ui-section-title">Hinweis</h2>
        <p className={styles.body}>
          Widerruf (Rückabwicklung innerhalb der Frist) ist nicht dasselbe wie Kündigung (Ende der
          Verlängerung zum Periodenende). Details:{' '}
          <Link className={styles.mail} to={LEGAL_PUBLIC_PATHS.widerruf}>
            Widerrufsbelehrung
          </Link>
          {' · '}
          <Link className={styles.mail} to={LEGAL_PUBLIC_PATHS.kuendigen}>
            Vertrag kündigen
          </Link>
          .
        </p>
      </Card>

      {confirmToken.isPending ? (
        <Card surface="section" className={styles.sectionCard}>
          <p className={styles.body}>Widerruf wird bestätigt …</p>
        </Card>
      ) : null}

      {receipt ? (
        receipt.outside_window ? (
          <Card surface="section" className={styles.sectionCard}>
            <h2 className="ui-section-title">Widerrufsfrist abgelaufen</h2>
            <p className={styles.body}>
              Die reguläre Widerrufsfrist für dieses Abonnement ist abgelaufen. Du kannst dein
              Abonnement weiterhin kündigen.
            </p>
            <UiActionRow>
              <UiButtonLink to={LEGAL_PUBLIC_PATHS.kuendigen}>Vertrag kündigen</UiButtonLink>
            </UiActionRow>
            <p className={styles.body}>
              Wenn du glaubst, dass dein Widerrufsrecht weiterhin besteht, kontaktiere uns unter{' '}
              <a className={styles.mail} href={`mailto:${RINQ_CONTACT_EMAIL}`}>
                {RINQ_CONTACT_EMAIL}
              </a>
              .
            </p>
          </Card>
        ) : receipt.awaiting_email_confirm ? (
          <Card surface="section" className={styles.sectionCard}>
            <h2 className="ui-section-title">E-Mail bestätigen</h2>
            <p className={styles.body}>
              Wir haben einen Bestätigungslink an {receipt.contact_email || 'deine E-Mail'} gesendet.
              Bitte öffne den Link, um den Widerruf verbindlich abzuschließen.
            </p>
            <p className={styles.body}>Referenz: {receipt.contract_ref || receipt.id}</p>
          </Card>
        ) : (
          <Card surface="section" className={styles.sectionCard}>
            <h2 className="ui-section-title">Widerruf eingegangen</h2>
            <p className={styles.body}>
              Dein Widerruf ist am {when?.date}
              {when?.time ? ` um ${when.time}` : ''} eingegangen
              {receipt.contact_email
                ? `. Eine Bestätigung wurde an ${receipt.contact_email} gesendet`
                : ''}
              .
            </p>
            <ul className={styles.list}>
              <li>Referenz: {receipt.contract_ref || receipt.id}</li>
              <li>Status: {receipt.status}</li>
              <li>Eingang (UTC): {receipt.received_at}</li>
            </ul>
            <p className={styles.body}>
              Bei Fragen: {RINQ_CONTACT_EMAIL}
            </p>
          </Card>
        )
      ) : step === 'form' ? (
        <Card surface="section" className={styles.sectionCard}>
          <h2 className="ui-section-title">Angaben</h2>
          {!user ? (
            <p className={styles.body}>
              Du kannst den Widerruf auch ohne Login erklären. Wir ordnen den Vertrag über die
              Stripe-Kunden-E-Mail zu und senden dir einen Bestätigungslink.
            </p>
          ) : null}
          <label className={styles.body} style={{ display: 'block', marginTop: '0.65rem' }}>
            Name
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
              maxLength={200}
              style={fieldStyle}
            />
          </label>
          <label className={styles.body} style={{ display: 'block', marginTop: '0.65rem' }}>
            E-Mail
            <input
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              required
              maxLength={320}
              placeholder={user ? 'für Bestätigungsmail' : 'wie bei Stripe hinterlegt'}
              style={fieldStyle}
            />
          </label>
          <label className={styles.body} style={{ display: 'block', marginTop: '0.65rem' }}>
            Optionale Anmerkung
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              maxLength={1000}
              style={fieldStyle}
            />
          </label>
          <UiActionRow>
            <UiButton
              type="button"
              disabled={!displayName.trim() || !contactEmail.trim()}
              onClick={() => setStep('confirm')}
            >
              Weiter
            </UiButton>
          </UiActionRow>
        </Card>
      ) : (
        <Card surface="section" className={styles.sectionCard}>
          <h2 className="ui-section-title">Widerruf bestätigen</h2>
          <p className={styles.body}>
            Bitte prüfe deine Angaben. Erst mit „Widerruf bestätigen“ wird die Erklärung
            übermittelt.
          </p>
          <ul className={styles.list}>
            <li>Name: {displayName.trim()}</li>
            <li>E-Mail: {contactEmail.trim() || '—'}</li>
            {note.trim() ? <li>Anmerkung: {note.trim()}</li> : null}
          </ul>
          <UiActionRow>
            <UiButton type="button" variant="ghost" onClick={() => setStep('form')}>
              Zurück
            </UiButton>
            <UiButton
              type="button"
              disabled={submit.isPending}
              onClick={() => submit.mutate()}
            >
              {submit.isPending ? 'Senden…' : 'Widerruf bestätigen'}
            </UiButton>
          </UiActionRow>
          {submit.error ? (
            <p className={styles.todo} role="alert">
              {(submit.error as Error).message}
            </p>
          ) : null}
        </Card>
      )}
    </article>
  )
}

const fieldStyle: CSSProperties = {
  display: 'block',
  width: '100%',
  marginTop: '0.35rem',
  boxSizing: 'border-box',
  borderRadius: 8,
  padding: '0.55rem 0.7rem',
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.18)',
  color: 'inherit',
  font: 'inherit',
}
