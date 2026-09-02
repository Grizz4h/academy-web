import { useParams } from 'react-router-dom'
import React, { useState, useEffect } from 'react'
import theoryData from '../data/theoryData.json'
import { UiButtonLink, UiActionRow } from '../components/ui'
import styles from './TheoryDetail.module.css'

type TheoryContentItem = {
  type: string
  text?: string
  items?: any[]
  title?: string
  content?: TheoryContentItem[]
  class?: string
}

export default function TheoryDetail() {
  const { moduleId } = useParams<{ moduleId: string }>()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [moduleId])

  const data = moduleId ? (theoryData as Record<string, any>)[moduleId] : null

  const getInitialState = () => {
    if (!data || !Array.isArray(data.sections)) return {}
    const state: Record<string, boolean> = {}
    data.sections.forEach((section: { id: string }) => {
      state[section.id] = false
    })
    return state
  }

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>(getInitialState)

  useEffect(() => {
    setExpandedSections(getInitialState())
  }, [moduleId])

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }))
  }

  const renderContent = (item: TheoryContentItem, index: number): React.JSX.Element | null => {
    switch (item.type) {
      case 'paragraph':
        return (
          <p
            key={index}
            className={styles.paragraph}
            dangerouslySetInnerHTML={{ __html: item.text || '' }}
          />
        )
      case 'list':
        return (
          <ul key={index} className={styles.list}>
            {(item.items || []).map((listItem: string, idx: number) => (
              <li key={idx} dangerouslySetInnerHTML={{ __html: listItem }} />
            ))}
          </ul>
        )
      case 'highlight':
        return (
          <div
            key={index}
            className={styles.highlight}
            dangerouslySetInnerHTML={{ __html: item.text || '' }}
          />
        )
      case 'comparison':
        return (
          <div key={index} className={styles.comparison}>
            {(item.items || []).map((comp: { class?: string; text?: string }, idx: number) => (
              <div
                key={idx}
                className={[
                  styles.comparisonItem,
                  comp.class === 'good' ? styles.comparisonGood : '',
                  comp.class === 'bad' ? styles.comparisonBad : '',
                ].filter(Boolean).join(' ')}
                dangerouslySetInnerHTML={{ __html: comp.text || '' }}
              />
            ))}
          </div>
        )
      case 'summary-grid':
        return (
          <div key={index} className={styles.summaryGrid}>
            {(item.items || []).map((sum: { text?: string }, idx: number) => (
              <div
                key={idx}
                className={styles.summaryItem}
                dangerouslySetInnerHTML={{ __html: sum.text || '' }}
              />
            ))}
          </div>
        )
      case 'concept-card':
        return (
          <div key={index} className={styles.conceptCard}>
            {item.title ? <h3 className={styles.conceptTitle}>{item.title}</h3> : null}
            {(item.content || []).map((subItem, idx) => renderContent(subItem, idx))}
          </div>
        )
      case 'phases':
        return (
          <div key={index} className={styles.phases}>
            {(item.items || []).map((phase: { title?: string; items?: string[] }, idx: number) => (
              <div key={idx} className={styles.phase}>
                <div className={styles.phaseIndex} aria-hidden="true">{idx + 1}</div>
                <div className={styles.phaseBody}>
                  <h4 className={styles.phaseTitle}>{phase.title}</h4>
                  <ul className={styles.list}>
                    {(phase.items || []).map((phaseItem: string, pidx: number) => (
                      <li key={pidx} dangerouslySetInnerHTML={{ __html: phaseItem }} />
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        )
      case 'myths':
        return (
          <div key={index} className={styles.myths}>
            {(item.items || []).map((myth: { text?: string }, idx: number) => (
              <div
                key={idx}
                className={styles.myth}
                dangerouslySetInnerHTML={{ __html: myth.text || '' }}
              />
            ))}
          </div>
        )
      default:
        return null
    }
  }

  if (!data) {
    return (
      <div className={`${styles.page} ui-page-shell`}>
        <header className="ui-page-header">
          <h1 className="ui-page-title">Theorie</h1>
          <p className="ui-page-lead">
            Detaillierte Theorie für diesen Track ist noch nicht verfügbar.
          </p>
        </header>
        <UiButtonLink to="/curriculum" variant="ghost" size="sm">
          Zurück zur Akademie
        </UiButtonLink>
      </div>
    )
  }

  return (
    <div className={`${styles.page} ui-page-shell`}>
      <UiButtonLink to="/curriculum" variant="ghost" size="sm">
        ← Akademie
      </UiButtonLink>

      <header className="ui-page-header">
        {data.badge ? <p className={styles.badge}>{data.badge}</p> : null}
        <h1 className="ui-page-title">{data.title}</h1>
        {data.subtitle ? <p className="ui-page-lead">{data.subtitle}</p> : null}
      </header>

      {data.overview ? (
        <div
          className={styles.overview}
          dangerouslySetInnerHTML={{ __html: data.overview }}
        />
      ) : null}

      <div className={styles.sections}>
        {(data.sections || []).map((section: { id: string; title: string; content: TheoryContentItem[] }) => {
          const isOpen = Boolean(expandedSections[section.id])
          const panelId = `theory-section-${section.id}`
          return (
            <section
              key={section.id}
              className={[styles.section, isOpen ? styles.sectionOpen : ''].filter(Boolean).join(' ')}
            >
              <button
                type="button"
                className={styles.accordionHeader}
                onClick={() => toggleSection(section.id)}
                aria-expanded={isOpen}
                aria-controls={panelId}
              >
                <h2 className={styles.accordionTitle}>{section.title}</h2>
                <span
                  className={[styles.chevron, isOpen ? styles.chevronOpen : ''].filter(Boolean).join(' ')}
                  aria-hidden="true"
                />
              </button>
              {isOpen && (
                <div id={panelId} className={styles.sectionContent}>
                  {(section.content || []).map((item, index) => renderContent(item, index))}
                </div>
              )}
            </section>
          )
        })}
      </div>

      {moduleId ? (
        <div className={styles.footerCta}>
          {String(data.badge || '').toUpperCase().includes('SIDEQUEST') ? (
            <>
              <p className={styles.footerHint}>
                Sidequest-Hilfe — kein regulärer Pflichttrack. Erfasse numerische Sondersituationen opportunistisch über Special Teams in einer Session.
              </p>
              <UiActionRow>
                <UiButtonLink to="/curriculum" variant="secondary">
                  Zur Akademie
                </UiButtonLink>
              </UiActionRow>
            </>
          ) : (
            <>
              <p className={styles.footerHint}>Bereit zum Anwenden?</p>
              <UiActionRow>
                <UiButtonLink to={`/setup/${moduleId}`}>Session starten</UiButtonLink>
                <UiButtonLink to="/curriculum" variant="secondary">
                  Zur Akademie
                </UiButtonLink>
              </UiActionRow>
            </>
          )}
        </div>
      ) : null}
    </div>
  )
}
