import { describe, expect, it } from 'vitest'
import { describeAcademyBilling, formatBillingStatus, selectPrimarySubscription } from './format'
import type { MyBillingPayload } from './types'

describe('billing format helpers', () => {
  it('maps known subscription statuses to German labels', () => {
    expect(formatBillingStatus('active')).toBe('Aktiv')
    expect(formatBillingStatus('past_due')).toBe('Zahlung ausstehend')
  })

  it('prefers active subscription rows', () => {
    const selected = selectPrimarySubscription([
      { status: 'canceled', external_subscription_id: 'sub_old' },
      { status: 'active', external_subscription_id: 'sub_new' },
    ])
    expect(selected?.external_subscription_id).toBe('sub_new')
  })

  it('describes cancel-at-period-end as auslaufend', () => {
    const billing: MyBillingPayload = {
      rinq_user_id: 'u1',
      plan: {
        status: 'active',
        current_period_end: '2026-09-23T12:00:00.000Z',
      },
      subscriptions: [
        {
          status: 'active',
          cancel_at_period_end: true,
          current_period_end: '2026-09-23T12:00:00.000Z',
        },
      ],
    }
    const view = describeAcademyBilling(true, billing)
    expect(view.badgeLabel).toBe('Auslaufend')
    expect(view.statusHeadline).toMatch(/^Auslaufend zum /)
    expect(view.profileLine).toMatch(/^Premium · auslaufend /)
  })

  it('describes active renewal', () => {
    const billing: MyBillingPayload = {
      rinq_user_id: 'u1',
      plan: { status: 'active', current_period_end: '2026-09-23T12:00:00.000Z' },
      subscriptions: [{ status: 'active', cancel_at_period_end: false }],
    }
    const view = describeAcademyBilling(true, billing)
    expect(view.badgeLabel).toBe('Premium aktiv')
    expect(view.statusHeadline).toMatch(/^Aktiv · Verlängerung am /)
  })
})
