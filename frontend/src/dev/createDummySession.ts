import { api } from '../api'
import type { Curriculum, GameInfo, Session } from '../api'
import { getTeamNamesForLeague } from '../data/teamsByLeague'
import { getCompetitionConfig, formatCompetitionContext } from '../data/competitionConfig'
import { defaultDelSetupSeason } from '../stats/seasonNormalization'
import { getSessionRoute } from '../features/lab/sessionRouting'
import { isDummySession } from '../utils/sessionEligibility'

export const DEV_SEED_VERSION = 1

export type CreateDummySessionInput = {
	user: string
	drillId: string
	moduleId?: string
	curriculum?: Curriculum | null
}

export type DrillModuleRef = {
	moduleId: string
	moduleTitle: string
	drillId: string
	drillTitle: string
	drillType?: string
	trackType?: string
	defaultFocus?: string
	recommendedSessionMethod?: string
}

export function findDrillModuleRef(
	curriculum: Curriculum | null | undefined,
	drillId: string,
	preferredModuleId?: string,
): DrillModuleRef | null {
	if (!curriculum?.tracks || !drillId) return null

	const matches: DrillModuleRef[] = []
	for (const track of curriculum.tracks) {
		for (const module of track.modules || []) {
			for (const drill of module.drills || []) {
				if (drill.id !== drillId) continue
				matches.push({
					moduleId: module.id,
					moduleTitle: module.title,
					drillId: drill.id,
					drillTitle: drill.title,
					drillType: drill.drill_type,
					trackType: track.trackType,
					defaultFocus: (module as any).defaultFocus,
					recommendedSessionMethod: (module as any).recommendedSessionMethod,
				})
			}
		}
	}

	if (matches.length === 0) return null
	if (preferredModuleId) {
		const preferred = matches.find((entry) => entry.moduleId === preferredModuleId)
		if (preferred) return preferred
	}
	return matches[0]
}

function buildValidDevGameInfo(): { gameInfo: GameInfo; observedTeam: string } {
	const league = 'DEL'
	const season = defaultDelSetupSeason()
	const teams = getTeamNamesForLeague(league, season)
	const teamHome = teams[1] || teams[0] || 'Adler Mannheim'
	const teamAway = teams.find((name) => name !== teamHome) || teams[0] || 'EHC Red Bull München'
	const observedTeam = teamHome
	const competition = getCompetitionConfig(league)
	const phase = competition?.phases[0]

	const gameInfo: GameInfo = {
		league,
		team_home: teamHome,
		team_away: teamAway,
		observed_team: observedTeam,
		date: new Date().toISOString(),
		season,
	}

	if (phase) {
		const unitValue = String(phase.unit.min)
		gameInfo.competition_phase = phase.id
		gameInfo.competition_phase_label = phase.label
		gameInfo.competition_unit_type = phase.unit.type
		gameInfo.competition_unit_label = phase.unit.label
		gameInfo.competition_unit_value = unitValue
		gameInfo.matchday = formatCompetitionContext({
			league,
			season,
			competition_phase: phase.id,
			competition_phase_label: phase.label,
			competition_unit_label: phase.unit.label,
			competition_unit_value: unitValue,
		})
	}

	return { gameInfo, observedTeam }
}

/**
 * Builds a fully valid createSession payload for the selected drill.
 * Uses real catalog teams/competition values so lookups stay intact.
 */
export function buildDummySessionPayload(input: CreateDummySessionInput & { drillRef: DrillModuleRef }) {
	const { user, drillRef } = input
	const { gameInfo, observedTeam } = buildValidDevGameInfo()

	return {
		user: user.trim(),
		module_id: drillRef.moduleId,
		goal: `DEV · Dummy · ${drillRef.drillId} · ${drillRef.drillTitle}`,
		confidence: 3,
		observation_scope:
			drillRef.trackType === 'foundation' || drillRef.drillType === 'foundation_lesson'
				? 'LESSON'
				: 'FULL_GAME',
		focus: drillRef.defaultFocus,
		session_method: drillRef.recommendedSessionMethod || 'live_watch',
		drill_id: drillRef.drillId,
		game_info: gameInfo,
		observed_team: observedTeam,
		observed_team_name: observedTeam,
		is_dummy: true,
		dev_seed_version: DEV_SEED_VERSION,
	}
}

/** Creates a persisted dummy session via the normal session creation pipeline. */
export async function createDummySessionForDrill(input: CreateDummySessionInput): Promise<Session> {
	const drillRef = findDrillModuleRef(input.curriculum, input.drillId, input.moduleId)
	if (!drillRef) {
		throw new Error(`Drill nicht gefunden: ${input.drillId}`)
	}
	if (!input.user?.trim()) {
		throw new Error('Kein Benutzer angemeldet.')
	}

	const payload = buildDummySessionPayload({ ...input, drillRef })
	const session = await api.createSession(payload)

	// Safety net: if backend ignored/stripped the flag (stale process), force-persist it.
	if (!isDummySession(session)) {
		return api.updateSession(session.id, {
			is_dummy: true,
			isDummy: true,
			dev_seed_version: DEV_SEED_VERSION,
		})
	}

	return session
}

export function getDummySessionPath(session: Session): string {
	return getSessionRoute(session)
}

export function sceneBelongsToSession(scene: any, sessionId: string): boolean {
	if (!scene || !sessionId) return false
	if (scene.session_id === sessionId) return true
	const source = scene.source || {}
	return source.session_id === sessionId
}

/**
 * Deletes all dummy sessions for the current user and their linked drill scenes.
 * Uses existing deleteSession / deleteScene APIs (session delete also cascades on backend).
 */
export async function deleteAllDummySessions(sessions: Session[]): Promise<{ deletedSessions: number; deletedScenes: number }> {
	const dummies = sessions.filter(isDummySession)
	if (dummies.length === 0) return { deletedSessions: 0, deletedScenes: 0 }

	let deletedScenes = 0
	const scenesResponse = await api.getScenes().catch(() => ({ scenes: [] as any[] }))
	const scenes = Array.isArray(scenesResponse?.scenes) ? scenesResponse.scenes : []
	const dummyIds = new Set(dummies.map((session) => session.id))

	for (const scene of scenes) {
		const sessionId = scene?.session_id || scene?.source?.session_id
		if (!sessionId || !dummyIds.has(sessionId)) continue
		// Only remove scenes that originated from a drill/session capture.
		const sourceType = String(scene?.source?.type || '').toLowerCase()
		if (sourceType && sourceType !== 'drill') continue
		const sceneId = scene.id || scene.scene_id
		if (!sceneId) continue
		try {
			await api.deleteScene(sceneId)
			deletedScenes += 1
		} catch {
			// Session cascade may already remove them; continue.
		}
	}

	for (const session of dummies) {
		await api.deleteSession(session.id)
	}

	return { deletedSessions: dummies.length, deletedScenes }
}
