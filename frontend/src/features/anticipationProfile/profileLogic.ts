import { DEFAULT_CUE_CATEGORIES } from '../anticipationRead/types'
import type { AnticipationObservation } from '../anticipationRead/types'
import { computePredictionUpdateResult } from '../predictionUpdate/updateLogic'
import { computeScenarioBranchResult } from '../scenarioBranches/branchLogic'
import { isProgressionEligibleSession } from '../../utils/sessionEligibility'
import type { Session } from '../../api'
import type {
  AnticipationProfile,
  AnticipationProfileConfig,
  AnticipationProfileReflectionPayload,
  AnticipationProfileStage,
} from './types'

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.map((item) => String(item || '').trim()).filter(Boolean)
}

function bump(map: Record<string, number>, key: string) {
  const next = String(key || '').trim()
  if (!next) return
  map[next] = (map[next] || 0) + 1
}

function rankedKeys(map: Record<string, number>): string[] {
  return Object.keys(map).sort((a, b) => (map[b] - map[a]) || a.localeCompare(b))
}

export function resolveAnticipationProfileConfig(raw: Record<string, unknown> = {}): AnticipationProfileConfig {
  const catalog = asStringArray(raw.cueCatalog || raw.cue_catalog)
  return {
    mechanic: 'anticipation_profile',
    minReadsForProfile: Math.max(1, Number(raw.minReadsForProfile || raw.min_reads_for_profile || 20)),
    sourceDrillIds: asStringArray(raw.sourceDrillIds || raw.source_drill_ids),
    cueCatalog: catalog.length ? catalog : [...DEFAULT_CUE_CATEGORIES],
    frequentLimit: Math.max(1, Number(raw.frequentLimit || raw.frequent_limit || 3)),
    rareLimit: Math.max(1, Number(raw.rareLimit || raw.rare_limit || 5)),
    logsKey: String(raw.logs_key || raw.logsKey || 'anticipation_read_observations'),
    stageKey: String(raw.stage_key || raw.stageKey || '__anticipation_profile_stage'),
    resultKey: String(raw.result_key || raw.resultKey || 'anticipation_profile'),
    payloadKey: String(raw.payload_key || raw.payloadKey || 'anticipation_profile_payload'),
    helpfulCueKey: String(raw.helpful_cue_key || raw.helpfulCueKey || 'mostHelpfulCueCategory'),
    futureCueKey: String(raw.future_cue_key || raw.futureCueKey || 'futureCueCategory'),
    hardToUpdateKey: String(raw.hard_to_update_key || raw.hardToUpdateKey || 'hardToUpdateWhen'),
    decisionRule: String(
      raw.decision_rule
        || raw.decisionRule
        || 'Deine bisherigen Reads zeigen ein Muster – keine Bewertung deines Niveaus.',
    ),
    coreHint: String(
      raw.core_hint
        || raw.coreHint
        || 'Antizipation entsteht aus mehreren Teilfähigkeiten. Schau, welche Hinweise du oft nutzt – und welche noch selten vorkommen.',
    ),
    introText: String(
      raw.intro_text
        || raw.introText
        || 'Dieser Abschluss fasst deine Reads aus den vorherigen Anticipation-Drills zusammen. Du bekommst kein Rating, sondern ein Bild davon, wie du Situationen bisher liest.',
    ),
    insufficientHint: String(
      raw.insufficient_hint
        || raw.insufficientHint
        || 'Sammle weitere Reads, damit dein Anticipation Profile aussagekräftiger wird.',
    ),
  }
}

export function readProfileStage(answers: Record<string, unknown>, stageKey: string): AnticipationProfileStage {
  const raw = String(answers[stageKey] || 'review')
  return raw === 'complete' ? 'complete' : 'review'
}

function answerMapsFromSession(session: Pick<Session, 'checkins' | 'drafts'>): Record<string, unknown>[] {
  const maps: Record<string, unknown>[] = []
  const drafts = session.drafts
  if (drafts && typeof drafts === 'object') {
    for (const value of Object.values(drafts)) {
      if (value && typeof value === 'object') maps.push(value as Record<string, unknown>)
    }
  }
  for (const checkin of session.checkins || []) {
    if (checkin?.answers && typeof checkin.answers === 'object') {
      maps.push(checkin.answers as Record<string, unknown>)
    }
  }
  return maps
}

export function extractObservationsFromSession(
  session: Pick<Session, 'checkins' | 'drafts'>,
  logsKey: string,
): AnticipationObservation[] {
  const next: AnticipationObservation[] = []
  for (const answers of answerMapsFromSession(session)) {
    const logs = answers[logsKey]
    if (!Array.isArray(logs)) continue
    for (const item of logs) {
      if (item && typeof item === 'object' && String((item as AnticipationObservation).expectedAction || '').trim()) {
        next.push(item as AnticipationObservation)
      }
    }
  }
  return next
}

export function collectAnticipationObservations(
  sessions: Session[],
  cfg: Pick<AnticipationProfileConfig, 'sourceDrillIds' | 'logsKey'>,
): AnticipationObservation[] {
  const allowed = new Set(cfg.sourceDrillIds)
  const byId = new Map<string, AnticipationObservation>()
  for (const session of sessions || []) {
    if (!isProgressionEligibleSession(session) || session.state !== 'COMPLETED') continue
    const drillId = String(session.drill_id || '').trim()
    if (allowed.size && drillId && !allowed.has(drillId)) continue
    for (const observation of extractObservationsFromSession(session, cfg.logsKey)) {
      const id = String(observation.id || `${drillId}_${observation.order}_${observation.expectedAction}`)
      if (!byId.has(id)) byId.set(id, observation)
    }
  }
  return Array.from(byId.values())
}

export function coveredSourceDrillIds(
  sessions: Session[],
  sourceDrillIds: string[],
  logsKey: string,
): string[] {
  const covered = new Set<string>()
  for (const session of sessions || []) {
    if (!isProgressionEligibleSession(session) || session.state !== 'COMPLETED') continue
    const drillId = String(session.drill_id || '').trim()
    if (!sourceDrillIds.includes(drillId)) continue
    if (extractObservationsFromSession(session, logsKey).length) covered.add(drillId)
  }
  return sourceDrillIds.filter((id) => covered.has(id))
}

function countCueCategories(observations: AnticipationObservation[]): {
  all: Record<string, number>
  primary: Record<string, number>
} {
  const all: Record<string, number> = {}
  const primary: Record<string, number> = {}
  for (const observation of observations) {
    for (const cue of observation.supportingCues || []) {
      const key = String(cue.category || 'other').trim() || 'other'
      bump(all, key)
      if (cue.priority === 'primary') bump(primary, key)
    }
  }
  return { all, primary }
}

export function computeAnticipationProfile(
  observations: AnticipationObservation[],
  cfg: Pick<AnticipationProfileConfig, 'minReadsForProfile' | 'cueCatalog' | 'frequentLimit' | 'rareLimit' | 'sourceDrillIds'>,
  coveredDrills: string[] = [],
): AnticipationProfile {
  const { all, primary } = countCueCategories(observations)
  const source = Object.keys(primary).length ? primary : all
  const frequentlyUsed = rankedKeys(source).filter((key) => (source[key] || 0) > 0).slice(0, cfg.frequentLimit)
  const frequentSet = new Set(frequentlyUsed)
  const rareCandidates = cfg.cueCatalog.filter((key) => key !== 'other' && !frequentSet.has(key))
  rareCandidates.sort((a, b) => (all[a] || 0) - (all[b] || 0))
  const rarelyUsed = observations.length ? rareCandidates.slice(0, cfg.rareLimit) : []

  const updates = computePredictionUpdateResult(observations)
  const branches = computeScenarioBranchResult(observations)
  const commonBranches = Object.entries(
    observations.reduce((map, item) => {
      const primaryAction = String(item.expectedAction || '').trim()
      const alternative = String(item.alternativeAction || '').trim()
      if (!primaryAction || !alternative) return map
      bump(map, `${primaryAction} → ${alternative}`)
      return map
    }, {} as Record<string, number>),
  )
    .sort((a, b) => (b[1] - a[1]) || a[0].localeCompare(b[0]))
    .map(([label]) => label)

  const sourceCoverage = cfg.sourceDrillIds.length > 0 && coveredDrills.length >= cfg.sourceDrillIds.length
  const enoughBecause = observations.length >= cfg.minReadsForProfile
    ? 'read_count'
    : sourceCoverage
      ? 'source_coverage'
      : 'insufficient'

  return {
    sourceReads: observations.length,
    cuePatterns: { frequentlyUsed, rarelyUsed },
    decisionPatterns: {
      keepCount: updates.keepCount,
      changeCount: updates.changeCount,
    },
    branchPatterns: {
      commonAlternatives: branches.alternativeActions.slice(0, cfg.frequentLimit),
      commonBranches: commonBranches.slice(0, cfg.frequentLimit),
    },
    updatePatterns: {
      commonTriggers: rankedKeys(updates.commonUpdateTriggers || {}).slice(0, cfg.frequentLimit),
    },
    sourceDrillIds: coveredDrills,
    hasEnoughData: enoughBecause !== 'insufficient',
    enoughBecause,
  }
}

export function describeDecisionFlexibility(keepCount: number, changeCount: number): string {
  if (keepCount + changeCount === 0) {
    return 'Noch keine Update-Reads. Deine bisherigen Reads zeigen, wie du Erwartungen bildest – noch nicht, wann du sie anpasst.'
  }
  if (keepCount > changeCount) {
    return 'Du hältst häufig an deiner ersten Erwartung fest.'
  }
  if (changeCount > keepCount) {
    return 'Du passt deine Erwartung häufiger nach neuen Informationen an.'
  }
  return 'Behalten und Anpassen halten sich in deinen Reads bisher die Waage.'
}

const NEXT_FOCUS_ORDER = ['timing', 'body_orientation', 'player_movement']

export function describeNextFocus(
  rarelyUsed: string[],
  labelFor: (category: string) => string,
): string {
  const preferred = NEXT_FOCUS_ORDER.filter((key) => rarelyUsed.includes(key))
  const rest = rarelyUsed.filter((key) => !preferred.includes(key))
  const labels = [...preferred, ...rest].slice(0, 2).map(labelFor)
  if (labels.length === 0) return 'Deine Cue-Nutzung ist bisher breit gestreut.'
  if (labels.length === 1) return `Achte stärker auf ${labels[0]}.`
  return `Achte stärker auf ${labels[0]} und ${labels[1]}.`
}

export function toReflectionPayload(
  profile: AnticipationProfile,
  reflectionAnswers: Record<string, string> = {},
): AnticipationProfileReflectionPayload {
  return {
    reads: profile.sourceReads,
    cuePatterns: {
      frequentlyUsed: [...profile.cuePatterns.frequentlyUsed],
      rarelyUsed: [...profile.cuePatterns.rarelyUsed],
    },
    updatePatterns: {
      commonTriggers: [...profile.updatePatterns.commonTriggers],
      keepCount: profile.decisionPatterns.keepCount,
      changeCount: profile.decisionPatterns.changeCount,
    },
    branchPatterns: {
      commonAlternatives: [...profile.branchPatterns.commonAlternatives],
      commonBranches: [...profile.branchPatterns.commonBranches],
    },
    reflectionAnswers: { ...reflectionAnswers },
  }
}

const PII_KEYS = ['userId', 'user', 'email', 'username', 'name', 'account']
const SCORE_KEYS = ['skill', 'hockeyIQ', 'hockeyIq', 'level', 'rating', 'accuracy', 'progressPercent', 'anticipationLevel']

export function payloadHasPii(payload: AnticipationProfileReflectionPayload): boolean {
  const record = payload as unknown as Record<string, unknown>
  return PII_KEYS.some((key) => key in record)
}

export function profileHasScore(profile: AnticipationProfile): boolean {
  const encoded = JSON.stringify(profile)
  if (encoded.includes('%')) return true
  const record = profile as AnticipationProfile & Record<string, unknown>
  return SCORE_KEYS.some((key) => key in record)
}

export function validateAnticipationProfileAnswers(
  cfg: AnticipationProfileConfig,
  answers: Record<string, unknown>,
): string | null {
  if (String(answers[cfg.helpfulCueKey] || '').trim() === '') {
    return 'Bitte wähle, welche Hinweise dir aktuell am meisten helfen.'
  }
  if (String(answers[cfg.futureCueKey] || '').trim() === '') {
    return 'Bitte wähle, welche Hinweise du bewusster beobachten möchtest.'
  }
  if (String(answers[cfg.hardToUpdateKey] || '').trim() === '') {
    return 'Bitte beschreibe, wann es dir schwerfällt, die erste Erwartung anzupassen.'
  }
  return null
}
