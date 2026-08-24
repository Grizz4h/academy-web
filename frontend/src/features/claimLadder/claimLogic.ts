import {
  evidenceStrengthOptions,
  groupsFromSample,
  normalizeEvidenceSample,
} from '../evidenceAssessment/evidenceLogic'
import type { EvidenceStrength } from '../evidenceAssessment/types'
import { DEFAULT_SYNTHESIS_CASES } from './cases'
import {
  EVIDENCE_PROFILE_SCHEMA_VERSION,
  type ClaimLadderConfig,
  type ClaimLadderDraft,
  type ClaimLadderStage,
  type ClaimLadderStep,
  type ClaimLevel,
  type ClaimLimitationId,
  type EvidenceProfile,
  type EvidenceSynthesisCase,
} from './types'

/** Erreichbare Aussagestufen in E3 (Ursache ist nicht erreichbar). */
export const SELECTABLE_CLAIM_LEVELS: ClaimLevel[] = [
  'none',
  'description',
  'comparison',
  'tendency',
  'generalization',
]

/** Inkl. `causal` nur für Tempting-/Overclaim-Beispiele, nicht als erreichbare Stufe. */
export const CLAIM_LEVELS: ClaimLevel[] = [
  ...SELECTABLE_CLAIM_LEVELS,
  'causal',
]

export const CLAIM_LADDER_STEPS: ClaimLadderStep[] = [
  'case',
  'describe',
  'evidence',
  'claim',
  'limitation',
  'counterevidence',
  'final_claim',
  'next_test',
]

export const DEFAULT_LIMITATION_OPTIONS: Array<{ value: ClaimLimitationId; label: string }> = [
  { value: 'small_sample', label: 'Kleine Stichprobe' },
  { value: 'unequal_groups', label: 'Ungleiche Vergleichsgruppen' },
  { value: 'poor_comparability', label: 'Schlechte Vergleichbarkeit' },
  { value: 'several_counterexamples', label: 'Mehrere Gegenfälle' },
  { value: 'unclear_definition', label: 'Unklare Definition' },
  { value: 'extra_dimension', label: 'Weitere sichtbare Kontextunterschiede' },
  { value: 'unclear_outcomes', label: 'Unklare Ergebnisse' },
  { value: 'no_clear_difference', label: 'Kein klarer Unterschied' },
  { value: 'other', label: 'Anderes' },
]

export const CLAIM_LEVEL_HELP: Array<{ level: ClaimLevel; title: string; body: string }> = [
  { level: 'none', title: 'Keine inhaltliche Aussage', body: 'Definition oder Beobachtungsgrundlage reichen nicht aus.' },
  { level: 'description', title: 'Beschreibung der Stichprobe', body: 'Absolute Zahlen, auswertbarer Nenner, unklare Fälle.' },
  { level: 'comparison', title: 'Vergleich innerhalb der Stichprobe', body: 'Rate in Vergleichsgruppe A vs. B — ohne Wertung besser/schlechter.' },
  { level: 'tendency', title: 'Vorläufiger Zusammenhang in der Stichprobe', body: 'Bedingung und Ergebnis zusammen — mit Grenzen und Gegenfällen.' },
  { level: 'generalization', title: 'Wiederkehrender Hinweis über mehrere Stichproben', body: 'Nur bei getrennten, konsistent definierten Beobachtungen.' },
  { level: 'causal', title: 'Ursache (nicht erreichbar in E3)', body: 'Mit E3 allein keine erreichbare Stufe.' },
]

export function claimLevelLabel(level: ClaimLevel): string {
  if (level === 'none') return 'Keine inhaltliche Aussage'
  if (level === 'description') return 'Beschreibung der Stichprobe'
  if (level === 'comparison') return 'Vergleich innerhalb der Stichprobe'
  if (level === 'tendency') return 'Vorläufiger Zusammenhang in der Stichprobe'
  if (level === 'generalization') return 'Wiederkehrender Hinweis über mehrere Stichproben'
  return 'Ursache (nicht erreichbar in E3)'
}

export function isSelectableClaimLevel(level: ClaimLevel): boolean {
  return SELECTABLE_CLAIM_LEVELS.includes(level)
}

export function claimLevelIndex(level?: ClaimLevel | null): number {
  if (!level) return -1
  return CLAIM_LEVELS.indexOf(level)
}

export function emptyDraft(caseId?: string): ClaimLadderDraft {
  return { caseId }
}

export function parseSynthesisCases(raw: unknown): EvidenceSynthesisCase[] {
  if (!Array.isArray(raw) || raw.length === 0) return DEFAULT_SYNTHESIS_CASES
  const byId = new Map(DEFAULT_SYNTHESIS_CASES.map((item) => [item.id, item]))
  const resolved: EvidenceSynthesisCase[] = []
  for (const item of raw) {
    if (typeof item === 'string' && byId.has(item)) {
      resolved.push(byId.get(item)!)
      continue
    }
    if (item && typeof item === 'object' && 'id' in item && 'question' in item && 'evidenceInput' in item) {
      resolved.push(item as EvidenceSynthesisCase)
    }
  }
  return resolved.length > 0 ? resolved : DEFAULT_SYNTHESIS_CASES
}

export function resolveClaimLadderConfig(raw: Record<string, unknown> = {}): ClaimLadderConfig {
  return {
    mechanic: 'claim_ladder',
    schemaVersion: Number(raw.schemaVersion || raw.schema_version || EVIDENCE_PROFILE_SCHEMA_VERSION),
    cases: parseSynthesisCases(raw.cases),
    profilesKey: String(raw.profiles_key || raw.profilesKey || 'evidence_profiles'),
    profileKey: String(raw.profile_key || raw.profileKey || 'evidenceProfile'),
    caseIndexKey: String(raw.case_index_key || raw.caseIndexKey || '__claim_ladder_case_index'),
    stepKey: String(raw.step_key || raw.stepKey || '__claim_ladder_step'),
    stageKey: String(raw.stage_key || raw.stageKey || '__claim_ladder_stage'),
    microfeedbackKey: String(raw.microfeedback_key || raw.microfeedbackKey || 'claimLadderConstraint'),
    temptingClaimKey: String(raw.tempting_claim_key || raw.temptingClaimKey || 'temptingClaimLevel'),
    decisionRule: String(
      raw.decision_rule
        || raw.decisionRule
        || 'Die Sprache darf nicht stärker sein als die Beobachtungsgrundlage.',
    ),
    coreHint: String(
      raw.core_hint
        || raw.coreHint
        || 'Nenne Stichprobe, Absolute, auswertbaren Nenner, unklare Fälle, Grenzen, Gegenfälle und nächsten Beobachtungsschritt.',
    ),
    claimHint: String(
      raw.claim_hint
        || raw.claimHint
        || 'Wähle die höchstens vertretbare Aussage — nicht die selbstsicherste. Ursache ist in E3 nicht erreichbar.',
    ),
    scaffoldHint: String(
      raw.scaffold_hint
        || raw.scaffoldHint
        || 'In den beobachteten Situationen trat das Zielereignis in x von y auswertbaren Fällen auf; z weitere Fälle waren unklar. Die Aussage wird vor allem durch [Begrenzung] begrenzt. Nächster Beobachtungsschritt: …',
    ),
    nextTestHint: String(
      raw.next_test_hint
        || raw.nextTestHint
        || 'Gleiche Messdefinition, relevanter Kontext – nicht nur „mehr Daten“ und keine Kausalitätsprüfung.',
    ),
    finalClaimMinChars: Math.max(1, Number(raw.final_claim_min_chars || raw.finalClaimMinChars || 24)),
    nextTestMinChars: Math.max(1, Number(raw.next_test_min_chars || raw.nextTestMinChars || 20)),
  }
}

export function readClaimStage(answers: Record<string, unknown>, stageKey: string): ClaimLadderStage {
  const raw = String(answers[stageKey] || 'intro')
  if (raw === 'intro' || raw === 'assess' || raw === 'review' || raw === 'complete') return raw
  return 'intro'
}

export function readClaimStep(answers: Record<string, unknown>, stepKey: string): ClaimLadderStep {
  const raw = String(answers[stepKey] || 'case')
  return CLAIM_LADDER_STEPS.includes(raw as ClaimLadderStep) ? raw as ClaimLadderStep : 'case'
}

export function readProfiles(answers: Record<string, unknown>, key: string): Record<string, ClaimLadderDraft> {
  const raw = answers[key]
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {}
  return raw as Record<string, ClaimLadderDraft>
}

export function limitationLabel(id?: string, other?: string): string {
  if (!id) return ''
  if (id === 'other') return String(other || '').trim() || 'Anderes'
  return DEFAULT_LIMITATION_OPTIONS.find((item) => item.value === id)?.label || id
}

export function isDraftStepReady(step: ClaimLadderStep, draft: ClaimLadderDraft, cfg: ClaimLadderConfig): boolean {
  if (step === 'case') return true
  if (step === 'describe') {
    return Boolean(draft.descriptiveChoice || String(draft.descriptiveNote || '').trim())
  }
  if (step === 'evidence') return Boolean(draft.evidenceStrength)
  if (step === 'claim') return Boolean(draft.maxClaimLevel)
  if (step === 'limitation') {
    if (!draft.primaryLimitation) return false
    if (draft.primaryLimitation === 'other') return String(draft.primaryLimitationOther || '').trim().length >= 4
    return true
  }
  if (step === 'counterevidence') return Boolean(String(draft.counterEvidence || '').trim())
  if (step === 'final_claim') return String(draft.finalClaim || '').trim().length >= cfg.finalClaimMinChars
  return String(draft.nextObservationTest || '').trim().length >= cfg.nextTestMinChars
}

export function isDraftComplete(draft: ClaimLadderDraft | undefined, cfg: ClaimLadderConfig): boolean {
  if (!draft) return false
  return CLAIM_LADDER_STEPS.every((step) => isDraftStepReady(step, draft, cfg))
}

export function buildEvidenceProfile(
  caseDef: EvidenceSynthesisCase,
  draft: ClaimLadderDraft,
): EvidenceProfile {
  const sample = normalizeEvidenceSample(caseDef.evidenceInput)
  const groups = groupsFromSample(sample)
  const descriptive = String(draft.descriptiveNote || '').trim()
    || caseDef.descriptiveOptions.find((item) => item.value === draft.descriptiveChoice)?.label
    || ''
  return {
    schemaVersion: EVIDENCE_PROFILE_SCHEMA_VERSION,
    caseId: caseDef.id,
    question: caseDef.question,
    sampleSummary: {
      total: sample.sampleSize,
      groups: groups?.map((group) => ({
        label: group.label,
        targetCount: group.targetCount,
        total: group.totalOpportunities,
        rate: group.rate,
      })),
    },
    descriptiveNote: descriptive,
    evidenceStrength: (draft.evidenceStrength || 'unclear') as EvidenceStrength,
    maxClaimLevel: draft.maxClaimLevel || 'description',
    primaryLimitation: limitationLabel(draft.primaryLimitation, draft.primaryLimitationOther),
    primaryLimitationOther: draft.primaryLimitation === 'other' ? String(draft.primaryLimitationOther || '').trim() : undefined,
    counterEvidence: draft.counterEvidence ? [draft.counterEvidence] : undefined,
    finalClaim: String(draft.finalClaim || '').trim(),
    nextObservationTest: String(draft.nextObservationTest || '').trim(),
    falsificationCondition: String(draft.falsificationCondition || '').trim() || undefined,
  }
}

export function ceilingFeedback(caseDef: EvidenceSynthesisCase, level?: ClaimLevel): string | null {
  if (!level) return null
  return caseDef.ceilingFeedback?.[level] || null
}

export function neverAutoSupportsCausal(copyBlobs: string[]): boolean {
  return copyBlobs.every((text) => !/causal claim supported|ursache (ist |wird )?gedeckt|kausal (belegt|gestützt)/i.test(text))
}

export function mapsEvidenceToClaim(_evidence?: EvidenceStrength, _claim?: ClaimLevel): boolean {
  return false
}

export function microfeedbackOptions(): Array<{ value: string; label: string }> {
  return [
    { value: 'sample', label: 'Stichprobe' },
    { value: 'comparability', label: 'Vergleichbarkeit' },
    { value: 'counterexamples', label: 'Gegenfälle' },
    { value: 'definition', label: 'Definitionsklarheit' },
    { value: 'small_difference', label: 'Kleiner Unterschied' },
    { value: 'extra_factors', label: 'Weitere Einflussfaktoren' },
    { value: 'none', label: 'Nichts davon' },
    { value: 'unclear', label: 'Unklar' },
  ]
}

export function temptingClaimOptions(): Array<{ value: ClaimLevel; label: string }> {
  return CLAIM_LEVELS.map((level) => ({
    value: level,
    label: level === 'causal'
      ? 'Ursache / Verbesserung / Teamwahrheit (nicht erreichbar in E3)'
      : claimLevelLabel(level),
  }))
}

export function validateClaimLadderAnswers(
  cfg: ClaimLadderConfig,
  answers: Record<string, unknown>,
): string | null {
  const drafts = readProfiles(answers, cfg.profilesKey)
  for (const caseDef of cfg.cases) {
    if (!isDraftComplete(drafts[caseDef.id], cfg)) {
      return `Bitte schließe die Synthese für „${caseDef.title}“ vollständig ab.`
    }
  }
  if (!answers[cfg.microfeedbackKey]) {
    return 'Bitte halte fest, was deine finale Formulierung am stärksten begrenzt hat.'
  }
  return null
}

export { evidenceStrengthOptions, groupsFromSample, normalizeEvidenceSample }
