import { MysticHalo } from './MysticHalo'
import { MysticParticles, MysticShards } from './MysticParticles'
import type { ModelInspectSummary } from './inspectModel'

/**
 * Add-ons only. No extra cage geometry — the split GLB already has a cage mesh.
 * Everything is parented to the mask bounds, not world-placed.
 */
export function GoalieMaskMysticEnhancements({
  bounds,
  halo,
  shards,
  particles,
}: {
  bounds: ModelInspectSummary['bounds'] | null
  halo: boolean
  shards: boolean
  particles: boolean
}) {
  if (!bounds) return null
  const scale = Math.max(bounds.radius / 0.75, 0.04)

  return (
    <group name="MysticFX" position={bounds.center} scale={scale}>
      {halo && (
        <group name="MysticHalo">
          <MysticHalo />
        </group>
      )}
      {shards && <MysticShards />}
      {particles && (
        <group name="MysticParticles">
          <MysticParticles />
        </group>
      )}
    </group>
  )
}
