import type { PatternConsistency } from './types'

type PatternFingerprintProps = {
  title?: string
  dimensions: PatternConsistency[]
}

export function PatternFingerprint({ title = 'Pattern Fingerprint', dimensions }: PatternFingerprintProps) {
  return (
    <section
      style={{
        padding: '0.75rem 0.85rem',
        borderRadius: '8px',
        border: '1px solid rgba(148,163,184,0.28)',
        background: 'rgba(15,23,42,0.55)',
      }}
    >
      <h4 style={{ margin: '0 0 0.55rem', fontSize: '0.92rem', color: '#e2e8f0' }}>{title}</h4>
      <p style={{ margin: '0 0 0.65rem', fontSize: '0.78rem', color: 'rgba(226,232,240,0.62)', lineHeight: 1.4 }}>
        Zeigt nur, welche Merkmale in deinen bisherigen Einträgen wiederholt ähnlich waren — kein Score.
      </p>
      <div style={{ display: 'grid', gap: '0.45rem' }}>
        {dimensions.map((dim) => (
          <div
            key={dim.key}
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(72px, 88px) 1fr',
              gap: '0.45rem',
              alignItems: 'center',
            }}
          >
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#cbd5e1', letterSpacing: '0.04em' }}>
              {dim.label.toUpperCase()}
            </span>
            <div>
              <div style={{ display: 'flex', gap: '0.28rem', marginBottom: '0.12rem' }} aria-hidden="true">
                {Array.from({ length: dim.totalDots }).map((_, idx) => {
                  const filled = idx < dim.filledDots
                  return (
                    <span
                      key={`${dim.key}-dot-${idx}`}
                      style={{
                        width: '0.72rem',
                        height: '0.72rem',
                        borderRadius: '999px',
                        background: filled ? '#5eead4' : 'rgba(148,163,184,0.22)',
                        border: filled ? '1px solid rgba(153,246,228,0.7)' : '1px solid rgba(148,163,184,0.28)',
                      }}
                    />
                  )
                })}
              </div>
              <div style={{ fontSize: '0.74rem', color: 'rgba(226,232,240,0.68)' }}>{dim.detail}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
