import { MiniRinkPreview } from '../../components/visuals/MiniRinkPreview'
import { buildScenePoolFocusHref } from '../scenePool/focusSceneTile'
import type { JournalObservation } from './collectObservations'
import styles from './sessionJournal.module.css'

type Props = {
  observations: JournalObservation[]
  sessionId: string
}

export function JournalObservationTimeline({ observations, sessionId }: Props) {
  if (observations.length === 0) {
    return (
      <p style={{ margin: 0, color: 'rgba(186, 208, 228, 0.68)', fontSize: '0.9rem' }}>
        Keine gespeicherten Beobachtungen in den Check-ins.
      </p>
    )
  }

  return (
    <ol className={styles.timeline}>
      {observations.map((obs) => {
        const hasSceneLink = Boolean(obs.sceneId)
        const sceneLabel = [
          obs.sceneTime ? obs.sceneTime : null,
          obs.sceneCode ? obs.sceneCode : null,
        ].filter(Boolean).join(' · ')

        return (
          <li key={`${obs.id}-${obs.index}`} className={styles.timelineItem}>
            <span className={styles.timelineNum} aria-hidden="true">{obs.index}</span>
            <article className={styles.obsCard}>
              <div className={styles.obsMeta}>
                <span>{obs.collectionLabel}</span>
                {obs.drillTitle ? <span>{obs.drillTitle}</span> : null}
              </div>

              {obs.fields.length > 0 && (
                <div className={styles.fieldGrid}>
                  {obs.fields.map((field) => (
                    <div key={field.key} className={styles.fieldRow}>
                      <span className={styles.fieldLabel}>{field.label}</span>
                      <span className={styles.fieldValue}>{field.value}</span>
                    </div>
                  ))}
                </div>
              )}

              {obs.note ? <p className={styles.noteBlock}>{obs.note}</p> : null}

              {obs.spatial ? (
                <MiniRinkPreview
                  width={160}
                  height={96}
                  paint={obs.spatial.paint}
                  path={obs.spatial.path}
                  markers={obs.spatial.markers}
                  players={obs.spatial.players}
                  title={obs.spatial.label}
                />
              ) : null}

              {hasSceneLink ? (
                <div>
                  <a
                    className={styles.sceneChip}
                    href={buildScenePoolFocusHref({
                      sceneId: String(obs.sceneId),
                      sessionId,
                    })}
                  >
                    Szene{sceneLabel ? ` · ${sceneLabel}` : ''}
                  </a>
                </div>
              ) : obs.sceneUnavailable ? (
                <div>
                  <span className={styles.sceneChipMuted} title="Verknüpfte Szene ist im Szenenpool nicht mehr verfügbar">
                    Szene nicht mehr verfügbar{sceneLabel ? ` · ${sceneLabel}` : ''}
                  </span>
                </div>
              ) : sceneLabel ? (
                <div>
                  <span className={styles.sceneChipMuted} title="Keine verknüpfte Szene im Szenenpool">
                    Zeitmarke · {sceneLabel}
                  </span>
                </div>
              ) : null}
            </article>
          </li>
        )
      })}
    </ol>
  )
}
