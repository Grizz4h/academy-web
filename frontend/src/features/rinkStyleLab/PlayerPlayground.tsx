import { useMemo, useState } from 'react'
import { HockeyPlayer } from './boardStudio/HockeyPlayer.tsx'
import {
  PLAYER_COLORS,
  type PlayerHandedness,
  type PlayerMarkerKind,
} from './boardStudio/playerVisual.ts'
import { LegacyHockeyPlayer } from './legacy/LegacyHockeyPlayer.tsx'
import {
  resolveScenePuckPoint,
  type PlayerPuckPlacement,
} from './playerLocalPoint.ts'
import type { PlayerStyleMode } from './playerStyleMode.ts'
import styles from './PlayerPlayground.module.css'

export type PlayerPlaygroundProps = {
  mode: PlayerStyleMode
  /** Shared with rink scene — controlled from RinkStyleLab. */
  scale: number
  onScaleChange: (next: number) => void
  rotation: number
  onRotationChange: (next: number) => void
  handedness: PlayerHandedness
  onHandednessChange: (next: PlayerHandedness) => void
  puckPlacement: PlayerPuckPlacement
  onPuckPlacementChange: (next: PlayerPuckPlacement) => void
}

export function PlayerPlayground({
  mode,
  scale,
  onScaleChange,
  rotation,
  onRotationChange,
  handedness,
  onHandednessChange,
  puckPlacement,
  onPuckPlacementChange,
}: PlayerPlaygroundProps) {
  const [teamColor, setTeamColor] = useState<string>('blue')
  const [number, setNumber] = useState('3')
  const [showStick, setShowStick] = useState(true)
  const [marker, setMarker] = useState<PlayerMarkerKind>('skater')
  const [hasPuck, setHasPuck] = useState(true)

  const shared = useMemo(
    () => ({
      teamColor,
      number,
      rotation,
      showStick,
      x: 0,
      y: 0,
      scale,
    }),
    [teamColor, number, rotation, showStick, scale],
  )

  const showBodyPuck = hasPuck && (puckPlacement === 'body' || puckPlacement === 'compare')
  const showBladePuck = hasPuck && (puckPlacement === 'blade' || puckPlacement === 'compare')
  const bodyPuck = showBodyPuck
    ? resolveScenePuckPoint({
        anchorX: 0,
        anchorY: 0,
        rotationDegrees: rotation,
        outerScale: scale,
        handedness,
        marker,
        placement: 'body',
      })
    : null
  const bladePuck = showBladePuck
    ? resolveScenePuckPoint({
        anchorX: 0,
        anchorY: 0,
        rotationDegrees: rotation,
        outerScale: scale,
        handedness,
        marker,
        placement: 'blade',
      })
    : null

  return (
    <div className={styles.playground}>
      <div className={styles.controls} aria-label="Player Playground controls">
        <label>
          Farbe
          <select value={teamColor} onChange={(e) => setTeamColor(e.target.value)}>
            {PLAYER_COLORS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
            <option value="#7c3aed">custom #7c3aed</option>
          </select>
        </label>
        <label>
          Nummer
          <input
            value={number}
            maxLength={8}
            onChange={(e) => setNumber(e.target.value)}
          />
        </label>
        <label>
          Rotation ({rotation}°)
          <input
            type="range"
            min={0}
            max={359}
            value={rotation}
            onChange={(e) => onRotationChange(Number(e.target.value))}
          />
        </label>
        <label>
          Scale ({scale.toFixed(2)})
          <input
            type="range"
            min={0.2}
            max={1.5}
            step={0.05}
            value={scale}
            onChange={(e) => onScaleChange(Number(e.target.value))}
          />
        </label>
        <label className={styles.check}>
          <input
            type="checkbox"
            checked={showStick}
            onChange={(e) => setShowStick(e.target.checked)}
          />
          Schläger
        </label>
        <label className={styles.check}>
          <input
            type="checkbox"
            checked={hasPuck}
            onChange={(e) => setHasPuck(e.target.checked)}
          />
          Puck (Vorschau)
        </label>
        {mode === 'boardStudio' ? (
          <>
            <label>
              Marker
              <select
                value={marker}
                onChange={(e) => setMarker(e.target.value as PlayerMarkerKind)}
              >
                <option value="skater">Skater</option>
                <option value="goalie">Goalie</option>
              </select>
            </label>
            <label>
              Handedness
              <select
                value={handedness}
                onChange={(e) => onHandednessChange(e.target.value as PlayerHandedness)}
              >
                <option value="right">Right</option>
                <option value="left">Left</option>
              </select>
            </label>
            <label>
              Puck-Lage
              <select
                value={puckPlacement}
                onChange={(e) => onPuckPlacementChange(e.target.value as PlayerPuckPlacement)}
              >
                <option value="body">Körper (bisher)</option>
                <option value="blade">Schlägerkelle</option>
                <option value="compare">Vergleich beide</option>
              </select>
            </label>
          </>
        ) : null}
      </div>

      <div className={styles.stage} role="img" aria-label={`Player preview (${mode})`}>
        <svg viewBox="-48 -48 96 96" className={styles.playerSvg}>
          <rect x="-48" y="-48" width="96" height="96" className={styles.iceBg} />
          <circle cx={0} cy={0} r={2} className={styles.anchorDot} />
          {mode === 'boardStudio' ? (
            <>
              <HockeyPlayer
                {...shared}
                marker={marker}
                handedness={handedness}
                selected={false}
              />
              {bodyPuck ? (
                <circle
                  cx={bodyPuck.x}
                  cy={bodyPuck.y}
                  r={3.2}
                  className={styles.puckDot}
                  opacity={puckPlacement === 'compare' ? 0.45 : 1}
                />
              ) : null}
              {bladePuck ? (
                <circle
                  cx={bladePuck.x}
                  cy={bladePuck.y}
                  r={3.2}
                  className={styles.puckDotBlade}
                />
              ) : null}
            </>
          ) : (
            <LegacyHockeyPlayer {...shared} />
          )}
        </svg>
      </div>

      <p className={styles.hint}>
        {mode === 'boardStudio'
          ? 'Scale/Rotation/Handedness/Puck steuern auch die Rink-Szene oben. Label bleibt weltaufrecht.'
          : 'Legacy-Token (Kreis + Nummer) — Rink-Scale/Rotation betreffen nur Board-Studio-Figuren.'}
      </p>
    </div>
  )
}
