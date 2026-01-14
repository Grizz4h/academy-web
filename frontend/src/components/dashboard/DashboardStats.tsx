import React from "react";
import type { SessionStats } from "../../stats/sessionStats";

interface DashboardStatsProps {
  stats: SessionStats;
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({ stats }) => (
  <div className="dashboard-stats">
    <h2>Session Übersicht</h2>
    <ul>
      <li>Sessions insgesamt: {stats.total}</li>
      <li>Abgeschlossen: {stats.completed}</li>
      <li>Aktiv: {stats.active}</li>
    </ul>
  </div>
);
