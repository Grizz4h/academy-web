export const ACADEMY_PREMIUM_FEATURE = 'academy_premium' as const

export type EntitlementGrant = {
  id: string
  rinq_user_id: string
  feature_key: string
  status: string
  source: string
  created_at?: string | null
  updated_at?: string | null
  expires_at?: string | null
  metadata?: Record<string, unknown>
}

export type MyEntitlementsPayload = {
  rinq_user_id: string
  entitlements: EntitlementGrant[]
}
