import { rendererRegistry } from './rendererRegistry'
import type { Cluster2DrillModule } from './types'

interface RendererHostProps {
  module: Cluster2DrillModule
  value: any
  onChange: (value: any) => void
}

export function RendererHost({ module, value, onChange }: RendererHostProps) {
  const Renderer = rendererRegistry[module.type]

  if (!Renderer) {
    return <div className="card">Unbekannter Cluster-2-Renderer: {module.type}</div>
  }

  return (
    <Renderer
      moduleId={module.moduleId}
      prompt={module.prompt}
      config={module.config}
      value={value}
      required={module.required}
      onChange={onChange}
    />
  )
}