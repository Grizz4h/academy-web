import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '../api'
import { useUser } from '../context/UserContext'
import { LabModuleNavigation, PredictModule } from '../features/lab/PredictComponents'
import { getSessionRoute } from '../features/lab/sessionRouting'

export default function LabPage() {
  const navigate = useNavigate()
  const { user } = useUser()
  const [activeModuleId, setActiveModuleId] = useState('predict')

  const { data: labContent } = useQuery({
    queryKey: ['lab-content'],
    queryFn: () => api.getLabContent(),
  })

  const enabledModules = useMemo(
    () => (labContent?.modules || []).filter((module) => module.enabled),
    [labContent]
  )

  const activeModule = enabledModules.find((module) => module.id === activeModuleId) || enabledModules[0]

  const { data: sessions } = useQuery({
    queryKey: ['sessions', user, 'IN_PROGRESS', 'lab'],
    queryFn: () => api.getSessions(user || undefined, 'IN_PROGRESS'),
    enabled: Boolean(user),
    refetchInterval: 30000,
  })

  const activePredictSession = (sessions || [])
    .filter((session) => session.learning_area === 'lab' && session.lab_mode === 'predict')
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]

  return (
    <div style={{ display: 'grid', gap: '1rem' }}>
      <header className="ui-page-header">
        <h1 className="ui-page-title">Lab</h1>
        <p className="ui-page-lead">Experimentelle Module und Prototypen.</p>
      </header>

      {!labContent && (
        <div className="card" style={{ marginBottom: 0 }}>
          Lade Lab-Inhalte...
        </div>
      )}

      <div className="card" style={{ marginBottom: 0 }}>
        {enabledModules.length > 0 ? (
          <>
            <LabModuleNavigation
              modules={enabledModules}
              activeId={activeModule?.id || 'predict'}
              onSelect={setActiveModuleId}
            />
            <p style={{ marginBottom: 0, marginTop: '0.8rem' }}>{activeModule?.description}</p>
          </>
        ) : (
          <p style={{ margin: 0 }}>Aktuell sind keine Lab-Module verfügbar.</p>
        )}
      </div>

      {activePredictSession && (
        <div className="card" style={{ marginBottom: 0 }}>
          <h3 style={{ marginTop: 0 }}>Aktive Predict-Session</h3>
          <p style={{ marginTop: 0 }}>
            {activePredictSession.game_info?.team_home} vs {activePredictSession.game_info?.team_away}
          </p>
          <button
            className="btn"
            style={{ minHeight: '46px' }}
            onClick={() => navigate(getSessionRoute(activePredictSession))}
          >
            Session fortsetzen
          </button>
        </div>
      )}

      {activeModule?.id === 'predict' && (
        <PredictModule
          templateCount={labContent?.prediction_templates?.length || 0}
          onStart={() => navigate('/lab/predict/setup')}
        />
      )}
    </div>
  )
}
