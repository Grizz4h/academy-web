import React from 'react';
import Card from '../Card';
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

const getAccentLevel = (count: number): number => {
  if (count === 0) return 0;
  if (count === 1) return 1;
  if (count >= 2 && count <= 3) return 2;
  return 3;
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
      <Card className={styles.scopeCard}>
        <div className={styles.scopeSelector}>
          <label htmlFor="scope-select" className={styles.scopeLabel}>
            Scope:
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
        <Card className={styles.priorityCard}>
        <h2 className={styles.sectionTitle}>Recommended Next</h2>
        {recommendedNext.length === 0 ? (
          <p className={styles.emptyState}>Keine Drills verfügbar.</p>
        ) : (
          <ul className={styles.drillList}>
            {recommendedNext.map((drill) => {
              const accentLevel = getAccentLevel(drill.count);
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

      <Card className={styles.priorityCard}>
        <h2 className={styles.sectionTitle}>Most Trained</h2>
        {mostTrained.length === 0 ? (
          <p className={styles.emptyState}>Noch keine Drills absolviert.</p>
        ) : (
          <ul className={styles.drillList}>
            {mostTrained.map((drill) => {
              const accentLevel = getAccentLevel(drill.count);
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
