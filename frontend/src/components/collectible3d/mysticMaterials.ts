import * as THREE from 'three'
import type { MaskPartRole } from './maskPartMapping'
import { DEBUG_MESH_COLORS, ROLE_COLORS } from './maskPartMapping'
import type { CollectibleRarity, RarityPreset } from './rarityPresets'

/** Cold energy — primary Mystic identity. */
export const MYSTIC_CYAN = '#00E8FF'
/** Sparse prestige accent — never the dominant field color. */
export const MYSTIC_MAGENTA = '#FF1A6B'
export const MYSTIC_VIOLET = '#6B3CFF'
/** Void carbon — artefact base, not plastic black. */
export const MYSTIC_NAVY = '#05070D'
export const MYSTIC_CARBON = '#0A0E16'
export const MYSTIC_GUNMETAL = '#1C242E'
export const MYSTIC_TITANIUM = '#A8B4C4'

export type MysticMaterialTier = 'legendary' | 'mystic'

function pulseable(material: THREE.Material, base: number, amp: number): THREE.Material {
  material.userData.pulse = { base, amp }
  return material
}

/** Thin energy-edge fresnel — reads as engraved power lines under rotation. */
function attachEnergyEdge(
  material: THREE.MeshPhysicalMaterial | THREE.MeshStandardMaterial,
  opts: { color: THREE.Color; power: number; strength: number; pulseBase: number; pulseAmp: number },
) {
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uPulse = { value: 1 }
    shader.uniforms.uEdgeStrength = { value: opts.strength }
    shader.uniforms.uEdgePower = { value: opts.power }
    shader.uniforms.uEdgeColor = { value: opts.color }
    material.userData.shader = shader
    material.userData.pulse = { base: opts.pulseBase, amp: opts.pulseAmp }
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
        uniform float uPulse;
        uniform float uEdgeStrength;
        uniform float uEdgePower;
        uniform vec3 uEdgeColor;`,
      )
      .replace(
        '#include <emissivemap_fragment>',
        `#include <emissivemap_fragment>
        float edge = pow(1.0 - abs(dot(normalize(vViewPosition), normal)), uEdgePower);
        totalEmissiveRadiance += uEdgeColor * edge * uEdgeStrength * uPulse;`,
      )
  }
  material.needsUpdate = true
}

/**
 * Role materials for the prestige mask.
 * Legendary = iconic collector shell.
 * Mystic = same silhouette, but cold artefact metals + stronger energy identity.
 */
export function createMysticRoleMaterials(
  tier: MysticMaterialTier = 'mystic',
): Record<MaskPartRole, THREE.Material> {
  const mystic = tier === 'mystic'
  const shellIridescence = mystic ? 1 : 0.55
  const shellClearcoat = mystic ? 1 : 0.72
  const cageEmissive = mystic ? 0.62 : 0.28
  const edgeStrength = mystic ? 1.55 : 0.75

  const frontShell = new THREE.MeshPhysicalMaterial({
    color: mystic ? MYSTIC_NAVY : '#0c121c',
    metalness: mystic ? 0.94 : 0.82,
    roughness: mystic ? 0.14 : 0.22,
    clearcoat: shellClearcoat,
    clearcoatRoughness: mystic ? 0.06 : 0.14,
    iridescence: shellIridescence,
    iridescenceIOR: mystic ? 2.05 : 1.7,
    iridescenceThicknessRange: mystic ? [80, 380] : [140, 480],
    sheen: mystic ? 0.55 : 0.28,
    sheenColor: new THREE.Color(mystic ? MYSTIC_CYAN : MYSTIC_VIOLET),
    sheenRoughness: 0.35,
    envMapIntensity: mystic ? 1.45 : 1.1,
    emissive: new THREE.Color(mystic ? '#001018' : '#050810'),
    emissiveIntensity: mystic ? 0.12 : 0.04,
    vertexColors: false,
  })
  attachEnergyEdge(frontShell, {
    color: new THREE.Color(MYSTIC_CYAN),
    power: mystic ? 2.6 : 3.2,
    strength: edgeStrength,
    pulseBase: mystic ? 0.85 : 0.55,
    pulseAmp: mystic ? 0.22 : 0.1,
  })

  const cage = new THREE.MeshPhysicalMaterial({
    color: mystic ? '#141A22' : '#2a3038',
    metalness: 1,
    roughness: mystic ? 0.1 : 0.16,
    clearcoat: mystic ? 0.85 : 0.5,
    clearcoatRoughness: 0.12,
    emissive: new THREE.Color(MYSTIC_CYAN),
    emissiveIntensity: cageEmissive,
    envMapIntensity: mystic ? 1.5 : 1.2,
    vertexColors: false,
  })
  pulseable(cage, mystic ? 0.52 : 0.3, mystic ? 0.2 : 0.1)
  attachEnergyEdge(cage, {
    color: new THREE.Color(mystic ? '#7CF7FF' : MYSTIC_CYAN),
    power: 2.2,
    strength: mystic ? 1.9 : 0.9,
    pulseBase: mystic ? 0.95 : 0.55,
    pulseAmp: mystic ? 0.25 : 0.1,
  })

  const backplate = new THREE.MeshPhysicalMaterial({
    color: mystic ? MYSTIC_CARBON : '#0c1018',
    metalness: mystic ? 0.62 : 0.5,
    roughness: mystic ? 0.42 : 0.4,
    sheen: mystic ? 0.85 : 0.55,
    sheenColor: new THREE.Color(mystic ? MYSTIC_MAGENTA : '#5a2040'),
    sheenRoughness: 0.55,
    emissive: new THREE.Color(mystic ? '#1a0610' : '#12050c'),
    emissiveIntensity: mystic ? 0.22 : 0.12,
    envMapIntensity: mystic ? 1.05 : 0.85,
    vertexColors: false,
  })
  pulseable(backplate, mystic ? 0.2 : 0.12, mystic ? 0.08 : 0.05)

  const straps = new THREE.MeshPhysicalMaterial({
    color: '#0E1014',
    metalness: mystic ? 0.22 : 0.1,
    roughness: mystic ? 0.64 : 0.74,
    sheen: mystic ? 0.55 : 0.3,
    sheenColor: new THREE.Color(MYSTIC_CYAN),
    emissive: new THREE.Color(MYSTIC_CYAN),
    emissiveIntensity: mystic ? 0.14 : 0.06,
    vertexColors: false,
  })
  attachEnergyEdge(straps, {
    color: new THREE.Color(MYSTIC_CYAN),
    power: 3.4,
    strength: mystic ? 1.1 : 0.45,
    pulseBase: mystic ? 0.75 : 0.5,
    pulseAmp: mystic ? 0.16 : 0.08,
  })

  const padding = new THREE.MeshStandardMaterial({
    color: mystic ? '#12141C' : '#1a1522',
    metalness: 0.06,
    roughness: mystic ? 0.88 : 0.84,
    emissive: new THREE.Color(mystic ? '#08060c' : '#140818'),
    emissiveIntensity: mystic ? 0.04 : 0.05,
    vertexColors: false,
  })

  const hardware = new THREE.MeshPhysicalMaterial({
    color: mystic ? MYSTIC_TITANIUM : '#c9a227',
    metalness: 1,
    roughness: mystic ? 0.16 : 0.2,
    clearcoat: mystic ? 0.65 : 0.35,
    clearcoatRoughness: 0.18,
    emissive: new THREE.Color(mystic ? '#102028' : '#3d2a00'),
    emissiveIntensity: mystic ? 0.18 : 0.16,
    envMapIntensity: mystic ? 1.35 : 1.1,
    vertexColors: false,
  })
  pulseable(hardware, mystic ? 0.16 : 0.12, mystic ? 0.07 : 0.05)

  const otherParts = new THREE.MeshPhysicalMaterial({
    color: mystic ? MYSTIC_GUNMETAL : '#161b22',
    metalness: mystic ? 0.82 : 0.68,
    roughness: mystic ? 0.26 : 0.34,
    clearcoat: mystic ? 0.55 : 0.35,
    clearcoatRoughness: 0.22,
    iridescence: mystic ? 0.35 : 0,
    iridescenceIOR: 1.6,
    iridescenceThicknessRange: [100, 280],
    envMapIntensity: mystic ? 1.05 : 0.8,
    emissive: new THREE.Color(mystic ? '#041018' : '#000000'),
    emissiveIntensity: mystic ? 0.08 : 0,
    vertexColors: false,
  })

  return { frontShell, cage, backplate, straps, padding, hardware, otherParts }
}

export function mysticTierForPreset(preset: RarityPreset): MysticMaterialTier {
  return preset.id === 'mystic' ? 'mystic' : 'legendary'
}

export function createDebugMeshMaterial(index: number): THREE.MeshStandardMaterial {
  const color = DEBUG_MESH_COLORS[index % DEBUG_MESH_COLORS.length]
  return new THREE.MeshStandardMaterial({
    color,
    roughness: 0.45,
    metalness: 0.15,
    vertexColors: false,
    emissive: color,
    emissiveIntensity: 0.18,
  })
}

export function createDebugRoleMaterial(role: MaskPartRole): THREE.MeshStandardMaterial {
  const color = ROLE_COLORS[role]
  return new THREE.MeshStandardMaterial({
    color,
    roughness: 0.4,
    metalness: 0.2,
    vertexColors: false,
    emissive: color,
    emissiveIntensity: 0.22,
  })
}

export function pulseMysticMaterial(material: THREE.Material, elapsed: number): void {
  const pulse = material.userData?.pulse as { base: number; amp: number } | undefined
  const shader = material.userData?.shader as { uniforms: Record<string, { value: number }> } | undefined
  const wave = pulse
    ? pulse.base + Math.sin(elapsed * 1.05) * pulse.amp
    : 0.7 + Math.sin(elapsed * 1.05) * 0.16
  if (shader?.uniforms?.uPulse) shader.uniforms.uPulse.value = wave
  if (
    pulse
    && (material instanceof THREE.MeshPhysicalMaterial || material instanceof THREE.MeshStandardMaterial)
    && !shader?.uniforms?.uPulse
  ) {
    material.emissiveIntensity = wave
  }
}

export function materialForPreset(preset: RarityPreset): THREE.Material {
  if (preset.shellMaterial === 'base') {
    return new THREE.MeshStandardMaterial({
      color: '#9aa3ad',
      roughness: 0.58,
      metalness: 0.18,
      vertexColors: false,
    })
  }
  const mystic = createMysticRoleMaterials(mysticTierForPreset(preset))
  if (preset.shellMaterial === 'accent') return mystic.hardware
  return mystic.frontShell
}

/** @deprecated Prefer mysticTierForPreset + createMysticRoleMaterials */
export function resolveMaterialTier(_rarity?: CollectibleRarity): MysticMaterialTier {
  return _rarity === 'mystic' ? 'mystic' : 'legendary'
}
