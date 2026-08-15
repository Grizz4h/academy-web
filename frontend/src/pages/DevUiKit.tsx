import { useState } from 'react'
import { Link } from 'react-router-dom'
import Card from '../components/Card'
import { MechanicGlyph } from '../components/visuals'
import { KpiRevealCard } from '../components/dashboard/KpiRevealCard'
import {
  TapReveal,
  UiActionRow,
  UiButton,
  UiButtonLink,
  UiChip,
  UiPill,
  UiProgress,
  UiSheet,
  UiSheetActions,
} from '../components/ui'
import styles from './DevUiKit.module.css'

export default function DevUiKit() {
  const [sheetOpen, setSheetOpen] = useState(false)
  const [chip, setChip] = useState<'all' | 'daily'>('all')

  return (
    <div className={`ui-page-shell ${styles.page}`}>
      <header className="ui-page-header">
        <h1 className="ui-page-title">UI Kit</h1>
        <p className="ui-page-lead">
          Sichtbare Bibliothek. Regeln liegen nur in <code>.cursor/rules/ui-catalog.mdc</code>.
          Zurück zum <Link to="/dev">Dev-Cockpit</Link>.
        </p>
      </header>

      <Card surface="section">
        <h2 className="ui-section-title">Buttons</h2>
        <div className={styles.row}>
          <UiButton>Primary</UiButton>
          <UiButton variant="secondary">Secondary</UiButton>
          <UiButton variant="ghost">Ghost</UiButton>
          <UiButton variant="danger">Danger</UiButton>
          <UiButton variant="dev" size="sm">Dev sm</UiButton>
          <UiButtonLink to="/dev" variant="secondary" size="sm">Link</UiButtonLink>
        </div>
        <p className="ui-page-lead">
          Paarung über `UiActionRow`: erster türkis, zweiter `secondary` (leicht dunkel).
          Nicht `ghost` — das ist komplett durchsichtig und nur für Zurück/Schließen.
        </p>
        <UiActionRow>
          <UiButton size="sm">Einziger Schritt</UiButton>
        </UiActionRow>
        <UiActionRow>
          <UiButton size="sm">Weiter</UiButton>
          <UiButton size="sm">Abbrechen</UiButton>
        </UiActionRow>
      </Card>

      <Card surface="section">
        <h2 className="ui-section-title">Chips, Pills, Progress</h2>
        <div className={styles.row}>
          <UiChip active={chip === 'all'} onClick={() => setChip('all')}>Alle</UiChip>
          <UiChip active={chip === 'daily'} onClick={() => setChip('daily')}>Daily</UiChip>
          <UiPill>Neutral</UiPill>
          <UiPill tone="accent">Accent</UiPill>
          <UiPill tone="ok">Ok</UiPill>
          <UiPill tone="warn">Warn</UiPill>
          <UiPill tone="danger">Danger</UiPill>
        </div>
        <UiProgress value={42} max={100} label="Demo" />
      </Card>

      <Card surface="section">
        <h2 className="ui-section-title">Flächen</h2>
        <p className="ui-page-lead">
          `Card` mit `surface`. Desktop darf schachteln. Ab 768px flachen section/nested/inline ab —
          kein Card-in-Card, keine kleineren Schriften als Fix.
        </p>
        <div className={styles.surfaceStack}>
          <Card surface="primary" elevation="quiet">primary — eine dominante Fläche</Card>
          <Card surface="section" elevation="quiet">section — Seitenblock</Card>
          <Card surface="nested" elevation="quiet">nested — innen, kein Card-in-Card</Card>
          <Card surface="inline" elevation="quiet">inline — leichter Hinweis</Card>
        </div>
      </Card>

      <Card surface="section">
        <h2 className="ui-section-title">KPI + TapReveal</h2>
        <div className={styles.kpiRow}>
          <KpiRevealCard
            title="Streak"
            value={3}
            hint="Tage in Folge"
            panelTitle="Demo-Streak"
            panel={
              <>
                <p>Nur für UI-Checks — keine echten Daten.</p>
                <UiActionRow>
                  <UiButtonLink to="/history" size="sm">Verlauf</UiButtonLink>
                </UiActionRow>
              </>
            }
          />
          <KpiRevealCard
            title="Sessions"
            value={12}
            hint="gesamt"
            panelTitle="Demo-Sessions"
            align="right"
            panel={
              <>
                <p>Zwei Aktionen: erste türkis, zweite farblos.</p>
                <UiActionRow>
                  <UiButtonLink to="/history" size="sm">Verlauf</UiButtonLink>
                  <UiButtonLink to="/progress" size="sm">Stats</UiButtonLink>
                </UiActionRow>
              </>
            }
          />
        </div>
        <div className={styles.row}>
          <MechanicGlyph kind="paint" />
          <MechanicGlyph kind="path" />
          <TapReveal title="Beispiel" trigger={<UiButton variant="secondary" size="sm">Antippen</UiButton>}>
            <p>Kurzinfo + nächster Schritt.</p>
            <UiActionRow>
              <UiButtonLink to="/dev" size="sm">Zum Dev</UiButtonLink>
            </UiActionRow>
          </TapReveal>
        </div>
      </Card>

      <details className="ui-more">
        <summary className="ui-more__summary">
          <span>Akkordeon · .ui-more</span>
          <span className="ui-more__chevron" aria-hidden="true" />
        </summary>
        <div className="ui-more__body">
          <p className="ui-page-lead">
            Kanonisch für Home/Stats-„mehr“. Bestehende `.morePanel`-Kopien später hierher ziehen, nicht neu erfinden.
          </p>
        </div>
      </details>

      <Card surface="section">
        <h2 className="ui-section-title">Liste vs. Karte</h2>
        <p className="ui-page-lead">Flache Zeile nur für dichte Meta. Aufgaben/Achievements: Karte mit Balken wie im Locker.</p>
        <div className={styles.listRow}>
          <span>Flache Zeile</span>
          <span>2 / 5</span>
        </div>
        <div className={styles.taskCard}>
          <strong>Aufgaben-Karte</strong>
          <UiProgress value={2} max={5} label="Demo" size="sm" />
          <span>2 / 5 · +20 Pux</span>
        </div>
      </Card>

      <Card surface="section">
        <h2 className="ui-section-title">Sheet</h2>
        <p className="ui-page-lead">`UiSheet`: Abbrechen links, Primary rechts. Kein eigenes Modal.</p>
        <UiButton size="sm" onClick={() => setSheetOpen(true)}>Sheet öffnen</UiButton>
        <UiSheet open={sheetOpen} onClose={() => setSheetOpen(false)} title="Beispiel-Sheet" meta="Locker / Aktionen">
          <p className="ui-page-lead">Portal auf document.body, Bottom-Sheet auf Mobile.</p>
          <UiSheetActions
            secondary={
              <UiButton variant="secondary" onClick={() => setSheetOpen(false)}>
                Abbrechen
              </UiButton>
            }
            primary={
              <UiButton onClick={() => setSheetOpen(false)}>
                Übernehmen
              </UiButton>
            }
          />
        </UiSheet>
      </Card>

      <Card surface="section">
        <h2 className="ui-section-title">Mobile</h2>
        <p className="ui-page-lead">
          Ab 768px weicht das Layout absichtlich ab: Flächen flachen, Grids werden eine Spalte,
          Sheets kommen von unten, Tabellen stapeln. Desktop 1:1 kleiner machen ist kein Pattern.
        </p>
      </Card>

      <Card surface="nested">
        <h2 className="ui-section-title">Nicht in diesem Kit</h2>
        <p className="ui-page-lead">
          Drill-Renderer, Session-`.btn`, Locker-Rarity-Effekte, Tutorial-Chrome. Die bleiben eigene Welten.
        </p>
      </Card>
    </div>
  )
}
