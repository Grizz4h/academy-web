// ✅ ACTIVE: Renderer v4 for Meta-Scan modules (M* or META)
// Purpose: Entire-game meta analysis with axes, timeline markers, and causal chains

import { useState } from 'react';
import styles from './DrillRenderer.module.css';

interface DrillRendererV4Props {
  drill: any;
  answers: any;
  setAnswers: (next: any) => void;
  session?: any;
}

interface TimelineMarker {
  timestamp: string;
  category: string;
  team: string;
  note: string;
}

interface CausalChain {
  cause: string;
  trigger: string;
  consequence: string;
}

export default function DrillRendererV4({ drill, answers, setAnswers, session }: DrillRendererV4Props) {
  const currentPhase = session?.current_phase || 'PRE';
  
  // Initialize meta structure if not exists
  if (!answers.meta) {
    answers.meta = {
      axes: {},
      timeline: [],
      chains: [],
      postSummary: {}
    };
  }

  // Timeline marker form state
  const [markerForm, setMarkerForm] = useState<Partial<TimelineMarker>>({
    timestamp: '',
    category: '',
    team: '',
    note: ''
  });

  // Causal chain form state
  const [chainForm, setChainForm] = useState<Partial<CausalChain>>({
    cause: '',
    trigger: '',
    consequence: ''
  });

  const metaAxes = [
    { key: 'structure', label: 'Struktur-Stabilität', description: 'Wie stabil bleibt die Formation?' },
    { key: 'compactness', label: 'Kompaktheit', description: 'Abstände, Layers, Closing-Speed' },
    { key: 'decision_time', label: 'Entscheidungszeit', description: 'Mit/ohne Puck - schnell oder zögernd?' },
    { key: 'chance_quality', label: 'Chancenqualität', description: 'Für/Gegen - Slot vs. Perimeter' },
    { key: 'turnover_pressure', label: 'Turnover-Druck', description: 'Wie oft kippt es durch Puckverluste?' }
  ];

  const markerCategories = ['Turnover', 'Entry', 'Exit', 'Chance', 'Goal', 'Penalty', 'Momentum'];
  const causeOptions = ['Gap', 'Bad Exit', 'Lost F2', 'Late Backcheck', 'Bad Change', 'Other'];
  const triggerOptions = ['Turnover', 'Chip', 'Stretch Pass', 'Wall Battle Lost', 'Breakout Failed', 'Other'];
  const consequenceOptions = ['Rush', 'Zone Time', 'Slot Chance', 'Goal Against', 'Momentum Shift', 'Other'];

  const addMarker = () => {
    if (!markerForm.category || !markerForm.team) {
      alert('Kategorie und Team sind Pflichtfelder');
      return;
    }
    const newMarker: TimelineMarker = {
      timestamp: markerForm.timestamp || '',
      category: markerForm.category || '',
      team: markerForm.team || '',
      note: markerForm.note || ''
    };
    setAnswers({
      ...answers,
      meta: {
        ...answers.meta,
        timeline: [...(answers.meta.timeline || []), newMarker]
      }
    });
    // Reset form
    setMarkerForm({ timestamp: '', category: '', team: '', note: '' });
  };

  const removeMarker = (index: number) => {
    const newTimeline = [...answers.meta.timeline];
    newTimeline.splice(index, 1);
    setAnswers({
      ...answers,
      meta: { ...answers.meta, timeline: newTimeline }
    });
  };

  const addChain = () => {
    if (!chainForm.cause || !chainForm.trigger || !chainForm.consequence) {
      alert('Alle drei Felder sind Pflicht für eine Chain');
      return;
    }
    const newChain: CausalChain = {
      cause: chainForm.cause!,
      trigger: chainForm.trigger!,
      consequence: chainForm.consequence!
    };
    setAnswers({
      ...answers,
      meta: {
        ...answers.meta,
        chains: [...(answers.meta.chains || []), newChain]
      }
    });
    // Reset form
    setChainForm({ cause: '', trigger: '', consequence: '' });
  };

  const removeChain = (index: number) => {
    const newChains = [...answers.meta.chains];
    newChains.splice(index, 1);
    setAnswers({
      ...answers,
      meta: { ...answers.meta, chains: newChains }
    });
  };

  const updateAxis = (key: string, value: number | null) => {
    setAnswers({
      ...answers,
      meta: {
        ...answers.meta,
        axes: {
          ...answers.meta.axes,
          [key]: value
        }
      }
    });
  };

  const updatePostSummary = (key: string, value: any) => {
    setAnswers({
      ...answers,
      meta: {
        ...answers.meta,
        postSummary: {
          ...answers.meta.postSummary,
          [key]: value
        }
      }
    });
  };

  // PRE Phase - just intro
  if (currentPhase === 'PRE') {
    return (
      <div className={styles.v4Container}>
        <div className={styles.versionBadge}>
          [Renderer V4: Meta-Scan]
        </div>
        <div className="card">
          <h3>🎯 {drill.title || 'Vorbereitung: Meta-Scan'}</h3>
          {drill.description && (
            <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)', marginBottom: '1rem' }}>
              {drill.description}
            </p>
          )}
          <p>
            Du analysierst das <strong>Gesamtspiel</strong> über drei Drittel hinweg.
          </p>
          <p>
            Pro Drittel (P1/P2/P3) wirst du:
          </p>
          <ul>
            <li>5 Meta-Achsen bewerten (Struktur, Kompaktheit, Entscheidungszeit, Chancen, Turnover)</li>
            <li>Ereignis-Marker in der Timeline setzen</li>
            <li>Ursache-Wirkung-Ketten identifizieren</li>
          </ul>
          <p>
            Am Ende (POST) fasst du alles zusammen und identifizierst Root Causes + Adjustments.
          </p>
        </div>
      </div>
    );
  }

  // POST Phase - Summary
  if (currentPhase === 'POST') {
    return (
      <div className={styles.v4Container}>
        <div className={styles.versionBadge}>
          [Renderer V4: Meta-Scan]
        </div>
        <div className="card">
          <h3>Zusammenfassung & Root Cause Analyse</h3>
          
          <div className={styles.section}>
            <label className={styles.label}>3-Satz Summary (Gesamtspiel)</label>
            <textarea
              value={answers.meta.postSummary.summary || ''}
              onChange={(e) => updatePostSummary('summary', e.target.value)}
              className={styles.textarea}
              rows={3}
              placeholder="z.B. 'Team war strukturell stabil, aber Entscheidungen zu langsam. Nach Turnovers oft Chancen gegen. Im 3. Drittel Momentum verloren.'"
              maxLength={500}
            />
          </div>

          <div className={styles.section}>
            <label className={styles.label}>Top 1 Problem (Root Cause)</label>
            <input
              type="text"
              value={answers.meta.postSummary.rootCause || ''}
              onChange={(e) => updatePostSummary('rootCause', e.target.value)}
              className={styles.input}
              placeholder="z.B. 'Zu große Gaps nach Bad Exits'"
              maxLength={150}
            />
          </div>

          <div className={styles.section}>
            <label className={styles.label}>Top 1 Fix/Adjustment</label>
            <input
              type="text"
              value={answers.meta.postSummary.fix || ''}
              onChange={(e) => updatePostSummary('fix', e.target.value)}
              className={styles.input}
              placeholder="z.B. 'F2 muss tiefer bleiben bei Exit-Versuchen'"
              maxLength={150}
            />
          </div>

          <div className={styles.section}>
            <label className={styles.label}>Confidence (Wie sicher ist deine Analyse?)</label>
            <div className={styles.confidenceScale}>
              {[1, 2, 3, 4, 5].map(val => (
                <button
                  key={val}
                  type="button"
                  className={`${styles.scaleButton} ${answers.meta.postSummary.confidence === val ? styles.selected : ''}`}
                  onClick={() => updatePostSummary('confidence', val)}
                >
                  {val}
                </button>
              ))}
            </div>
            <div className={styles.scaleLabels}>
              <span>Unsicher</span>
              <span>Sehr sicher</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // P1, P2, P3 - Main Meta Analysis
  const periodNumber = currentPhase === 'P1' ? '1.' : currentPhase === 'P2' ? '2.' : '3.';
  
  return (
    <div className={styles.v4Container}>
      <div className={styles.versionBadge}>
        [Renderer V4: Meta-Scan - {periodNumber} Drittel]
      </div>

      {/* Meta Axes */}
      <div className="card">
        <h3>Meta-Scan Achsen ({periodNumber} Drittel)</h3>
        <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)', marginBottom: '1.5rem' }}>
          Bewerte jede Achse von 1 (schwach) bis 5 (stark). Du kannst auch "unsicher" lassen (keine Auswahl).
        </p>

        {metaAxes.map(axis => (
          <div key={axis.key} className={styles.axisRow}>
            <div className={styles.axisInfo}>
              <strong>{axis.label}</strong>
              <span className={styles.axisDescription}>{axis.description}</span>
            </div>
            <div className={styles.axisScale}>
              <button
                type="button"
                className={`${styles.clearButton} ${answers.meta.axes[axis.key] === null ? styles.selected : ''}`}
                onClick={() => updateAxis(axis.key, null)}
                title="Unsicher / keine Bewertung"
              >
                ∅
              </button>
              {[1, 2, 3, 4, 5].map(val => (
                <button
                  key={val}
                  type="button"
                  className={`${styles.scaleButton} ${answers.meta.axes[axis.key] === val ? styles.selected : ''}`}
                  onClick={() => updateAxis(axis.key, val)}
                >
                  {val}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Timeline Markers */}
      <div className="card">
        <h3>Timeline Marker ({periodNumber} Drittel)</h3>
        <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)', marginBottom: '1rem' }}>
          Halte wichtige Ereignisse fest (z.B. Turnover → Chance, Momentum-Wechsel).
        </p>

        <div className={styles.markerForm}>
          <input
            type="text"
            value={markerForm.timestamp || ''}
            onChange={(e) => setMarkerForm({ ...markerForm, timestamp: e.target.value })}
            placeholder="Zeit (z.B. 5:23 oder Shift #2)"
            className={styles.markerInput}
          />
          <select
            value={markerForm.category || ''}
            onChange={(e) => setMarkerForm({ ...markerForm, category: e.target.value })}
            className={styles.markerSelect}
          >
            <option value="">Kategorie wählen*</option>
            {markerCategories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <select
            value={markerForm.team || ''}
            onChange={(e) => setMarkerForm({ ...markerForm, team: e.target.value })}
            className={styles.markerSelect}
          >
            <option value="">Team*</option>
            <option value="for">For/Us</option>
            <option value="against">Against/Them</option>
          </select>
          <input
            type="text"
            value={markerForm.note || ''}
            onChange={(e) => setMarkerForm({ ...markerForm, note: e.target.value })}
            placeholder="Notiz (optional)"
            className={styles.markerInput}
          />
          <button type="button" onClick={addMarker} className={styles.addButton}>
            + Marker
          </button>
        </div>

        {answers.meta.timeline && answers.meta.timeline.length > 0 && (
          <div className={styles.markerList}>
            <h4>Gespeicherte Marker:</h4>
            {answers.meta.timeline.map((marker: TimelineMarker, idx: number) => (
              <div key={idx} className={styles.markerItem}>
                <div className={styles.markerContent}>
                  <span className={styles.markerTime}>{marker.timestamp || 'n/a'}</span>
                  <span className={styles.markerCategory}>{marker.category}</span>
                  <span className={styles.markerTeam}>{marker.team === 'for' ? '🔵 For' : '🔴 Against'}</span>
                  {marker.note && <span className={styles.markerNote}>{marker.note}</span>}
                </div>
                <button
                  type="button"
                  onClick={() => removeMarker(idx)}
                  className={styles.removeButton}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Causal Chain Builder */}
      <div className="card">
        <h3>Causal Chain Builder ({periodNumber} Drittel)</h3>
        <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)', marginBottom: '1rem' }}>
          Identifiziere Ursache → Trigger → Konsequenz Ketten.
        </p>

        <div className={styles.chainForm}>
          <div className={styles.chainStep}>
            <label>Ursache*</label>
            <select
              value={chainForm.cause || ''}
              onChange={(e) => setChainForm({ ...chainForm, cause: e.target.value })}
              className={styles.chainSelect}
            >
              <option value="">Wählen...</option>
              {causeOptions.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
          <span className={styles.chainArrow}>→</span>
          <div className={styles.chainStep}>
            <label>Trigger*</label>
            <select
              value={chainForm.trigger || ''}
              onChange={(e) => setChainForm({ ...chainForm, trigger: e.target.value })}
              className={styles.chainSelect}
            >
              <option value="">Wählen...</option>
              {triggerOptions.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
          <span className={styles.chainArrow}>→</span>
          <div className={styles.chainStep}>
            <label>Konsequenz*</label>
            <select
              value={chainForm.consequence || ''}
              onChange={(e) => setChainForm({ ...chainForm, consequence: e.target.value })}
              className={styles.chainSelect}
            >
              <option value="">Wählen...</option>
              {consequenceOptions.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
          <button type="button" onClick={addChain} className={styles.addButton}>
            + Chain
          </button>
        </div>

        {answers.meta.chains && answers.meta.chains.length > 0 && (
          <div className={styles.chainList}>
            <h4>Gespeicherte Chains:</h4>
            {answers.meta.chains.map((chain: CausalChain, idx: number) => (
              <div key={idx} className={styles.chainItem}>
                <div className={styles.chainContent}>
                  <span>{chain.cause}</span>
                  <span className={styles.chainArrow}>→</span>
                  <span>{chain.trigger}</span>
                  <span className={styles.chainArrow}>→</span>
                  <span>{chain.consequence}</span>
                </div>
                <button
                  type="button"
                  onClick={() => removeChain(idx)}
                  className={styles.removeButton}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
