import React from "react";

interface DashboardMetaProps {
  lastUpdate: string;
}

export const DashboardMeta: React.FC<DashboardMetaProps> = ({ lastUpdate }) => (
  <div className="dashboard-meta">
    <small>Letzte Aktualisierung: {lastUpdate}</small>
  </div>
);
