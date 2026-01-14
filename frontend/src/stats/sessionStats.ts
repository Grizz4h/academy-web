// Aggregates session statistics for the dashboard
// You can expand this logic as needed
export interface SessionStats {
  total: number;
  completed: number;
  active: number;
}

export function aggregateSessionStats(sessions: Array<{ state: string }>): SessionStats {
  const completed = sessions.filter(s => s.state === "COMPLETED").length;
  const active = sessions.filter(s => s.state !== "COMPLETED").length;
  return {
    total: sessions.length,
    completed,
    active
  };
}
