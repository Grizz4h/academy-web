import { useQuery } from '@tanstack/react-query'
import { api } from '../../api'
import { useUser } from '../../context/UserContext'

/** Server-confirmed creator tools (Szenenpool, Szene erfassen). Never trust client profile fields. */
export function useCreatorMode(): boolean {
  const { user } = useUser()
  const { data: account } = useQuery({
    queryKey: ['me', user],
    queryFn: () => api.getMe(),
    enabled: Boolean(user),
    staleTime: 60_000,
  })
  return Boolean(account?.creator_mode)
}
