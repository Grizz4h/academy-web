import type { Session, Checkin } from '../api'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../api'
import { useState } from 'react'

interface SessionCardProps {
  session: Session
  onDelete?: (id: string) => void
  isDeletingId?: string
}

export default function SessionCard({ session, onDelete, isDeletingId }: SessionCardProps) {
  const queryClient = useQueryClient()
  const [isExpanded, setIsExpanded] = useState<boolean>(false)
  const [expandedPhases, setExpandedPhases] = useState<Set<number>>(new Set())

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
          <div
            style={{
              margin: '0 0 0.5rem 0',
              fontSize: '0.95rem',
              color: '#5191a2',
              background: 'rgba(81,145,162,0.08)',
              borderRadius: '6px',
              padding: '0.15em 0.5em',
              display: 'inline-block'
            }}
          >
            Beobachtet: {session.observed_team}
          </div>
        )}
         

          {/* Meta */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '1rem',
              fontSize: '0.75rem',
              color: 'rgba(255, 255, 255, 0.6)'
            }}
          >
            <span>{session.created_by || 'Unbekannt'}</span>
            <span>•</span>
            <span>{new Date(session.created_at).toLocaleDateString('de-DE')}</span>

            {gameDate && (
              <>
                <span>•</span>
                <span>Spiel: {gameDate}</span>
              </>
            )}

            {session.checkins && session.checkins.length > 0 && (
              <>
                <span>•</span>
                <span>
                  {session.checkins.length} Phase{session.checkins.length !== 1 ? 'n' : ''}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Right side */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
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
                href={`/session/${session.id}`}
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
                          {checkin.answers && Object.keys(checkin.answers).length > 0 && (
                            <div style={{ marginBottom: '0.75rem' }}>
                              <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.55)', marginBottom: 6 }}>
                                Antworten
                              </div>
                              <pre
                                style={{
                                  margin: 0,
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
                            </div>
                          )}
                          {/* Mini-Feedback aus Checkin (legacy, falls vorhanden) */}
                          {checkin.mini_feedback && (
                            <div style={{ marginBottom: '0.75rem' }}>
                              <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.55)', marginBottom: 6 }}>
                                Mini-Feedback
                              </div>
                              <div style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.9)', lineHeight: 1.5 }}>
                                {checkin.mini_feedback}
                              </div>
                            </div>
                          )}
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
          {onDelete && (
            <div
              style={{
                padding: '1rem 1.5rem',
                borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '0.75rem'
              }}
            >
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
            </div>
          )}
        </div>
      )}
    </div>
  );
}