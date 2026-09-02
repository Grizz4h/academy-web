import { type Ref, useEffect } from 'react'
import { AnchoredPopover } from '../../components/ui'
import { useExclusivePopover } from '../../components/ui/useExclusivePopover'
import {
  capabilityLabelForItem,
  formatRatioPercent,
} from './competencyLogic'
import type { CompetencyItem } from './types'
import styles from './CompetencyRadar.module.css'

type CompetencyScoutCardProps = {
  item: CompetencyItem
  selected: boolean
  onHighlight: (id: string) => void
  align?: 'left' | 'right'
}

function ConfidenceRing({ confidence }: { confidence: number }) {
  const clamped = Math.max(0, Math.min(1, confidence))
  const size = 36
  const stroke = 3
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const offset = c * (1 - clamped)
  return (
    <svg className={styles.confRing} width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
      <circle
        className={styles.confRingTrack}
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        strokeWidth={stroke}
      />
      <circle
        className={styles.confRingValue}
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        strokeWidth={stroke}
        strokeDasharray={c}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
    </svg>
  )
}

export function CompetencyScoutCard({
  item,
  selected,
  onHighlight,
  align = 'left',
}: CompetencyScoutCardProps) {
  const { open, toggle, close, triggerRef, popoverRef, panelId } = useExclusivePopover()
  const band = capabilityLabelForItem(item)
  const rated = item.status === 'rated'

  useEffect(() => {
    if (open) onHighlight(item.competencyId)
  }, [open, item.competencyId, onHighlight])

  return (
    <span className={styles.scoutWrap}>
      <div
        ref={triggerRef as Ref<HTMLDivElement>}
        role="button"
        tabIndex={0}
        className={[
          styles.stat,
          selected ? styles.statSelected : '',
          !rated ? styles.statUnrated : '',
          open ? styles.statOpen : '',
        ]
          .filter(Boolean)
          .join(' ')}
        data-competency-axis={item.competencyId}
        data-status={item.status}
        aria-pressed={selected || open}
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={`${item.label}: Details anzeigen`}
        onClick={(event) => {
          event.preventDefault()
          event.stopPropagation()
          onHighlight(item.competencyId)
          toggle()
        }}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            event.stopPropagation()
            onHighlight(item.competencyId)
            toggle()
          }
        }}
      >
        <span className={styles.statTop}>
          <span className={styles.statLabel}>{item.label}</span>
          {rated ? (
            <span className={styles.statScoreCluster}>
              <ConfidenceRing confidence={item.confidence} />
              <strong className={styles.statScore}>{Math.round(item.score)}</strong>
            </span>
          ) : (
            <em className={styles.unrated}>Offen</em>
          )}
        </span>

        {rated ? (
          <>
            <span className={styles.scoreBar} aria-hidden="true">
              <span className={styles.scoreBarFill} style={{ width: `${Math.max(0, Math.min(100, item.score))}%` }} />
            </span>
            <span className={styles.breadthRow} aria-hidden="true">
              <span className={styles.breadthLabel}>Evidenzbreite</span>
              <span className={styles.breadthTrack}>
                <span
                  className={styles.breadthFill}
                  style={{ width: `${Math.max(0, Math.min(100, item.breadth * 100))}%` }}
                />
              </span>
            </span>
            <span className={styles.statMeta}>
              {band ? <span className={styles.statBand}>{band}</span> : null}
              <span>Conf {formatRatioPercent(item.confidence)}</span>
            </span>
          </>
        ) : (
          <span className={styles.unratedHint}>Noch nicht bewertet</span>
        )}
        <span className="ui-tap-hint" aria-hidden="true">
          Antippen für Details
        </span>
      </div>

      <AnchoredPopover
        ref={popoverRef as Ref<HTMLDivElement>}
        open={open}
        anchorRef={triggerRef}
        align={align}
        preferredWidth={300}
        id={panelId}
        ariaLabel={item.label}
        className="ui-tap-reveal-panel"
        onDismiss={close}
      >
        <div className="ui-tap-reveal-header">
          <h3 className="ui-tap-reveal-title">{item.label}</h3>
        </div>
        <div className="ui-tap-reveal-body">
          {rated ? (
            <>
              <dl className={styles.detailGrid}>
                <div>
                  <dt>Score</dt>
                  <dd>{Math.round(item.score)}</dd>
                </div>
                <div>
                  <dt>Confidence</dt>
                  <dd>{formatRatioPercent(item.confidence)}</dd>
                </div>
                <div>
                  <dt>Evidenzbreite</dt>
                  <dd>{formatRatioPercent(item.breadth)}</dd>
                </div>
                <div>
                  <dt>Evidence</dt>
                  <dd>{item.evidenceCount}</dd>
                </div>
                <div>
                  <dt>Höchstes Evidence-Level</dt>
                  <dd>{item.highestEvidenceLevel}</dd>
                </div>
                {band ? (
                  <div>
                    <dt>Capability Band</dt>
                    <dd>{band}</dd>
                  </div>
                ) : null}
              </dl>
              <p className={styles.detailHint}>
                Confidence: Sicherheit der Schätzung · Evidenzbreite: Vielfalt der Evidenzbasis über
                Drills/Tracks/Kontexte (nicht Fortschritt zu 100%).
              </p>
            </>
          ) : (
            <p className={styles.detailMuted}>
              Für diese Kompetenz liegt noch keine auswertbare Evidenz vor.
            </p>
          )}
        </div>
      </AnchoredPopover>
    </span>
  )
}
