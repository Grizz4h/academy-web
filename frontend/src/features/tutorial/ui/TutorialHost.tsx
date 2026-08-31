import { useState } from 'react'
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
  const [hideWelcome, setHideWelcome] = useState(false)

  if (tutorial.surface === 'welcome') {
    return (
      <>
        <TutorialDialog
          size="welcome"
          kicker="rInQ Tank"
          title="Willkommen bei rInQ Tank"
          body="Dein Trainingsraum für bewusste Spielbeobachtung — nicht für Tippspiele, nicht für Highlight-Clips."
          primaryLabel="Tutorial starten"
          onPrimary={tutorial.start}
          secondaryLabel={hideWelcome ? 'Schließen' : 'Später'}
          onSecondary={hideWelcome ? tutorial.dismiss : tutorial.later}
        >
          <div className={styles.welcomeSections}>
            <section className={styles.welcomeSection}>
              <h3 className={styles.welcomeHeading}>Was ist rInQ Tank?</h3>
              <p className={styles.welcomeText}>
                Eine digitale Lernplattform für Eishockeywissen, Spielbeobachtung und taktisches
                Verständnis. Du trainierst am echten Spiel: Drills, Sessions und kurze Reflexionen.
              </p>
            </section>
            <section className={styles.welcomeSection}>
              <h3 className={styles.welcomeHeading}>Was ist das Ziel?</h3>
              <p className={styles.welcomeText}>
                Du lernst, Muster auf dem Eis zu erkennen, Entscheidungen besser einzuordnen und dein
                Auge Schritt für Schritt zu schärfen — von Foundation bis zu fortgeschrittenen Tracks.
              </p>
            </section>
            <section className={styles.welcomeSection}>
              <h3 className={styles.welcomeHeading}>So wendest du es an</h3>
              <ol className={styles.welcomeSteps}>
                <li>
                  <strong>Akademie</strong> — Track und Drill wählen
                </li>
                <li>
                  <strong>Session</strong> — live oder nach dem Spiel beobachten und Antworten setzen
                </li>
                <li>
                  <strong>Verlauf & Spind</strong> — Fortschritt, Belohnungen und nächste Schritte sehen
                </li>
              </ol>
            </section>
          </div>
          <label className={styles.dismissChoice}>
            <input
              type="checkbox"
              checked={hideWelcome}
              onChange={(event) => setHideWelcome(event.target.checked)}
            />
            <span>Nicht mehr anzeigen</span>
          </label>
        </TutorialDialog>
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
            <li>✓ Spind entdeckt</li>
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
