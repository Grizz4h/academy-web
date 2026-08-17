import React from 'react';
import { Link } from 'react-router-dom';
import Card from '../Card';
import { getDrillAccentLevel } from '../../utils/tealIntensity';
import { MechanicGlyph } from '../visuals';
import styles from './DrillPriorityCards.module.css';

export type DrillWithCount = {
  id: string;
  title: string;
  drill_type?: string;
  count: number;
  moduleId?: string;
  /** 1-based order within the module (didactic sequence). */
  drillNumber?: number;
};

type DrillPriorityCardsProps = {
  recommendedNext: DrillWithCount[];
  mostTrained: DrillWithCount[];
  availableScopes: string[];
  currentScope: string;
  onScopeChange: (scope: string) => void;
};

function setupHref(drill: DrillWithCount): string | null {
  if (!drill.moduleId) return null;
  return `/setup/${encodeURIComponent(drill.moduleId)}?drill=${encodeURIComponent(drill.id)}`;
}

function DrillRow({ drill, accentType }: { drill: DrillWithCount; accentType: 'recommended' | 'trained' }) {
  const accentLevel = getDrillAccentLevel(drill.count);
  const displayTitle = drill.moduleId
    ? `${drill.moduleId} · ${drill.title}`
    : drill.title;
  const href = setupHref(drill);

  const body = (
    <>
      <div className={styles.itemAccent} data-level={accentLevel} data-type={accentType} />
      <MechanicGlyph drillType={drill.drill_type} />
      <span className={styles.drillTitle}>{displayTitle}</span>
      <span className={styles.itemCount}>{drill.count}×</span>
    </>
  );

  if (!href) {
    return <li className={styles.drillItem}>{body}</li>;
  }

  return (
    <li className={styles.drillItem}>
      <Link
        to={href}
        className={styles.drillItemLink}
        aria-label={`${displayTitle} — Session Setup öffnen`}
      >
        {body}
      </Link>
    </li>
  );
}

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
        <Card className={styles.priorityCard} elevation="quiet">
        <p className={styles.sectionEyebrow}>Fokus</p>
        <h2 className="ui-section-title-content">Als Nächstes empfohlen</h2>
        {recommendedNext.length === 0 ? (
          <p className={styles.emptyState}>Keine Drills verfügbar.</p>
        ) : (
          <ul className={styles.drillList}>
            {recommendedNext.map((drill) => (
              <DrillRow key={drill.id} drill={drill} accentType="recommended" />
            ))}
          </ul>
        )}
      </Card>

        <Card className={styles.priorityCard} elevation="quiet">
        <p className={styles.sectionEyebrow}>Historie</p>
        <h2 className="ui-section-title-content">Am häufigsten trainiert</h2>
        {mostTrained.length === 0 ? (
          <p className={styles.emptyState}>Noch keine Drills absolviert.</p>
        ) : (
          <ul className={styles.drillList}>
            {mostTrained.map((drill) => (
              <DrillRow key={drill.id} drill={drill} accentType="trained" />
            ))}
          </ul>
        )}
        </Card>
      </div>
    </div>
  );
};
