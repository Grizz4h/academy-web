import type { ScenePoolOverview, ScenePoolStatus } from '../../stats/sceneOverview'
import { scenePoolStatusLabel } from '../../stats/sceneOverview'
import { UiButton } from '../ui'
import { KpiRevealCard } from './KpiRevealCard'

type ScenePoolOverviewKpisProps = {
  overview: ScenePoolOverview
  className?: string
  onApplyStatusFilter?: (status: ScenePoolStatus | '') => void
}

export function ScenePoolOverviewKpis({
  overview,
  className,
  onApplyStatusFilter,
}: ScenePoolOverviewKpisProps) {
  const pipelineShare = overview.total > 0
    ? Math.round((overview.pipeline / overview.total) * 100)
    : 0

  return (
    <div className={className}>
      <KpiRevealCard
        title="Szenen gesamt"
        value={overview.total}
        hint="im Pool gespeichert"
        panelTitle="Szenenpool"
        panel={
          <>
            <p>Alle markierten Szenen aus Sessions und manuellen Einträgen.</p>
            <div className="ui-tap-reveal-stat">
              <span>Neu</span>
              <strong>{overview.new}</strong>
            </div>
            <div className="ui-tap-reveal-stat">
              <span>Pipeline</span>
              <strong>{overview.pipeline}</strong>
            </div>
            <div className="ui-tap-reveal-stat">
              <span>Zugeordnet</span>
              <strong>{overview.assigned}</strong>
            </div>
          </>
        }
      />
      <KpiRevealCard
        title="Neu"
        value={overview.new}
        hint="noch nicht in Pipeline"
        panelTitle="Neue Szenen"
        panel={
          <>
            <p>Frisch markiert — noch nicht für die Produktion vorgemerkt.</p>
            {onApplyStatusFilter && (
              <div className="ui-tap-reveal-actions">
                <UiButton type="button" variant="primary" size="sm" onClick={() => onApplyStatusFilter('NEW')}>
                  Neu filtern
                </UiButton>
              </div>
            )}
          </>
        }
      />
      <KpiRevealCard
        title="Pipeline"
        value={overview.pipeline}
        hint="in Produktion aufgenommen"
        panelTitle="Pipeline-Szenen"
        align="right"
        panel={
          <>
            <p>
              {overview.total > 0
                ? `${pipelineShare}% des Pools sind in der Pipeline.`
                : 'Noch keine Szenen im Pool.'}
            </p>
            {onApplyStatusFilter && (
              <div className="ui-tap-reveal-actions">
                <UiButton type="button" variant="primary" size="sm" onClick={() => onApplyStatusFilter('PIPELINE')}>
                  Pipeline filtern
                </UiButton>
              </div>
            )}
          </>
        }
      />
      <KpiRevealCard
        title="Zugeordnet"
        value={overview.assigned}
        hint="für Episoden gesetzt"
        panelTitle="Zugeordnete Szenen"
        align="right"
        panel={
          <>
            <p>Status {scenePoolStatusLabel('ASSIGNED')} — für Episoden / Veröffentlichung gesetzt.</p>
            {onApplyStatusFilter && (
              <div className="ui-tap-reveal-actions">
                <UiButton type="button" variant="primary" size="sm" onClick={() => onApplyStatusFilter('ASSIGNED')}>
                  Zugeordnet filtern
                </UiButton>
              </div>
            )}
          </>
        }
      />
    </div>
  )
}
