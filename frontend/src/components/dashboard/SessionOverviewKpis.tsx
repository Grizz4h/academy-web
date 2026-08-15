import { UiActionRow, UiButtonLink } from '../ui'
import { KpiRevealCard } from './KpiRevealCard'
import type { SessionOverview } from '../../stats/sessionOverview'
import { sessionCompletionRate } from '../../stats/sessionOverview'

type SessionOverviewKpisProps = {
  overview: SessionOverview
  className?: string
  /** History shows linked scene count on the first card. */
  showSceneCount?: boolean
}

export function SessionOverviewKpis({
  overview,
  className,
  showSceneCount = false,
}: SessionOverviewKpisProps) {
  const completionPct = sessionCompletionRate(overview)
  const totalHint = showSceneCount && overview.sceneCount != null
    ? `${overview.sceneCount} Szenen erfasst`
    : `${overview.inProgress} in Bearbeitung`

  return (
    <div className={className}>
      <KpiRevealCard
        title="Sessions gesamt"
        value={overview.total}
        hint={totalHint}
        panelTitle="Session-Übersicht"
        panel={
          <>
            <p>Alle echten Academy-Sessions — ohne Dev/Dummy-Einträge.</p>
            <div className="ui-tap-reveal-stat">
              <span>Abgeschlossen</span>
              <strong>{overview.completed}</strong>
            </div>
            <div className="ui-tap-reveal-stat">
              <span>In Bearbeitung</span>
              <strong>{overview.inProgress}</strong>
            </div>
            <div className="ui-tap-reveal-stat">
              <span>Abgebrochen</span>
              <strong>{overview.aborted}</strong>
            </div>
            {showSceneCount && overview.sceneCount != null && (
              <div className="ui-tap-reveal-stat">
                <span>Szenen im Pool</span>
                <strong>{overview.sceneCount}</strong>
              </div>
            )}
            <UiActionRow>
              <UiButtonLink to="/history" size="sm">
                Zum Verlauf
              </UiButtonLink>
              <UiButtonLink to="/progress" size="sm">
                Stats
              </UiButtonLink>
            </UiActionRow>
          </>
        }
      />
      <KpiRevealCard
        title="Abgeschlossen"
        value={overview.completed}
        hint={`${overview.aborted} abgebrochen`}
        panelTitle="Abschlussquote"
        panel={
          <>
            <p>
              {overview.total > 0
                ? `${completionPct}% deiner Sessions sind abgeschlossen.`
                : 'Noch keine Sessions — starte in der Akademie.'}
            </p>
            <div className="ui-tap-reveal-stat">
              <span>Quote</span>
              <strong>{completionPct}%</strong>
            </div>
            <UiActionRow>
              <UiButtonLink to="/curriculum" size="sm">
                Akademie
              </UiButtonLink>
            </UiActionRow>
          </>
        }
      />
      <KpiRevealCard
        title="In Bearbeitung"
        value={overview.inProgress}
        hint="noch offen"
        panelTitle="Offene Sessions"
        align="right"
        panel={
          <>
            <p>Sessions mit aktivem Status (IN_PROGRESS, PRE, P1–P3, POST).</p>
            <div className="ui-tap-reveal-stat">
              <span>Offen</span>
              <strong>{overview.inProgress}</strong>
            </div>
            <UiActionRow>
              <UiButtonLink to="/history" size="sm">
                Im Verlauf öffnen
              </UiButtonLink>
            </UiActionRow>
          </>
        }
      />
      <KpiRevealCard
        title="Abgebrochen"
        value={overview.aborted}
        hint="nicht beendet"
        panelTitle="Abgebrochene Sessions"
        align="right"
        panel={
          <>
            <p>Sessions, die vor Abschluss beendet wurden.</p>
            <div className="ui-tap-reveal-stat">
              <span>Abgebrochen</span>
              <strong>{overview.aborted}</strong>
            </div>
            <UiActionRow>
              <UiButtonLink to="/history" size="sm">
                Verlauf filtern
              </UiButtonLink>
            </UiActionRow>
          </>
        }
      />
    </div>
  )
}
