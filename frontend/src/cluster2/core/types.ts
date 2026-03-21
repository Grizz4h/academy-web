import type { ComponentType } from 'react'

export type Cluster2ModuleType = 'clickable_rink' | 'single_choice' | 'text_note'

export interface Cluster2DrillModule {
  moduleId: string
  type: Cluster2ModuleType
  prompt: string
  required?: boolean
  config?: Record<string, any>
}

export interface Cluster2Drill {
  drillId: string
  title: string
  trackId: string
  clusterId: number
  modules: Cluster2DrillModule[]
}

export interface Cluster2ModuleResponse {
  moduleId: string
  type: Cluster2ModuleType
  value: any
  isValid: boolean
  touchedAt: string | null
}

export interface Cluster2RendererProps {
  moduleId: string
  prompt: string
  config?: Record<string, any>
  value: any
  required?: boolean
  onChange: (value: any) => void
}

export type Cluster2RendererComponent = ComponentType<Cluster2RendererProps>

export interface Cluster2TrackDefinition {
  trackId: string
  title: string
  clusterId: number
  drills: Cluster2Drill[]
}