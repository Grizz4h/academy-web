import assert from 'node:assert/strict'
import type { Curriculum } from '../api'
import type { DrillWithCount } from '../components/dashboard/DrillPriorityCards'
import { selectRecommendedNextDrills } from './recommendedDrills.ts'

const curriculum = {
  tracks: [
    {
      id: 'A',
      modules: [
        {
          id: 'A1',
          active: true,
          drills: [{ id: 'A1_D1' }, { id: 'A1_D2' }, { id: 'A1_D3' }],
        },
        {
          id: 'A2',
          active: true,
          drills: [{ id: 'A2_D1' }, { id: 'A2_D2' }],
        },
      ],
    },
    {
      id: 'B',
      modules: [
        {
          id: 'B1',
          active: true,
          drills: [{ id: 'B1_D1' }],
        },
      ],
    },
  ],
} as Curriculum

function drill(id: string, count: number, moduleId: string, drillNumber: number): DrillWithCount {
  return { id, title: id, count, moduleId, drillNumber }
}

const allDrills: DrillWithCount[] = [
  drill('A1_D1', 2, 'A1', 1),
  drill('A1_D2', 1, 'A1', 2),
  drill('A1_D3', 0, 'A1', 3),
  drill('A2_D1', 0, 'A2', 1),
  drill('A2_D2', 0, 'A2', 2),
  drill('B1_D1', 0, 'B1', 1),
]

{
  const next = selectRecommendedNextDrills(allDrills, curriculum, 3)
  assert.equal(next[0]?.id, 'A1_D3', 'earliest incomplete drill in current module')
}

{
  const completedA1 = allDrills.map((item) =>
    item.moduleId === 'A1' ? { ...item, count: Math.max(item.count, 1) } : item,
  )
  const next = selectRecommendedNextDrills(completedA1, curriculum, 1)
  assert.equal(next[0]?.id, 'A2_D1', 'completed module advances to first drill of next module')
}

{
  const completedA1 = allDrills.map((item) =>
    item.moduleId === 'A1' ? { ...item, count: Math.max(item.count, 1) } : item,
  )
  const completedA = completedA1.map((item) =>
    item.moduleId === 'A2' ? { ...item, count: 1 } : item,
  )
  const next = selectRecommendedNextDrills(completedA, curriculum, 1)
  assert.equal(next[0]?.id, 'B1_D1', 'advances across track boundary')
}

console.log('recommendedDrills.test.ts: all assertions passed')
