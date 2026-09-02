/** Leagues with imported schedule JSON + /api/games support. */
export const SCHEDULE_LEAGUES = ['DEL', 'DEL2', 'CHL', 'U20_DNL', 'NHL'] as const

export type ScheduleLeague = (typeof SCHEDULE_LEAGUES)[number]
