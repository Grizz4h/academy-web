import { useMemo, useState } from 'react';
import type { Session } from '../../api';
import { UiPill } from '../ui';
import {
  MAX_WEEKLY_ACTIVITY_LEVEL,
  buildWeeklyActivity,
  summarizeLearningRhythm,
  type LearningRhythmStatus,
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
  if (completedSessions >= MAX_WEEKLY_ACTIVITY_LEVEL) {
    return `${MAX_WEEKLY_ACTIVITY_LEVEL}+ Sessions`;
  }
  if (completedSessions === 1) return '1 Session';
  return `${completedSessions} Sessions`;
}

function statusTone(status: LearningRhythmStatus): 'ok' | 'accent' | 'warn' | 'neutral' {
  if (status === 'stable_active') return 'ok';
  if (status === 'reentry') return 'accent';
  if (status === 'irregular') return 'warn';
  return 'neutral';
}

function statusPillLabel(status: LearningRhythmStatus): string {
  switch (status) {
    case 'stable_active':
      return 'Im Rhythmus';
    case 'reentry':
      return 'Wiedereinstieg';
    case 'irregular':
      return 'Unregelmäßig';
    case 'quiet_phase':
      return 'Ruhige Phase';
    case 'low_data':
      return 'Noch wenig Daten';
    default:
      return 'Im Aufbau';
  }
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
  const peakLevel = Math.max(1, ...weekly.map((week) => week.activityLevel));

  const leftLabel = `Vor ${Math.max(weeks - 1, 0)} W.`;
  const middleLabel = weeks > 2 ? `Vor ${Math.floor((weeks - 1) / 2)} W.` : '';

  return (
    <div className={`${styles.widget} ${compact ? styles.compact : ''} ${styles[`status_${summary.status}`]}`}>
      <div className={styles.header}>
        <div className={styles.headerText}>
          <h2 className="ui-section-title">Lernrhythmus</h2>
          {showStatus ? (
            <UiPill tone={statusTone(summary.status)}>{statusPillLabel(summary.status)}</UiPill>
          ) : null}
        </div>
        {hasAnyActivity ? (
          <div className={styles.hero} aria-label={`${summary.activeWeeksLast4} von 4 Wochen aktiv`}>
            <span className={styles.heroValue}>
              {summary.activeWeeksLast4}
              <span className={styles.heroSlash}>/4</span>
            </span>
            <span className={styles.heroLabel}>aktive Wochen</span>
          </div>
        ) : null}
      </div>

      {!hasAnyActivity ? (
        <div className={styles.emptyState}>
          <p className={styles.emptyTitle}>Noch keine Aktivität</p>
          <p className={styles.emptyDescription}>
            Sobald du Sessions abschließt, wird hier dein Wochenrhythmus sichtbar.
          </p>
        </div>
      ) : null}

      <div className={styles.chart}>
        <div className={styles.chartGlow} aria-hidden="true" />
        <div className={styles.barsGrid} style={{ gridTemplateColumns: `repeat(${weeks}, minmax(0, 1fr))` }}>
          {weekly.map((week, index) => {
            const selected = safeSelectedIndex === index;
            const fillRatio = week.activityLevel <= 0 ? 0.07 : Math.max(0.14, week.activityLevel / peakLevel);
            return (
              <button
                key={week.weekStart}
                type="button"
                className={[
                  styles.barButton,
                  week.isCurrentWeek ? styles.currentWeek : '',
                  selected ? styles.selected : '',
                  week.activityLevel === 0 ? styles.emptyBar : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                onClick={() => setSelectedIndex(index)}
                title={`KW ${week.isoWeek} · ${formatSessionsText(week.completedSessions)}`}
                aria-label={`Kalenderwoche ${week.isoWeek}, ${formatSessionsText(week.completedSessions)}`}
                aria-pressed={selected}
              >
                <span className={styles.barTrack}>
                  <span
                    className={styles.barFill}
                    style={{ height: `${Math.round(fillRatio * 100)}%` }}
                    aria-hidden="true"
                  />
                </span>
                {week.isCurrentWeek ? <span className={styles.nowDot} aria-hidden="true" /> : null}
              </button>
            );
          })}
        </div>
        <div className={styles.axisLabels}>
          <span>{leftLabel}</span>
          <span>{middleLabel}</span>
          <span>Jetzt</span>
        </div>
      </div>

      {selectedWeek ? (
        <div className={styles.detail}>
          <div className={styles.detailMain}>
            <span className={styles.detailKicker}>
              KW {selectedWeek.isoWeek}
              {selectedWeek.isCurrentWeek ? ' · diese Woche' : ''}
            </span>
            <span className={styles.detailValue}>{formatSessionsText(selectedWeek.completedSessions)}</span>
          </div>
          {showAverage && hasAnyActivity && summary.averageSessionsPerActiveWeek !== null ? (
            <span className={styles.detailMeta}>
              Ø {summary.averageSessionsPerActiveWeek.toLocaleString('de-DE', {
                minimumFractionDigits: 1,
                maximumFractionDigits: 1,
              })}{' '}
              / aktive Woche
            </span>
          ) : null}
        </div>
      ) : null}

      {showStatus ? <p className={styles.status}>{summary.statusText}</p> : null}
    </div>
  );
}
