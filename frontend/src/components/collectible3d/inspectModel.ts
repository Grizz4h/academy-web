import * as THREE from 'three'
import { GOALIE_MASK_GLB_BYTES } from './assets'
import { formatPartMap, type MaskPartInfo } from './maskPartMapping'

export type MeshInspectRow = {
  name: string
  parentName: string
  triangles: number
  vertices: number
  material: string
  hasNormals: boolean
  hasUvs: boolean
  hasVertexColors: boolean
}

export type ModelInspectSummary = {
  meshCount: number
  nodeCount: number
  meshes: MeshInspectRow[]
  materialCount: number
  materialNames: string[]
  triangles: number
  vertices: number
  hasNormals: boolean
  hasUvs: boolean
  separateCage: boolean
  separateShell: boolean
  splitConfirmed: boolean
  bytes: number
  parts: MaskPartInfo[]
  bounds: { center: [number, number, number]; size: [number, number, number]; radius: number }
}

function materialName(material: THREE.Material | THREE.Material[]): string {
  if (Array.isArray(material)) {
    return material.map((entry) => entry.name || entry.type).join(', ')
  }
  return material.name || material.type
}

export function inspectObject3D(root: THREE.Object3D, parts: MaskPartInfo[] = []): ModelInspectSummary {
  const meshes: MeshInspectRow[] = []
  const materialNames = new Set<string>()
  let triangles = 0
  let vertices = 0
  let nodeCount = 0
  let hasNormals = false
  let hasUvs = false
  const worldBox = new THREE.Box3()
  let hasBox = false

  root.updateWorldMatrix(true, true)
  root.traverse((obj) => {
    nodeCount += 1
    if (!(obj instanceof THREE.Mesh) || !obj.geometry) return
    const geo = obj.geometry
    const verts = geo.getAttribute('position')?.count ?? 0
    const indexCount = geo.index?.count ?? verts
    const tris = Math.round(indexCount / 3)
    const normals = Boolean(geo.getAttribute('normal'))
    const uvs = Boolean(geo.getAttribute('uv'))
    const vertexColors = Boolean(geo.getAttribute('color'))
    const mat = materialName(obj.material)
    meshes.push({
      name: obj.name || '(unnamed)',
      parentName: obj.parent?.name || '(root)',
      triangles: tris,
      vertices: verts,
      material: mat,
      hasNormals: normals,
      hasUvs: uvs,
      hasVertexColors: vertexColors,
    })
    materialNames.add(mat)
    triangles += tris
    vertices += verts
    hasNormals = hasNormals || normals
    hasUvs = hasUvs || uvs
    const box = new THREE.Box3().setFromObject(obj)
    if (hasBox) worldBox.union(box)
    else {
      worldBox.copy(box)
      hasBox = true
    }
  })

  const size = worldBox.getSize(new THREE.Vector3())
  const center = worldBox.getCenter(new THREE.Vector3())
  const sphere = worldBox.getBoundingSphere(new THREE.Sphere())
  const roles = new Set(parts.map((part) => part.role))

  return {
    meshCount: meshes.length,
    nodeCount,
    meshes,
    materialCount: materialNames.size,
    materialNames: [...materialNames],
    triangles,
    vertices,
    hasNormals,
    hasUvs,
    separateCage: roles.has('cage'),
    separateShell: roles.has('frontShell'),
    splitConfirmed: meshes.length > 1,
    bytes: GOALIE_MASK_GLB_BYTES,
    parts,
    bounds: {
      center: [center.x, center.y, center.z],
      size: [size.x, size.y, size.z],
      radius: sphere.radius || size.length() * 0.5,
    },
  }
}

export function formatInspectLog(label: string, summary: ModelInspectSummary): string {
  const mb = (summary.bytes / 1024 / 1024).toFixed(1)
  const meshLines = summary.meshes
    .map((row) => `  • ${row.name}  parent=${row.parentName}  ${row.triangles.toLocaleString('de-DE')} tris  mat=${row.material}`)
    .join('\n')
  const warn = summary.triangles > 250_000
    ? `\n  ⚠ oversize mesh — keep the original GLB, decide remesh/Draco later`
    : ''
  const partMap = summary.parts.length ? `\n${formatPartMap(summary.parts)}` : ''
  return [
    `[${label}] meshes=${summary.meshCount}  nodes=${summary.nodeCount}  materials=${summary.materialCount}  tris≈${summary.triangles.toLocaleString('de-DE')}  verts=${summary.vertices.toLocaleString('de-DE')}  file=${mb} MB`,
    `  UVs=${summary.hasUvs ? 'yes' : 'no'}  normals=${summary.hasNormals ? 'yes' : 'no'}  split=${summary.splitConfirmed ? 'yes' : 'no'}  cage/shell=${summary.separateCage && summary.separateShell ? 'yes' : 'no'}`,
    meshLines,
    partMap,
    warn,
  ].filter(Boolean).join('\n')
}

export function logModelInspect(label: string, summary: ModelInspectSummary): void {
  console.info(formatInspectLog(label, summary))
}
