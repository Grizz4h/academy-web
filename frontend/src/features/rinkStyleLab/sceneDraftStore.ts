/**
 * Lab-only scene drafts in localStorage — never writes curriculum JSON.
 */

import type { FoundationRinkRegionId } from '../foundation/types'
import { sanitizeMarkerEditsForSave } from './sceneDraftBuild.ts'
import type { SceneDraftDocument, SceneDraftStoreFile, SceneMarkerEdit } from './sceneDraftTypes.ts'
import { clampPlayerScale } from './globalPlayerDisplay.ts'

export { clampPlayerScale }

export const SCENE_DRAFT_STORAGE_KEY = 'rink-style-lab:scene-drafts:v1'

function emptyStore(): SceneDraftStoreFile {
  return { version: 1, scenes: {} }
}

export function parseSceneDraftStore(raw: string | null): SceneDraftStoreFile {
  if (!raw) return emptyStore()
  try {
    const parsed = JSON.parse(raw) as SceneDraftStoreFile
    if (!parsed || parsed.version !== 1 || typeof parsed.scenes !== 'object') {
      return emptyStore()
    }
    return { version: 1, scenes: parsed.scenes || {} }
  } catch {
    return emptyStore()
  }
}

export function readSceneDraftStore(
  storage: Pick<Storage, 'getItem'> = localStorage,
): SceneDraftStoreFile {
  try {
    return parseSceneDraftStore(storage.getItem(SCENE_DRAFT_STORAGE_KEY))
  } catch {
    return emptyStore()
  }
}

export function writeSceneDraftStore(
  store: SceneDraftStoreFile,
  storage: Pick<Storage, 'setItem'> = localStorage,
): void {
  storage.setItem(SCENE_DRAFT_STORAGE_KEY, JSON.stringify(store))
}

export function loadSceneDraft(
  sceneId: string,
  storage: Pick<Storage, 'getItem'> = localStorage,
): SceneDraftDocument | null {
  const doc = readSceneDraftStore(storage).scenes[sceneId]
  return doc?.sceneId === sceneId ? doc : null
}

export function saveSceneDraft(
  sceneId: string,
  markers: Partial<Record<FoundationRinkRegionId, SceneMarkerEdit>>,
  storage: Pick<Storage, 'getItem' | 'setItem'> = localStorage,
): SceneDraftDocument {
  const store = readSceneDraftStore(storage)
  const doc: SceneDraftDocument = {
    version: 1,
    sceneId,
    updatedAt: new Date().toISOString(),
    markers: sanitizeMarkerEditsForSave(markers),
  }
  store.scenes[sceneId] = doc
  writeSceneDraftStore(store, storage)
  return doc
}

export function clearSceneDraft(
  sceneId: string,
  storage: Pick<Storage, 'getItem' | 'setItem'> = localStorage,
): void {
  const store = readSceneDraftStore(storage)
  delete store.scenes[sceneId]
  writeSceneDraftStore(store, storage)
}

