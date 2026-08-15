import { useNavigate } from 'react-router-dom'
import { useTutorial } from '../TutorialProvider'
import { TutorialCoachmark } from './TutorialCoachmark'
import { TutorialDevPanel } from './TutorialDevPanel'
import { TutorialDialog } from './TutorialDialog'
import { TutorialSpotlight } from './TutorialSpotlight'
import styles from './tutorial.module.css'

export function TutorialHost() {
  const tutorial = useTutorial()
  const navigate = useNavigate()

  if (tutorial.surface === 'welcome') {
    return (
      <>
        <TutorialDialog
          kicker="RINK Tank"
          title="Willkommen bei RINK Tank"
          body="RINK Tank hilft dir dabei, Hockey bewusster zu beobachten und Schritt für Schritt besser zu verstehen."
          primaryLabel="Tutorial starten"
          onPrimary={tutorial.start}
          secondaryLabel="Später"
          onSecondary={tutorial.later}
        />
        <TutorialDevPanel />
      </>
    )
  }

  if (tutorial.surface === 'resume') {
    return (
      <>
        <TutorialDialog
          title="Tutorial fortsetzen"
          body="Du kannst genau dort weitermachen, wo du aufgehört hast."
          primaryLabel="Tutorial fortsetzen"
          onPrimary={tutorial.resume}
          secondaryLabel="Später"
          onSecondary={tutorial.later}
          quietLabel="Neu beginnen"
          onQuiet={tutorial.restart}
        />
        <TutorialDevPanel />
      </>
    )
  }

  if (tutorial.surface === 'end-confirm') {
    return (
      <>
        <TutorialDialog
          title="Tutorial beenden?"
          body="Du kannst das Tutorial jederzeit im Profil erneut starten."
          primaryLabel="Beenden"
          onPrimary={tutorial.confirmEnd}
          secondaryLabel="Zurück zum Tutorial"
          onSecondary={tutorial.cancelEnd}
        />
        <TutorialDevPanel />
      </>
    )
  }

  if (tutorial.surface === 'complete') {
    return (
      <>
        <TutorialDialog
          title="Du bist startklar"
          body="Du weißt jetzt, wie du einen Drill findest, eine Session startest und deine Ergebnisse später wieder aufrufst."
          primaryLabel={tutorial.entryModuleId ? 'Meine erste Session starten' : 'Weiterlernen'}
          onPrimary={() => {
            tutorial.complete()
            navigate(tutorial.entryModuleId ? `/setup/${tutorial.entryModuleId}` : '/curriculum')
          }}
          secondaryLabel="Weiterlernen"
          onSecondary={() => {
            tutorial.complete()
            navigate('/curriculum')
          }}
        >
          <ul className={styles.checklist}>
            <li>✓ Akademie gefunden</li>
            <li>✓ Session verstanden</li>
            <li>✓ Verlauf kennengelernt</li>
            <li>✓ Locker entdeckt</li>
          </ul>
        </TutorialDialog>
        <TutorialDevPanel />
      </>
    )
  }

  if (tutorial.surface === 'active' && tutorial.currentStep) {
    const step = tutorial.currentStep
    const showSpotlight = step.placement !== 'center'
    return (
      <>
        {showSpotlight ? (
          <TutorialSpotlight
            targetId={step.targetId}
            allowPageInteraction={Boolean(step.allowPageInteraction)}
          />
        ) : (
          <TutorialSpotlight allowPageInteraction={Boolean(step.allowPageInteraction)} />
        )}
        <TutorialCoachmark
          step={step}
          index={tutorial.currentIndex}
          total={tutorial.stepCount}
          targetMissing={tutorial.targetMissing}
          allowPageInteraction={Boolean(step.allowPageInteraction)}
          onNext={tutorial.next}
          onBack={tutorial.back}
          onEnd={tutorial.requestEnd}
        />
        <TutorialDevPanel />
      </>
    )
  }

  return <TutorialDevPanel />
}
