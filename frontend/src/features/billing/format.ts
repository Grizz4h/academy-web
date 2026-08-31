import type { BillingSubscription, MyBillingPayload } from './types'

const STATUS_LABELS: Record<string, string> = {
  active: 'Aktiv',
  trialing: 'Testphase',
  canceled: 'Beendet',
  incomplete: 'Unvollständig',
  incomplete_expired: 'Abgelaufen',
  past_due: 'Zahlung ausstehend',
  unpaid: 'Unbezahlt',
  paused: 'Pausiert',
}

export type AcademyBillingTone = 'accent' | 'warn' | 'ok' | 'neutral' | 'danger'

export type AcademyBillingPresentation = {
  planLabel: string
  badgeLabel: string
  badgeTone: AcademyBillingTone
  /** Short secondary line under the badge (date / period). Null when badge is enough. */
  statusHeadline: string | null
  statusDetail: string | null
  /** Compact line for RINK ID card — state only, no repeated “Premium”. */
  profileLine: string | null
  canManage: boolean
  showCheckout: boolean
}

export function formatBillingStatus(status: string | null | undefined): string {
  if (!status) return '—'
  return STATUS_LABELS[status] || status
}

export function formatBillingDate(iso: string | null | undefined): string | null {
  if (!iso) return null
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return null
  return date.toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' })
}

export function selectPrimarySubscription(
  subscriptions: BillingSubscription[] | null | undefined,
): BillingSubscription | null {
  const rows = subscriptions || []
  const active = rows.find((row) => row.status === 'active' || row.status === 'trialing')
  return active || rows[0] || null
}

export function describeAcademyBilling(
  hasAcademyPremium: boolean,
  billing: MyBillingPayload | undefined,
): AcademyBillingPresentation {
  const subscription = selectPrimarySubscription(billing?.subscriptions)
  const customerId =
    billing?.plan?.external_customer_id
    || subscription?.external_customer_id
    || null
  const canManage = Boolean(customerId)
  const stripeStatus = (subscription?.status || billing?.plan?.status || '').toLowerCase()
  const endDate = formatBillingDate(subscription?.current_period_end || billing?.plan?.current_period_end)
  const cancelAtEnd = Boolean(subscription?.cancel_at_period_end)

  // Server revokes premium on past_due/unpaid — do not claim access until period end.
  if (!hasAcademyPremium) {
    if (stripeStatus === 'past_due' || stripeStatus === 'unpaid') {
      return {
        planLabel: 'Free',
        badgeLabel: 'Zahlung fehlgeschlagen',
        badgeTone: 'danger',
        statusHeadline: null,
        statusDetail:
          'Premium-Zugang ist gesperrt, bis du die Zahlungsmethode im Kundenportal aktualisierst.',
        profileLine: 'Zahlung fehlgeschlagen',
        canManage,
        showCheckout: false,
      }
    }

    return {
      planLabel: 'Free',
      badgeLabel: 'Free',
      badgeTone: 'neutral',
      statusHeadline: null,
      statusDetail: 'Track A2+ und weitere Premium-Inhalte sind gesperrt.',
      profileLine: null,
      canManage,
      showCheckout: true,
    }
  }

  if (cancelAtEnd && endDate) {
    return {
      planLabel: 'rInQ Premium',
      badgeLabel: 'Auslaufend',
      badgeTone: 'warn',
      statusHeadline: `Zugang bis ${endDate}`,
      statusDetail: 'Danach wechselst du zurück auf Free.',
      profileLine: `Auslaufend · ${endDate}`,
      canManage,
      showCheckout: false,
    }
  }

  if (stripeStatus === 'past_due' || stripeStatus === 'unpaid') {
    return {
      planLabel: 'rInQ Premium',
      badgeLabel: 'Zahlung ausstehend',
      badgeTone: 'danger',
      statusHeadline: null,
      statusDetail:
        'Bitte Zahlungsmethode im Kundenportal prüfen. Ohne Klärung wird der Zugang gesperrt.',
      profileLine: 'Zahlung ausstehend',
      canManage,
      showCheckout: false,
    }
  }

  if (stripeStatus === 'trialing') {
    return {
      planLabel: 'rInQ Premium',
      badgeLabel: 'Testphase',
      badgeTone: 'ok',
      statusHeadline: endDate ? `Bis ${endDate}` : null,
      statusDetail: null,
      profileLine: endDate ? `Testphase · ${endDate}` : 'Testphase',
      canManage,
      showCheckout: false,
    }
  }

  if (stripeStatus === 'canceled') {
    return {
      planLabel: 'rInQ Premium',
      badgeLabel: 'Beendet',
      badgeTone: 'neutral',
      statusHeadline: endDate ? `Zugang bis ${endDate}` : null,
      statusDetail: null,
      profileLine: endDate ? `Beendet · ${endDate}` : 'Beendet',
      canManage,
      showCheckout: true,
    }
  }

  return {
    planLabel: 'rInQ Premium',
    badgeLabel: 'Aktiv',
    badgeTone: 'accent',
    statusHeadline: endDate ? `Verlängerung am ${endDate}` : null,
    statusDetail: null,
    profileLine: endDate ? `Aktiv · ${endDate}` : 'Aktiv',
    canManage,
    showCheckout: false,
  }
}
