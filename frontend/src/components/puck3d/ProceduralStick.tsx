import { useMemo } from 'react'
import * as THREE from 'three'
import type { StickSkinMaterial } from '../../features/progression/cosmetics/stickSkins'

type ProceduralStickProps = {
  material: StickSkinMaterial
}

const SHAFT_LEN = 2.85
const SHAFT_W = 0.075
const SHAFT_D = 0.048
const BLADE_LEN = 0.95
const BLADE_H = 0.2
const BLADE_T = 0.045

function createAccentTexture(accent: string): THREE.CanvasTexture {
  const w = 256
  const h = 64
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!
  ctx.clearRect(0, 0, w, h)
  ctx.fillStyle = accent
  ctx.globalAlpha = 0.95
  ctx.fillRect(0, h * 0.35, w, h * 0.3)
  ctx.font = `700 22px "Trebuchet MS", "Segoe UI", sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.globalAlpha = 1
  ctx.fillText('RINK', w / 2, h / 2)
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.needsUpdate = true
  return texture
}

/** Procedural hockey stick: shaft + curved blade + grip + accent. */
export function ProceduralStick({ material }: ProceduralStickProps) {
  const accentMap = useMemo(
    () => createAccentTexture(material.accentColor),
    [material.accentColor],
  )

  const shaftMat = {
    color: material.shaftColor,
    roughness: material.roughness,
    metalness: material.metalness,
    emissive: material.emissive || '#000000',
    emissiveIntensity: material.emissiveIntensity ?? 0,
  }
  const bladeMat = {
    color: material.bladeColor,
    roughness: material.bladeRoughness ?? material.roughness,
    metalness: material.bladeMetalness ?? material.metalness * 0.5,
    emissive: material.emissive || '#000000',
    emissiveIntensity: (material.emissiveIntensity ?? 0) * 0.6,
  }

  // Blade segments for a light mid-curve (toe opens toward +Z)
  const bladeSegments = [
    { x: 0.14, rotY: 0.02 },
    { x: 0.4, rotY: 0.08 },
    { x: 0.66, rotY: 0.16 },
    { x: 0.88, rotY: 0.26 },
  ]

  return (
    <group dispose={null}>
      {/* Main shaft */}
      <mesh position={[0, SHAFT_LEN / 2, 0]} castShadow>
        <boxGeometry args={[SHAFT_W, SHAFT_LEN, SHAFT_D]} />
        <meshStandardMaterial {...shaftMat} />
      </mesh>

      {/* Lower shaft taper into hosel */}
      <mesh position={[0, 0.22, 0]} scale={[0.92, 1, 0.88]} castShadow>
        <boxGeometry args={[SHAFT_W, 0.42, SHAFT_D]} />
        <meshStandardMaterial {...shaftMat} />
      </mesh>

      {/* Grip tape */}
      <mesh position={[0, SHAFT_LEN - 0.28, 0]} castShadow>
        <boxGeometry args={[SHAFT_W * 1.12, 0.55, SHAFT_D * 1.14]} />
        <meshStandardMaterial
          color={material.gripColor}
          roughness={0.92}
          metalness={0.02}
        />
      </mesh>

      {/* Butt end cap */}
      <mesh position={[0, SHAFT_LEN + 0.02, 0]}>
        <boxGeometry args={[SHAFT_W * 1.05, 0.06, SHAFT_D * 1.05]} />
        <meshStandardMaterial color={material.gripColor} roughness={0.8} metalness={0.05} />
      </mesh>

      {/* Accent stripe mid-shaft */}
      <mesh position={[0, SHAFT_LEN * 0.55, SHAFT_D / 2 + 0.001]} rotation={[0, 0, 0]}>
        <planeGeometry args={[SHAFT_W * 0.92, 0.28]} />
        <meshStandardMaterial
          map={accentMap}
          transparent
          opacity={0.95}
          roughness={0.45}
          metalness={0.15}
          depthWrite={false}
        />
      </mesh>

      {/* Thin accent rings */}
      {[0.95, 1.05].map((y) => (
        <mesh key={y} position={[0, y, 0]}>
          <boxGeometry args={[SHAFT_W * 1.04, 0.03, SHAFT_D * 1.06]} />
          <meshStandardMaterial
            color={material.accentColor}
            roughness={0.4}
            metalness={0.35}
            emissive={material.accentColor}
            emissiveIntensity={0.08}
          />
        </mesh>
      ))}

      {/* Blade hosel / heel joint */}
      <mesh position={[0.05, 0.02, 0]} rotation={[0, 0, -0.12]} castShadow>
        <boxGeometry args={[0.16, 0.14, SHAFT_D * 1.05]} />
        <meshStandardMaterial {...bladeMat} />
      </mesh>

      {/* Blade body — lie angle + curve */}
      <group position={[0.08, -0.02, 0]} rotation={[0.08, 0, -Math.PI / 2 + 0.08]}>
        {bladeSegments.map((seg, i) => (
          <mesh
            key={i}
            position={[seg.x, 0, Math.sin(seg.rotY) * 0.08]}
            rotation={[0, seg.rotY, 0]}
            castShadow
          >
            <boxGeometry
              args={[
                BLADE_LEN / bladeSegments.length + 0.04,
                BLADE_H * (i === bladeSegments.length - 1 ? 0.85 : 1),
                BLADE_T,
              ]}
            />
            <meshStandardMaterial {...bladeMat} />
          </mesh>
        ))}

        {/* Toe cap */}
        <mesh position={[BLADE_LEN * 0.98, 0, 0.12]} rotation={[0, 0.32, 0]}>
          <boxGeometry args={[0.12, BLADE_H * 0.75, BLADE_T]} />
          <meshStandardMaterial {...bladeMat} />
        </mesh>
      </group>
    </group>
  )
}
