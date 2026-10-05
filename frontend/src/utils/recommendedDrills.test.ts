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

{
  // Sibling modules (like B1 / B1W): scoped Bereich must not spill.
  const withSibling = {
    tracks: [
      {
        id: 'B',
        modules: [
          {
            id: 'B1',
            active: true,
            drills: [{ id: 'B1_D1' }, { id: 'B1_D2' }],
          },
          {
            id: 'B1W',
            active: true,
            drills: [{ id: 'B1W_D1' }, { id: 'B1W_D2' }],
          },
        ],
      },
    ],
  } as Curriculum
  const siblingDrills: DrillWithCount[] = [
    drill('B1_D1', 1, 'B1', 1),
    drill('B1_D2', 0, 'B1', 2),
    drill('B1W_D1', 0, 'B1W', 1),
    drill('B1W_D2', 0, 'B1W', 2),
  ]
  const b1Only = siblingDrills.filter((item) => item.moduleId === 'B1')
  const b1wOnly = siblingDrills.filter((item) => item.moduleId === 'B1W')

  const scopedB1 = selectRecommendedNextDrills(b1Only, withSibling, 5, {
    scopeModuleId: 'B1',
    allDrills: siblingDrills,
  })
  assert.equal(scopedB1[0]?.id, 'B1_D2', 'B1 scope prefers incomplete B1 drill first')
  assert.ok(scopedB1.every((item) => item.moduleId === 'B1'), 'B1 scope stays inside B1')
  assert.ok(!scopedB1.some((item) => String(item.id).startsWith('B1W')), 'B1 scope never lists B1W')

  const scopedB1Complete = selectRecommendedNextDrills(
    b1Only.map((item) => ({ ...item, count: 1 })),
    withSibling,
    5,
    { scopeModuleId: 'B1', allDrills: siblingDrills.map((item) => (item.moduleId === 'B1' ? { ...item, count: 1 } : item)) },
  )
  assert.ok(
    scopedB1Complete.every((item) => item.moduleId === 'B1'),
    'completed B1 scope must not spill into B1W',
  )
  assert.ok(!scopedB1Complete.some((item) => item.id.startsWith('B1W')), 'no B1W ids in B1 scope')

  const scopedB1W = selectRecommendedNextDrills(b1wOnly, withSibling, 5, {
    scopeModuleId: 'B1W',
    allDrills: siblingDrills,
  })
  assert.deepEqual(
    scopedB1W.map((item) => item.id),
    ['B1W_D1', 'B1W_D2'],
    'B1W scope stays inside B1W',
  )
}

console.log('recommendedDrills.test.ts: all assertions passed')
