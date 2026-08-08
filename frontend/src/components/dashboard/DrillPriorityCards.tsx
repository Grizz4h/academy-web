import React from 'react';
import Card from '../Card';
import { getDrillAccentLevel } from '../../utils/tealIntensity';
import styles from './DrillPriorityCards.module.css';

export type DrillWithCount = {
  id: string;
  title: string;
  drill_type?: string;
  count: number;
  moduleId?: string;
};

type DrillPriorityCardsProps = {
  recommendedNext: DrillWithCount[];
  mostTrained: DrillWithCount[];
  availableScopes: string[];
  currentScope: string;
  onScopeChange: (scope: string) => void;
};

export const DrillPriorityCards: React.FC<DrillPriorityCardsProps> = ({
  recommendedNext,
  mostTrained,
  availableScopes,
  currentScope,
  onScopeChange
}) => {
  return (
    <div className={styles.priorityWrapper}>
      {/* Scope Selector */}
      <Card className={styles.scopeCard} elevation="quiet">
        <div className={styles.scopeSelector}>
          <label htmlFor="scope-select" className={styles.scopeLabel}>
            Bereich:
          </label>
          <select
            id="scope-select"
            value={currentScope}
            onChange={(e) => onScopeChange(e.target.value)}
            className="appSelect"
          >
            {availableScopes.map((scope) => (
              <option key={scope} value={scope}>
                {scope}
              </option>
            ))}
          </select>
        </div>
      </Card>

      <div className={styles.priorityContainer}>
        <Card className={styles.priorityCard} elevation="featured">
        <p className={styles.sectionEyebrow}>Fokus</p>
        <h2 className={styles.sectionTitle}>Als Nächstes empfohlen</h2>
        {recommendedNext.length === 0 ? (
          <p className={styles.emptyState}>Keine Drills verfügbar.</p>
        ) : (
          <ul className={styles.drillList}>
            {recommendedNext.map((drill) => {
              const accentLevel = getDrillAccentLevel(drill.count);
              const displayTitle = drill.moduleId 
                ? `${drill.moduleId} · ${drill.title}` 
                : drill.title;
              return (
                <li key={drill.id} className={styles.drillItem}>
                  <div className={styles.itemAccent} data-level={accentLevel} data-type="recommended" />
                  <span className={styles.drillTitle}>{displayTitle}</span>
                  <span className={styles.itemCount}>{drill.count}×</span>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <Card className={styles.priorityCard} elevation="quiet">
        <p className={styles.sectionEyebrow}>Historie</p>
        <h2 className={styles.sectionTitle}>Am häufigsten trainiert</h2>
        {mostTrained.length === 0 ? (
          <p className={styles.emptyState}>Noch keine Drills absolviert.</p>
        ) : (
          <ul className={styles.drillList}>
            {mostTrained.map((drill) => {
              const accentLevel = getDrillAccentLevel(drill.count);
              const displayTitle = drill.moduleId 
                ? `${drill.moduleId} · ${drill.title}` 
                : drill.title;
              return (
                <li key={drill.id} className={styles.drillItem}>
                  <div className={styles.itemAccent} data-level={accentLevel} data-type="trained" />
                  <span className={styles.drillTitle}>{displayTitle}</span>
                  <span className={styles.itemCount}>{drill.count}×</span>
                </li>
              );
            })}
          </ul>
        )}
        </Card>
      </div>
    </div>
  );
};
