import type { CurriculumModule } from '../api'
import Card from '../components/Card'
import { MechanicGlyph, TrackProgressMap, buildDrillProgressNodes } from '../components/visuals'
import { UiActionRow, UiButton, UiPill } from '../components/ui'
import { premiumLockMessage } from '../features/entitlements'
import { TUTORIAL_TARGET } from '../features/tutorial'
import styles from './Curriculum.module.css'

type CurriculumModuleCardProps = {
  id?: string
  module: CurriculumModule
  premiumLocked: boolean
  startBlocked: boolean
  startLabel: string
  highlightStart?: boolean
  highlightPendingGame?: boolean
  isEntryModule?: boolean
  cluster?: boolean
  showTheory: boolean
  showPremiumCheckout: boolean
  completedDrillIds: Set<string>
  onStart: () => void
  onTheory: () => void
  onCheckout: () => void
  /** D-pill → Setup with that drill selected (ADS loop). */
  onSelectDrill?: (drillId: string) => void
}

export function CurriculumModuleCard({
  id,
  module,
  premiumLocked,
  startBlocked,
  startLabel,
  highlightStart = false,
  highlightPendingGame = false,
  isEntryModule = false,
  cluster = false,
  showTheory,
  showPremiumCheckout,
  completedDrillIds,
  onStart,
  onTheory,
  onCheckout,
  onSelectDrill,
}: CurriculumModuleCardProps) {
  const drills = module.drills || []
  const progressNodes = buildDrillProgressNodes(
    drills.map((drill) => ({ id: drill.id, title: drill.title })),
    { completedIds: completedDrillIds },
  )

  return (
    <div id={id}>
      <Card
        surface="nested"
        elevation="quiet"
        className={[
          styles.moduleCard,
          cluster ? styles.moduleCardCluster : '',
          premiumLocked ? styles.moduleCardLocked : '',
          highlightPendingGame ? styles.moduleCardPendingGame : '',
        ].filter(Boolean).join(' ')}
      >
      <div className={styles.moduleTop}>
        <h3 className={styles.moduleTitle}>
          {module.title}
          {highlightPendingGame ? (
            <UiPill tone="accent" className={styles.pendingGamePill}>Empfohlen</UiPill>
          ) : null}
          {premiumLocked ? (
            <UiPill tone="warn" className={styles.premiumPill}>Premium</UiPill>
          ) : null}
        </h3>
        <UiActionRow className={styles.moduleActions}>
          <UiButton
            type="button"
            size={highlightStart ? 'md' : 'sm'}
            onClick={onStart}
            disabled={startBlocked}
            {...(isEntryModule ? { 'data-tutorial-id': TUTORIAL_TARGET.academyEntryStart } : {})}
          >
            {startLabel}
          </UiButton>
          {showTheory ? (
            <UiButton type="button" size="sm" onClick={onTheory}>
              Theorie lesen
            </UiButton>
          ) : null}
        </UiActionRow>
      </div>
      <p className={styles.moduleText}>{module.summary}</p>
      {premiumLocked ? (
        <p className={styles.moduleMuted}>{premiumLockMessage(module.id)}</p>
      ) : null}
      {showPremiumCheckout ? (
        <UiActionRow className={styles.moduleActions}>
          <UiButton type="button" size="sm" onClick={onCheckout}>
            Premium freischalten
          </UiButton>
        </UiActionRow>
      ) : null}
      {module.description ? (
        <p className={styles.moduleMuted}>{module.description}</p>
      ) : null}
      {progressNodes.length > 0 ? (
        <div className={styles.moduleProgress}>
          <TrackProgressMap
            nodes={progressNodes}
            compact
            onSelectNode={
              premiumLocked || !onSelectDrill
                ? undefined
                : (node) => onSelectDrill(node.id)
            }
            renderBeneath={(node) => {
              const drill = drills.find((entry) => entry.id === node.id)
              if (!drill) return null
              return (
                <MechanicGlyph
                  drillType={drill.drill_type}
                  mode={drill.config?.mode}
                  mechanic={drill.config?.mechanic}
                />
              )
            }}
          />
        </div>
      ) : null}
      {module.learningGoals && module.learningGoals.length > 0 ? (
        <div className={styles.learningGoals}>
          <strong>Lernziele:</strong>
          <ul>
            {module.learningGoals.map((goal, index) => (
              <li key={index}>{goal}</li>
            ))}
          </ul>
        </div>
      ) : null}
      <div className={styles.moduleStats}>
        Schwierigkeit: {module.difficulty || 1}
      </div>
      </Card>
    </div>
  )
}
