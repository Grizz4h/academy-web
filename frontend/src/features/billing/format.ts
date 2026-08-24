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
  statusHeadline: string
  statusDetail: string | null
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

  if (!hasAcademyPremium) {
    return {
      planLabel: 'Free',
      badgeLabel: 'Free',
      badgeTone: 'neutral',
      statusHeadline: 'Kein Premium-Abo',
      statusDetail: 'Track A2+ und weitere Premium-Inhalte sind gesperrt.',
      profileLine: null,
      canManage,
      showCheckout: true,
    }
  }

  if (cancelAtEnd && endDate) {
    return {
      planLabel: 'RinQ Premium',
      badgeLabel: 'Auslaufend',
      badgeTone: 'warn',
      statusHeadline: `Auslaufend zum ${endDate}`,
      statusDetail: 'Premium bleibt bis zu diesem Datum aktiv. Danach wechselst du zurück auf Free.',
      profileLine: `Premium · auslaufend ${endDate}`,
      canManage,
      showCheckout: false,
    }
  }

  if (stripeStatus === 'past_due' || stripeStatus === 'unpaid') {
    return {
      planLabel: 'RinQ Premium',
      badgeLabel: 'Zahlung ausstehend',
      badgeTone: 'danger',
      statusHeadline: 'Zahlung ausstehend',
      statusDetail: endDate
        ? `Bitte Zahlungsmethode prüfen. Premium-Zugang gilt vorerst bis ${endDate}.`
        : 'Bitte Zahlungsmethode im Abo prüfen.',
      profileLine: 'Premium · Zahlung ausstehend',
      canManage,
      showCheckout: false,
    }
  }

  if (stripeStatus === 'trialing') {
    return {
      planLabel: 'RinQ Premium',
      badgeLabel: 'Testphase',
      badgeTone: 'ok',
      statusHeadline: endDate ? `Testphase bis ${endDate}` : 'Testphase',
      statusDetail: 'Premium-Inhalte sind während der Testphase freigeschaltet.',
      profileLine: endDate ? `Premium · Testphase bis ${endDate}` : 'Premium · Testphase',
      canManage,
      showCheckout: false,
    }
  }

  if (stripeStatus === 'canceled') {
    return {
      planLabel: 'RinQ Premium',
      badgeLabel: 'Beendet',
      badgeTone: 'neutral',
      statusHeadline: endDate ? `Beendet · Zugang bis ${endDate}` : 'Beendet',
      statusDetail: null,
      profileLine: endDate ? `Premium · beendet ${endDate}` : 'Premium · beendet',
      canManage,
      showCheckout: true,
    }
  }

  return {
    planLabel: 'RinQ Premium',
    badgeLabel: 'Premium aktiv',
    badgeTone: 'accent',
    statusHeadline: endDate ? `Aktiv · Verlängerung am ${endDate}` : 'Aktiv',
    statusDetail: null,
    profileLine: endDate ? `Premium · aktiv bis ${endDate}` : 'Premium · aktiv',
    canManage,
    showCheckout: false,
  }
}
