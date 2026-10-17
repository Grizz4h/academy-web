import { useMemo, useState } from 'react'
import FoundationRink from '../foundation/FoundationRink'
import { UiChip } from '../../components/ui'
import { DetailedStage } from './DetailedStage'
import { SceneMarkers } from './SceneMarkers'
import { halfForBand, type IceHalf } from './labGeometry'
import {
  applyMarkerStyleVariant,
  DEFAULT_LEARNING,
  DEFAULT_MARKINGS,
  SCENE_PRESETS,
  type MarkerStyleVariant,
  type ScenePresetId,
  type StyleLabBase,
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

export function RinkStyleLab() {
  const [mode, setMode] = useState<StyleLabMode>('compare')
  const [base, setBase] = useState<StyleLabBase>('detailed')
  const [markings, setMarkings] = useState<StyleLabMarkings>(DEFAULT_MARKINGS)
  const [learning, setLearning] = useState<StyleLabLearning>(DEFAULT_LEARNING)
  const [presetId, setPresetId] = useState<ScenePresetId>('empty')
  const [markerVariant, setMarkerVariant] = useState<MarkerStyleVariant>('team')

  const preset = SCENE_PRESETS.find((p) => p.id === presetId) || SCENE_PRESETS[0]
  const markerOverrides = useMemo(
    () => applyMarkerStyleVariant(preset.markerOverrides, preset.showMarkers, markerVariant),
    [preset, markerVariant],
  )

  const applyPreset = (id: ScenePresetId) => {
    const next = SCENE_PRESETS.find((p) => p.id === id) || SCENE_PRESETS[0]
    setPresetId(id)
    if (next.learning) {
      setLearning({ ...DEFAULT_LEARNING, ...next.learning })
    } else if (id !== 'weak_strong') {
      setLearning((prev) => ({
        ...prev,
        showWeakStrong: false,
        showHitboxes: false,
        showFeedback: false,
        feedbackSide: null,
      }))
    }
  }

  const onSelectHalf = (half: IceHalf) => {
    const side = halfForBand(half, learning.weakSideBand)
    setLearning((prev) => ({
      ...prev,
      showFeedback: true,
      feedbackSide: side,
    }))
  }

  const setMarking = (key: keyof StyleLabMarkings, value: boolean) => {
    setMarkings((prev) => ({ ...prev, [key]: value }))
  }

  const foundationLearningSelected =
    learning.showFeedback && learning.feedbackSide === 'weak' ? 'weak_side' : null

  return (
    <div className={styles.lab}>
      <p className={styles.banner} role="status">
        Dev-only · Keine Curriculum-Exports · Geometrie noch nicht kanonisch —
        Compare zeigt vorhandene Renderer; Design ändert nur Darstellungsparameter.
      </p>

      <div className={styles.modeRow} role="group" aria-label="Lab-Modus">
        <UiChip active={mode === 'compare'} onClick={() => setMode('compare')}>
          Compare
        </UiChip>
        <UiChip active={mode === 'design'} onClick={() => setMode('design')}>
          Design
        </UiChip>
      </div>

      {mode === 'compare' && (
        <div className={styles.compareGrid}>
          <section className={styles.panel}>
            <header className={styles.panelHead}>
              <h2 className={styles.panelTitle}>FoundationRink</h2>
              <p className={styles.panelMeta}>400×240 · Track 0</p>
            </header>
            <div className={stageStyles.foundationWrap}>
              <FoundationRink
                attackDirection="right"
                showMarkers={preset.showMarkers}
                markerOverrides={markerOverrides}
                hideAttackArrow={preset.showMarkers.length > 0}
                weakSideBand={learning.weakSideBand}
                highlightRegions={
                  learning.showFeedback && learning.feedbackSide === 'weak' ? ['weak_side'] : []
                }
                selectedRegion={foundationLearningSelected}
              />
            </div>
          </section>
          <section className={styles.panel}>
            <header className={styles.panelHead}>
              <h2 className={styles.panelTitle}>DetailedHockeyRink</h2>
              <p className={styles.panelMeta}>
                900×620 · BLUE_LINE_FROM_END=
                {0.38}
                {' '}
                (Produkt-Metrics, noch nicht freigegeben)
              </p>
            </header>
            <DetailedStage markings={DEFAULT_MARKINGS} learning={DEFAULT_LEARNING}>
              <SceneMarkers
                space="detailed"
                showMarkers={preset.showMarkers}
                markerOverrides={markerOverrides}
              />
            </DetailedStage>
          </section>
        </div>
      )}

      {mode === 'design' && (
        <div className={styles.designLayout}>
          <aside className={styles.controls} aria-label="Design-Steuerung">
            <h2 className={styles.controlsTitle}>Basis</h2>
            <div className={styles.chipRow}>
              <UiChip active={base === 'detailed'} onClick={() => setBase('detailed')}>
                Detailed
              </UiChip>
              <UiChip active={base === 'foundation'} onClick={() => setBase('foundation')}>
                Foundation
              </UiChip>
            </div>

            <h2 className={styles.controlsTitle}>Szene</h2>
            <div className={styles.chipRow}>
              {SCENE_PRESETS.map((p) => (
                <UiChip key={p.id} active={presetId === p.id} onClick={() => applyPreset(p.id)}>
                  {p.label}
                </UiChip>
              ))}
            </div>

            <h2 className={styles.controlsTitle}>Marker-Stil</h2>
            <div className={styles.chipRow}>
              <UiChip active={markerVariant === 'team'} onClick={() => setMarkerVariant('team')}>
                Team (Blau/Rot)
              </UiChip>
              <UiChip active={markerVariant === 'role'} onClick={() => setMarkerVariant('role')}>
                Rolle
              </UiChip>
              <UiChip active={markerVariant === 'neutral'} onClick={() => setMarkerVariant('neutral')}>
                Neutral
              </UiChip>
            </div>

            <h2 className={styles.controlsTitle}>Markierungen</h2>
            {base === 'foundation' && (
              <p className={styles.hint}>
                Foundation malt Markierungen fest. Für einzelne Toggles Detailed wählen.
              </p>
            )}
            <div className={styles.toggleGrid}>
              <Toggle
                label="Faceoff-Dots / Kreise"
                checked={markings.faceoffDots}
                onChange={(v) => setMarking('faceoffDots', v)}
                disabled={base === 'foundation'}
              />
              <Toggle
                label="Goal Lines"
                checked={markings.goalLines}
                onChange={(v) => setMarking('goalLines', v)}
                disabled={base === 'foundation'}
              />
              <Toggle
                label="Tore"
                checked={markings.goals}
                onChange={(v) => setMarking('goals', v)}
                disabled={base === 'foundation'}
              />
              <Toggle
                label="Crease"
                checked={markings.crease}
                onChange={(v) => setMarking('crease', v)}
                disabled={base === 'foundation'}
              />
              <Toggle
                label="Zonen-Labels"
                checked={markings.labels}
                onChange={(v) => setMarking('labels', v)}
                disabled={base === 'foundation'}
              />
              <Toggle
                label="Ice-Ads"
                checked={markings.iceAds}
                onChange={(v) => setMarking('iceAds', v)}
                disabled={base === 'foundation'}
              />
            </div>

            <h2 className={styles.controlsTitle}>Learning (Weak / Strong)</h2>
            <div className={styles.toggleGrid}>
              <Toggle
                label="Hälften aktiv"
                checked={learning.showWeakStrong}
                onChange={(v) => setLearning((p) => ({ ...p, showWeakStrong: v, showHitboxes: v || p.showHitboxes }))}
              />
              <Toggle
                label="Hitboxes sichtbar"
                checked={learning.showHitboxes}
                onChange={(v) => setLearning((p) => ({ ...p, showHitboxes: v }))}
              />
              <Toggle
                label="Feedback anzeigen"
                checked={learning.showFeedback}
                onChange={(v) => setLearning((p) => ({
                  ...p,
                  showFeedback: v,
                  feedbackSide: v ? (p.feedbackSide || 'weak') : null,
                }))}
              />
            </div>
            <div className={styles.chipRow}>
              <UiChip
                active={learning.weakSideBand === 'top'}
                onClick={() => setLearning((p) => ({ ...p, weakSideBand: 'top' }))}
              >
                Weak = oben
              </UiChip>
              <UiChip
                active={learning.weakSideBand === 'bottom'}
                onClick={() => setLearning((p) => ({ ...p, weakSideBand: 'bottom' }))}
              >
                Weak = unten
              </UiChip>
            </div>
            {learning.feedbackSide && (
              <p className={styles.hint}>
                Feedback-Seite:
                {' '}
                {learning.feedbackSide === 'weak' ? 'Weak Side' : 'Strong Side'}
                {' '}
                (Tipp auf eine Hälfte im Stage)
              </p>
            )}
          </aside>

          <section className={styles.panel}>
            <header className={styles.panelHead}>
              <h2 className={styles.panelTitle}>
                Design ·
                {' '}
                {base === 'detailed' ? 'Detailed' : 'Foundation'}
              </h2>
              <p className={styles.panelMeta}>Nur Darstellungsparameter — keine neue Geometrie</p>
            </header>
            {base === 'detailed' ? (
              <DetailedStage
                markings={markings}
                learning={learning}
                onSelectHalf={onSelectHalf}
              >
                <SceneMarkers
                  space="detailed"
                  showMarkers={preset.showMarkers}
                  markerOverrides={markerOverrides}
                />
              </DetailedStage>
            ) : (
              <div className={stageStyles.foundationWrap}>
                <FoundationRink
                  attackDirection="right"
                  showMarkers={preset.showMarkers}
                  markerOverrides={markerOverrides}
                  hideAttackArrow={preset.showMarkers.length > 0}
                  weakSideBand={learning.weakSideBand}
                  highlightRegions={
                    learning.showFeedback && learning.feedbackSide === 'weak' ? ['weak_side'] : []
                  }
                  selectedRegion={foundationLearningSelected}
                />
                {(learning.showHitboxes || learning.showWeakStrong) && (
                  <p className={styles.hint}>
                    Weak/Strong-Hitboxes und Tipp-Feedback sind im Design-Modus auf der
                    Detailed-Basis verfügbar (Learning Layer). Foundation dient hier der
                    Marker-/Overlay-Vorschau.
                  </p>
                )}
              </div>
            )}
          </section>
        </div>
      )}

      {mode === 'compare' && (
        <div className={styles.comparePresets}>
          <span className={styles.controlsTitle}>Szenen-Preset (beide Seiten)</span>
          <div className={styles.chipRow}>
            {SCENE_PRESETS.map((p) => (
              <UiChip key={p.id} active={presetId === p.id} onClick={() => applyPreset(p.id)}>
                {p.label}
              </UiChip>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
