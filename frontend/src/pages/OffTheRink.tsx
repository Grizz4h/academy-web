import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import Card from '../components/Card'
import { UiPill } from '../components/ui'
import {
  OFF_THE_RINK_ABOUT,
  OFF_THE_RINK_AUTHOR,
  OFF_THE_RINK_PATH,
  OFF_THE_RINK_SUBTITLE,
  OFF_THE_RINK_TITLE,
  buildHubMailto,
  buildHubSharePayload,
  formatColumnDate,
  formatColumnNumber,
  formatReadingTime,
  groupColumnsByYear,
  isLatestColumn,
  offTheRinkAbsoluteUrl,
  offTheRinkColumnPath,
} from '../content/offTheRink'
import { applyOffTheRinkDocumentMeta, hubDocumentMeta } from '../content/offTheRink/documentMeta'
import { OffTheRinkShareBar } from './OffTheRinkShareBar'
import styles from './OffTheRink.module.css'

export default function OffTheRinkPage() {
  const yearGroups = groupColumnsByYear()
  const hubUrl = offTheRinkAbsoluteUrl(OFF_THE_RINK_PATH)

  useEffect(() => applyOffTheRinkDocumentMeta(hubDocumentMeta(hubUrl)), [hubUrl])

  return (
    <article className={`ui-page-shell ${styles.page}`}>
      <header className="ui-page-header">
        <h1 className="ui-page-title">{OFF_THE_RINK_TITLE}</h1>
        <p className="ui-page-lead">{OFF_THE_RINK_SUBTITLE}</p>
        <p className={styles.byline}>Eine Kolumne von {OFF_THE_RINK_AUTHOR}</p>
      </header>

      <p className={styles.intro}>{OFF_THE_RINK_ABOUT}</p>

      <section className="ui-content-section" aria-label="Archiv">
        <h2 className="ui-section-title">Archiv</h2>
        {yearGroups.map((group) => (
          <div key={group.year} className={styles.yearGroup}>
            <h3 className={styles.year}>{group.year}</h3>
            <div className={styles.list}>
              {group.columns.map((column) => (
                <Link
                  key={column.slug}
                  to={offTheRinkColumnPath(column.slug)}
                  className={styles.entry}
                >
                  <Card surface="section">
                    {column.image ? (
                      <img
                        className={styles.entryCover}
                        src={column.image}
                        alt={column.imageAlt || ''}
                      />
                    ) : null}
                    <div className={styles.kickerRow}>
                      <p className={styles.kicker}>{formatColumnNumber(column.number)}</p>
                      {isLatestColumn(column.slug) ? <UiPill tone="new">Neu</UiPill> : null}
                    </div>
                    <h4 className={styles.entryTitle}>{column.title}</h4>
                    <p className={styles.meta}>
                      <time dateTime={column.date}>{formatColumnDate(column.date)}</time>
                      <span aria-hidden="true">·</span>
                      <span>{formatReadingTime(column.readingTime)}</span>
                    </p>
                    <p className={styles.teaser}>{column.teaser}</p>
                    <span className={styles.readCue}>Lesen</span>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </section>

      <OffTheRinkShareBar share={buildHubSharePayload(hubUrl)} mailto={buildHubMailto()} />

      <section className="ui-content-section" aria-label="Über das Format">
        <h2 className="ui-section-title">Über das Format</h2>
        <p className={styles.intro}>
          {OFF_THE_RINK_AUTHOR} schreibt OFF THE RINK in rInQ Tank. Keine Taktikstunde, kein
          Newsportal — ein ruhiger Ort für Beobachtungen rund um Hockey und alles, was einem
          dabei noch so auffällt. Rückmeldung gern per Mail, nicht als Kommentarthread.
        </p>
      </section>
    </article>
  )
}
