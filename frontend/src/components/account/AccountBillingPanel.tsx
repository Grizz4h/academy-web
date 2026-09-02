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
  /** card = standalone section; embedded = inside rInQ ID hero */
  variant?: 'card' | 'embedded'
}

export default function AccountBillingPanel({
  hasAcademyPremium,
  checkoutNotice = null,
  presentation,
  billingLoading = false,
  billingError = false,
  variant = 'card',
}: AccountBillingPanelProps) {
  const billingPortal = useBillingPortal()
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const busy = billingPortal.isPending
  const embedded = variant === 'embedded'
  const showFreeLead = presentation.showCheckout && !hasAcademyPremium
  const detailIsWarn =
    presentation.badgeTone === 'warn' || presentation.badgeTone === 'danger'

  const content = (
    <>
      {showFreeLead ? (
        <p className={styles.lead}>
          {embedded
            ? 'Track A2+ und weitere Inhalte mit Premium.'
            : 'Mit Premium schaltest du Track A2+ und weitere Inhalte frei.'}
        </p>
      ) : null}

      {checkoutNotice === 'success' ? (
        <div className={styles.noticeOk}>
          <p>
            Checkout abgeschlossen. Zugang folgt nach Webhook — ggf. kurz neu laden.
          </p>
          {!embedded ? (
            <p className={styles.metaItem}>
              14 Tage Widerruf:{' '}
              <Link to={LEGAL_PUBLIC_PATHS.widerruf}>Widerrufsbelehrung</Link>
              {' · '}
              <Link to={LEGAL_PUBLIC_PATHS.widerrufAntrag}>Vertrag widerrufen</Link>
              {' · '}
              <Link to={LEGAL_PUBLIC_PATHS.kuendigen}>Kündigen</Link>
            </p>
          ) : null}
        </div>
      ) : null}
      {checkoutNotice === 'cancel' ? (
        <p className={styles.noticeWarn}>
          Checkout abgebrochen. Du kannst jederzeit erneut freischalten.
        </p>
      ) : null}

      {billingLoading ? (
        <p className={styles.lead}>Status wird geladen …</p>
      ) : billingError ? (
        <p className={styles.error}>Abo-Status konnte nicht geladen werden.</p>
      ) : (
        <div className={styles.statusBlock}>
          <div className={styles.statusRow}>
            <UiPill tone={presentation.badgeTone}>{presentation.badgeLabel}</UiPill>
            {presentation.statusHeadline ? (
              <p className={styles.periodLine}>{presentation.statusHeadline}</p>
            ) : null}
          </div>
          {presentation.statusDetail ? (
            <p className={detailIsWarn ? styles.noticeWarn : styles.metaItem}>
              {presentation.statusDetail}
            </p>
          ) : null}
        </div>
      )}

      <p className={embedded ? styles.legalCompact : styles.metaItem}>
        <Link to={LEGAL_PUBLIC_PATHS.agb}>AGB</Link>
        {' · '}
        <Link to={LEGAL_PUBLIC_PATHS.widerruf}>Widerruf</Link>
        {' · '}
        <Link to={LEGAL_PUBLIC_PATHS.datenschutz}>Datenschutz</Link>
        {!embedded ? (
          <>
            {' · '}
            <Link to={LEGAL_PUBLIC_PATHS.kuendigen}>Kündigen</Link>
            {' · '}
            <Link to={LEGAL_PUBLIC_PATHS.widerrufAntrag}>Widerrufen</Link>
          </>
        ) : null}
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
        <p className={styles.metaItem}>
          Abo-Verwaltung erscheint nach dem nächsten Checkout.
        </p>
      ) : null}

      <PremiumCheckoutSheet open={checkoutOpen} onClose={() => setCheckoutOpen(false)} />
    </>
  )

  if (embedded) {
    return (
      <aside className={styles.embedded} aria-label="Mitgliedschaft">
        <div className={styles.embeddedHead}>
          <p className={styles.embeddedTitle}>Mitgliedschaft</p>
        </div>
        {content}
      </aside>
    )
  }

  return (
    <Card surface="section">
      <h2 className="ui-section-title">Abo</h2>
      {content}
    </Card>
  )
}
