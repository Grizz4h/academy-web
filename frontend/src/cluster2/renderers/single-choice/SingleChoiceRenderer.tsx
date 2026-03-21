import type { Cluster2RendererProps } from '../../core/types'

export function SingleChoiceRenderer({ prompt, config, value, required, onChange }: Cluster2RendererProps) {
  const options: string[] = config?.options || []
  const selectedOption = value?.selectedOption || ''

  return (
    <div className="card">
      <h3 style={{ marginTop: 0 }}>{prompt}</h3>
      {required && <p style={{ fontSize: '0.85rem', opacity: 0.7 }}>Pflichtfeld</p>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' }}>
        {options.map((option) => (
          <label
            key={option}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.85rem 1rem',
              borderRadius: '12px',
              border: selectedOption === option
                ? '1px solid rgba(81,145,162,0.75)'
                : '1px solid rgba(255,255,255,0.08)',
              background: selectedOption === option
                ? 'rgba(81,145,162,0.14)'
                : 'rgba(255,255,255,0.03)',
              cursor: 'pointer',
            }}
          >
            <input
              type="radio"
              checked={selectedOption === option}
              onChange={() => onChange({ selectedOption: option })}
            />
            <span>{option}</span>
          </label>
        ))}
      </div>
    </div>
  )
}