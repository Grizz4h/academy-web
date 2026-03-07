import React from 'react';
import Card from '../Card';
import styles from './CoverageMap.module.css';

export type ModuleCoverage = {
  moduleId: string;
  moduleTitle: string;
  totalDrills: number;
  completedDrills: number;
};

type CoverageMapProps = {
  moduleCoverages: ModuleCoverage[];
};

export const CoverageMap: React.FC<CoverageMapProps> = ({ moduleCoverages }) => {
  return (
    <Card>
      <h2 className={styles.sectionTitle}>Coverage Map</h2>
      <div className={styles.coverageGrid}>
        {moduleCoverages.map((module) => {
          const status = 
            module.completedDrills === 0 ? 'empty' :
            module.completedDrills === module.totalDrills ? 'complete' :
            'partial';
          
          const isComplete = module.completedDrills === module.totalDrills && module.totalDrills > 0;
          
          // Erstelle Array für Segmente
          const segments = Array.from({ length: module.totalDrills }, (_, i) => i < module.completedDrills);
          
          return (
            <div key={module.moduleId} className={styles.moduleRow}>
              <div className={styles.moduleAccent} data-status={status} />
              <div className={styles.moduleContent}>
                <div className={styles.coverageRow}>
                  <div className={styles.coverageModule}>
                    {module.moduleId}
                    {isComplete && <span className={styles.completeIcon}> ✓</span>}
                  </div>
                  <div className={styles.coverageSegments}>
                    {segments.map((isActive, idx) => (
                      <div
                        key={idx}
                        className={`${styles.segment} ${isActive ? styles.segmentActive : styles.segmentInactive}`}
                        data-complete={isComplete}
                      />
                    ))}
                  </div>
                  <div className={styles.coverageCount}>
                    {module.completedDrills}/{module.totalDrills}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};
