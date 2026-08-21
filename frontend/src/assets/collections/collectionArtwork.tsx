import type { ComponentType } from 'react'
import { ScrapPuck } from './wasteland/ScrapPuck'
import { WastelandPoster } from './wasteland/WastelandPoster'
import { FreshSheetSticker } from './zamboni/FreshSheetSticker'
import { ZamboniAvatar } from './zamboni/ZamboniAvatar'
import { ZamboniBanner } from './zamboni/ZamboniBanner'
import { ZamboniEmblem } from './zamboni/ZamboniEmblem'
import { ZamboniLiveCover } from './zamboni/ZamboniLiveCover'
import { ZamboniPoster } from './zamboni/ZamboniPoster'
import styles from './collectionArtwork.module.css'

const COLLECTION_COVERS: Record<string, ComponentType<{ decorative?: boolean; className?: string; title?: string }>> = {
  wasteland: WastelandPoster,
  zamboni: ZamboniPoster,
}

const COSMETIC_ART: Record<string, ComponentType<{ decorative?: boolean; className?: string; title?: string }>> = {
  puck_wasteland_scrap: ScrapPuck,
  avatar_zamboni: ZamboniAvatar,
  emblem_zamboni: ZamboniEmblem,
  banner_zamboni_shift: ZamboniBanner,
  sticker_fresh_sheet: FreshSheetSticker,
}

export function hasCollectionCover(collectionId: string | null | undefined): boolean {
  return Boolean(collectionId && COLLECTION_COVERS[collectionId])
}

export function hasCosmeticArt(cosmeticId: string | null | undefined): boolean {
  return Boolean(cosmeticId && COSMETIC_ART[cosmeticId])
}

export function CollectionArtwork({
  collectionId,
  variant = 'card',
  labeled = false,
  title,
}: {
  collectionId: string
  variant?: 'card' | 'detail' | 'poster'
  labeled?: boolean
  title?: string
}) {
  if (collectionId === 'zamboni' && (variant === 'detail' || variant === 'poster')) {
    return <ZamboniLiveCover variant={variant} labeled={labeled} title={title || 'Zamboni RT-81'} />
  }
  const Art = COLLECTION_COVERS[collectionId]
  if (!Art) return null
  return (
    <div className={`${styles.cover} ${styles[`cover_${variant}`]} ${styles[`theme_${collectionId}`] || ''}`.trim()}>
      <Art decorative={!labeled} title={title || collectionId} className={styles.svg} />
    </div>
  )
}

export function CosmeticArtwork({
  cosmeticId,
  variant = 'tile',
  labeled = false,
  title,
}: {
  cosmeticId: string
  variant?: 'tile' | 'sheet'
  labeled?: boolean
  title?: string
}) {
  const Art = COSMETIC_ART[cosmeticId]
  if (!Art) return null
  return (
    <div className={`${styles.item} ${styles[`item_${variant}`]}`}>
      <Art decorative={!labeled} title={title} className={styles.svg} />
    </div>
  )
}
