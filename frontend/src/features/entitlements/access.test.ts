import { describe, expect, it } from 'vitest'
import { hasAcademyPremium, isModulePremiumLocked } from './access'
import { ACADEMY_PREMIUM_FEATURE } from './types'

describe('entitlements access helpers', () => {
  it('detects premium_locked modules', () => {
    expect(isModulePremiumLocked({ premium_locked: true })).toBe(true)
    expect(isModulePremiumLocked({ premium_locked: false })).toBe(false)
    expect(isModulePremiumLocked(undefined)).toBe(false)
  })

  it('detects active academy_premium grant', () => {
    expect(
      hasAcademyPremium([
        {
          id: '1',
          rinq_user_id: 'u',
          feature_key: ACADEMY_PREMIUM_FEATURE,
          status: 'active',
          source: 'manual',
        },
      ]),
    ).toBe(true)
    expect(
      hasAcademyPremium([
        {
          id: '1',
          rinq_user_id: 'u',
          feature_key: ACADEMY_PREMIUM_FEATURE,
          status: 'revoked',
          source: 'manual',
        },
      ]),
    ).toBe(false)
  })
})
