import type { SceneInsightsOverview } from '../../stats/sceneOverview'
import { KpiRevealCard } from './KpiRevealCard'

type SceneInsightsOverviewKpisProps = {
  overview: SceneInsightsOverview
  className?: string
}

export function SceneInsightsOverviewKpis({
  overview,
  className,
}: SceneInsightsOverviewKpisProps) {
  const publishedShare = overview.total > 0
    ? Math.round((overview.published / overview.total) * 100)
    : 0
  const leagueHint = overview.leagueFilter
    ? `Liga ${overview.leagueFilter}`
    : 'alle Ligen'

  return (
    <div className={className}>
      <KpiRevealCard
        title="Szenen"
        value={overview.total}
        hint={leagueHint}
        panelTitle="Insights-Basis"
        panel={
          <>
            <p>
              {overview.leagueFilter
                ? `Gefiltert auf Liga ${overview.leagueFilter}.`
                : 'Alle Szenen im Pool — ungefiltert nach Liga.'}
            </p>
            <div className="ui-tap-reveal-stat">
              <span>Veröffentlicht</span>
              <strong>{overview.published}</strong>
            </div>
            <div className="ui-tap-reveal-stat">
              <span>Offen</span>
              <strong>{overview.unpublished}</strong>
            </div>
          </>
        }
      />
      <KpiRevealCard
        title="Veröffentlicht"
        value={overview.published}
        hint="Status Zugeordnet"
        panelTitle="Veröffentlichte Szenen"
        panel={
          <>
            <p>
              {overview.total > 0
                ? `${publishedShare}% der Szenen sind zugeordnet / veröffentlicht.`
                : 'Noch keine Szenen vorhanden.'}
            </p>
          </>
        }
      />
      <KpiRevealCard
        title="Offen"
        value={overview.unpublished}
        hint="noch nicht zugeordnet"
        panelTitle="Offene Szenen"
        align="right"
        panel={
          <>
            <p>Szenen mit Status Neu oder Pipeline — noch nicht final zugeordnet.</p>
          </>
        }
      />
      <KpiRevealCard
        title="Teams"
        value={overview.teamCount}
        hint="mit beobachteten Szenen"
        panelTitle="Team-Abdeckung"
        align="right"
        panel={
          <>
            <p>Anzahl verschiedener beobachteter Teams in den Insights-Daten.</p>
            <div className="ui-tap-reveal-stat">
              <span>Teams</span>
              <strong>{overview.teamCount}</strong>
            </div>
          </>
        }
      />
    </div>
  )
}
