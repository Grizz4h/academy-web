import { useMutation } from '@tanstack/react-query'
import { api } from '../../api'

export function useBillingPortal() {
  return useMutation({
    mutationFn: () => api.createBillingPortal(),
    onSuccess: (data) => {
      if (data.portal_url) {
        window.location.assign(data.portal_url)
      }
    },
  })
}
