import { Navigate } from 'react-router-dom'
import { TrackFDrillPlayer } from '../cluster2/trackF/TrackFDrillPlayer'
import { useDevNavEnabled } from '../config/featureFlags'

/** Cluster 2 pilots are Dev-Mode only until public rollout. */
export default function Cluster2TrackFPage() {
  const devMode = useDevNavEnabled()
  if (!devMode) return <Navigate to="/curriculum" replace />
  return <TrackFDrillPlayer />
}
