import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { api } from '../api'
import type { CurriculumTrack, CurriculumModule, Session } from '../api'
import theoryData from '../data/theoryData.json'
import { getRealSessions } from '../utils/sessionEligibility'
import { MechanicGlyph, TrackProgressMap, buildDrillProgressNodes } from '../components/visuals'
import { UiButton } from '../components/ui'
import { useUser } from '../context/UserContext'
import {
  getFoundationTrack,
  isAcademyLocked,
  isFoundationTrack,
  isFoundationTrackComplete,
} from '../features/foundation/recommendations'
import { useDevNavEnabled } from '../config/featureFlags'
import { selectTutorialEntryRecommendation } from '../features/tutorial/resolveEntry'
import { TUTORIAL_TARGET, useTutorialOptional } from '../features/tutorial'
import styles from './Curriculum.module.css'

const cluster2Tracks = [
  {
    id: 'F',
    title: 'Track F - Raeumliches Situationslesen',
    description: 'Cluster 2 MVP: raeumlicher, kontextbezogener und bewusst getrennt vom Legacy-System. Einstieg in die neuen modularen Drill-Renderer mit Clickable Rink, Single Choice und Text Note.',
    clusterLabel: 'Cluster 2',
    modules: [
      {
        id: 'F',
        title: 'F - Raeumliches Situationslesen',
        summary: 'Erster Pilot fuer raeumliches Beobachten: Gefahrenraum, Kipppunkt und erste Passoption im Raum.',
        description: 'Enthaelt die drei MVP-Beispiel-Drills F1-F3 und laeuft im neuen Cluster-2-Player.',
        difficulty: 2,
        duration: 20,
        learningGoals: [
          'Gefaehrliche Raeume gezielt markieren',
          'Kipppunkte im Raum lokalisieren',
          'Erste sinnvolle Passoptionen raeumlich einordnen',
        ],
      },
    ],
  },
]

function moduleCountLabel(count: number): string {
  return count === 1 ? '1 Modul' : `${count} Module`
}

function collectCompletedDrillIds(sessions: Session[] | undefined): Set<string> {
  const completed = new Set<string>()
  for (const session of getRealSessions(sessions || [])) {
    if (String(session.state || '').toUpperCase() !== 'COMPLETED') continue
    for (const drill of session.drills || []) {
      if (drill?.id) completed.add(drill.id)
    }
    if (session.drill_id) completed.add(session.drill_id)
    // Fallback: module-level completion marks first drill when drills[] missing
    if ((!session.drills || session.drills.length === 0) && session.module_id) {
      completed.add(session.module_id)
    }
  }
  return completed
}

export default function Curriculum() {
  const navigate = useNavigate()
  const { user } = useUser()
  const tutorial = useTutorialOptional()
  const devMode = useDevNavEnabled()
  const { data: curriculum, isLoading, error } = useQuery({
    queryKey: ['curriculum'],
    queryFn: () => api.getCurriculum()
  })
  const { data: sessions } = useQuery({
    queryKey: ['sessions'],
    queryFn: () => api.getSessions(),
  })
  const { data: account } = useQuery({
    queryKey: ['me', user],
    queryFn: () => api.getMe(),
    enabled: Boolean(user),
  })

  const completedDrillIds = useMemo(() => collectCompletedDrillIds(sessions), [sessions])
  const foundationTrack = getFoundationTrack(curriculum)
  const foundationDone = isFoundationTrackComplete(curriculum, completedDrillIds)
  const tutorialEntry = useMemo(
    () => selectTutorialEntryRecommendation({
      curriculum,
      completedDrillIds,
      hockeyExperience: account?.profile?.hockeyExperience,
    }),
    [curriculum, completedDrillIds, account?.profile?.hockeyExperience],
  )
  const entryModuleId = tutorial?.active
    ? tutorial.entryModuleId || tutorialEntry?.moduleId
    : tutorialEntry?.moduleId
  const entryTrackId = tutorialEntry?.trackId
  const hasUsedAcademy = getRealSessions(sessions || []).some((session) => {
    const moduleId = String(session.module_id || '')
    return moduleId && moduleId !== 'T0' && !moduleId.startsWith('T0')
  })
  const academyLocked = isAcademyLocked(curriculum, completedDrillIds, {
    devMode,
    hasUsedAcademy,
    completedModuleIds: getRealSessions(sessions || [])
      .filter((session) => String(session.state || '').toUpperCase() === 'COMPLETED')
      .map((session) => String(session.module_id || ''))
      .filter(Boolean),
  })

  if (isLoading) return <div className="card">Lade Lehrplan...</div>
  if (error) return <div className="card">Fehler beim Laden: {(error as Error).message}</div>

  const orderedTracks = [...(curriculum?.tracks || [])].sort((a, b) => {
    const aF = isFoundationTrack(a) ? 0 : 1
    const bF = isFoundationTrack(b) ? 0 : 1
    return aF - bF
  })

  return (
    <div className={styles.page}>
      <header className="ui-page-header" data-tutorial-id={TUTORIAL_TARGET.academyTitle}>
        <h1 className="ui-page-title">Lehrplan</h1>
        <p className="ui-page-lead">Tracks antippen, um Module und Details auszuklappen.</p>
      </header>

      <div className={styles.trackList}>
      {orderedTracks.map((track: CurriculumTrack) => {
        const activeModules = (track.modules || []).filter((module: CurriculumModule) => module.active !== false)
        if (activeModules.length === 0) return null
        const foundation = isFoundationTrack(track)
        const isEntryTrack = track.id === entryTrackId
        return (
        <details
          key={track.id}
          className={`${styles.track} ${foundation ? styles.trackFoundation : ''}`}
          open={
            (foundation && track === foundationTrack && !foundationDone)
            || (tutorial?.active && isEntryTrack)
            || undefined
          }
        >
          <summary className={styles.trackSummary}>
            <div className={styles.trackSummaryMain}>
              {foundation && (
                <div className={styles.foundationLabel}>
                  {track.foundationLabel || 'FOUNDATION · TRACK 0'}
                </div>
              )}
              <h2
                className={styles.trackTitle}
                {...(isEntryTrack ? { 'data-tutorial-id': TUTORIAL_TARGET.academyEntryTrack } : {})}
              >
                {track.title}
              </h2>
            </div>
            <div className={styles.trackMeta}>
              <span>{moduleCountLabel(activeModules.length)}</span>
              <span className={styles.chevron} aria-hidden="true" />
            </div>
          </summary>

          <div className={styles.trackBody}>
            {track.description && (
              <p className={styles.trackDescription}>{track.description}</p>
            )}

            <div className={styles.moduleGrid}>
              {activeModules.map((module: CurriculumModule) => {
                const drills = module.drills || []
                const progressNodes = buildDrillProgressNodes(
                  drills.map((d) => ({ id: d.id, title: d.title })),
                  { completedIds: completedDrillIds },
                )
                return (
                <div key={module.id} className={styles.moduleCard}>
                  <div className={styles.moduleTop}>
                    <h3 className={styles.moduleTitle}>{module.title}</h3>
                    <div className={styles.moduleActions}>
                      <UiButton
                        type="button"
                        size={module.id === entryModuleId && tutorial?.active ? 'md' : 'sm'}
                        onClick={() => navigate(`/setup/${module.id}`)}
                        disabled={academyLocked && !foundation}
                        {...(module.id === entryModuleId ? { 'data-tutorial-id': TUTORIAL_TARGET.academyEntryStart } : {})}
                      >
                        {academyLocked && !foundation ? 'Zuerst Track 0' : 'Starten'}
                      </UiButton>
                      {module.id in theoryData && (
                        <UiButton type="button" size="sm" variant="ghost" onClick={() => navigate(`/theory/${module.id}`)}>
                          Theorie lesen
                        </UiButton>
                      )}
                    </div>
                  </div>
                  <p className={styles.moduleText}>{module.summary}</p>
                  {module.description && (
                    <p className={styles.moduleMuted}>{module.description}</p>
                  )}
                  {progressNodes.length > 0 && (
                    <div className={styles.moduleProgress}>
                      <TrackProgressMap nodes={progressNodes} compact />
                      <div className={styles.moduleMechanics}>
                        {drills.slice(0, 5).map((drill) => (
                          <MechanicGlyph
                            key={drill.id}
                            drillType={drill.drill_type}
                            mode={drill.config?.mode}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                  {module.learningGoals && module.learningGoals.length > 0 && (
                    <div className={styles.learningGoals}>
                      <strong>Lernziele:</strong>
                      <ul>
                        {module.learningGoals.map((goal, i) => (
                          <li key={i}>{goal}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <div className={styles.moduleStats}>
                    Schwierigkeit: {module.difficulty || 1} | Dauer: {module.duration || 45} Min
                  </div>
                </div>
                )
              })}
            </div>
          </div>
        </details>
        )
      })}

      {cluster2Tracks.map((track) => (
        <details key={track.id} className={`${styles.track} ${styles.trackCluster}`}>
          <summary className={styles.trackSummary}>
            <div className={styles.trackSummaryMain}>
              <div className={styles.clusterLabel}>{track.clusterLabel}</div>
              <h2 className={styles.trackTitle}>{track.title}</h2>
            </div>
            <div className={styles.trackMeta}>
              <span>{moduleCountLabel(track.modules.length)}</span>
              <span className={styles.chevron} aria-hidden="true" />
            </div>
          </summary>

          <div className={styles.trackBody}>
            <p className={styles.trackDescription}>{track.description}</p>

            <div className={styles.moduleGrid}>
              {track.modules.map((module) => (
                <div key={module.id} className={`${styles.moduleCard} ${styles.moduleCardCluster}`}>
                  <div className={styles.moduleTop}>
                    <h3 className={styles.moduleTitle}>{module.title}</h3>
                    <div className={styles.moduleActions}>
                      <UiButton
                        type="button"
                        size="sm"
                        onClick={() => navigate('/cluster2/f')}
                        disabled={academyLocked}
                      >
                        {academyLocked ? 'Zuerst Track 0' : 'Starten'}
                      </UiButton>
                    </div>
                  </div>
                  <p className={styles.moduleText}>{module.summary}</p>
                  {module.description && (
                    <p className={styles.moduleMuted}>{module.description}</p>
                  )}
                  {module.learningGoals && module.learningGoals.length > 0 && (
                    <div className={styles.learningGoals}>
                      <strong>Lernziele:</strong>
                      <ul>
                        {module.learningGoals.map((goal, i) => (
                          <li key={i}>{goal}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <div className={styles.moduleStats}>
                    Schwierigkeit: {module.difficulty || 1} | Dauer: {module.duration || 20} Min
                  </div>
                </div>
              ))}
            </div>
          </div>
        </details>
      ))}
      </div>
    </div>
  )
}
