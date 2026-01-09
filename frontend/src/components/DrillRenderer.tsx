import { useState, useEffect } from 'react'
import type { Drill } from '../api'
import { highlightGlossaryTerms } from './GlossaryTerm'

interface DrillRendererProps {
  drill: Drill
  onComplete: (answers: any) => void
  initialAnswers?: any
  onChangeAnswers?: (answers: any) => void
}

function ObservationGuide({ drill, currentQuestion }: { drill: Drill; currentQuestion?: string }) {
  const didactics = drill.didactics
  if (!didactics) return null

  const rule = currentQuestion && didactics.observation_rules?.[currentQuestion]

  return (
    <div style={{ 
      marginBottom: '1.5rem', 
      padding: '1rem', 
      backgroundColor: 'rgba(81,145,162,0.1)',
      border: '1px solid rgba(81,145,162,0.3)',
      borderRadius: '4px'
    }}>
      <h4 style={{ marginTop: 0, color: '#5191a2', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span>👀 Beobachtungsanleitung</span>
        {didactics.glossary && (
          <span style={{ fontSize: '0.75rem', fontWeight: 'normal', color: 'rgba(255,255,255,0.6)' }}>
            💡 <span style={{ borderBottom: '1px dotted rgba(81,145,162,0.7)', color: '#5191a2' }}>Begriffe</span> = Hover/Tap
          </span>
        )}
      </h4>
      
      {rule && (
        <div style={{ marginBottom: '1rem', padding: '0.75rem', backgroundColor: 'rgba(81,145,162,0.15)', borderRadius: '4px' }}>
          <strong>{rule.title}</strong>
          <p style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>
            {highlightGlossaryTerms(rule.description, didactics.glossary)}
          </p>
          {rule.examples && rule.examples.length > 0 && (
            <ul style={{ marginTop: '0.5rem', fontSize: '0.85rem', paddingLeft: '1.25rem' }}>
              {rule.examples.map((ex, i) => (
                <li key={i}>{highlightGlossaryTerms(ex, didactics.glossary)}</li>
              ))}
            </ul>
          )}
          <p style={{ marginTop: '0.5rem', fontSize: '0.9rem', fontStyle: 'italic', color: 'rgba(255,255,255,0.8)' }}>
            {highlightGlossaryTerms(rule.question, didactics.glossary)}
          </p>
        </div>
      )}

      {didactics.decision_help && didactics.decision_help.length > 0 && (
        <details style={{ marginTop: '0.75rem' }}>
          <summary style={{ cursor: 'pointer', color: '#5191a2', fontWeight: 'bold' }}>
            Wie entscheiden?
          </summary>
          <ul style={{ marginTop: '0.5rem', fontSize: '0.85rem' }}>
            {didactics.decision_help.map((h, i) => (
              <li key={i}>{highlightGlossaryTerms(h, didactics.glossary)}</li>
            ))}
          </ul>
        </details>
      )}

      {didactics.ignore_list && didactics.ignore_list.length > 0 && (
        <details style={{ marginTop: '0.75rem' }}>
          <summary style={{ cursor: 'pointer', color: 'rgba(255,255,255,0.6)', fontWeight: 'bold' }}>
            Was ignorieren?
          </summary>
          <ul style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)' }}>
            {didactics.ignore_list.map((item, i) => (
              <li key={i}>{highlightGlossaryTerms(item, didactics.glossary)}</li>
            ))}
          </ul>
        </details>
      )}
    </div>
  )
}

export default function DrillRenderer({ drill, onComplete, initialAnswers, onChangeAnswers }: DrillRendererProps) {
  const [answers, setAnswers] = useState<any>(initialAnswers || {})

  // Initiale Antworten laden (z.B. aus Draft)
  useEffect(() => {
    if (initialAnswers) setAnswers(initialAnswers)
  }, [initialAnswers])

  const updateAnswers = (next: any) => {
    setAnswers((prev: any) => {
      const computed = typeof next === 'function' ? next(prev) : next
      onChangeAnswers?.(computed)
      return computed
    })
  }

  const handleSubmit = () => {
    onComplete(answers)
  }

  if (drill.drill_type === 'period_checkin') {
    return <PeriodCheckin drill={drill} answers={answers} setAnswers={updateAnswers} onSubmit={handleSubmit} />
  }

  if (drill.drill_type === 'micro_quiz') {
    return <MicroQuiz drill={drill} answers={answers} setAnswers={updateAnswers} onSubmit={handleSubmit} />
  }

  if (drill.drill_type === 'shift_tracker') {
    return <ShiftTracker drill={drill} answers={answers} setAnswers={updateAnswers} onSubmit={handleSubmit} />
  }

  return <div>Unbekannter Drill-Typ: {drill.drill_type}</div>
}

function PeriodCheckin({ drill, answers, setAnswers }: any) {
  const questions = drill.config.questions || []
  const [currentQ, setCurrentQ] = useState<string | undefined>(undefined)
  const glossary = drill.didactics?.glossary

  return (
    <div className="card">
      <h3 style={{ wordWrap: 'break-word', overflowWrap: 'break-word' }}>{drill.title}</h3>
      <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)', wordWrap: 'break-word', overflowWrap: 'break-word' }}>{drill.description}</p>
      
      <ObservationGuide drill={drill} currentQuestion={currentQ} />

      {questions.map((q: any) => (
        <div key={q.key} style={{ marginBottom: '1.5rem', padding: '1rem', border: '1px solid rgba(81,145,162,0.2)', borderRadius: '4px' }}
          onFocus={() => setCurrentQ(q.key)}
        >
          <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '0.5rem' }}>
            {highlightGlossaryTerms(q.label, glossary)}
          </label>
          {q.help && <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', marginBottom: '0.75rem' }}>{highlightGlossaryTerms(q.help, glossary)}</p>}
          
          {q.type === 'radio' && (
            <div>
              {q.options.map((opt: string) => (
                <label key={opt} style={{ display: 'block', margin: '0.5rem 0', padding: '0.5rem', cursor: 'pointer', backgroundColor: answers[q.key] === opt ? 'rgba(81,145,162,0.2)' : 'transparent', borderRadius: '4px' }}>
                  <input
                    type="radio"
                    name={q.key}
                    value={opt}
                    checked={answers[q.key] === opt}
                    onChange={(e) => setAnswers({ ...answers, [q.key]: e.target.value })}
                    style={{ marginRight: '0.5rem' }}
                  />
                  {highlightGlossaryTerms(opt, glossary)}
                </label>
              ))}
            </div>
          )}
          {q.type === 'slider' && (
            <div>
              <input
                type="range"
                min={q.min}
                max={q.max}
                value={answers[q.key] || Math.floor((q.min + q.max) / 2)}
                onChange={(e) => setAnswers({ ...answers, [q.key]: parseInt(e.target.value) })}
                style={{ width: '100%' }}
              />
              <div style={{ textAlign: 'center', marginTop: '0.25rem', fontWeight: 'bold' }}>
                {answers[q.key] || Math.floor((q.min + q.max) / 2)}
              </div>
            </div>
          )}
          {q.type === 'text' && (
            <textarea
              value={answers[q.key] || ''}
              onChange={(e) => setAnswers({ ...answers, [q.key]: e.target.value })}
              maxLength={q.max_chars}
              placeholder="Optional: kurze Notiz"
              style={{ width: '100%', minHeight: '60px', padding: '0.5rem', backgroundColor: '#050712', color: '#f7f7ff', border: '1px solid rgba(81,145,162,0.5)', borderRadius: '4px', fontFamily: 'inherit' }}
            />
          )}
        </div>
      ))}
    </div>
  )
}

function MicroQuiz({ drill, answers, setAnswers, onSubmit }: any) {
  const [startTime] = useState(Date.now())
  const timeLimit = drill.config.time_limit || 60
  const elapsed = Math.floor((Date.now() - startTime) / 1000)
  const remaining = Math.max(0, timeLimit - elapsed)

  const questions = drill.config.questions || []

  if (remaining <= 0) {
    return (
      <div className="card">
        <h3>Zeit abgelaufen!</h3>
        <button onClick={onSubmit} className="btn">Quiz abschließen</button>
      </div>
    )
  }

  return (
    <div className="card">
      <h3>{drill.title}</h3>
      <div>Verbleibende Zeit: {remaining} Sekunden</div>
      <progress value={elapsed} max={timeLimit} style={{ width: '100%' }} />
      {questions.map((q: any, i: number) => (
        <div key={i} style={{ marginBottom: '1rem' }}>
          <h4>Frage {i + 1}: {q.question}</h4>
          {q.options.map((opt: string, j: number) => (
            <label key={j} style={{ display: 'block', margin: '0.5rem 0' }}>
              <input
                type="radio"
                name={`q${i}`}
                value={opt}
                checked={answers[`q${i}`] === opt}
                onChange={(e) => setAnswers({ ...answers, [`q${i}`]: e.target.value })}
              />
              {opt}
            </label>
          ))}
          {answers[`q${i}`] === q.correct && (
            <div style={{ color: 'green' }}>Richtig! {q.explanation}</div>
          )}
          {answers[`q${i}`] && answers[`q${i}`] !== q.correct && (
            <div style={{ color: 'red' }}>Falsch. {q.explanation}</div>
          )}
        </div>
      ))}
      <button onClick={onSubmit} className="btn">Quiz abschließen</button>
    </div>
  )
}

function ShiftTracker({ drill, answers, setAnswers, onSubmit }: any) {
  const shiftCount = drill.config.shift_count || 10
  const questions = drill.config.questions || []
  const completedShifts = Object.keys(answers).filter(k => k.startsWith('shift_')).length / questions.length
  const [currentQ, setCurrentQ] = useState<string | undefined>(undefined)
  const glossary = drill.didactics?.glossary

  return (
    <div className="card">
      <h3>{drill.title}</h3>
      <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)', marginBottom: '1rem' }}>
        {drill.description || 'Beobachte Shifts konsequent – Muster erkennen, nicht raten.'}
      </p>

      <ObservationGuide drill={drill} currentQuestion={currentQ} />
      
      <div style={{ marginBottom: '1.5rem', padding: '0.5rem', backgroundColor: 'rgba(81,145,162,0.1)', borderRadius: '4px' }}>
        Fortschritt: {Math.round((completedShifts / shiftCount) * 100)}% ({Math.floor(completedShifts)}/{shiftCount})
        <progress value={completedShifts} max={shiftCount} style={{ width: '100%', marginTop: '0.5rem' }} />
      </div>

      {Array.from({ length: shiftCount }).map((_, shiftNum) => (
        <div key={shiftNum} style={{ 
          marginBottom: '1.5rem', 
          padding: '1rem', 
          border: '1px solid rgba(81,145,162,0.3)', 
          borderRadius: '4px',
          backgroundColor: answers[`shift_${shiftNum}_${questions[0]?.key}`] ? 'rgba(81,145,162,0.05)' : 'transparent'
        }}>
          <h4>Shift {shiftNum + 1}</h4>
          {questions.map((q: any) => (
            <div key={q.key} style={{ marginBottom: '1rem' }} onFocus={() => setCurrentQ(q.key)}>
              <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '0.5rem' }}>{highlightGlossaryTerms(q.label, glossary)}</label>
              {q.type === 'radio' && (
                <div>
                  {q.options.map((opt: string) => (
                    <label key={opt} style={{ display: 'block', margin: '0.5rem 0', padding: '0.5rem', cursor: 'pointer', backgroundColor: answers[`shift_${shiftNum}_${q.key}`] === opt ? 'rgba(81,145,162,0.2)' : 'transparent', borderRadius: '4px' }}>
                      <input
                        type="radio"
                        name={`shift_${shiftNum}_${q.key}`}
                        value={opt}
                        checked={answers[`shift_${shiftNum}_${q.key}`] === opt}
                        onChange={(e) => setAnswers({ ...answers, [`shift_${shiftNum}_${q.key}`]: e.target.value })}
                        style={{ marginRight: '0.5rem' }}
                      />
                      {highlightGlossaryTerms(opt, glossary)}
                    </label>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      ))}

      <button 
        onClick={onSubmit} 
        className="btn"
        disabled={Math.floor(completedShifts) < shiftCount}
        style={{ opacity: Math.floor(completedShifts) < shiftCount ? 0.5 : 1, width: '100%', padding: '1rem' }}
      >
        Alle {shiftCount} Shifts abschließen
      </button>
    </div>
  )
}