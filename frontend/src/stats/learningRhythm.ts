import type { Session } from '../api';

export type WeeklyActivity = {
  weekStart: string;
  weekEnd: string;
  completedSessions: number;
  activityLevel: 0 | 1 | 2 | 3 | 4;
  isCurrentWeek: boolean;
  isoWeek: number;
};

export type LearningRhythmStatus =
  | 'low_data'
  | 'stable_active'
  | 'reentry'
  | 'irregular'
  | 'quiet_phase'
  | 'neutral';

export type LearningRhythmSummary = {
  activeWeeksLast4: number;
  activeWeeksInPeriod: number;
  totalSessionsInPeriod: number;
  averageSessionsPerActiveWeek: number | null;
  status: LearningRhythmStatus;
  statusText: string;
};

type BuildWeeklyActivityOptions = {
  weeks?: number;
  weekStartsOn?: 0 | 1;
  now?: Date;
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function toLocalDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(base: Date, days: number): Date {
  const next = new Date(base);
  next.setDate(next.getDate() + days);
  return next;
}

function startOfWeekLocal(date: Date, weekStartsOn: 0 | 1): Date {
  const dayStart = startOfLocalDay(date);
  const jsDay = dayStart.getDay();
  const diff = (jsDay - weekStartsOn + 7) % 7;
  return addDays(dayStart, -diff);
}

function toIsoWeekNumber(date: Date): number {
  const local = startOfLocalDay(date);
  const day = (local.getDay() + 6) % 7;
  const thursday = addDays(local, 3 - day);
  const firstThursday = new Date(thursday.getFullYear(), 0, 4);
  const firstThursdayDay = (firstThursday.getDay() + 6) % 7;
  const weekOneThursday = addDays(firstThursday, 3 - firstThursdayDay);
  return 1 + Math.round((thursday.getTime() - weekOneThursday.getTime()) / (7 * MS_PER_DAY));
}

function isCompletedSession(session: Session): boolean {
  return String(session.state).toUpperCase() === 'COMPLETED';
}

function getSessionActivityDate(session: Session): Date | null {
  const preferredTimestamp = session.post?.completed_at || session.created_at;
  const parsed = new Date(preferredTimestamp);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}

export function buildWeeklyActivity(
  sessions: Session[],
  options: BuildWeeklyActivityOptions = {}
): WeeklyActivity[] {
  const weeks = Math.max(1, options.weeks ?? 8);
  const weekStartsOn = options.weekStartsOn ?? 1;
  const now = options.now ?? new Date();

  const currentWeekStart = startOfWeekLocal(now, weekStartsOn);
  const firstWeekStart = addDays(currentWeekStart, -(weeks - 1) * 7);

  const countsByWeekStart = new Map<string, number>();
  for (const session of sessions) {
    if (!isCompletedSession(session)) continue;
    const sessionDate = getSessionActivityDate(session);
    if (!sessionDate) continue;
    const sessionWeekStart = startOfWeekLocal(sessionDate, weekStartsOn);
    if (sessionWeekStart < firstWeekStart || sessionWeekStart > currentWeekStart) continue;
    const key = toLocalDateKey(sessionWeekStart);
    countsByWeekStart.set(key, (countsByWeekStart.get(key) ?? 0) + 1);
  }

  const weeklyActivity: WeeklyActivity[] = [];
  for (let offset = 0; offset < weeks; offset += 1) {
    const weekStartDate = addDays(firstWeekStart, offset * 7);
    const weekEndDate = addDays(weekStartDate, 6);
    const weekKey = toLocalDateKey(weekStartDate);
    const completedSessions = countsByWeekStart.get(weekKey) ?? 0;

    weeklyActivity.push({
      weekStart: toLocalDateKey(weekStartDate),
      weekEnd: toLocalDateKey(weekEndDate),
      completedSessions,
      activityLevel: Math.min(completedSessions, 4) as 0 | 1 | 2 | 3 | 4,
      isCurrentWeek: offset === weeks - 1,
      isoWeek: toIsoWeekNumber(weekStartDate),
    });
  }

  return weeklyActivity;
}

export function summarizeLearningRhythm(weekly: WeeklyActivity[]): LearningRhythmSummary {
  const last4 = weekly.slice(-4);
  const activeWeeksLast4 = last4.filter((week) => week.completedSessions > 0).length;
  const activeWeeksInPeriod = weekly.filter((week) => week.completedSessions > 0).length;
  const totalSessionsInPeriod = weekly.reduce((sum, week) => sum + week.completedSessions, 0);

  const averageSessionsPerActiveWeek =
    activeWeeksInPeriod > 0 ? totalSessionsInPeriod / activeWeeksInPeriod : null;

  const hasVeryLittleData = totalSessionsInPeriod < 2;

  let isReentry = false;
  const candidateIndices = [weekly.length - 1, weekly.length - 2].filter((index) => index >= 0);
  for (const index of candidateIndices) {
    if ((weekly[index]?.completedSessions ?? 0) === 0) continue;
    const minus1 = weekly[index - 1];
    const minus2 = weekly[index - 2];
    if (minus1 && minus2 && minus1.completedSessions === 0 && minus2.completedSessions === 0) {
      isReentry = true;
      break;
    }
  }

  let status: LearningRhythmStatus = 'neutral';
  let statusText = 'Dein Lernrhythmus entwickelt sich über mehrere Wochen.';

  if (hasVeryLittleData) {
    status = 'low_data';
    statusText = 'Mit weiteren Sessions wird hier dein Lernrhythmus sichtbar.';
  } else if (isReentry) {
    status = 'reentry';
    statusText = 'Du bist nach einer ruhigeren Phase wieder eingestiegen.';
  } else if (activeWeeksLast4 >= 3) {
    status = 'stable_active';
    statusText = 'Du bist aktuell regelmäßig im Lernrhythmus.';
  } else if (activeWeeksLast4 >= 1 && activeWeeksLast4 <= 2) {
    status = 'irregular';
    statusText = 'Deine Aktivität verteilt sich aktuell auf einzelne Wochen.';
  } else if (activeWeeksLast4 === 0 && totalSessionsInPeriod > 0) {
    status = 'quiet_phase';
    statusText = 'Dein Lernrhythmus ist zuletzt etwas ruhiger geworden.';
  }

  return {
    activeWeeksLast4,
    activeWeeksInPeriod,
    totalSessionsInPeriod,
    averageSessionsPerActiveWeek,
    status,
    statusText,
  };
}
