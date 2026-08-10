import type { DimensionAssessmentEntry, DimensionConsistencySummary, InvariantDimensionRole } from './types'
import { DEFAULT_INVARIANT_DIMENSION_ROLE_OPTIONS } from './labels'
import { OptionChips } from './OptionChips'

type InvariantMapProps = {
  title?: string
  dimensions: DimensionConsistencySummary[]
  assessments: DimensionAssessmentEntry[]
  onAssess: (dimensionId: DimensionConsistencySummary['dimensionId'], role: InvariantDimensionRole) => void
  interactive?: boolean
}

function consistencyBadge(consistency: DimensionConsistencySummary['consistency']): string {
  if (consistency === 'constant') return 'konstant'
  if (consistency === 'mostly_constant') return 'meist konstant'
  if (consistency === 'variable') return 'variabel'
  if (consistency === 'user_judged') return 'Nutzer'
  return 'wenig Daten'
}

export function InvariantMap({
  title = 'Invariant Map',
  dimensions,
  assessments,
  onAssess,
  interactive = true,
}: InvariantMapProps) {
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
          Deskriptive Konsistenz strukturierter Werte. Freitext wird nicht automatisch interpretiert.
        </p>
      </div>

      <div style={{ display: 'grid', gap: '0.6rem' }}>
        {dimensions.map((dim) => {
          const assessment = assessments.find((entry) => entry.dimensionId === dim.dimensionId)
          return (
            <div
              key={dim.dimensionId}
              style={{
                padding: '0.65rem 0.7rem',
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.12)',
                background: 'rgba(255,255,255,0.03)',
                display: 'grid',
                gap: '0.45rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap' }}>
                <strong style={{ color: '#e2e8f0', fontSize: '0.88rem' }}>{dim.label}</strong>
                <span
                  style={{
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    color: dim.consistency === 'constant' || dim.consistency === 'mostly_constant'
                      ? '#99f6e4'
                      : dim.consistency === 'variable'
                        ? '#fde68a'
                        : '#cbd5e1',
                  }}
                >
                  {consistencyBadge(dim.consistency)}
                </span>
              </div>
              <div style={{ fontSize: '0.82rem', color: 'rgba(226,232,240,0.82)', lineHeight: 1.4 }}>
                {dim.displayValues.length > 0 ? dim.displayValues.join(' · ') : '–'}
              </div>
              <div style={{ fontSize: '0.76rem', color: 'rgba(148,163,184,0.95)' }}>{dim.detail}</div>

              {interactive && (
                <OptionChips
                  name={`invariant-role-${dim.dimensionId}`}
                  options={DEFAULT_INVARIANT_DIMENSION_ROLE_OPTIONS}
                  value={assessment?.role || ''}
                  onChange={(next) => onAssess(dim.dimensionId, next as InvariantDimensionRole)}
                />
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}
