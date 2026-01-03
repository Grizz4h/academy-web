import React, { useState } from 'react'
import type { Drill } from '../api'

interface DrillRendererProps {
  drill: Drill
  onComplete: (answers: any) => void
}

export default function DrillRenderer({ drill, onComplete }: DrillRendererProps) {
  const [answers, setAnswers] = useState<any>({})

  const handleSubmit = () => {
    onComplete(answers)
  }

  if (drill.drill_type === 'period_checkin') {
    return <PeriodCheckin drill={drill} answers={answers} setAnswers={setAnswers} onSubmit={handleSubmit} />
  }

  if (drill.drill_type === 'micro_quiz') {
    return <MicroQuiz drill={drill} answers={answers} setAnswers={setAnswers} onSubmit={handleSubmit} />
  }

  return <div>Unbekannter Drill-Typ: {drill.drill_type}</div>
}

function PeriodCheckin({ drill, answers, setAnswers, onSubmit }: any) {
  const questions = drill.config.questions || []

  return (
    <div className="card">
      <h3>{drill.title}</h3>
      {questions.map((q: any) => (
        <div key={q.key} style={{ marginBottom: '1rem' }}>
          <label>{q.label}</label>
          {q.type === 'radio' && (
            <div>
              {q.options.map((opt: string) => (
                <label key={opt} style={{ display: 'block', margin: '0.5rem 0' }}>
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
          {q.type === 'slider' && (
            <input
              type="range"
              min={q.min}
              max={q.max}
              value={answers[q.key] || q.min}
              onChange={(e) => setAnswers({ ...answers, [q.key]: parseInt(e.target.value) })}
              style={{ width: '100%' }}
            />
          )}
          {q.type === 'text' && (
            <textarea
              value={answers[q.key] || ''}
              onChange={(e) => setAnswers({ ...answers, [q.key]: e.target.value })}
              maxLength={q.max_chars}
              style={{ width: '100%', minHeight: '60px' }}
            />
          )}
        </div>
      ))}
      <button onClick={onSubmit} className="btn">Check-in speichern</button>
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