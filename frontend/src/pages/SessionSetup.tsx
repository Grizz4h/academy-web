import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../api'
import { useState, useEffect, useRef } from 'react'
import { useUser } from '../context/UserContext'
import { renderWithGlossary } from '../components/GlossaryTerm'
import { DrillGuideCard } from '../components/DrillGuideCard'
import type { DrillGuide } from '../components/DrillGuideCard'

// NHL Teams mit Division als Metadaten
const NHL_TEAMS: Array<{ name: string; division: string; short?: string }> = [
  // Atlantic Division
  { name: 'Boston Bruins', division: 'Atlantic', short: 'BOS' },
  { name: 'Buffalo Sabres', division: 'Atlantic', short: 'BUF' },
  { name: 'Detroit Red Wings', division: 'Atlantic', short: 'DET' },
  { name: 'Florida Panthers', division: 'Atlantic', short: 'FLA' },
  { name: 'Montreal Canadiens', division: 'Atlantic', short: 'MTL' },
  { name: 'Ottawa Senators', division: 'Atlantic', short: 'OTT' },
  { name: 'Tampa Bay Lightning', division: 'Atlantic', short: 'TBL' },
  { name: 'Toronto Maple Leafs', division: 'Atlantic', short: 'TOR' },
  // Metropolitan Division
  { name: 'Carolina Hurricanes', division: 'Metropolitan', short: 'CAR' },
  { name: 'Columbus Blue Jackets', division: 'Metropolitan', short: 'CBJ' },
  { name: 'New Jersey Devils', division: 'Metropolitan', short: 'NJD' },
  { name: 'New York Islanders', division: 'Metropolitan', short: 'NYI' },
  { name: 'New York Rangers', division: 'Metropolitan', short: 'NYR' },
  { name: 'Philadelphia Flyers', division: 'Metropolitan', short: 'PHI' },
  { name: 'Pittsburgh Penguins', division: 'Metropolitan', short: 'PIT' },
  { name: 'Washington Capitals', division: 'Metropolitan', short: 'WSH' },
  // Central Division
  { name: 'Arizona Coyotes', division: 'Central', short: 'ARI' },
  { name: 'Chicago Blackhawks', division: 'Central', short: 'CHI' },
  { name: 'Colorado Avalanche', division: 'Central', short: 'COL' },
  { name: 'Dallas Stars', division: 'Central', short: 'DAL' },
  { name: 'Minnesota Wild', division: 'Central', short: 'MIN' },
  { name: 'Nashville Predators', division: 'Central', short: 'NSH' },
  { name: 'St. Louis Blues', division: 'Central', short: 'STL' },
  { name: 'Winnipeg Jets', division: 'Central', short: 'WPG' },
  // Pacific Division
  { name: 'Anaheim Ducks', division: 'Pacific', short: 'ANA' },
  { name: 'Calgary Flames', division: 'Pacific', short: 'CGY' },
  { name: 'Edmonton Oilers', division: 'Pacific', short: 'EDM' },
  { name: 'Los Angeles Kings', division: 'Pacific', short: 'LAK' },
  { name: 'San Jose Sharks', division: 'Pacific', short: 'SJS' },
  { name: 'Seattle Kraken', division: 'Pacific', short: 'SEA' },
  { name: 'Vancouver Canucks', division: 'Pacific', short: 'VAN' },
  { name: 'Vegas Golden Knights', division: 'Pacific', short: 'VGK' }
]

// Helper: Finde Division für ein Team
const getTeamDivision = (teamName: string): string | undefined => {
  return NHL_TEAMS.find(t => t.name === teamName)?.division
}

export default function SessionSetup() {
  const { moduleId } = useParams<{ moduleId: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useUser()
  const [goal, setGoal] = useState<string>('')
  const [confidence, setConfidence] = useState<number>(3)
  const [selectedDrill, setSelectedDrill] = useState<string>('')
  const [league, setLeague] = useState<string>('DEL')
  const [teamHome, setTeamHome] = useState<string>('')
  const [teamAway, setTeamAway] = useState<string>('')
  const draftKey = user ? `academy.sessionDraft.${user}.${moduleId}` : null

    // Setze DEL-Defaults für Teams, wenn DEL gewählt wird und noch keine Teams gesetzt sind
    useEffect(() => {
      if (league === 'DEL') {
        if (!teamHome) setTeamHome('ERC Ingolstadt');
        if (!teamAway) setTeamAway('Augsburger Panther');
      }
    }, [league]);

  // Draft laden
  useEffect(() => {
    if (!draftKey) return
    const saved = localStorage.getItem(draftKey)
    if (!saved) return
    try {
      const parsed = JSON.parse(saved)
      if (parsed.goal) setGoal(parsed.goal)
      if (parsed.confidence) setConfidence(parsed.confidence)
      if (parsed.league) setLeague(parsed.league)
      if (parsed.teamHome) setTeamHome(parsed.teamHome)
      if (parsed.teamAway) setTeamAway(parsed.teamAway)
      if (parsed.selectedDrill) setSelectedDrill(parsed.selectedDrill)
    } catch (e) {
      console.warn('Draft konnte nicht geladen werden', e)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftKey])

  // Draft speichern bei Änderungen
  useEffect(() => {
    if (!draftKey) return
    const draft = {
      goal,
      confidence,
      league,
      teamHome,
      teamAway,
      selectedDrill
    }
    localStorage.setItem(draftKey, JSON.stringify(draft))
  }, [draftKey, goal, confidence, league, teamHome, teamAway, selectedDrill])

  const { data: curriculum } = useQuery({
    queryKey: ['curriculum'],
    queryFn: () => api.getCurriculum()
  })

  const { data: teamsResp } = useQuery({
    queryKey: ['teams'],
    queryFn: () => api.getTeams()
  })

  const [createError, setCreateError] = useState<string>('')
  const lastPayloadRef = useRef<Parameters<typeof api.createSession>[0] | null>(null)

  const createSessionMutation = useMutation({
    mutationFn: (data: Parameters<typeof api.createSession>[0]) => api.createSession(data),
    retry: 3,
    retryDelay: (attempt: number) => Math.min(5000, attempt * 2000),
    onSuccess: (session) => {
      queryClient.invalidateQueries({ queryKey: ['sessions', user] })
      if (draftKey) localStorage.removeItem(draftKey)
      setCreateError('')
      navigate(`/session/${session.id}`)
    },
    onError: (error: any) => {
      const msg = String(error?.message || 'Unbekannter Fehler')
      setCreateError(msg)
    }
  })


  // Finde aktuelles Modul
  const currentModule = curriculum?.tracks.flatMap(t => t.modules).find(m => m.id === moduleId)

  // Debug-Ausgaben: immer ganz oben, niemals nach einem return!
  useEffect(() => {
    console.log('SessionSetup Debug:', {
      moduleId,
      currentModule,
      drills: currentModule?.drills,
      selectedDrill
    })
  }, [moduleId, currentModule, selectedDrill])

  if (!currentModule) {
    return <div className="card">Modul nicht gefunden</div>
  }

  // Ersten Drill standardmäßig vorauswählen (A1 UX: sofort startbar)
  useEffect(() => {
    if (!selectedDrill && currentModule?.drills?.length) {
      setSelectedDrill(currentModule.drills[0].id)
    }
  }, [currentModule, selectedDrill])

  const handleCreateSession = () => {
    if (!user?.trim()) {
      alert('Bitte oben im Login einen Namen speichern, damit wir die Session zuordnen können.')
      return
    }
    if (!league) {
      alert('Bitte eine Liga wählen (z.B. NHL oder DEL).')
      return
    }
    if (!teamHome || !teamAway) {
      alert('Bitte beide Teams auswählen, die du dir anschaust.')
      return
    }
    if (teamHome === teamAway) {
      alert('Home- und Auswärtsteam müssen unterschiedlich sein.')
      return
    }
    // Drill optional auswählen – Standard: erster Drill des Moduls

    const gameInfo: any = {
      league,
      team_home: teamHome,
      team_away: teamAway,
      date: new Date().toISOString()
    }
    // Hinweis: Divisionen NICHT an Backend senden, nur intern nutzen

    const effectiveGoal = goal.trim() || `Auto: ${currentModule.title}`
    const chosenDrill = selectedDrill || currentModule.drills[0]?.id

    const payload = {
      user: user.trim(),
      module_id: moduleId!,
      goal: effectiveGoal,
      confidence,
      focus: currentModule.defaultFocus,
      session_method: currentModule.recommendedSessionMethod || 'live_watch',
      drill_id: chosenDrill || undefined,
      game_info: gameInfo
    }
    lastPayloadRef.current = payload
    createSessionMutation.mutate(payload)
  }

  const availableTeams = (() => {
    if (!league) return []
    if (league === 'DEL') {
      const teams = teamsResp?.teams?.map(t => t.name) || []
      // Fallback falls API nicht lädt
      if (teams.length === 0) {
        return [
          'Eisbären Berlin', 'Adler Mannheim', 'EHC Red Bull München', 
          'ERC Ingolstadt', 'Kölner Haie', 'Dresdner Eislöwen',
          'Grizzlys Wolfsburg', 'Schwenninger Wild Wings', 'Straubing Tigers',
          'Augsburger Panther', 'Iserlohn Roosters', 'Nürnberg Ice Tigers',
          'Fischtown Pinguins Bremerhaven', 'Löwen Frankfurt'
        ]
      }
      return teams
    }
    if (league === 'NHL') return NHL_TEAMS.map(t => t.name)
    return []
  })()

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <h1>Session Setup: {currentModule.title}</h1>

      {!user && (
        <div className="card" style={{ border: '1px solid #ffc107' }}>
          <strong>Login nötig:</strong> Bitte oben im Navbar deinen Namen speichern. Wir merken ihn im Browser, damit Sessions dir zugeordnet sind.
        </div>
      )}

      <div className="card">
        <h2>Modul Info</h2>
        <p style={{ wordWrap: 'break-word', overflowWrap: 'break-word' }}>{renderWithGlossary(currentModule.description ?? '')}</p>
        <div style={{ marginTop: '1rem' }}>
          <strong>Lernziele:</strong>
          <ul style={{ marginTop: '0.5rem' }}>
            {currentModule.learningGoals?.map((goal, i) => (
              <li key={i}>{renderWithGlossary(goal)}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="card">
        <h2>Spiel-Setup</h2>
        <p>Welche Partie schaust du dir an?</p>

        <label style={{ display: 'block', marginTop: '0.75rem' }}>
          Liga auswählen
          <select
            value={league}
            onChange={(e) => {
              setLeague(e.target.value)
              setTeamHome('')
              setTeamAway('')
            }}
            style={{
              width: '100%',
              padding: '0.5rem',
              marginTop: '0.35rem',
              backgroundColor: '#050712',
              color: '#f7f7ff',
              border: '1px solid #5191a2'
            }}
          >
            <option value="">-- Liga wählen --</option>
            <option value="DEL">DEL</option>
            <option value="NHL">NHL</option>
          </select>
        </label>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '0.75rem' }}>
          <label style={{ display: 'block' }}>
            Heimteam
            <select
              value={teamHome}
              onChange={(e) => setTeamHome(e.target.value)}
              disabled={!league}
              style={{
                width: '100%',
                padding: '0.5rem',
                marginTop: '0.35rem',
                backgroundColor: '#050712',
                color: '#f7f7ff',
                border: '1px solid #5191a2'
              }}
            >
              <option value="">-- Heimteam --</option>
              {availableTeams.map((team) => (
                <option key={team} value={team}>{team}</option>
              ))}
            </select>
          </label>

          <label style={{ display: 'block' }}>
            Auswärtsteam
            <select
              value={teamAway}
              onChange={(e) => setTeamAway(e.target.value)}
              disabled={!league}
              style={{
                width: '100%',
                padding: '0.5rem',
                marginTop: '0.35rem',
                backgroundColor: '#050712',
                color: '#f7f7ff',
                border: '1px solid #5191a2'
              }}
            >
              <option value="">-- Auswärtsteam --</option>
              {availableTeams.map((team) => (
                <option key={team} value={team}>{team}</option>
              ))}
            </select>
          </label>
        </div>

        {league === 'NHL' && teamHome && teamAway && (
          <div style={{ 
            marginTop: '1rem', 
            padding: '0.75rem', 
            backgroundColor: 'rgba(81,145,162,0.1)', 
            borderRadius: '4px',
            fontSize: '0.9rem'
          }}>
            <div style={{ fontWeight: 'bold', marginBottom: '0.5rem', color: '#5191a2' }}>Spiel-Kontext</div>
            <div>{teamHome} <span style={{ color: 'rgba(255,255,255,0.5)' }}>({getTeamDivision(teamHome)})</span></div>
            <div style={{ textAlign: 'center', margin: '0.25rem 0', color: 'rgba(255,255,255,0.5)' }}>vs</div>
            <div>{teamAway} <span style={{ color: 'rgba(255,255,255,0.5)' }}>({getTeamDivision(teamAway)})</span></div>
          </div>
        )}
      </div>

      {currentModule.drills && currentModule.drills.length > 0 && (
        <div className="card">
          <h2>Wähle deine Übung</h2>
          <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)' }}>
            Alle Übungen trainieren das gleiche Modul – wähle je nach Situation und Fokus.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
            {currentModule.drills.map((drill) => (
              <label key={drill.id} style={{ display: 'flex', alignItems: 'center', padding: '0.5rem', border: selectedDrill === drill.id ? '2px solid #5191a2' : '1px solid rgba(255,255,255,0.2)', borderRadius: '4px', cursor: 'pointer', backgroundColor: selectedDrill === drill.id ? 'rgba(81,145,162,0.1)' : 'transparent', overflow: 'hidden' }}>
                <input
                  type="radio"
                  name="drill"
                  value={drill.id}
                  checked={selectedDrill === drill.id}
                  onChange={(e) => setSelectedDrill(e.target.value)}
                  style={{ marginRight: '0.5rem', cursor: 'pointer', flexShrink: 0 }}
                />
                <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                  <div style={{ fontWeight: 'bold', wordWrap: 'break-word', overflowWrap: 'break-word', whiteSpace: 'normal' }}>{drill.title}</div>
                  <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', wordWrap: 'break-word', overflowWrap: 'break-word', whiteSpace: 'normal' }}>{drill.description}</div>
                </div>
              </label>
            ))}
          </div>
        </div>
      )}

      {selectedDrill && (() => {
        const drill = currentModule.drills.find(d => d.id === selectedDrill)
        const didactics = drill?.didactics
        if (!didactics) return null

        // Neue Struktur: explanation, observation_guide, coaching_rules, evaluation_metrics, learning_hint
        // Alte Struktur: goal, watch_for, how_to, learning_hint

        // Extend didactics type to include coaching_rules and evaluation_metrics
        type Didactics = {
          explanation?: string
          observation_guide?: { what_to_watch?: string[]; how_to_decide?: string[]; ignore?: string[] } | string[]
          glossary?: { [key: string]: string }
          goal?: string
          watch_for?: string | string[]
          how_to?: string | string[]
          learning_hint?: string
          coaching_rules?: string | string[]
          evaluation_metrics?: string | string[]
          ignore_list?: string[]
        }

        const didacticsTyped = drill?.didactics as Didactics | undefined
        const hasOld = didacticsTyped?.goal || didacticsTyped?.watch_for || didacticsTyped?.how_to
        const hasNew = didacticsTyped?.explanation || didacticsTyped?.observation_guide || didacticsTyped?.coaching_rules || didacticsTyped?.evaluation_metrics

        return (
          <div className="card">
            <h2>Drill-Erklärung</h2>
            {/* Neue Struktur */}
            {hasNew && (
              <>
                {didactics.explanation && (
                  <div style={{ marginTop: '0.5rem' }}>
                    <strong>Erklärung</strong>
                    <p style={{ marginTop: '0.35rem' }}>{renderWithGlossary(didactics.explanation)}</p>
                  </div>
                )}
                {/* observation_guide als Objekt oder Array */}
                {didactics.observation_guide && (typeof didactics.observation_guide === 'object') && !Array.isArray(didactics.observation_guide) ? (
                  <div style={{ marginTop: '0.75rem' }}>
                    <DrillGuideCard guide={didactics.observation_guide as DrillGuide} />
                  </div>
                ) : didactics.observation_guide && Array.isArray(didactics.observation_guide) ? (
                  <div style={{ marginTop: '0.75rem' }}>
                    <strong>Beobachtungsleitfaden</strong>
                    <ul style={{ marginTop: '0.35rem' }}>
                      {didactics.observation_guide.map((t: string, i: number) => (
                        <li key={i}>{renderWithGlossary(t)}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                {(didacticsTyped?.coaching_rules) && (
                  <div style={{ marginTop: '0.75rem' }}>
                    <strong>Coaching-Regeln</strong>
                    <ul style={{ marginTop: '0.35rem' }}>
                      {Array.isArray(didacticsTyped.coaching_rules) ? didacticsTyped.coaching_rules.map((t, i) => (
                        <li key={i}>{renderWithGlossary(t)}</li>
                      )) : <li>{renderWithGlossary(didacticsTyped.coaching_rules)}</li>}
                    </ul>
                  </div>
                )}
                {(didacticsTyped?.evaluation_metrics) && (
                  <div style={{ marginTop: '0.75rem' }}>
                    <strong>Bewertungskriterien</strong>
                    <ul style={{ marginTop: '0.35rem' }}>
                      {Array.isArray(didacticsTyped.evaluation_metrics) ? didacticsTyped.evaluation_metrics.map((t, i) => (
                        <li key={i}>{renderWithGlossary(t)}</li>
                      )) : <li>{renderWithGlossary(didacticsTyped.evaluation_metrics)}</li>}
                    </ul>
                  </div>
                )}
              </>
            )}
            {/* Alte Struktur */}
            {hasOld && (
              <>
                {didactics.goal && (
                  <div style={{ marginTop: '0.5rem' }}>
                    <strong>Worum geht es?</strong>
                    <p style={{ marginTop: '0.35rem' }}>{renderWithGlossary(didactics.goal)}</p>
                  </div>
                )}
                {didactics.watch_for && (
                  <div style={{ marginTop: '0.75rem' }}>
                    <strong>Worauf achten?</strong>
                    <ul style={{ marginTop: '0.35rem' }}>
                      {Array.isArray(didactics.watch_for) ? didactics.watch_for.map((t, i) => (
                        <li key={i}>{renderWithGlossary(t)}</li>
                      )) : <li>{renderWithGlossary(didactics.watch_for)}</li>}
                    </ul>
                  </div>
                )}
                {didactics.how_to && (
                  <div style={{ marginTop: '0.75rem' }}>
                    <strong>Wie ausfüllen?</strong>
                    <ul style={{ marginTop: '0.35rem' }}>
                      {Array.isArray(didactics.how_to) ? didactics.how_to.map((t, i) => (
                        <li key={i}>{renderWithGlossary(t)}</li>
                      )) : <li>{renderWithGlossary(didactics.how_to)}</li>}
                    </ul>
                  </div>
                )}
              </>
            )}
            {/* Lernhinweis (gemeinsam) */}
            {didactics.learning_hint && (
              <div style={{ marginTop: '0.75rem' }}>
                <strong>Lernhinweis</strong>
                <p style={{ marginTop: '0.35rem', color: 'rgba(255,255,255,0.8)' }}>
                  {renderWithGlossary(didactics.learning_hint)}
                </p>
              </div>
            )}
          </div>
        )
      })()}

      <div className="card">
        <h2>Lernziel für diese Session (optional)</h2>
        <textarea
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          placeholder="z.B. 'Heute fokussiere ich auf Center-Positionen in der Offensive'"
          style={{
            width: '100%',
            padding: '0.5rem',
            marginTop: '0.5rem',
            backgroundColor: '#050712',
            color: '#f7f7ff',
            border: '1px solid #5191a2',
            borderRadius: '4px',
            minHeight: '100px',
            fontFamily: 'inherit'
          }}
        />
      </div>

      <div className="card">
        <h2>Wie selbstbewusst bist du?</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem' }}>
          <input
            type="range"
            min="1"
            max="5"
            value={confidence}
            onChange={(e) => setConfidence(Number(e.target.value))}
            style={{ flex: 1 }}
          />
          <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
            {confidence}/5
          </span>
        </div>
        <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)', marginTop: '0.5rem' }}>
          1 = sehr unsicher, 5 = sehr selbstbewusst
        </p>
      </div>

      <button
        onClick={handleCreateSession}
        className="btn"
        style={{
          padding: '1rem',
          fontSize: '1.1rem',
          backgroundColor: '#5191a2'
        }}
        disabled={createSessionMutation.isPending}
      >
        {createSessionMutation.isPending ? 'Erstelle Session...' : 'Session starten'}
      </button>

      {createError && (
        <div className="card" style={{ border: '1px solid #dc3545', background: 'rgba(220,53,69,0.08)' }}>
          <div style={{ fontWeight: 'bold', marginBottom: '0.5rem', color: '#ff8e8e' }}>Session konnte nicht erstellt werden</div>
          <div style={{ whiteSpace: 'pre-wrap', fontSize: '0.9rem', color: 'rgba(255,255,255,0.85)' }}>{createError}</div>
          <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem' }}>
            <button
              className="btn"
              onClick={() => {
                if (lastPayloadRef.current) {
                  setCreateError('')
                  createSessionMutation.mutate(lastPayloadRef.current)
                }
              }}
              disabled={createSessionMutation.isPending}
            >
              Erneut versuchen
            </button>
            {!navigator.onLine && (
              <span style={{ alignSelf: 'center', color: 'rgba(255,255,255,0.7)' }}>Offline erkannt – bitte Internet prüfen</span>
            )}
          </div>
        </div>
      )}

      <button
        onClick={() => navigate('/curriculum')}
        style={{
          padding: '0.5rem',
          backgroundColor: 'transparent',
          border: '1px solid rgba(255,255,255,0.3)',
          color: '#f7f7ff',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        Abbrechen
      </button>
    </div>
  )
}