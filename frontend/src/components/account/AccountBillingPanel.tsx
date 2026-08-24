import Card from '../Card'
import { UiActionRow, UiButton, UiPill } from '../ui'
import {
  useBillingPortal,
  type AcademyBillingPresentation,
} from '../../features/billing'
import { usePremiumCheckout } from '../../features/entitlements'
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
  const premiumCheckout = usePremiumCheckout()
  const billingPortal = useBillingPortal()
  const busy = premiumCheckout.isPending || billingPortal.isPending

  return (
    <Card surface="section">
      <h2 className="ui-section-title">RinQ Premium</h2>
      <p className={styles.lead}>
        Track A2+ und weitere Premium-Inhalte. Zugang wird serverseitig über dein Abo freigeschaltet.
      </p>

      {checkoutNotice === 'success' ? (
        <p className={styles.noticeOk}>Premium ist aktiv — willkommen in Track A2+.</p>
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

      <UiActionRow className={styles.actions}>
        {hasAcademyPremium && presentation.canManage ? (
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
            onClick={() => premiumCheckout.mutate()}
          >
            {premiumCheckout.isPending ? 'Weiterleitung…' : 'Premium freischalten'}
          </UiButton>
        ) : null}
      </UiActionRow>

      {premiumCheckout.error ? (
        <p className={styles.error}>{(premiumCheckout.error as Error).message}</p>
      ) : null}
      {billingPortal.error ? (
        <p className={styles.error}>{(billingPortal.error as Error).message}</p>
      ) : null}

      {hasAcademyPremium && !presentation.canManage ? (
        <p className={styles.lead}>
          Abo-Verwaltung ist noch nicht verknüpft. Nach dem nächsten Checkout steht hier „Abo verwalten“ bereit.
        </p>
      ) : null}
    </Card>
  )
}
