import { formatPux } from '../../features/rewards'
import { UiButtonLink } from '../ui'
import { KpiRevealCard } from './KpiRevealCard'

type RewardOverviewKpisProps = {
  unlockedAchievementsCount: number
  totalAchievements: number
  unlockedMasteriesCount: number
  puxBalance: number
  analyzedTeamCount: number
  className?: string
}

export function RewardOverviewKpis({
  unlockedAchievementsCount,
  totalAchievements,
  unlockedMasteriesCount,
  puxBalance,
  analyzedTeamCount,
  className,
}: RewardOverviewKpisProps) {
  return (
    <div className={className}>
      <KpiRevealCard
        title="Erfolge"
        value={`${unlockedAchievementsCount}/${totalAchievements}`}
        hint={`${unlockedMasteriesCount} Meisterschaften`}
        panelTitle="Belohnungs-Fortschritt"
        panel={
          <>
            <p>Achievements und Meisterschaften bringen XP und PUX.</p>
            <div className="ui-tap-reveal-stat">
              <span>Erfolge</span>
              <strong>{unlockedAchievementsCount}/{totalAchievements}</strong>
            </div>
            <div className="ui-tap-reveal-stat">
              <span>Meisterschaften</span>
              <strong>{unlockedMasteriesCount}</strong>
            </div>
            <div className="ui-tap-reveal-actions">
              <UiButtonLink to="/locker" variant="secondary" size="sm">
                Locker
              </UiButtonLink>
            </div>
          </>
        }
      />
      <KpiRevealCard
        title="PUX!"
        value={formatPux(puxBalance)}
        hint={`${analyzedTeamCount} Teams analysiert`}
        panelTitle="PUX Wallet"
        panel={
          <>
            <p>Tippe oben rechts in der Nav auf deine PUX-Balance für Verlauf und Shop-Ziele.</p>
            <div className="ui-tap-reveal-stat">
              <span>Teams analysiert</span>
              <strong>{analyzedTeamCount}</strong>
            </div>
            <div className="ui-tap-reveal-actions">
              <UiButtonLink to="/locker" variant="primary" size="sm">
                Zum Shop
              </UiButtonLink>
            </div>
          </>
        }
      />
    </div>
  )
}
