import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { MYSTIC_CYAN, MYSTIC_MAGENTA, MYSTIC_TITANIUM } from './mysticMaterials'

/** Sparse cold motes — prestige dust, not confetti. */
const COUNT = 36

export function MysticParticles() {
  const points = useRef<THREE.Points>(null)
  const { positions, seeds } = useMemo(() => {
    const positions = new Float32Array(COUNT * 3)
    const seeds = new Float32Array(COUNT)
    for (let i = 0; i < COUNT; i++) {
      const a = Math.random() * Math.PI * 2
      const y = (Math.random() - 0.42) * 1.55
      const r = 0.68 + Math.random() * 0.48
      positions[i * 3] = Math.cos(a) * r
      positions[i * 3 + 1] = y
      positions[i * 3 + 2] = Math.sin(a) * r
      seeds[i] = Math.random() * Math.PI * 2
    }
    return { positions, seeds }
  }, [])

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    return geo
  }, [positions])

  useFrame(({ clock }) => {
    const attr = points.current?.geometry.getAttribute('position')
    if (!attr) return
    const t = clock.elapsedTime
    for (let i = 0; i < COUNT; i++) {
      const s = seeds[i]
      attr.setY(i, positions[i * 3 + 1] + Math.sin(t * 0.32 + s) * 0.06)
    }
    attr.needsUpdate = true
  })

  return (
    <points ref={points} geometry={geometry} frustumCulled={false}>
      <pointsMaterial
        color={MYSTIC_CYAN}
        size={0.028}
        sizeAttenuation
        transparent
        opacity={0.62}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        toneMapped={false}
      />
    </points>
  )
}

/** Orbiting titanium shards — Legendary also gets these; Mystic keeps them cooler. */
export function MysticShards() {
  const group = useRef<THREE.Group>(null)
  const items = useMemo(
    () =>
      Array.from({ length: 5 }, (_, i) => ({
        radius: 0.82 + (i % 3) * 0.1,
        speed: 0.15 + i * 0.035,
        y: -0.28 + i * 0.16,
        phase: (i / 5) * Math.PI * 2,
        color: i === 2 ? MYSTIC_MAGENTA : i % 2 ? MYSTIC_CYAN : MYSTIC_TITANIUM,
        scale: 0.04 + (i % 3) * 0.01,
        metal: i % 2 === 0,
      })),
    [],
  )

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    group.current?.children.forEach((child, i) => {
      const item = items[i]
      if (!item) return
      const a = item.phase + t * item.speed
      child.position.set(
        Math.cos(a) * item.radius,
        item.y + Math.sin(t * 0.55 + item.phase) * 0.05,
        Math.sin(a) * item.radius,
      )
      child.rotation.x = t * 0.35
      child.rotation.y = t * 0.22
    })
  })

  return (
    <group ref={group}>
      {items.map((item, i) => (
        <mesh key={i}>
          <octahedronGeometry args={[item.scale, 0]} />
          <meshStandardMaterial
            color={item.color}
            emissive={item.color}
            emissiveIntensity={item.metal ? 0.85 : 1.35}
            roughness={item.metal ? 0.18 : 0.22}
            metalness={item.metal ? 0.9 : 0.35}
            toneMapped={false}
          />
        </mesh>
      ))}
    </group>
  )
}
