import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../../api'
import { useUser } from '../../context/UserContext'

export function usePremiumCheckout() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (opts: { ageConfirmed: boolean }) =>
      api.createBillingCheckout({ ageConfirmed: opts.ageConfirmed }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['entitlements'] })
      queryClient.invalidateQueries({ queryKey: ['billing'] })
      queryClient.invalidateQueries({ queryKey: ['curriculum'] })
      if (data.checkout_url) {
        window.location.assign(data.checkout_url)
      }
    },
  })
}

/** Server-confirmed Stripe Checkout. Fail closed until /api/me.self_checkout. */
export function useSelfCheckout(): boolean {
  const { user } = useUser()
  const { data: account } = useQuery({
    queryKey: ['me', user],
    queryFn: () => api.getMe(),
    enabled: Boolean(user),
    staleTime: 60_000,
  })
  return Boolean(account?.self_checkout)
}

export function canOfferPremiumCheckout(user: string | null, selfCheckout: boolean): boolean {
  return Boolean(user) && selfCheckout
}
