import { useMemo, useState } from 'react'
import { HockeyPlayer } from './boardStudio/HockeyPlayer.tsx'
import { PLAYER_COLORS, type PlayerHandedness, type PlayerMarkerKind } from './boardStudio/playerVisual.ts'
import { LegacyHockeyPlayer } from './legacy/LegacyHockeyPlayer.tsx'
import type { PlayerStyleMode } from './playerStyleMode.ts'
import styles from './PlayerPlayground.module.css'

export type PlayerPlaygroundProps = {
  mode: PlayerStyleMode
}

export function PlayerPlayground({ mode }: PlayerPlaygroundProps) {
  const [teamColor, setTeamColor] = useState<string>('blue')
  const [number, setNumber] = useState('3')
  const [rotation, setRotation] = useState(45)
  const [showStick, setShowStick] = useState(true)
  const [marker, setMarker] = useState<PlayerMarkerKind>('skater')
  const [handedness, setHandedness] = useState<PlayerHandedness>('right')
  const [scale, setScale] = useState(1.35)

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
            onChange={(e) => setRotation(Number(e.target.value))}
          />
        </label>
        <label>
          Scale ({scale.toFixed(2)})
          <input
            type="range"
            min={0.6}
            max={2.2}
            step={0.05}
            value={scale}
            onChange={(e) => setScale(Number(e.target.value))}
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
                onChange={(e) => setHandedness(e.target.value as PlayerHandedness)}
              >
                <option value="right">Right</option>
                <option value="left">Left</option>
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
            <HockeyPlayer
              {...shared}
              marker={marker}
              handedness={handedness}
              selected={false}
            />
          ) : (
            <LegacyHockeyPlayer {...shared} />
          )}
        </svg>
      </div>

      <p className={styles.hint}>
        {mode === 'boardStudio'
          ? 'Board-Studio-Figur (compound SVG). Label bleibt weltaufrecht.'
          : 'Legacy-Token (Kreis + Nummer) zum direkten Vergleich.'}
      </p>
    </div>
  )
}
