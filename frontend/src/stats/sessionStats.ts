import { getRealSessions } from '../utils/sessionEligibility'

// Aggregates session statistics for the dashboard
// You can expand this logic as needed
export interface SessionStats {
  total: number;
  completed: number;
  active: number;
}

export function aggregateSessionStats(
  sessions: Array<{ state: string; is_dummy?: boolean; isDummy?: boolean }>,
): SessionStats {
  const real = getRealSessions(sessions)
  const completed = real.filter(s => s.state === "COMPLETED").length;
  const active = real.filter(s => s.state !== "COMPLETED").length;
  return {
    total: real.length,
    completed,
    active
  };
}
