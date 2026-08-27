import type {
  AchievementCondition,
  AchievementDefinition,
  RinkActivityEvent,
} from '../types'
import { TANK_ACHIEVEMENTS } from './achievementCatalog'
import { isTankBlockedByLegacyUnlock } from '../../rewards/data/legacyAchievements'

function readField(event: RinkActivityEvent, field: string): unknown {
  return (event as unknown as Record<string, unknown>)[field]
}

function eventMatchesTag(event: RinkActivityEvent, tag: string): boolean {
  if (event.type !== 'session_completed') return false
  return (event.tags || []).includes(tag)
}

function mechanicCount(events: RinkActivityEvent[], mechanicId: string): number {
  let count = 0
  for (const event of events) {
    if (event.type === 'session_completed') {
      const ids = event.mechanicIds || []
      if (mechanicId === 'spatial_rink') {
        const spatial = ids.some((id) =>
          [
            'rink_corridor_observation',
            'blue_line_entry_observation',
            'paintable_rink_observation',
            'directional_path_observation',
          ].includes(id),
        )
        if (spatial) count += 1
      } else if (ids.includes(mechanicId)) {
        count += 1
      }
    }
    if (event.type === 'mechanic_used' && event.mechanicId === mechanicId) {
      count += event.count || 1
    }
  }
  return count
}

export function evaluateConditionProgress(
  condition: AchievementCondition,
  events: RinkActivityEvent[],
): { current: number; target: number; met: boolean } {
  switch (condition.type) {
    case 'event_count': {
      const current = events.filter((event) => event.type === condition.eventType).length
      return { current, target: condition.target, met: current >= condition.target }
    }
    case 'unique_count': {
      const values = new Set<string>()
      for (const event of events) {
        if (event.type !== condition.eventType) continue
        const value = readField(event, condition.field)
        if (value === undefined || value === null || value === '') continue
        values.add(String(value))
      }
      const current = values.size
      return { current, target: condition.target, met: current >= condition.target }
    }
    case 'field_count': {
      const current = events.filter((event) => {
        if (event.type !== condition.eventType) return false
        return String(readField(event, condition.field)) === condition.value
      }).length
      return { current, target: condition.target, met: current >= condition.target }
    }
    case 'track_completed': {
      const current = events.filter(
        (event) => event.type === 'track_completed' && event.trackId === condition.trackId,
      ).length
      return { current, target: 1, met: current >= 1 }
    }
    case 'module_completed': {
      const current = events.filter(
        (event) => event.type === 'module_completed' && event.moduleId === condition.moduleId,
      ).length
      return { current, target: 1, met: current >= 1 }
    }
    case 'track_completed_count': {
      const tracks = new Set(
        events.filter((event) => event.type === 'track_completed').map((event) => event.trackId),
      )
      const current = tracks.size
      return { current, target: condition.target, met: current >= condition.target }
    }
    case 'mechanic_usage': {
      const current = mechanicCount(events, condition.mechanicId)
      return { current, target: condition.target, met: current >= condition.target }
    }
    case 'tag_count': {
      const current = events.filter((event) => eventMatchesTag(event, condition.tag)).length
      return { current, target: condition.target, met: current >= condition.target }
    }
    case 'sidequest_category': {
      const current = events.filter(
        (event) => event.type === 'sidequest_completed' && event.category === condition.category,
      ).length
      return { current, target: condition.target, met: current >= condition.target }
    }
    case 'max_field_frequency': {
      const counts = new Map<string, number>()
      for (const event of events) {
        if (event.type !== condition.eventType) continue
        const value = readField(event, condition.field)
        if (value === undefined || value === null || value === '') continue
        const key = String(value)
        counts.set(key, (counts.get(key) || 0) + 1)
      }
      let current = 0
      for (const count of counts.values()) current = Math.max(current, count)
      return { current, target: condition.target, met: current >= condition.target }
    }
    default:
      return { current: 0, target: 1, met: false }
  }
}

export function evaluateAchievementProgress(
  definition: AchievementDefinition,
  events: RinkActivityEvent[],
): { current: number; target: number; met: boolean; ratio: number } {
  if (!definition.conditions.length) {
    return { current: 0, target: 1, met: false, ratio: 0 }
  }

  const parts = definition.conditions.map((condition) => evaluateConditionProgress(condition, events))
  const met = parts.every((part) => part.met)

  // Prefer explicit progression target, else first condition.
  const primary = parts[0]
  const target = definition.progression?.target ?? primary.target
  const current = Math.min(primary.current, target)
  const ratio = target > 0 ? Math.min(1, current / target) : 0

  return { current, target, met, ratio }
}

export function findNewlyUnlockedAchievements(
  events: RinkActivityEvent[],
  alreadyUnlocked: Record<string, unknown>,
  catalog: AchievementDefinition[] = TANK_ACHIEVEMENTS,
): AchievementDefinition[] {
  return catalog.filter((definition) => {
    if (alreadyUnlocked[definition.id]) return false
    if (isTankBlockedByLegacyUnlock(definition.id, alreadyUnlocked)) return false
    return evaluateAchievementProgress(definition, events).met
  })
}
