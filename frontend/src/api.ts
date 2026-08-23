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

export async function getRegistrationStatus(): Promise<{ allow_legacy_signup: boolean }> {
  const res = await fetch(buildUrl('/auth/registration'))
  if (!res.ok) return { allow_legacy_signup: false }
  return res.json()
}

// --- Auth-Header Helper ---
function authHeaders(): Record<string, string> {
  const token = localStorage.getItem('academy.token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}
// --- Auth ---
export async function login(
  username: string,
  password: string,
): Promise<{ token: string; username: string; rinq_user_id?: string; user_id?: string }> {
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
import type { MyEntitlementsPayload } from './features/entitlements/types'


// ==== Type Definitions ====
export interface Curriculum {
  tracks: Track[]
}

export interface Track {
  id: string
  title: string
  goal: string
  description?: string
  /** e.g. "foundation" for Track 0 — prefer metadata over id hardcodes */
  trackType?: string
  /** When false, live period microfeedback is not part of this track (Track 0 lessons). */
  requiresMicrofeedback?: boolean
  supportsMastery?: boolean
  foundationLabel?: string
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
  /** When false, module is hidden from active curriculum navigation. */
  active?: boolean
  /** Set by backend when drill configs are withheld (premium gate). */
  premium_locked?: boolean
  deprecated?: boolean
  deprecation_note?: string
  sidequest_category?: string
  evaluation?: {
    metrics: string[]
    reportType: string
  }
}

export type CurriculumModule = Module

export interface Drill {
  id: string
  title: string
  /** Stable short slug for scene asset / folder naming. */
  sceneSlug?: string
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
  order?: number
  period: number
  gameTime?: string
  predictedValue: string
  confidence: 'low' | 'medium' | 'high'
  predictionCues?: string[]
  context?: Record<string, string>
  lockedAt?: string
  actualValue?: string
  resolution?: PredictionResolution
  outcome?: Record<string, string>
  reflectionReads?: string[]
  alternativeSolution?: string
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
  evaluable?: number
  mostPredictedValue?: string
  mostActualValue?: string
  cueCounts?: Record<string, number>
  actualValueCounts?: Record<string, number>
  reflectionReadCounts?: Record<string, number>
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
  game_id?: string
  ai_reflection?: import('./features/reflection/types').StoredAiReflection
  location_verification?: import('./data/venues/types').SessionLocationVerification
}

export type DataQuality = 'verified' | 'plausible' | 'incomplete' | 'suspicious'

export interface GameScore {
  home: number
  away: number
  periods?: Array<{ home: number; away: number }>
}

export interface GameTeamStatMetric {
  label?: string
  home?: number | string | null
  away?: number | string | null
}

export interface GamePlayerStatRow {
  number?: string
  name: string
  position_group?: 'forward' | 'defense' | 'goalie' | string
  goals?: number | null
  assists?: number | null
  points?: number | null
  plus_minus?: number | null
  pim?: number | null
  sog?: number | null
  toi?: string | null
  saves?: number | null
  save_pct?: number | string | null
}

export interface GameTeamPlayerStats {
  team_id?: string
  team_name?: string
  players: GamePlayerStatRow[]
}

export interface CatalogGameStats {
  provider?: string
  imported_at?: string
  external_id?: string
  overview_url?: string
  boxscore_url?: string
  team?: Record<string, GameTeamStatMetric>
  players?: GameTeamPlayerStats[]
  warnings?: string[]
}

export interface CatalogGame {
  id: string
  league_id: string
  season_id: string
  phase_id?: string
  phase_label?: string
  matchday?: number
  date?: string
  time?: string
  home_team_id: string
  away_team_id: string
  home_team_name?: string
  away_team_name?: string
  /** Optional explicit venue. Falls back to the home team's default arena. */
  venue_id?: string | null
  venueId?: string | null
  status: 'scheduled' | 'live' | 'final' | string
  score?: GameScore | null
  stats?: CatalogGameStats | null
  source?: {
    provider?: string
    external_id?: string
    imported_at?: string
  }
  isDummy?: boolean
  is_dummy?: boolean
}

export interface DelDataStatus {
  season: string
  league: string
  rosters: {
    season: string
    teams_total: number
    teams_with_roster: number
    warnings_count: number
    teams: Array<{
      team_id: string
      name: string
      player_count: number
      imported_at?: string
      quality?: DataQuality
      warnings?: string[]
    }>
  }
  games: {
    season: string
    total: number
    by_status: Record<string, number>
    with_stats?: number
    final_without_stats?: number
    updated_at?: string
  }
  expected_teams: number
  issues: Array<{
    team_id: string
    name: string
    quality?: DataQuality
    warnings?: string[]
  }>
}

export interface GameInfo {
  team?: string
  team_home: string
  team_away: string
  home_team_id?: string
  away_team_id?: string
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
  game_id?: string
  is_dummy?: boolean
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
  default_season?: string
  available_seasons?: string[]
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
    catalog_id?: string
    slug: string
    name: string
    league: string
    url: string
    overview_url?: string
    kader_available?: boolean
    kader_note?: string
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
  unlockedAchievements: Record<string, { id: string; unlockedAt: string; sourceEventId?: string }>
  unlockedMasteries: Record<string, any>
  processedSessions: Record<string, { sessionId: string; grantedAt: string; pux: number }>
  xp?: number
  processedEvents?: Record<string, { eventId: string; processedAt: string; grantedXp: number; grantedPux: number }>
  unlockedCosmetics?: Record<string, any>
  activityLog?: Array<Record<string, any>>
  unlockHistory?: Array<Record<string, any>>
  bootstrapCompletedAt?: string | null
  lastUpdatedAt?: string | null
  favoriteCosmeticIds?: string[]
  puxTransactions?: Array<Record<string, any>>
  completedCollections?: Record<string, any>
  masteryMilestoneUnlocks?: Record<string, any>
  featuredAchievementId?: string | null
  featuredMasteryCoinId?: string | null
  progressionPuxGranted?: number
  challengeProgress?: Record<string, any>
  challengeRotation?: Record<string, any> | null
}

export interface RewardApplyRequest {
  session_id?: string | null
  event_id?: string | null
  evaluated_at: string
  granted_pux: number
  granted_xp?: number
  reward_events: Array<Record<string, any>>
  unlocked_achievements: Array<{ id: string; unlockedAt: string; sourceEventId?: string }>
  unlocked_masteries: Array<Record<string, any>>
  unlocked_cosmetics?: Array<Record<string, any>>
  unlock_history?: Array<Record<string, any>>
  activity_events?: Array<Record<string, any>>
  bootstrap_completed_at?: string | null
  replace_derived?: boolean
  favorite_cosmetic_ids?: string[] | null
  mark_cosmetics_seen?: string[]
  pux_transactions?: Array<Record<string, any>>
  completed_collections?: Array<Record<string, any>>
  mastery_milestone_unlocks?: Array<Record<string, any>>
  progression_pux_granted?: number | null
  skip_idempotency?: boolean
  processed_event_ids?: string[]
  challenge_progress?: Record<string, unknown>
  challenge_rotation?: Record<string, unknown> | null
  venue_visits?: Record<string, unknown> | null
}

export interface RewardApplyResponse {
  state: RewardServerState
  applied: boolean
  granted_pux: number
  granted_xp?: number
  reward_events: Array<Record<string, any>>
  reason?: string
}

export interface SceneSource {
  type: 'drill' | 'manual'
  session_id?: string | null
  drill_id?: string | null
  observation_id?: string | null
}

export type SceneMetadataStatus = 'incomplete' | 'complete'
export type SceneWorkflowStatus = 'NEW' | 'PIPELINE' | 'ASSIGNED'

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
  status?: SceneWorkflowStatus | string
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
  status?: SceneWorkflowStatus | string
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
  status?: SceneWorkflowStatus | string
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
  default_season?: string
  available_seasons?: string[]
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
    const headers = authHeaders()
    try {
      const res = await fetch(primaryUrl, {
        headers: Object.keys(headers).length ? headers : undefined,
      })
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

  createSession: async (data: { user: string; module_id: string; goal: string; confidence: number; focus?: string; session_method?: string; drill_id?: string; game_info?: GameInfo; game_id?: string; observation_scope?: string; observed_team?: string; observed_team_id?: string; observed_team_name?: string; learning_area?: LearningArea; lab_mode?: LabMode; lab_template_id?: string; is_dummy?: boolean; isDummy?: boolean; dev_seed_version?: number; location_verification?: import('./data/venues/types').SessionLocationVerification }): Promise<Session> => {
    const res = await fetch(buildUrl('/sessions'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(data)
    })
    if (!res.ok) {
      throw await readApiError(res, 'Session konnte nicht gestartet werden')
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

  createSessionReflection: async (
    sessionId: string,
  ): Promise<{ reflection: NonNullable<Session['ai_reflection']>; cached: boolean }> => {
    const res = await fetch(buildUrl(`/sessions/${encodeURIComponent(sessionId)}/reflection`), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
    })
    if (!res.ok) {
      let detail = 'KI-Reflexion konnte nicht erstellt werden.'
      try {
        const payload = await res.json()
        if (typeof payload?.detail === 'string') detail = payload.detail
      } catch {
        // ignore parse errors
      }
      throw new Error(detail)
    }
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
  getTeams: async (league?: string, season?: string): Promise<TeamsResponse> => {
    const params = new URLSearchParams()
    if (league) params.set('league', league)
    if (season) params.set('season', season)
    const query = params.toString() ? `?${params.toString()}` : ''
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
  getTeamPlayers: async (
    teamId: string,
    activeOnly: boolean = true,
    options?: { season?: string; league?: string; allowFallback?: boolean },
  ): Promise<PlayersResponse & { season?: string; quality?: DataQuality; warnings?: string[]; fallback?: boolean; fallback_season?: string }> => {
    const qs = new URLSearchParams()
    if (!activeOnly) qs.append('active_only', 'false')
    if (options?.season) qs.append('season', options.season)
    if (options?.league) qs.append('league', options.league)
    if (options?.allowFallback) qs.append('allow_fallback', 'true')
    const query = qs.toString() ? `?${qs.toString()}` : ''
    const res = await fetch(buildUrl(`/players/team/${encodeURIComponent(teamId)}${query}`), {
      headers: { ...authHeaders() }
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      const detail = err?.detail
      const message = typeof detail === 'string' ? detail : detail?.message || detail?.error
      throw new Error(message || 'Failed to fetch team players')
    }
    return res.json()
  },

  getGames: async (params: {
    league: string
    season: string
    team_id?: string
    phase_id?: string
    status?: string
  }): Promise<{ games: CatalogGame[]; total: number; season: string; league: string }> => {
    const qs = new URLSearchParams()
    qs.append('league', params.league)
    qs.append('season', params.season)
    if (params.team_id) qs.append('team_id', params.team_id)
    if (params.phase_id) qs.append('phase_id', params.phase_id)
    if (params.status) qs.append('status', params.status)
    const res = await fetch(buildUrl(`/games?${qs.toString()}`), {
      headers: { ...authHeaders() },
    })
    if (!res.ok) throw new Error('Failed to fetch games')
    return res.json()
  },

  getGame: async (gameId: string): Promise<CatalogGame> => {
    const res = await fetch(buildUrl(`/games/${encodeURIComponent(gameId)}`), {
      headers: { ...authHeaders() },
    })
    if (!res.ok) throw new Error('Failed to fetch game')
    return res.json()
  },

  getDelDataStatus: async (season: string, league: string = 'DEL'): Promise<DelDataStatus> => {
    const qs = new URLSearchParams({ season, league })
    const res = await fetch(buildUrl(`/del-data/status?${qs.toString()}`), {
      headers: { ...authHeaders() },
    })
    if (!res.ok) throw new Error('Failed to fetch DEL data status')
    return res.json()
  },

  importDelSchedule: async (season: string, league: string = 'DEL') => {
    const qs = new URLSearchParams({ season, league })
    const res = await fetch(buildUrl(`/del-data/import-schedule?${qs.toString()}`), {
      method: 'POST',
      headers: { ...authHeaders() },
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      const detail = err?.detail
      if (res.status === 404 && typeof detail === 'string' && detail === 'Not Found') {
        throw new Error('Backend-Kennen die Route noch nicht — bitte Backend neu starten (start_all.sh).')
      }
      const message =
        (typeof detail === 'string' ? detail : detail?.error) ||
        (Array.isArray(detail?.errors) ? detail.errors.join(' · ') : undefined) ||
        `Spielplan-Import fehlgeschlagen (HTTP ${res.status})`
      throw new Error(message)
    }
    return res.json()
  },

  migrateDelRosters: async (season: string, league: string = 'DEL') => {
    const qs = new URLSearchParams({ season, league })
    const res = await fetch(buildUrl(`/del-data/migrate-rosters?${qs.toString()}`), {
      method: 'POST',
      headers: { ...authHeaders() },
    })
    if (!res.ok) throw new Error('Roster-Migration fehlgeschlagen')
    return res.json()
  },

  importDelGameStats: async (gameId: string) => {
    const qs = new URLSearchParams({ game_id: gameId })
    const res = await fetch(buildUrl(`/del-data/import-game-stats?${qs.toString()}`), {
      method: 'POST',
      headers: { ...authHeaders() },
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      const detail = err?.detail
      if (res.status === 404 && (typeof detail === 'string' ? detail : detail?.error) === 'Not Found') {
        throw new Error('Backend kennt Spielstats-Route noch nicht — bitte Backend neu starten (./start_all.sh oder ./start_backend.sh).')
      }
      const message =
        (typeof detail === 'string' ? detail : detail?.message || detail?.error) ||
        (Array.isArray(detail?.errors) ? detail.errors.join(' · ') : undefined) ||
        `Spielstats-Import fehlgeschlagen (HTTP ${res.status})`
      throw new Error(message)
    }
    return res.json()
  },

  importDelGameStatsBatch: async (params: {
    season: string
    league?: string
    limit?: number
    skipExisting?: boolean
  }) => {
    const qs = new URLSearchParams({
      season: params.season,
      league: params.league || 'DEL',
      limit: String(params.limit ?? 5),
      skip_existing: String(params.skipExisting ?? true),
    })
    const res = await fetch(buildUrl(`/del-data/import-game-stats-batch?${qs.toString()}`), {
      method: 'POST',
      headers: { ...authHeaders() },
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      const detail = err?.detail
      if (res.status === 404 && (typeof detail === 'string' ? detail : detail?.error) === 'Not Found') {
        throw new Error('Backend kennt Spielstats-Route noch nicht — bitte Backend neu starten (./start_all.sh oder ./start_backend.sh).')
      }
      const message =
        (typeof detail === 'string' ? detail : detail?.error) ||
        (Array.isArray(detail?.errors) ? detail.errors.join(' · ') : undefined) ||
        `Batch-Stats-Import fehlgeschlagen (HTTP ${res.status})`
      throw new Error(message)
    }
    return res.json()
  },

  importPlayers: async (teamId?: string, season?: string, league: string = 'DEL'): Promise<ImportResult> => {
    const qs = new URLSearchParams()
    if (teamId) qs.append('team_id', teamId)
    if (season) qs.append('season', season)
    if (league) qs.append('league', league)
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

  importAllPlayers: async (season?: string, league: string = 'DEL'): Promise<ImportAllResult> => {
    const qs = new URLSearchParams()
    if (season) qs.append('season', season)
    if (league) qs.append('league', league)
    const query = qs.toString() ? `?${qs.toString()}` : ''
    const res = await fetch(buildUrl(`/players/import-all${query}`), {
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

  getMyEntitlements: async (): Promise<MyEntitlementsPayload> => {
    const res = await fetch(buildUrl('/me/entitlements'), {
      headers: { ...authHeaders() },
    })
    if (!res.ok) throw await readApiError(res, 'Entitlements konnten nicht geladen werden')
    return res.json()
  },

  createBillingCheckout: async (): Promise<{ ok: boolean; checkout_url: string; session_id: string }> => {
    const res = await fetch(buildUrl('/billing/checkout'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
    })
    if (!res.ok) throw await readApiError(res, 'Checkout konnte nicht gestartet werden')
    return res.json()
  },

  getMyBilling: async (): Promise<{
    rinq_user_id: string
    plan: Record<string, unknown> | null
    subscriptions: Array<Record<string, unknown>>
  }> => {
    const res = await fetch(buildUrl('/me/billing'), {
      headers: { ...authHeaders() },
    })
    if (!res.ok) throw await readApiError(res, 'Billing-Status konnte nicht geladen werden')
    return res.json()
  },

  linkGoogleAccount: async (accessToken: string): Promise<{
    ok: boolean
    rinq_user_id: string
    google_linked: boolean
    auth_providers: string[]
  }> => {
    const res = await fetch(buildUrl('/me/auth/link/google'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders(),
      },
      body: JSON.stringify({ access_token: accessToken }),
    })
    if (!res.ok) throw await readApiError(res, 'Google-Konto konnte nicht verknüpft werden')
    return res.json()
  },

  unlinkAuthProvider: async (provider: string): Promise<{
    ok: boolean
    auth_providers: string[]
    google_linked: boolean
  }> => {
    const res = await fetch(buildUrl(`/me/auth/links/${encodeURIComponent(provider)}`), {
      method: 'DELETE',
      headers: { ...authHeaders() },
    })
    if (!res.ok) throw await readApiError(res, 'Login-Methode konnte nicht getrennt werden')
    return res.json()
  },

  exportMyData: async (): Promise<Blob> => {
    const res = await fetch(buildUrl('/me/export'), {
      headers: { ...authHeaders() },
    })
    if (!res.ok) throw await readApiError(res, 'Export fehlgeschlagen')
    return res.blob()
  },

  deleteMyAccount: async (payload: { confirm: string; password?: string }): Promise<{ ok: boolean }> => {
    const res = await fetch(buildUrl('/me/delete'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders(),
      },
      body: JSON.stringify(payload),
    })
    if (!res.ok) throw await readApiError(res, 'Account konnte nicht gelöscht werden')
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