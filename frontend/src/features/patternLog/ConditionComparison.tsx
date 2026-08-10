import type { ConditionDimensionSummary } from './types'

type ConditionComparisonProps = {
  title?: string
  dimensions: ConditionDimensionSummary[]
  hasCounterCases: boolean
}

export function ConditionComparison({
  title = 'Condition Comparison',
  dimensions,
  hasCounterCases,
}: ConditionComparisonProps) {
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
        <h4 style={{ margin: '0 0 0.35rem', fontSize: '0.92rem', color: '#e2e8f0' }}>{title}</h4>
        <p style={{ margin: 0, fontSize: '0.78rem', color: 'rgba(226,232,240,0.62)', lineHeight: 1.4 }}>
          Deskriptiv: welche Bedingungen in Musterfällen häufig gleich bleiben
          {hasCounterCases ? ' – und ob der Gegenfall abweicht' : ''}.
          Keine automatische Kausalität.
        </p>
      </div>

      <div style={{ display: 'grid', gap: '0.55rem' }}>
        {dimensions.map((dim) => (
          <div
            key={dim.dimensionId}
            style={{
              padding: '0.55rem 0.65rem',
              borderRadius: '8px',
              border: dim.differsInCounter
                ? '1px solid rgba(251,191,36,0.4)'
                : '1px solid rgba(255,255,255,0.1)',
              background: dim.differsInCounter
                ? 'rgba(245,158,11,0.08)'
                : 'rgba(255,255,255,0.03)',
            }}
          >
            <div style={{ fontWeight: 800, fontSize: '0.86rem', color: '#e2e8f0', marginBottom: '0.25rem' }}>
              {dim.label}
              {dim.differsInCounter ? ' · Abweichung im Gegenfall' : ''}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'rgba(226,232,240,0.8)', lineHeight: 1.4 }}>
              Musterfälle: {dim.patternDetail}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'rgba(226,232,240,0.72)', lineHeight: 1.4 }}>
              Gegenfall: {dim.counterDetail}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
