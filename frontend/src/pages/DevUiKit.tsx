import { Link } from 'react-router-dom'
import { MechanicGlyph } from '../components/visuals'
import { KpiRevealCard } from '../components/dashboard/KpiRevealCard'
import { UiButton, UiButtonLink, UiChip, UiPill, UiProgress, TapReveal } from '../components/ui'
import styles from './DevUiKit.module.css'

export default function DevUiKit() {
  return (
    <div className={styles.page}>
      <header className="ui-page-header">
        <h1 className="ui-page-title">UI Kit</h1>
        <p className="ui-page-lead">
          Quiet Arena / Glass-Primitives zum schnellen visuellen Prüfen. Zurück zum{' '}
          <Link to="/dev">Dev-Cockpit</Link>.
        </p>
      </header>

      <section className={styles.card}>
        <h2 className="ui-section-title">Buttons</h2>
        <div className={styles.row}>
          <UiButton>Primary</UiButton>
          <UiButton variant="secondary">Secondary</UiButton>
          <UiButton variant="ghost">Ghost</UiButton>
          <UiButton variant="danger">Danger</UiButton>
          <UiButton variant="dev" size="sm">Dev sm</UiButton>
          <UiButtonLink to="/dev" variant="secondary" size="sm">Link</UiButtonLink>
        </div>
      </section>

      <section className={styles.card}>
        <h2 className="ui-section-title">Chips & Pills</h2>
        <div className={styles.row}>
          <UiChip>Chip</UiChip>
          <UiPill>Pill</UiPill>
          <UiPill tone="accent">Accent</UiPill>
          <UiPill tone="ok">Ok</UiPill>
          <UiPill tone="warn">Warn</UiPill>
          <UiPill tone="danger">Danger</UiPill>
        </div>
      </section>

      <section className={styles.card}>
        <h2 className="ui-section-title">Progress</h2>
        <UiProgress value={42} max={100} label="Demo" />
      </section>

      <section className={styles.card}>
        <h2 className="ui-section-title">Glyphen (Tap-to-reveal)</h2>
        <div className={styles.row}>
          <MechanicGlyph kind="paint" />
          <MechanicGlyph kind="path" />
          <MechanicGlyph kind="placement" />
          <MechanicGlyph kind="choice" />
        </div>
      </section>

      <section className={styles.card}>
        <h2 className="ui-section-title">TapReveal</h2>
        <TapReveal
          title="Beispiel"
          trigger={<UiButton variant="secondary" size="sm">Antippen</UiButton>}
        >
          <p>Kurzinfo + nächster Schritt — Kinder-intuitive Bedienung.</p>
          <div className="ui-tap-reveal-actions">
            <UiButtonLink to="/dev" size="sm" variant="primary">Zum Dev</UiButtonLink>
          </div>
        </TapReveal>
      </section>

      <section className={styles.card}>
        <h2 className="ui-section-title">KPI Reveal</h2>
        <div className={styles.kpiRow}>
          <KpiRevealCard
            title="Streak"
            value={3}
            hint="Tage in Folge"
            panelTitle="Demo-Streak"
            panel={<p>Nur für UI-Checks — keine echten Daten.</p>}
          />
          <KpiRevealCard
            title="Sessions"
            value={12}
            hint="gesamt"
            panelTitle="Demo-Sessions"
            align="right"
            panel={<p>Tap-to-reveal Karte.</p>}
          />
        </div>
      </section>
    </div>
  )
}
