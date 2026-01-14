

import type { SessionStats } from "../../stats/sessionStats";

export interface DashboardChartsProps {
  stats: SessionStats;
}

export default function DashboardCharts({ stats }: DashboardChartsProps) {
  // Beispielhafte Nutzung von stats
  return (
    <div className="dashboard-charts">
      <h2>Statistik Diagramme</h2>
      <div>
        {/* Hier können Diagramme wie Bar/Line/Pie Charts integriert werden */}
        <p>Diagramm Platzhalter</p>
        <ul>
          <li>Gesamt: {stats.total}</li>
          <li>Abgeschlossen: {stats.completed}</li>
          <li>Aktiv: {stats.active}</li>
        </ul>
      </div>
    </div>
  );
}
