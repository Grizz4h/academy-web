import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { api, type Session } from '../../api'
import { UiButton } from '../../components/ui'
import { RinQIcon } from '../../components/icons'
import { SceneMarkerButton } from '../../components/SceneMarkerButton'
import { SessionReflectionPanel } from '../reflection/SessionReflectionPanel'
import { useCreatorMode } from '../creator'
import { getSessionRoute } from '../lab/sessionRouting'
import { collectSessionObservations } from './collectObservations'
import { JournalMatchHeader } from './JournalMatchHeader'
import { JournalObservationTimeline } from './JournalObservationTimeline'
import { buildScenePoolFocusHref } from '../scenePool/focusSceneTile'
import {
  formatJournalDate,
  getPhaseLabel,
  getSessionScopeLabel,
  type JournalSceneEntry,
} from './sessionMeta'
import styles from './sessionJournal.module.css'

type Props = {
  session: Session
  sceneEntries?: JournalSceneEntry[]
  onDelete?: (id: string) => void
  isDeleting?: boolean
  onBack?: () => void
}

export function JournalSessionDetail({
  session,
  sceneEntries = [],
  onDelete,
  isDeleting = false,
  onBack,
}: Props) {
  const queryClient = useQueryClient()
  const creatorMode = useCreatorMode()
  const [isEditingSeason, setIsEditingSeason] = useState(false)
  const [seasonDraft, setSeasonDraft] = useState(session.game_info?.season || '')
  const [showRaw, setShowRaw] = useState(false)

  const observations = collectSessionObservations(session, sceneEntries)

  const updateSessionMutation = useMutation({
    mutationFn: (nextSeason: string) => {
      if (!session.game_info) throw new Error('Keine Spiel-Info vorhanden.')
      return api.updateSession(session.id, {
        game_info: {
          ...session.game_info,
          season: nextSeason.trim() || undefined,
        },
      })
    },
    onSuccess: () => {
      setIsEditingSeason(false)
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
      queryClient.invalidateQueries({ queryKey: ['session', session.id] })
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : String(err)
      alert(`Saison konnte nicht gespeichert werden: ${message}`)
    },
  })

  const handleDownload = async () => {
    try {
      const blob = await api.downloadSession(session.id)
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      const datePart = new Date().toISOString().split('T')[0]
      link.download = `session_${session.id}_${datePart}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      alert(`Download fehlgeschlagen: ${message}`)
    }
  }

  const isLabPredict = session.learning_area === 'lab' && session.lab_mode === 'predict'
  const createdLabel = formatJournalDate(session.created_at)

  return (
    <div className={styles.detail}>
      {onBack ? (
        <div className={styles.section} style={{ paddingBottom: '0.35rem' }}>
          <UiButton type="button" variant="ghost" size="sm" className={styles.mobileBack} onClick={onBack}>
            ← Zurück zur Liste
          </UiButton>
        </div>
      ) : null}

      <JournalMatchHeader session={session} />

      {session.state === 'IN_PROGRESS' && (
        <div className={styles.section}>
          <a className={styles.continueLink} href={getSessionRoute(session)}>
            <RinQIcon name="continue" size="sm" inline />
            Session fortsetzen
            {session.current_phase ? ` (${getPhaseLabel(session.current_phase)})` : ''}
          </a>
        </div>
      )}

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>
          Beobachtungen ({observations.length})
        </h3>
        <JournalObservationTimeline observations={observations} sessionId={session.id} />
      </section>

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>
          Szenenpool ({sceneEntries.length})
        </h3>
        <p style={{ margin: '0 0 0.55rem', fontSize: '0.82rem', color: 'rgba(186, 208, 228, 0.68)' }}>
          Vorgemerkte Zeitpunkte aus dem Originalspiel — keine Videoclips.
        </p>
        <a
          className={styles.sceneLink}
          href={`/ringabout?session_id=${encodeURIComponent(session.id)}`}
        >
          <RinQIcon name="scene" size="sm" inline />
          Alle Szenen dieser Session öffnen
        </a>
        {session.state === 'COMPLETED' && creatorMode ? (
          <div style={{ margin: '0.55rem 0 0.75rem' }}>
            <SceneMarkerButton
              session={session}
              currentPhase="P1"
              activeDrill={session.drill_id ? {
                id: session.drill_id,
                title: session.drills?.find((drill) => drill.id === session.drill_id)?.title
                  || session.drills?.[0]?.title
                  || session.drill_id,
              } as any : null}
              phaseEditable
            />
          </div>
        ) : null}
        {sceneEntries.length > 0 ? (
          <div className={styles.scenePool}>
            {sceneEntries.map((entry) => (
              <a
                key={entry.id}
                className={styles.sceneChip}
                href={buildScenePoolFocusHref({
                  sceneId: entry.id,
                  sessionId: session.id,
                })}
              >
                {entry.game_time}
                {entry.scene_code ? ` · ${entry.scene_code}` : ''}
                {entry.observation_label ? ` · ${entry.observation_label}` : ''}
              </a>
            ))}
          </div>
        ) : (
          <p style={{ margin: 0, fontSize: '0.85rem', color: 'rgba(186, 208, 228, 0.55)' }}>
            Keine gemerkten Szenen für diese Session.
          </p>
        )}
      </section>

      {(['P1', 'P2', 'P3'] as const).some((phase) => session.microfeedback?.[phase]?.done && session.microfeedback[phase]?.text) ? (
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Microfeedback</h3>
          <div className={styles.fieldGrid}>
            {(['P1', 'P2', 'P3'] as const).map((phase) => {
              const slot = session.microfeedback?.[phase]
              if (!slot?.done || !slot.text) return null
              return (
                <div key={phase} className={styles.fieldRow}>
                  <span className={styles.fieldLabel}>{getPhaseLabel(phase)}</span>
                  <p className={styles.noteBlock}>{slot.text}</p>
                </div>
              )
            })}
          </div>
        </section>
      ) : null}

      {session.ai_reflection ? (
        <section className={`${styles.section} ${styles.reflectionWrap}`}>
          <details>
            <summary className={styles.reflectionSummary}>
              KI-Reflexion · tippen zum Öffnen
            </summary>
            <div style={{ marginTop: '0.75rem' }}>
              <SessionReflectionPanel
                session={session}
                reflection={session.ai_reflection}
                showGenerateButton={false}
                onReflectionSaved={() => {
                  queryClient.invalidateQueries({ queryKey: ['sessions'] })
                }}
              />
            </div>
          </details>
        </section>
      ) : null}

      {session.goal || isLabPredict ? (
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Kontext</h3>
          {session.goal ? (
            <p style={{ margin: '0 0 0.55rem', fontSize: '0.9rem', lineHeight: 1.45 }}>
              {session.goal}
            </p>
          ) : null}
          {isLabPredict && session.prediction_summary ? (
            <div className={styles.metaGrid}>
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Predictions</span>
                <span className={styles.metaValue}>{session.prediction_summary.total}</span>
              </div>
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Aufgelöst</span>
                <span className={styles.metaValue}>{session.prediction_summary.resolved}</span>
              </div>
            </div>
          ) : null}
        </section>
      ) : null}

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Metadaten</h3>
        <div className={styles.metaGrid}>
          {session.game_info?.league ? (
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Liga</span>
              <span className={styles.metaValue}>{session.game_info.league.replace(/_/g, ' ')}</span>
            </div>
          ) : null}
          {session.game_info?.season ? (
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Saison</span>
              <span className={styles.metaValue}>{session.game_info.season}</span>
            </div>
          ) : null}
          {session.game_info?.matchday ? (
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Spieltag</span>
              <span className={styles.metaValue}>{session.game_info.matchday}</span>
            </div>
          ) : null}
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>Beobachtungsumfang</span>
            <span className={styles.metaValue}>{getSessionScopeLabel(session)}</span>
          </div>
          {createdLabel ? (
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Session erstellt</span>
              <span className={styles.metaValue}>{createdLabel}</span>
            </div>
          ) : null}
          {session.abort?.reason ? (
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Abbruch</span>
              <span className={styles.metaValue}>{session.abort.reason}</span>
            </div>
          ) : null}
        </div>

        {session.game_info ? (
          <div style={{ marginTop: '0.85rem' }}>
            {!isEditingSeason ? (
              <UiButton
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSeasonDraft(session.game_info?.season || '')
                  setIsEditingSeason(true)
                }}
              >
                Saison ändern
              </UiButton>
            ) : (
              <div className={styles.actions}>
                <input
                  value={seasonDraft}
                  onChange={(e) => setSeasonDraft(e.target.value)}
                  placeholder="z. B. 2026/27"
                  maxLength={32}
                  className="appSelect"
                  style={{ minWidth: 120 }}
                />
                <UiButton
                  type="button"
                  variant="primary"
                  size="sm"
                  disabled={updateSessionMutation.isPending}
                  onClick={() => updateSessionMutation.mutate(seasonDraft)}
                >
                  {updateSessionMutation.isPending ? 'Speichere…' : 'Speichern'}
                </UiButton>
                <UiButton
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={updateSessionMutation.isPending}
                  onClick={() => {
                    setIsEditingSeason(false)
                    setSeasonDraft(session.game_info?.season || '')
                  }}
                >
                  Abbrechen
                </UiButton>
              </div>
            )}
          </div>
        ) : null}
      </section>

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Aktionen</h3>
        <div className={styles.actions}>
          <UiButton type="button" variant="secondary" size="sm" onClick={() => void handleDownload()}>
            Session JSON
          </UiButton>
        </div>

        <details className={styles.rawDetails} open={showRaw} onToggle={(e) => setShowRaw((e.target as HTMLDetailsElement).open)}>
          <summary>Technische Diagnose · Rohdaten</summary>
          <pre className={styles.rawPre}>{JSON.stringify({
            checkins: session.checkins,
            microfeedback: session.microfeedback,
            post: session.post,
            abort: session.abort,
          }, null, 2)}</pre>
        </details>
      </section>

      {onDelete ? (
        <div className={styles.deleteFooter}>
          <UiButton
            type="button"
            variant="danger"
            size="sm"
            disabled={isDeleting}
            onClick={() => {
              if (!window.confirm('Session wirklich löschen?')) return
              onDelete(session.id)
            }}
          >
            {isDeleting ? 'Lösche…' : 'Löschen'}
          </UiButton>
        </div>
      ) : null}
    </div>
  )
}
