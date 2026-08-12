export type AiSessionReflection = {
  strengths: string[]
  cautions: string[]
  alternativeInterpretation?: string
  nextObservationFocus: string
  reflectionQuestion?: string
  summary: string
}

export type StoredAiReflection = {
  id: string
  sessionId: string
  createdAt: string
  provider: 'openai'
  model: string
  promptVersion: string
  content: AiSessionReflection
  usage?: {
    inputTokens?: number
    outputTokens?: number
    totalTokens?: number
  }
}

export type SessionReflectionResponse = {
  reflection: StoredAiReflection
  cached: boolean
}
