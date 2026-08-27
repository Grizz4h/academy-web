import type { CosmeticDefinition } from '../types'

export type StickSkinMaterial = {
  shaftColor: string
  bladeColor: string
  gripColor: string
  accentColor: string
  roughness: number
  metalness: number
  bladeRoughness?: number
  bladeMetalness?: number
  emissive?: string
  emissiveIntensity?: number
}

export type StickSkinDefinition = {
  id: string
  cosmeticId: string
  name: string
  material: StickSkinMaterial
}

export const STICK_MODEL_COMPOSITE_ID = 'stick_model_composite_poc'

export const STICK_SKINS: StickSkinDefinition[] = [
  {
    id: 'composite',
    cosmeticId: 'stick_skin_composite',
    name: 'Composite',
    material: {
      shaftColor: '#1c222c',
      bladeColor: '#11151c',
      gripColor: '#0d0f14',
      accentColor: '#5ec4d4',
      roughness: 0.48,
      metalness: 0.28,
      bladeRoughness: 0.55,
      bladeMetalness: 0.12,
    },
  },
  {
    id: 'black_ice',
    cosmeticId: 'stick_skin_black_ice_poc',
    name: 'Black Ice',
    material: {
      shaftColor: '#15232e',
      bladeColor: '#0f1a22',
      gripColor: '#0a1218',
      accentColor: '#7dd3fc',
      roughness: 0.38,
      metalness: 0.42,
      bladeRoughness: 0.42,
      bladeMetalness: 0.25,
      emissive: '#2a6f8a',
      emissiveIntensity: 0.1,
    },
  },
  {
    id: 'gold',
    cosmeticId: 'stick_skin_gold',
    name: 'Gold',
    material: {
      shaftColor: '#c9a44a',
      bladeColor: '#a8842e',
      gripColor: '#5c4010',
      accentColor: '#fff0c0',
      roughness: 0.26,
      metalness: 0.88,
      bladeRoughness: 0.3,
      bladeMetalness: 0.82,
      emissive: '#7a5a18',
      emissiveIntensity: 0.1,
    },
  },
]

export const STICK_SKIN_BY_ID = Object.fromEntries(STICK_SKINS.map((s) => [s.id, s])) as Record<
  string,
  StickSkinDefinition
>

export const STICK_POC_COSMETICS: CosmeticDefinition[] = [
  {
    id: STICK_MODEL_COMPOSITE_ID,
    type: 'stickModel',
    name: 'Composite Stick',
    description: 'Procedural 3D stick model (PoC).',
    rarity: 'common',
    origin: { type: 'pux_shop' },
    visibility: 'visible',
    metadata: { poc3d: true, geometry: 'procedural_stick', deferred_cluster_2: true },
  },
  {
    id: 'stick_skin_composite',
    type: 'stickSkin',
    name: 'Composite',
    flavorText: 'Matte carbon. Clean release.',
    rarity: 'common',
    origin: { type: 'pux_shop' },
    visibility: 'visible',
    metadata: {
      poc3d: true,
      skinId: 'composite',
      deferred_cluster_2: true,
      compatibleModelIds: [STICK_MODEL_COMPOSITE_ID, 'stick_model_composite_01'],
    },
  },
  {
    id: 'stick_skin_black_ice_poc',
    type: 'stickSkin',
    name: 'Black Ice PoC',
    flavorText: 'Looks fast even when paused.',
    rarity: 'epic',
    origin: { type: 'pux_shop' },
    visibility: 'silhouette',
    metadata: {
      poc3d: true,
      skinId: 'black_ice',
      compatibleModelIds: [STICK_MODEL_COMPOSITE_ID, 'stick_model_composite_01'],
      previewOnly: true,
    },
  },
  {
    id: 'stick_skin_gold',
    type: 'stickSkin',
    name: 'Gold Stick',
    flavorText: 'Cup final energy.',
    rarity: 'legendary',
    origin: { type: 'pux_shop' },
    visibility: 'silhouette',
    metadata: {
      poc3d: true,
      skinId: 'gold',
      compatibleModelIds: [STICK_MODEL_COMPOSITE_ID, 'stick_model_composite_01'],
      previewOnly: true,
    },
  },
]
