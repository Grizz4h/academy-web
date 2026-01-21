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

  // ...Inhalte werden jetzt aus externer JSON geladen...
  const getDetailedTheory = (moduleId: string) => {
    return <div>Die Theorie-Inhalte werden jetzt extern aus einer JSON-Datei geladen.</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

      <div className="card theory-detail-card">
        {getDetailedTheory(moduleId || '')}
      </div>
    </div>
  )
}