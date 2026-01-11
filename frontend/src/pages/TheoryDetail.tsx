import { useParams } from 'react-router-dom'
import { useState } from 'react'

export default function TheoryDetail() {
  const { moduleId } = useParams<{ moduleId: string }>()

  // State für einklappbare Kapitel - abhängig vom Modul
  const getInitialState = (moduleId: string) => {
    if (moduleId === 'A1') {
      return {
        rinkIQ: true, // Erstes Kapitel aufgeklappt
        warumZentral: false,
        rollenverstaendnis: false,
        dreiecke: false,
        ordnungChaos: false,
        missverstaendnisse: false,
        zusammenfassung: false,
        // A2 Sektionen (nicht verwendet bei A1)
        raumLinienBreakout: false,
        zonenLinien: false,
        blueLine: false,
        breakoutLogik: false,
        erstePassoption: false,
        raumgefuehl: false,
        linienlogik: false,
        missverstaendnisseA2: false,
        zusammenfassungA2: false,
        // A3 Sektionen (nicht verwendet bei A1/A2)
        transitionGrundlagen: false,
        warumTransition: false,
        tempoDefinition: false,
        warumTempo: false,
        turnovers: false,
        warumTurnovers: false,
        turnoverVerhalten: false,
        turnoverFehler: false,
        rushes: false,
        warumRushes: false,
        rushEntscheidungen: false,
        rushFehler: false,
        backchecking: false,
        warumBackchecking: false,
        backcheckingQualitaet: false,
        backcheckingFehler: false,
        gapControl: false,
        warumGapControl: false,
        gapControlQualitaet: false,
        gapControlFehler: false,
        umschaltmomente: false,
        missverstaendnisseA3: false,
        zusammenfassungA3: false
      }
    } else if (moduleId === 'A3') {
      return {
        // A1 Sektionen (nicht verwendet bei A3)
        rinkIQ: false,
        warumZentral: false,
        rollenverstaendnis: false,
        dreiecke: false,
        ordnungChaos: false,
        missverstaendnisse: false,
        zusammenfassung: false,
        // A2 Sektionen (nicht verwendet bei A3)
        raumLinienBreakout: false,
        zonenLinien: false,
        blueLine: false,
        breakoutLogik: false,
        erstePassoption: false,
        raumgefuehl: false,
        linienlogik: false,
        missverstaendnisseA2: false,
        zusammenfassungA2: false,
        // A3 Sektionen
        transitionGrundlagen: true, // Erstes Kapitel aufgeklappt
        warumTransition: false,
        tempoDefinition: false,
        warumTempo: false,
        turnovers: false,
        warumTurnovers: false,
        turnoverVerhalten: false,
        turnoverFehler: false,
        rushes: false,
        warumRushes: false,
        rushEntscheidungen: false,
        rushFehler: false,
        backchecking: false,
        warumBackchecking: false,
        backcheckingQualitaet: false,
        backcheckingFehler: false,
        gapControl: false,
        warumGapControl: false,
        gapControlQualitaet: false,
        gapControlFehler: false,
        umschaltmomente: false,
        missverstaendnisseA3: false,
        zusammenfassungA3: false
      }
      return {
        // A1 Sektionen (nicht verwendet bei A2)
        rinkIQ: false,
        warumZentral: false,
        rollenverstaendnis: false,
        dreiecke: false,
        ordnungChaos: false,
        missverstaendnisse: false,
        zusammenfassung: false,
        // A2 Sektionen
        raumLinienBreakout: true, // Erstes Kapitel aufgeklappt
        zonenLinien: false,
        blueLine: false,
        breakoutLogik: false,
        erstePassoption: false,
        raumgefuehl: false,
        linienlogik: false,
        missverstaendnisseA2: false,
        zusammenfassungA2: false,
        // A3 Sektionen (nicht verwendet bei A2)
        transitionGrundlagen: false,
        warumTransition: false,
        tempoDefinition: false,
        warumTempo: false,
        turnovers: false,
        warumTurnovers: false,
        turnoverVerhalten: false,
        turnoverFehler: false,
        rushes: false,
        warumRushes: false,
        rushEntscheidungen: false,
        rushFehler: false,
        backchecking: false,
        warumBackchecking: false,
        backcheckingQualitaet: false,
        backcheckingFehler: false,
        gapControl: false,
        warumGapControl: false,
        gapControlQualitaet: false,
        gapControlFehler: false,
        umschaltmomente: false,
        missverstaendnisseA3: false,
        zusammenfassungA3: false
      }
    }
    return {
      rinkIQ: true,
      warumZentral: false,
      rollenverstaendnis: false,
      dreiecke: false,
      ordnungChaos: false,
      missverstaendnisse: false,
      zusammenfassung: false,
      raumLinienBreakout: true,
      zonenLinien: false,
      blueLine: false,
      breakoutLogik: false,
      erstePassoption: false,
      raumgefuehl: false,
      linienlogik: false,
      missverstaendnisseA2: false,
      zusammenfassungA2: false,
      transitionGrundlagen: true,
      warumTransition: false,
      tempoDefinition: false,
      warumTempo: false,
      turnovers: false,
      warumTurnovers: false,
      turnoverVerhalten: false,
      turnoverFehler: false,
      rushes: false,
      warumRushes: false,
      rushEntscheidungen: false,
      rushFehler: false,
      backchecking: false,
      warumBackchecking: false,
      backcheckingQualitaet: false,
      backcheckingFehler: false,
      gapControl: false,
      warumGapControl: false,
      gapControlQualitaet: false,
      gapControlFehler: false,
      umschaltmomente: false,
      missverstaendnisseA3: false,
      zusammenfassungA3: false
    }
  }

  const [expandedSections, setExpandedSections] = useState(getInitialState(moduleId || ''))

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const getDetailedTheory = (moduleId: string) => {
    if (moduleId === 'A1') {
      return (
        <div className="theory-content">
          <div className="theory-header">
            <div className="theory-badge">TRACK A1</div>
            <h1>Rink IQ & Rollenverständnis</h1>
            <p className="theory-subtitle">Spiel lesen lernen: Ordnung erkennen, Chaos einordnen</p>
          </div>

          <div className="theory-overview">
            <p><strong>Rink IQ & Rollenverständnis</strong> ist das Fundament des modernen Eishockeys. Es geht darum, das Spiel zu lesen, bevor es passiert – Antizipation statt Reaktion. Spieler mit hohem Rink IQ erkennen Ordnung im Chaos und verstehen ihre funktionalen Rollen (Center, Winger, Defense) sowie die Bedeutung von Dreiecken als kleinste spielbare Einheit.</p>
          </div>

          <section className="theory-section">
            <button
              className="section-toggle"
              onClick={() => toggleSection('rinkIQ')}
              aria-expanded={expandedSections.rinkIQ}
            >
              <h2>Was ist Rink IQ?</h2>
              <span className="toggle-icon">{expandedSections.rinkIQ ? '−' : '+'}</span>
            </button>
            {expandedSections.rinkIQ && (
              <div className="section-content">
                <p>
                  Rink IQ beschreibt die Fähigkeit eines Spielers, das Spiel zu lesen, <strong>bevor</strong> es sich vollständig entfaltet.
                  Es geht nicht um Talent, Tempo oder Technik, sondern um <em>Antizipation</em>: Wer versteht, was gleich passieren wird,
                  ist früher am richtigen Ort – oft ohne spektakuläre Aktionen.
                </p>

                <p>Rink IQ zeigt sich nicht in Highlights, sondern in unscheinbaren, wiederholbaren Entscheidungen:</p>
                <ul>
                  <li>richtige Position vor dem Pass</li>
                  <li>richtige Höhe im Angriff</li>
                  <li>richtige Unterstützung im Moment des Puckverlusts</li>
                </ul>

                <div className="highlight-box">
                  <strong>Kurz:</strong> Rink IQ ist mentale Ordnung im bewegten System Eishockey.
                </div>
              </div>
            )}
          </section>

          <section className="theory-section">
            <button
              className="section-toggle"
              onClick={() => toggleSection('warumZentral')}
              aria-expanded={expandedSections.warumZentral}
            >
              <h2>Warum ist Rink IQ zentral?</h2>
              <span className="toggle-icon">{expandedSections.warumZentral ? '−' : '+'}</span>
            </button>
            {expandedSections.warumZentral && (
              <div className="section-content">
                <p>
                  Eishockey ist kein Abfolge-Spiel („erst A, dann B"), sondern ein <strong>permanenter Zustandswechsel</strong>:
                </p>
                <ul>
                  <li>Angriff → Umschalten</li>
                  <li>Druck → Absicherung</li>
                  <li>Ordnung → Chaos</li>
                </ul>

                <p>
                  Spieler mit hohem Rink IQ <strong>reagieren nicht</strong>, sie <strong>antizipieren</strong>.
                  Spieler mit niedrigem Rink IQ reagieren zu spät – und wirken hektisch, obwohl sie sich viel bewegen.
                </p>

                <p>Rink IQ ist der Unterschied zwischen:</p>
                <div className="comparison">
                  <div className="comparison-item bad">„immer knapp zu spät"</div>
                  <div className="comparison-item good">„scheinbar mühelos richtig"</div>
                </div>
              </div>
            )}
          </section>

          <section className="theory-section">
            <button
              className="section-toggle"
              onClick={() => toggleSection('rollenverstaendnis')}
              aria-expanded={expandedSections.rollenverstaendnis}
            >
              <h2>Rollenverständnis: Ordnung im Chaos</h2>
              <span className="toggle-icon">{expandedSections.rollenverstaendnis ? '−' : '+'}</span>
            </button>
            {expandedSections.rollenverstaendnis && (
              <div className="section-content">
                <p>
                  Rollen sind keine starren Positionen, sondern <strong>Funktionszustände</strong>, die sich je nach Spielsituation verändern.
                  Trotzdem gilt: Ohne klares Rollenverständnis entsteht Chaos – selbst bei talentierten Spielern.
                </p>
              </div>
            )}
          </section>

          <section className="theory-section">
            <button
              className="section-toggle"
              onClick={() => toggleSection('dreiecke')}
              aria-expanded={expandedSections.dreiecke}
            >
              <h2>Dreiecke – die kleinste funktionierende Einheit</h2>
              <span className="toggle-icon">{expandedSections.dreiecke ? '−' : '+'}</span>
            </button>
            {expandedSections.dreiecke && (
              <div className="section-content">
                <div className="concept-card">
                  <h3>Was ist ein Dreieck?</h3>
                  <p>Ein Dreieck ist eine stabile Pass- und Absicherungsstruktur aus drei Spielern. Es entsteht ständig neu – im Breakout, im Forecheck, im Angriff.</p>

                  <h3>Warum ist das wichtig?</h3>
                  <p>Dreiecke schaffen:</p>
                  <ul>
                    <li>zwei Passoptionen</li>
                    <li>eine Absicherung</li>
                    <li>klare Entscheidungslogik</li>
                  </ul>
                  <p>Ohne Dreiecke gibt es nur Einzelaktionen.</p>

                  <h3>Woran erkennt man funktionierende Dreiecke?</h3>
                  <ul>
                    <li>Spieler stehen nicht auf einer Linie</li>
                    <li>Abstände sind passfähig, nicht maximal</li>
                    <li>ein Spieler ist immer „unterstützend" positioniert</li>
                  </ul>

                  <h3>Typische Fehler</h3>
                  <ul>
                    <li>alle laufen zum Puck</li>
                    <li>Dreiecke brechen bei Druck sofort auseinander</li>
                    <li>Fokus auf Zielraum statt Struktur</li>
                  </ul>
                </div>
              </div>
            )}
          </section>

          <section className="theory-section">
            <button
              className="section-toggle"
              onClick={() => toggleSection('ordnungChaos')}
              aria-expanded={expandedSections.ordnungChaos}
            >
              <h2>Ordnung vs. Chaos – das Grundprinzip</h2>
              <span className="toggle-icon">{expandedSections.ordnungChaos ? '−' : '+'}</span>
            </button>
            {expandedSections.ordnungChaos && (
              <div className="section-content">
                <p>Eishockey pendelt ständig zwischen geordneten Phasen und chaotischen Phasen.</p>

                <div className="phases">
                  <div className="phase">
                    <h4>Ordnung</h4>
                    <ul>
                      <li>kontrollierter Aufbau</li>
                      <li>klare Rollen</li>
                    </ul>
                  </div>
                  <div className="phase">
                    <h4>Chaos</h4>
                    <ul>
                      <li>Rebounds</li>
                      <li>Turnovers</li>
                      <li>Scramble</li>
                    </ul>
                  </div>
                </div>

                <p>
                  Rink IQ bedeutet, zu erkennen: <strong>Wann halte ich Ordnung? Wann akzeptiere ich Chaos?</strong>
                </p>

                <p>
                  Spieler mit niedrigem Rink IQ versuchen, Chaos zu „gewinnen".
                  Spieler mit hohem Rink IQ <strong>überleben Chaos</strong> und stellen danach wieder Ordnung her.
                </p>
              </div>
            )}
          </section>

          <section className="theory-section">
            <button
              className="section-toggle"
              onClick={() => toggleSection('missverstaendnisse')}
              aria-expanded={expandedSections.missverstaendnisse}
            >
              <h2>Häufige Missverständnisse</h2>
              <span className="toggle-icon">{expandedSections.missverstaendnisse ? '−' : '+'}</span>
            </button>
            {expandedSections.missverstaendnisse && (
              <div className="section-content">
                <div className="myths">
                  <div className="myth">
                    <div>
                      <strong>❌ „Rink IQ = langsam, clever spielen"</strong><br/>
                      → falsch. Rink IQ kann sehr schnell sein – aber zielgerichtet.
                    </div>
                  </div>
                  <div className="myth">
                    <div>
                      <strong>❌ „Rollen schränken Kreativität ein"</strong><br/>
                      → falsch. Rollen ermöglichen Kreativität, weil sie Struktur geben.
                    </div>
                  </div>
                  <div className="myth">
                    <div>
                      <strong>❌ „Dreiecke sind ein System"</strong><br/>
                      → nein. Dreiecke sind ein Prinzip, systemunabhängig.
                    </div>
                  </div>
                </div>
              </div>
            )}
          </section>

          <section className="theory-section">
            <button
              className="section-toggle"
              onClick={() => toggleSection('zusammenfassung')}
              aria-expanded={expandedSections.zusammenfassung}
            >
              <h2>Kernzusammenfassung</h2>
              <span className="toggle-icon">{expandedSections.zusammenfassung ? '−' : '+'}</span>
            </button>
            {expandedSections.zusammenfassung && (
              <div className="section-content">
                <div className="summary-grid">
                  <div className="summary-item">
                    <strong>Rink IQ</strong> = Antizipation + Strukturverständnis
                  </div>
                  <div className="summary-item">
                    <strong>Rollen</strong> sind funktional, nicht statisch
                  </div>
                  <div className="summary-item">
                    <strong>Center</strong> stabilisiert das Zentrum
                  </div>
                  <div className="summary-item">
                    <strong>Winger</strong> geben Breite und Sicherheit
                  </div>
                  <div className="summary-item">
                    <strong>Defense</strong> steuert Risiko und Tempo
                  </div>
                  <div className="summary-item">
                    <strong>Dreiecke</strong> sind die Basis jeder Spielform
                  </div>
                  <div className="summary-item">
                    <strong>Ordnung herstellen</strong> ist wichtiger als Chaos zu gewinnen
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>
      )
    }
    if (moduleId === 'A2') {
      return (
        <div className="theory-content">
          <div className="theory-header">
            <div className="theory-badge">TRACK A2</div>
            <h1>Raum, Linien & Breakout-Logik</h1>
            <p className="theory-subtitle">Zonen verstehen, Entscheidungen lesen, Spiel eröffnen</p>
          </div>

          <div className="theory-overview">
            <p><strong>Raum, Linien & Breakout-Logik</strong> beschreibt die räumliche Organisation des Eishockeys und wie Teams aus der eigenen Zone ins Spiel kommen. Es geht um Entscheidungslogik: Wo ist Raum? Wo ist Druck? Welche Linie ist Grenze, welche Chance? Breakouts sind Antworten auf Raum- und Drucksituationen, keine festen Spielzüge.</p>
          </div>

          <section className="theory-section">
            <button
              className="section-toggle"
              onClick={() => toggleSection('raumLinienBreakout')}
              aria-expanded={expandedSections.raumLinienBreakout}
            >
              <h2>Was ist mit Raum, Linien & Breakout-Logik gemeint?</h2>
              <span className="toggle-icon">{expandedSections.raumLinienBreakout ? '−' : '+'}</span>
            </button>
            {expandedSections.raumLinienBreakout && (
              <div className="section-content">
                <p>
                  Dieses Modul beschreibt wie Eishockey räumlich organisiert ist und wie Teams aus der eigenen Zone ins Spiel kommen.
                  Es geht nicht um ein bestimmtes System, sondern um Entscheidungslogik:
                </p>
                <ul>
                  <li>Wo ist Raum?</li>
                  <li>Wo ist Druck?</li>
                  <li>Welche Linie ist Grenze, welche ist Chance?</li>
                  <li>Wann ist ein Pass sinnvoll – und wann gefährlich?</li>
                </ul>

                <div className="highlight-box">
                  <strong>Breakouts sind keine festen Spielzüge. Sie sind Antworten auf Raum- und Drucksituationen.</strong>
                </div>
              </div>
            )}
          </section>

          <section className="theory-section">
            <button
              className="section-toggle"
              onClick={() => toggleSection('zonenLinien')}
              aria-expanded={expandedSections.zonenLinien}
            >
              <h2>Zonen & Linien – das räumliche Grundgerüst</h2>
              <span className="toggle-icon">{expandedSections.zonenLinien ? '−' : '+'}</span>
            </button>
            {expandedSections.zonenLinien && (
              <div className="section-content">
                <h3>Zonen: Defensiv, Neutral, Offensiv</h3>

                <h4>Was ist das?</h4>
                <p>Das Spielfeld ist in drei Zonen unterteilt:</p>
                <ul>
                  <li><strong>Defensivzone:</strong> eigener Schutzraum, höchster Risikobereich</li>
                  <li><strong>Neutralzone:</strong> Übergangsraum, Tempo- und Strukturzone</li>
                  <li><strong>Offensivzone:</strong> Angriffsraum, Zielzone</li>
                </ul>

                <h4>Warum ist das wichtig?</h4>
                <p>Jede Zone hat andere Prioritäten:</p>
                <ul>
                  <li>In der Defensivzone zählt Kontrolle</li>
                  <li>In der Neutralzone zählt Ordnung</li>
                  <li>In der Offensivzone zählt Kreativität</li>
                </ul>

                <p><strong>Fehler entstehen, wenn Spieler mit der falschen Logik in der falschen Zone spielen.</strong></p>

                <h4>Woran erkennt man Zonenverständnis im Spiel?</h4>
                <ul>
                  <li>Geduld tief hinten</li>
                  <li>klare Entscheidungen an den Linien</li>
                  <li>weniger Turnovers im Zentrum</li>
                </ul>

                <h4>Typische Fehler</h4>
                <ul>
                  <li>Risiko-Pässe in der Defensivzone</li>
                  <li>unnötiges Dumpen in der Neutralzone</li>
                  <li>überhastete Abschlüsse in der Offensivzone</li>
                </ul>
              </div>
            )}
          </section>

          <section className="theory-section">
            <button
              className="section-toggle"
              onClick={() => toggleSection('blueLine')}
              aria-expanded={expandedSections.blueLine}
            >
              <h2>Die Blue Line – Grenze und Entscheidungspunkt</h2>
              <span className="toggle-icon">{expandedSections.blueLine ? '−' : '+'}</span>
            </button>
            {expandedSections.blueLine && (
              <div className="section-content">
                <h4>Was ist das?</h4>
                <p><strong>Die blaue Linie ist keine Markierung, sondern eine Entscheidungsschwelle.</strong></p>

                <h4>Warum ist sie wichtig?</h4>
                <p>An der Blue Line entscheidet sich:</p>
                <ul>
                  <li>Puckbesitz oder Turnover</li>
                  <li>Angriff oder Gegentor</li>
                  <li>Kontrolle oder Chaos</li>
                </ul>

                <h4>Woran erkennt man gutes Line-Management?</h4>
                <ul>
                  <li>Puck wird mit Kontrolle über die Linie gebracht oder bewusst abgelegt</li>
                  <li>Spieler sind in Bewegung, nicht statisch wartend</li>
                  <li>Support ist sichtbar vor der Linie</li>
                </ul>

                <h4>Typische Fehler</h4>
                <ul>
                  <li>„Noch schnell reinchippen" ohne Support</li>
                  <li>stehende Mitspieler an der Linie</li>
                  <li>Puckverluste mit offenem Eis dahinter</li>
                </ul>
              </div>
            )}
          </section>

          <section className="theory-section">
            <button
              className="section-toggle"
              onClick={() => toggleSection('breakoutLogik')}
              aria-expanded={expandedSections.breakoutLogik}
            >
              <h2>Breakout-Logik – Spiel eröffnen statt befreien</h2>
              <span className="toggle-icon">{expandedSections.breakoutLogik ? '−' : '+'}</span>
            </button>
            {expandedSections.breakoutLogik && (
              <div className="section-content">
                <h4>Was ist ein Breakout wirklich?</h4>

                <div className="comparison">
                  <div className="comparison-item bad">
                    <strong>Nicht:</strong><br/>
                    „Puck raus aus der Zone"
                  </div>
                  <div className="comparison-item good">
                    <strong>Sondern:</strong><br/>
                    geordneter Übergang von Verteidigung zu Angriff
                  </div>
                </div>

                <p><strong>Ein guter Breakout:</strong></p>
                <ul>
                  <li>erhält Puckbesitz</li>
                  <li>erzeugt Struktur</li>
                  <li>zwingt den Gegner zur Rückwärtsbewegung</li>
                </ul>
              </div>
            )}
          </section>

          <section className="theory-section">
            <button
              className="section-toggle"
              onClick={() => toggleSection('erstePassoption')}
              aria-expanded={expandedSections.erstePassoption}
            >
              <h2>Erste Passoption – der Schlüssel</h2>
              <span className="toggle-icon">{expandedSections.erstePassoption ? '−' : '+'}</span>
            </button>
            {expandedSections.erstePassoption && (
              <div className="section-content">
                <h4>Was ist das?</h4>
                <p><strong>Die erste Passoption ist die nächste sichere Entscheidung nach Puckgewinn.</strong></p>

                <h4>Warum ist sie entscheidend?</h4>
                <p>Der erste Pass bestimmt:</p>
                <ul>
                  <li>Tempo</li>
                  <li>Ordnung</li>
                  <li>Erfolgswahrscheinlichkeit des gesamten Angriffs</li>
                </ul>

                <h4>Woran erkennt man gute erste Optionen?</h4>
                <ul>
                  <li>Spieler bieten sich vor dem Puckgewinn an</li>
                  <li>klare Winkel, nicht direkt im Druck</li>
                  <li>Pass geht weg vom Forecheck, nicht hinein</li>
                </ul>

                <h4>Typische Fehler</h4>
                <ul>
                  <li>erst schauen, dann anbieten (zu spät)</li>
                  <li>Pässe entlang der Bande ohne Anschluss</li>
                  <li>vertikale Pässe durch den Slot unter Druck</li>
                </ul>
              </div>
            )}
          </section>

          <section className="theory-section">
            <button
              className="section-toggle"
              onClick={() => toggleSection('raumgefuehl')}
              aria-expanded={expandedSections.raumgefuehl}
            >
              <h2>Raumgefühl – sehen, was nicht offensichtlich ist</h2>
              <span className="toggle-icon">{expandedSections.raumgefuehl ? '−' : '+'}</span>
            </button>
            {expandedSections.raumgefuehl && (
              <div className="section-content">
                <h4>Was bedeutet Raumgefühl?</h4>
                <p><strong>Raumgefühl ist die Fähigkeit, freien Raum zu erkennen, bevor er genutzt wird.</strong></p>

                <p>Es geht nicht nur um offenen Raum, sondern um:</p>
                <ul>
                  <li>entstehenden Raum</li>
                  <li>verlagerten Druck</li>
                  <li>freie Anschlusswege</li>
                </ul>

                <h4>Warum ist das wichtig?</h4>
                <p><strong>Gegner verteidigen Puck, nicht Raum. Wer Raum erkennt, spielt vor der Defensive.</strong></p>

                <h4>Woran erkennt man gutes Raumgefühl?</h4>
                <ul>
                  <li>Spieler lösen sich früh aus Deckungsschatten</li>
                  <li>Puck wird verlagert, nicht erzwungen</li>
                  <li>Tempo entsteht durch Pass, nicht durch Sprint</li>
                </ul>

                <h4>Typische Fehler</h4>
                <ul>
                  <li>alle Spieler bewegen sich zum Puck</li>
                  <li>freier Raum wird ignoriert, weil er „unauffällig" ist</li>
                  <li>Tempo wird mit Geschwindigkeit verwechselt</li>
                </ul>
              </div>
            )}
          </section>

          <section className="theory-section">
            <button
              className="section-toggle"
              onClick={() => toggleSection('linienlogik')}
              aria-expanded={expandedSections.linienlogik}
            >
              <h2>Linienlogik statt Systemdenken</h2>
              <span className="toggle-icon">{expandedSections.linienlogik ? '−' : '+'}</span>
            </button>
            {expandedSections.linienlogik && (
              <div className="section-content">
                <p><strong>Ein häufiger Denkfehler:</strong></p>
                <p>„Wir spielen System X, also machen wir Y."</p>

                <p><strong>In Wahrheit gilt:</strong></p>
                <ul>
                  <li>Druck entscheidet, nicht System</li>
                  <li>Raum entscheidet, nicht Playbook</li>
                  <li>Linien geben Regeln vor, keine Spielzüge</li>
                </ul>

                <p><strong>Gute Teams passen ihre Breakouts situativ an:</strong></p>
                <ul>
                  <li>starker Forecheck → kürzer, sicherer</li>
                  <li>passiver Forecheck → breiter, kontrollierter</li>
                  <li>Wechselchaos → Tempo rausnehmen</li>
                </ul>
              </div>
            )}
          </section>

          <section className="theory-section">
            <button
              className="section-toggle"
              onClick={() => toggleSection('missverstaendnisseA2')}
              aria-expanded={expandedSections.missverstaendnisseA2}
            >
              <h2>Typische Missverständnisse</h2>
              <span className="toggle-icon">{expandedSections.missverstaendnisseA2 ? '−' : '+'}</span>
            </button>
            {expandedSections.missverstaendnisseA2 && (
              <div className="section-content">
                <div className="comparison">
                  <div className="comparison-item bad">
                    <strong>❌ „Ein Breakout ist erfolgreich, wenn der Puck raus ist"</strong><br/>
                    → nein. Erfolgreich ist er nur bei kontrolliertem Anschluss.
                  </div>
                  <div className="comparison-item bad">
                    <strong>❌ „Die Bande ist immer sicher"</strong><br/>
                    → nein. Die Bande ist oft eine Falle, wenn kein Support da ist.
                  </div>
                  <div className="comparison-item bad">
                    <strong>❌ „Tempo löst Druck"</strong><br/>
                    → nein. Struktur löst Druck, Tempo nutzt ihn.
                  </div>
                </div>
              </div>
            )}
          </section>

          <section className="theory-section">
            <button
              className="section-toggle"
              onClick={() => toggleSection('zusammenfassungA2')}
              aria-expanded={expandedSections.zusammenfassungA2}
            >
              <h2>Kernzusammenfassung</h2>
              <span className="toggle-icon">{expandedSections.zusammenfassungA2 ? '−' : '+'}</span>
            </button>
            {expandedSections.zusammenfassungA2 && (
              <div className="section-content">
                <div className="summary-grid">
                  <div className="summary-item">
                    <strong>Zonen</strong> verlangen unterschiedliche Entscheidungen
                  </div>
                  <div className="summary-item">
                    <strong>Blue Line</strong> ist eine Risiko-Grenze
                  </div>
                  <div className="summary-item">
                    <strong>Breakouts</strong> sind Entscheidungslogik, keine Spielzüge
                  </div>
                  <div className="summary-item">
                    <strong>Erster Pass</strong> ist der wichtigste
                  </div>
                  <div className="summary-item">
                    <strong>Raum</strong> entsteht durch Antizipation, nicht durch Sprint
                  </div>
                  <div className="summary-item">
                    <strong>Linien</strong> geben Regeln vor, Systeme nur Rahmen
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>
      )
    }
    if (moduleId === 'A3') {
      return (
        <div className="theory-content">
          <div className="theory-header">
            <div className="theory-badge">TRACK A3</div>
            <h1>Transition & Tempo</h1>
            <p className="theory-subtitle">Umschaltmomente erkennen, Tempo kontrollieren, Chaos nutzen</p>
          </div>

          <div className="theory-overview">
            <p><strong>Transition & Tempo</strong> behandelt die gefährlichsten Momente im Eishockey: Umschaltmomente zwischen Angriff und Verteidigung. Es geht um das Erkennen von Turnovers, die Kontrolle von Tempo, effektives Backchecking und Gap Control. Transition entscheidet Spiele – nicht Systeme.</p>
          </div>

          <section className="theory-section">
            <button
              className="section-toggle"
              onClick={() => toggleSection('transitionGrundlagen')}
              aria-expanded={expandedSections.transitionGrundlagen}
            >
              <h2>Was ist Transition im Eishockey?</h2>
              <span className="toggle-icon">{expandedSections.transitionGrundlagen ? '−' : '+'}</span>
            </button>
            {expandedSections.transitionGrundlagen && (
              <div className="section-content">
                <p>
                  Transition bezeichnet alle Umschaltmomente zwischen Angriff und Verteidigung – unabhängig davon, in welcher Zone sie passieren.
                  Konkret heißt das:
                </p>
                <ul>
                  <li>Angriff → Verteidigung (nach Puckverlust)</li>
                  <li>Verteidigung → Angriff (nach Puckgewinn)</li>
                </ul>

                <p><strong>Transition ist kein eigener Spielzustand, sondern der gefährlichste Moment im Spiel, weil:</strong></p>
                <ul>
                  <li>Ordnung gerade zerfällt</li>
                  <li>Abstände instabil sind</li>
                  <li>Rollen sich neu sortieren müssen</li>
                </ul>
              </div>
            )}
          </section>

          <section className="theory-section">
            <button
              className="section-toggle"
              onClick={() => toggleSection('warumTransition')}
              aria-expanded={expandedSections.warumTransition}
            >
              <h2>Warum ist Transition so spielentscheidend?</h2>
              <span className="toggle-icon">{expandedSections.warumTransition ? '−' : '+'}</span>
            </button>
            {expandedSections.warumTransition && (
              <div className="section-content">
                <p>Die meisten hochwertigen Torchancen entstehen nicht aus aufgebautem Spiel, sondern aus:</p>
                <ul>
                  <li>Turnovers</li>
                  <li>unklaren Zuständigkeiten</li>
                  <li>verzögerten Reaktionen</li>
                </ul>

                <p><strong>Teams verlieren Spiele nicht, weil ihr System schlecht ist, sondern weil sie Umschaltmomente schlecht lesen.</strong></p>

                <p>Transition entscheidet:</p>
                <ul>
                  <li>ob ein Spiel schnell oder kontrolliert wird</li>
                  <li>ob Tempo für oder gegen dich wirkt</li>
                  <li>ob Chaos genutzt oder überlebt wird</li>
                </ul>
              </div>
            )}
          </section>

          <section className="theory-section">
            <button
              className="section-toggle"
              onClick={() => toggleSection('tempoDefinition')}
              aria-expanded={expandedSections.tempoDefinition}
            >
              <h2>Tempo – mehr als Geschwindigkeit</h2>
              <span className="toggle-icon">{expandedSections.tempoDefinition ? '−' : '+'}</span>
            </button>
            {expandedSections.tempoDefinition && (
              <div className="section-content">
                <h4>Was bedeutet Tempo wirklich?</h4>
                <p><strong>Tempo ist nicht gleich Geschwindigkeit.</strong></p>

                <p>Tempo beschreibt:</p>
                <ul>
                  <li>Entscheidungsgeschwindigkeit</li>
                  <li>Richtungswechsel</li>
                  <li>Timing von Aktionen</li>
                </ul>

                <p><strong>Ein langsamer Spieler kann hohes Tempo erzeugen, wenn er früh entscheidet. Ein schneller Spieler kann Tempo töten, wenn er zu spät reagiert.</strong></p>
              </div>
            )}
          </section>

          <section className="theory-section">
            <button
              className="section-toggle"
              onClick={() => toggleSection('warumTempo')}
              aria-expanded={expandedSections.warumTempo}
            >
              <h2>Warum ist Tempo wichtig?</h2>
              <span className="toggle-icon">{expandedSections.warumTempo ? '−' : '+'}</span>
            </button>
            {expandedSections.warumTempo && (
              <div className="section-content">
                <p>Tempo zwingt den Gegner zu:</p>
                <ul>
                  <li>Reaktionen statt Aktionen</li>
                  <li>Rückwärtsbewegung</li>
                  <li>Improvisation</li>
                </ul>

                <p><strong>Aber: Unkontrolliertes Tempo erzeugt eigene Fehler.</strong></p>

                <p>Die Kernfrage lautet immer:</p>
                <p><em>Beschleunige ich das Spiel – oder beschleunigt es mich?</em></p>
              </div>
            )}
          </section>

          <section className="theory-section">
            <button
              className="section-toggle"
              onClick={() => toggleSection('turnovers')}
              aria-expanded={expandedSections.turnovers}
            >
              <h2>Turnovers – Ursprung jeder Transition</h2>
              <span className="toggle-icon">{expandedSections.turnovers ? '−' : '+'}</span>
            </button>
            {expandedSections.turnovers && (
              <div className="section-content">
                <h4>Was ist ein Turnover?</h4>
                <p><strong>Ein Turnover ist jeder ungeplante Wechsel des Puckbesitzes:</strong></p>
                <ul>
                  <li>Fehlpass</li>
                  <li>abgefangener Pass</li>
                  <li>verlorener Zweikampf</li>
                  <li>geblockter Schuss mit direktem Gegenzug</li>
                </ul>

                <p><strong>Nicht jeder Turnover ist gleich gefährlich. Gefährlich sind Turnovers:</strong></p>
                <ul>
                  <li>im Zentrum</li>
                  <li>an der Blue Line</li>
                  <li>bei offener Struktur</li>
                </ul>
              </div>
            )}
          </section>

          <section className="theory-section">
            <button
              className="section-toggle"
              onClick={() => toggleSection('warumTurnovers')}
              aria-expanded={expandedSections.warumTurnovers}
            >
              <h2>Warum sind Turnovers kritisch?</h2>
              <span className="toggle-icon">{expandedSections.warumTurnovers ? '−' : '+'}</span>
            </button>
            {expandedSections.warumTurnovers && (
              <div className="section-content">
                <p>Turnovers treffen Teams in einem Moment, in dem:</p>
                <ul>
                  <li>Rollen noch offensiv gedacht sind</li>
                  <li>Abstände groß sind</li>
                  <li>Blickrichtung nach vorne geht</li>
                </ul>

                <p><strong>Ein Turnover ist kein Fehlerproblem, sondern ein Strukturproblem danach.</strong></p>
              </div>
            )}
          </section>

          <section className="theory-section">
            <button
              className="section-toggle"
              onClick={() => toggleSection('turnoverVerhalten')}
              aria-expanded={expandedSections.turnoverVerhalten}
            >
              <h2>Woran erkennt man gutes Turnover-Verhalten?</h2>
              <span className="toggle-icon">{expandedSections.turnoverVerhalten ? '−' : '+'}</span>
            </button>
            {expandedSections.turnoverVerhalten && (
              <div className="section-content">
                <ul>
                  <li>sofortige Rückwärtsbewegung</li>
                  <li>erstes Ziel: Mitte schließen, nicht Puck jagen</li>
                  <li>klare Priorität: Zeit kaufen</li>
                </ul>
              </div>
            )}
          </section>

          <section className="theory-section">
            <button
              className="section-toggle"
              onClick={() => toggleSection('turnoverFehler')}
              aria-expanded={expandedSections.turnoverFehler}
            >
              <h2>Typische Fehler</h2>
              <span className="toggle-icon">{expandedSections.turnoverFehler ? '−' : '+'}</span>
            </button>
            {expandedSections.turnoverFehler && (
              <div className="section-content">
                <ul>
                  <li>sofortiger Gegenangriff-Versuch nach Puckverlust</li>
                  <li>mehrere Spieler gehen auf den gleichen Gegenspieler</li>
                  <li>Centerraum bleibt offen</li>
                </ul>
              </div>
            )}
          </section>

          <section className="theory-section">
            <button
              className="section-toggle"
              onClick={() => toggleSection('rushes')}
              aria-expanded={expandedSections.rushes}
            >
              <h2>Rush-Situationen – Angriff aus der Bewegung</h2>
              <span className="toggle-icon">{expandedSections.rushes ? '−' : '+'}</span>
            </button>
            {expandedSections.rushes && (
              <div className="section-content">
                <h4>Was ist ein Rush?</h4>
                <p><strong>Ein Rush ist ein Angriff mit Geschwindigkeit, bei dem:</strong></p>
                <ul>
                  <li>der Gegner rückwärts läuft</li>
                  <li>Abstände noch nicht stabil sind</li>
                  <li>Entscheidungen unter Druck fallen</li>
                </ul>

                <p><strong>Rush ≠ Konter. Ein Rush kann auch aus kontrolliertem Aufbau entstehen.</strong></p>
              </div>
            )}
          </section>

          <section className="theory-section">
            <button
              className="section-toggle"
              onClick={() => toggleSection('warumRushes')}
              aria-expanded={expandedSections.warumRushes}
            >
              <h2>Warum sind Rushes so effektiv?</h2>
              <span className="toggle-icon">{expandedSections.warumRushes ? '−' : '+'}</span>
            </button>
            {expandedSections.warumRushes && (
              <div className="section-content">
                <p>Weil Verteidiger:</p>
                <ul>
                  <li>Gap kontrollieren müssen</li>
                  <li>Pass und Schuss gleichzeitig verteidigen</li>
                  <li>keine Zeit für Hilfe haben</li>
                </ul>

                <p><strong>Rushes bestrafen schlechte Transition, nicht schlechte Systeme.</strong></p>
              </div>
            )}
          </section>

          <section className="theory-section">
            <button
              className="section-toggle"
              onClick={() => toggleSection('rushEntscheidungen')}
              aria-expanded={expandedSections.rushEntscheidungen}
            >
              <h2>Woran erkennt man gute Rush-Entscheidungen?</h2>
              <span className="toggle-icon">{expandedSections.rushEntscheidungen ? '−' : '+'}</span>
            </button>
            {expandedSections.rushEntscheidungen && (
              <div className="section-content">
                <ul>
                  <li>Puckträger liest Verteidiger, nicht Tor</li>
                  <li>Breite wird gehalten</li>
                  <li>Trailer ist sichtbar eingebunden</li>
                </ul>
              </div>
            )}
          </section>

          <section className="theory-section">
            <button
              className="section-toggle"
              onClick={() => toggleSection('rushFehler')}
              aria-expanded={expandedSections.rushFehler}
            >
              <h2>Typische Fehler</h2>
              <span className="toggle-icon">{expandedSections.rushFehler ? '−' : '+'}</span>
            </button>
            {expandedSections.rushFehler && (
              <div className="section-content">
                <ul>
                  <li>zu frühes Abschließen ohne Support</li>
                  <li>alle Spieler fahren gleiche Spur</li>
                  <li>Querpass ohne Zug zum Tor</li>
                </ul>
              </div>
            )}
          </section>

          <section className="theory-section">
            <button
              className="section-toggle"
              onClick={() => toggleSection('backchecking')}
              aria-expanded={expandedSections.backchecking}
            >
              <h2>Backchecking – Struktur wiederherstellen</h2>
              <span className="toggle-icon">{expandedSections.backchecking ? '−' : '+'}</span>
            </button>
            {expandedSections.backchecking && (
              <div className="section-content">
                <h4>Was ist Backchecking?</h4>
                <p><strong>Backchecking ist strukturierte Rückwärtsarbeit, nicht Sprinten. Ziel ist:</strong></p>
                <ul>
                  <li>Raum zu schließen</li>
                  <li>Passoptionen zu nehmen</li>
                  <li>Zeit für die Defense zu gewinnen</li>
                </ul>
              </div>
            )}
          </section>

          <section className="theory-section">
            <button
              className="section-toggle"
              onClick={() => toggleSection('warumBackchecking')}
              aria-expanded={expandedSections.warumBackchecking}
            >
              <h2>Warum ist Backchecking entscheidend?</h2>
              <span className="toggle-icon">{expandedSections.warumBackchecking ? '−' : '+'}</span>
            </button>
            {expandedSections.warumBackchecking && (
              <div className="section-content">
                <p><strong>Gutes Backchecking:</strong></p>
                <ul>
                  <li>reduziert Rush-Gefahr</li>
                  <li>stabilisiert Abstände</li>
                  <li>ermöglicht kontrollierte Verteidigung</li>
                </ul>

                <p><strong>Schlechtes Backchecking zwingt Defense zu:</strong></p>
                <ul>
                  <li>Rückwärtsverteidigung ohne Support</li>
                  <li>Überaggressivität</li>
                  <li>Fouls oder Notlösungen</li>
                </ul>
              </div>
            )}
          </section>

          <section className="theory-section">
            <button
              className="section-toggle"
              onClick={() => toggleSection('backcheckingQualitaet')}
              aria-expanded={expandedSections.backcheckingQualitaet}
            >
              <h2>Woran erkennt man gutes Backchecking?</h2>
              <span className="toggle-icon">{expandedSections.backcheckingQualitaet ? '−' : '+'}</span>
            </button>
            {expandedSections.backcheckingQualitaet && (
              <div className="section-content">
                <ul>
                  <li>Spieler laufen durch das Zentrum, nicht außen vorbei</li>
                  <li>Stöcke im Passweg</li>
                  <li>Blick nach innen, nicht nur zum Puck</li>
                </ul>
              </div>
            )}
          </section>

          <section className="theory-section">
            <button
              className="section-toggle"
              onClick={() => toggleSection('backcheckingFehler')}
              aria-expanded={expandedSections.backcheckingFehler}
            >
              <h2>Typische Fehler</h2>
              <span className="toggle-icon">{expandedSections.backcheckingFehler ? '−' : '+'}</span>
            </button>
            {expandedSections.backcheckingFehler && (
              <div className="section-content">
                <ul>
                  <li>„Alibi-Sprints" ohne Einfluss</li>
                  <li>Fokus nur auf Puckträger</li>
                  <li>kein Timing (zu spät, zu hoch)</li>
                </ul>
              </div>
            )}
          </section>

          <section className="theory-section">
            <button
              className="section-toggle"
              onClick={() => toggleSection('gapControl')}
              aria-expanded={expandedSections.gapControl}
            >
              <h2>Gap Control – Distanz steuern</h2>
              <span className="toggle-icon">{expandedSections.gapControl ? '−' : '+'}</span>
            </button>
            {expandedSections.gapControl && (
              <div className="section-content">
                <h4>Was ist Gap Control?</h4>
                <p><strong>Gap Control beschreibt den Abstand zwischen Verteidiger und Angreifer. Nicht maximal eng – sondern kontrolliert variabel.</strong></p>
              </div>
            )}
          </section>

          <section className="theory-section">
            <button
              className="section-toggle"
              onClick={() => toggleSection('warumGapControl')}
              aria-expanded={expandedSections.warumGapControl}
            >
              <h2>Warum ist Gap Control zentral für Transition?</h2>
              <span className="toggle-icon">{expandedSections.warumGapControl ? '−' : '+'}</span>
            </button>
            {expandedSections.warumGapControl && (
              <div className="section-content">
                <p>Weil der Gap entscheidet:</p>
                <ul>
                  <li>ob der Angreifer Zeit hat</li>
                  <li>ob der Verteidiger reagieren oder diktieren kann</li>
                  <li>ob Tempo gestoppt oder genutzt wird</li>
                </ul>
              </div>
            )}
          </section>

          <section className="theory-section">
            <button
              className="section-toggle"
              onClick={() => toggleSection('gapControlQualitaet')}
              aria-expanded={expandedSections.gapControlQualitaet}
            >
              <h2>Woran erkennt man gutes Gap Control?</h2>
              <span className="toggle-icon">{expandedSections.gapControlQualitaet ? '−' : '+'}</span>
            </button>
            {expandedSections.gapControlQualitaet && (
              <div className="section-content">
                <ul>
                  <li>Defense hält Angreifer außen</li>
                  <li>Geschwindigkeit wird angepasst</li>
                  <li>Abstand bleibt konstant trotz Richtungswechsel</li>
                </ul>
              </div>
            )}
          </section>

          <section className="theory-section">
            <button
              className="section-toggle"
              onClick={() => toggleSection('gapControlFehler')}
              aria-expanded={expandedSections.gapControlFehler}
            >
              <h2>Typische Fehler</h2>
              <span className="toggle-icon">{expandedSections.gapControlFehler ? '−' : '+'}</span>
            </button>
            {expandedSections.gapControlFehler && (
              <div className="section-content">
                <ul>
                  <li>zu früher Angriff → leicht überspielt</li>
                  <li>zu tiefer Rückzug → freier Abschluss</li>
                  <li>kein Abgleich mit Partner oder Backcheckern</li>
                </ul>
              </div>
            )}
          </section>

          <section className="theory-section">
            <button
              className="section-toggle"
              onClick={() => toggleSection('umschaltmomente')}
              aria-expanded={expandedSections.umschaltmomente}
            >
              <h2>Umschaltmomente lesen – der Kern von Rink IQ</h2>
              <span className="toggle-icon">{expandedSections.umschaltmomente ? '−' : '+'}</span>
            </button>
            {expandedSections.umschaltmomente && (
              <div className="section-content">
                <p><strong>Transition ist der Punkt, an dem Rink IQ sichtbar wird.</strong></p>

                <p><strong>Spieler mit hohem Rink IQ:</strong></p>
                <ul>
                  <li>erkennen Turnovers früh</li>
                  <li>passen Tempo an die Situation an</li>
                  <li>stellen Struktur wieder her, bevor Chaos entsteht</li>
                </ul>

                <p><strong>Spieler mit niedrigem Rink IQ:</strong></p>
                <ul>
                  <li>reagieren verspätet</li>
                  <li>laufen dem Spiel hinterher</li>
                  <li>erzeugen Folgeprobleme</li>
                </ul>
              </div>
            )}
          </section>

          <section className="theory-section">
            <button
              className="section-toggle"
              onClick={() => toggleSection('missverstaendnisseA3')}
              aria-expanded={expandedSections.missverstaendnisseA3}
            >
              <h2>Typische Missverständnisse</h2>
              <span className="toggle-icon">{expandedSections.missverstaendnisseA3 ? '−' : '+'}</span>
            </button>
            {expandedSections.missverstaendnisseA3 && (
              <div className="section-content">
                <div className="comparison">
                  <div className="comparison-item bad">
                    <strong>❌ „Tempo heißt immer schneller spielen"</strong><br/>
                    → nein. Tempo ist situativ.
                  </div>
                  <div className="comparison-item bad">
                    <strong>❌ „Backchecking ist Einsatzfrage"</strong><br/>
                    → nein. Es ist Positions- und Timingfrage.
                  </div>
                  <div className="comparison-item bad">
                    <strong>❌ „Rush stoppen = Puck angreifen"</strong><br/>
                    → nein. Raum kontrollieren ist entscheidender.
                  </div>
                </div>
              </div>
            )}
          </section>

          <section className="theory-section">
            <button
              className="section-toggle"
              onClick={() => toggleSection('zusammenfassungA3')}
              aria-expanded={expandedSections.zusammenfassungA3}
            >
              <h2>Kernzusammenfassung</h2>
              <span className="toggle-icon">{expandedSections.zusammenfassungA3 ? '−' : '+'}</span>
            </button>
            {expandedSections.zusammenfassungA3 && (
              <div className="section-content">
                <div className="summary-grid">
                  <div className="summary-item">
                    <strong>Transition</strong> ist der gefährlichste Spielmoment
                  </div>
                  <div className="summary-item">
                    <strong>Tempo</strong> ist Entscheidung, nicht Geschwindigkeit
                  </div>
                  <div className="summary-item">
                    <strong>Turnovers</strong> sind normal – Reaktionen danach entscheiden
                  </div>
                  <div className="summary-item">
                    <strong>Rushes</strong> bestrafen schlechte Ordnung
                  </div>
                  <div className="summary-item">
                    <strong>Backchecking</strong> stellt Struktur wieder her
                  </div>
                  <div className="summary-item">
                    <strong>Gap Control</strong> steuert Risiko
                  </div>
                  <div className="summary-item">
                    <strong>Umschaltmomente</strong> zeigen echten Rink IQ
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>
      )
    }
    return <div>Detaillierte Theorie für diesen Track ist noch nicht verfügbar.</div>
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

      <div className="card theory-detail-card">
        {getDetailedTheory(moduleId || '')}
      </div>
    </div>
  )
}