import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../api'
import { UiButton } from '../ui'
import { COMPETENCY_PROFILE_QUERY_KEY } from '../../features/competency'
import { listCompetencyFillFixtures } from '../../dev/competencyFixtures'

type DevCompetencyToolsProps = {
  /** Compact strip under Account radar; fuller card on DevLab */
  variant?: 'card' | 'inline'
}

export default function DevCompetencyTools({ variant = 'card' }: DevCompetencyToolsProps) {
  const queryClient = useQueryClient()
  const resetMutation = useMutation({
    mutationFn: () => api.resetMyCompetencyProfileDev(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: COMPETENCY_PROFILE_QUERY_KEY })
    },
  })

  const fixtures = listCompetencyFillFixtures()
  const body = (
    <>
      <p style={{ margin: '0 0 0.65rem', fontSize: '0.82rem', color: 'rgba(253, 186, 116, 0.92)', lineHeight: 1.4 }}>
        Nur für Dev-Accounts. Reset löscht Evidence-Events und Competency-States dieses Users — nicht Sessions
        oder Rewards. Autofill: in der Session den Button „DEV: Drill füllen“.
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
        <UiButton
          type="button"
          variant="dev"
          size="sm"
          disabled={resetMutation.isPending}
          onClick={() => {
            if (
              !window.confirm(
                'Competency-Profil zurücksetzen? Alle Evidence-Events und Scores dieses Accounts werden gelöscht.',
              )
            ) {
              return
            }
            resetMutation.mutate()
          }}
        >
          {resetMutation.isPending ? 'Reset…' : 'Competency-Profil reset'}
        </UiButton>
        {resetMutation.isSuccess ? (
          <span style={{ fontSize: '0.75rem', color: 'rgba(167, 243, 208, 0.9)' }}>
            OK · events={resetMutation.data.deleted_events} states={resetMutation.data.deleted_states}
          </span>
        ) : null}
        {resetMutation.isError ? (
          <span style={{ fontSize: '0.75rem', color: '#fca5a5' }}>
            {(resetMutation.error as Error).message || 'Reset fehlgeschlagen'}
          </span>
        ) : null}
      </div>
      <p style={{ margin: '0.65rem 0 0', fontSize: '0.72rem', color: 'rgba(186, 206, 214, 0.72)' }}>
        Autofill verfügbar: {fixtures.map((f) => f.drillId).join(', ')}
      </p>
    </>
  )

  if (variant === 'inline') {
    return (
      <div
        style={{
          marginTop: '0.75rem',
          padding: '0.75rem 0.85rem',
          border: '1px dashed rgba(245, 158, 11, 0.45)',
          borderRadius: 12,
          background: 'rgba(245, 158, 11, 0.06)',
        }}
      >
        <div style={{ fontWeight: 700, fontSize: '0.78rem', marginBottom: '0.45rem', color: '#fdba74' }}>
          DEV · Competency
        </div>
        {body}
      </div>
    )
  }

  return (
    <section
      className="card"
      style={{
        border: '1px dashed rgba(245, 158, 11, 0.55)',
        background: 'rgba(245, 158, 11, 0.08)',
      }}
    >
      <h2 className="ui-section-title">DEV → Competency</h2>
      {body}
    </section>
  )
}
