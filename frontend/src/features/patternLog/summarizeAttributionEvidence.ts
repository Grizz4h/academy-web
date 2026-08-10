import {
  DEFAULT_GAME_STATE_OPTIONS,
  DEFAULT_OPPONENT_CONTEXT_OPTIONS,
  DEFAULT_PATTERN_PRESENCE_OPTIONS,
  DEFAULT_PERSONNEL_CONTEXT_OPTIONS,
  DEFAULT_STARTING_CONDITION_OPTIONS,
  labelForOption,
} from './labels'
import type {
  EvidenceHint,
  PatternAttributionSummary,
  PatternLogConfig,
  PatternLogObservation,
} from './types'

function uniqueCount(values: Array<string | null | undefined>): number {
  return new Set(values.filter(Boolean)).size
}

function describeVariation(
  values: Array<string | null | undefined>,
  labels: Record<string, string>,
): string {
  const cleaned = values.filter((value): value is string => Boolean(value) && value !== 'unclear' && value !== 'not_relevant')
  if (cleaned.length === 0) return 'nicht bewertet'
  const unique = uniqueCount(cleaned)
  if (unique <= 1) return `konstant (${labels[cleaned[0]] || cleaned[0]})`
  if (unique === 2) return 'leicht wechselnd'
  return 'wechselnd'
}

/**
 * Descriptive attribution evidence only — never picks a final category.
 */
export function summarizeAttributionEvidence(
  observations: PatternLogObservation[],
  _config: PatternLogConfig = {},
): PatternAttributionSummary {
  const n = observations.length
  const present = observations.filter((obs) => obs.patternPresence === 'clear' || obs.patternPresence === 'partial')
  const presentCount = present.length
  const absentCount = observations.filter((obs) => obs.patternPresence === 'absent').length

  const opponentValues = observations.map((obs) => obs.opponentContext)
  const personnelValues = observations.map((obs) => obs.personnelContext)
  const gameStateValues = observations.map((obs) => obs.gameStateContext)
  const startingValues = observations.map((obs) => obs.startingCondition)

  // Attribution cues focus on cases where the pattern was recognizable.
  const presentOpponent = present.map((obs) => obs.opponentContext)
  const presentPersonnel = present.map((obs) => obs.personnelContext)
  const presentGameState = present.map((obs) => obs.gameStateContext)
  const presentStarting = present.map((obs) => obs.startingCondition)

  const opponentLabelMap = Object.fromEntries(DEFAULT_OPPONENT_CONTEXT_OPTIONS.map((o) => [o.value, o.label]))
  const personnelLabelMap = Object.fromEntries(DEFAULT_PERSONNEL_CONTEXT_OPTIONS.map((o) => [o.value, o.label]))
  const gameStateLabelMap = Object.fromEntries(DEFAULT_GAME_STATE_OPTIONS.map((o) => [o.value, o.label]))
  const startingLabelMap = Object.fromEntries(DEFAULT_STARTING_CONDITION_OPTIONS.map((o) => [o.value, o.label]))

  const contextVariation = {
    opponent: describeVariation(opponentValues, opponentLabelMap),
    personnel: describeVariation(personnelValues, personnelLabelMap),
    gameState: describeVariation(gameStateValues, gameStateLabelMap),
    startingCondition: describeVariation(startingValues, startingLabelMap),
  }

  const hints: EvidenceHint[] = []

  if (n > 0) {
    hints.push({
      id: 'presence',
      bucket: presentCount === 0 ? 'insufficient' : 'structural',
      text: `Muster klar/teilweise in ${presentCount}/${n} Beobachtungen.`,
    })
  }

  if (absentCount > 0) {
    hints.push({
      id: 'absent',
      bucket: 'situational',
      text: `In ${absentCount}/${n} Fällen trat das Muster nicht auf.`,
    })
  }

  const opponentUnique = uniqueCount(presentOpponent.filter((v) => v && v !== 'unclear'))
  if (presentCount >= 2 && opponentUnique >= 2) {
    hints.push({
      id: 'opponent-varies-pattern-stays',
      bucket: 'structural',
      text: 'Gegnerverhalten wechselte, während das Muster in mehreren Fällen erkennbar blieb.',
    })
  }
  if (presentCount >= 2 && opponentUnique <= 1 && presentOpponent.some(Boolean)) {
    hints.push({
      id: 'opponent-stable',
      bucket: 'opponent',
      text: 'Gegnerkontext blieb weitgehend ähnlich, wenn das Muster auftrat.',
    })
  }

  if (presentCount >= 2 && presentPersonnel.some((v) => v === 'different' || v === 'similar_roles' || v === 'changing')) {
    hints.push({
      id: 'personnel-varies',
      bucket: 'structural',
      text: 'Unterschiedliche Spieler/Rollen waren beteiligt, während das Muster erkennbar blieb.',
    })
  }
  if (
    presentCount >= 2
    && presentPersonnel.every((v) => !v || v === 'same' || v === 'unclear')
    && presentPersonnel.some((v) => v === 'same')
  ) {
    hints.push({
      id: 'personnel-same',
      bucket: 'personnel',
      text: 'Weitgehend dieselben Spieler/Rollen waren beteiligt.',
    })
  }

  const startingUnique = uniqueCount(presentStarting.filter((v) => v && v !== 'unclear'))
  if (presentCount >= 2 && startingUnique <= 1 && presentStarting.some((v) => v === 'very_similar' || v === 'similar')) {
    hints.push({
      id: 'starting-similar',
      bucket: 'situational',
      text: 'Ausgangsbedingungen blieben sehr ähnlich, wenn das Muster auftrat.',
    })
  }
  if (presentCount >= 2 && presentStarting.some((v) => v === 'different')) {
    hints.push({
      id: 'starting-differs',
      bucket: 'structural',
      text: 'Das Muster trat auch bei deutlich anderer Ausgangslage auf.',
    })
  }

  const gameUnique = uniqueCount(
    presentGameState.filter((v) => v && v !== 'unclear' && v !== 'not_relevant' && v !== 'changing'),
  )
  if (
    presentCount >= 2
    && gameUnique <= 1
    && presentGameState.some((v) => v === 'leading' || v === 'trailing' || v === 'late_game')
  ) {
    hints.push({
      id: 'game-state-stable',
      bucket: 'game_state',
      text: 'Game State blieb in den Musterfällen relativ spezifisch (z. B. Führung/Rückstand/späte Phase).',
    })
  }
  if (presentCount >= 2 && gameUnique >= 2) {
    hints.push({
      id: 'game-state-varies',
      bucket: 'structural',
      text: 'Game State wechselte, während das Muster erkennbar blieb.',
    })
  }

  if (n < 3 || presentCount < 2) {
    hints.push({
      id: 'thin-sample',
      bucket: 'insufficient',
      text: 'Die Datenlage im beobachteten Segment ist noch dünn.',
    })
  }

  const statements = [
    `${n} Beobachtungen erfasst · Muster klar/teilweise: ${presentCount}.`,
    `Gegnerverhalten: ${contextVariation.opponent}.`,
    `Personal: ${contextVariation.personnel}.`,
    `Game State: ${contextVariation.gameState}.`,
    `Ausgangslage: ${contextVariation.startingCondition}.`,
  ]

  return {
    observationCount: n,
    presentCount,
    contextVariation,
    hints,
    statements,
  }
}

export function resolvePatternAttributionConfig(config: PatternLogConfig = {}) {
  const minObservations = Math.max(1, Number(config.minObservations || 3))
  const maxObservations = Math.max(minObservations, Number(config.maxObservations || 5))
  return {
    logsKey: config.logs_key || 'pattern_attribution_observations',
    candidateKey: config.candidate_key || 'pattern_candidate',
    minObservations,
    maxObservations,
    attributionKey: config.attribution_key || 'pattern_attribution',
    confidenceKey: config.confidence_key || 'attribution_confidence',
    strongestEvidenceKey: config.strongest_evidence_key || 'strongest_evidence',
    counterEvidenceKey: config.counter_evidence_key || 'counter_evidence',
    draftKey: config.draft_key || '__pattern_attribution_draft',
    editIndexKey: config.edit_index_key || '__pattern_attribution_edit_index',
    enableGameState: config.enable_game_state !== false,
    requireCandidateFirst: config.require_candidate_first !== false,
    submitLabel: config.submit_label || 'Beobachtung speichern',
    addMoreLabel: config.add_more_label || '+ Weitere Beobachtung',
    observeHint:
      config.observe_hint
      || 'Erfasse eine Situation und prüfe, welchen Kontext sie für die Einordnung liefert.',
    decisionRule:
      config.decision_rule
      || 'Strukturell heißt nicht „oft gesehen“, sondern „bleibt trotz veränderter Umstände erkennbar“.',
    summaryTitle: config.summary_title || 'Muster-Einordnung',
    presenceOptions: config.pattern_presence_options || DEFAULT_PATTERN_PRESENCE_OPTIONS,
    opponentOptions: config.opponent_context_options || DEFAULT_OPPONENT_CONTEXT_OPTIONS,
    personnelOptions: config.personnel_context_options || DEFAULT_PERSONNEL_CONTEXT_OPTIONS,
    gameStateOptions: config.game_state_options || DEFAULT_GAME_STATE_OPTIONS,
    startingOptions: config.starting_condition_options || DEFAULT_STARTING_CONDITION_OPTIONS,
  }
}

export { labelForOption }
