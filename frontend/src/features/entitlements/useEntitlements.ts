import { useQuery } from '@tanstack/react-query'
import { api } from '../../api'
import { useUser } from '../../context/UserContext'
import { hasAcademyPremium } from './access'

export function useEntitlements() {
  const { user, userId } = useUser()
  const query = useQuery({
    queryKey: ['entitlements', userId],
    queryFn: () => api.getMyEntitlements(),
    enabled: Boolean(user),
    staleTime: 60_000,
  })

  return {
    ...query,
    grants: query.data?.entitlements ?? [],
    hasAcademyPremium: hasAcademyPremium(query.data?.entitlements),
  }
}
