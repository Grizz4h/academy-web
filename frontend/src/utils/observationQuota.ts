export type ObservationQuotaInput = {
  count: number
  min: number
  recommended: number
  max: number
  nounPlural: string
  nounSingular: string
}

function noun(count: number, singular: string, plural: string): string {
  return count === 1 ? singular : plural
}

export function observationSlotsLeft(input: Pick<ObservationQuotaInput, 'count' | 'max'>): number {
  return Math.max(0, input.max - input.count)
}

/** Status line while collecting (replaces „3 minimum / 5 empfohlen / 6 maximum“). */
export function formatObservationQuotaStatus(input: ObservationQuotaInput): string {
  const { count, min, recommended, max, nounPlural, nounSingular } = input
  const left = observationSlotsLeft(input)

  if (count < min) {
    const need = min - count
    return (
      `${count} von mind. ${min}`
      + ` · noch ${need} ${noun(need, nounSingular, nounPlural)} bis zum Minimum`
      + ` · empfohlen ${recommended}, max. ${max}`
    )
  }

  if (left > 0) {
    const recommendedBit = count < recommended
      ? ` · empfohlen ${recommended}`
      : ''
    return (
      `Minimum erreicht (${count})`
      + ` · abschließen oder noch bis zu ${left} ${noun(left, nounSingular, nounPlural)}`
      + ` (max. ${max})${recommendedBit}`
    )
  }

  return `Maximum erreicht (${max} ${nounPlural})`
}

/**
 * Choice hint once the minimum is reached: finish now, or keep logging up to max.
 * Returns null before the minimum.
 */
export function formatObservationQuotaChoice(input: ObservationQuotaInput): string | null {
  if (input.count < input.min) return null
  const left = observationSlotsLeft(input)
  if (left <= 0) {
    return `Maximum erreicht (${input.max} ${input.nounPlural}). Du kannst abschließen.`
  }
  if (input.count < input.recommended) {
    return (
      `Minimum erreicht. Du kannst jetzt abschließen`
      + ` — oder weiter loggen (empfohlen ${input.recommended}, maximal noch ${left}).`
    )
  }
  return (
    `Du kannst jetzt abschließen`
    + ` — oder noch bis zu ${left} ${noun(left, input.nounSingular, input.nounPlural)} loggen`
    + ` (Maximum ${input.max}).`
  )
}

export function formatContinueObservationLabel(
  input: ObservationQuotaInput,
  baseLabel?: string,
): string {
  const left = observationSlotsLeft(input)
  const base = (baseLabel || '').trim() || `Weitere ${input.nounSingular}`
  if (left <= 0) return base
  return `${base} · noch ${left} möglich`
}

export function formatObservationProgressCount(input: ObservationQuotaInput): string {
  return `${input.count} / ${input.max} ${input.nounPlural}`
}
