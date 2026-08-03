import type { Session } from '../../api'

export function getSessionRoute(session: Pick<Session, 'id' | 'learning_area' | 'lab_mode'>): string {
  if (session.learning_area === 'lab' && session.lab_mode === 'predict') {
    return `/lab/predict/session/${session.id}`
  }
  return `/session/${session.id}`
}
