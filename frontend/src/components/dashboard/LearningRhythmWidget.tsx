import { useMemo, useState } from 'react';
import type { Session } from '../../api';
import {
  buildWeeklyActivity,
  summarizeLearningRhythm,
  type WeeklyActivity,
} from '../../stats/learningRhythm';
import styles from './LearningRhythmWidget.module.css';

export type LearningRhythmWidgetProps = {
  sessions: Session[];
  weeks?: number;
  showAverage?: boolean;
  showStatus?: boolean;
  compact?: boolean;
};

function formatSessionsText(completedSessions: number): string {
  if (completedSessions >= 4) return '4+ abgeschlossene Sessions';
  if (completedSessions === 1) return '1 abgeschlossene Session';
  return `${completedSessions} abgeschlossene Sessions`;
}

function weekDetailText(week: WeeklyActivity): string {
  return `KW ${week.isoWeek} - ${formatSessionsText(week.completedSessions)}`;
}

export function LearningRhythmWidget({
  sessions,
  weeks = 8,
  showAverage = true,
  showStatus = true,
  compact = true,
}: LearningRhythmWidgetProps) {
  const weekly = useMemo(() => buildWeeklyActivity(sessions, { weeks, weekStartsOn: 1 }), [sessions, weeks]);
  const summary = useMemo(() => summarizeLearningRhythm(weekly), [weekly]);
  const [selectedIndex, setSelectedIndex] = useState(() => Math.max(weekly.length - 1, 0));

  const safeSelectedIndex = Math.min(Math.max(selectedIndex, 0), Math.max(weekly.length - 1, 0));
  const selectedWeek = weekly[safeSelectedIndex];
  const hasAnyActivity = summary.totalSessionsInPeriod > 0;

  const leftLabel = `Vor ${Math.max(weeks - 1, 0)} W.`;
  const middleLabel = weeks > 2 ? `Vor ${Math.floor((weeks - 1) / 2)} W.` : '';

  return (
    <div className={`${styles.widget} ${compact ? styles.compact : ''}`}>
      <h2 className={styles.title}>Lernrhythmus</h2>

      {hasAnyActivity ? (
        <p className={styles.activeWeeks}>{summary.activeWeeksLast4} von 4 Wochen aktiv</p>
      ) : (
        <div className={styles.emptyState}>
          <p className={styles.emptyTitle}>Noch keine Aktivität</p>
          <p className={styles.emptyDescription}>
            Sobald du Sessions abschließt, wird hier dein Wochenrhythmus sichtbar.
          </p>
        </div>
      )}

      <div className={styles.barsGrid} style={{ gridTemplateColumns: `repeat(${weeks}, minmax(0, 1fr))` }}>
        {weekly.map((week, index) => (
          <button
            key={week.weekStart}
            type="button"
            className={`${styles.barButton} ${week.isCurrentWeek ? styles.currentWeek : ''} ${safeSelectedIndex === index ? styles.selected : ''}`}
            onClick={() => setSelectedIndex(index)}
            title={`Woche ${week.isoWeek}\n${formatSessionsText(week.completedSessions)}`}
            aria-label={`Woche ${week.isoWeek}, ${formatSessionsText(week.completedSessions)}`}
          >
            <span className={styles.barTrack}>
              <span
                className={`${styles.barFill} ${styles[`level${week.activityLevel}` as const]}`}
                aria-hidden="true"
              />
            </span>
          </button>
        ))}
      </div>

      <div className={styles.axisLabels}>
        <span>{leftLabel}</span>
        <span>{middleLabel}</span>
        <span>Jetzt</span>
      </div>

      {selectedWeek ? <p className={styles.weekDetail}>{weekDetailText(selectedWeek)}</p> : null}

      {showAverage && hasAnyActivity ? (
        summary.averageSessionsPerActiveWeek !== null ? (
          <p className={styles.average}>
            Ø {summary.averageSessionsPerActiveWeek.toLocaleString('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} Sessions pro aktiver Woche
          </p>
        ) : (
          <p className={styles.average}>Noch keine Aktivität</p>
        )
      ) : null}

      {showStatus ? <p className={styles.status}>{summary.statusText}</p> : null}
    </div>
  );
}
