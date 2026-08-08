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

import { labModules, predictionTemplates } from './features/lab/config'
import type { UserAccountPayload, UserProfileCustomization } from './data/profile/types'


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

export type LearningArea = 'academy' | 'lab'

export type LabMode =
  | 'predict'
  | 'compare'
  | 'hypothesis'
  | 'reconstruction'
  | 'review'

export type PredictionResolution = 'correct' | 'partial' | 'incorrect' | 'unjudgeable'

export interface PredictionEntry {
  id: string
  sessionId: string
  templateId: string
  categoryId: string
  observedTeamId: string
  observedTeamName: string
  period: number
  gameTime?: string
  predictedValue: string
  confidence: 'low' | 'medium' | 'high'
  actualValue?: string
  resolution?: PredictionResolution
  missedCue?: string
  note?: string
  createdAt: string
  resolvedAt?: string
}

export interface PredictionSessionSummary {
  total: number
  resolved: number
  correct: number
  partial: number
  incorrect: number
  unjudgeable: number
  mostPredictedValue?: string
  mostActualValue?: string
  confidenceTotals: {
    low: number
    medium: number
    high: number
  }
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
  observation_scope?: string
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
  observed_team_id?: string
  observed_team_name?: string
  learning_area?: LearningArea
  lab_mode?: LabMode
  lab_template_id?: string
  prediction_entries?: PredictionEntry[]
  open_prediction_id?: string
  prediction_summary?: PredictionSessionSummary
  /** Dev/test sessions created via Dummy-Session. Missing/false = real session. */
  is_dummy?: boolean
  isDummy?: boolean
  dev_seed_version?: number
}

export interface GameInfo {
  team?: string
  team_home: string
  team_away: string
  date: string
  observed_team?: string
  observed_team_id?: string
  observed_team_name?: string
  league: string
  season?: string
  matchday?: string
  competition_phase?: string
  competition_phase_label?: string
  competition_unit_type?: string
  competition_unit_label?: string
  competition_unit_value?: string
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

export interface KaderPlayer {
  player_id: string
  player_name: string
  jersey_number?: number
  position?: string
  position_group?: 'forward' | 'defense' | 'goalie'
  nationality?: string
  age?: number
  height_cm?: number
  weight_kg?: number
  birthplace?: string
  shoots_or_catches?: string
  team: string
  league: string
  source: string
  active: boolean
  observation_count: number
  summary: string
  last_observed?: string
  created_at?: string
}

export interface TeamsListResponse {
  teams: {
    id: string
    slug: string
    name: string
    league: string
    url: string
    enabled: boolean
    status: "supported" | "planned"
  }[]
  note?: string
}

export interface ImportResult {
  team_id: string
  team?: string
  league?: string
  slug?: string
  total_players: number
  active_players: number
  created: number
  updated: number
  reactivated: number
  imported_count: number
  url?: string
  error?: string
}

export interface PlayersResponse {
  team_id: string
  players: KaderPlayer[]
  total: number
  updated_at: string
}

export interface ImportAllResult {
  results: ImportResult[]
  total: number
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
  player_birth_year?: number
  player_notes?: string
  drill_id?: string
  drill_name?: string
  source?: ObservationSource
  created_at: string
  notes?: string
  status: string
}

export interface ObservationSource {
  source_type: string
  provider: string
  label: string
  url?: string
  external_id?: string
  metadata?: Record<string, any>
  captured_at?: string | null
}

export interface ObservationSummary {
  text: string
  status: string
  updated_at?: string | null
  generator?: string
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
  drill_id?: string
  drill_name?: string
  source?: ObservationSource
  created_at: string
  dimensions: ObservationDimensions
  note?: string
}

export interface ObservationHistoryRun {
  run_id: string
  created_at: string
  league: string
  season: string
  team_id: string
  team_name: string
  drill_id?: string
  drill_name?: string
  run_note?: string
  source?: ObservationSource
}

export interface ObservationHistoryItem {
  entry_id?: string
  run_id: string
  created_at: string
  drill_id?: string
  drill_name?: string
  game?: {
    league?: string
    season?: string
    team_name?: string
  }
  note?: string
  source?: ObservationSource
}

export interface ObservationNoteTimelineItem {
  created_at: string
  run_id: string
  entry_id?: string | null
  note: string
  source?: ObservationSource
}

export interface ObservationProfile {
  profile_id: string
  user: string
  player_id: string
  player_name: string
  team_id: string
  team_name: string
  league: string
  season: string
  player_position: string
  player_birth_year?: number
  notes?: string
  created_at: string
  updated_at: string
  summary: ObservationSummary
  source_catalog: ObservationSource[]
  history: {
    first_observation?: string | null
    last_observation?: string | null
    observation_session_count: number
    observation_entry_count: number
    runs: ObservationHistoryRun[]
    observations: ObservationHistoryItem[]
    note_timeline: ObservationNoteTimelineItem[]
  }
  integrations?: {
    providers?: Record<string, { enabled: boolean; status: string }>
    planned_capabilities?: string[]
  }
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
  first_observation?: string
  last_observation?: string
  observation_session_count?: number
  observation_entry_count?: number
  summary?: ObservationSummary
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

export interface SceneSource {
  type: 'drill' | 'manual'
  session_id?: string | null
  drill_id?: string | null
  observation_id?: string | null
}

export type SceneMetadataStatus = 'incomplete' | 'complete'

export interface SceneMarker {
  id: string
  scene_code?: string
  internal_scene_id?: string
  user: string
  session_id?: string | null
  module_id?: string | null
  drill_id?: string | null
  drill_title?: string
  track_id?: string | null
  source?: SceneSource
  metadata_status?: SceneMetadataStatus
  status?: string
  league?: string
  season?: string
  competition_phase?: string
  competition_phase_label?: string
  competition_unit_type?: string
  competition_unit_label?: string
  competition_unit_value?: string
  matchday?: string
  game_date?: string
  team_home?: string
  team_away?: string
  observed_team?: string
  observed_team_id?: string
  observed_team_name?: string
  period?: string
  episode_season?: string
  episode_number?: string
  season_code?: string
  episode_code?: string
  game_time: string
  note?: string
  rating?: 1 | 2 | 3 | 4 | 5 | null
  extensions?: Record<string, string>
  extension_labels?: Record<string, string>
  created_at: string
  updated_at?: string
}

export interface SceneMarkerCreate {
  session_id?: string | null
  module_id?: string | null
  drill_id?: string | null
  drill_title?: string
  track_id?: string | null
  source?: SceneSource
  metadata_status?: SceneMetadataStatus
  status?: string
  overwrite_episode?: boolean
  league?: string
  season?: string
  competition_phase?: string
  competition_phase_label?: string
  competition_unit_type?: string
  competition_unit_label?: string
  competition_unit_value?: string
  matchday?: string
  game_date?: string
  team_home?: string
  team_away?: string
  observed_team?: string
  observed_team_id?: string
  observed_team_name?: string
  period?: string
  episode_season?: string
  episode_number?: string
  season_code?: string
  episode_code?: string
  game_time: string
  note?: string
  rating?: 1 | 2 | 3 | 4 | 5 | null
  extensions?: Record<string, string>
  extension_labels?: Record<string, string>
}

export interface SceneMarkerUpdate {
  game_time?: string
  note?: string
  rating?: 1 | 2 | 3 | 4 | 5 | null
  status?: string
  metadata_status?: SceneMetadataStatus
  period?: string
  league?: string
  season?: string
  competition_phase?: string
  competition_phase_label?: string
  competition_unit_type?: string
  competition_unit_label?: string
  competition_unit_value?: string
  matchday?: string
  game_date?: string
  team_home?: string
  team_away?: string
  observed_team?: string
  observed_team_id?: string
  observed_team_name?: string
  episode_season?: string
  episode_number?: string
  season_code?: string
  episode_code?: string
  overwrite_episode?: boolean
  extensions?: Record<string, string>
  extension_labels?: Record<string, string>
}

export interface LabModuleContent {
  id: string
  label: string
  description: string
  enabled: boolean
}

export interface LabContent {
  modules: LabModuleContent[]
  prediction_templates: any[]
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

async function readApiError(res: Response, fallback: string): Promise<Error> {
  let detail = ''
  try {
    const payload = await res.json()
    if (typeof payload?.detail === 'string') {
      detail = payload.detail
    } else if (payload?.detail?.message) {
      detail = payload.detail.message
    } else if (typeof payload?.message === 'string') {
      detail = payload.message
    }
  } catch {
    try {
      const text = await res.text()
      if (text) detail = text
    } catch {}
  }

  const error = new Error(`${fallback}${detail ? `: ${detail}` : ''}`)
  ;(error as any).status = res.status
  return error
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
        'http://localhost:8000/api/curriculum',
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

  getLabContent: async (): Promise<LabContent> => {
    try {
      const res = await fetch(buildUrl('/lab/content'))
      if (res.ok) return res.json()
      throw new Error(`Failed to fetch lab content (${res.status})`)
    } catch (err) {
      console.warn('Lab content endpoint unavailable, using local fallback config', err)
      return {
        modules: labModules,
        prediction_templates: predictionTemplates,
      }
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

  createSession: async (data: { user: string; module_id: string; goal: string; confidence: number; focus?: string; session_method?: string; drill_id?: string; game_info?: GameInfo; observation_scope?: string; observed_team?: string; observed_team_id?: string; observed_team_name?: string; learning_area?: LearningArea; lab_mode?: LabMode; lab_template_id?: string; is_dummy?: boolean; isDummy?: boolean; dev_seed_version?: number }): Promise<Session> => {
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
    player_birth_year?: number
    player_notes?: string
    drill_id?: string
    drill_name?: string
    source?: ObservationSource
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
    source?: ObservationSource
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
  }): Promise<{ player: ObservationPlayerStats; observations: ObservationEntry[]; profile?: ObservationProfile }> => {
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

  getObservationProfiles: async (params?: {
    league?: string
    season?: string
    team_id?: string
    player_id?: string
  }): Promise<{ profiles: ObservationProfile[] }> => {
    const qs = new URLSearchParams()
    if (params?.league) qs.append('league', params.league)
    if (params?.season) qs.append('season', params.season)
    if (params?.team_id) qs.append('team_id', params.team_id)
    if (params?.player_id) qs.append('player_id', params.player_id)
    const query = qs.toString() ? `?${qs.toString()}` : ''

    const res = await fetch(buildUrl(`/observation-profiles${query}`), {
      headers: { ...authHeaders() }
    })
    if (!res.ok) throw new Error('Failed to fetch observation profiles')
    return res.json()
  },

  getObservationProfile: async (playerId: string, params?: { league?: string }): Promise<ObservationProfile> => {
    const qs = new URLSearchParams()
    if (params?.league) qs.append('league', params.league)
    const query = qs.toString() ? `?${qs.toString()}` : ''

    const res = await fetch(buildUrl(`/observation-profiles/${encodeURIComponent(playerId)}${query}`), {
      headers: { ...authHeaders() }
    })
    if (!res.ok) throw new Error('Failed to fetch observation profile')
    return res.json()
  },

  updateObservationProfile: async (
    playerId: string,
    payload: {
      player_birth_year?: number
      notes?: string
      summary?: Partial<ObservationSummary>
      source_catalog?: ObservationSource[]
    },
    params?: { league?: string }
  ): Promise<ObservationProfile> => {
    const qs = new URLSearchParams()
    if (params?.league) qs.append('league', params.league)
    const query = qs.toString() ? `?${qs.toString()}` : ''

    const res = await fetch(buildUrl(`/observation-profiles/${encodeURIComponent(playerId)}${query}`), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(payload)
    })
    if (!res.ok) throw new Error('Failed to update observation profile')
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
  },

  // RingAbout Scene Markers
  createScene: async (payload: SceneMarkerCreate): Promise<SceneMarker> => {
    const res = await fetch(buildUrl('/scenes'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(payload),
    })
    if (!res.ok) throw await readApiError(res, 'Failed to create scene marker')
    return res.json()
  },

  getScenes: async (params?: {
    league?: string
    season?: string
    team?: string
    status?: string
    track_id?: string
    drill_id?: string
    competition_phase?: string
    competition_unit_type?: string
    competition_unit_value?: string
    episode_season?: string
    source_type?: string
  }): Promise<{ scenes: SceneMarker[] }> => {
    const qs = new URLSearchParams()
    if (params?.league) qs.append('league', params.league)
    if (params?.season) qs.append('season', params.season)
    if (params?.team) qs.append('team', params.team)
    if (params?.status) qs.append('status', params.status)
    if (params?.track_id) qs.append('track_id', params.track_id)
    if (params?.drill_id) qs.append('drill_id', params.drill_id)
    if (params?.competition_phase) qs.append('competition_phase', params.competition_phase)
    if (params?.competition_unit_type) qs.append('competition_unit_type', params.competition_unit_type)
    if (params?.competition_unit_value) qs.append('competition_unit_value', params.competition_unit_value)
    if (params?.episode_season) qs.append('episode_season', params.episode_season)
    if (params?.source_type) qs.append('source_type', params.source_type)
    const query = qs.toString() ? `?${qs.toString()}` : ''
    const res = await fetch(buildUrl(`/scenes${query}`), {
      headers: { ...authHeaders() },
    })
    if (!res.ok) throw new Error('Failed to fetch scenes')
    return res.json()
  },

  deleteScene: async (sceneId: string): Promise<{ status: string; id: string }> => {
    const res = await fetch(buildUrl(`/scenes/${encodeURIComponent(sceneId)}`), {
      method: 'DELETE',
      headers: { ...authHeaders() },
    })
    if (!res.ok) throw new Error('Failed to delete scene')
    return res.json()
  },

  updateScene: async (sceneId: string, payload: SceneMarkerUpdate): Promise<SceneMarker> => {
    const res = await fetch(buildUrl(`/scenes/${encodeURIComponent(sceneId)}`), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(payload),
    })
    if (!res.ok) throw await readApiError(res, 'Failed to update scene')
    return res.json()
  },

  // Kaderimport Players
  getTeamPlayers: async (teamId: string, activeOnly: boolean = true): Promise<PlayersResponse> => {
    const qs = new URLSearchParams()
    if (!activeOnly) qs.append('active_only', 'false')
    const query = qs.toString() ? `?${qs.toString()}` : ''
    const res = await fetch(buildUrl(`/players/team/${encodeURIComponent(teamId)}${query}`), {
      headers: { ...authHeaders() }
    })
    if (!res.ok) throw new Error('Failed to fetch team players')
    return res.json()
  },

  importPlayers: async (teamId?: string): Promise<ImportResult> => {
    const qs = new URLSearchParams()
    if (teamId) qs.append('team_id', teamId)
    const query = qs.toString() ? `?${qs.toString()}` : ''
    const res = await fetch(buildUrl(`/players/import${query}`), {
      method: 'POST',
      headers: { ...authHeaders() }
    })
    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: 'Import fehlgeschlagen' }))
      const detail = error?.detail
      const message =
        (typeof detail === 'string' ? detail : detail?.error) ||
        error?.error ||
        'Failed to import players'
      throw new Error(message)
    }
    return res.json()
  },

  importAllPlayers: async (): Promise<ImportAllResult> => {
    const res = await fetch(buildUrl('/players/import-all'), {
      method: 'POST',
      headers: { ...authHeaders() }
    })
    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: 'Gesamtimport fehlgeschlagen' }))
      const detail = error?.detail
      const message =
        (typeof detail === 'string' ? detail : detail?.error) ||
        error?.error ||
        'Failed to import all players'
      throw new Error(message)
    }
    return res.json()
  },

  getImportableTeams: async (): Promise<TeamsListResponse> => {
    const res = await fetch(buildUrl('/players/importable-teams'), {
      headers: { ...authHeaders() }
    })
    if (!res.ok) throw new Error('Failed to fetch importable teams')
    return res.json()
  },

  getMe: async (): Promise<UserAccountPayload> => {
    const res = await fetch(buildUrl('/me'), {
      headers: { ...authHeaders() },
    })
    if (!res.ok) throw await readApiError(res, 'Profil konnte nicht geladen werden')
    return res.json()
  },

  getMyProfile: async (): Promise<UserProfileCustomization> => {
    const res = await fetch(buildUrl('/me/profile'), {
      headers: { ...authHeaders() },
    })
    if (!res.ok) throw await readApiError(res, 'Profil konnte nicht geladen werden')
    return res.json()
  },

  updateMyProfile: async (patch: Partial<UserProfileCustomization>): Promise<UserProfileCustomization> => {
    const res = await fetch(buildUrl('/me/profile'), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(patch),
    })
    if (!res.ok) throw await readApiError(res, 'Profil konnte nicht gespeichert werden')
    return res.json()
  },

  uploadMyAvatar: async (file: File): Promise<{ uploadUrl: string; profile: UserProfileCustomization }> => {
    const dataBase64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result || ''))
      reader.onerror = () => reject(new Error('Datei konnte nicht gelesen werden'))
      reader.readAsDataURL(file)
    })
    const res = await fetch(buildUrl('/me/avatar'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({
        filename: file.name,
        content_type: file.type || 'image/png',
        data_base64: dataBase64,
      }),
    })
    if (!res.ok) throw await readApiError(res, 'Avatar-Upload fehlgeschlagen')
    return res.json()
  },
}

/** Resolve uploaded asset paths against the API host (dev proxy or absolute API). */
export function resolveUploadUrl(path: string | null | undefined): string | null {
  if (!path) return null
  if (/^https?:\/\//i.test(path) || path.startsWith('blob:') || path.startsWith('data:')) return path
  if (path.startsWith('/uploads/')) {
    const envBase = import.meta.env.VITE_API_BASE as string | undefined
    if (envBase) {
      const origin = envBase.replace(/\/api\/?$/, '')
      return `${origin}${path}`
    }
    if (typeof window !== 'undefined') {
      const { hostname, origin } = window.location
      if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return `http://localhost:8000${path}`
      }
      return `${origin}${path}`
    }
  }
  return path
}