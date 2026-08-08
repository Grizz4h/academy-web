import type { Session } from '../api'

/** Technical truth for dummy/test sessions. Missing flag => real session. */
export function isDummySession(session: { is_dummy?: boolean; isDummy?: boolean } | null | undefined): boolean {
	if (!session) return false
	return session.is_dummy === true || session.isDummy === true
}

export function isRealSession(session: { is_dummy?: boolean; isDummy?: boolean } | null | undefined): boolean {
	return !isDummySession(session)
}

/** Sessions that may affect XP, achievements, mastery, track progress, etc. */
export function isProgressionEligibleSession(
	session: { is_dummy?: boolean; isDummy?: boolean; state?: string } | null | undefined,
): boolean {
	return isRealSession(session)
}

export function getRealSessions<T extends { is_dummy?: boolean; isDummy?: boolean }>(sessions: T[] | null | undefined): T[] {
	if (!Array.isArray(sessions)) return []
	return sessions.filter(isRealSession)
}

export function getDummySessions<T extends { is_dummy?: boolean; isDummy?: boolean }>(sessions: T[] | null | undefined): T[] {
	if (!Array.isArray(sessions)) return []
	return sessions.filter(isDummySession)
}

export function countDummySessions(sessions: Session[] | null | undefined): number {
	return getDummySessions(sessions).length
}
