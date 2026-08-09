import type { Session, Checkin } from '../api'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../api'
import { useMemo, useState } from 'react'
import styles from './SessionCard.module.css'
import { getObservationScopeLabel } from '../utils/observationScope'
import { getSessionRoute } from '../features/lab/sessionRouting'
import { isDummySession } from '../utils/sessionEligibility'
import {
  formatSidequestLabel,
  readSidequests,
  type SessionSidequest,
} from '../utils/sessionSidequests'
import {
  extractSpatialSnapshots,
  ObservationVisualPreview,
  type SpatialSnapshot,
} from './visuals'

interface SessionCardProps {
  session: Session
  sceneEntries?: Array<{ id: string; game_time: string; period?: string; created_at: string }>
  onDelete?: (id: string) => void
  isDeletingId?: string
}

export default function SessionCard({ session, sceneEntries = [], onDelete, isDeletingId }: SessionCardProps) {
  const queryClient = useQueryClient()
  const [isExpanded, setIsExpanded] = useState<boolean>(false)
  const [expandedPhases, setExpandedPhases] = useState<Set<number>>(new Set())
  const [isEditingSeason, setIsEditingSeason] = useState<boolean>(false)
  const [seasonDraft, setSeasonDraft] = useState<string>(session.game_info?.season || '')

  const updateSessionMutation = useMutation({
    mutationFn: (nextSeason: string) => {
      const trimmed = nextSeason.trim()
      if (!session.game_info) {
        throw new Error('Keine Spiel-Info vorhanden.')
      }
      return api.updateSession(session.id, {
        game_info: {
          ...session.game_info,
          season: trimmed || undefined,
        },
      })
    },
    onSuccess: () => {
      setIsEditingSeason(false)
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
      queryClient.invalidateQueries({ queryKey: ['session', session.id] })
    },
    onError: (err: any) => {
      alert(`Saison konnte nicht gespeichert werden: ${err?.message || err}`)
    }
  })

  const deleteCheckinMutation = useMutation({
    mutationFn: (checkinIndex: number) => api.deleteCheckin(session.id, checkinIndex),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
    },
    onError: (err: any) => {
      alert(`Fehler beim Löschen: ${err?.message || err}`)
    }
  })

  const togglePhase = (index: number) => {
    const next = new Set(expandedPhases)
    if (next.has(index)) next.delete(index)
    else next.add(index)
    setExpandedPhases(next)
  }

  const getStatusBadge = (status: string) => {
    const badges = {
      COMPLETED: {
        bg: 'rgba(34, 197, 94, 0.1)',
        border: 'rgba(34, 197, 94, 0.3)',
        text: 'rgba(134, 239, 172, 1)',
        label: 'Abgeschlossen'
      },
      ABORTED: {
        bg: 'rgba(239, 68, 68, 0.1)',
        border: 'rgba(239, 68, 68, 0.3)',
        text: 'rgba(252, 165, 165, 1)',
        label: 'Abgebrochen'
      },
      IN_PROGRESS: {
        bg: 'rgba(245, 158, 11, 0.1)',
        border: 'rgba(245, 158, 11, 0.3)',
        text: 'rgba(253, 186, 116, 1)',
        label: 'In Bearbeitung'
      },
      PRE: {
        bg: 'rgba(245, 158, 11, 0.1)',
        border: 'rgba(245, 158, 11, 0.3)',
        text: 'rgba(253, 186, 116, 1)',
        label: 'In Bearbeitung'
      },
      P1: {
        bg: 'rgba(245, 158, 11, 0.1)',
        border: 'rgba(245, 158, 11, 0.3)',
        text: 'rgba(253, 186, 116, 1)',
        label: 'In Bearbeitung'
      },
      P2: {
        bg: 'rgba(245, 158, 11, 0.1)',
        border: 'rgba(245, 158, 11, 0.3)',
        text: 'rgba(253, 186, 116, 1)',
        label: 'In Bearbeitung'
      },
      P3: {
        bg: 'rgba(245, 158, 11, 0.1)',
        border: 'rgba(245, 158, 11, 0.3)',
        text: 'rgba(253, 186, 116, 1)',
        label: 'In Bearbeitung'
      },
      POST: {
        bg: 'rgba(96, 165, 250, 0.1)',
        border: 'rgba(96, 165, 250, 0.3)',
        text: 'rgba(147, 197, 253, 1)',
        label: 'Debrief'
      }
    }
    return badges[status as keyof typeof badges] || badges.IN_PROGRESS
  }

  const getPhaseLabel = (phase: string) => {
    const labels = {
      PRE: 'Vorbereitung',
      P1: '1. Drittel',
      P2: '2. Drittel',
      P3: '3. Drittel',
      POST: 'Debrief'
    }
    return labels[phase as keyof typeof labels] || phase
  }

  const statusBadge = getStatusBadge(session.state)
  const isDummy = isDummySession(session)
  const isLabPredict = session.learning_area === 'lab' && session.lab_mode === 'predict'

  const gameDate = session.game_info?.date
    ? new Date(session.game_info.date).toLocaleDateString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })
    : null

  const title = session.game_info
    ? `${session.game_info.team_home} vs ${session.game_info.team_away}`
    : session.module_id

  const sessionSpatialSnapshots = useMemo(() => {
    const snaps: SpatialSnapshot[] = []
    for (const checkin of session.checkins || []) {
      snaps.push(...extractSpatialSnapshots(checkin.answers, 4))
      if (snaps.length >= 4) break
    }
    return snaps.slice(0, 4)
  }, [session.checkins])

  const availablePhaseDownloads = ['P1', 'P2', 'P3'].filter(phase =>
    session.checkins?.some(checkin => (checkin.phase || '').toUpperCase() === phase)
  )

  const handleDownload = async (phase?: string) => {
    try {
      const blob = await api.downloadSession(session.id, phase)
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      const datePart = new Date().toISOString().split('T')[0]
      link.download = phase
        ? `session_${session.id}_${phase}_${datePart}.json`
        : `session_${session.id}_${datePart}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (err: any) {
      alert(`Download fehlgeschlagen: ${err?.message || err}`)
    }
  }

  return (
    <div
      style={{
        backgroundColor: 'rgba(17, 24, 39, 0.6)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '16px',
        overflow: 'hidden',
        transition: 'border-color 0.2s, box-shadow 0.2s',
        cursor: 'default'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)'
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'
        e.currentTarget.style.boxShadow = 'none'
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: '1rem',
          cursor: 'pointer'
        }}
        onClick={() => setIsExpanded((v) => !v)}
      >
        <div style={{ flex: 1 }}>
        <h3
          style={{
            margin: '0 0 0.25rem 0',
            fontSize: '1.25rem',
            fontWeight: '600',
            color: 'rgba(255, 255, 255, 0.92)',
            lineHeight: '1.4',
            wordWrap: 'break-word',
            overflowWrap: 'break-word'
          }}
        >
          {title}
        </h3>

        {session.observed_team && (
          <div className={styles.observedBadge}>
            Beobachtet: {session.observed_team}
          </div>
        )}

        {isLabPredict && (
          <div className={styles.observedBadge} style={{ marginTop: '0.4rem', background: 'rgba(129,196,214,0.2)', borderColor: 'rgba(129,196,214,0.45)' }}>
            Lab · Predict
          </div>
        )}

        {sessionSpatialSnapshots.length > 0 && (
          <div style={{ marginTop: '0.65rem' }} onClick={(e) => e.stopPropagation()}>
            <ObservationVisualPreview snapshots={sessionSpatialSnapshots} max={3} size="sm" />
          </div>
        )}

          {/* Meta Grid */}
          <div className={styles.metaGrid}>
            {session.game_info?.league && (
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Liga</span>
                <span className={styles.metaValue}>{session.game_info.league.replace(/_/g, ' ')}</span>
              </div>
            )}
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>User</span>
              <span className={styles.metaValue}>{session.created_by || 'Unbekannt'}</span>
            </div>
            {session.game_info?.season && (
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Saison</span>
                <span className={styles.metaValue}>{session.game_info.season}</span>
              </div>
            )}
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Beobachtungsumfang</span>
              <span className={styles.metaValue}>{getObservationScopeLabel(session.observation_scope)}</span>
            </div>
            {isLabPredict && (
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Predictions</span>
                <span className={styles.metaValue}>{session.prediction_entries?.length || 0}</span>
              </div>
            )}
            {gameDate && (
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Spiel</span>
                <span className={styles.metaValue}>{gameDate}</span>
              </div>
            )}
            {session.game_info?.matchday && (
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Spieltag</span>
                <span className={styles.metaValue}>{session.game_info.matchday}</span>
              </div>
            )}
          </div>
        </div>

        {/* Right side */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
          {isDummy && (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '0.375rem 0.65rem',
                borderRadius: '6px',
                fontSize: '0.7rem',
                fontWeight: 700,
                letterSpacing: '0.04em',
                backgroundColor: 'rgba(245, 158, 11, 0.15)',
                border: '1px solid rgba(245, 158, 11, 0.45)',
                color: 'rgba(253, 186, 116, 1)',
              }}
              title="Dev Dummy-Session — zählt nicht in Stats"
            >
              DEV · DUMMY
            </div>
          )}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.375rem 0.75rem',
              borderRadius: '9999px',
              fontSize: '0.75rem',
              fontWeight: '500',
              backgroundColor: statusBadge.bg,
              border: `1px solid ${statusBadge.border}`,
              color: statusBadge.text
            }}
          >
            {statusBadge.label}
          </div>

          <span
            style={{
              fontSize: '1rem',
              color: 'rgba(255, 255, 255, 0.6)',
              transition: 'transform 0.2s',
              transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)'
            }}
          >
            ▼
          </span>
        </div>
      </div>

      {/* Body */}
      {isExpanded && (
        <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
          {session.state === 'IN_PROGRESS' && (
            <div
              style={{
                padding: '1rem 1.5rem',
                backgroundColor: 'rgba(245, 158, 11, 0.05)',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
              }}
            >
              <a
                href={getSessionRoute(session)}
                style={{
                  display: 'inline-block',
                  padding: '0.75rem 1.5rem',
                  backgroundColor: 'rgba(245, 158, 11, 0.2)',
                  border: '1px solid rgba(245, 158, 11, 0.4)',
                  borderRadius: '6px',
                  color: 'rgba(253, 186, 116, 1)',
                  textDecoration: 'none',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(245, 158, 11, 0.3)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(245, 158, 11, 0.2)'
                }}
              >
                🔄 Session fortsetzen {session.current_phase ? `(${getPhaseLabel(session.current_phase)})` : ''}
              </a>
            </div>
          )}

          <div
            style={{
              padding: '1rem 1.5rem',
              backgroundColor: 'rgba(15, 23, 42, 0.25)',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
            }}
          >
            <div
              style={{
                fontSize: '0.75rem',
                fontWeight: '600',
                color: 'rgba(255, 255, 255, 0.5)',
                marginBottom: '0.5rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}
            >
              Szenenpool ({sceneEntries.length})
            </div>

            <a
              href={`/ringabout?session_id=${encodeURIComponent(session.id)}`}
              style={{
                display: 'inline-block',
                marginBottom: sceneEntries.length > 0 ? '0.6rem' : 0,
                color: 'rgba(125, 211, 252, 1)',
                textDecoration: 'none',
                fontSize: '0.85rem',
                fontWeight: '600'
              }}
            >
              🎬 Alle Szenen dieser Session öffnen
            </a>

            {sceneEntries.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                {sceneEntries.map((entry) => (
                  <a
                    key={entry.id}
                    href={`/ringabout?session_id=${encodeURIComponent(session.id)}#scene-${entry.id}`}
                    style={{
                      padding: '0.25rem 0.5rem',
                      borderRadius: '9999px',
                      border: '1px solid rgba(148, 163, 184, 0.35)',
                      color: 'rgba(226, 232, 240, 0.9)',
                      textDecoration: 'none',
                      fontSize: '0.75rem',
                      fontWeight: '500'
                    }}
                  >
                    {entry.period ? `${getPhaseLabel(entry.period)} · ` : ''}{entry.game_time}
                  </a>
                ))}
              </div>
            )}
          </div>

          {session.goal && (
            <div
              style={{
                padding: '1rem 1.5rem',
                backgroundColor: 'rgba(15, 23, 42, 0.4)',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
              }}
            >
              <div
                style={{
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  color: 'rgba(255, 255, 255, 0.5)',
                  marginBottom: '0.25rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}
              >
                Ziel
              </div>
              <div style={{ fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.85)', lineHeight: '1.5' }}>
                {session.goal}
                {session.drills && session.drills.length > 0 && (
                  <div style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.6)', marginTop: '0.25rem' }}>
                    Drill: {session.drills[0].title}
                  </div>
                )}
                {isLabPredict && session.lab_template_id && (
                  <div style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.6)', marginTop: '0.25rem' }}>
                    Template: {session.lab_template_id}
                  </div>
                )}
              </div>
            </div>
          )}

          {isLabPredict && session.prediction_summary && (
            <div
              style={{
                padding: '1rem 1.5rem',
                backgroundColor: 'rgba(15, 23, 42, 0.4)',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
              }}
            >
              <div style={{ fontSize: '0.75rem', fontWeight: '600', color: 'rgba(255, 255, 255, 0.5)', marginBottom: '0.3rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Predict-Zusammenfassung
              </div>
              <div style={{ fontSize: '0.86rem', color: 'rgba(255,255,255,0.86)', display: 'grid', gap: '0.15rem' }}>
                <span>{session.prediction_summary.total} Predictions</span>
                <span>{session.prediction_summary.resolved} aufgelöst</span>
                <span>{session.prediction_summary.correct} eingetroffen</span>
                <span>{session.prediction_summary.partial} teilweise eingetroffen</span>
                <span>{session.prediction_summary.incorrect} nicht eingetroffen</span>
                <span>{session.prediction_summary.unjudgeable} nicht beurteilbar</span>
              </div>
            </div>
          )}

          {session.game_info && (
            <div
              style={{
                padding: '1rem 1.5rem',
                backgroundColor: 'rgba(15, 23, 42, 0.3)',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '0.75rem',
                  flexWrap: 'wrap',
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      color: 'rgba(255, 255, 255, 0.5)',
                      marginBottom: '0.25rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}
                  >
                    Saison bearbeiten
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.65)' }}>
                    Korrigiere hier den Saisonwert im Verlauf (z. B. 2026/27).
                  </div>
                </div>

                {!isEditingSeason ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setSeasonDraft(session.game_info?.season || '')
                      setIsEditingSeason(true)
                    }}
                    style={{
                      padding: '0.45rem 0.75rem',
                      backgroundColor: 'transparent',
                      border: '1px solid rgba(148, 163, 184, 0.4)',
                      borderRadius: '8px',
                      fontSize: '0.8rem',
                      fontWeight: '500',
                      color: 'rgba(226, 232, 240, 0.9)',
                      cursor: 'pointer'
                    }}
                  >
                    Saison ändern
                  </button>
                ) : (
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    <input
                      value={seasonDraft}
                      onChange={(e) => setSeasonDraft(e.target.value)}
                      placeholder="z. B. 2026/27"
                      maxLength={32}
                      style={{
                        minWidth: '120px',
                        padding: '0.42rem 0.6rem',
                        borderRadius: '8px',
                        border: '1px solid rgba(255,255,255,0.22)',
                        background: 'rgba(15,23,42,0.75)',
                        color: 'rgba(255,255,255,0.92)',
                        fontSize: '0.85rem'
                      }}
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        updateSessionMutation.mutate(seasonDraft)
                      }}
                      disabled={updateSessionMutation.isPending}
                      style={{
                        padding: '0.45rem 0.75rem',
                        backgroundColor: 'rgba(34, 197, 94, 0.15)',
                        border: '1px solid rgba(34, 197, 94, 0.45)',
                        borderRadius: '8px',
                        fontSize: '0.8rem',
                        fontWeight: '600',
                        color: 'rgba(187, 247, 208, 1)',
                        cursor: updateSessionMutation.isPending ? 'wait' : 'pointer'
                      }}
                    >
                      {updateSessionMutation.isPending ? 'Speichere...' : 'Speichern'}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setIsEditingSeason(false)
                        setSeasonDraft(session.game_info?.season || '')
                      }}
                      disabled={updateSessionMutation.isPending}
                      style={{
                        padding: '0.45rem 0.75rem',
                        backgroundColor: 'transparent',
                        border: '1px solid rgba(148, 163, 184, 0.4)',
                        borderRadius: '8px',
                        fontSize: '0.8rem',
                        fontWeight: '500',
                        color: 'rgba(226, 232, 240, 0.9)',
                        cursor: updateSessionMutation.isPending ? 'not-allowed' : 'pointer'
                      }}
                    >
                      Abbrechen
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Phases */}
          {session.checkins && session.checkins.length > 0 && (
            <div style={{ padding: '1.25rem 1.5rem' }}>
              <h4
                style={{
                  margin: '0 0 0.75rem 0',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: 'rgba(255, 255, 255, 0.92)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}
              >
                Phasen ({session.checkins.length})
              </h4>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {session.checkins.map((checkin: Checkin, idx: number) => {
                  const isPhaseExpanded = expandedPhases.has(idx)
                  const hasContent =
                    !!checkin.feedback ||
                    !!checkin.next_task ||
                    (checkin.answers && Object.keys(checkin.answers).length > 0)

                  return (
                    <div
                      key={idx}
                      style={{
                        backgroundColor: 'rgba(15, 23, 42, 0.4)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '12px',
                        overflow: 'hidden'
                      }}
                    >
                      <div
                        style={{
                          padding: '0.875rem 1rem',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          cursor: hasContent ? 'pointer' : 'default'
                        }}
                        onClick={(e) => {
                          e.stopPropagation()
                          if (hasContent) togglePhase(idx)
                        }}
                      >
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ fontSize: '0.875rem', fontWeight: '600', color: 'rgba(255, 255, 255, 0.92)' }}>
                              {getPhaseLabel(checkin.phase)}
                            </span>
                            {hasContent && (
                              <span style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.4)' }}>
                                {isPhaseExpanded ? '▼' : '▶'}
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.5)', marginTop: '0.25rem' }}>
                            {new Date(checkin.timestamp).toLocaleString('de-DE', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            const ok = confirm(`Phase "${getPhaseLabel(checkin.phase)}" wirklich löschen?`)
                            if (!ok) return
                            deleteCheckinMutation.mutate(idx)
                          }}
                          style={{
                            padding: '0.5rem',
                            backgroundColor: 'transparent',
                            border: 'none',
                            borderRadius: '8px',
                            color: 'rgba(255, 255, 255, 0.6)',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            fontSize: '0.875rem'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.color = 'rgba(252, 165, 165, 1)'
                            e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.color = 'rgba(255, 255, 255, 0.6)'
                            e.currentTarget.style.backgroundColor = 'transparent'
                          }}
                          disabled={deleteCheckinMutation.isPending}
                          title="Phase löschen"
                        >
                          {deleteCheckinMutation.isPending ? '...' : '🗑'}
                        </button>
                      </div>

                      {isPhaseExpanded && (
                        <div style={{ padding: '0.875rem 1rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
                          {(() => {
                            const sidequests = readSidequests(checkin.answers)
                            if (sidequests.length === 0) return null
                            return (
                              <div style={{ marginBottom: '0.75rem' }}>
                                <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.55)', marginBottom: 6 }}>
                                  Special Teams Sidequests
                                </div>
                                <div style={{ display: 'grid', gap: '0.4rem' }}>
                                  {sidequests.map((entry: SessionSidequest) => (
                                    <details
                                      key={entry.id}
                                      style={{
                                        border: '1px solid rgba(251,191,36,0.25)',
                                        borderRadius: 8,
                                        background: 'rgba(251,191,36,0.06)',
                                        padding: '0.45rem 0.6rem',
                                      }}
                                    >
                                      <summary style={{ cursor: 'pointer', color: '#fde68a', fontSize: '0.84rem', fontWeight: 600 }}>
                                        {entry.gameTime ? `${entry.gameTime} · ` : ''}
                                        {checkin.phase || entry.phase} · {formatSidequestLabel(entry)}
                                        {entry.type === 'numerical_situation_sidequest' ? ` · ${entry.perspective}` : ''}
                                      </summary>
                                      <pre
                                        style={{
                                          margin: '0.45rem 0 0',
                                          whiteSpace: 'pre-wrap',
                                          fontSize: '0.78rem',
                                          color: 'rgba(255,255,255,0.8)',
                                        }}
                                      >
                                        {JSON.stringify(entry.answers, null, 2)}
                                      </pre>
                                    </details>
                                  ))}
                                </div>
                              </div>
                            )
                          })()}
                          {checkin.answers && Object.keys(checkin.answers).length > 0 && (
                            <div style={{ marginBottom: '0.75rem' }}>
                              <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.55)', marginBottom: 6 }}>
                                Beobachtungen
                              </div>
                              <ObservationVisualPreview
                                answers={checkin.answers}
                                max={4}
                                size="md"
                                showLabels
                              />
                              <details style={{ marginTop: '0.55rem' }}>
                                <summary
                                  style={{
                                    cursor: 'pointer',
                                    fontSize: '0.75rem',
                                    color: 'rgba(255,255,255,0.55)',
                                  }}
                                >
                                  Rohdaten anzeigen
                                </summary>
                                <pre
                                  style={{
                                    margin: '0.45rem 0 0',
                                    whiteSpace: 'pre-wrap',
                                    fontSize: '0.8rem',
                                    color: 'rgba(255,255,255,0.85)',
                                    background: 'rgba(0,0,0,0.2)',
                                    border: '1px solid rgba(255,255,255,0.08)',
                                    borderRadius: 8,
                                    padding: 10
                                  }}
                                >
                                  {JSON.stringify(checkin.answers, null, 2)}
                                </pre>
                              </details>
                            </div>
                          )}
                          {/* Mini-Feedback entfernt, nur noch microfeedback aus session.microfeedback anzeigen */}
                          {/* Microfeedback aus Session (empfohlen, persistent) */}
                          {session.microfeedback && checkin.phase && session.microfeedback[checkin.phase] && session.microfeedback[checkin.phase].done && session.microfeedback[checkin.phase].text && (
                            <div style={{ marginBottom: '0.75rem' }}>
                              <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.55)', marginBottom: 6 }}>
                                Feedback zu Fragen
                              </div>
                              <div style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.9)', lineHeight: 1.5 }}>
                                {session.microfeedback[checkin.phase].text}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Bottom Actions */}
          {(onDelete || session.state === 'COMPLETED' || availablePhaseDownloads.length > 0) && (
            <div
              style={{
                padding: '1rem 1.5rem',
                borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'flex-end',
                gap: '0.75rem',
                rowGap: '0.5rem'
              }}
            >
              {availablePhaseDownloads.map(phase => (
                <button
                  key={phase}
                  onClick={() => handleDownload(phase)}
                  style={{
                    padding: '0.5rem 0.8rem',
                    backgroundColor: 'transparent',
                    border: '1px solid rgba(148, 163, 184, 0.35)',
                    borderRadius: '8px',
                    fontSize: '0.8rem',
                    fontWeight: '500',
                    color: 'rgba(226, 232, 240, 0.9)',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(148, 163, 184, 0.12)'
                    e.currentTarget.style.borderColor = 'rgba(148, 163, 184, 0.6)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent'
                    e.currentTarget.style.borderColor = 'rgba(148, 163, 184, 0.35)'
                  }}
                >
                  {phase} herunterladen
                </button>
              ))}
              {session.state === 'COMPLETED' && (
                <button
                  onClick={() => handleDownload()}
                  style={{
                    padding: '0.625rem 1rem',
                    backgroundColor: 'transparent',
                    border: '1px solid rgba(96, 165, 250, 0.4)',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: 'rgba(147, 197, 253, 1)',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(96, 165, 250, 0.1)'
                    e.currentTarget.style.borderColor = 'rgba(96, 165, 250, 0.6)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent'
                    e.currentTarget.style.borderColor = 'rgba(96, 165, 250, 0.4)'
                  }}
                >
                  JSON herunterladen
                </button>
              )}
              {onDelete && (
                <button
                  onClick={() => {
                    const ok = confirm('Diese Session wirklich löschen? Dieser Schritt kann nicht rückgängig gemacht werden.')
                    if (!ok) return
                    onDelete(session.id)
                  }}
                  style={{
                    padding: '0.625rem 1rem',
                    backgroundColor: 'transparent',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: 'rgba(255, 255, 255, 0.7)',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'
                    e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)'
                    e.currentTarget.style.color = 'rgba(252, 165, 165, 1)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent'
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)'
                    e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)'
                  }}
                  disabled={isDeletingId === session.id}
                >
                  {isDeletingId === session.id ? 'Lösche...' : 'Löschen'}
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}