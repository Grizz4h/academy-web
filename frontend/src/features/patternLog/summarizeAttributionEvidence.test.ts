import {
  resolvePatternAttributionConfig,
  summarizeAttributionEvidence,
} from './summarizeAttributionEvidence'
import type { PatternLogObservation } from './types'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

function obs(partial: Partial<PatternLogObservation>): PatternLogObservation {
  return {
    id: partial.id || `attr_${Math.random().toString(36).slice(2, 8)}`,
    zone: partial.zone || 'unclear',
    trigger: partial.trigger || 'unclear',
    teamReaction: partial.teamReaction || 'pattern',
    patternPresence: partial.patternPresence,
    opponentContext: partial.opponentContext,
    personnelContext: partial.personnelContext,
    gameStateContext: partial.gameStateContext,
    startingCondition: partial.startingCondition,
    note: partial.note,
  }
}

// Structural signal: pattern holds across varied opponent / personnel / starting
{
  const structural = [
    obs({
      patternPresence: 'clear',
      opponentContext: 'very_similar',
      personnelContext: 'same',
      gameStateContext: 'neutral',
      startingCondition: 'similar',
    }),
    obs({
      patternPresence: 'clear',
      opponentContext: 'different',
      personnelContext: 'different',
      gameStateContext: 'leading',
      startingCondition: 'different',
    }),
    obs({
      patternPresence: 'partial',
      opponentContext: 'strongly_different',
      personnelContext: 'similar_roles',
      gameStateContext: 'trailing',
      startingCondition: 'different',
    }),
    obs({
      patternPresence: 'clear',
      opponentContext: 'similar',
      personnelContext: 'changing',
      gameStateContext: 'late_game',
      startingCondition: 'very_similar',
    }),
  ]
  const s = summarizeAttributionEvidence(structural)
  assert(s.observationCount === 4, 'structural count')
  assert(s.presentCount === 4, 'structural present')
  assert(s.hints.some((h) => h.id === 'opponent-varies-pattern-stays'), 'opponent varies hint')
  assert(s.hints.some((h) => h.id === 'personnel-varies'), 'personnel varies hint')
  assert(s.hints.some((h) => h.id === 'starting-differs'), 'starting differs hint')
  assert(s.hints.some((h) => h.id === 'game-state-varies'), 'game state varies hint')
  assert(!s.hints.some((h) => h.bucket === 'opponent' && h.id === 'opponent-stable'), 'no opponent-stable when varied')
  console.log('ok structural variation hints')
}

// Opponent-driven signal: pattern only with similar opponent context
{
  const opponentDriven = [
    obs({
      patternPresence: 'clear',
      opponentContext: 'very_similar',
      personnelContext: 'changing',
      gameStateContext: 'neutral',
      startingCondition: 'different',
    }),
    obs({
      patternPresence: 'clear',
      opponentContext: 'very_similar',
      personnelContext: 'different',
      gameStateContext: 'leading',
      startingCondition: 'similar',
    }),
    obs({
      patternPresence: 'partial',
      opponentContext: 'very_similar',
      personnelContext: 'similar_roles',
      gameStateContext: 'trailing',
      startingCondition: 'very_similar',
    }),
  ]
  const s = summarizeAttributionEvidence(opponentDriven)
  assert(s.hints.some((h) => h.id === 'opponent-stable'), 'opponent stable hint')
  assert(!s.hints.some((h) => h.id === 'opponent-varies-pattern-stays'), 'no opponent-varies')
  console.log('ok opponent-driven hints')
}

// Personnel-driven signal: same players/roles
{
  const personnelDriven = [
    obs({
      patternPresence: 'clear',
      opponentContext: 'different',
      personnelContext: 'same',
      gameStateContext: 'neutral',
      startingCondition: 'different',
    }),
    obs({
      patternPresence: 'clear',
      opponentContext: 'strongly_different',
      personnelContext: 'same',
      gameStateContext: 'leading',
      startingCondition: 'similar',
    }),
    obs({
      patternPresence: 'partial',
      opponentContext: 'similar',
      personnelContext: 'same',
      gameStateContext: 'late_game',
      startingCondition: 'very_similar',
    }),
  ]
  const s = summarizeAttributionEvidence(personnelDriven)
  assert(s.hints.some((h) => h.id === 'personnel-same'), 'personnel same hint')
  assert(!s.hints.some((h) => h.id === 'personnel-varies'), 'no personnel-varies')
  console.log('ok personnel-driven hints')
}

// Game-state signal: only leading
{
  const gameStateDriven = [
    obs({
      patternPresence: 'clear',
      opponentContext: 'different',
      personnelContext: 'different',
      gameStateContext: 'leading',
      startingCondition: 'different',
    }),
    obs({
      patternPresence: 'clear',
      opponentContext: 'similar',
      personnelContext: 'changing',
      gameStateContext: 'leading',
      startingCondition: 'similar',
    }),
    obs({
      patternPresence: 'partial',
      opponentContext: 'strongly_different',
      personnelContext: 'similar_roles',
      gameStateContext: 'leading',
      startingCondition: 'very_similar',
    }),
  ]
  const s = summarizeAttributionEvidence(gameStateDriven)
  assert(s.hints.some((h) => h.id === 'game-state-stable'), 'game-state stable hint')
  assert(!s.hints.some((h) => h.id === 'game-state-varies'), 'no game-state-varies')
  console.log('ok game-state-driven hints')
}

// Situational: similar starting + absences
{
  const situational = [
    obs({
      patternPresence: 'clear',
      opponentContext: 'similar',
      personnelContext: 'same',
      gameStateContext: 'neutral',
      startingCondition: 'very_similar',
    }),
    obs({
      patternPresence: 'clear',
      opponentContext: 'similar',
      personnelContext: 'same',
      gameStateContext: 'neutral',
      startingCondition: 'very_similar',
    }),
    obs({
      patternPresence: 'absent',
      opponentContext: 'different',
      personnelContext: 'different',
      gameStateContext: 'trailing',
      startingCondition: 'different',
    }),
  ]
  const s = summarizeAttributionEvidence(situational)
  assert(s.hints.some((h) => h.id === 'absent'), 'absent hint')
  assert(s.hints.some((h) => h.id === 'starting-similar'), 'starting similar hint')
  assert(s.presentCount === 2, 'present count with absence')
  console.log('ok situational / mixed presence hints')
}

// Insufficient evidence
{
  const thin = [
    obs({
      patternPresence: 'unclear',
      opponentContext: 'unclear',
      personnelContext: 'unclear',
      gameStateContext: 'unclear',
      startingCondition: 'unclear',
    }),
    obs({
      patternPresence: 'absent',
      opponentContext: 'similar',
      personnelContext: 'same',
      gameStateContext: 'neutral',
      startingCondition: 'similar',
    }),
  ]
  const s = summarizeAttributionEvidence(thin)
  assert(s.hints.some((h) => h.id === 'thin-sample'), 'thin sample hint')
  assert(s.presentCount < 2, 'few present')
  console.log('ok insufficient evidence')
}

// Context variation labels + statements never claim final attribution
{
  const mixed = [
    obs({
      patternPresence: 'clear',
      opponentContext: 'similar',
      personnelContext: 'same',
      gameStateContext: 'leading',
      startingCondition: 'similar',
    }),
    obs({
      patternPresence: 'partial',
      opponentContext: 'different',
      personnelContext: 'different',
      gameStateContext: 'trailing',
      startingCondition: 'different',
    }),
    obs({
      patternPresence: 'clear',
      opponentContext: 'strongly_different',
      personnelContext: 'changing',
      gameStateContext: 'late_game',
      startingCondition: 'very_similar',
    }),
  ]
  const s = summarizeAttributionEvidence(mixed)
  assert(typeof s.contextVariation.opponent === 'string', 'opponent variation')
  assert(typeof s.contextVariation.personnel === 'string', 'personnel variation')
  assert(s.statements.length >= 4, 'statements')
  const joined = [...s.hints.map((h) => h.text), ...s.statements].join(' ').toLowerCase()
  assert(!joined.includes('deshalb ist'), 'no causal conclusion')
  assert(!joined.includes('ist strukturell'), 'no hard structural claim')
  console.log('ok descriptive-only language')
}

{
  const cfg = resolvePatternAttributionConfig({
    minObservations: 3,
    maxObservations: 5,
    enable_game_state: true,
  })
  assert(cfg.logsKey === 'pattern_attribution_observations', 'logs key')
  assert(cfg.candidateKey === 'pattern_candidate', 'candidate key')
  assert(cfg.attributionKey === 'pattern_attribution', 'attribution key')
  assert(cfg.confidenceKey === 'attribution_confidence', 'confidence key')
  assert(cfg.strongestEvidenceKey === 'strongest_evidence', 'strongest evidence key')
  assert(cfg.counterEvidenceKey === 'counter_evidence', 'counter evidence key')
  assert(cfg.minObservations === 3 && cfg.maxObservations === 5, 'obs bounds')
  assert(cfg.enableGameState === true, 'game state enabled')
  console.log('ok config resolve')
}

console.log('summarizeAttributionEvidence.test.ts passed')
