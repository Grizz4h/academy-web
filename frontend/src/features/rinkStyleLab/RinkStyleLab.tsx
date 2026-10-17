import { useEffect, useMemo, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import FoundationRink from '../foundation/FoundationRink'
import type { FoundationRinkRegionId } from '../foundation/types'
import { UiChip } from '../../components/ui'
import type { PlayerHandedness } from './boardStudio/playerVisual.ts'
import { DetailedStage } from './DetailedStage'
import {
  detailedPointToFoundation,
  foundationPointToDetailed,
  foundationScaleToDetailed,
} from './foundationCoordAdapter'
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
import type { PlayerStyleMode } from './playerStyleMode.ts'
import {
  clampPlayerScale,
  clampPuckBias,
  DEFAULT_GLOBAL_PLAYER_DISPLAY,
  globalDisplayWithPuckBias,
  readGlobalPlayerDisplay,
  STYLE_LAB_STICK_COLOR,
  writeGlobalPlayerDisplay,
  type GlobalPlayerDisplaySettings,
} from './globalPlayerDisplay.ts'
import {
  buildBaselineMarkerEdits,
  editsToFoundationOverrides,
  mergeMarkerEdits,
} from './sceneDraftBuild.ts'
import {
  clearSceneDraft,
  loadSceneDraft,
  saveSceneDraft,
} from './sceneDraftStore.ts'
import type { DragTarget, SceneMarkerEdit } from './sceneDraftTypes.ts'
import { DevValuesPanel } from './DevValuesPanel'
import { SceneMarkers, type PuckDragPreview } from './SceneMarkers'
import {
  resolveScenePuckPoint,
  worldPuckToCanonicalLocal,
} from './playerLocalPoint.ts'
import { clientToSvgPoint } from './svgPointer.ts'
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

function loadEditsForScene(
  sceneId: string,
  showMarkers: FoundationRinkRegionId[],
  styledOverrides: ReturnType<typeof applyMarkerStyleVariant>,
): Partial<Record<FoundationRinkRegionId, SceneMarkerEdit>> {
  const baseline = buildBaselineMarkerEdits(showMarkers, styledOverrides)
  const draft = loadSceneDraft(sceneId)
  return mergeMarkerEdits(baseline, draft?.markers)
}

export function RinkStyleLab() {
  const svgRef = useRef<SVGSVGElement | null>(null)
  const dragRef = useRef<{
    target: DragTarget
    lastSvg: { x: number; y: number }
  } | null>(null)
  const dragListenersRef = useRef<{
    move: (e: PointerEvent) => void
    up: () => void
  } | null>(null)

  const [mode, setMode] = useState<StyleLabMode>('design')
  const [sceneId, setSceneId] = useState(DEFAULT_SCENE_ID)
  const [markings, setMarkings] = useState<StyleLabMarkings>(DEFAULT_MARKINGS)
  const [learning, setLearning] = useState<StyleLabLearning>(() => {
    const scene = FOUNDATION_SCENES.find((s) => s.id === DEFAULT_SCENE_ID)
    return { ...DEFAULT_LEARNING, ...(scene?.learning || {}) }
  })
  const [markerVariant, setMarkerVariant] = useState<MarkerStyleVariant>('team')
  const [playerFigureStyle, setPlayerFigureStyle] = useState<PlayerStyleMode>('boardStudio')
  const [globalDisplay, setGlobalDisplay] = useState<GlobalPlayerDisplaySettings>(() => (
    typeof localStorage === 'undefined'
      ? { ...DEFAULT_GLOBAL_PLAYER_DISPLAY }
      : readGlobalPlayerDisplay()
  ))
  /** Session-only puck drag — never written into scene drafts. */
  const [puckDragPreview, setPuckDragPreview] = useState<PuckDragPreview | null>(null)
  const [markingIntensity, setMarkingIntensity] = useState(1)
  const [attackArrowOverride, setAttackArrowOverride] = useState<'scene' | 'on' | 'off'>('scene')
  const [sceneEditMode, setSceneEditMode] = useState(true)
  const [selectedId, setSelectedId] = useState<FoundationRinkRegionId | null>(null)
  const [selectedPuckId, setSelectedPuckId] = useState<FoundationRinkRegionId | null>(null)
  const [draftSavedAt, setDraftSavedAt] = useState<string | null>(null)
  const [markerEdits, setMarkerEdits] = useState<
    Partial<Record<FoundationRinkRegionId, SceneMarkerEdit>>
  >({})

  const scene = useMemo(
    () => FOUNDATION_SCENES.find((s) => s.id === sceneId) || FOUNDATION_SCENES[0],
    [sceneId],
  )

  const styledOverrides = useMemo(
    () => (scene
      ? applyMarkerStyleVariant(scene.markerOverrides, scene.showMarkers, markerVariant)
      : {}),
    [scene, markerVariant],
  )

  // Bind edits to scene id — reload baseline+draft on scene or label-style change
  useEffect(() => {
    if (!scene) return
    const next = loadEditsForScene(scene.id, scene.showMarkers, styledOverrides)
    setMarkerEdits(next)
    setSelectedId(null)
    setSelectedPuckId(null)
    setPuckDragPreview(null)
    const saved = loadSceneDraft(scene.id)
    setDraftSavedAt(saved?.updatedAt || null)
  }, [scene, styledOverrides])

  const showAttackArrow = attackArrowOverride === 'scene'
    ? Boolean(scene?.showAttackArrow)
    : attackArrowOverride === 'on'

  const selected = selectedId ? markerEdits[selectedId] : null

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

  const patchSelected = (patch: Partial<SceneMarkerEdit>) => {
    if (!selectedId) return
    setMarkerEdits((prev) => {
      const cur = prev[selectedId]
      if (!cur) return prev
      return {
        ...prev,
        [selectedId]: {
          ...cur,
          ...patch,
          id: selectedId,
        },
      }
    })
  }

  const persistGlobalDisplay = (next: GlobalPlayerDisplaySettings) => {
    const normalized = {
      ...next,
      version: 1 as const,
      playerScale: clampPlayerScale(next.playerScale),
      puckBias: clampPuckBias(next.puckBias),
      puckLocalX: Number.isFinite(next.puckLocalX) ? next.puckLocalX : DEFAULT_GLOBAL_PLAYER_DISPLAY.puckLocalX,
      puckLocalY: Number.isFinite(next.puckLocalY) ? next.puckLocalY : DEFAULT_GLOBAL_PLAYER_DISPLAY.puckLocalY,
    }
    writeGlobalPlayerDisplay(normalized)
    setGlobalDisplay(normalized)
  }

  const updateGlobalDisplay = (patch: Partial<GlobalPlayerDisplaySettings>) => {
    setGlobalDisplay((prev) => {
      let next: GlobalPlayerDisplaySettings = {
        ...prev,
        ...patch,
        version: 1,
        playerScale: clampPlayerScale(
          patch.playerScale !== undefined ? patch.playerScale : prev.playerScale,
        ),
        puckBias: clampPuckBias(
          patch.puckBias !== undefined ? patch.puckBias : prev.puckBias,
        ),
        puckLocalX: patch.puckLocalX !== undefined ? patch.puckLocalX : prev.puckLocalX,
        puckLocalY: patch.puckLocalY !== undefined ? patch.puckLocalY : prev.puckLocalY,
      }
      if (patch.puckBias !== undefined && patch.puckLocalX === undefined && patch.puckLocalY === undefined) {
        next = globalDisplayWithPuckBias(next, patch.puckBias)
      }
      writeGlobalPlayerDisplay(next)
      return next
    })
  }

  const adoptPuckPositionGlobally = () => {
    if (!selectedId || playerFigureStyle !== 'boardStudio') return
    const edit = markerEdits[selectedId]
    if (!edit?.hasPuck) return
    const detailed = foundationPointToDetailed(edit.cx, edit.cy)
    const baseR = 12 * foundationScaleToDetailed() * 0.85
    const outerScale = (baseR / 12) * clampPlayerScale(globalDisplay.playerScale)
    const tip = resolveScenePuckPoint({
      anchorX: detailed.x,
      anchorY: detailed.y,
      rotationDegrees: edit.rotation,
      outerScale,
      handedness: edit.handedness,
      puckLocal: { x: globalDisplay.puckLocalX, y: globalDisplay.puckLocalY },
    })
    const preview = puckDragPreview?.id === selectedId ? puckDragPreview : { dx: 0, dy: 0 }
    const canonical = worldPuckToCanonicalLocal({
      anchorX: detailed.x,
      anchorY: detailed.y,
      worldX: tip.x + preview.dx,
      worldY: tip.y + preview.dy,
      rotationDegrees: edit.rotation,
      outerScale,
      handedness: edit.handedness,
    })
    persistGlobalDisplay({
      ...globalDisplay,
      puckLocalX: canonical.x,
      puckLocalY: canonical.y,
    })
    setPuckDragPreview(null)
  }

  const handleSaveDraft = () => {
    if (!scene) return
    const doc = saveSceneDraft(scene.id, markerEdits)
    setDraftSavedAt(doc.updatedAt)
  }

  const handleResetDraft = () => {
    if (!scene) return
    clearSceneDraft(scene.id)
    setMarkerEdits(buildBaselineMarkerEdits(scene.showMarkers, styledOverrides))
    setDraftSavedAt(null)
    setSelectedId(null)
    setSelectedPuckId(null)
  }

  const endDrag = () => {
    dragRef.current = null
    const listeners = dragListenersRef.current
    if (listeners) {
      window.removeEventListener('pointermove', listeners.move)
      window.removeEventListener('pointerup', listeners.up)
      dragListenersRef.current = null
    }
  }

  useEffect(() => () => endDrag(), [])

  const beginDrag = (target: DragTarget, e: ReactPointerEvent) => {
    if (!sceneEditMode || !svgRef.current) return
    e.preventDefault()
    const pt = clientToSvgPoint(svgRef.current, e.clientX, e.clientY)
    const prevListeners = dragListenersRef.current
    if (prevListeners) {
      window.removeEventListener('pointermove', prevListeners.move)
      window.removeEventListener('pointerup', prevListeners.up)
      dragListenersRef.current = null
    }
    dragRef.current = { target, lastSvg: pt }
    const move = (ev: PointerEvent) => {
      const drag = dragRef.current
      if (!drag || !svgRef.current) return
      const next = clientToSvgPoint(svgRef.current, ev.clientX, ev.clientY)
      const dx = next.x - drag.lastSvg.x
      const dy = next.y - drag.lastSvg.y
      drag.lastSvg = next
      if (drag.target.kind === 'player') {
        const id = drag.target.id
        setMarkerEdits((prev) => {
          const cur = prev[id]
          if (!cur) return prev
          const detailed = foundationPointToDetailed(cur.cx, cur.cy)
          const foundation = detailedPointToFoundation(detailed.x + dx, detailed.y + dy)
          return { ...prev, [id]: { ...cur, cx: foundation.x, cy: foundation.y } }
        })
        return
      }
      const id = drag.target.id
      setPuckDragPreview((prev) => {
        const base = prev?.id === id ? prev : { id, dx: 0, dy: 0 }
        return { id, dx: base.dx + dx, dy: base.dy + dy }
      })
    }
    const up = () => endDrag()
    dragListenersRef.current = { move, up }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }

  const startPlayerDrag = (id: FoundationRinkRegionId, e: ReactPointerEvent) => {
    setSelectedId(id)
    setSelectedPuckId(null)
    beginDrag({ kind: 'player', id }, e)
  }

  const startPuckDrag = (id: FoundationRinkRegionId, e: ReactPointerEvent) => {
    if (playerFigureStyle !== 'boardStudio') return
    setSelectedId(id)
    setSelectedPuckId(id)
    beginDrag({ kind: 'puck', id }, e)
  }

  const foundationLearningSelected =
    learning.showFeedback && learning.feedbackSide === 'weak' ? 'weak_side' : null

  const activeLearning: StyleLabLearning = {
    ...learning,
    weakSideBand: learning.weakSideBand || scene?.weakSideBand || 'top',
  }

  const compareOverrides = useMemo(
    () => editsToFoundationOverrides(markerEdits),
    [markerEdits],
  )

  const sceneMarkersProps = {
    space: 'detailed' as const,
    markerEdits,
    playerFigureStyle,
    globalPlayerScale: globalDisplay.playerScale,
    globalPuckLocal: { x: globalDisplay.puckLocalX, y: globalDisplay.puckLocalY },
    puckDragPreview,
    editable: sceneEditMode && mode === 'design',
    selectedId,
    selectedPuckId,
    onSelectPlayer: (id: FoundationRinkRegionId) => {
      setSelectedId(id)
      setSelectedPuckId(null)
    },
    onSelectPuck: (id: FoundationRinkRegionId) => {
      setSelectedId(id)
      setSelectedPuckId(id)
    },
    onPointerDownPlayer: startPlayerDrag,
    onPointerDownPuck: startPuckDrag,
  }

  return (
    <div className={styles.lab}>
      <p className={styles.banner} role="status">
        Scene Editor · globale Spielergröße/Pucklage · Szenen-Entwürfe getrennt · keine Curriculum-Schreibung ·
        Schläger
        {' '}
        {STYLE_LAB_STICK_COLOR}
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
            </div>

            <h2 className={styles.controlsTitle}>Angriffsrichtung</h2>
            <div className={styles.chipRow}>
              <UiChip active={attackArrowOverride === 'scene'} onClick={() => setAttackArrowOverride('scene')}>Szene</UiChip>
              <UiChip active={attackArrowOverride === 'on'} onClick={() => setAttackArrowOverride('on')}>An</UiChip>
              <UiChip active={attackArrowOverride === 'off'} onClick={() => setAttackArrowOverride('off')}>Aus</UiChip>
            </div>

            <h2 className={styles.controlsTitle}>Label-Semantik</h2>
            <div className={styles.chipRow}>
              <UiChip active={markerVariant === 'team'} onClick={() => setMarkerVariant('team')}>Team</UiChip>
              <UiChip active={markerVariant === 'role'} onClick={() => setMarkerVariant('role')}>Rolle</UiChip>
              <UiChip active={markerVariant === 'neutral'} onClick={() => setMarkerVariant('neutral')}>Neutral</UiChip>
            </div>

            <h2 className={styles.controlsTitle}>Spielerfigur</h2>
            <div className={styles.chipRow} role="group" aria-label="Spielerfigur">
              <UiChip active={playerFigureStyle === 'legacy'} onClick={() => setPlayerFigureStyle('legacy')}>Legacy</UiChip>
              <UiChip active={playerFigureStyle === 'boardStudio'} onClick={() => setPlayerFigureStyle('boardStudio')}>Board Studio</UiChip>
            </div>

            {playerFigureStyle === 'boardStudio' ? (
              <>
                <h2 className={styles.controlsTitle}>Globale Darstellung</h2>
                <label className={styles.sliderRow}>
                  <span>
                    Spielergröße
                    {' '}
                    {globalDisplay.playerScale.toFixed(2)}
                  </span>
                  <input
                    type="range"
                    min={0.2}
                    max={1.5}
                    step={0.05}
                    value={globalDisplay.playerScale}
                    onChange={(e) => updateGlobalDisplay({ playerScale: Number(e.target.value) })}
                  />
                </label>
                <label className={styles.sliderRow}>
                  <span>
                    Puck-Preset Körper↔Kelle
                    {' '}
                    {globalDisplay.puckBias < 0.15
                      ? 'Körper'
                      : globalDisplay.puckBias > 0.85
                        ? 'Kelle'
                        : `${Math.round(globalDisplay.puckBias * 100)}%`}
                  </span>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={globalDisplay.puckBias}
                    onChange={(e) => updateGlobalDisplay({ puckBias: Number(e.target.value) })}
                  />
                </label>
                <p className={styles.hint}>
                  Größe &amp; Puck-Tip (Design-Raum) global · Schläger
                  {' '}
                  {STYLE_LAB_STICK_COLOR}
                  . Feinposition: Puck ziehen, dann „Global übernehmen“.
                </p>
              </>
            ) : null}

            <DevValuesPanel refreshKey={globalDisplay} />

            <h2 className={styles.controlsTitle}>Szenen-Editor</h2>
            <div className={styles.chipRow}>
              <UiChip active={sceneEditMode} onClick={() => setSceneEditMode(true)}>Bearbeiten</UiChip>
              <UiChip active={!sceneEditMode} onClick={() => setSceneEditMode(false)}>Ansicht</UiChip>
            </div>
            <p className={styles.hint}>
              Spieler tippen/ziehen · Entwürfe nur für diese Szenen-ID · kein Curriculum-Write
            </p>
            <div className={styles.chipRow}>
              <UiChip active={false} onClick={handleSaveDraft}>Entwurf speichern</UiChip>
              <UiChip active={false} onClick={handleResetDraft}>Zurücksetzen</UiChip>
            </div>
            {draftSavedAt ? (
              <p className={styles.hint}>
                Gespeichert:
                {' '}
                {new Date(draftSavedAt).toLocaleString()}
              </p>
            ) : (
              <p className={styles.hint}>Kein gespeicherter Entwurf für diese Szene.</p>
            )}

            {selected ? (
              <>
                <h2 className={styles.controlsTitle}>
                  Auswahl ·
                  {' '}
                  {selected.id}
                </h2>
                <label className={styles.sliderRow}>
                  <span>Nummer</span>
                  <input
                    type="text"
                    maxLength={8}
                    value={selected.label}
                    onChange={(e) => patchSelected({ label: e.target.value })}
                  />
                </label>
                <div className={styles.chipRow} role="group" aria-label="Teamfarbe">
                  {(['blue', 'red', 'neutral'] as const).map((t) => (
                    <UiChip
                      key={t}
                      active={selected.team === t}
                      onClick={() => patchSelected({ team: t })}
                    >
                      {t}
                    </UiChip>
                  ))}
                </div>
                {playerFigureStyle === 'boardStudio' ? (
                  <>
                    <label className={styles.sliderRow}>
                      <span>
                        Rotation
                        {' '}
                        {Math.round(selected.rotation)}
                        °
                      </span>
                      <input
                        type="range"
                        min={0}
                        max={359}
                        step={1}
                        value={selected.rotation}
                        onChange={(e) => patchSelected({ rotation: Number(e.target.value) })}
                      />
                    </label>
                    <div className={styles.chipRow}>
                      <UiChip
                        active={selected.handedness === 'right'}
                        onClick={() => patchSelected({ handedness: 'right' as PlayerHandedness })}
                      >
                        Right
                      </UiChip>
                      <UiChip
                        active={selected.handedness === 'left'}
                        onClick={() => patchSelected({ handedness: 'left' as PlayerHandedness })}
                      >
                        Left
                      </UiChip>
                    </div>
                    <Toggle
                      label="Puckbesitz"
                      checked={selected.hasPuck}
                      onChange={(v) => {
                        patchSelected({ hasPuck: v, puckOffsetX: 0, puckOffsetY: 0 })
                        if (!v) setPuckDragPreview(null)
                      }}
                    />
                    {selected.hasPuck ? (
                      <>
                        <p className={styles.hint}>
                          Puck ziehen = Vorschau relativ zu Spieler/Schläger.
                          {selectedPuckId === selected.id ? ' · Puck ausgewählt' : ''}
                          {puckDragPreview?.id === selected.id
                            ? ' · Vorschau aktiv (nicht gespeichert)'
                            : ''}
                        </p>
                        <UiChip
                          active={Boolean(puckDragPreview?.id === selected.id)}
                          onClick={adoptPuckPositionGlobally}
                        >
                          Puckposition global übernehmen
                        </UiChip>
                        {puckDragPreview?.id === selected.id ? (
                          <UiChip
                            active={false}
                            onClick={() => setPuckDragPreview(null)}
                          >
                            Vorschau verwerfen
                          </UiChip>
                        ) : null}
                      </>
                    ) : null}
                  </>
                ) : (
                  <p className={styles.hint}>Rotation/Händigkeit/Puck nur im Board-Studio-Modus.</p>
                )}
              </>
            ) : (
              <p className={styles.hint}>Spieler auf dem Rink auswählen, um Eigenschaften zu setzen.</p>
            )}

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
            {sceneEditMode ? (
              <p className={styles.hint}>Editor aktiv · Learning-Hitboxes nicht klickbar (weiter sichtbar).</p>
            ) : null}
          </aside>

          <section className={styles.panel}>
            <header className={styles.panelHead}>
              <h2 className={styles.panelTitle}>Detailed · Scene Editor</h2>
              <p className={styles.panelMeta}>
                {sceneEditMode ? 'Bearbeiten' : 'Ansicht'}
                {' · '}
                {playerFigureStyle === 'boardStudio' ? 'Board Studio' : 'Legacy'}
                {' · '}
                {scene?.id}
              </p>
            </header>
            <DetailedStage
              markings={markings}
              learning={activeLearning}
              markingIntensity={markingIntensity}
              showAttackArrow={showAttackArrow}
              attackDirection={scene?.attackDirection || 'right'}
              onSelectHalf={onSelectHalf}
              learningInteractive={!sceneEditMode}
              svgRef={svgRef}
            >
              {scene ? <SceneMarkers {...sceneMarkersProps} /> : null}
            </DetailedStage>
          </section>
        </div>
      )}

      {mode === 'compare' && scene && (
        <div className={styles.compareGrid}>
          <section className={styles.panel}>
            <header className={styles.panelHead}>
              <h2 className={styles.panelTitle}>FoundationRink</h2>
              <p className={styles.panelMeta}>Original · aktuelle Entwurfspositionen (Legacy)</p>
            </header>
            <div className={stageStyles.foundationWrap}>
              <FoundationRink
                attackDirection={scene.attackDirection}
                showMarkers={scene.showMarkers}
                markerOverrides={compareOverrides}
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
              <p className={styles.panelMeta}>Dieselbe Entwurfs-Szene · read-only Compare</p>
            </header>
            <DetailedStage
              markings={markings}
              learning={activeLearning}
              markingIntensity={markingIntensity}
              showAttackArrow={showAttackArrow}
              attackDirection={scene.attackDirection}
              onSelectHalf={onSelectHalf}
              learningInteractive
            >
              <SceneMarkers
                space="detailed"
                markerEdits={markerEdits}
                playerFigureStyle={playerFigureStyle}
                globalPlayerScale={globalDisplay.playerScale}
                globalPuckLocal={{ x: globalDisplay.puckLocalX, y: globalDisplay.puckLocalY }}
                editable={false}
              />
            </DetailedStage>
          </section>
        </div>
      )}
    </div>
  )
}
