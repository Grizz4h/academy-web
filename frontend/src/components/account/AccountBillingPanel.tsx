import { useState } from 'react'
import { Link } from 'react-router-dom'
import Card from '../Card'
import { UiActionRow, UiButton, UiPill } from '../ui'
import PremiumCheckoutSheet from '../billing/PremiumCheckoutSheet'
import {
  useBillingPortal,
  type AcademyBillingPresentation,
} from '../../features/billing'
import { LEGAL_PUBLIC_PATHS } from '../../content/legalMeta'
import styles from './AccountBillingPanel.module.css'

type AccountBillingPanelProps = {
  hasAcademyPremium: boolean
  checkoutNotice?: 'success' | 'cancel' | null
  presentation: AcademyBillingPresentation
  billingLoading?: boolean
  billingError?: boolean
}

export default function AccountBillingPanel({
  hasAcademyPremium,
  checkoutNotice = null,
  presentation,
  billingLoading = false,
  billingError = false,
}: AccountBillingPanelProps) {
  const billingPortal = useBillingPortal()
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const busy = billingPortal.isPending

  return (
    <Card surface="section">
      <h2 className="ui-section-title">rInQ Premium</h2>
      <p className={styles.lead}>
        Track A2+ und weitere Premium-Inhalte. Zugang wird serverseitig über dein Abo freigeschaltet.
      </p>

      {checkoutNotice === 'success' ? (
        <div className={styles.noticeOk}>
          <p>
            Checkout bei Stripe abgeschlossen. Premium wird nach bestätigtem Stripe-Webhook
            freigeschaltet — ggf. kurz neu laden.
          </p>
          <p className={styles.metaItem}>
            Für Verbraucher gilt grundsätzlich eine 14-tägige Widerrufsfrist. Details:{' '}
            <Link to={LEGAL_PUBLIC_PATHS.widerruf}>Widerrufsbelehrung</Link>
            {' · '}
            <Link to={LEGAL_PUBLIC_PATHS.widerrufAntrag}>Vertrag widerrufen</Link>
            {' · '}
            <Link to={LEGAL_PUBLIC_PATHS.kuendigen}>Vertrag kündigen</Link>
            {' · '}
            <Link to="/account">Kundenkonto</Link>
          </p>
        </div>
      ) : null}
      {checkoutNotice === 'cancel' ? (
        <p className={styles.noticeWarn}>Checkout abgebrochen. Du kannst Premium jederzeit erneut freischalten.</p>
      ) : null}

      {billingLoading ? (
        <p className={styles.lead}>Abo-Status wird geladen …</p>
      ) : billingError ? (
        <p className={styles.error}>Abo-Status konnte nicht geladen werden.</p>
      ) : (
        <>
          <div className={styles.statusRow}>
            <p className={styles.planName}>{presentation.planLabel}</p>
            {hasAcademyPremium || presentation.badgeLabel !== 'Free' ? (
              <UiPill tone={presentation.badgeTone}>{presentation.badgeLabel}</UiPill>
            ) : (
              <UiPill tone="neutral">Free</UiPill>
            )}
          </div>

          <p className={styles.statusHeadline}>{presentation.statusHeadline}</p>
          {presentation.statusDetail ? (
            <p className={presentation.badgeTone === 'warn' || presentation.badgeTone === 'danger'
              ? styles.noticeWarn
              : styles.metaItem}
            >
              {presentation.statusDetail}
            </p>
          ) : null}
        </>
      )}

      <p className={styles.metaItem}>
        <Link to={LEGAL_PUBLIC_PATHS.agb}>AGB</Link>
        {' · '}
        <Link to={LEGAL_PUBLIC_PATHS.widerruf}>Widerruf</Link>
        {' · '}
        <Link to={LEGAL_PUBLIC_PATHS.datenschutz}>Datenschutz</Link>
        {' · '}
        <Link to={LEGAL_PUBLIC_PATHS.kuendigen}>Kündigen</Link>
        {' · '}
        <Link to={LEGAL_PUBLIC_PATHS.widerrufAntrag}>Widerrufen</Link>
      </p>

      <UiActionRow className={styles.actions}>
        {presentation.canManage ? (
          <UiButton
            type="button"
            variant="secondary"
            disabled={busy}
            onClick={() => billingPortal.mutate()}
          >
            {billingPortal.isPending ? 'Weiterleitung…' : 'Abo verwalten'}
          </UiButton>
        ) : null}
        {presentation.showCheckout ? (
          <UiButton
            type="button"
            disabled={busy}
            onClick={() => setCheckoutOpen(true)}
          >
            Premium freischalten
          </UiButton>
        ) : null}
      </UiActionRow>

      {billingPortal.error ? (
        <p className={styles.error}>{(billingPortal.error as Error).message}</p>
      ) : null}

      {hasAcademyPremium && !presentation.canManage ? (
        <p className={styles.lead}>
          Abo-Verwaltung ist noch nicht verknüpft. Nach dem nächsten Checkout steht hier „Abo verwalten“ bereit.
        </p>
      ) : null}

      <PremiumCheckoutSheet open={checkoutOpen} onClose={() => setCheckoutOpen(false)} />
    </Card>
  )
}
