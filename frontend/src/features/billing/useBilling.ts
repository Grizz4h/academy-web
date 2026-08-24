import { useQuery } from '@tanstack/react-query'
import { api } from '../../api'
import { useUser } from '../../context/UserContext'

export function useBilling() {
  const { user, userId } = useUser()
  return useQuery({
    queryKey: ['billing', userId],
    queryFn: () => api.getMyBilling(),
    enabled: Boolean(user),
    staleTime: 60_000,
    refetchOnWindowFocus: true,
  })
}
