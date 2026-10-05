import type { Curriculum } from '../api'
import type { DrillWithCount } from '../components/dashboard/DrillPriorityCards'

function compareDrillOrder(a: DrillWithCount, b: DrillWithCount): number {
  const aNum = a.drillNumber ?? Number.POSITIVE_INFINITY
  const bNum = b.drillNumber ?? Number.POSITIVE_INFINITY
  if (aNum !== bNum) return aNum - bNum
  return a.title.localeCompare(b.title, 'de')
}

function compareByCountThenOrder(a: DrillWithCount, b: DrillWithCount): number {
  if (a.count !== b.count) return a.count - b.count
  return compareDrillOrder(a, b)
}

type ModuleSlice = {
  moduleId: string
  drillIds: string[]
}

function buildModuleOrder(curriculum: Curriculum): ModuleSlice[] {
  const order: ModuleSlice[] = []
  for (const track of curriculum.tracks) {
    for (const module of track.modules) {
      if (module.active === false) continue
      order.push({
        moduleId: module.id,
        drillIds: module.drills.map((drill) => drill.id),
      })
    }
  }
  return order
}

function drillsForModule(
  drillIds: string[],
  drillById: Map<string, DrillWithCount>,
): DrillWithCount[] {
  return drillIds
    .map((id) => drillById.get(id))
    .filter((drill): drill is DrillWithCount => Boolean(drill))
}

function firstIncompleteInModule(moduleDrills: DrillWithCount[]): DrillWithCount[] {
  return moduleDrills.filter((drill) => drill.count === 0).sort(compareDrillOrder)
}

function isModuleComplete(moduleDrills: DrillWithCount[]): boolean {
  return moduleDrills.length > 0 && moduleDrills.every((drill) => drill.count > 0)
}

/**
 * Next drills in curriculum order: finish the earliest module with gaps, then advance
 * to the first drill of the next module when the current one is fully trained.
 *
 * When `scopeModuleId` is set (Dashboard Bereich filter), stay inside that module only —
 * never spill into a sibling like B1 → B1W.
 */
export function selectRecommendedNextDrills(
  drills: DrillWithCount[],
  curriculum: Curriculum | undefined | null,
  limit = 5,
  options?: {
    scopeModuleId?: string | null
    allDrills?: DrillWithCount[]
  },
): DrillWithCount[] {
  if (!drills.length) return []

  if (!curriculum?.tracks?.length) {
    return [...drills].sort(compareByCountThenOrder).slice(0, limit)
  }

  const moduleOrder = buildModuleOrder(curriculum)
  const scopedById = new Map(drills.map((drill) => [drill.id, drill]))
  const globalById = new Map((options?.allDrills ?? drills).map((drill) => [drill.id, drill]))
  const result: DrillWithCount[] = []
  const seen = new Set<string>()
  const scopeModuleId = String(options?.scopeModuleId || '').trim() || null

  const pushDrill = (drill: DrillWithCount | undefined) => {
    if (!drill || seen.has(drill.id) || result.length >= limit) return
    // Scoped Bereich: only accept drills that belong to the filtered set.
    if (scopeModuleId && !scopedById.has(drill.id)) return
    seen.add(drill.id)
    result.push(drill)
  }

  const startIndex = scopeModuleId
    ? moduleOrder.findIndex((item) => item.moduleId === scopeModuleId)
    : 0
  if (scopeModuleId && startIndex < 0) {
    return [...drills].sort(compareByCountThenOrder).slice(0, limit)
  }

  const endIndex = scopeModuleId ? startIndex + 1 : moduleOrder.length

  for (let index = Math.max(0, startIndex); index < endIndex; index += 1) {
    const slice = moduleOrder[index]
    const moduleDrills = drillsForModule(slice.drillIds, globalById)
    if (!moduleDrills.length) continue

    const incomplete = firstIncompleteInModule(moduleDrills)
    if (incomplete.length > 0) {
      for (const drill of incomplete) {
        pushDrill(scopedById.get(drill.id) ?? drill)
        if (result.length >= limit) return result
      }
      break
    }

    if (!isModuleComplete(moduleDrills)) continue
    // Module fully trained — in global scope keep scanning; scoped stays put.
  }

  if (result.length >= limit) return result

  for (const drill of [...drills].sort(compareByCountThenOrder)) {
    pushDrill(drill)
    if (result.length >= limit) break
  }

  return result
}
