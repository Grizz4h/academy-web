import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef, type ReactNode } from 'react'
import * as THREE from 'three'

/**
 * Asset: Zamboni RT-81
 *
 * Must have: cab left-front, tall flat fascia, boxy tank, rear conditioner, brushes.
 * Style: 80% real ice-resurfacer silhouette / 20% RINK Tank (cyan + magenta).
 * Never: cartoon, toy, generic sci-fi vehicle.
 *
 * +Z = travel direction (front). −Z = conditioner.
 */
export const ZAMBONI_COLORS = {
  body: '#1A1A1B',
  deep: '#0B0F15',
  shadow: '#050505',
  metal: '#7C7F8B',
  silver: '#C1C7D3',
  cyan: '#00E5FF',
  magenta: '#FF007A',
  ice: '#E6F6FF',
  amber: '#FF8A1F',
  rubber: '#111111',
  glass: '#081820',
}

const WHEEL_R = 0.2

function makeCanvasTexture(
  width: number,
  height: number,
  paint: (ctx: CanvasRenderingContext2D, w: number, h: number) => void,
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  paint(canvas.getContext('2d')!, width, height)
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 8
  texture.needsUpdate = true
  return texture
}

function useBrandTextures() {
  const textures = useMemo(() => {
    const plate = makeCanvasTexture(512, 128, (ctx, w, h) => {
      ctx.fillStyle = ZAMBONI_COLORS.magenta
      ctx.fillRect(0, 0, w, h)
      ctx.fillStyle = '#0B0F15'
      ctx.font = `800 ${Math.round(h * 0.42)}px "Trebuchet MS","Segoe UI",sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('RINK TANK', w / 2, h / 2 + 2)
    })
    const sideR = makeCanvasTexture(256, 256, (ctx, w, h) => {
      ctx.clearRect(0, 0, w, h)
      ctx.fillStyle = ZAMBONI_COLORS.magenta
      ctx.font = `900 ${Math.round(h * 0.78)}px "Trebuchet MS","Segoe UI",sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('R', w / 2, h / 2 + 10)
    })
    const serial = makeCanvasTexture(256, 64, (ctx, w, h) => {
      ctx.clearRect(0, 0, w, h)
      ctx.fillStyle = ZAMBONI_COLORS.cyan
      ctx.font = `700 ${Math.round(h * 0.52)}px "Trebuchet MS","Segoe UI",sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('RT-81', w / 2, h / 2)
    })
    return { plate, sideR, serial }
  }, [])

  useEffect(() => () => {
    textures.plate.dispose()
    textures.sideR.dispose()
    textures.serial.dispose()
  }, [textures])

  return textures
}

function Metal({
  color = ZAMBONI_COLORS.body,
  roughness = 0.4,
  metalness = 0.7,
  emissive,
  emissiveIntensity = 0,
}: {
  color?: string
  roughness?: number
  metalness?: number
  emissive?: string
  emissiveIntensity?: number
}) {
  return (
    <meshStandardMaterial
      color={color}
      roughness={roughness}
      metalness={metalness}
      emissive={emissive || '#000000'}
      emissiveIntensity={emissiveIntensity}
    />
  )
}

function Wheel({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[WHEEL_R, WHEEL_R, 0.15, 20]} />
        <Metal color={ZAMBONI_COLORS.rubber} roughness={0.88} metalness={0.04} />
      </mesh>
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[WHEEL_R * 0.58, WHEEL_R * 0.58, 0.17, 16]} />
        <Metal color={ZAMBONI_COLORS.metal} roughness={0.28} metalness={0.84} />
      </mesh>
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <torusGeometry args={[WHEEL_R * 0.76, 0.016, 8, 24]} />
        <meshStandardMaterial
          color={ZAMBONI_COLORS.cyan}
          emissive={ZAMBONI_COLORS.cyan}
          emissiveIntensity={0.65}
          roughness={0.25}
          metalness={0.2}
        />
      </mesh>
    </group>
  )
}

function SpinningBrush({ position }: { position: [number, number, number] }) {
  const ref = useRef<THREE.Group>(null)
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.y += dt * 2.8
  })
  return (
    <group ref={ref} position={position}>
      <mesh>
        <cylinderGeometry args={[0.17, 0.17, 0.05, 24]} />
        <meshStandardMaterial
          color={ZAMBONI_COLORS.deep}
          emissive={ZAMBONI_COLORS.cyan}
          emissiveIntensity={0.7}
          roughness={0.35}
          metalness={0.35}
        />
      </mesh>
      <mesh position={[0, 0.02, 0]}>
        <torusGeometry args={[0.12, 0.012, 8, 20]} />
        <meshStandardMaterial
          color={ZAMBONI_COLORS.cyan}
          emissive={ZAMBONI_COLORS.cyan}
          emissiveIntensity={0.85}
          roughness={0.3}
        />
      </mesh>
    </group>
  )
}

function Beacon() {
  const ref = useRef<THREE.Group>(null)
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.y += dt * 1.8
  })
  return (
    <group ref={ref} position={[-0.24, 1.4, 1.08]}>
      <mesh>
        <cylinderGeometry args={[0.028, 0.038, 0.055, 10]} />
        <Metal color={ZAMBONI_COLORS.metal} />
      </mesh>
      <mesh position={[0, 0.065, 0]}>
        <sphereGeometry args={[0.042, 12, 10]} />
        <meshStandardMaterial
          color={ZAMBONI_COLORS.amber}
          emissive={ZAMBONI_COLORS.amber}
          emissiveIntensity={1.15}
          roughness={0.25}
        />
      </mesh>
      <pointLight color={ZAMBONI_COLORS.amber} intensity={0.32} distance={2.2} />
    </group>
  )
}

function GlowStrip({
  children,
  color = ZAMBONI_COLORS.cyan,
  base = 0.55,
  amp = 0.16,
}: {
  children?: ReactNode
  color?: string
  base?: number
  amp?: number
}) {
  const ref = useRef<THREE.MeshStandardMaterial>(null)
  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.emissiveIntensity = base + Math.sin(clock.elapsedTime * 2.1) * amp
    }
  })
  return (
    <meshStandardMaterial
      ref={ref}
      color={color}
      emissive={color}
      emissiveIntensity={base}
      roughness={0.22}
      metalness={0.18}
    >
      {children}
    </meshStandardMaterial>
  )
}

export function ProceduralZamboni() {
  const textures = useBrandTextures()

  return (
    <group dispose={null}>
      <Wheel position={[-0.46, WHEEL_R, 0.88]} />
      <Wheel position={[0.46, WHEEL_R, 0.88]} />
      <Wheel position={[-0.46, WHEEL_R, -0.56]} />
      <Wheel position={[0.46, WHEEL_R, -0.56]} />

      {/* Chassis — low slab the rest sits on */}
      <mesh position={[0, 0.32, 0.06]} castShadow receiveShadow>
        <boxGeometry args={[1.14, 0.14, 2.32]} />
        <Metal color={ZAMBONI_COLORS.deep} roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.42, 0.08]}>
        <boxGeometry args={[1.08, 0.08, 2.18]} />
        <Metal color={ZAMBONI_COLORS.shadow} roughness={0.55} />
      </mesh>

      {/* Water / snow tank — the volume that makes it a resurfacer */}
      <mesh position={[0, 0.88, -0.22]} castShadow>
        <boxGeometry args={[1.14, 0.86, 1.5]} />
        <Metal />
      </mesh>
      <mesh position={[0, 1.28, -0.22]}>
        <boxGeometry args={[1.06, 0.06, 1.38]} />
        <Metal color={ZAMBONI_COLORS.deep} roughness={0.52} />
      </mesh>
      {[-0.52, -0.12, 0.28].map((z) => (
        <mesh key={z} position={[0, 1.33, z]}>
          <boxGeometry args={[0.4, 0.045, 0.2]} />
          <Metal color={ZAMBONI_COLORS.metal} roughness={0.28} metalness={0.88} />
        </mesh>
      ))}
      {/* Horizontal panel seam */}
      <mesh position={[0.571, 0.88, -0.22]}>
        <boxGeometry args={[0.012, 0.02, 1.42]} />
        <Metal color={ZAMBONI_COLORS.metal} roughness={0.3} />
      </mesh>

      {/* Cab — left-front greenhouse, NOT full-width (that's a van) */}
      <mesh position={[-0.24, 1.02, 1.1]} castShadow>
        <boxGeometry args={[0.62, 0.66, 0.68]} />
        <Metal />
      </mesh>
      <mesh position={[-0.24, 1.12, 1.42]} rotation={[-0.2, 0, 0]}>
        <boxGeometry args={[0.54, 0.38, 0.035]} />
        <meshStandardMaterial
          color={ZAMBONI_COLORS.glass}
          roughness={0.08}
          metalness={0.62}
          transparent
          opacity={0.4}
          emissive={ZAMBONI_COLORS.cyan}
          emissiveIntensity={0.1}
        />
      </mesh>
      <mesh position={[-0.545, 1.08, 1.1]}>
        <boxGeometry args={[0.03, 0.3, 0.48]} />
        <meshStandardMaterial color={ZAMBONI_COLORS.glass} transparent opacity={0.36} roughness={0.1} metalness={0.55} />
      </mesh>
      <mesh position={[0.055, 1.08, 1.1]}>
        <boxGeometry args={[0.03, 0.3, 0.42]} />
        <meshStandardMaterial color={ZAMBONI_COLORS.glass} transparent opacity={0.32} roughness={0.1} metalness={0.55} />
      </mesh>
      <mesh position={[-0.32, 0.78, 1.12]}>
        <boxGeometry args={[0.2, 0.1, 0.2]} />
        <Metal color={ZAMBONI_COLORS.deep} roughness={0.72} metalness={0.08} />
      </mesh>
      <mesh position={[-0.32, 0.9, 1.26]} rotation={[0.55, 0, 0]}>
        <torusGeometry args={[0.075, 0.012, 8, 16]} />
        <Metal color={ZAMBONI_COLORS.silver} metalness={0.72} roughness={0.28} />
      </mesh>
      <Beacon />

      {/* Front-right dump / bin — the other half of a real resurfacer nose */}
      <mesh position={[0.28, 0.78, 1.12]} castShadow>
        <boxGeometry args={[0.56, 0.58, 0.64]} />
        <Metal color={ZAMBONI_COLORS.deep} />
      </mesh>
      <mesh position={[0.28, 1.04, 1.12]}>
        <boxGeometry args={[0.48, 0.04, 0.52]} />
        <Metal color={ZAMBONI_COLORS.metal} roughness={0.32} metalness={0.8} />
      </mesh>

      {/* Tall flat fascia */}
      <mesh position={[0, 0.7, 1.46]} castShadow>
        <boxGeometry args={[1.16, 0.74, 0.1]} />
        <Metal color={ZAMBONI_COLORS.deep} />
      </mesh>
      {[
        [-0.38, 0.92],
        [0.38, 0.92],
        [-0.38, 0.56],
        [0.38, 0.56],
      ].map(([x, y]) => (
        <group key={`${x}-${y}`} position={[x, y, 1.52]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.068, 0.068, 0.03, 14]} />
            <Metal color={ZAMBONI_COLORS.shadow} roughness={0.45} />
          </mesh>
          <mesh position={[0, 0, 0.012]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.048, 0.048, 0.02, 14]} />
            <meshStandardMaterial
              color={ZAMBONI_COLORS.ice}
              emissive={ZAMBONI_COLORS.cyan}
              emissiveIntensity={1.2}
              roughness={0.16}
            />
          </mesh>
        </group>
      ))}
      <mesh position={[0, 0.72, 1.515]}>
        <planeGeometry args={[0.64, 0.13]} />
        <meshStandardMaterial
          map={textures.plate}
          emissive={ZAMBONI_COLORS.magenta}
          emissiveIntensity={0.58}
          roughness={0.32}
          metalness={0.18}
        />
      </mesh>

      {/* Rear conditioner — lower, wider sled with blade + cloth */}
      <mesh position={[0, 0.3, -1.22]} castShadow>
        <boxGeometry args={[1.32, 0.28, 0.56]} />
        <Metal color={ZAMBONI_COLORS.deep} roughness={0.44} />
      </mesh>
      <mesh position={[0, 0.18, -1.36]}>
        <boxGeometry args={[1.28, 0.055, 0.22]} />
        <Metal color={ZAMBONI_COLORS.metal} />
      </mesh>
      <mesh position={[0, 0.155, -1.5]}>
        <boxGeometry args={[1.26, 0.04, 0.07]} />
        <Metal color={ZAMBONI_COLORS.silver} metalness={0.92} roughness={0.18} />
      </mesh>
      <mesh position={[0, 0.175, -1.54]}>
        <boxGeometry args={[1.22, 0.018, 0.04]} />
        <GlowStrip />
      </mesh>
      <mesh position={[0, 0.12, -1.42]}>
        <boxGeometry args={[1.2, 0.012, 0.16]} />
        <meshStandardMaterial color="#9aa8b8" roughness={0.55} metalness={0.25} transparent opacity={0.55} />
      </mesh>
      {[-0.28, 0.28].map((x) => (
        <mesh key={x} position={[x, 0.52, -1.12]} rotation={[0.42, 0, 0]}>
          <cylinderGeometry args={[0.028, 0.028, 0.4, 8]} />
          <Metal color={ZAMBONI_COLORS.metal} metalness={0.88} roughness={0.22} />
        </mesh>
      ))}

      {/* Side conveyor — snow from conditioner into the tank */}
      <mesh position={[0.5, 0.58, -0.58]} rotation={[0.48, 0, 0]} castShadow>
        <boxGeometry args={[0.18, 0.14, 1.02]} />
        <Metal color={ZAMBONI_COLORS.deep} roughness={0.42} />
      </mesh>
      <mesh position={[0.5, 0.58, -0.58]} rotation={[0.48, 0, 0]}>
        <boxGeometry args={[0.04, 0.04, 0.9]} />
        <meshStandardMaterial
          color={ZAMBONI_COLORS.cyan}
          emissive={ZAMBONI_COLORS.cyan}
          emissiveIntensity={0.45}
          roughness={0.28}
        />
      </mesh>

      <SpinningBrush position={[-0.58, 0.085, 0.16]} />
      <SpinningBrush position={[0.58, 0.085, 0.16]} />

      {/* Magenta pinstripe + branding */}
      <mesh position={[0.571, 1.22, -0.22]}>
        <boxGeometry args={[0.012, 0.018, 1.42]} />
        <meshStandardMaterial
          color={ZAMBONI_COLORS.magenta}
          emissive={ZAMBONI_COLORS.magenta}
          emissiveIntensity={0.7}
          roughness={0.28}
        />
      </mesh>
      <mesh position={[-0.571, 1.22, -0.22]}>
        <boxGeometry args={[0.012, 0.018, 1.42]} />
        <meshStandardMaterial
          color={ZAMBONI_COLORS.magenta}
          emissive={ZAMBONI_COLORS.magenta}
          emissiveIntensity={0.7}
          roughness={0.28}
        />
      </mesh>
      <mesh position={[0.572, 0.92, -0.18]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[0.4, 0.4]} />
        <meshStandardMaterial
          map={textures.sideR}
          transparent
          depthWrite={false}
          emissive={ZAMBONI_COLORS.magenta}
          emissiveIntensity={0.38}
        />
      </mesh>
      <mesh position={[-0.572, 0.92, -0.18]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[0.4, 0.4]} />
        <meshStandardMaterial
          map={textures.sideR}
          transparent
          depthWrite={false}
          emissive={ZAMBONI_COLORS.magenta}
          emissiveIntensity={0.38}
        />
      </mesh>
      <mesh position={[0, 0.92, -0.972]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[0.34, 0.34]} />
        <meshStandardMaterial
          map={textures.sideR}
          transparent
          depthWrite={false}
          emissive={ZAMBONI_COLORS.magenta}
          emissiveIntensity={0.32}
        />
      </mesh>
      <mesh position={[0.572, 0.64, 0.22]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[0.34, 0.085]} />
        <meshStandardMaterial
          map={textures.serial}
          transparent
          depthWrite={false}
          emissive={ZAMBONI_COLORS.cyan}
          emissiveIntensity={0.42}
        />
      </mesh>

      {/* Holographic tank window — 20% future layer */}
      <mesh position={[0.571, 0.78, -0.55]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[0.62, 0.26]} />
        <meshStandardMaterial
          color={ZAMBONI_COLORS.cyan}
          emissive={ZAMBONI_COLORS.cyan}
          emissiveIntensity={0.2}
          transparent
          opacity={0.2}
          roughness={0.12}
          metalness={0.42}
        />
      </mesh>

      <mesh position={[0, 0.035, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[1.02, 2.05]} />
        <meshStandardMaterial
          color={ZAMBONI_COLORS.cyan}
          emissive={ZAMBONI_COLORS.cyan}
          emissiveIntensity={0.32}
          transparent
          opacity={0.26}
          depthWrite={false}
        />
      </mesh>
      <pointLight position={[0, 0.18, -1.38]} color={ZAMBONI_COLORS.cyan} intensity={1.05} distance={3} />
      <pointLight position={[0, 0.55, 1.58]} color={ZAMBONI_COLORS.magenta} intensity={0.5} distance={2.5} />
      <pointLight position={[0, 0.1, 0.18]} color={ZAMBONI_COLORS.cyan} intensity={0.4} distance={2.3} />
    </group>
  )
}
