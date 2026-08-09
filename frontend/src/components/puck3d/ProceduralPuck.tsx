import { useMemo } from 'react'
import * as THREE from 'three'
import type { PuckSkinMaterial } from '../../features/progression/cosmetics/puckSkins'

type ProceduralPuckProps = {
  material: PuckSkinMaterial
}

/**
 * Disk-first silhouette (less tuna-can):
 * flatter body + rounded rubber edge via Lathe.
 */
const RADIUS = 1
/** Between tuna-can (~0.66) and too-flat (~0.40). */
const HEIGHT = 0.52
const EDGE = 0.08

function createBrandTexture(markColor: string): THREE.CanvasTexture {
  const size = 512
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!

  ctx.clearRect(0, 0, size, size)

  ctx.beginPath()
  ctx.arc(size / 2, size / 2, size * 0.4, 0, Math.PI * 2)
  ctx.strokeStyle = markColor
  ctx.globalAlpha = 0.45
  ctx.lineWidth = size * 0.026
  ctx.stroke()

  ctx.beginPath()
  ctx.arc(size / 2, size / 2, size * 0.27, 0, Math.PI * 2)
  ctx.globalAlpha = 0.28
  ctx.lineWidth = size * 0.01
  ctx.stroke()

  ctx.globalAlpha = 0.96
  ctx.fillStyle = markColor
  ctx.font = `800 ${Math.round(size * 0.145)}px "Trebuchet MS", "Segoe UI", sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('RINK', size / 2, size / 2 - size * 0.055)
  ctx.font = `650 ${Math.round(size * 0.1)}px "Trebuchet MS", "Segoe UI", sans-serif`
  ctx.globalAlpha = 0.9
  ctx.fillText('TANK', size / 2, size / 2 + size * 0.1)

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 8
  texture.needsUpdate = true
  return texture
}

/** Cross-section from axis → outer rubber edge (rounded top/bottom). */
function buildPuckLathePoints(): THREE.Vector2[] {
  const half = HEIGHT / 2
  const r = RADIUS
  const e = EDGE
  const points: THREE.Vector2[] = []

  points.push(new THREE.Vector2(0, -half))
  points.push(new THREE.Vector2(r - e, -half))

  // Bottom outer fillet (quarter circle)
  for (let i = 1; i <= 8; i++) {
    const t = i / 8
    const a = -Math.PI / 2 + (Math.PI / 2) * t
    points.push(new THREE.Vector2(r - e + Math.cos(a) * e, -half + e + Math.sin(a) * e))
  }

  // Short side wall
  points.push(new THREE.Vector2(r, half - e))

  // Top outer fillet
  for (let i = 1; i <= 8; i++) {
    const t = i / 8
    const a = 0 + (Math.PI / 2) * t
    points.push(new THREE.Vector2(r - e + Math.cos(a) * e, half - e + Math.sin(a) * e))
  }

  points.push(new THREE.Vector2(r - e, half))
  points.push(new THREE.Vector2(0, half))
  return points
}

export function ProceduralPuck({ material }: ProceduralPuckProps) {
  const brandTexture = useMemo(
    () => createBrandTexture(material.markColor || '#eef5fa'),
    [material.markColor],
  )
  const lathePoints = useMemo(() => buildPuckLathePoints(), [])

  return (
    <group dispose={null}>
      <mesh castShadow receiveShadow>
        <latheGeometry args={[lathePoints, 72]} />
        <meshStandardMaterial
          color={material.baseColor}
          roughness={material.roughness}
          metalness={material.metalness}
          emissive={material.emissive || '#000000'}
          emissiveIntensity={material.emissiveIntensity ?? 0}
        />
      </mesh>

      <mesh position={[0, HEIGHT / 2 + 0.0012, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[RADIUS * 0.8, 64]} />
        <meshStandardMaterial
          map={brandTexture}
          transparent
          opacity={material.markOpacity ?? 0.9}
          roughness={0.5}
          metalness={0.04}
          depthWrite={false}
          polygonOffset
          polygonOffsetFactor={-1}
        />
      </mesh>
    </group>
  )
}
