import { useDevNavEnabled } from '../../../config/featureFlags'
import { UiButton } from '../../../components/ui'
import { useTutorial } from '../TutorialProvider'
import styles from './tutorial.module.css'

export function TutorialDevPanel() {
  const enabled = useDevNavEnabled()
  const tutorial = useTutorial()
  if (!enabled) return null

  return (
    <div className={styles.devPanel}>
      <div>
        Tutorial: {tutorial.tutorialId} v{tutorial.version}
      </div>
      <div>
        Step: {tutorial.currentStep?.id || '—'} · {tutorial.currentIndex + 1} / {tutorial.stepCount}
      </div>
      <div>Target: {tutorial.currentStep?.targetId || 'center'}</div>
      <div>Route: {tutorial.currentStep?.route || '—'}</div>
      <div>Status: {tutorial.progress.status} · Surface: {tutorial.surface}</div>
      <div className={styles.devRow}>
        <UiButton type="button" size="sm" variant="dev" onClick={tutorial.back}>Prev</UiButton>
        <UiButton type="button" size="sm" variant="dev" onClick={tutorial.next}>Next</UiButton>
        <UiButton type="button" size="sm" variant="dev" onClick={tutorial.restart}>Restart</UiButton>
        <UiButton type="button" size="sm" variant="dev" onClick={tutorial.resetState}>Reset</UiButton>
      </div>
    </div>
  )
}
