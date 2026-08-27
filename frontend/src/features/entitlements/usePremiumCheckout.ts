import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../api'

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

export function canOfferPremiumCheckout(user: string | null): boolean {
  return Boolean(user)
}
