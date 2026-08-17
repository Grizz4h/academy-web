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

export const CLAIM_LEVELS: ClaimLevel[] = [
  'description',
  'comparison',
  'tendency',
  'generalization',
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
  { value: 'unequal_groups', label: 'Ungleiche Sample Sizes' },
  { value: 'poor_comparability', label: 'Schlechte Vergleichbarkeit' },
  { value: 'several_counterexamples', label: 'Mehrere Gegenbeispiele' },
  { value: 'unclear_definition', label: 'Unklare Definition' },
  { value: 'extra_dimension', label: 'Weitere Einflussdimensionen' },
  { value: 'unclear_outcomes', label: 'Unklare Outcomes' },
  { value: 'no_clear_difference', label: 'Kein klarer Unterschied' },
  { value: 'other', label: 'Anderes' },
]

export const CLAIM_LEVEL_HELP: Array<{ level: ClaimLevel; title: string; body: string }> = [
  { level: 'description', title: 'Beschreibung', body: 'Was wurde beobachtet?' },
  { level: 'comparison', title: 'Vergleich', body: 'Wie unterscheiden sich Samples?' },
  { level: 'tendency', title: 'Hinweis / Tendenz', body: 'Gibt es einen vorsichtigen Hinweis?' },
  { level: 'generalization', title: 'Generalisierung', body: 'Gilt das wahrscheinlich über deine Stichprobe hinaus?' },
  { level: 'causal', title: 'Ursache', body: 'Behauptest du, warum etwas passiert?' },
]

export function claimLevelLabel(level: ClaimLevel): string {
  if (level === 'description') return 'Beschreibung'
  if (level === 'comparison') return 'Vergleich'
  if (level === 'tendency') return 'Hinweis / Tendenz'
  if (level === 'generalization') return 'Generalisierung'
  return 'Ursache'
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
        || 'Deine Sprache darf nie stärker sein als deine Evidenz.',
    ),
    coreHint: String(
      raw.core_hint
        || raw.coreHint
        || 'Sag auch, was deine Daten nicht zeigen können.',
    ),
    claimHint: String(
      raw.claim_hint
        || raw.claimHint
        || 'Wähle die höchste Stufe, die diese Stichprobe noch trägt – nicht die selbstsicherste.',
    ),
    scaffoldHint: String(
      raw.scaffold_hint
        || raw.scaffoldHint
        || 'In meinen beobachteten [Opportunities] trat [Outcome] bei [Condition/Gruppe] [häufiger/seltener/ähnlich] auf. Die Evidenz dafür ist [Strength]. Die Aussage wird vor allem durch [Limitation] begrenzt.',
    ),
    nextTestHint: String(
      raw.next_test_hint
        || raw.nextTestHint
        || 'Gleicher Opportunity-Typ, gleiches Outcome, relevanter Kontext – nicht nur „mehr Daten“.',
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
    { value: 'sample', label: 'Sample' },
    { value: 'comparability', label: 'Vergleichbarkeit' },
    { value: 'counterexamples', label: 'Gegenbeispiele' },
    { value: 'definition', label: 'Definitionsklarheit' },
    { value: 'small_difference', label: 'Kleiner Unterschied' },
    { value: 'extra_factors', label: 'Weitere Einflussfaktoren' },
    { value: 'none', label: 'Nichts davon' },
    { value: 'unclear', label: 'Unklar' },
  ]
}

export function temptingClaimOptions(): Array<{ value: ClaimLevel; label: string }> {
  return CLAIM_LEVELS.map((level) => ({ value: level, label: claimLevelLabel(level) }))
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
