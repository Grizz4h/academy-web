import type { EvidenceHint, EvidenceBucketId } from './types'

const BUCKET_LABEL: Record<EvidenceBucketId, string> = {
  structural: 'Spricht eher für strukturell',
  situational: 'Spricht eher für situativ',
  opponent: 'Spricht eher für gegnerbedingt',
  personnel: 'Spricht eher für personell',
  game_state: 'Spricht eher für Game State',
  insufficient: 'Zu wenig Evidenz / Vorsicht',
}

type EvidenceBoardProps = {
  title?: string
  hints: EvidenceHint[]
  contextVariation: {
    opponent: string
    personnel: string
    gameState: string
    startingCondition: string
  }
}

export function EvidenceBoard({
  title = 'Evidence Board',
  hints,
  contextVariation,
}: EvidenceBoardProps) {
  const grouped = (Object.keys(BUCKET_LABEL) as EvidenceBucketId[]).map((bucket) => ({
    bucket,
    label: BUCKET_LABEL[bucket],
    items: hints.filter((hint) => hint.bucket === bucket),
  })).filter((group) => group.items.length > 0)

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
          Deskriptive Indizien aus deinen Angaben — keine automatische Endentscheidung.
        </p>
      </div>

      <div style={{ display: 'grid', gap: '0.35rem', fontSize: '0.82rem', color: 'rgba(226,232,240,0.82)' }}>
        <div><strong>Gegnerverhalten:</strong> {contextVariation.opponent}</div>
        <div><strong>Personal:</strong> {contextVariation.personnel}</div>
        <div><strong>Game State:</strong> {contextVariation.gameState}</div>
        <div><strong>Ausgangslage:</strong> {contextVariation.startingCondition}</div>
      </div>

      <div style={{ display: 'grid', gap: '0.55rem' }}>
        {grouped.map((group) => (
          <div
            key={group.bucket}
            style={{
              padding: '0.55rem 0.65rem',
              borderRadius: '8px',
              border: group.bucket === 'insufficient'
                ? '1px solid rgba(251,191,36,0.35)'
                : '1px solid rgba(255,255,255,0.12)',
              background: group.bucket === 'insufficient'
                ? 'rgba(245,158,11,0.08)'
                : 'rgba(255,255,255,0.03)',
            }}
          >
            <div style={{ fontWeight: 750, fontSize: '0.84rem', color: '#e2e8f0', marginBottom: '0.3rem' }}>
              {group.label}
            </div>
            <ul style={{ margin: 0, paddingLeft: '1.05rem', display: 'grid', gap: '0.2rem' }}>
              {group.items.map((item) => (
                <li key={item.id} style={{ fontSize: '0.8rem', color: 'rgba(226,232,240,0.78)', lineHeight: 1.4 }}>
                  {item.text}
                </li>
              ))}
            </ul>
          </div>
        ))}
        {grouped.length === 0 && (
          <p style={{ margin: 0, fontSize: '0.82rem', color: 'rgba(226,232,240,0.65)' }}>
            Noch zu wenig Kontextvariation für Indizien.
          </p>
        )}
      </div>
    </section>
  )
}
