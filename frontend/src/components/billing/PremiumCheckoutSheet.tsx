import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../api'
import { UiButton, UiPill, UiSheet, UiSheetActions } from '../ui'
import { usePremiumCheckout } from '../../features/entitlements'
import { LEGAL_PUBLIC_PATHS } from '../../content/legalMeta'
import styles from './PremiumCheckoutSheet.module.css'

function formatOfferPrice(amount: number | null, currency: string | null): string {
  if (amount == null || !currency) return 'Preis im nächsten Schritt'
  try {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100)
  } catch {
    return `${(amount / 100).toFixed(2)} ${currency.toUpperCase()}`
  }
}

function formatIntervalUnit(interval: string | null, count: number | null): string {
  if (!interval) return 'Abrechnungszeitraum'
  const n = count && count > 1 ? count : 1
  const map: Record<string, [string, string]> = {
    day: ['Tag', 'Tage'],
    week: ['Woche', 'Wochen'],
    month: ['Monat', 'Monate'],
    year: ['Jahr', 'Jahre'],
  }
  const labels = map[interval] || [interval, interval]
  return n === 1 ? labels[0] : `${n} ${labels[1]}`
}

function LegalLinks({ onClose }: { onClose: () => void }) {
  return (
    <nav className={styles.legalNav} aria-label="Rechtliche Hinweise">
      <Link to={LEGAL_PUBLIC_PATHS.agb} onClick={onClose} className={styles.legalLink}>
        AGB
      </Link>
      <Link to={LEGAL_PUBLIC_PATHS.widerruf} onClick={onClose} className={styles.legalLink}>
        Widerruf
      </Link>
      <Link to={LEGAL_PUBLIC_PATHS.datenschutz} onClick={onClose} className={styles.legalLink}>
        Datenschutz
      </Link>
    </nav>
  )
}

type PremiumCheckoutSheetProps = {
  open: boolean
  onClose: () => void
}

/** Last rInQ step before Stripe: order summary, 18+, legal links. */
export default function PremiumCheckoutSheet({ open, onClose }: PremiumCheckoutSheetProps) {
  const checkout = usePremiumCheckout()
  const [ageConfirmed, setAgeConfirmed] = useState(false)
  useEffect(() => {
    if (!open) setAgeConfirmed(false)
  }, [open])
  const offerQuery = useQuery({
    queryKey: ['billing', 'offer'],
    queryFn: () => api.getBillingOffer(),
    enabled: open,
    staleTime: 60_000,
  })

  const offer = offerQuery.data?.offer
  const priceLabel = offer
    ? formatOfferPrice(offer.unit_amount, offer.currency)
    : '…'
  const intervalUnit = offer
    ? formatIntervalUnit(offer.interval, offer.interval_count)
    : 'Abrechnungszeitraum'
  const isMonthly =
    offer?.interval === 'month' && (!offer.interval_count || offer.interval_count === 1)
  const intervalShort = offer?.interval
    ? isMonthly
      ? 'pro Monat'
      : `pro ${intervalUnit}`
    : null

  const renewText = isMonthly
    ? 'Verlängert sich automatisch um jeweils einen Monat, bis du kündigst.'
    : offer?.interval
      ? `Verlängert sich automatisch um jeweils einen weiteren ${intervalUnit}, bis du kündigst.`
      : 'Verlängert sich automatisch, bis du kündigst.'

  return (
    <UiSheet open={open} onClose={onClose} title="Dein rInQ-Abo" meta="Letzter Schritt vor der Zahlung">
      <div className={styles.body}>
        <header className={styles.productHeader}>
          <div className={styles.productTitleRow}>
            <h2 className={styles.productTitle}>{offer?.product_label || 'rInQ Tank Premium'}</h2>
            <UiPill tone="accent">Premium</UiPill>
          </div>
          <p className={styles.lead}>
            Zugriff auf die kostenpflichtigen Lerninhalte ab Track A2 sowie die enthaltenen
            interaktiven Lern- und Reflexionsfunktionen. Track 0 und A1 bleiben kostenlos.
          </p>
        </header>

        {offerQuery.isLoading ? (
          <p className={styles.meta}>Preis wird geladen …</p>
        ) : offerQuery.isError ? (
          <p className={styles.warn}>
            Preis konnte nicht geladen werden. Du siehst ihn im nächsten Schritt bei der Zahlung.
          </p>
        ) : (
          <div className={styles.priceBlock}>
            <p className={styles.priceAmount}>
              {priceLabel}
              {intervalShort ? <span className={styles.priceInterval}> {intervalShort}</span> : null}
            </p>
            <ul className={styles.facts}>
              <li>{renewText}</li>
              <li>
                Jederzeit zum Ende des laufenden Abrechnungszeitraums kündbar.{' '}
                <Link to={LEGAL_PUBLIC_PATHS.kuendigen} onClick={onClose} className={styles.inlineLink}>
                  Mehr zur Kündigung
                </Link>
              </li>
              <li>Zugang wird nach erfolgreicher Zahlung freigeschaltet.</li>
            </ul>
          </div>
        )}

        <LegalLinks onClose={onClose} />

        <section className={styles.confirmBlock} aria-label="Altersbestätigung">
          <p className={styles.ageNote}>
            Für den Abschluss eines kostenpflichtigen rInQ-Abonnements musst du mindestens 18 Jahre
            alt sein.
          </p>
          <label className={styles.checkRow}>
            <input
              type="checkbox"
              checked={ageConfirmed}
              onChange={(e) => setAgeConfirmed(e.target.checked)}
            />
            <span>Ich bestätige, dass ich mindestens 18 Jahre alt bin.</span>
          </label>
        </section>

        <p className={styles.meta}>
          Weiterleitung zur Zahlung: Dort bestätigst du die AGB und wählst deine Zahlungsmethode.
        </p>

        <LegalLinks onClose={onClose} />

        {checkout.error ? (
          <p className={styles.warn} role="alert">
            {(checkout.error as Error).message}
          </p>
        ) : null}

        <UiSheetActions
          secondary={
            <UiButton type="button" variant="ghost" onClick={onClose} disabled={checkout.isPending}>
              Abbrechen
            </UiButton>
          }
          primary={
            <UiButton
              type="button"
              disabled={checkout.isPending || !ageConfirmed}
              onClick={() => checkout.mutate({ ageConfirmed: true })}
            >
              {checkout.isPending ? 'Weiterleitung…' : 'Weiter zur Zahlung'}
            </UiButton>
          }
        />
      </div>
    </UiSheet>
  )
}
