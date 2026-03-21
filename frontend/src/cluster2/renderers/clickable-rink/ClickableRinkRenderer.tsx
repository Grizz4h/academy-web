import type { Cluster2RendererProps } from '../../core/types'
import { ClickableRink } from './ClickableRink'

export function ClickableRinkRenderer({ prompt, config, value, required, onChange }: Cluster2RendererProps) {
  const selectedZones = Array.isArray(value?.selectedZones) ? value.selectedZones : []

  return (
    <div className="card">
      <h3 style={{ marginTop: 0 }}>{prompt}</h3>
      {required && <p style={{ fontSize: '0.85rem', opacity: 0.7 }}>Pflichtfeld</p>}
      <ClickableRink
        mode={config?.mode || 'single'}
        selectedZones={selectedZones}
        onChange={onChange}
      />
    </div>
  )
}