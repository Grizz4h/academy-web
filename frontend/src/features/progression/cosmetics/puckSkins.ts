import type { CosmeticDefinition } from '../types'

/** Material look for the procedural 3D puck (PoC). */
export type PuckSkinMaterial = {
  baseColor: string
  roughness: number
  metalness: number
  emissive?: string
  emissiveIntensity?: number
  /** Top-face brand mark tint */
  markColor?: string
  markOpacity?: number
}

export type PuckSkinDefinition = {
  id: string
  cosmeticId: string
  name: string
  material: PuckSkinMaterial
}

/** Shared geometry id for the procedural classic puck model. */
export const PUCK_MODEL_CLASSIC_ID = 'puck_model_classic'

export const PUCK_SKINS: PuckSkinDefinition[] = [
  {
    id: 'classic',
    cosmeticId: 'puck_skin_classic',
    name: 'Classic',
    material: {
      baseColor: '#2a2d32',
      roughness: 0.72,
      metalness: 0.08,
      markColor: '#eef5fa',
      markOpacity: 0.9,
    },
  },
  {
    id: 'frozen',
    cosmeticId: 'puck_skin_frozen',
    name: 'Frozen',
    material: {
      baseColor: '#2a4554',
      roughness: 0.45,
      metalness: 0.22,
      emissive: '#4f9bb8',
      emissiveIntensity: 0.16,
      markColor: '#d8f4ff',
      markOpacity: 0.95,
    },
  },
  {
    id: 'gold',
    cosmeticId: 'puck_skin_gold',
    name: 'Gold',
    material: {
      baseColor: '#c9a44a',
      roughness: 0.28,
      metalness: 0.9,
      emissive: '#7a5a18',
      emissiveIntensity: 0.12,
      markColor: '#fff8e0',
      markOpacity: 0.95,
    },
  },
]

export const PUCK_SKIN_BY_ID = Object.fromEntries(PUCK_SKINS.map((s) => [s.id, s])) as Record<
  string,
  PuckSkinDefinition
>

export const PUCK_SKIN_BY_COSMETIC_ID = Object.fromEntries(
  PUCK_SKINS.map((s) => [s.cosmeticId, s]),
) as Record<string, PuckSkinDefinition>

/** Catalog entries for the 3D PoC — no achievement unlocks. */
export const PUCK_POC_COSMETICS: CosmeticDefinition[] = [
  {
    id: PUCK_MODEL_CLASSIC_ID,
    type: 'puckModel',
    name: 'Classic Puck',
    description: 'Procedural 3D puck model (PoC).',
    rarity: 'common',
    origin: { type: 'pux_shop' },
    visibility: 'visible',
    metadata: { poc3d: true, geometry: 'procedural_cylinder', deferred_cluster_2: true },
  },
  {
    id: 'puck_skin_classic',
    type: 'puckSkin',
    name: 'Classic',
    flavorText: 'Matte rubber. No drama.',
    rarity: 'common',
    origin: { type: 'pux_shop' },
    visibility: 'visible',
    metadata: {
      poc3d: true,
      skinId: 'classic',
      deferred_cluster_2: true,
      compatibleModelIds: [PUCK_MODEL_CLASSIC_ID, 'puck_model_standard_01'],
    },
  },
  {
    id: 'puck_skin_frozen',
    type: 'puckSkin',
    name: 'Frozen',
    flavorText: 'Cold read. Cold look.',
    rarity: 'rare',
    origin: { type: 'pux_shop' },
    visibility: 'silhouette',
    metadata: {
      poc3d: true,
      skinId: 'frozen',
      compatibleModelIds: [PUCK_MODEL_CLASSIC_ID, 'puck_model_standard_01'],
      previewOnly: true,
    },
  },
  {
    id: 'puck_skin_gold',
    type: 'puckSkin',
    name: 'Gold',
    flavorText: 'Trophy shelf energy.',
    rarity: 'epic',
    origin: { type: 'pux_shop' },
    visibility: 'silhouette',
    metadata: {
      poc3d: true,
      skinId: 'gold',
      compatibleModelIds: [PUCK_MODEL_CLASSIC_ID, 'puck_model_standard_01'],
      previewOnly: true,
    },
  },
]
