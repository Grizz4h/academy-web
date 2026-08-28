import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../../api'
import { UiButton } from '../../components/ui'
import CompetencyRadar from './CompetencyRadar'
import type { MyCompetenciesPayload } from './types'
import styles from './CompetencyProfilePanel.module.css'

const QUERY_KEY = ['me', 'competencies'] as const

function CompetencyRadarSkeleton() {
  return (
    <section className={styles.skeleton} aria-busy="true" aria-label="Kompetenzprofil wird geladen">
      <div className={styles.skeletonTitle} />
      <div className={styles.skeletonNote} />
      <div className={styles.skeletonChart} />
    </section>
  )
}

type CompetencyProfileViewProps = {
  profile: MyCompetenciesPayload
  isRecomputing?: boolean
  recomputeError?: boolean
  onRecompute?: () => void
}

export function CompetencyProfileView({
  profile,
  isRecomputing = false,
  recomputeError = false,
  onRecompute,
}: CompetencyProfileViewProps) {
  return (
    <div className={styles.wrap}>
      {profile.stale ? (
        <div className={styles.staleBanner} role="status">
          <p>Dein Kompetenzprofil muss neu berechnet werden.</p>
          <UiButton
            type="button"
            size="sm"
            disabled={isRecomputing}
            onClick={() => onRecompute?.()}
          >
            {isRecomputing ? 'Aktualisiere…' : 'Profil aktualisieren'}
          </UiButton>
        </div>
      ) : null}
      {recomputeError ? (
        <p className={styles.recomputeError} role="alert">
          Aktualisierung fehlgeschlagen. Bitte später erneut versuchen.
        </p>
      ) : null}
      <CompetencyRadar competencies={profile.competencies} />
    </div>
  )
}

export default function CompetencyProfilePanel() {
  const queryClient = useQueryClient()
  const profileQuery = useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => api.getMyCompetencies(),
    staleTime: 30_000,
  })

  const recomputeMutation = useMutation({
    mutationFn: () => api.recomputeMyCompetencies(),
    onSuccess: (data: MyCompetenciesPayload) => {
      queryClient.setQueryData(QUERY_KEY, data)
    },
  })

  if (profileQuery.isLoading) {
    return <CompetencyRadarSkeleton />
  }

  if (profileQuery.isError) {
    return (
      <section className={styles.errorShell}>
        <h2 className={styles.errorTitle}>Kompetenzprofil</h2>
        <p className={styles.errorText}>Kompetenzprofil konnte nicht geladen werden.</p>
        <UiButton type="button" size="sm" onClick={() => profileQuery.refetch()}>
          Erneut laden
        </UiButton>
      </section>
    )
  }

  const profile = profileQuery.data
  if (!profile) {
    return null
  }

  return (
    <CompetencyProfileView
      profile={profile}
      isRecomputing={recomputeMutation.isPending}
      recomputeError={recomputeMutation.isError}
      onRecompute={() => recomputeMutation.mutate()}
    />
  )
}
