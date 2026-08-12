import { useState } from 'react'
import { api } from '../../api'
import { isDevNavEnabled } from '../../config/featureFlags'
import { isDummySession } from '../../utils/sessionEligibility'
import type { Session } from '../../api'
import type { StoredAiReflection } from './types'
import styles from './SessionReflectionPanel.module.css'

type Props = {
  session: Session
  reflection?: StoredAiReflection | null
  onReflectionSaved: (reflection: StoredAiReflection) => void
  showGenerateButton?: boolean
}

function ReflectionContent({
  reflection,
  showDevMeta,
}: {
  reflection: StoredAiReflection
  showDevMeta: boolean
}) {
  const { content, usage, model, promptVersion } = reflection

  return (
    <div className={styles.content}>
      <p className={styles.summary}>{content.summary}</p>

      {content.strengths.length > 0 && (
        <section className={styles.section}>
          <h4 className={styles.sectionTitle}>✓ Gut gestützt</h4>
          <ul className={styles.list}>
            {content.strengths.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      )}

      {content.cautions.length > 0 && (
        <section className={styles.section}>
          <h4 className={styles.sectionTitle}>△ Hier vorsichtig sein</h4>
          <ul className={styles.list}>
            {content.cautions.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      )}

      {content.alternativeInterpretation && (
        <section className={styles.section}>
          <h4 className={styles.sectionTitle}>↔ Alternative Lesart</h4>
          <p className={styles.sectionBody}>{content.alternativeInterpretation}</p>
        </section>
      )}

      <section className={styles.section}>
        <h4 className={styles.sectionTitle}>◎ Beim nächsten Mal beobachten</h4>
        <p className={styles.sectionBody}>{content.nextObservationFocus}</p>
      </section>

      {content.reflectionQuestion && (
        <section className={styles.section}>
          <h4 className={styles.sectionTitle}>? Reflexionsfrage</h4>
          <p className={styles.sectionBody}>{content.reflectionQuestion}</p>
        </section>
      )}

      {showDevMeta && (
        <div className={styles.devMeta}>
          Model: {model} · Prompt: {promptVersion}
          {usage?.inputTokens != null && ` · Input: ${usage.inputTokens} Tokens`}
          {usage?.outputTokens != null && ` · Output: ${usage.outputTokens} Tokens`}
        </div>
      )}
    </div>
  )
}

export function SessionReflectionPanel({
  session,
  reflection,
  onReflectionSaved,
  showGenerateButton = true,
}: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const isDummy = isDummySession(session)
  const showDevMeta = import.meta.env.DEV || isDevNavEnabled()

  const handleGenerate = async () => {
    if (loading || reflection || isDummy) return
    setLoading(true)
    setError(null)
    try {
      const result = await api.createSessionReflection(session.id)
      onReflectionSaved(result.reflection)
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'KI-Reflexion konnte nicht erstellt werden.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className={styles.sessionReflection} aria-labelledby="rink-reflection-heading">
      <p className={styles.eyebrow}>KI-Reflexion</p>
      <h3 id="rink-reflection-heading" className="ui-section-title">
        RINK Reflection
      </h3>
      <p className={styles.intro}>
        Lass deine Beobachtungen von RINK Reflection auf innere Logik, Evidenz und mögliche blinde
        Flecken prüfen.
      </p>
      <p className={styles.disclaimer}>
        Die KI reflektiert nur die Daten dieser Session und hat das Spiel nicht gesehen.
      </p>

      {reflection ? (
        <ReflectionContent reflection={reflection} showDevMeta={showDevMeta} />
      ) : (
        <>
          {showGenerateButton && (
            <div className={styles.actions}>
              {isDummy ? (
                <span className={styles.dummyHint}>
                  DEV · KI-Reflexion deaktiviert für Dummy-Session
                </span>
              ) : (
                <button
                  type="button"
                  className={styles.primaryButton}
                  onClick={handleGenerate}
                  disabled={loading}
                >
                  🤖 KI-Reflexion erstellen
                </button>
              )}
            </div>
          )}

          {loading && (
            <p className={styles.loading} aria-live="polite">
              RINK Reflection schaut sich deine Beobachtungen an …
            </p>
          )}

          {error && (
            <div className={styles.error} role="alert">
              <p>{error}</p>
              {!isDummy && (
                <button
                  type="button"
                  className={styles.primaryButton}
                  onClick={handleGenerate}
                  disabled={loading}
                  style={{ marginTop: '0.65rem' }}
                >
                  Erneut versuchen
                </button>
              )}
            </div>
          )}
        </>
      )}
    </section>
  )
}
