import { useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { UiButtonLink } from '../components/ui'
import {
  OFF_THE_RINK_AUTHOR,
  OFF_THE_RINK_PATH,
  buildColumnMailto,
  buildColumnSharePayload,
  formatColumnDate,
  formatColumnNumber,
  formatReadingTime,
  getAdjacentColumns,
  getOffTheRinkColumn,
  offTheRinkAbsoluteUrl,
  offTheRinkColumnPath,
  resolveColumnImageUrl,
} from '../content/offTheRink'
import {
  applyOffTheRinkDocumentMeta,
  columnDocumentMeta,
} from '../content/offTheRink/documentMeta'
import { OffTheRinkShareBar } from './OffTheRinkShareBar'
import styles from './OffTheRink.module.css'

export default function OffTheRinkColumnPage() {
  const { slug = '' } = useParams<{ slug: string }>()
  const column = getOffTheRinkColumn(slug)
  const adjacent = column ? getAdjacentColumns(column.slug) : {}
  const canonical = column
    ? offTheRinkAbsoluteUrl(offTheRinkColumnPath(column.slug))
    : offTheRinkAbsoluteUrl(OFF_THE_RINK_PATH)

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [slug])

  useEffect(() => {
    if (!column) return
    return applyOffTheRinkDocumentMeta(
      columnDocumentMeta(
        column.title,
        column.teaser,
        canonical,
        resolveColumnImageUrl(column),
      ),
    )
  }, [column, canonical])

  if (!column) {
    return (
      <article className={`ui-page-shell ${styles.page}`}>
        <header className="ui-page-header">
          <h1 className="ui-page-title">Kolumne nicht gefunden</h1>
          <p className="ui-page-lead">Diese Ausgabe gibt es unter dieser Adresse nicht.</p>
        </header>
        <p className={styles.missing}>
          Der Link ist veraltet — oder die Kolumne wurde noch nicht veröffentlicht.
        </p>
        <div className={styles.backRow}>
          <UiButtonLink to={OFF_THE_RINK_PATH} variant="ghost">
            Zurück zu OFF THE RINK
          </UiButtonLink>
        </div>
      </article>
    )
  }

  return (
    <article className={`ui-page-shell ${styles.page}`}>
      <header className={`ui-page-header ${styles.articleHeader}`}>
        <p className={styles.kicker}>{formatColumnNumber(column.number)}</p>
        <h1 className={styles.articleTitle}>{column.title}</h1>
        <p className={styles.byline}>von {OFF_THE_RINK_AUTHOR}</p>
        <p className={styles.meta}>
          <time dateTime={column.date}>{formatColumnDate(column.date)}</time>
          <span aria-hidden="true">·</span>
          <span>{formatReadingTime(column.readingTime)}</span>
        </p>
      </header>

      {column.image ? (
        <figure className={styles.figure}>
          <img
            className={styles.hero}
            src={column.image}
            alt={column.imageAlt || ''}
          />
          {column.imageCaption ? (
            <figcaption className={styles.caption}>{column.imageCaption}</figcaption>
          ) : null}
        </figure>
      ) : null}

      <div className={styles.body}>
        {column.content.map((block, index) => {
          if (block.type === 'heading') {
            return (
              <h2 key={`${block.type}-${index}`} className={styles.subheading}>
                {block.text}
              </h2>
            )
          }
          return (
            <p key={`${block.type}-${index}`} className={styles.paragraph}>
              {block.text}
            </p>
          )
        })}
      </div>

      <OffTheRinkShareBar
        share={buildColumnSharePayload(column, canonical)}
        mailto={buildColumnMailto(column)}
      />

      {adjacent.older || adjacent.newer ? (
        <nav className={styles.pager} aria-label="Weitere Kolumnen">
          {adjacent.older ? (
            <Link to={offTheRinkColumnPath(adjacent.older.slug)} className={styles.pagerLink}>
              <span className={styles.pagerLabel}>Ältere Kolumne</span>
              <span className={styles.pagerTitle}>{adjacent.older.title}</span>
            </Link>
          ) : null}
          {adjacent.newer ? (
            <Link
              to={offTheRinkColumnPath(adjacent.newer.slug)}
              className={`${styles.pagerLink} ${styles.pagerNewer}`}
            >
              <span className={styles.pagerLabel}>Neuere Kolumne</span>
              <span className={styles.pagerTitle}>{adjacent.newer.title}</span>
            </Link>
          ) : null}
        </nav>
      ) : null}

      <div className={styles.backRow}>
        <UiButtonLink to={OFF_THE_RINK_PATH} variant="ghost">
          Zurück zu OFF THE RINK
        </UiButtonLink>
      </div>
    </article>
  )
}
