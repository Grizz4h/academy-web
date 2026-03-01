import React from 'react';
import './DrillActivityHeatmap.css';

interface DrillAttempt {
  drillId: string;
  drillName: string;
  timestamp: string;
  moduleId?: string;
  trackTitle?: string;
  drillNumber?: number;
}

interface DrillActivityHeatmapProps {
  attempts: DrillAttempt[];
  days?: number; // Anzahl Tage rückwärts (default: 90)
}

export const DrillActivityHeatmap: React.FC<DrillActivityHeatmapProps> = ({
  attempts,
  days = 90
}) => {
  // Gruppiere Attempts nach Drill und Datum
  const activityMap = new Map<string, Map<string, number>>();
  const drillNames = new Map<string, string>();
  
  attempts.forEach(attempt => {
    const date = new Date(attempt.timestamp).toISOString().split('T')[0];
    drillNames.set(attempt.drillId, attempt.drillName);
    
    if (!activityMap.has(attempt.drillId)) {
      activityMap.set(attempt.drillId, new Map());
    }
    
    const drillMap = activityMap.get(attempt.drillId)!;
    drillMap.set(date, (drillMap.get(date) || 0) + 1);
  });

  // Generiere Datum-Array für die letzten X Tage
  const getDates = () => {
    const dates = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      dates.push(date.toISOString().split('T')[0]);
    }
    return dates;
  };

  const dateRange = getDates();

  // Intensität berechnen (0-4 Levels)
  const getIntensity = (count: number) => {
    if (count === 0) return 0;
    if (count === 1) return 1;
    if (count <= 2) return 2;
    if (count <= 3) return 3;
    return 4;
  };

  const drillStats = Array.from(activityMap.entries()).map(([drillId, dateMap]) => {
    const drill = attempts.find(a => a.drillId === drillId);
    const totalAttempts = Array.from(dateMap.values()).reduce((sum, count) => sum + count, 0);
    
    return {
      drillId,
      drillName: drill?.drillName || drillNames.get(drillId) || 'Unknown Drill',
      moduleId: drill?.moduleId,
      trackTitle: drill?.trackTitle,
      drillNumber: drill?.drillNumber,
      dateMap,
      totalAttempts
    };
  }).sort((a, b) => b.totalAttempts - a.totalAttempts); // Sortiere nach Häufigkeit

  if (drillStats.length === 0) {
    return (
      <div className="drill-activity-heatmap">
        <h3>Lernfortschritt nach Drill</h3>
        <p className="no-data">Noch keine Drill-Daten vorhanden.</p>
      </div>
    );
  }

  return (
    <div className="drill-activity-heatmap">
      <h3>Lernfortschritt nach Drill</h3>
      <p className="heatmap-subtitle">
        Zeigt die letzten {days} Tage · {drillStats.reduce((sum, d) => sum + d.totalAttempts, 0)} Gesamt-Durchläufe
      </p>
      
      <div className="heatmap-scroll">
        {drillStats.map(({ drillId, drillName, moduleId, trackTitle, drillNumber, dateMap, totalAttempts }) => (
          <div key={drillId} className="drill-row">
            <div className="drill-info">
              <div className="drill-primary">
                <span className="drill-name" title={drillName}>{drillName}</span>
                <span className="drill-total">{totalAttempts}×</span>
              </div>
              {(moduleId || trackTitle || drillNumber !== undefined) && (
                <div className="drill-meta">
                  {moduleId && <span className="drill-module">{moduleId}</span>}
                  {trackTitle && <span className="drill-track">→ {trackTitle}</span>}
                  {drillNumber !== undefined && <span className="drill-number">#{drillNumber}</span>}
                </div>
              )}
            </div>
            
            <div className="activity-grid">
              {dateRange.map(date => {
                const count = dateMap.get(date) || 0;
                const intensity = getIntensity(count);
                
                return (
                  <div
                    key={date}
                    className={`activity-cell intensity-${intensity}`}
                    title={`${date}: ${count} ${count === 1 ? 'Durchlauf' : 'Durchläufe'}`}
                    data-count={count}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>
      
      <div className="heatmap-legend">
        <span>Weniger</span>
        {[0, 1, 2, 3, 4].map(level => (
          <div key={level} className={`legend-cell intensity-${level}`} />
        ))}
        <span>Mehr</span>
      </div>
    </div>
  );
};
