import {
  DEFAULT_ATTRIBUTION_OPTIONS,
  DEFAULT_CONFIDENCE_OPTIONS,
  labelForOption,
} from './labels'
import type { TendencyProfileSummary } from './types'

type TendencyProfileVisualProps = {
  title?: string
  summary: TendencyProfileSummary
  strongestTendencyId?: string
}

function SampleDots({ filled, total }: { filled: number; total: number }) {
  return (
    <span style={{ letterSpacing: '0.12em', color: '#99f6e4', fontSize: '0.85rem' }} aria-hidden>
      {Array.from({ length: total }, (_, i) => (i < filled ? '●' : '○')).join('')}
    </span>
  )
}

export function TendencyProfileVisual({
  title = 'Tendency Profile',
  summary,
  strongestTendencyId,
}: TendencyProfileVisualProps) {
  return (
    <section
      style={{
        padding: '0.75rem 0.85rem',
        borderRadius: '8px',
        border: '1px solid rgba(148,163,184,0.28)',
        background: 'rgba(15,23,42,0.55)',
        display: 'grid',
        gap: '0.65rem',
      }}
    >
      <div>
        <h4 style={{ margin: '0 0 0.25rem', fontSize: '0.92rem', color: '#e2e8f0' }}>{title}</h4>
        <p style={{ margin: 0, fontSize: '0.78rem', color: 'rgba(226,232,240,0.62)', lineHeight: 1.4 }}>
          Segmentbezogen — keine Teamwahrheit, kein Score.
        </p>
      </div>

      {summary.rows.length === 0 && (
        <p style={{ margin: 0, fontSize: '0.84rem', color: 'rgba(226,232,240,0.65)' }}>
          Noch keine Tendenzen dokumentiert.
        </p>
      )}

      {summary.rows.map((row, idx) => {
        const isStrongest = strongestTendencyId && row.id === strongestTendencyId
        return (
          <div
            key={row.id}
            style={{
              padding: '0.6rem 0.7rem',
              borderRadius: '8px',
              border: isStrongest
                ? '1px solid rgba(45,212,191,0.5)'
                : '1px solid rgba(255,255,255,0.12)',
              background: isStrongest ? 'rgba(20,184,166,0.1)' : 'rgba(255,255,255,0.03)',
              display: 'grid',
              gap: '0.3rem',
            }}
          >
            <div style={{ fontWeight: 750, fontSize: '0.88rem', color: '#f1f5f9' }}>
              {idx + 1} · {row.summary}
              {isStrongest ? ' · am belastbarsten' : ''}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.65rem', alignItems: 'center', fontSize: '0.8rem', color: 'rgba(226,232,240,0.8)' }}>
              <span>
                <SampleDots filled={row.sampleDots} total={row.sampleTotal} />{' '}
                {row.frequencyLabel}
              </span>
              <span>Confidence: {row.confidenceLabel}</span>
            </div>
            <div style={{ fontSize: '0.8rem', color: 'rgba(153,246,228,0.9)' }}>
              Einordnung: {row.attributionLabel}
            </div>
          </div>
        )
      })}

      {summary.statements.length > 0 && (
        <ul style={{ margin: 0, paddingLeft: '1.05rem', display: 'grid', gap: '0.15rem' }}>
          {summary.statements.map((line) => (
            <li key={line} style={{ fontSize: '0.78rem', color: 'rgba(226,232,240,0.7)', lineHeight: 1.4 }}>
              {line}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export function tendencyShortLabel(
  summary: string,
  fallbackIndex: number,
): string {
  const trimmed = String(summary || '').trim()
  if (!trimmed) return `Tendenz ${fallbackIndex}`
  return trimmed.length > 42 ? `${trimmed.slice(0, 40)}…` : trimmed
}

export { labelForOption, DEFAULT_ATTRIBUTION_OPTIONS, DEFAULT_CONFIDENCE_OPTIONS }
