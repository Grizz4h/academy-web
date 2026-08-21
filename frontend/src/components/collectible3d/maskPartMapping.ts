import * as THREE from 'three'

/**
 * Snapshot for `Meshy_AI_export_1787176890_part-segmentation.glb`
 * (geometry classifier + MASK_PART_OVERRIDES):
 *
 *   mesh_20 → frontShell   largest envelope
 *   mesh_1  → cage         largest front volume
 *   mesh_19 → backplate    largest rear volume
 *   mesh_17 / 18 → padding rear interior layers
 *   mesh_0, 2, 4, 5, 14, 15 → straps
 *   mesh_13 / 16 → technical panels (otherParts / hardware)
 *   rest → hardware
 *
 * Confirm in the lab with Show Part Colors. If a role is wrong, set
 * MASK_PART_OVERRIDES['mesh_N'] instead of scattering if-else in the viewer.
 */
export const MASK_PART_ROLES = [
  'frontShell',
  'cage',
  'backplate',
  'straps',
  'padding',
  'hardware',
  'otherParts',
] as const

export type MaskPartRole = (typeof MASK_PART_ROLES)[number]

export type MeshStat = {
  name: string
  parentName: string
  materialName: string
  triangles: number
  vertices: number
  center: THREE.Vector3
  size: THREE.Vector3
  min: THREE.Vector3
  max: THREE.Vector3
}

export type MaskPartInfo = {
  sourceName: string
  parentName: string
  role: MaskPartRole
  reason: string
  triangles: number
  vertices: number
  materialName: string
  center: [number, number, number]
  size: [number, number, number]
}

/**
 * Confirmed for Meshy_AI_export_1787176890_part-segmentation.glb
 * after spatial classification + visual role pass.
 */
export const MASK_PART_OVERRIDES: Record<string, MaskPartRole> = {
  mesh_17: 'padding',
  mesh_18: 'padding',
  mesh_13: 'otherParts',
  mesh_16: 'hardware',
}

export const ROLE_LABELS: Record<MaskPartRole, string> = {
  frontShell: 'Front Shell',
  cage: 'Cage',
  backplate: 'Backplate',
  straps: 'Straps',
  padding: 'Padding',
  hardware: 'Hardware',
  otherParts: 'Other',
}

export const ROLE_COLORS: Record<MaskPartRole, string> = {
  frontShell: '#00E5FF',
  cage: '#FFD166',
  backplate: '#FF007A',
  straps: '#7A3CFF',
  padding: '#34c759',
  hardware: '#c9a227',
  otherParts: '#8e8e93',
}

/** Unique per-mesh debug colors (Show Part Colors). Index by traversal order. */
export const DEBUG_MESH_COLORS = [
  '#ff3b30',
  '#ff9500',
  '#ffcc00',
  '#34c759',
  '#00c7be',
  '#32ade6',
  '#007aff',
  '#5856d6',
  '#af52de',
  '#ff2d55',
  '#a2845e',
  '#8e8e93',
  '#ff6b6b',
  '#4ecdc4',
  '#ffe66d',
  '#95e1d3',
  '#f38181',
  '#aa96da',
  '#fcbad3',
  '#c7f464',
  '#ff9ff3',
  '#48dbfb',
]

const LARGE_TRI_FLOOR = 80_000

function materialNameOf(mesh: THREE.Mesh): string {
  const material = mesh.material
  if (Array.isArray(material)) return material.map((entry) => entry.name || entry.type).join(', ')
  return material?.name || material?.type || '(none)'
}

export function collectMeshStats(root: THREE.Object3D): MeshStat[] {
  root.updateWorldMatrix(true, true)
  const stats: MeshStat[] = []
  root.traverse((obj) => {
    if (!(obj instanceof THREE.Mesh) || !obj.geometry) return
    const box = new THREE.Box3().setFromObject(obj)
    const size = box.getSize(new THREE.Vector3())
    const center = box.getCenter(new THREE.Vector3())
    const verts = obj.geometry.getAttribute('position')?.count ?? 0
    const indexCount = obj.geometry.index?.count ?? verts
    stats.push({
      name: obj.name || '(unnamed)',
      parentName: obj.parent?.name || '(root)',
      materialName: materialNameOf(obj),
      triangles: Math.round(indexCount / 3),
      vertices: verts,
      center,
      size,
      min: box.min.clone(),
      max: box.max.clone(),
    })
  })
  return stats
}

export function classifyMaskMeshes(stats: MeshStat[]): MaskPartInfo[] {
  if (stats.length === 0) return []

  const overallMin = new THREE.Vector3(Infinity, Infinity, Infinity)
  const overallMax = new THREE.Vector3(-Infinity, -Infinity, -Infinity)
  for (const stat of stats) {
    overallMin.min(stat.min)
    overallMax.max(stat.max)
  }
  const overallSize = overallMax.clone().sub(overallMin)
  const overallCenter = overallMin.clone().add(overallMax).multiplyScalar(0.5)
  const halfW = Math.max(overallSize.x * 0.5, 1e-6)
  const depth = Math.max(overallSize.z, 1e-6)
  const height = Math.max(overallSize.y, 1e-6)
  const width = Math.max(overallSize.x, 1e-6)

  const assigned = new Map<string, { role: MaskPartRole; reason: string }>()
  const large = stats.filter((stat) => stat.triangles >= LARGE_TRI_FLOOR)

  if (large.length > 0) {
    const cageMain = [...large].sort((a, b) => b.center.z - a.center.z)[0]
    const backMain = [...large].sort((a, b) => a.center.z - b.center.z)[0]
    assigned.set(cageMain.name, { role: 'cage', reason: 'largest volume closest to the front (+Z)' })
    if (backMain.name !== cageMain.name) {
      assigned.set(backMain.name, { role: 'backplate', reason: 'largest volume closest to the back (−Z)' })
    }
    const leftover = large.filter((stat) => !assigned.has(stat.name)).sort((a, b) => b.triangles - a.triangles)
    if (leftover[0]) {
      assigned.set(leftover[0].name, { role: 'frontShell', reason: 'largest remaining full-envelope mesh' })
    }
    leftover.slice(1).forEach((stat) => {
      assigned.set(stat.name, { role: 'padding', reason: 'remaining large interior / lower volume' })
    })
  }

  for (const stat of stats) {
    const override = MASK_PART_OVERRIDES[stat.name]
    if (override) {
      assigned.set(stat.name, { role: override, reason: 'MASK_PART_OVERRIDES' })
    }
  }

  for (const stat of stats) {
    if (assigned.has(stat.name)) continue
    const frontness = (stat.center.z - overallMin.z) / depth
    const lateral = Math.abs(stat.center.x - overallCenter.x) / halfW
    const thinY = stat.size.y / height < 0.08
    const wideX = stat.size.x / width > 0.35
    const thinX = stat.size.x / width < 0.18

    if (frontness > 0.7 && thinY && wideX) {
      assigned.set(stat.name, { role: 'cage', reason: 'thin wide bar on the front plane' })
      continue
    }
    if (stat.triangles >= 15_000 && stat.triangles < 80_000 && lateral > 0.55 && thinX) {
      assigned.set(stat.name, { role: 'straps', reason: 'lateral elongated piece' })
      continue
    }
    if (stat.triangles < 25_000) {
      assigned.set(stat.name, { role: 'hardware', reason: 'small fragment' })
      continue
    }
    assigned.set(stat.name, { role: 'otherParts', reason: 'medium piece, no unique spatial signature' })
  }

  return stats.map((stat) => {
    const hit = assigned.get(stat.name) || { role: 'otherParts' as const, reason: 'fallback' }
    return {
      sourceName: stat.name,
      parentName: stat.parentName,
      role: hit.role,
      reason: hit.reason,
      triangles: stat.triangles,
      vertices: stat.vertices,
      materialName: stat.materialName,
      center: [stat.center.x, stat.center.y, stat.center.z],
      size: [stat.size.x, stat.size.y, stat.size.z],
    }
  })
}

export function roleForSourceName(parts: MaskPartInfo[], sourceName: string): MaskPartRole {
  return parts.find((part) => part.sourceName === sourceName)?.role || 'otherParts'
}

export function formatPartMap(parts: MaskPartInfo[]): string {
  return parts
    .map((part) => `  ${part.sourceName} → ${part.role}  (${part.reason}, ${part.triangles.toLocaleString('de-DE')} tris)`)
    .join('\n')
}
