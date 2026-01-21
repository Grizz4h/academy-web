import { useParams } from 'react-router-dom'
import React, { useState, useEffect } from 'react'
import theoryData from '../data/theoryData.json'  // Neuer Import

export default function TheoryDetail() {
  const { moduleId } = useParams<{ moduleId: string }>()

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])
  const getInitialState = (moduleId: string) => {
    const data = (theoryData as any)[moduleId];
    if (!data || !Array.isArray(data.sections)) return {};
    // Alle Section-IDs auf false (zu)
    const state: Record<string, boolean> = {};
    data.sections.forEach((section: any) => {
      state[section.id] = false;
    });
    return state;
  }

  const [expandedSections, setExpandedSections] = useState(getInitialState(moduleId || ''))

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  // Neue Render-Funktion für dynamischen Inhalt
  const renderContent = (item: any, index: number): React.JSX.Element | null => {
    switch (item.type) {
      case 'paragraph':
        return <p key={index} dangerouslySetInnerHTML={{ __html: item.text }} />
      case 'list':
        return (
          <ul key={index}>
            {item.items.map((listItem: string, idx: number) => (
              <li key={idx}>{listItem}</li>
            ))}
          </ul>
        )
      case 'highlight':
        return <div key={index} className="highlight-box" dangerouslySetInnerHTML={{ __html: item.text }} />
      case 'comparison':
        return (
          <div key={index} className="comparison">
            {item.items.map((comp: any, idx: number) => (
              <div key={idx} className={`comparison-item ${comp.class}`} dangerouslySetInnerHTML={{ __html: comp.text }} />
            ))}
          </div>
        )
      case 'summary-grid':
        return (
          <div key={index} className="summary-grid">
            {item.items.map((sum: any, idx: number) => (
              <div key={idx} className="summary-item" dangerouslySetInnerHTML={{ __html: sum.text }} />
            ))}
          </div>
        )
      case 'concept-card':
        return (
          <div key={index} className="concept-card">
            <h3>{item.title}</h3>
            {item.content.map((subItem: any, idx: number) => renderContent(subItem, idx))}
          </div>
        )
      case 'phases':
        return (
          <div key={index} className="phases">
            {item.items.map((phase: any, idx: number) => (
              <div key={idx} className="phase">
                <h4>{phase.title}</h4>
                <ul>
                  {phase.items.map((phaseItem: string, pidx: number) => (
                    <li key={pidx}>{phaseItem}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )
      case 'myths':
        return (
          <div key={index} className="myths">
            {item.items.map((myth: any, idx: number) => (
              <div key={idx} className="myth">
                <div dangerouslySetInnerHTML={{ __html: myth.text }} />
              </div>
            ))}
          </div>
        )
      default:
        return null
    }
  }

  const getDetailedTheory = (moduleId: string) => {
    const data = (theoryData as any)[moduleId]
    if (!data) {
      return <div>Detaillierte Theorie für diesen Track ist noch nicht verfügbar.</div>
    }

    return (
      <div className="theory-content">
        <div className="theory-header">
          <div className="theory-badge">{data.badge}</div>
          <h1>{data.title}</h1>
          <p className="theory-subtitle">{data.subtitle}</p>
        </div>

        <div className="theory-overview">
          <p dangerouslySetInnerHTML={{ __html: data.overview }} />
        </div>

        {data.sections.map((section: any) => (
          <section className="theory-section" key={section.id}>
            <button
              className="section-toggle"
              onClick={() => toggleSection(section.id as keyof typeof expandedSections)}
              aria-expanded={expandedSections[section.id as keyof typeof expandedSections]}
            >
              <h2>{section.title}</h2>
              <span className="toggle-icon">{expandedSections[section.id as keyof typeof expandedSections] ? '−' : '+'}</span>
            </button>
            {expandedSections[section.id as keyof typeof expandedSections] && (
              <div className="section-content">
                {section.content.map((item: any, index: number) => renderContent(item, index))}
              </div>
            )}
          </section>
        ))}
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

      <div className="card theory-detail-card">
        {getDetailedTheory(moduleId || '')}
      </div>
    </div>
  )
}