type MissingCountOptions = {
  saved: number
  required: number
  noun: string
  ofWhat?: string
}

function asCount(value: number): number {
  if (!Number.isFinite(value)) return 0
  return Math.max(0, Math.floor(value))
}

/** Unmissable copy when a drill needs N saved items before Weiter. */
export function formatMissingCountMessage(options: MissingCountOptions): string {
  const saved = asCount(options.saved)
  const required = Math.max(1, asCount(options.required))
  const ofWhat = options.ofWhat ? ` ${options.ofWhat}` : ''
  const nextStep = `Speichere mindestens ${required}, dann kannst du weiter.`
  if (saved <= 0) {
    return `Noch keine ${options.noun}${ofWhat} gespeichert. ${nextStep}`
  }
  return `${saved} von ${required} ${options.noun}${ofWhat} gespeichert. ${nextStep}`
}
