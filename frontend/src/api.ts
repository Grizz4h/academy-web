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
    goal: string
    watch_for: string[]
    how_to: string[]
    learning_hint: string
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
    glossary?: {
      [term: string]: string
    }
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
  current_phase?: string  // For session continuation
  created_at: string
  drills: Drill[]
  progress: {
    current_drill_index: number
    completed_drills: string[]
  }
  checkins: Checkin[]
  drafts?: Record<string, any>  // Draft answers for continuation
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
}

export interface GameInfo {
  team_home: string
  team_away: string
  date: string
  league: string
}

export interface Checkin {
  phase: string
  answers: any
  feedback?: string
  next_task?: string
  timestamp: string
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
    const res = await fetch(buildUrl(`/sessions?${params}`))
    if (!res.ok) throw new Error('Failed to fetch sessions')
    return res.json()
  },

  createSession: async (data: { user: string; module_id: string; goal: string; confidence: number; focus?: string; session_method?: string; drill_id?: string; game_info?: GameInfo }): Promise<Session> => {
    const res = await fetch(buildUrl('/sessions'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
    const res = await fetch(buildUrl(`/sessions/${encodeURIComponent(id)}`))
    if (!res.ok) throw new Error('Failed to fetch session')
    return res.json()
  },

  saveCheckin: async (id: string, data: { phase: string; answers: any; feedback?: string; next_task?: string }): Promise<Session> => {
    const res = await fetch(buildUrl(`/sessions/${encodeURIComponent(id)}/checkins`), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    if (!res.ok) throw new Error('Failed to save checkin')
    return res.json()
  },

  updateSession: async (id: string, updates: Partial<Session>): Promise<Session> => {
    const res = await fetch(buildUrl(`/sessions/${encodeURIComponent(id)}`), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    })
    if (!res.ok) throw new Error('Failed to update session')
    return res.json()
  },

  completeSession: async (id: string, data: { summary: string; unclear?: string; next_module?: string; helpfulness: number }): Promise<Session> => {
    const res = await fetch(buildUrl(`/sessions/${encodeURIComponent(id)}/post`), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    if (!res.ok) throw new Error('Failed to complete session')
    return res.json()
  },

  abortSession: async (id: string, data: { reason: string; note?: string }): Promise<Session> => {
    const res = await fetch(buildUrl(`/sessions/${encodeURIComponent(id)}/abort`), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    if (!res.ok) throw new Error('Failed to abort session')
    return res.json()
  },

  deleteSession: async (id: string): Promise<{ status: string; id: string }> => {
    const res = await fetch(buildUrl(`/sessions/${encodeURIComponent(id)}`), {
      method: 'DELETE'
    })
    if (!res.ok) throw new Error('Failed to delete session')
    return res.json()
  },

  deleteCheckin: async (sessionId: string, checkinIndex: number): Promise<Session> => {
    const res = await fetch(buildUrl(`/sessions/${encodeURIComponent(sessionId)}/checkins/${checkinIndex}`), {
      method: 'DELETE'
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
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(drafts)
    })
    if (!res.ok) throw new Error('Failed to save drafts')
    return res.json()
  },

  // Update session phase for continuation
  updateSessionPhase: async (sessionId: string, phaseData: {phase?: string, state?: string}): Promise<Session> => {
    const res = await fetch(buildUrl(`/sessions/${encodeURIComponent(sessionId)}/phase`), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(phaseData)
    })
    if (!res.ok) throw new Error('Failed to update session phase')
    return res.json()
  },

  // Teams
  getTeams: async (): Promise<TeamsResponse> => {
    const res = await fetch(buildUrl('/teams'))
    if (!res.ok) throw new Error('Failed to fetch teams')
    return res.json()
  }
}