/**
 * Dev-only competency drill answer fixtures.
 * Strong / decent calibration-style answers shaped for the live UI field names.
 * Does not call the API — only fills session drafts client-side.
 */

export type CompetencyFillFixture = {
  drillId: string
  label: string
  /** Phase answers for the main observation phase (usually P1). */
  answers: Record<string, unknown>
}

function obsId(suffix: string): string {
  return `dev-fill-${suffix}`
}

const B2_D5_STRONG: CompetencyFillFixture = {
  drillId: 'B2_D5',
  label: 'B2_D5 · starke Beobachtungstendenz',
  answers: {
    decision_pattern: 'kontrolle_stabilisierung',
    pattern_evidence: ['kontrollierte_rueck_querpaesse', 'struktur_vor_tempo'],
    pattern_reason:
      'In drei Drucksituationen in der Neutralzone/eigenen Hälfte sah ich zuerst Rück- oder Querpässe, bevor Tempo kam. Carry war sichtbar eine Option, wurde aber wiederholt nicht gewählt. Einmal war die Szene unklar — deshalb nur eine Stichproben-Tendenz zu Kontrolle vor Vorwärtsimpuls, keine Team-Identität.',
  },
}

const E1_D1_STRONG: CompetencyFillFixture = {
  drillId: 'E1_D1',
  label: 'E1_D1 · starker Mustervergleich',
  answers: {
    pattern_observations: [
      {
        id: obsId('e1-1'),
        side: 'left',
        zone: 'neutral_zone',
        trigger: 'puck_loss',
        createdAt: new Date().toISOString(),
        contextTags: ['high_pressure'],
        similarities: ['same_zone', 'same_trigger', 'same_team_reaction', 'similar_sequence'],
        teamReaction: 'Sofortiger Backcheck auf den Puckträger, danach kurzer erster Pass',
      },
      {
        id: obsId('e1-2'),
        side: 'right',
        zone: 'neutral_zone',
        trigger: 'puck_loss',
        createdAt: new Date().toISOString(),
        contextTags: ['high_pressure'],
        similarities: ['same_zone', 'same_trigger', 'same_team_reaction', 'similar_sequence'],
        teamReaction: 'Rückwärtsdruck auf den Puckträger, dann kurzer Pass in die Breite',
      },
      {
        id: obsId('e1-3'),
        side: 'left',
        zone: 'neutral_zone',
        trigger: 'puck_loss',
        createdAt: new Date().toISOString(),
        contextTags: ['high_pressure'],
        similarities: ['same_zone', 'same_trigger', 'similar_sequence'],
        teamReaction: 'Backcheck auf den Träger; diesmal Board-Battle statt sofortigem Pass',
      },
    ],
    pattern_assessment: 'likely_tendency',
    pattern_summary:
      'Alle drei Situationen: Neutralzone, Auslöser Turnover/Puckverlust, sichtbare Teamreaktion Rückwärtsdruck auf den Puckträger. In zwei Fällen folgte sofort ein kurzer Pass, einmal Board-Battle. Der Weg ist ähnlich genug für einen Hinweis auf wiederkehrendes Verhalten — nicht nur gleiches Ergebnis. Stichprobe klein, keine allgemeine Teamtendenz.',
    __pattern_log_draft: {
      note: '',
      side: '',
      zone: '',
      trigger: '',
      contextTags: [],
      similarities: [],
      teamReaction: '',
    },
    __pattern_log_edit_index: null,
    __pattern_log_adding_more: false,
  },
}

const A1_D2_COMPLETE: CompetencyFillFixture = {
  drillId: 'A1_D2',
  label: 'A1_D2 · Shift-Tracker komplett',
  answers: {
    shift_tracker_observations: [
      { id: obsId('a1-1'), order: 1, position: 'low' },
      { id: obsId('a1-2'), order: 2, position: 'low' },
      { id: obsId('a1-3'), order: 3, position: 'low' },
      { id: obsId('a1-4'), order: 4, position: 'low' },
      { id: obsId('a1-5'), order: 5, position: 'low' },
    ],
    __shift_tracker_stage: 'complete',
    patternNoticed: 'changes_often',
  },
}

const A3_D2_STRONG: CompetencyFillFixture = {
  drillId: 'A3_D2',
  label: 'A3_D2 · Erste Reaktion',
  answers: {
    primary_pattern: 'strukturierte Beschleunigung nach vorne',
    primary_pattern_dominance: 'häufig sichtbar',
    secondary_pattern: 'ja, gelegentlich Kontrolle',
    role_structure: 'ja, klar strukturiert',
    role_structure_indicators: ['klare Absicherung', 'gemeinsames Timing'],
    note:
      'Nach dem Wechsel beschleunigt der Puckführer oft kontrolliert nach vorne, während ein Mitspieler kurz als Passoption erscheint und hinten Absicherung sichtbar bleibt — Aussage nur für die beobachteten ersten Sekunden.',
  },
}

const B1_NOTE =
  'Unter dem Puckträger bot ein Mitspieler kurze Anspielbarkeit von hinten innen: Passbahn offen, Körper zum Spielfeld geöffnet, Abstand erreichbar — Nähe allein wäre zu wenig für spielbaren Support.'

const B1_D1_STRONG: CompetencyFillFixture = {
  drillId: 'B1_D1',
  label: 'B1_D1 · Support-Samples',
  answers: {
    support_samples: [
      { support_state: 'klar spielbar', main_factor: 'Passbahn offen', note: B1_NOTE },
      { support_state: 'eingeschränkt', main_factor: 'Passbahn teilweise geschlossen', note: B1_NOTE },
      { support_state: 'klar spielbar', main_factor: 'erreichbarer Abstand', note: B1_NOTE },
    ],
    selected_sample_index: 2,
  },
}

const B1_D2_STRONG: CompetencyFillFixture = {
  drillId: 'B1_D2',
  label: 'B1_D2 · Verbindungen',
  answers: {
    triangle_samples: [
      {
        center_connection_state: 'Neue Verbindung entsteht',
        main_factor: 'Passbahn öffnet sich',
        note: 'Eine neue Passverbindung zum Center entstand, als der Abstand kleiner wurde und die Passbahn sichtbar aufging — vorher war die Rückoption geschlossen.',
      },
      {
        center_connection_state: 'Verbindungen bleiben erhalten',
        main_factor: 'Abstand bleibt nutzbar',
        note: 'Zwei Verbindungen um den Center blieben unter Bewegung spielbar: Abstand und Passbahn änderten sich kaum, die Rückoption blieb sichtbar — nur Stichprobe.',
      },
      {
        center_connection_state: 'Verbindung wird eingeschränkt',
        main_factor: 'Passbahn schließt sich teilweise',
        note: 'Eine zuvor spielbare Verbindung wurde eingeschränkt, weil die Passbahn durch einen Gegner teilweise geschlossen und der Abstand sichtbar grenzwertig wurde.',
      },
    ],
    selected_sample_index: 2,
  },
}

const B1_D3_STRONG: CompetencyFillFixture = {
  drillId: 'B1_D3',
  label: 'B1_D3 · Center-Aufgaben',
  answers: {
    read_samples: [
      {
        center_read: 'Anspielstation anbieten',
        main_reason: 'Passlinie erreichbar',
        read_quality: 'früh erkannt',
        note: 'Der Center bot sich als Anspielstation: offene Passbahn, erreichbarer Abstand, Körper zum Pass geöffnet — Funktion in dieser Szene sichtbar, ohne Intent zu unterstellen.',
      },
      {
        center_read: 'Absichern',
        main_reason: 'Rückoption bleibt sichtbar',
        read_quality: 'rechtzeitig',
        note: 'Der Center blieb hinter dem Puckträger und sicherte ab; Abstand und Orientierung machten die Absicherungsfunktion klar lesbar in dieser Szene, ohne Qualitätsurteil.',
      },
      {
        center_read: 'Verbinden',
        main_reason: 'Puckführer und Mitspieler verbunden',
        read_quality: 'rechtzeitig',
        note: 'Der Center verband zwei Optionen sichtbar durch Position zwischen ihnen; die Passbahnen waren nur teilweise offen — deshalb vorsichtige Stichprobenaussage.',
      },
    ],
    selected_sample_index: 2,
  },
}

const B1_D4_STRONG: CompetencyFillFixture = {
  drillId: 'B1_D4',
  label: 'B1_D4 · Outlet',
  answers: {
    outlet_samples: [
      {
        center_outlet_state: 'früh verfügbar',
        main_factor: 'Center bietet früh Passlinie',
        outlet_quality: 'früh verbindend',
        note: 'Center als Outlet klar anspielbar: Passbahn offen, Timing vor dem Druck, Körper geöffnet — Anschlussoption sichtbar, nicht nur Nähe zum Puckträger in der Szene.',
      },
      {
        center_outlet_state: 'verfügbar',
        main_factor: 'Center anspielbar positioniert',
        outlet_quality: 'verbindend',
        note: 'Outlet verfügbar mit aufrechter Verbindung; Passbahn teilweise unter Druck — spielbar mit Einschränkung in dieser Stichprobe, keine Team- oder Systemaussage.',
      },
      {
        center_outlet_state: 'früh verfügbar',
        main_factor: 'sichtbare Vorbereitung vor dem Druck (Position/Körperausrichtung)',
        outlet_quality: 'früh verbindend',
        note: 'Erneute klare Anspielstation vor dem Druck: Timing und offene Bahn machen die Anschlussoption in dieser Stichprobe lesbar, spielbar und ohne Systemurteil.',
      },
    ],
    selected_sample_index: 2,
  },
}

const B1_D5_STRONG: CompetencyFillFixture = {
  drillId: 'B1_D5',
  label: 'B1_D5 · Timing',
  answers: {
    timing_samples: [
      {
        support_timing: 'Vor dem Druck vorbereitet',
        main_effect: 'Bewegung vor dem Druck',
        movement_character: 'Körper vororientiert',
        note: 'Unterstützung war früh vorbereitet: Bewegung startete vor dem Druckfenster, Option wurde dadurch früher spielbar — Timing an sichtbarer Vorbereitung, nicht am Ergebnis.',
      },
      {
        support_timing: 'Erst unter Druck verfügbar',
        main_effect: 'erst auf Druck reagiert',
        movement_character: 'erst auf Druck reagiert',
        note: 'Support kam reaktiv spät; das Passfenster war bereits eng. Die Vorbereitung war sichtbar verzögert — Aussage nur für diese beobachtete Szene, kein Muster.',
      },
      {
        support_timing: 'Vor dem Druck vorbereitet',
        main_effect: 'Körper vororientiert',
        movement_character: 'Schulterblick sichtbar',
        note: 'Erneute frühe Vorbereitung: zwei Optionen wurden parallel sichtbar spielbar, ohne dass Nähe allein als Support gezählt wurde — nur diese Stichprobe zählt.',
      },
    ],
    selected_sample_index: 2,
  },
}

const C1_D5_STRONG: CompetencyFillFixture = {
  drillId: 'C1_D5',
  label: 'C1_D5 · Stabilitätsbeobachtung',
  answers: {
    spatialPriority: 'central_slot',
    baseStructure: 'very_compact',
    shiftBehavior: 'collective_shift',
    pressurePattern: 'early_aggressive',
    profileSummary:
      'Im beobachteten Abschnitt priorisierte die Defensive wiederholt den zentralen Slot mit engen Abständen. Bei Puckbewegung verschob sich die Struktur kollektiv; aktiver Zugriff begann eher früh am pucknahen Rand. Eine Szene mit breiterer Staffelung wirkte als Gegenbeispiel — deshalb nur eine Stichproben-Tendenz, keine Systemidentität.',
  },
}

const C2_D5_STRONG: CompetencyFillFixture = {
  drillId: 'C2_D5',
  label: 'C2_D5 · Neutral-Zone-Beobachtung',
  answers: {
    spatialPriority: 'central_lane',
    depthStructure: 'two_connected_layers',
    steeringPattern: 'to_wall',
    recoveryPattern: 'collective_retreat',
    profileSummary:
      'In der Neutralzone wirkte die zentrale Bahn wiederholt priorisiert, mit zwei verbundenen Schichten. Unter Druck wurde der Puck öfter zur Bande gelenkt; nach Brüchen folgte meist kollektiver Rückzug. Eine Szene mit großen Gaps blieb die Ausnahme — Aussage nur für den beobachteten Abschnitt, keine Systemidentität.',
  },
}

const C3_D5_STRONG: CompetencyFillFixture = {
  drillId: 'C3_D5',
  label: 'C3_D5 · Offensivstruktur-Beobachtung',
  answers: {
    spacePriority: 'slot_focus',
    connectionProfile: 'low_high_connection',
    defensiveMovementDriver: 'side_changes',
    decisionProfile: 'extra_pass',
    profileSummary:
      'Im beobachteten Offensivabschnitt lag der Fokus wiederholt auf dem Slot, mit sichtbarer Low-High-Verbindung. Seitenwechsel trieben die defensive Bewegung; Entscheidungen endeten oft in einem Extra-Pass statt Sofortabschluss. Ein isolierter High-Point-Abschluss blieb Gegenbeispiel — Strukturbeobachtung, kein Scoring-Urteil und keine Teamidentität.',
  },
}

const D1_D5_STRONG: CompetencyFillFixture = {
  drillId: 'D1_D5',
  label: 'D1_D5 · Powerplay-Beobachtung',
  answers: {
    primaryAdvantageArea: 'bumper',
    keyFunctions: ['bumper_presence', 'net_front_presence', 'high_connection'],
    pkMovementDriver: 'seam_threat',
    primaryAttackTrigger: 'seam_open',
    profileSummary:
      'Im beobachteten Powerplay lag der Vorteil wiederholt am Bumper mit Net-Front-Präsenz und High-Connection. Die PK wurde oft über Seam-Gefahr bewegt; Angriffe kamen, wenn die Seam offen war. Ein Look ohne Bumper blieb die Ausnahme — Segmenttendenz, kein Setup-Label und kein Scoring-Urteil.',
  },
}

const D2_D5_STRONG: CompetencyFillFixture = {
  drillId: 'D2_D5',
  label: 'D2_D5 · Unterzahlbeobachtung',
  answers: {
    protectedPriority: 'middle_slot',
    baseStructure: 'compact_two_layers',
    movementResponse: 'protect_middle_first',
    pressureProfile: 'slow_pass',
    resolutionProfile: 'controlled_clear',
    profileSummary:
      'In der Unterzahl wirkte der mittlere Slot wiederholt priorisiert, mit zwei kompakten Schichten. Bei Puckbewegung wurde zuerst die Mitte geschützt; aktiver Druck kam eher bei langsamen Pässen. Auflösung oft kontrollierter Clear. Eine Szene mit starkem Weak-Side-Aufgeben blieb Gegenbeispiel — keine Formationsidentität.',
  },
}

const D3_D5_STRONG: CompetencyFillFixture = {
  drillId: 'D3_D5',
  label: 'D3_D5 · Blaue-Linien-Beobachtung',
  answers: {
    entryPreference: 'carry_middle',
    entrySupport: 'close_support',
    postEntryControl: 'immediate_control',
    pressuredExitBehavior: 'controlled_exit',
    simplificationTrigger: 'heavy_forecheck',
    profileSummary:
      'An den blauen Linien sah ich in mehreren Situationen Carry durch die Mitte mit enger Stütze; nach dem Entry folgte oft sofort Kontrolle. Unter starkem Forecheck wurde eher kontrolliert ausgelöst als erzwungen. Ein Dump-in ohne Support blieb die Ausnahme — Aussage gilt nur für den beobachteten Abschnitt, nicht als Teamprinzip.',
  },
}

const E1_D5_STRONG: CompetencyFillFixture = {
  drillId: 'E1_D5',
  label: 'E1_D5 · Tendenzen im Segment',
  answers: {
    tendency_entries: [
      {
        id: obsId('e1d5-1'),
        summary:
          'Unter hohem Forecheck-Druck clears das Team häufiger früh über die Banden statt über die Mitte.',
        frequency: 'three',
        primaryCondition: 'pressure',
        stableCore: ['team_function', 'zone'],
        allowedVariation: ['side', 'player'],
        attribution: 'mostly_structural',
        confidence: 'medium',
        strongestEvidence:
          'Drei vergleichbare Neutralzone-Exits unter Druck zeigten denselben frühen Clear-Pfad an die Bande.',
      },
    ],
    segment_summary:
      'Im beobachteten Segment zeigt sich eine vorläufige Tendenz zu frühen Banden-Clears unter Forecheck-Druck. Die Grundlage reicht für eine vorsichtige Segmentaussage; Gegenfälle unter niedrigem Druck fehlen — keine Teamidentität.',
    falsification_note:
      'Wenn unter gleichem Druck wiederholt kontrollierte Mitte-Exits sichtbar werden.',
    strongest_tendency_id: obsId('e1d5-1'),
    __tendency_profile_draft: {},
    __tendency_profile_edit_index: null,
    __tendency_profile_adding: false,
  },
}

const E2_D1_STRONG: CompetencyFillFixture = {
  drillId: 'E2_D1',
  label: 'E2_D1 · Vorher/Nachher',
  answers: {
    __before_after_compare_stage: 'complete',
    before: {
      spacePriority: 'middle',
      pressureBehavior: 'early_aggressive',
      positioning: 'compact',
      decisionBehavior: 'direct',
      description: 'Erste Linie greift Entries früh und aggressiv an der Blue Line an.',
    },
    after: {
      spacePriority: 'middle',
      pressureBehavior: 'delayed_pressure',
      positioning: 'deep',
      decisionBehavior: 'patient',
      description: 'Später fällt die erste Linie tiefer zurück und wartet länger mit dem Zugriff.',
    },
    comparabilityRating: 'well_comparable',
    primaryChange: 'pressureBehavior',
    stableDimensions: ['spacePriority'],
    changeMagnitude: 'clear',
    changeSummary:
      'Vorher früher aggressiver Blue-Line-Zugriff; danach verzögerter Druck und tiefere Staffelung bei vergleichbaren Entries — ohne Ursache zu behaupten.',
  },
}

const E2_D2_STRONG: CompetencyFillFixture = {
  drillId: 'E2_D2',
  label: 'E2_D2 · Change-Timeline',
  answers: {
    __change_timeline_stage: 'complete',
    __change_timeline_draft: {
      period: '',
      gameClock: '',
      relationToBaseline: '',
      changedDimension: '',
      description: '',
    },
    __change_timeline_edit_index: null,
    __change_timeline_adding_more: false,
    observationFocus: 'Entry-Zugriff der ersten Linie an der Blue Line',
    baselineDescription:
      'In den ersten vergleichbaren Entries greift die erste Linie früh und aggressiv an der Blue Line zu.',
    change_timeline_observations: [
      {
        id: obsId('e2d2-1'),
        order: 1,
        period: '1',
        gameClock: '15:20',
        relationToBaseline: 'matches_baseline',
        description: 'Früher aggressiver Zugriff an der Blue Line, Mitte eng.',
      },
      {
        id: obsId('e2d2-2'),
        order: 2,
        period: '1',
        gameClock: '12:05',
        relationToBaseline: 'matches_baseline',
        description: 'Wieder früher Blue-Line-Druck, kompakt gestaffelt.',
      },
      {
        id: obsId('e2d2-3'),
        order: 3,
        period: '2',
        gameClock: '17:40',
        relationToBaseline: 'new_behavior',
        changedDimension: 'pressure_timing',
        description: 'Erste Linie fällt tiefer zurück und greift erst später zu.',
      },
      {
        id: obsId('e2d2-4'),
        order: 4,
        period: '2',
        gameClock: '14:10',
        relationToBaseline: 'new_behavior',
        changedDimension: 'pressure_timing',
        description: 'Erneut verzögerter Zugriff und tiefere erste Linie bei vergleichbarem Entry.',
      },
    ],
    candidateChangePointId: obsId('e2d2-3'),
    postChangeStability: 'mostly_persists',
    changeMagnitude: 'clear',
    comparability: 'mostly',
    assessment: 'likely_change',
    stableDimensions: ['space_priority'],
    changeSummary:
      'In den ersten zwei Entries früher Blue-Line-Zugriff. Ab Beobachtung 3 fällt die erste Linie tiefer zurück und bleibt in einer weiteren vergleichbaren Szene verzögert — möglicher Veränderungszeitpunkt, noch keine Ursache.',
  },
}

const E2_D3_STRONG: CompetencyFillFixture = {
  drillId: 'E2_D3',
  label: 'E2_D3 · Trigger-Hypothese',
  answers: {
    __trigger_hypothesis_stage: 'complete',
    observedChange:
      'F1 startet in vergleichbaren Forecheck-Lagen später tiefer und lenkt den ersten Druck stärker nach außen, statt früh frontal zuzugreifen.',
    priorProblem: 'opponent_breaks_pressure',
    priorProblemDetail: 'Der erste Forechecker wurde vorher mehrfach über eine kurze Passoption überspielt.',
    triggerType: 'opponent_driven',
    evidence: ['problem_repeated_before', 'same_space', 'same_role', 'timing_fits', 'reduces_open_option'],
    alternativeExplanation: 'different_personnel',
    alternativeDetail: 'Andere Reihe oder anderes Personal auf dem Eis könnte die Tiefe ebenfalls erklären.',
    problemFit: 'direct',
    linkStrength: 'plausible_link',
    functionalLink:
      'Der tiefere Start schließt früher den zentralen Raum, den der Gegner zuvor zum Überspielen genutzt hat — ohne Coachingabsicht zu behaupten.',
    hypothesisSummary:
      'Weil der Gegner den frühen Forecheck mehrfach über die kurze Passoption überspielt hat, könnte F1 später tiefer starten, um genau diese Option zu verkürzen. Alternativ erklären Personalwechsel oder veränderte Aufbauposition denselben Unterschied — die reale Coachingabsicht bleibt unbekannt.',
    confidence: 'medium',
  },
}

const E2_D4_STRONG: CompetencyFillFixture = {
  drillId: 'E2_D4',
  label: 'E2_D4 · Interaktionskette',
  answers: {
    __interaction_chain_stage: 'complete',
    problemDescription:
      'Gegnerische Entries gelangen in der Neutral Zone wiederholt kontrolliert durch die Mitte bei vergleichbarem Aufbau.',
    problemCategory: 'entry',
    problemEvidence: ['same_zone', 'same_opponent_solution', 'similar_space_opened', 'repeated_short_span'],
    problemExampleCount: '3',
    problemSceneNote: 'Mehrere 5v5-Entries mit ähnlichem Tempo und Staffelung.',
    adjustmentDescription:
      'Die erste Linie bleibt tiefer und priorisiert den zentralen Raum früher, statt an der Blue Line früh zuzugreifen.',
    adjustmentDimension: 'space_priority',
    changeMagnitude: 'clear',
    adjustmentSceneNote: 'Sichtbare Veränderung in mehreren vergleichbaren Entries hintereinander.',
    responseType: 'redirected',
    responseDescription:
      'In späteren vergleichbaren Entries trägt der Gegner den Puck seltener zentral und nutzt häufiger die Außenbahn oder einen Rim.',
    responseRepetition: 'three_or_more',
    responseSceneNote: 'Mindestens drei Folgeszenen mit vergleichbarer Ausgangslage.',
    problemEffect: 'shifted_elsewhere',
    tradeoff: 'more_outside_space',
    tradeoffDetail: 'Zentrale Kontrolle steigt; außen bleibt mehr Raum und Zeit für den Entry.',
    comparability: 'mostly',
    interactionAssessment: 'likely_effect',
    chainSummary:
      'Vorher kam der Gegner mehrfach kontrolliert durch die Mitte. Danach stand die erste Linie tiefer und schützte zentral kompakter. In vergleichbaren Situationen wich der Gegner häufiger auf Entries über außen aus — Interaktion verändert, kein Outcome-Erfolg behauptet.',
  },
}

const E2_D5_STRONG: CompetencyFillFixture = {
  drillId: 'E2_D5',
  label: 'E2_D5 · Spielanpassungen',
  answers: {
    __adjustment_profile_stage: 'complete',
    noClearAdjustment: false,
    adjustment_entries: [
      {
        id: obsId('e2d5-1'),
        beforeBehavior: 'Die erste Linie griff Entries früh an der Blue Line an.',
        changedBehavior: 'Die erste Linie fiel tiefer zurück und priorisierte die Mitte.',
        primaryChange: 'space_priority',
        stability: 'mostly_stable',
        possibleTrigger: 'opponent_repeated_success',
        triggerEvidence: 'Der tiefere Rückzug begann erst nach mehreren zentralen Entries.',
        stableElements: ['space_priority', 'base_structure'],
        interactionResponse: 'opponent_found_new_solution',
        assessment: 'likely_adjustment',
        confidence: 'medium',
      },
    ],
    primaryAdjustmentId: obsId('e2d5-1'),
    segmentSummary:
      'Vorher früher Zugriff an der Blue Line. Danach fällt die erste Linie tiefer zurück. Mögliche Erklärung: wiederholte zentrale Entries. Danach sucht der Gegner häufiger Entries außen. Mehrfach vergleichbar beobachtet — Interpretationssicherheit mittel, keine Coachingabsicht.',
  },
}

const E3_D1_STRONG: CompetencyFillFixture = {
  drillId: 'E3_D1',
  label: 'E3_D1 · Opportunity-Rate',
  answers: {
    __opportunity_rate_stage: 'complete',
    opportunity_rate_definition: {
      templateId: 'entries',
      opportunityLabel: 'Versuche, die gegnerische Zone zu betreten',
      targetEventLabel: 'kontrollierter Zoneneintritt mit Puckbesitz',
      question:
        'Von allen Versuchen, die gegnerische Zone zu betreten: Wie viele enden als kontrollierter Zoneneintritt mit Puckbesitz?',
      targetOutcomeId: 'controlled',
      outcomes: [
        { id: 'controlled', label: 'Kontrollierter Zoneneintritt' },
        { id: 'dump', label: 'Dump / Chip' },
        { id: 'turnover', label: 'Puckverlust' },
        { id: 'unclear', label: 'Unklar' },
      ],
    },
    opportunity_rate_observations: [
      { id: obsId('e3d1-1'), order: 1, outcomeId: 'controlled', period: '1', gameClock: '18:40', description: 'Carry über die blaue Linie, Besitz bleibt.', validOpportunity: true },
      { id: obsId('e3d1-2'), order: 2, outcomeId: 'dump', period: '1', gameClock: '15:12', description: 'Chip tief, kein kontrollierter Besitz.', validOpportunity: true },
      { id: obsId('e3d1-3'), order: 3, outcomeId: 'controlled', period: '1', gameClock: '11:05', description: 'Kontrollierter Entry links.', validOpportunity: true },
      { id: obsId('e3d1-4'), order: 4, outcomeId: 'turnover', period: '2', gameClock: '17:22', description: 'Puckverlust an der Blauen.', validOpportunity: true },
      { id: obsId('e3d1-5'), order: 5, outcomeId: 'controlled', period: '2', gameClock: '12:50', description: 'Kontrollierter Entry Mitte.', validOpportunity: true },
      { id: obsId('e3d1-6'), order: 6, outcomeId: 'unclear', period: '2', gameClock: '08:14', description: 'Winkel unklar — Ergebnis separat.', validOpportunity: true },
    ],
    countOnlyReflection: 'missing_relative_frequency',
    opportunityDefinitionClarity: 'mostly',
    userConclusion:
      'In dieser Stichprobe 3 Zielereignisse aus 5 auswertbaren Entry-Versuchen; 1 weitere gültige Situation war unklar; insgesamt 6 gültige Situationen — keine Team-Aussage.',
  },
}

const E3_D2_STRONG: CompetencyFillFixture = {
  drillId: 'E3_D2',
  label: 'E3_D2 · Cohort-Rate-Compare',
  answers: {
    __cohort_rate_stage: 'complete',
    cohort_rate_definition: {
      templateId: 'entries',
      opportunityLabel: 'Versuche, die gegnerische Zone zu betreten',
      targetEventLabel: 'kontrollierter Zoneneintritt mit Puckbesitz',
      question:
        'Von allen Versuchen, die gegnerische Zone zu betreten: Wie viele enden als kontrollierter Zoneneintritt mit Puckbesitz?',
      targetOutcomeId: 'controlled',
      outcomes: [
        { id: 'controlled', label: 'Kontrollierter Zoneneintritt' },
        { id: 'dump', label: 'Dump / Chip' },
        { id: 'turnover', label: 'Puckverlust' },
        { id: 'unclear', label: 'Unklar' },
      ],
    },
    cohort_rate_comparison: {
      templateId: 'side',
      dimensionLabel: 'Seite',
      question: 'Wie unterscheidet sich die Rate kontrollierter Entries zwischen Links und Rechts?',
      groupA: { id: 'A', label: 'Links' },
      groupB: { id: 'B', label: 'Rechts' },
    },
    cohort_rate_observations: [
      { id: obsId('e3d2-1'), order: 1, cohortId: 'A', outcomeId: 'controlled', period: '1', gameClock: '19:10', description: 'Entry links kontrolliert.', validOpportunity: true },
      { id: obsId('e3d2-2'), order: 2, cohortId: 'A', outcomeId: 'controlled', period: '1', gameClock: '14:02', description: 'Carry links, Besitz bleibt.', validOpportunity: true },
      { id: obsId('e3d2-3'), order: 3, cohortId: 'A', outcomeId: 'dump', period: '1', gameClock: '09:40', description: 'Chip links tief.', validOpportunity: true },
      { id: obsId('e3d2-4'), order: 4, cohortId: 'A', outcomeId: 'controlled', period: '2', gameClock: '16:55', description: 'Kontrollierter Entry links.', validOpportunity: true },
      { id: obsId('e3d2-5'), order: 5, cohortId: 'B', outcomeId: 'dump', period: '1', gameClock: '17:30', description: 'Dump rechts.', validOpportunity: true },
      { id: obsId('e3d2-6'), order: 6, cohortId: 'B', outcomeId: 'turnover', period: '1', gameClock: '12:18', description: 'Puckverlust rechts an der Blauen.', validOpportunity: true },
      { id: obsId('e3d2-7'), order: 7, cohortId: 'B', outcomeId: 'controlled', period: '2', gameClock: '18:05', description: 'Kontrollierter Entry rechts.', validOpportunity: true },
      { id: obsId('e3d2-8'), order: 8, cohortId: 'B', outcomeId: 'unclear', period: '2', gameClock: '10:44', description: 'Ergebnis rechts unklar.', validOpportunity: true },
    ],
    comparability: 'mostly_comparable',
    perceivedDifference: 'clear',
    possibleConfounder: 'Auf der rechten Seite war der sichtbare Gegnerdruck oft höher.',
    userConclusion:
      'In dieser Stichprobe lag die Rate kontrollierter Entries links höher als rechts bei gleicher Messfrage; Gruppen unterschieden sich zusätzlich beim sichtbaren Gegnerdruck — kein Qualitätsurteil.',
  },
}

const E3_D3_STRONG: CompetencyFillFixture = {
  drillId: 'E3_D3',
  label: 'E3_D3 · Conditional-Outcome',
  answers: {
    __conditional_outcome_stage: 'complete',
    conditional_outcome_definition: {
      templateId: 'weak_side_exit',
      opportunityLabel: 'Exit-Versuche',
      condition: { id: 'weak_side_exit', label: 'Weak-Side-Support vorhanden' },
      targetEventLabel: 'kontrollierter Exit',
      question: 'Tritt kontrollierter Exit häufiger auf, wenn Weak-Side-Support vorhanden?',
    },
    conditionalHypothesis: 'target_more_with_condition',
    conditional_outcome_observations: [
      { id: obsId('e3d3-1'), order: 1, conditionState: 'present', outcomeState: 'target', period: '1', gameClock: '18:20', description: 'Support sichtbar, Exit kontrolliert.', validOpportunity: true },
      { id: obsId('e3d3-2'), order: 2, conditionState: 'present', outcomeState: 'target', period: '1', gameClock: '14:55', description: 'Weak-Side-Option, kontrollierter Exit.', validOpportunity: true },
      { id: obsId('e3d3-3'), order: 3, conditionState: 'present', outcomeState: 'other', period: '1', gameClock: '10:12', description: 'Support da, aber Clear statt Kontrolle.', validOpportunity: true },
      { id: obsId('e3d3-4'), order: 4, conditionState: 'present', outcomeState: 'target', period: '2', gameClock: '17:40', description: 'Erneut kontrollierter Exit mit Support.', validOpportunity: true },
      { id: obsId('e3d3-5'), order: 5, conditionState: 'present', outcomeState: 'unclear', period: '2', gameClock: '13:05', description: 'Ergebnis unklar trotz sichtbarem Support.', validOpportunity: true },
      { id: obsId('e3d3-6'), order: 6, conditionState: 'absent', outcomeState: 'other', period: '1', gameClock: '16:30', description: 'Kein Support, Soft Clear.', validOpportunity: true },
      { id: obsId('e3d3-7'), order: 7, conditionState: 'absent', outcomeState: 'other', period: '1', gameClock: '11:48', description: 'Isoliert, Puckverlust am Exit.', validOpportunity: true },
      { id: obsId('e3d3-8'), order: 8, conditionState: 'absent', outcomeState: 'target', period: '2', gameClock: '19:02', description: 'Gegenfall: kontrollierter Exit ohne Support.', validOpportunity: true },
      { id: obsId('e3d3-9'), order: 9, conditionState: 'absent', outcomeState: 'other', period: '2', gameClock: '08:22', description: 'Ohne Support, Exit scheitert.', validOpportunity: true },
      { id: obsId('e3d3-10'), order: 10, conditionState: 'unclear', outcomeState: 'other', period: '2', gameClock: '05:10', description: 'Bedingung am Bildrand unklar.', validOpportunity: true },
    ],
    comparability: 'mostly_comparable',
    hypothesisAssessment: 'partly_confirmed',
    counterexampleAssessment: 'some',
    alternativeExplanation:
      'Support trat öfter bei geringerem Forecheckdruck auf — der Druckunterschied könnte das Muster ebenfalls erklären.',
    possibleAdditionalDimension: 'Sichtbarer Gegnerdruck auf den Puckführer',
    userConclusion:
      'In meiner Stichprobe trat ein kontrollierter Exit bei vorhandenem Weak-Side-Support häufiger auf als ohne; Gegenfälle begrenzen die Aussage — keine Ursache.',
  },
}

const E3_D4_STRONG: CompetencyFillFixture = {
  drillId: 'E3_D4',
  label: 'E3_D4 · Tragfähigkeit',
  answers: {
    __evidence_assessment_stage: 'complete',
    __evidence_case_index: 0,
    __evidence_case_step: 'next_evidence',
    evidenceMicrofeedback: 'sample',
    evidence_assessments: {
      thin_sample: {
        caseId: 'thin_sample',
        dimensions: {
          sampleStrength: 'very_thin',
          comparability: 'mostly_comparable',
          counterexamples: 'some',
          differenceClarity: 'clear',
          definitionClarity: 'mostly_clear',
        },
        overallStrength: 'weak',
        strongestSupportedStatement: 'a',
        tooStrongStatement: 'c',
        userStatement:
          'In dieser Stichprobe trat das Zielereignis mit Support häufiger auf — die Basis ist aber sehr klein und eine einzelne weitere Beobachtung kann die Rate stark verändern.',
        evidenceNeededNext: 'more_comparable',
      },
      small_difference: {
        caseId: 'small_difference',
        dimensions: {
          sampleStrength: 'usable',
          comparability: 'mostly_comparable',
          counterexamples: 'some',
          differenceClarity: 'small',
          definitionClarity: 'mostly_clear',
        },
        overallStrength: 'suggestive',
        strongestSupportedStatement: 'a',
        tooStrongStatement: 'c',
        userStatement:
          'In dieser Stichprobe lag die Rate in Gruppe A etwas höher als in Gruppe B; der Unterschied ist klein und bleibt ein Hinweis innerhalb der beobachteten Fälle.',
        evidenceNeededNext: 'more_comparable',
      },
      poor_comparability: {
        caseId: 'poor_comparability',
        dimensions: {
          sampleStrength: 'usable',
          comparability: 'poorly_comparable',
          counterexamples: 'some',
          differenceClarity: 'clear',
          definitionClarity: 'mostly_clear',
        },
        overallStrength: 'weak',
        strongestSupportedStatement: 'a',
        tooStrongStatement: 'c',
        userStatement:
          'Mit Support wirkte der Exit häufiger kontrolliert — die Gruppen sind aber schlecht vergleichbar, deshalb keine belastbare Aussage über den Support-Effekt.',
        evidenceNeededNext: 'more_comparable',
      },
      solid_picture: {
        caseId: 'solid_picture',
        dimensions: {
          sampleStrength: 'solid',
          comparability: 'very_comparable',
          counterexamples: 'none_or_few',
          differenceClarity: 'clear',
          definitionClarity: 'very_clear',
        },
        overallStrength: 'reasonably_supported',
        strongestSupportedStatement: 'a',
        tooStrongStatement: 'c',
        userStatement:
          'In dieser ausgewogeneren Stichprobe trat das Zielereignis in Gruppe A konsistent häufiger auf als in Gruppe B — als ordentlich gestützter Hinweis, ohne Ursache zu behaupten.',
        evidenceNeededNext: 'more_comparable',
      },
    },
  },
}

const E3_D5_STRONG: CompetencyFillFixture = {
  drillId: 'E3_D5',
  label: 'E3_D5 · Aussagestufen',
  answers: {
    __claim_ladder_stage: 'complete',
    __claim_ladder_step: 'claim',
    __claim_ladder_case_index: 0,
    evidenceProfile: {
      finalClaim:
        'In dieser Stichprobe trat das beobachtete Muster in mehreren vergleichbaren Situationen häufiger auf als der Gegenfall — als vorläufiger Hinweis, ohne Ursache oder allgemeine Teamwahrheit.',
      falsificationCondition:
        'Der Unterschied verschwindet, wenn dieselben Situationen unter vergleichbarem Druck erneut gezählt werden und die Häufigkeit sich angleicht.',
      nextObservationTest:
        'Weitere vergleichbare Szenen mit gleicher Messdefinition und gleichem Druckkontext dokumentieren — nicht nur „mehr Daten“.',
      evidenceStrength: 'suggestive',
      maxClaimLevel: 'tendency',
    },
    finalClaim:
      'In dieser Stichprobe trat das beobachtete Muster in mehreren vergleichbaren Situationen häufiger auf als der Gegenfall — als vorläufiger Hinweis, ohne Ursache oder allgemeine Teamwahrheit.',
    falsificationCondition:
      'Der Unterschied verschwindet, wenn dieselben Situationen unter vergleichbarem Druck erneut gezählt werden und die Häufigkeit sich angleicht.',
    nextObservationTest:
      'Weitere vergleichbare Szenen mit gleicher Messdefinition und gleichem Druckkontext dokumentieren — nicht nur „mehr Daten“.',
  },
}

const FIXTURES: readonly CompetencyFillFixture[] = [
  B2_D5_STRONG,
  E1_D1_STRONG,
  E1_D5_STRONG,
  A1_D2_COMPLETE,
  A3_D2_STRONG,
  B1_D1_STRONG,
  B1_D2_STRONG,
  B1_D3_STRONG,
  B1_D4_STRONG,
  B1_D5_STRONG,
  C1_D5_STRONG,
  C2_D5_STRONG,
  C3_D5_STRONG,
  D1_D5_STRONG,
  D2_D5_STRONG,
  D3_D5_STRONG,
  E2_D1_STRONG,
  E2_D2_STRONG,
  E2_D3_STRONG,
  E2_D4_STRONG,
  E2_D5_STRONG,
  E3_D1_STRONG,
  E3_D2_STRONG,
  E3_D3_STRONG,
  E3_D4_STRONG,
  E3_D5_STRONG,
]

export function getCompetencyFillFixture(drillId: string | null | undefined): CompetencyFillFixture | null {
  const id = String(drillId || '').trim()
  if (!id) return null
  return FIXTURES.find((item) => item.drillId === id) ?? null
}

export function listCompetencyFillFixtures(): readonly CompetencyFillFixture[] {
  return FIXTURES
}
