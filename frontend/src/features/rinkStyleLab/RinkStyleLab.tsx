import { useMemo, useState } from 'react'
import FoundationRink from '../foundation/FoundationRink'
import { UiChip } from '../../components/ui'
import { DetailedStage } from './DetailedStage'
import { SceneMarkers } from './SceneMarkers'
import { FOUNDATION_SCENES } from './foundationScenesCatalog'
import { halfForBand, type IceHalf } from './labGeometry'
import {
  applyMarkerStyleVariant,
  DEFAULT_LEARNING,
  DEFAULT_MARKINGS,
  type MarkerStyleVariant,
  type StyleLabLearning,
  type StyleLabMarkings,
  type StyleLabMode,
} from './presets'
import styles from './RinkStyleLab.module.css'
import stageStyles from './stages.module.css'

function Toggle({
  label,
  checked,
  onChange,
  disabled,
}: {
  label: string
  checked: boolean
  onChange: (next: boolean) => void
  disabled?: boolean
}) {
  return (
    <label className={`${styles.toggle} ${disabled ? styles.toggleDisabled : ''}`}>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span>{label}</span>
    </label>
  )
}

const DEFAULT_SCENE_ID = FOUNDATION_SCENES.find((s) => s.id === 'd4_weak_side')?.id
  || FOUNDATION_SCENES[0]?.id
  || ''

export function RinkStyleLab() {
  const [mode, setMode] = useState<StyleLabMode>('design')
  const [sceneId, setSceneId] = useState(DEFAULT_SCENE_ID)
  const [markings, setMarkings] = useState<StyleLabMarkings>(DEFAULT_MARKINGS)
  const [learning, setLearning] = useState<StyleLabLearning>(() => {
    const scene = FOUNDATION_SCENES.find((s) => s.id === DEFAULT_SCENE_ID)
    return { ...DEFAULT_LEARNING, ...(scene?.learning || {}) }
  })
  const [markerVariant, setMarkerVariant] = useState<MarkerStyleVariant>('team')
  const [markingIntensity, setMarkingIntensity] = useState(1)
  const [attackArrowOverride, setAttackArrowOverride] = useState<'scene' | 'on' | 'off'>('scene')

  const scene = useMemo(
    () => FOUNDATION_SCENES.find((s) => s.id === sceneId) || FOUNDATION_SCENES[0],
    [sceneId],
  )

  const markerOverrides = useMemo(
    () => (scene
      ? applyMarkerStyleVariant(scene.markerOverrides, scene.showMarkers, markerVariant)
      : {}),
    [scene, markerVariant],
  )

  const showAttackArrow = attackArrowOverride === 'scene'
    ? Boolean(scene?.showAttackArrow)
    : attackArrowOverride === 'on'

  const applyScene = (id: string) => {
    const next = FOUNDATION_SCENES.find((s) => s.id === id)
    setSceneId(id)
    setAttackArrowOverride('scene')
    if (next?.learning) {
      setLearning({ ...DEFAULT_LEARNING, ...next.learning })
    } else {
      setLearning({
        ...DEFAULT_LEARNING,
        showWeakStrong: false,
        showHitboxes: false,
        showFeedback: false,
        feedbackSide: null,
      })
    }
  }

  const onSelectHalf = (half: IceHalf) => {
    const band = learning.weakSideBand || scene?.weakSideBand || 'top'
    const side = halfForBand(half, band)
    setLearning((prev) => ({
      ...prev,
      showWeakStrong: true,
      showHitboxes: true,
      showFeedback: true,
      feedbackSide: side,
      weakSideBand: band,
    }))
  }

  const setMarking = (key: keyof StyleLabMarkings, value: boolean) => {
    setMarkings((prev) => ({ ...prev, [key]: value }))
  }

  const foundationLearningSelected =
    learning.showFeedback && learning.feedbackSide === 'weak' ? 'weak_side' : null

  const activeLearning: StyleLabLearning = {
    ...learning,
    weakSideBand: learning.weakSideBand || scene?.weakSideBand || 'top',
  }

  return (
    <div className={styles.lab}>
      <p className={styles.banner} role="status">
        Phase 2 · Detailed-Geometrie als Produktbasis · Foundation-Szenen nur gemappt ·
        Keine Curriculum-Änderung · Blueprint unverändert
      </p>

      <div className={styles.modeRow} role="group" aria-label="Lab-Modus">
        <UiChip active={mode === 'design'} onClick={() => setMode('design')}>
          Design (Detailed)
        </UiChip>
        <UiChip active={mode === 'compare'} onClick={() => setMode('compare')}>
          Compare
        </UiChip>
      </div>

      <div className={styles.sceneBar}>
        <label className={styles.sceneSelectLabel}>
          Track-0-Szene
          <select
            className={`appSelect ${styles.sceneSelect}`}
            value={scene?.id || ''}
            onChange={(e) => applyScene(e.target.value)}
          >
            {FOUNDATION_SCENES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
        {scene && (
          <p className={styles.scenePrompt}>{scene.prompt}</p>
        )}
      </div>

      {mode === 'design' && (
        <div className={styles.designLayout}>
          <aside className={styles.controls} aria-label="Design-Steuerung">
            <h2 className={styles.controlsTitle}>Markierungsintensität</h2>
            <label className={styles.sliderRow}>
              <span>{Math.round(markingIntensity * 100)}%</span>
              <input
                type="range"
                min={25}
                max={100}
                step={5}
                value={Math.round(markingIntensity * 100)}
                onChange={(e) => setMarkingIntensity(Number(e.target.value) / 100)}
              />
            </label>

            <h2 className={styles.controlsTitle}>Markierungen</h2>
            <div className={styles.toggleGrid}>
              <Toggle label="Blue Lines" checked={markings.blueLines} onChange={(v) => setMarking('blueLines', v)} />
              <Toggle label="Center Line" checked={markings.centerLine} onChange={(v) => setMarking('centerLine', v)} />
              <Toggle label="Center Faceoff Circle" checked={markings.centerFaceoffCircle} onChange={(v) => setMarking('centerFaceoffCircle', v)} />
              <Toggle label="Faceoff Dots / Kreise" checked={markings.faceoffDots} onChange={(v) => setMarking('faceoffDots', v)} />
              <Toggle label="Goal Lines" checked={markings.goalLines} onChange={(v) => setMarking('goalLines', v)} />
              <Toggle label="Tore" checked={markings.goals} onChange={(v) => setMarking('goals', v)} />
              <Toggle label="Crease" checked={markings.crease} onChange={(v) => setMarking('crease', v)} />
              <Toggle label="Zonen-Labels" checked={markings.labels} onChange={(v) => setMarking('labels', v)} />
              <Toggle label="Ice-Ads" checked={markings.iceAds} onChange={(v) => setMarking('iceAds', v)} />
            </div>

            <h2 className={styles.controlsTitle}>Angriffspfeil</h2>
            <div className={styles.chipRow}>
              <UiChip active={attackArrowOverride === 'scene'} onClick={() => setAttackArrowOverride('scene')}>
                Szene
              </UiChip>
              <UiChip active={attackArrowOverride === 'on'} onClick={() => setAttackArrowOverride('on')}>
                An
              </UiChip>
              <UiChip active={attackArrowOverride === 'off'} onClick={() => setAttackArrowOverride('off')}>
                Aus
              </UiChip>
            </div>

            <h2 className={styles.controlsTitle}>Marker-Stil</h2>
            <div className={styles.chipRow}>
              <UiChip active={markerVariant === 'team'} onClick={() => setMarkerVariant('team')}>Team</UiChip>
              <UiChip active={markerVariant === 'role'} onClick={() => setMarkerVariant('role')}>Rolle</UiChip>
              <UiChip active={markerVariant === 'neutral'} onClick={() => setMarkerVariant('neutral')}>Neutral</UiChip>
            </div>

            <h2 className={styles.controlsTitle}>Learning</h2>
            <div className={styles.toggleGrid}>
              <Toggle
                label="Weak/Strong Hälften"
                checked={activeLearning.showWeakStrong}
                onChange={(v) => setLearning((p) => ({
                  ...p,
                  showWeakStrong: v,
                  showHitboxes: v || p.showHitboxes,
                }))}
              />
              <Toggle
                label="Hitboxes sichtbar"
                checked={activeLearning.showHitboxes}
                onChange={(v) => setLearning((p) => ({ ...p, showHitboxes: v }))}
              />
              <Toggle
                label="Feedback"
                checked={activeLearning.showFeedback}
                onChange={(v) => setLearning((p) => ({
                  ...p,
                  showFeedback: v,
                  feedbackSide: v ? (p.feedbackSide || 'weak') : null,
                }))}
              />
            </div>
            <div className={styles.chipRow}>
              <UiChip
                active={activeLearning.weakSideBand === 'top'}
                onClick={() => setLearning((p) => ({ ...p, weakSideBand: 'top' }))}
              >
                Weak = oben
              </UiChip>
              <UiChip
                active={activeLearning.weakSideBand === 'bottom'}
                onClick={() => setLearning((p) => ({ ...p, weakSideBand: 'bottom' }))}
              >
                Weak = unten
              </UiChip>
            </div>
            {activeLearning.feedbackSide && (
              <p className={styles.hint}>
                Letzte Auswahl:
                {' '}
                {activeLearning.feedbackSide === 'weak' ? 'Weak Side' : 'Strong Side'}
              </p>
            )}
          </aside>

          <section className={styles.panel}>
            <header className={styles.panelHead}>
              <h2 className={styles.panelTitle}>Detailed · Foundation-Szene</h2>
              <p className={styles.panelMeta}>
                Layer: Base · Scene · Learning · Intensity
                {' '}
                {Math.round(markingIntensity * 100)}
                %
              </p>
            </header>
            <DetailedStage
              markings={markings}
              learning={activeLearning}
              markingIntensity={markingIntensity}
              showAttackArrow={showAttackArrow}
              attackDirection={scene?.attackDirection || 'right'}
              onSelectHalf={onSelectHalf}
            >
              {scene && (
                <SceneMarkers
                  space="detailed"
                  showMarkers={scene.showMarkers}
                  markerOverrides={markerOverrides}
                />
              )}
            </DetailedStage>
          </section>
        </div>
      )}

      {mode === 'compare' && scene && (
        <div className={styles.compareGrid}>
          <section className={styles.panel}>
            <header className={styles.panelHead}>
              <h2 className={styles.panelTitle}>FoundationRink</h2>
              <p className={styles.panelMeta}>Original 400×240</p>
            </header>
            <div className={stageStyles.foundationWrap}>
              <FoundationRink
                attackDirection={scene.attackDirection}
                showMarkers={scene.showMarkers}
                markerOverrides={markerOverrides}
                hideAttackArrow={!showAttackArrow}
                weakSideBand={activeLearning.weakSideBand}
                highlightRegions={
                  activeLearning.showFeedback && activeLearning.feedbackSide === 'weak'
                    ? ['weak_side']
                    : []
                }
                selectedRegion={foundationLearningSelected}
              />
            </div>
          </section>
          <section className={styles.panel}>
            <header className={styles.panelHead}>
              <h2 className={styles.panelTitle}>Detailed (mapped)</h2>
              <p className={styles.panelMeta}>Dieselbe Szene · Adapter</p>
            </header>
            <DetailedStage
              markings={markings}
              learning={activeLearning}
              markingIntensity={markingIntensity}
              showAttackArrow={showAttackArrow}
              attackDirection={scene.attackDirection}
              onSelectHalf={onSelectHalf}
            >
              <SceneMarkers
                space="detailed"
                showMarkers={scene.showMarkers}
                markerOverrides={markerOverrides}
              />
            </DetailedStage>
          </section>
        </div>
      )}
    </div>
  )
}
