import { useState, useEffect } from 'react'
import type { Drill } from '../api'
import { renderWithGlossary, highlightGlossaryTerms } from './GlossaryTerm'

interface DrillRendererProps {
  drill: Drill
  onComplete: (answers: any) => void
  initialAnswers?: any
  onChangeAnswers?: (answers: any) => void
}

function ObservationGuide({ drill }: { drill: Drill }) {
  const didactics = drill.didactics;
  if (!didactics) return null;

  // Support both observation_guide and observation_guidance structures
  const observationGuide = didactics.observation_guide || (didactics as any).observation_guidance;

  return (
    <div style={{ 
      marginBottom: '1.5rem', 
      padding: '1rem', 
      backgroundColor: 'rgba(81,145,162,0.1)',
      border: '1px solid rgba(81,145,162,0.3)',
      borderRadius: '4px'
    }}>
      <h4 style={{ marginTop: 0, color: '#5191a2', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span>
          👀 Beobachtungsanleitung
        </span>
        {didactics.glossary && (
          <span style={{ fontSize: '0.75rem', fontWeight: 'normal', color: 'rgba(255,255,255,0.6)' }}>
            💡 <span style={{ borderBottom: '1px dotted rgba(81,145,162,0.7)', color: '#5191a2' }}>Begriffe</span> = Hover/Tap
          </span>
        )}
      </h4>
      
      {observationGuide ? (
        <>
          {observationGuide.what_to_watch && observationGuide.what_to_watch.length > 0 && (
            <div style={{ marginBottom: '1rem' }}>
              <strong>Worauf achten?</strong>
              <ul style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>
                {observationGuide.what_to_watch.map((item: string, i: number) => (
                  <li key={i}>{renderWithGlossary(item)}</li>
                ))}
              </ul>
            </div>
          )}
          {observationGuide.how_to_decide && observationGuide.how_to_decide.length > 0 && (
            <div style={{ marginBottom: '1rem' }}>
              <strong>Wie entscheiden?</strong>
              <ul style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>
                {observationGuide.how_to_decide.map((item: string, i: number) => (
                  <li key={i}>{renderWithGlossary(item)}</li>
                ))}
              </ul>
            </div>
          )}
          {observationGuide.ignore && observationGuide.ignore.length > 0 && (
            <div style={{ marginBottom: '1rem' }}>
              <strong>Was ignorieren?</strong>
              <ul style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>
                {observationGuide.ignore.map((item: string, i: number) => (
                  <li key={i}>{renderWithGlossary(item)}</li>
                ))}
              </ul>
            </div>
          )}
        </>
      ) : (
        <p style={{ fontStyle: 'italic', color: 'rgba(81,145,162,0.7)' }}>
          Keine Beobachtungsanleitung verfügbar.
        </p>
      )}
    </div>
  );
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

  if (drill.drill_type === 'triangle_spotting') {
    return <TriangleSpotting drill={drill} answers={answers} setAnswers={updateAnswers} onSubmit={handleSubmit} />
  }

  if (drill.drill_type === 'role_identification') {
    return <RoleIdentification drill={drill} answers={answers} setAnswers={updateAnswers} onSubmit={handleSubmit} />
  }

  return <div>Unbekannter Drill-Typ: {drill.drill_type}</div>
}

function PeriodCheckin({ drill, answers, setAnswers }: any) {
  const questions = drill.config.questions || []
  const glossary = drill.didactics?.glossary

  return (
    <div className="card">
      <h3 style={{ wordWrap: 'break-word', overflowWrap: 'break-word' }}>{drill.title}</h3>
      <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)', wordWrap: 'break-word', overflowWrap: 'break-word' }}>{drill.description}</p>
      
      {drill.didactics?.explanation && (
        <div style={{ marginBottom: '1rem', padding: '1rem', backgroundColor: 'rgba(81,145,162,0.05)', borderRadius: '4px' }}>
          <h4 style={{ marginTop: 0, color: '#5191a2' }}>Drill-Erklärung</h4>
          <p>{drill.didactics.explanation}</p>
        </div>
      )}

      {/* Center-Rollenwissen: Nur anzeigen, wenn vorhanden */}
      {drill.didactics?.role_context && (
        <section style={{ marginTop: 12, fontSize: '0.9rem', opacity: 0.9 }}>
          <h4>{drill.didactics.role_context.title}</h4>
          <ul style={{ paddingLeft: 16 }}>
            {drill.didactics.role_context.content.map((item: any, idx: number) => (
              <li key={idx} style={{ marginBottom: 6 }}>
                <strong>{item.label}:</strong> {item.text}
              </li>
            ))}
          </ul>
          {drill.didactics.role_context.hint && (
            <p style={{ marginTop: 8, fontStyle: 'italic', opacity: 0.75 }}>
              {drill.didactics.role_context.hint}
            </p>
          )}
        </section>
      )}

      <ObservationGuide drill={drill} />

      {questions.map((q: any) => (
        <div key={q.key} style={{ marginBottom: '1.5rem', padding: '1rem', border: '1px solid rgba(81,145,162,0.2)', borderRadius: '4px' }}
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

      {drill.didactics?.learning_hint && (
        <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: 'rgba(81,145,162,0.05)', borderRadius: '4px' }}>
          <h4 style={{ marginTop: 0, color: '#5191a2' }}>🧠 Lernhinweis</h4>
          <p style={{ fontStyle: 'italic' }}>{drill.didactics.learning_hint}</p>
        </div>
      )}
    </div>
  )
}

function MicroQuiz({ drill, answers, setAnswers }: any) {
  const [startTime] = useState(Date.now())
  const timeLimit = drill.config.time_limit || 60
  const elapsed = Math.floor((Date.now() - startTime) / 1000)
  const remaining = Math.max(0, timeLimit - elapsed)

  const questions = drill.config.questions || []

  if (remaining <= 0) {
    return (
      <div className="card">
        <h3>Zeit abgelaufen!</h3>
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
    </div>
  )
}

function ShiftTracker({ drill, answers, setAnswers, onSubmit }: any) {
  const shiftCount = drill.config.shift_count || 10
  const questions = drill.config.questions || []
  const completedShifts = Object.keys(answers).filter(k => k.startsWith('shift_')).length / questions.length
  const glossary = drill.didactics?.glossary
  const [rollenreferenzExpanded, setRollenreferenzExpanded] = useState(false)

  return (
    <div className="card">
      <h3>{drill.title}</h3>
      <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)', marginBottom: '1rem' }}>
        {drill.description || 'Beobachte Shifts konsequent – Muster erkennen, nicht raten.'}
      </p>
      
      {drill.didactics?.rollenreferenz_center && (
        <div style={{ marginBottom: '1rem', padding: '1rem', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '4px', borderLeft: '4px solid #5191a2' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }} onClick={() => setRollenreferenzExpanded(!rollenreferenzExpanded)}>
            <h4 style={{ marginTop: 0, color: '#5191a2' }}>{drill.didactics.rollenreferenz_center.title}</h4>
            <span style={{ fontSize: '1.2rem', color: '#5191a2' }}>{rollenreferenzExpanded ? '▲' : '▼'}</span>
          </div>
          {rollenreferenzExpanded && (
            <>
              <p>{drill.didactics.rollenreferenz_center.text}</p>
              <h5>✅ Typische Aufgaben des Centers (vereinfacht, A1-Level)</h5>
              <ul>
                {drill.didactics.rollenreferenz_center.typische_aufgaben.map((item: string) => <li key={item}>{item}</li>)}
              </ul>
              <p><strong>Kurz gesagt:</strong> {drill.didactics.rollenreferenz_center.kurz_gesagt}</p>
              <h5>⚠️ Wann ist ein Center in der Rolle?</h5>
              <ul>
                {drill.didactics.rollenreferenz_center.wann_in_rolle.map((item: string) => <li key={item}>{item}</li>)}
              </ul>
              <h5>❌ Wann fällt der Center aus der Rolle?</h5>
              <p><strong>Ein Center fällt nicht aus der Rolle, weil:</strong></p>
              <ul>
                {drill.didactics.rollenreferenz_center.nicht_aus_rolle_weil.map((item: string) => <li key={item}>{item}</li>)}
              </ul>
              <p><strong>Ein Center fällt aus der Rolle, wenn:</strong></p>
              <ul>
                {drill.didactics.rollenreferenz_center.aus_rolle_wenn.map((item: string) => <li key={item}>{item}</li>)}
              </ul>
              <p><strong>👉 Merksatz für den Drill:</strong> {drill.didactics.rollenreferenz_center.merksatz}</p>
              <h5>🎯 Beobachtungsanker (für A1_2)</h5>
              <p><strong>Frage dich bei jedem Shift Marker:</strong> „{drill.didactics.rollenreferenz_center.beobachtungsanker.frage}“</p>
              <p><strong>{drill.didactics.rollenreferenz_center.beobachtungsanker.regel}</strong></p>
            </>
          )}
        </div>
      )}
      
      {drill.didactics?.drill_intro && (
        <div style={{ marginBottom: '1rem', padding: '1rem', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '4px', borderLeft: '4px solid #5191a2' }}>
          <h4 style={{ marginTop: 0, color: '#5191a2' }}>{drill.didactics.drill_intro.title}</h4>
          <p>{drill.didactics.drill_intro.text}</p>
        </div>
      )}
      
      {drill.didactics?.explanation && (
        <div style={{ marginBottom: '1rem', padding: '1rem', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '4px', borderLeft: '4px solid #5191a2' }}>
          <h4 style={{ marginTop: 0, color: '#5191a2' }}>Drill-Erklärung</h4>
          <p>{drill.didactics.explanation}</p>
        </div>
      )}
      
      <ObservationGuide drill={drill} />
      
      {drill.didactics?.shift_marker_explanation && (
        <div style={{ marginBottom: '1rem', padding: '1rem', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '4px', borderLeft: '4px solid #ffc107' }}>
          <p>{drill.didactics.shift_marker_explanation}</p>
        </div>
      )}
      
      {drill.didactics?.fill_hint && (
        <div style={{ marginBottom: '1rem', padding: '0.5rem', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '4px', borderLeft: '4px solid #28a745' }}>
          <strong>Hinweis:</strong> {drill.didactics.fill_hint}
        </div>
      )}
      
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
            <div key={q.key} style={{ marginBottom: '1rem' }}>
              <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '0.5rem' }}>{highlightGlossaryTerms(q.label, glossary)}</label>
              {drill.didactics?.question_precision?.[q.key] && (
                <div style={{ marginBottom: '0.5rem', fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)' }}>
                  <em>{drill.didactics.question_precision[q.key]}</em>
                </div>
              )}
              {drill.didactics?.inline_explanations?.[q.key] && (
                <div style={{ marginBottom: '0.5rem', padding: '0.5rem', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '4px', borderLeft: '4px solid #dc3545' }}>
                  <strong>„{q.label}“ bedeutet NICHT:</strong>
                  <ul>
                    {drill.didactics.inline_explanations[q.key].not_means.map((item: string) => <li key={item}>{item}</li>)}
                  </ul>
                  <strong>Es bedeutet:</strong> {drill.didactics.inline_explanations[q.key].means}
                  <br />
                  <strong>{drill.didactics.inline_explanations[q.key].example}</strong>
                </div>
              )}
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

      {drill.didactics?.didactical_closing && (
        <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '4px', borderLeft: '4px solid #28a745' }}>
          <h4 style={{ marginTop: 0, color: '#28a745' }}>Warum dieser Drill wichtig ist</h4>
          <p>{drill.didactics.didactical_closing}</p>
        </div>
      )}

      {drill.didactics?.learning_hint && (
        <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '4px', borderLeft: '4px solid #ffc107' }}>
          <h4 style={{ marginTop: 0, color: '#ffc107' }}>Lernhinweis</h4>
          <p style={{ fontStyle: 'italic' }}>{drill.didactics.learning_hint}</p>
        </div>
      )}
    </div>
  )
}

function TriangleSpotting({ drill, answers, setAnswers }: any) {
  const questions = drill.config.questions || []

  return (
    <div>
      {drill.didactics?.drill_intro && (
        <div style={{ marginBottom: '1rem', padding: '1rem', backgroundColor: 'rgba(81,145,162,0.05)', borderRadius: '4px' }}>
          <h4 style={{ marginTop: 0, color: '#5191a2' }}>{drill.didactics.drill_intro.title}</h4>
          <p>{drill.didactics.drill_intro.text}</p>
        </div>
      )}
      
      <ObservationGuide drill={drill} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {questions.map((q: any) => (
          <div key={q.key}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              {q.label}
            </label>
            {q.type === 'radio' && q.options && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                {q.options.map((opt: string) => (
                  <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input
                      type="radio"
                      name={q.key}
                      value={opt}
                      checked={answers[q.key] === opt}
                      onChange={(e) => setAnswers({ ...answers, [q.key]: e.target.value })}
                    />
                    {opt}
                    {drill.didactics?.inline_explanations?.[opt.replace(/\s+/g, '_').toLowerCase()] && (
                      <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', marginLeft: '0.5rem' }}>
                        ({drill.didactics.inline_explanations[opt.replace(/\s+/g, '_').toLowerCase()].meaning})
                      </span>
                    )}
                  </label>
                ))}
              </div>
            )}
            {q.type === 'text' && (
              <textarea
                value={answers[q.key] || ''}
                onChange={(e) => setAnswers({ ...answers, [q.key]: e.target.value })}
                maxLength={q.max_chars || 200}
                style={{ width: '100%', minHeight: '3rem', padding: '0.5rem' }}
                placeholder="Deine Beobachtung..."
              />
            )}
          </div>
        ))}
      </div>



      {drill.didactics?.learning_hint && (
        <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: 'rgba(81,145,162,0.05)', borderRadius: '4px' }}>
          <h4 style={{ marginTop: 0, color: '#5191a2' }}>🧠 Lernhinweis</h4>
          <p style={{ fontStyle: 'italic' }}>{drill.didactics.learning_hint}</p>
        </div>
      )}
    </div>
  )
}

function RoleIdentification({ drill, answers, setAnswers }: any) {
  const questions = drill.config.questions || []

  return (
    <div>
      {drill.didactics?.explanation && (
        <div style={{ marginBottom: '1rem', padding: '1rem', backgroundColor: 'rgba(81,145,162,0.05)', borderRadius: '4px' }}>
          <h4 style={{ marginTop: 0, color: '#5191a2' }}>Drill-Erklärung</h4>
          <p>{drill.didactics.explanation}</p>
        </div>
      )}

      {/* Rollenreferenz unterhalb der Drillerklärung anzeigen */}
      {drill.didactics?.role_context && (
        <section style={{ marginTop: 12, fontSize: '0.9rem', opacity: 0.9 }}>
          <h4>{drill.didactics.role_context.title}</h4>
          <ul style={{ paddingLeft: 16 }}>
            {drill.didactics.role_context.content.map((item: any, idx: number) => (
              <li key={idx} style={{ marginBottom: 6 }}>
                <strong>{item.label}:</strong> {item.text}
              </li>
            ))}
          </ul>
          {drill.didactics.role_context.hint && (
            <p style={{ marginTop: 8, fontStyle: 'italic', opacity: 0.75 }}>
              {drill.didactics.role_context.hint}
            </p>
          )}
        </section>
      )}

      <ObservationGuide drill={drill} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {questions.map((q: any) => (
          <div key={q.key}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              {q.label}
            </label>
            {q.type === 'radio' && q.options && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                {q.options.map((opt: string) => (
                  <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input
                      type="radio"
                      name={q.key}
                      value={opt}
                      checked={answers[q.key] === opt}
                      onChange={(e) => setAnswers({ ...answers, [q.key]: e.target.value })}
                    />
                    {opt}
                  </label>
                ))}
              </div>
            )}
            {q.type === 'text' && (
              <input
                type="text"
                value={answers[q.key] || ''}
                onChange={(e) => setAnswers({ ...answers, [q.key]: e.target.value })}
                maxLength={q.max_chars || 200}
                style={{ width: '100%', padding: '0.5rem' }}
                placeholder={q.placeholder || "Beschreibe die Rolle, die der Center hier einnimmt (z. B. absichernd, verbindend, passiv). Kein Name."}
              />
            )}
          </div>
        ))}
      </div>

      {drill.didactics?.learning_hint && (
        <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: 'rgba(81,145,162,0.05)', borderRadius: '4px' }}>
          <h4 style={{ marginTop: 0, color: '#5191a2' }}>🧠 Lernhinweis</h4>
          <p style={{ fontStyle: 'italic' }}>{drill.didactics.learning_hint}</p>
        </div>
      )}
    </div>
  )
}