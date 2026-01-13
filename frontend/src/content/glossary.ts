

export type GlossaryEntry = {
  label: string;
  short: string;
  long: string;
  synonyms?: string[];
  tags?: string[];
};

export const GLOSSARY: Record<string, GlossaryEntry> = {
  center: {
    label: "Center",
    short: "Zentraler Stürmer, verbindet Offensive und Defensive.",
    long:
      "Der Center ist der flexibelste Forward. Er unterstützt in der Defensivzone beim Unterstützen der Verteidiger, bietet in der Mitte Passoptionen, hilft beim Zonenexit und übernimmt defensiv häufig die Absicherung der Slot-/Mitte. Im Angriff ist er oft der „Connector“ zwischen Flügeln und Point/Defense.",
    synonyms: ["C", "centers"],
    tags: ["Rolle"],
  },

  winger: {
    label: "Winger",
    short: "Flügelstürmer links/rechts, oft Wandspiel und Tiefe.",
    long:
      "Winger (Left/Right Wing) spielen meist an den Flügeln. In der Defensivzone sind sie häufig zuerst an der Bande/Wand involviert (Puckbattle, Rim), im Breakout oft erste Outlet-Option oder Chip-/Support-Spieler. In der Offensive geben sie Breite, Tiefe und sind häufig erste Schuss-/Rebound-Optionen.",
    synonyms: ["LW", "RW", "Flügel"],
    tags: ["Rolle"],
  },
  defenseman: {
    label: "Defense",
    short: "Verteidiger, kontrolliert Gap, Breakout, Net-Front.",
    long:
      "Defensemen sichern die Defensivzone, kontrollieren den Abstand zum Angreifer (Gap), gewinnen Pucks, initiieren Breakouts (erste Pässe, Wheels, D-to-D) und schützen Net-Front/Slot. In der Offensive aktivieren sie an der Blue Line, halten Pucks im Zone-Play und wählen Schüsse (Shot Selection).",
    synonyms: ["D", "Verteidiger"],
    tags: ["Rolle"],
  },
  goalie: {
    label: "Goalie",
    short: "Torhüter, letzte Instanz, steuert Rebounds und Puckhandling.",
    long:
      "Der Goalie verhindert Tore, kontrolliert Rebounds und kann Breakouts unterstützen (Stopps hinter dem Tor, schnelle Abgaben). Seine Kommunikation („Leave it“, „Over“) beeinflusst die D-Zone-Organisation.",
    synonyms: ["Torwart"],
    tags: ["Rolle"],
  },
  puck: {
    label: "Puck",
    short: "Spielgerät – alles dreht sich um Kontrolle und Zeit.",
    long:
      "Puckkontrolle bedeutet Zeit und Optionen. Ohne Puck geht es um Abstände, Winkel und Anspielbarkeit. Mit Puck geht es um Entscheidungen: Pass, Carry, Dump, Shot.",
    tags: ["Grundlage"],
  },
  possession: {
    label: "Puckbesitz",
    short: "Kontrollierte Puckführung durch ein Team.",
    long:
      "Puckbesitz ist nicht nur „wer berührt“, sondern wer Kontrolle und Optionen hat. Kontrollierter Besitz ermöglicht strukturierte Exits/Entries und längere O-Zone-Sequenzen.",
    tags: ["Grundlage"],
  },
  structure: {
    label: "Struktur",
    short: "Geordnete Positionierung mit Abständen, Rollen, Optionen.",
    long:
      "Struktur heißt: Spieler stehen so, dass Passwege entstehen, Abstände stimmen und Absicherung vorhanden ist. Gute Struktur = weniger Turnovers, sauberere Exits/Entries und kontrolliertere Angriffe.",
    tags: ["Taktik"],
  },
  spacing: {
    label: "Spacing",
    short: "Abstände zwischen Spielern – Basis für Passwinkel und Kontrolle.",
    long:
      "Spacing beschreibt die sinnvollen Abstände zwischen Mitspielern. Zu eng: Passwege blockiert, wenig Zeit. Zu weit: keine Verbindung, riskante Pässe. Gutes Spacing schafft Dreiecke und saubere Anschlussoptionen.",
    synonyms: ["Abstände"],
    tags: ["Taktik"],
  },
  
  support: {
    label: "Support",
    short: "Anspielbare Unterstützung in Pucknähe bzw. in Anschlussräumen.",
    long:
      "Support bedeutet, dem Puckführer eine sichere Option zu geben: nahe genug für einen kurzen Pass, aber so positioniert, dass ein Passwinkel entsteht und der Gegner nicht leicht abfängt. Support ist zentral für Breakouts, OZ-Cycles und Board Battles.",
    tags: ["Taktik"],
  },
  d_zone: {
    label: "Defensivzone",
    short: "Zone vor dem eigenen Tor.",
    long:
      "Die Defensivzone ist der Bereich, in dem dein Team verteidigt. Ziele: Slot schützen, Puck gewinnen, strukturiert exitten (Breakout).",
    synonyms: ["D-Zone"],
    tags: ["Zonen"],
  },
  n_zone: {
    label: "Neutral Zone",
    short: "Bereich zwischen den Blue Lines.",
    long:
      "Die Neutral Zone verbindet beide Enden. Hier werden Entries/Exits entschieden: Regroup, Übergänge, Forecheck-Traps. Viele Turnovers entstehen an/um die Blue Lines.",
    synonyms: ["NZ", "Neutralzone"],
    tags: ["Zonen"],
  },
  o_zone: {
    label: "Offensivzone",
    short: "Zone vor dem gegnerischen Tor.",
    long:
      "In der Offensivzone will das angreifende Team Kontrolle aufbauen, Pressure erzeugen, Schüsse mit Traffic/Screen und Rebounds kreieren. Entscheidend sind Puckhaltung, Cycle, Point-Play und Slot-Attacken.",
    synonyms: ["O-Zone"],
    tags: ["Zonen"],
  },
  blue_line: {
    label: "Blue Line",
    short: "Zonengrenze – kritischer Decision-Point.",
    long:
      "Die Blue Line ist eine Hochrisiko-Zone: Hier entscheidet sich, ob ein Entry/Exit kontrolliert gelingt oder ein Turnover entsteht. Viele Systeme (1-1-3, 1-2-2) zielen genau auf diese Kante.",
    synonyms: ["Blaue Linie"],
    tags: ["Zonen"],
  },
  red_line: {
    label: "Red Line",
    short: "Mittellinie – relevant für Icing/Wechsel und Spielkontrolle.",
    long:
      "Die Center Line (rot) ist taktisch wichtig für Puckmanagement: Entscheidungen für Dump/Change, Icing-Management und die Struktur in der Neutral Zone.",
    synonyms: ["Mittellinie"],
    tags: ["Zonen"],
  },
  slot: {
    label: "Slot",
    short: "Gefahrenzone zentral vor dem Tor.",
    long:
      "Der Slot ist die höchste Danger-Zone: zentral vor dem Tor zwischen den Bullykreisen bis in den Low Slot. Defensiv will man ihn schließen, offensiv will man ihn besetzen (Screens, Tips, Rebounds).",
    synonyms: ["High Slot", "Low Slot"],
    tags: ["Zonen"],
  },
  net_front: {
    label: "Net-Front",
    short: "Raum direkt vor dem Tor – Screens, Rebounds, Box-out.",
    long:
      "Net-Front ist der Bereich direkt vor dem Goalie. Offensiv: Screen, Tip, Rebound. Defensiv: Box-out, Stick-Lanes, Körperposition. Viele Tore entstehen hier.",
    tags: ["Zonen"],
  },
  half_wall: {
    label: "Half-Wall",
    short: "Seitlicher Bereich in der O-Zone, meist Höhe Bullykreis.",
    long:
      "Die Half-Wall ist ein typischer Playmaking-Bereich: Puck sichern, Cycle starten, Pass in den Slot oder hoch zum Point. In Special Teams (PP) oft zentrale Rolle.",
    tags: ["Zonen"],
  },
  point: {
    label: "Point",
    short: "Bereich an der Blue Line (O-Zone), oft Defense-Aktivierung.",
    long:
      "Der Point ist die Zone nahe der Blue Line, in der Verteidiger Pucks halten, verteilen und schießen. Entscheidend: Shot Selection, Puck halten vs. Risiko Turnover/2-auf-1.",
    tags: ["Zonen"],
  },
  triangle: {
    label: "Dreieck",
    short: "3 Spieler mit sinnvollen Passwinkeln (nicht auf einer Linie).",
    long:
      "Ein Dreieck entsteht, wenn drei Spieler so positioniert sind, dass mind. zwei sichere Passwinkel existieren. Es ist ein Indikator für Struktur: der Puckführer hat Optionen (vor, seitlich, zurück). Dreiecke kippen/stabilisieren je nach Druck, Support und Spacing.",
    synonyms: ["Triangle"],
    tags: ["A1"],
  },
  passing_lane: {
    label: "Passweg",
    short: "Linie/Spur, entlang der ein Pass sicher ankommen kann.",
    long:
      "Passwege sind nicht nur „frei“, sondern hängen von Stickposition, Körperwinkel und Timing ab. Gute Passwege entstehen durch Spacing, Dreiecksbildung und Bewegung weg vom Gegner.",
    synonyms: ["Passing Lane"],
    tags: ["A1", "A2"],
  },
  outlet: {
    label: "Outlet",
    short: "Erste sichere Passoption im Breakout.",
    long:
      "Outlet ist der „erste Anschluss“ für den Breakout (z. B. Winger an der Wand, Center in der Mitte, D-to-D als Reset). Gute Outlets sind anspielbar, nicht statisch und bieten Folgeoptionen.",
    synonyms: ["Outlet Pass", "erste Option"],
    tags: ["A2"],
  },
  breakout: {
    label: "Breakout",
    short: "Strukturierter Zonenexit aus der D-Zone.",
    long:
      "Breakout bezeichnet den organisierten Übergang aus der eigenen Zone. Typisch: Puck gewinnen → erste Option (Outlet) → Anschlussoption → Exit über Blue Line. Qualität hängt von Timing, Support, Spacing und Entscheidungsfindung unter Druck ab.",
    synonyms: ["breakouts"],
      tags: ["A1", "A2"],
  },
  exit: {
    label: "Exit",
    short: "Moment/Ergebnis des Verlassens der D-Zone.",
    long:
      "Exit ist das tatsächliche Verlassen der Defensivzone. Er kann kontrolliert (Pass/Carry) oder unkontrolliert (Befreiung/Dump) sein. Ein guter Exit ermöglicht einen geordneten Übergang in die Neutral Zone (Transition).",
    tags: ["A2"],
  },
  controlled_exit: {
    label: "Kontrollierter Exit",
    short: "Puck geht mit Kontrolle raus (Pass oder Carry).",
    long:
      "Kontrolliert heißt: Team behält Besitz oder hat unmittelbare Anschlussoptionen. Kontrollierte Exits führen häufiger zu kontrollierten Entries und mehr O-Zone-Time.",
    tags: ["A2"],
  },
  uncontrolled_exit: {
    label: "Unkontrollierter Exit",
    short: "Puck wird nur rausgeschlagen/rausgeworfen (Befreiung).",
    long:
      "Unkontrolliert heißt: der Puck wird „entsorgt“, ohne klaren Anschluss. Kann okay sein unter massivem Druck, führt aber oft zu schnellem Gegenangriff oder erneuter Pressure (Re-entry).",
    synonyms: ["Befreiung"],
    tags: ["A2"],
  },
  turnover: {
    label: "Turnover",
    short: "Puckverlust an den Gegner (meist durch schlechten Pass/Entscheidung).",
    long:
      "Ein Turnover entsteht durch Fehlpass, verlorenen Zweikampf oder schlechte Entscheidung (z. B. riskanter Pass an der Blue Line). Besonders gefährlich sind Turnovers im Slot, am Point und an der eigenen Blue Line.",
    synonyms: ["turnovers"],
    tags: ["A2"],
  },
  winkel: {
  label: "Winkel",
  short: "Ausrichtung von Körper und Laufweg relativ zu Gegner, Puck oder Raum.",
  long:
    "Der Winkel beschreibt, aus welcher Richtung ein Spieler agiert – z. B. beim Anlaufen, Absichern oder Anbieten. Gute Winkel begrenzen Optionen des Gegners, öffnen Passwege oder sichern Räume ab. Entscheidend ist nicht die Geschwindigkeit, sondern die Ausrichtung: Ein guter Winkel lenkt das Spiel, ein schlechter öffnet Räume.",
  synonyms: ["Anlaufwinkel", "Spielwinkel"],
  tags: ["Taktik", "Raumkontrolle", "Verteidigung"],
  },
  regroup: {
    label: "Regroup",
    short: "Reset/Neuaufbau, meist zurück zu den Verteidigern.",
    long:
      "Regroup heißt: Attack abbrechen oder kontrollieren, Puck sichern und neu sortieren (oft D-to-D / zurück in die Neutral Zone), um einen besseren Entry/Breakout zu starten.",
    tags: ["Transition"],
  },
  low: {
    label: "Low",
    short: "Center tief, nahe eigenes Tor/untere Zone.",
    long:
      "Low bedeutet: Center arbeitet tief in der Defensivzone (unterhalb Bullypunkte/nahe Slot), unterstützt die Defense, bietet kurze Outlet-Option und sichert die Mitte gegen Cuts.",
    tags: ["A1"],
  },
  middle: {
    label: "Middle",
    short: "Center in der Mitte als Verbindung und Sicherung.",
    long:
      "Middle bedeutet: Center hält zentrale Position zwischen tief und hoch – er ist Passdrehscheibe, unterstützt Breakout-Lanes und ist primär dafür da, die Mitte zu kontrollieren (defensiv) und spielbar zu bleiben (offensiv).",
    tags: ["A1"],
  },
  high: {
    label: "High",
    short: "Center hoch, näher zur Blue Line/Neutral Zone.",
    long:
      "High bedeutet: Center steht höher (näher Blue Line), oft als schnelle Exit-/Transition-Option. Risiko: Mitte wird defensiv offen, wenn er zu früh hoch geht. Vorteil: schnelle Konter/Tempo im Exit.",
    tags: ["A1"],
  },
    Aktionen: {
    label: "High",
    short: "Center hoch, näher zur Blue Line/Neutral Zone.",
    long:
      "High bedeutet: Center steht höher (näher Blue Line), oft als schnelle Exit-/Transition-Option. Risiko: Mitte wird defensiv offen, wenn er zu früh hoch geht. Vorteil: schnelle Konter/Tempo im Exit.",
    tags: ["A1"],
  },
  angling: {
    label: "Angling",
    short: "Gegner über Winkel in eine schlechte Route lenken.",
    long:
      "Angling heißt: du greifst nicht frontal an, sondern schneidest dem Puckführer Wege ab und lenkst ihn zur Bande oder in Unterstützung, sodass er weniger Optionen hat.",
    tags: ["B/C später"],
  },
  gap: {
    label: "Gap",
    short: "Abstand zwischen Verteidiger und Angreifer im Rush.",
    long:
      "Gap Control ist das Management des Abstands, damit der Verteidiger Druck ausübt, ohne geschlagen zu werden. Zu groß: Zeit/Raum für den Angreifer. Zu klein: wird leicht ausgespielt.",
    tags: ["später"],
  },
  forecheck: {
    label: "Forecheck",
    short: "Vorlaufen/Pressure im Angriff gegen gegnerischen Breakout.",
    long:
      "Forecheck ist die Struktur, mit der das angreifende Team den gegnerischen Breakout stört (z. B. 1-2-2). Ziel: Turnover erzwingen oder schlechten Exit erzwingen.",
    tags: ["später"],
  },
  backcheck: {
    label: "Backcheck",
    short: "Rückwärtsarbeit der Stürmer, um Rushes zu verteidigen.",
    long:
      "Backcheck bedeutet: Forwards arbeiten zurück, schließen die Mitte, nehmen Trailer weg und helfen, den Rush zu entschärfen, bevor er gefährlich wird.",
    tags: ["später"],
  },
  shift: {
    label: "Shift",
    short: "Einsatzzeit eines Spielers ohne Wechsel (meist 30–60 Sekunden).",
    long:
      "Ein Shift ist die Zeit, in der ein Spieler auf dem Eis ist, bis zum Wechsel. Beobachtungsdrills nutzen Shifts als Zähleinheit, weil sie kurze, wiederholbare Beobachtungsfenster sind.",
    synonyms: ["Shifts", "Einsatzzeit", "Wechselzeit", "shift", "shiftzeit", "shiftdauer", "Schicht", "Schichten"],
    tags: ["Lernmodus"],
  },
  period: {
    label: "Drittel",
    short: "Spielabschnitt (1., 2., 3. Drittel).",
    long:
      "Ein Drittel ist ein fester Spielabschnitt. Period-Check-ins sind bewusst grob, damit du Muster statt Einzelszenen bewertest.",
    tags: ["Lernmodus"],
  },
    absicherung: {
      label: "Absicherung",
      short: "Defensive Absicherung, Rückhalt für riskante Aktionen.",
      long:
        "Absicherung bedeutet, dass ein Spieler oder eine Formation dafür sorgt, dass bei einem Angriff oder einer riskanten Aktion immer jemand defensiv abgesichert ist, um Turnovers oder Konter zu verhindern.",
      tags: ["Taktik"],
    },
    anspielstation: {
      label: "Anspielstation",
      short: "Spieler, der als sichere Passoption dient."   ,
      long:
        "Eine Anspielstation ist ein Mitspieler, der sich so positioniert, dass er für den Puckführenden eine sichere Passoption bietet. Gute Anspielstationen entstehen durch Bewegung, Spacing und Struktur.",
      synonyms: ["Passoption"],
      tags: ["Taktik"],
    },
    dreiecke: {
    label: "Dreiecke",
    short: "Struktur aus drei Spielern mit mindestens zwei Passoptionen.",
    long:
        "Ein Dreieck beschreibt eine Spielsituation, in der drei Spieler so positioniert sind, dass der Puckführende gleichzeitig mindestens zwei sichere Passoptionen hat. Dreiecke entstehen dynamisch durch Bewegung, Abstände und Winkel – sie sind keine feste Formation, sondern ein Strukturprinzip. Stabile Dreiecke ermöglichen Puckzirkulation, Zeitgewinn und kontrolliertes Spiel unter Druck. Reißen Dreiecke auf, steigt das Risiko für Turnover deutlich.",
    synonyms: ["Dreiecksstruktur", "Passing Triangle", "Dreiecken"],
    tags: ["Taktik", "Struktur", "Puckbesitz"],
    },
  inside_position: {
    label: "Inside Position",
    short: "Verteidiger steht zwischen Gegner und Tor, blockiert direkten Weg.",
    long:
        "Inside Position bedeutet, dass der Verteidiger seinen Körper so positioniert, dass er den direkten Weg des Angreifers zum Tor blockiert. Der Gegner wird nach außen oder zur Bande gelenkt, wodurch der Slot/Mitte geschützt bleibt. Inside Position ist entscheidend für Gap-Kontrolle und verhindert gefährliche Schüsse oder Drives.",
    synonyms: ["Innere Position", "Inside"],
    tags: ["Defensive", "Positionierung"],
  },
  outside_position: {
    label: "Outside Position",
    short: "Verteidiger steht seitlich oder hinter dem Gegner, öffnet Raum zur Mitte.",
    long:
        "Outside Position beschreibt eine schlechte defensive Ausrichtung, bei der der Verteidiger den Gegner nicht zwischen sich und dem Tor hält. Der Angreifer kann Richtung Slot ziehen, was gefährliche Schusswinkel oder Drives ermöglicht. Outside Position entsteht oft durch zu weiten Abstand oder falsche Körperachse.",
    synonyms: ["Äußere Position", "Outside"],
    tags: ["Defensive", "Positionierung"],
  },

  körperachse: {
    label: "Körperachse",
    short: "Ausrichtung des Oberkörpers, zeigt Absicht und Kontrolle.",
    long:
        "Die Körperachse beschreibt, wie der Oberkörper eines Spielers ausgerichtet ist – frontal (konfrontativ), schräg (lenkend) oder seitlich (offen). Eine gute Körperachse hilft, Gegner zu lenken, Passwege zu öffnen oder Räume zu schließen. Sie ist wichtiger als die Beinposition für die Spielkontrolle.",
    synonyms: ["Oberkörperachse", "Body Angle"],
    tags: ["Positionierung", "Technik"],
  },
  lenkung: {
    label: "Lenkung",
    short: "Gegner durch Positionierung in eine bestimmte Richtung führen.",
    long:
        "Lenkung bedeutet, den Gegner durch eigene Positionierung und Bewegung in eine ungefährliche Richtung zu zwingen – z.B. zur Bande oder nach außen. Gute Lenkung verhindert Drives zum Tor und öffnet eigene Passwege. Sie basiert auf Timing, Abstand und Körperachse.",
    synonyms: ["Gegnerlenkung", "Deflection"],
    tags: ["Defensive", "Taktik"],
  },

  strukturgefuehl: {
    label: "Strukturgefühl",
    short: "Subjektiver Gesamteindruck der teaminternen Ordnung.",
    long:
      "Es geht nicht um einzelne Aktionen, sondern um Abstände, Verbindungen und Wiedererkennbarkeit von Rollen über mehrere Sequenzen hinweg.\n\n• geordnet = klare Abstände, stabile Dreiecke, Spieler sind anspielbar\n• mixed = phasenweise Struktur, Ordnung bricht situativ\n• chaotisch = Abstände reißen, Mitte fehlt, keine klaren Optionen",
    synonyms: ["Teamstruktur", "Ordnungsgefühl"],
    tags: ["Taktik", "Wahrnehmung"],
  }, 
  
};
