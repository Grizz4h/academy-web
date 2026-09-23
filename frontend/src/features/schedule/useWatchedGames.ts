import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../../api'
import { useUser } from '../../context/UserContext'

export const WATCHED_GAMES_QUERY_KEY = ['me', 'watched-games'] as const

export function useWatchedGames() {
  const { user } = useUser()
  const queryClient = useQueryClient()
  const query = useQuery({
    queryKey: [...WATCHED_GAMES_QUERY_KEY, user],
    queryFn: () => api.getWatchedGames(),
    enabled: Boolean(user),
  })

  const watchedIds = new Set(query.data?.game_ids || [])
  const sessionIds = new Set(query.data?.from_session || [])

  const toggle = useMutation({
    mutationFn: ({ gameId, seen }: { gameId: string; seen: boolean }) =>
      api.setWatchedGame(gameId, seen),
    onMutate: async ({ gameId, seen }) => {
      const key = [...WATCHED_GAMES_QUERY_KEY, user]
      await queryClient.cancelQueries({ queryKey: key })
      const previous = queryClient.getQueryData<Awaited<ReturnType<typeof api.getWatchedGames>>>(key)
      queryClient.setQueryData(key, (old: typeof previous) => {
        if (!old) return old
        const next = new Set(old.game_ids)
        if (seen) next.add(gameId)
        else next.delete(gameId)
        const manual = new Set(old.manual)
        if (seen) manual.add(gameId)
        else manual.delete(gameId)
        return { ...old, game_ids: Array.from(next), manual: Array.from(manual) }
      })
      return { previous }
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData([...WATCHED_GAMES_QUERY_KEY, user], context.previous)
      }
    },
    onSuccess: (data) => {
      queryClient.setQueryData([...WATCHED_GAMES_QUERY_KEY, user], data)
    },
  })

  return {
    watchedIds,
    sessionIds,
    isLoading: query.isLoading,
    toggleWatched: (gameId: string, seen: boolean) => toggle.mutate({ gameId, seen }),
    isSaving: toggle.isPending,
  }
}
