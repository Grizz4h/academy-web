import type { Cluster2RendererProps } from '../../core/types'

export function TextNoteRenderer({ prompt, config, value, required, onChange }: Cluster2RendererProps) {
  const note = value?.note || ''

  return (
    <div className="card">
      <h3 style={{ marginTop: 0 }}>{prompt}</h3>
      {required && <p style={{ fontSize: '0.85rem', opacity: 0.7 }}>Pflichtfeld</p>}
      <textarea
        value={note}
        onChange={(event) => onChange({ note: event.target.value })}
        placeholder={config?.placeholder || 'Kurze Notiz'}
        rows={5}
        style={{
          width: '100%',
          minHeight: '140px',
          padding: '0.85rem 1rem',
          borderRadius: '12px',
          border: '1px solid rgba(255,255,255,0.10)',
          background: 'rgba(10,14,28,0.72)',
          color: 'rgba(247,247,255,0.95)',
          font: 'inherit',
          resize: 'vertical',
        }}
      />
    </div>
  )
}