// --- Signup ---
export async function signup(username: string, password: string): Promise<{ ok: boolean }> {
  const res = await fetch(buildUrl('/auth/signup'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  if (!res.ok) {
    let detail = '';
    try {
      const txt = await res.text();
      if (txt) detail = txt;
    } catch {}
    throw new Error(`Signup fehlgeschlagen (${res.status})${detail ? `: ${detail}` : ''}`);
  }
  return res.json();
}
// --- Auth-Header Helper ---
function authHeaders(): Record<string, string> {
  const token = localStorage.getItem('academy.token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}
// --- Auth ---
export async function login(username: string, password: string): Promise<{ token: string; username: string }> {
  const res = await fetch(buildUrl('/auth/login'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  if (!res.ok) {
    let detail = '';
    try {
      const txt = await res.text();
      if (txt) detail = txt;
    } catch {}
    throw new Error(`Login fehlgeschlagen (${res.status})${detail ? `: ${detail}` : ''}`);
  }
  return res.json();
}


// ==== Type Definitions ====
export interface Curriculum {
  tracks: Track[]
}

export interface Track {
  id: string
  title: string
  goal: string
  description?: string
  modules: Module[]
}

export type CurriculumTrack = Track

export interface Module {
  id: string
  title: string
  summary: string
  description?: string
  difficulty?: number
  duration?: number
  drills: Drill[]
  learningGoals?: string[]
  recommendedSessionMethod?: string
  defaultFocus?: string
  evaluation?: {
    metrics: string[]
    reportType: string
  }
}

export type CurriculumModule = Module

export interface Drill {
  id: string
  title: string
  drill_type: string
  description?: string
  config: any
  didactics?: {
    explanation?: string
    observation_guide?: {
      what_to_watch?: string[]
      how_to_decide?: string[]
      ignore?: string[]
    }
    glossary?: {
      [term: string]: string
    }
    learning_hint?: string
    goal?: string
    watch_for?: string[]
    how_to?: string[]
    observation_rules?: {
      [key: string]: {
        title: string
        description: string
        examples: string[]
        question: string
      }
    }
    decision_help?: string[]
    ignore_list?: string[]
  }
  // miniFeedback entfernt, nur noch microfeedback auf Session-Ebene
}

export interface Session {
  id: string
  user: string
  created_by?: string
  module_id: string
  goal: string
  confidence: number
  state: string
  current_phase?: string
  created_at: string
  drills: Drill[]
  progress: {
    current_drill_index: number
    completed_drills: string[]
  }
  checkins: Checkin[]
  drafts?: Record<string, any>
  post?: Post
  game_info?: GameInfo
  abort?: {
    reason: string
    note?: string
    aborted_at: string
  }
  focus?: string
  sessionMethod?: string
  drill_id?: string
  microfeedback?: {
    [phase: string]: {
      done: boolean;
      text: string;
      ts?: string;
    }
  }
  observed_team?: string
}

export interface GameInfo {
  team?: string
  team_home: string
  team_away: string
  date: string
  observed_team?: string
  league: string
  season?: string
  matchday?: string
}

export interface Checkin {
  phase: string
  answers: any
  feedback?: string
  next_task?: string
  timestamp: string
  // mini_feedback entfernt
}

export interface Post {
  summary: string
  unclear?: string
  next_module?: string
  helpfulness: number
  completed_at: string
}

export interface Team {
  id: string
  name: string
  city?: string
  short?: string
}

export interface TeamsResponse {
  league: string
  season?: string
  teams: Team[]
}

export interface RosterPlayer {
  player_id: string
  name: string
  number?: number
  position: string
}

export interface RosterTeam {
  team_id: string
  name: string
  players: RosterPlayer[]
}

export interface RosterCatalog {
  league: string
  season: string
  teams: RosterTeam[]
}

export interface ObservationRun {
  run_id: string
  user: string
  league: string
  season: string
  team_id: string
  team_name: string
  player_id: string
  player_name: string
  player_number?: number
  player_position: string
  created_at: string
  notes?: string
  status: string
}

export interface ObservationDimensions {
  support_behavior: 'active' | 'passive' | 'none'
  support_position: 'low' | 'mid' | 'high'
  decision_speed: 'fast' | 'delayed' | 'risky'
  pressure_response: 'stable' | 'turnover' | 'panic'
  off_puck_movement: 'active' | 'static' | 'drifting'
}

export interface ObservationEntry {
  entry_id: string
  run_id: string
  user: string
  league: string
  season: string
  team_id: string
  team_name: string
  player_id: string
  player_name: string
  player_position: string
  created_at: string
  dimensions: ObservationDimensions
  note?: string
}

export interface ObservationPlayerStats {
  player_id: string
  player_name: string
  team_id: string
  team_name: string
  league: string
  season: string
  player_position: string
  observation_count: number
  last_observation?: string
  dimension_stats: Record<string, Record<string, number | string | null>>
}

export interface ObservationStatsResponse {
  players: ObservationPlayerStats[]
}

export interface RosterIndexItem {
  league: string
  season: string
  teams: number
  file: string
}

export interface RewardServerState {
  currency: {
    PUX: number
  }
  unlockedAchievements: Record<string, { id: string; unlockedAt: string }>
  unlockedMasteries: Record<string, any>
  processedSessions: Record<string, { sessionId: string; grantedAt: string; pux: number }>
  lastUpdatedAt?: string | null
}

export interface RewardApplyRequest {
  session_id: string
  evaluated_at: string
  granted_pux: number
  reward_events: Array<Record<string, any>>
  unlocked_achievements: Array<{ id: string; unlockedAt: string }>
  unlocked_masteries: Array<Record<string, any>>
}

export interface RewardApplyResponse {
  state: RewardServerState
  applied: boolean
  granted_pux: number
  reward_events: Array<Record<string, any>>
}

// ==== API Helpers ====
const resolveApiBase = () => {
  const envBase = import.meta.env.VITE_API_BASE
  if (envBase) return envBase.replace(/\/$/, '')

  if (typeof window !== 'undefined') {
    const { hostname, origin } = window.location
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:8000/api'
    }
    return `${origin}/api`
  }

  return 'http://localhost:8000/api'
}

const API_BASE = resolveApiBase()

const buildUrl = (path: string) => `${API_BASE}${path}`



export interface Team {
  id: string
  name: string
  city?: string
  short?: string
}

export interface TeamsResponse {
  league: string
  season?: string
  teams: Team[]
}

export const api = {
  signup: signup,
  // Microfeedback: Session-Block, nicht Checkin
  addMicrofeedback: async (id: string, phase: 'P1'|'P2'|'P3', text: string): Promise<any> => {
    const trace = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : String(Date.now());
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Trace-Id': trace,
      'X-Trace-Action': 'submitMicrofeedback',
      'X-Client-Action': 'submitMicrofeedback'
    };
    const res = await fetch(buildUrl(`/sessions/${encodeURIComponent(id)}/microfeedback`), {
      method: 'POST',
      headers,
      body: JSON.stringify({ phase, text })
    });
    if (!res.ok) throw new Error('Failed to save microfeedback');
    return res.json();
  },
  // Curriculum
  getCurriculum: async (): Promise<Curriculum> => {
    const primaryUrl = buildUrl('/curriculum')
    try {
      const res = await fetch(primaryUrl)
      if (!res.ok) throw new Error(`Failed to fetch curriculum (${res.status})`)
      return await res.json()
    } catch (err) {
      console.warn('Primary curriculum fetch failed, loading fallback', err)
      // Build-aware fallback path to support subpath deployments
      const base = (import.meta as any).env?.BASE_URL || '/'
      const fallbackCandidates = [
        `${String(base).replace(/\/$/, '')}/curriculum-fallback.json`,
        'curriculum-fallback.json'
      ]
      let lastErr: any = err
      for (const url of fallbackCandidates) {
        try {
          const fb = await fetch(url)
          if (fb.ok) return await fb.json()
          lastErr = new Error(`Fallback fetch not ok (${fb.status}) @ ${url}`)
        } catch (e) {
          lastErr = e
        }
      }
      throw new Error(`Failed to fetch curriculum (primary and fallback): ${String(lastErr)}`)
    }
  },

  // Sessions
  getSessions: async (user?: string, state?: string): Promise<Session[]> => {
    const params = new URLSearchParams()
    if (user) params.append('user', user)
    if (state) params.append('state', state)
    const res = await fetch(buildUrl(`/sessions?${params}`), {
      headers: {
        ...authHeaders()
      }
    })
    if (!res.ok) throw new Error('Failed to fetch sessions')
    return res.json()
  },

  createSession: async (data: { user: string; module_id: string; goal: string; confidence: number; focus?: string; session_method?: string; drill_id?: string; game_info?: GameInfo }): Promise<Session> => {
    const res = await fetch(buildUrl('/sessions'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(data)
    })
    if (!res.ok) {
      let detail = ''
      try {
        const txt = await res.text()
        if (txt) detail = txt
      } catch {}
      throw new Error(`Failed to create session (${res.status})${detail ? `: ${detail}` : ''}`)
    }
    return res.json()
  },

  getSession: async (id: string): Promise<Session> => {
    const res = await fetch(buildUrl(`/sessions/${encodeURIComponent(id)}`), {
      headers: {
        ...authHeaders()
      }
    })
    if (!res.ok) throw new Error('Failed to fetch session')
    return res.json()
  },

  saveCheckin: async (id: string, data: { phase: string; answers: any; feedback?: string; next_task?: string; [key: string]: any }): Promise<Session> => {
    const trace = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : String(Date.now());
    console.log("[saveCheckin]", { trace, sessionId: id, phase: data.phase, at: new Date().toISOString() });
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Trace-Id': trace,
      'X-Trace-Action': 'saveCheckin',
      'X-Client-Action': 'saveCheckin'
    };
    const res = await fetch(buildUrl(`/sessions/${encodeURIComponent(id)}/checkins`), {
      method: 'POST',
      headers: { ...headers, ...authHeaders() },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to save checkin');
    return res.json();
  },

  updateSession: async (id: string, updates: Partial<Session>): Promise<Session> => {
    const res = await fetch(buildUrl(`/sessions/${encodeURIComponent(id)}`), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(updates)
    })
    if (!res.ok) throw new Error('Failed to update session')
    return res.json()
  },

  completeSession: async (id: string, data: { summary: string; unclear?: string; next_module?: string; helpfulness: number }): Promise<Session> => {
    const res = await fetch(buildUrl(`/sessions/${encodeURIComponent(id)}/post`), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(data)
    })
    if (!res.ok) throw new Error('Failed to complete session')
    return res.json()
  },

  abortSession: async (id: string, data: { reason: string; note?: string }): Promise<Session> => {
    const res = await fetch(buildUrl(`/sessions/${encodeURIComponent(id)}/abort`), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(data)
    })
    if (!res.ok) throw new Error('Failed to abort session')
    return res.json()
  },

  deleteSession: async (id: string): Promise<{ status: string; id: string }> => {
    const res = await fetch(buildUrl(`/sessions/${encodeURIComponent(id)}`), {
      method: 'DELETE',
      headers: { ...authHeaders() }
    })
    if (!res.ok) throw new Error('Failed to delete session')
    return res.json()
  },

  deleteCheckin: async (sessionId: string, checkinIndex: number): Promise<Session> => {
    const res = await fetch(buildUrl(`/sessions/${encodeURIComponent(sessionId)}/checkins/${checkinIndex}`), {
      method: 'DELETE',
      headers: { ...authHeaders() }
    })
    if (!res.ok) {
      let detail = ''
      try {
        const txt = await res.text()
        if (txt) detail = `: ${txt}`
      } catch {}
      throw new Error(`Failed to delete checkin (${res.status})${detail}`)
    }
    return res.json()
  },

  // Drafts for session continuation
  saveDrafts: async (sessionId: string, drafts: Record<string, any>): Promise<{status: string}> => {
    const res = await fetch(buildUrl(`/sessions/${encodeURIComponent(sessionId)}/drafts`), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(drafts)
    })
    if (!res.ok) throw new Error('Failed to save drafts')
    return res.json()
  },

  // Update session phase for continuation
  updateSessionPhase: async (sessionId: string, phaseData: {phase?: string, state?: string}): Promise<Session> => {
    const trace = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : String(Date.now());
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Trace-Id': trace,
      'X-Trace-Action': 'updateSessionPhase',
      'X-Client-Action': 'updateSessionPhase'
    };
    const res = await fetch(buildUrl(`/sessions/${encodeURIComponent(sessionId)}/phase`), {
      method: 'PUT',
      headers: { ...headers, ...authHeaders() },
      body: JSON.stringify(phaseData)
    })
    if (!res.ok) throw new Error('Failed to update session phase')
    return res.json()
  },

  // Download session as JSON
  downloadSession: async (sessionId: string, phase?: string): Promise<Blob> => {
    const query = phase ? `?phase=${encodeURIComponent(phase)}` : ''
    const res = await fetch(buildUrl(`/sessions/${encodeURIComponent(sessionId)}/download${query}`), {
      method: 'GET',
      headers: { ...authHeaders() }
    })
    if (!res.ok) throw new Error('Failed to download session')
    return res.blob()
  },

  // Teams
  getTeams: async (league?: string): Promise<TeamsResponse> => {
    const query = league ? `?league=${encodeURIComponent(league)}` : ''
    const res = await fetch(buildUrl(`/teams${query}`), {
      headers: { ...authHeaders() }
    })
    if (!res.ok) throw new Error('Failed to fetch teams')
    return res.json()
  },

  getRosters: async (): Promise<{ rosters: RosterIndexItem[] }> => {
    const res = await fetch(buildUrl('/rosters'), {
      headers: { ...authHeaders() }
    })
    if (!res.ok) throw new Error('Failed to fetch roster index')
    return res.json()
  },

  getRoster: async (league: string, season: string): Promise<RosterCatalog> => {
    const res = await fetch(buildUrl(`/rosters/${encodeURIComponent(league)}/${encodeURIComponent(season)}`), {
      headers: { ...authHeaders() }
    })
    if (!res.ok) throw new Error('Failed to fetch roster')
    return res.json()
  },

  createObservationRun: async (payload: {
    league: string
    season: string
    team_id: string
    team_name: string
    player_id: string
    player_name: string
    player_number?: number
    player_position: string
    notes?: string
  }): Promise<ObservationRun> => {
    const res = await fetch(buildUrl('/observation-runs'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(payload)
    })
    if (!res.ok) throw new Error('Failed to create observation run')
    return res.json()
  },

  getObservationRun: async (runId: string): Promise<ObservationRun> => {
    const res = await fetch(buildUrl(`/observation-runs/${encodeURIComponent(runId)}`), {
      headers: { ...authHeaders() }
    })
    if (!res.ok) throw new Error('Failed to fetch observation run')
    return res.json()
  },

  createObservation: async (payload: {
    run_id: string
    dimensions: ObservationDimensions
    note?: string
  }): Promise<ObservationEntry> => {
    const res = await fetch(buildUrl('/observations'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(payload)
    })
    if (!res.ok) throw new Error('Failed to create observation entry')
    return res.json()
  },

  getObservations: async (params?: {
    run_id?: string
    league?: string
    season?: string
    team_id?: string
    player_id?: string
  }): Promise<{ observations: ObservationEntry[] }> => {
    const qs = new URLSearchParams()
    if (params?.run_id) qs.append('run_id', params.run_id)
    if (params?.league) qs.append('league', params.league)
    if (params?.season) qs.append('season', params.season)
    if (params?.team_id) qs.append('team_id', params.team_id)
    if (params?.player_id) qs.append('player_id', params.player_id)
    const query = qs.toString() ? `?${qs.toString()}` : ''

    const res = await fetch(buildUrl(`/observations${query}`), {
      headers: { ...authHeaders() }
    })
    if (!res.ok) throw new Error('Failed to fetch observation entries')
    return res.json()
  },

  getObservationStats: async (params?: {
    league?: string
    season?: string
    team_id?: string
    player_id?: string
  }): Promise<ObservationStatsResponse> => {
    const qs = new URLSearchParams()
    if (params?.league) qs.append('league', params.league)
    if (params?.season) qs.append('season', params.season)
    if (params?.team_id) qs.append('team_id', params.team_id)
    if (params?.player_id) qs.append('player_id', params.player_id)
    const query = qs.toString() ? `?${qs.toString()}` : ''

    const res = await fetch(buildUrl(`/observation-stats${query}`), {
      headers: { ...authHeaders() }
    })
    if (!res.ok) throw new Error('Failed to fetch observation stats')
    return res.json()
  },

  getObservationStatsForPlayer: async (playerId: string, params?: {
    league?: string
    season?: string
    team_id?: string
  }): Promise<{ player: ObservationPlayerStats; observations: ObservationEntry[] }> => {
    const qs = new URLSearchParams()
    if (params?.league) qs.append('league', params.league)
    if (params?.season) qs.append('season', params.season)
    if (params?.team_id) qs.append('team_id', params.team_id)
    const query = qs.toString() ? `?${qs.toString()}` : ''

    const res = await fetch(buildUrl(`/observation-stats/player/${encodeURIComponent(playerId)}${query}`), {
      headers: { ...authHeaders() }
    })
    if (!res.ok) throw new Error('Failed to fetch player observation stats')
    return res.json()
  },

  getRewardState: async (): Promise<RewardServerState> => {
    const res = await fetch(buildUrl('/rewards/state'), {
      headers: {
        ...authHeaders(),
      },
    })

    if (!res.ok) throw new Error('Failed to fetch reward state')
    return res.json()
  },

  applyRewardResult: async (data: RewardApplyRequest): Promise<RewardApplyResponse> => {
    const res = await fetch(buildUrl('/rewards/apply'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders(),
      },
      body: JSON.stringify(data),
    })

    if (!res.ok) throw new Error('Failed to apply rewards')
    return res.json()
  }
}