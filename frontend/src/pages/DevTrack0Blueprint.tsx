import { useState } from 'react'
import { Link } from 'react-router-dom'
import Card from '../components/Card'
import { UiChip, UiPill } from '../components/ui'
import { DEMO_RINK_SPEC, RinkBlueprint, type BlueprintViewMode } from '../features/blueprintLab'
import styles from './DevTrack0Blueprint.module.css'

const COMING_LATER = [
  { id: 'stick', label: 'Stick' },
  { id: 'puck', label: 'Puck' },
] as const

export default function DevTrack0BlueprintPage() {
  const [mode, setMode] = useState<BlueprintViewMode>('basic')

  return (
    <article className={`ui-page-shell ${styles.page}`}>
      <header className="ui-page-header">
        <p className={styles.kicker}>Track 0 · Field Guide / Blueprint Lab</p>
        <h1 className="ui-page-title">Blueprint Lab</h1>
        <p className="ui-page-lead">Hockey verstehen – vom Material bis zum Spielfeld.</p>
      </header>

      <p className={styles.banner} role="status">
        Prototype – Maße noch nicht fachlich freigegeben.
      </p>

      <div className={styles.guideGrid} aria-label="Field Guide">
        <Card surface="nested">
          <p className={styles.guideTitle}>Rink</p>
          <p className={styles.guideMeta}>Prototype</p>
        </Card>
        {COMING_LATER.map((item) => (
          <Card key={item.id} surface="nested" className={styles.guideDisabled}>
            <p className={styles.guideTitle}>{item.label}</p>
            <UiPill>Später</UiPill>
          </Card>
        ))}
      </div>

      <Card surface="primary" className={styles.stage}>
        <div className={styles.stageHead}>
          <h2 className="ui-section-title">Rink</h2>
          <div className={styles.modes} role="group" aria-label="Darstellungsmodus">
            <UiChip active={mode === 'basic'} onClick={() => setMode('basic')}>
              Grundlagen
            </UiChip>
            <UiChip active={mode === 'technical'} onClick={() => setMode('technical')}>
              Technische Ansicht
            </UiChip>
          </div>
        </div>
        <div className={styles.canvas}>
          <RinkBlueprint spec={DEMO_RINK_SPEC} mode={mode} />
        </div>
        <p className={styles.demoNote}>
          DEMO DATA · Maße aktuell nur Platzhalter · {DEMO_RINK_SPEC.lengthM} × {DEMO_RINK_SPEC.widthM} m
        </p>
      </Card>

      <p className={styles.back}>
        <Link to="/curriculum">Zurück zur Akademie</Link>
        {' · '}
        <Link to="/dev">Dev-Cockpit</Link>
      </p>
    </article>
  )
}
