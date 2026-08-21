import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { MYSTIC_CYAN, MYSTIC_MAGENTA } from './mysticMaterials'

function Emissive({ color, intensity = 1.4 }: { color: string; intensity?: number }) {
  return (
    <meshStandardMaterial
      color={color}
      emissive={color}
      emissiveIntensity={intensity}
      roughness={0.18}
      metalness={0.55}
      toneMapped={false}
    />
  )
}

/**
 * Mystic-only energy crown: cold cyan dominant, one magenta counter-ring.
 * Reads as artefact staging — not a rainbow loot burst.
 */
export function MysticHalo() {
  const spin = useRef<THREE.Group>(null)
  const counter = useRef<THREE.Group>(null)

  useFrame((_, dt) => {
    if (spin.current) spin.current.rotation.y += dt * 0.18
    if (counter.current) counter.current.rotation.y -= dt * 0.11
  })

  return (
    <group position={[0, 0.52, -0.38]}>
      <group ref={spin}>
        <mesh rotation={[Math.PI / 2.12, 0, 0.12]}>
          <torusGeometry args={[0.74, 0.014, 8, 72]} />
          <Emissive color={MYSTIC_CYAN} intensity={2.05} />
        </mesh>
        <mesh rotation={[1.25, 0.25, -0.22]}>
          <torusGeometry args={[0.5, 0.009, 8, 56]} />
          <Emissive color={MYSTIC_CYAN} intensity={1.35} />
        </mesh>
        {Array.from({ length: 6 }, (_, i) => {
          const a = (i / 6) * Math.PI * 2
          return (
            <mesh
              key={i}
              position={[Math.cos(a) * 0.74, Math.sin(a * 2) * 0.045, Math.sin(a) * 0.74]}
              rotation={[0, -a, 0.35]}
            >
              <octahedronGeometry args={[0.042, 0]} />
              <Emissive color={i % 3 === 0 ? MYSTIC_MAGENTA : MYSTIC_CYAN} intensity={1.55} />
            </mesh>
          )
        })}
      </group>
      <group ref={counter} position={[0, 0.18, 0]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.3, 0.008, 8, 40]} />
          <Emissive color={MYSTIC_MAGENTA} intensity={1.05} />
        </mesh>
        {[-0.14, 0.14].map((x) => (
          <mesh key={x} position={[x, 0.24, 0]} rotation={[0.15, 0, x * 0.35]}>
            <coneGeometry args={[0.028, 0.16, 4]} />
            <Emissive color={MYSTIC_CYAN} intensity={1.45} />
          </mesh>
        ))}
      </group>
      <pointLight position={[0, 0.05, 0.05]} color={MYSTIC_CYAN} intensity={1.35} distance={3.0} />
      <pointLight position={[0.22, 0.16, 0.08]} color={MYSTIC_MAGENTA} intensity={0.35} distance={2.0} />
    </group>
  )
}
