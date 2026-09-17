import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../api'
import { normalizeClubLogoId } from './teamLogoClearance'

/** Server list of catalog IDs with written logo clearance. Reloads without a frontend rebuild. */
export function useClubLogoClearance(): ReadonlySet<string> {
  const { data } = useQuery({
    queryKey: ['team-logo-clearance'],
    queryFn: () => api.getTeamLogoClearance(),
    staleTime: 60_000,
  })
  return useMemo(
    () => new Set((data?.ids ?? []).map(normalizeClubLogoId).filter(Boolean)),
    [data],
  )
}
