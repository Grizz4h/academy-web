import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { api } from '../api'
import type { CurriculumTrack, CurriculumModule, Session } from '../api'
import theoryData from '../data/theoryData.json'
import { getLastActivityTrackId } from '../utils/curriculumActivity'
import { getRealSessions } from '../utils/sessionEligibility'
import Card from '../components/Card'
import { useUser } from '../context/UserContext'
import { isModulePremiumLocked } from '../features/entitlements'
import PremiumCheckoutSheet from '../components/billing/PremiumCheckoutSheet'
import {
  getFoundationTrack,
  isAcademyLocked,
  isFoundationTrack,
  isFoundationTrackComplete,
} from '../features/foundation/recommendations'
import { useDevNavEnabled } from '../config/featureFlags'
import { selectTutorialEntryRecommendation } from '../features/tutorial/resolveEntry'
import { TUTORIAL_TARGET, useTutorialOptional } from '../features/tutorial'
import PendingGameSetupSheet from '../features/schedule/PendingGameSetupBanner'
import { clearGameSetupPrefill } from '../features/schedule/gameSetupPrefill'
import { usePendingGameSetupFocus } from '../features/schedule/usePendingGameSetupFocus'
import { CurriculumModuleCard } from './CurriculumModuleCard'
import { CurriculumTrackPanel } from './CurriculumTrackPanel'
import styles from './Curriculum.module.css'

const CLUSTER2_CURRICULUM_TRACK_IDS = new Set(['M'])

const cluster2PilotTracks = [
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

/** Keep letter prefix + dash from orphaning ("A" alone on a line). */
function displayTrackTitle(title: string): string {
  return String(title || '')
    .replace(/^([A-Za-z0-9]+)\s*[–—-]\s+/u, '$1\u00A0– ')
    .replace(/\s+&\s+/g, ' &\u00A0')
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
  const { user, userId } = useUser()
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const tutorial = useTutorialOptional()
  const devMode = useDevNavEnabled()
  const { data: curriculum, isLoading, error } = useQuery({
    queryKey: ['curriculum', userId],
    queryFn: () => api.getCurriculum()
  })
  const { data: sessions, isFetched: sessionsFetched } = useQuery({
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
    hockeyExperience: account?.profile?.hockeyExperience,
  })
  const { prefill, focus, refreshPrefill } = usePendingGameSetupFocus({
    curriculum,
    sessions,
    hockeyExperience: account?.profile?.hockeyExperience,
    devMode,
    tutorialActive: Boolean(tutorial?.active),
  })
  const [pairingConfirmed, setPairingConfirmed] = useState(false)
  const showPairingSheet = Boolean(prefill) && !pairingConfirmed
  const lastActivityTrackId = useMemo(
    () => getLastActivityTrackId(sessions, curriculum),
    [sessions, curriculum],
  )
  const defaultOpenTrackId = useMemo(() => {
    if (prefill && pairingConfirmed && focus?.trackId) return focus.trackId
    if (!sessionsFetched) return null
    if (tutorial?.active && entryTrackId) return entryTrackId
    if (lastActivityTrackId) return lastActivityTrackId
    if (foundationTrack && !foundationDone) return foundationTrack.id
    return null
  }, [
    prefill,
    pairingConfirmed,
    focus?.trackId,
    sessionsFetched,
    tutorial?.active,
    entryTrackId,
    lastActivityTrackId,
    foundationTrack,
    foundationDone,
  ])
  const [openOverride, setOpenOverride] = useState<Record<string, boolean> | null>(null)
  const trackIsOpen = (trackId: string) => (
    openOverride && Object.prototype.hasOwnProperty.call(openOverride, trackId)
      ? openOverride[trackId]
      : defaultOpenTrackId === trackId
  )
  const toggleTrack = (trackId: string) => {
    setOpenOverride((prev) => {
      const wasOpen = prev && Object.prototype.hasOwnProperty.call(prev, trackId)
        ? prev[trackId]
        : defaultOpenTrackId === trackId
      return {
        ...(prev ?? (defaultOpenTrackId ? { [defaultOpenTrackId]: true } : {})),
        [trackId]: !wasOpen,
      }
    })
  }

  useEffect(() => {
    if (!prefill) {
      setPairingConfirmed(false)
    }
  }, [prefill])

  useEffect(() => {
    if (!prefill || !pairingConfirmed || !focus?.moduleId) return
    const timer = window.setTimeout(() => {
      document.getElementById(`curriculum-module-${focus.moduleId}`)
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 180)
    return () => window.clearTimeout(timer)
  }, [prefill, pairingConfirmed, focus?.moduleId])

  const handleConfirmPairing = () => {
    setPairingConfirmed(true)
    if (focus?.trackId) {
      setOpenOverride((prev) => ({
        ...(prev ?? {}),
        [focus.trackId]: true,
      }))
    }
  }

  const handleDismissPairing = () => {
    clearGameSetupPrefill()
    setPairingConfirmed(false)
    refreshPrefill()
  }

  if (isLoading) {
    return (
      <div className={`${styles.page} ui-page-shell`}>
        <Card surface="section">Lade Lehrplan…</Card>
      </div>
    )
  }
  if (error) {
    return (
      <div className={`${styles.page} ui-page-shell`}>
        <Card surface="section">Fehler beim Laden: {(error as Error).message}</Card>
      </div>
    )
  }

  const orderedTracks = [...(curriculum?.tracks || [])]
    .filter((track) => !CLUSTER2_CURRICULUM_TRACK_IDS.has(track.id))
    .sort((a, b) => {
      const aF = isFoundationTrack(a) ? 0 : 1
      const bF = isFoundationTrack(b) ? 0 : 1
      return aF - bF
    })

  const cluster2CurriculumTracks = (curriculum?.tracks || []).filter((track) =>
    CLUSTER2_CURRICULUM_TRACK_IDS.has(track.id),
  )

  const renderModuleCard = (
    module: CurriculumModule,
    trackFoundation: boolean,
    cluster = false,
  ) => {
    const premiumLocked = isModulePremiumLocked(module)
    const startBlocked = (academyLocked && !trackFoundation) || premiumLocked
    const startLabel = premiumLocked
      ? 'Premium'
      : academyLocked && !trackFoundation
        ? 'Zuerst Track 0'
        : 'Starten'
    const highlightPendingGame = Boolean(prefill && pairingConfirmed && focus?.moduleId === module.id)
    return (
      <CurriculumModuleCard
        key={module.id}
        id={`curriculum-module-${module.id}`}
        module={module}
        premiumLocked={premiumLocked}
        startBlocked={startBlocked}
        startLabel={startLabel}
        highlightStart={module.id === entryModuleId && Boolean(tutorial?.active)}
        highlightPendingGame={highlightPendingGame}
        isEntryModule={module.id === entryModuleId}
        cluster={cluster}
        showTheory={module.id in theoryData}
        showPremiumCheckout={premiumLocked && Boolean(user)}
        completedDrillIds={completedDrillIds}
        onStart={() => navigate(`/setup/${module.id}`)}
        onTheory={() => navigate(`/theory/${module.id}`)}
        onCheckout={() => setCheckoutOpen(true)}
      />
    )
  }

  return (
    <div className={`${styles.page} ui-page-shell`}>
      <header className="ui-page-header" data-tutorial-id={TUTORIAL_TARGET.academyTitle}>
        <h1 className="ui-page-title">Lehrplan</h1>
        <p className="ui-page-lead">Tracks antippen, um Module und Details auszuklappen.</p>
      </header>

      {prefill ? (
        <PendingGameSetupSheet
          open={showPairingSheet}
          prefill={prefill}
          focusLead={focus?.nextStepLead}
          onConfirm={handleConfirmPairing}
          onDismiss={handleDismissPairing}
        />
      ) : null}

      <div className={styles.trackList}>
      {orderedTracks.map((track: CurriculumTrack) => {
        const activeModules = (track.modules || []).filter((module: CurriculumModule) => module.active !== false)
        if (activeModules.length === 0) return null
        const foundation = isFoundationTrack(track)
        const isEntryTrack = track.id === entryTrackId
        return (
        <CurriculumTrackPanel
          key={track.id}
          trackId={track.id}
          open={trackIsOpen(track.id)}
          onToggle={() => toggleTrack(track.id)}
          foundation={foundation}
          eyebrow={foundation ? (
            <div className={styles.foundationLabel}>
              {track.foundationLabel || 'FOUNDATION · TRACK 0'}
            </div>
          ) : undefined}
          title={displayTrackTitle(track.title)}
          titleTutorialId={isEntryTrack ? TUTORIAL_TARGET.academyEntryTrack : undefined}
          moduleCountLabel={moduleCountLabel(activeModules.length)}
        >
          {track.description ? (
            <p className={styles.trackDescription}>{track.description}</p>
          ) : null}
          <div className={styles.moduleGrid}>
            {activeModules.map((module: CurriculumModule) => renderModuleCard(module, foundation))}
          </div>
        </CurriculumTrackPanel>
        )
      })}

      {devMode && (
        <>
          {cluster2PilotTracks.map((track) => {
            const pilotTrackId = `cluster2-pilot-${track.id}`
            return (
            <CurriculumTrackPanel
              key={pilotTrackId}
              trackId={pilotTrackId}
              open={trackIsOpen(pilotTrackId)}
              onToggle={() => toggleTrack(pilotTrackId)}
              cluster
              eyebrow={<div className={styles.clusterLabel}>{track.clusterLabel}</div>}
              title={displayTrackTitle(track.title)}
              moduleCountLabel={moduleCountLabel(track.modules.length)}
            >
              <p className={styles.trackDescription}>{track.description}</p>
              <div className={styles.moduleGrid}>
                {track.modules.map((module) => (
                  <CurriculumModuleCard
                    key={module.id}
                    module={module as CurriculumModule}
                    premiumLocked={false}
                    startBlocked={academyLocked}
                    startLabel={academyLocked ? 'Zuerst Track 0' : 'Starten'}
                    cluster
                    showTheory={false}
                    showPremiumCheckout={false}
                    completedDrillIds={completedDrillIds}
                    onStart={() => navigate('/cluster2/f')}
                    onTheory={() => {}}
                    onCheckout={() => {}}
                  />
                ))}
              </div>
            </CurriculumTrackPanel>
            )
          })}

          {cluster2CurriculumTracks.map((track: CurriculumTrack) => {
            const activeModules = (track.modules || []).filter((module: CurriculumModule) => module.active !== false)
            if (activeModules.length === 0) return null
            const trackFoundation = isFoundationTrack(track)
            return (
              <CurriculumTrackPanel
                key={`cluster2-${track.id}`}
                trackId={track.id}
                open={trackIsOpen(track.id)}
                onToggle={() => toggleTrack(track.id)}
                cluster
                eyebrow={<div className={styles.clusterLabel}>Cluster 2</div>}
                title={displayTrackTitle(track.title)}
                moduleCountLabel={moduleCountLabel(activeModules.length)}
              >
                {track.description ? (
                  <p className={styles.trackDescription}>{track.description}</p>
                ) : null}
                <div className={styles.moduleGrid}>
                  {activeModules.map((module: CurriculumModule) => renderModuleCard(module, trackFoundation, true))}
                </div>
              </CurriculumTrackPanel>
            )
          })}
        </>
      )}
      </div>
      <PremiumCheckoutSheet open={checkoutOpen} onClose={() => setCheckoutOpen(false)} />
    </div>
  )
}
