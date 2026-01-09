import { useState, useEffect } from 'react'
import { useFloating, offset, flip, shift, autoUpdate } from '@floating-ui/react'
import { createPortal } from 'react-dom'

interface GlossaryTermProps {
  term: string
  glossary?: { [key: string]: string }
}

export function GlossaryTerm({ term, glossary }: GlossaryTermProps) {
  const [show, setShow] = useState(false)
  const definition = glossary?.[term]
  
  const { refs, floatingStyles, placement } = useFloating({
    open: show,
    onOpenChange: setShow,
    middleware: [
      offset(8),
      flip(),
      shift({ padding: 8 })
    ],
    whileElementsMounted: autoUpdate,
    placement: 'top'
  })

  // Close on outside click (mobile)
  useEffect(() => {
    if (!show) return
    
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      const refElement = refs.reference.current
      const floatElement = refs.floating.current
      
      if (
        refElement && 
        floatElement &&
        'contains' in refElement &&
        !refElement.contains(e.target as Node) &&
        !floatElement.contains(e.target as Node)
      ) {
        setShow(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('touchstart', handleClickOutside)
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
    }
  }, [show, refs])
  
  if (!definition) return <span>{term}</span>
  
  const isBottom = placement.startsWith('bottom')
  
  const handleTouch = (e: React.TouchEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setShow(!show)
  }
  
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setShow(!show)
  }
  
  return (
    <>
      <span 
        ref={refs.setReference}
        style={{ 
          borderBottom: '1px dotted rgba(81,145,162,0.7)', 
          cursor: 'help', 
          color: '#5191a2',
          userSelect: 'none',
          WebkitTouchCallout: 'none',
          WebkitUserSelect: 'none'
        }}
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onClick={handleClick}
        onTouchEnd={handleTouch}
      >
        {term}
      </span>
      
      {show && createPortal(
        <div 
          ref={refs.setFloating}
          style={{
            ...floatingStyles,
            backgroundColor: '#1a1a2e',
            border: '2px solid #5191a2',
            padding: '0.75rem',
            borderRadius: '6px',
            fontSize: '0.85rem',
            maxWidth: 'min(280px, calc(100vw - 32px))',
            zIndex: 9999,
            boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
            whiteSpace: 'pre-line',
            textAlign: 'left',
            lineHeight: '1.5',
            pointerEvents: 'auto',
            color: '#f7f7ff'
          }}
        >
          <div style={{ fontWeight: 'bold', marginBottom: '0.5rem', color: '#5191a2' }}>{term}</div>
          <div style={{ color: '#d8e1ff' }}>{definition}</div>
          
          {/* Arrow */}
          <div style={{ 
            position: 'absolute',
            [isBottom ? 'top' : 'bottom']: '-8px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: 0,
            height: 0,
            borderLeft: '8px solid transparent',
            borderRight: '8px solid transparent',
            [isBottom ? 'borderBottom' : 'borderTop']: '8px solid #5191a2'
          }}/>
        </div>,
        document.body
      )}
    </>
  )
}

export function highlightGlossaryTerms(text: string, glossary?: { [key: string]: string }): React.ReactNode {
  if (!glossary) return text
  
  const terms = Object.keys(glossary).sort((a, b) => b.length - a.length)
  const parts: React.ReactNode[] = []
  let lastIndex = 0
  const matches: Array<{ start: number; end: number; term: string }> = []
  
  terms.forEach(term => {
    const regex = new RegExp(`\\b${term}\\b`, 'gi')
    let match
    while ((match = regex.exec(text)) !== null) {
      matches.push({ start: match.index, end: match.index + match[0].length, term: match[0] })
    }
  })
  
  matches.sort((a, b) => a.start - b.start)
  const filtered = matches.filter((match, i) => {
    if (i === 0) return true
    const prev = matches[i - 1]
    return match.start >= prev.end
  })
  
  filtered.forEach((match, i) => {
    if (match.start > lastIndex) {
      parts.push(text.substring(lastIndex, match.start))
    }
    parts.push(<GlossaryTerm key={i} term={match.term} glossary={glossary} />)
    lastIndex = match.end
  })
  
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex))
  }
  
  return parts.length > 0 ? parts : text
}
