import type { ModuleDrillMap, TrackDrillMap } from './buildActivityFromSources'

type CurriculumLike = {
  tracks?: Array<{
    id?: string
    modules?: Array<{
      id?: string
      active?: boolean
      drills?: Array<{ id?: string }>
    }>
  }>
}

/** Build track/module drill maps for progression bootstrap & mastery. */
export function buildCurriculumProgressionMaps(curriculum: CurriculumLike | null | undefined): {
  trackDrills: TrackDrillMap
  moduleDrills: ModuleDrillMap
} {
  const trackDrills: TrackDrillMap = {}
  const moduleDrills: ModuleDrillMap = {}
  for (const track of curriculum?.tracks || []) {
    if (!track.id) continue
    const trackIds: string[] = []
    for (const module of track.modules || []) {
      if (module.active === false) continue
      const drillIds: string[] = []
      for (const drill of module.drills || []) {
        if (drill.id) {
          drillIds.push(drill.id)
          trackIds.push(drill.id)
        }
      }
      if (module.id) {
        trackIds.push(module.id)
        moduleDrills[module.id] = { trackId: track.id, drillIds: Array.from(new Set(drillIds)) }
      }
    }
    trackDrills[track.id] = Array.from(new Set(trackIds))
  }
  return { trackDrills, moduleDrills }
}
