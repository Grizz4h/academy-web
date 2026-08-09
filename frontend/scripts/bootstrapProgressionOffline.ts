/**
 * One-off offline bootstrap: grant Phase-1 progression from historical data.
 * Run: npx --yes tsx scripts/bootstrapProgressionOffline.ts
 *
 * Preserves legacy PUX / medal achievements / mastery / processedSessions.
 * Adds XP, tank achievements, cosmetics, activity log, unlock history.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  BOOTSTRAP_EVENT_ID,
  bootstrapProgression,
  getLevelFromXp,
  getStarterCosmeticIds,
  TANK_ACHIEVEMENT_BY_ID,
} from '../src/features/progression'
import type { ProgressionStateSlice } from '../src/features/progression/progressionEngine'
import type { Session, SceneMarker } from '../src/api'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '../../data/academy')
const SCENES_ROOT = path.resolve(__dirname, '../../data/scenes')
const REWARDS_DIR = path.join(ROOT, 'rewards')
const SESSIONS_DIR = path.join(ROOT, 'sessions')
const CURRICULUM_PATH = path.join(ROOT, 'curriculum.json')
const USERS_PATH = path.join(ROOT, 'users.json')

function walkJsonFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return []
  const out: string[] = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) out.push(...walkJsonFiles(full))
    else if (entry.name.endsWith('.json')) out.push(full)
  }
  return out
}

function rewardKey(username: string): string {
  return username.trim().toLowerCase()
}

function loadJson<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, 'utf8')) as T
}

function emptySlice(): ProgressionStateSlice {
  return {
    xp: 0,
    unlockedAchievements: {},
    unlockedCosmetics: {},
    processedEvents: {},
    activityLog: [],
    unlockHistory: [],
  }
}

function loadCurriculumTrackDrills(): Record<string, string[]> {
  const curriculum = loadJson<any>(CURRICULUM_PATH)
  const trackDrills: Record<string, string[]> = {}
  for (const track of curriculum.tracks || []) {
    const ids: string[] = []
    for (const module of track.modules || []) {
      if (module.active === false) continue
      for (const drill of module.drills || []) {
        if (drill.id) ids.push(drill.id)
      }
      if (module.id) ids.push(module.id)
    }
    trackDrills[track.id] = Array.from(new Set(ids))
  }
  return trackDrills
}

function main() {
  const usersDoc = loadJson<{ users: Array<{ username: string }> }>(USERS_PATH)
  const usernames = usersDoc.users.map((u) => u.username)
  const trackDrills = loadCurriculumTrackDrills()

  const allSessions = walkJsonFiles(SESSIONS_DIR)
    .map((file) => {
      try {
        return loadJson<any>(file)
      } catch {
        return null
      }
    })
    .filter(Boolean)

  const allScenes = walkJsonFiles(SCENES_ROOT)
    .map((file) => {
      try {
        return loadJson<any>(file)
      } catch {
        return null
      }
    })
    .filter((doc) => doc && (doc.id || doc.scene_id))

  if (!fs.existsSync(REWARDS_DIR)) fs.mkdirSync(REWARDS_DIR, { recursive: true })

  const report: Array<Record<string, unknown>> = []

  for (const username of usernames) {
    const key = rewardKey(username)
    const rewardPath = path.join(REWARDS_DIR, `${key}.json`)
    const existing = fs.existsSync(rewardPath)
      ? loadJson<any>(rewardPath)
      : {
          currency: { PUX: 0 },
          unlockedAchievements: {},
          unlockedMasteries: {},
          processedSessions: {},
        }

    // Already bootstrapped? Still allow force via FORCE=1
    const force = process.env.FORCE === '1'
    if (!force && (existing.bootstrapCompletedAt || existing.processedEvents?.[BOOTSTRAP_EVENT_ID])) {
      report.push({
        user: username,
        skipped: true,
        reason: 'already_bootstrapped',
        xp: existing.xp || 0,
        level: getLevelFromXp(existing.xp || 0),
        pux: existing.currency?.PUX || 0,
        tankAchievements: Object.keys(existing.unlockedAchievements || {}).filter((id) => TANK_ACHIEVEMENT_BY_ID[id])
          .length,
      })
      continue
    }

    const sessions = allSessions.filter(
      (session) => String(session.user || '').toLowerCase() === key,
    ) as Session[]

    const scenes = allScenes.filter((scene) => {
      const owner = String(scene.user || scene.created_by || '').toLowerCase()
      return owner === key
    }) as SceneMarker[]

    const existingSlice: ProgressionStateSlice = {
      xp: 0,
      unlockedAchievements: { ...(existing.unlockedAchievements || {}) },
      unlockedCosmetics: { ...(existing.unlockedCosmetics || {}) },
      processedEvents: force ? {} : { ...(existing.processedEvents || {}) },
      activityLog: [],
      unlockHistory: [],
    }

    const result = bootstrapProgression({
      sessions,
      scenes,
      trackDrills,
      existing: force ? emptySlice() : existingSlice,
      forceRebuild: force,
    })

    // Keep legacy medal achievements that are not tank ids
    const mergedAchievements = {
      ...(existing.unlockedAchievements || {}),
      ...result.state.unlockedAchievements,
    }

    const previousProgressionPux = Number(existing.progressionPuxGranted || 0)
    const nextProgressionPux = result.aggregate.grantedPux
    const puxDelta = Math.max(0, nextProgressionPux - previousProgressionPux)
    const nextPux = Number(existing.currency?.PUX || 0) + puxDelta

    const now = new Date().toISOString()
    const nextState = {
      ...existing,
      currency: { PUX: nextPux },
      unlockedAchievements: mergedAchievements,
      unlockedMasteries: existing.unlockedMasteries || {},
      processedSessions: existing.processedSessions || {},
      xp: result.state.xp,
      processedEvents: result.state.processedEvents,
      unlockedCosmetics: {
        ...Object.fromEntries(
          getStarterCosmeticIds().map((id) => [
            id,
            { cosmeticId: id, unlockedAt: now, sourceType: 'starter' },
          ]),
        ),
        ...result.state.unlockedCosmetics,
      },
      activityLog: result.state.activityLog,
      unlockHistory: result.state.unlockHistory,
      bootstrapCompletedAt: now,
      progressionPuxGranted: nextProgressionPux,
      lastUpdatedAt: now,
    }

    fs.writeFileSync(rewardPath, JSON.stringify(nextState, null, 2) + '\n')

    const tankUnlocked = Object.keys(result.state.unlockedAchievements).filter((id) => TANK_ACHIEVEMENT_BY_ID[id])

    report.push({
      user: username,
      skipped: false,
      realCompletedSessions: sessions.filter((s) => s.state === 'COMPLETED' && !s.is_dummy && !s.isDummy).length,
      scenes: scenes.length,
      xp: result.state.xp,
      level: getLevelFromXp(result.state.xp),
      puxBefore: existing.currency?.PUX || 0,
      puxAfter: nextPux,
      puxGrantedNow: puxDelta,
      tankAchievements: tankUnlocked.length,
      tankAchievementIds: tankUnlocked.sort(),
      cosmetics: Object.keys(result.state.unlockedCosmetics).length,
    })
  }

  console.log(JSON.stringify(report, null, 2))
}

main()
