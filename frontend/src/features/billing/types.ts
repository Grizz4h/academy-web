export type BillingPlan = {
  plan_code?: string | null
  status?: string | null
  external_customer_id?: string | null
  current_period_end?: string | null
  updated_at?: string | null
}

export type BillingSubscription = {
  external_subscription_id?: string
  status?: string
  price_id?: string | null
  external_customer_id?: string | null
  current_period_start?: string | null
  current_period_end?: string | null
  cancel_at_period_end?: boolean
  updated_at?: string | null
}

export type MyBillingPayload = {
  rinq_user_id: string
  plan: BillingPlan | null
  subscriptions: BillingSubscription[]
}
