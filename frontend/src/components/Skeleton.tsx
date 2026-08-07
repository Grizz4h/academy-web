import styles from './Skeleton.module.css'

type SkeletonProps = {
  className?: string
  height?: string | number
  width?: string | number
  radius?: string | number
}

export function Skeleton({ className = '', height, width, radius }: SkeletonProps) {
  return (
    <div
      className={`${styles.bone} ${className}`}
      style={{
        height,
        width,
        borderRadius: radius,
      }}
      aria-hidden="true"
    />
  )
}

export function SkeletonCard({ lines = 3 }: { lines?: number }) {
  return (
    <div className={styles.card} aria-busy="true" aria-label="Lädt">
      <Skeleton height="1.1rem" width="42%" radius={8} />
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          height="0.85rem"
          width={i === lines - 1 ? '62%' : '100%'}
          radius={6}
        />
      ))}
    </div>
  )
}

export function SkeletonKpiGrid({ count = 4 }: { count?: number }) {
  return (
    <div className={styles.kpiGrid} aria-busy="true" aria-label="Lädt">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={styles.kpiCard}>
          <Skeleton height="0.85rem" width="55%" radius={6} />
          <Skeleton height="1.8rem" width="40%" radius={8} />
          <Skeleton height="0.75rem" width="70%" radius={6} />
        </div>
      ))}
    </div>
  )
}

export function PageSkeleton() {
  return (
    <div className={styles.page}>
      <Skeleton height="2rem" width="46%" radius={10} />
      <Skeleton height="1rem" width="78%" radius={8} />
      <SkeletonKpiGrid />
      <SkeletonCard lines={4} />
      <SkeletonCard lines={3} />
    </div>
  )
}
