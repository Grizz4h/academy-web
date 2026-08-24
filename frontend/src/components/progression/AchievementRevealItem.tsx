import type { AchievementProgressItem } from '../../features/rewards/logic/achievementProgress'
import { TapReveal } from '../ui/TapReveal'
import { UiActionRow, UiButton, UiButtonLink } from '../ui'
import { RinQIcon } from '../icons'
import styles from './AchievementRevealItem.module.css'

type AchievementRevealItemProps = {
  item: AchievementProgressItem
  tierColor: string
  unlockedAt?: string
  onReplay?: () => void
}

export function AchievementRevealItem({
  item,
  tierColor,
  unlockedAt,
  onReplay,
}: AchievementRevealItemProps) {
  const { achievement } = item
  const hiddenLocked = achievement.hidden && !item.isUnlocked

  return (
    <TapReveal
      className={styles.wrap}
      align="right"
      title={hiddenLocked ? 'Geheimer Erfolg' : achievement.title}
      ariaLabel={`${hiddenLocked ? 'Geheimer Erfolg' : achievement.title}: Details anzeigen`}
      trigger={
        <div
          className={[
            styles.item,
            item.isUnlocked ? styles.itemUnlocked : '',
          ].filter(Boolean).join(' ')}
        >
          <span
            className={styles.tierDot}
            style={{ background: tierColor }}
            aria-hidden="true"
          />
          <div className={styles.content}>
            <div className={styles.itemTitle}>
              {hiddenLocked ? '???' : achievement.title}
              <span className={styles.pux}>+{achievement.reward.PUX} PUX</span>
            </div>
            <div className={styles.itemDesc}>
              {hiddenLocked ? 'Noch verborgen — weiter trainieren.' : achievement.description}
            </div>
            {!item.isUnlocked && item.progress > 0 && (
              <div className={styles.progressWrap}>
                <div className={styles.progressTrack}>
                  <div
                    className={styles.progressFill}
                    style={{ width: `${Math.round(item.progress * 100)}%` }}
                  />
                </div>
                <span className={styles.progressLabel}>
                  {item.current}/{item.target}
                </span>
              </div>
            )}
            {item.isUnlocked && unlockedAt && (
              <div className={styles.unlockedAt}>
                <RinQIcon name="check" size="sm" tone="ok" inline />
                {new Date(unlockedAt).toLocaleDateString('de-DE')}
              </div>
            )}
            <span className="ui-tap-hint" aria-hidden="true">
              Antippen für Details
            </span>
          </div>
        </div>
      }
    >
      {!hiddenLocked && (
        <>
          <p>{achievement.description}</p>
          <div className="ui-tap-reveal-stat">
            <span>Fortschritt</span>
            <strong>{item.label}</strong>
          </div>
          <div className="ui-tap-reveal-stat">
            <span>Belohnung</span>
            <strong>+{achievement.reward.PUX} PUX</strong>
          </div>
        </>
      )}
      {hiddenLocked && (
        <p>Dieser Erfolg bleibt verborgen, bis du ihn freischaltest. Keine Spoiler — einfach weitermachen.</p>
      )}
      {item.isUnlocked && unlockedAt && (
        <p>Freigeschaltet am {new Date(unlockedAt).toLocaleDateString('de-DE')}.</p>
      )}
      {!item.isUnlocked && !hiddenLocked && item.progress === 0 && (
        <p>Noch nicht begonnen — starte eine Session in der Akademie.</p>
      )}
      <UiActionRow>
        {!item.isUnlocked ? (
          <UiButtonLink to="/curriculum" size="sm">
            Zur Akademie
          </UiButtonLink>
        ) : onReplay ? (
          <UiButton type="button" size="sm" onClick={onReplay}>
            Animation erneut
          </UiButton>
        ) : null}
        <UiButtonLink to="/locker" size="sm">
          PUX ausgeben
        </UiButtonLink>
      </UiActionRow>
    </TapReveal>
  )
}
