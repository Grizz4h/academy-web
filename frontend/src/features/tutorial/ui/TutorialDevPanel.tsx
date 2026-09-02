import { UiButton } from '../../../components/ui'
import { useTutorial } from '../TutorialProvider'
import styles from './tutorial.module.css'

/** Inline tutorial controls for DevLab — not a floating overlay. */
export function TutorialDevPanel() {
  const tutorial = useTutorial()

  return (
    <div className={styles.devInline}>
      <p className={styles.devMeta}>
        {tutorial.tutorialId} v{tutorial.version}
        {' · '}
        Step {tutorial.currentStep?.id || '—'} ({tutorial.currentIndex + 1}/{tutorial.stepCount})
        {' · '}
        {tutorial.progress.status}/{tutorial.surface}
      </p>
      <div className={styles.devRow}>
        <UiButton
          type="button"
          size="sm"
          variant="dev"
          onClick={tutorial.simulateNewProfile}
          title="Setzt Tutorial zurück und öffnet den Willkommens-Screen (auch mit bestehenden Sessions)"
        >
          Neues Profil
        </UiButton>
        <UiButton type="button" size="sm" variant="dev" onClick={tutorial.back}>Prev</UiButton>
        <UiButton type="button" size="sm" variant="dev" onClick={tutorial.next}>Next</UiButton>
        <UiButton type="button" size="sm" variant="dev" onClick={tutorial.restart}>Restart</UiButton>
        <UiButton type="button" size="sm" variant="dev" onClick={tutorial.resetState}>Reset</UiButton>
      </div>
    </div>
  )
}
