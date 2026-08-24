

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
    label: "Anspielstation",
    short: "Unmittelbares, erreichbares Passziel für den Puckführer.",
    long:
      "Anspielstation (engl. Outlet): Ein Spieler, der für den Puckführer als unmittelbares und erreichbares Passziel verfügbar ist. Anschlussoption ist eine mögliche folgende Verbindung und muss nicht der nächste Passempfänger sein. In B1_D4 eine mögliche Centerfunktion — keine Breakout-Systemregel.",
    synonyms: ["Outlet", "Outlet Pass", "erste Anspielstation"],
    tags: ["B1", "A2"],
  },
  spielbar: {
    label: "Spielbar",
    short: "Über eine Passbahn erreichbar und für Fortsetzung nutzbar.",
    long:
      "Spielbar: für den Puckführer über eine erkennbare Passbahn erreichbar und für eine unmittelbare Fortsetzung nutzbar. Situationsabhängig — bedeutet nicht, dass ein Pass die richtige Entscheidung wäre. Anspielbar bezeichnet nur die erreichbare direkte Passmöglichkeit; Unterstützung (engl. Support) ist der Oberbegriff.",
    synonyms: ["Anspielbar", "spielbare Unterstützung"],
    tags: ["B1"],
  },
  antizipation: {
    label: "Antizipation",
    short: "Begründete Erwartung — keine sichere Vorhersage.",
    long:
      "Eine begründete Erwartung über eine mögliche nächste Aktion auf Grundlage aktuell sichtbarer und kontextbezogener Informationen. Sie ist keine sichere Vorhersage. RinQ beobachtet nur sichtbare Vorbereitung — keine innere Wahrnehmung.",
    synonyms: ["Anticipation", "Erwartung", "Situationslesen", "sichtbare Vorbereitung", "Timing"],
    tags: ["B1", "E4"],
  },
  puckfuehrer: {
    label: "Puckführer",
    short: "Bewegt oder passt den Puck nach dem Gewinn kontrolliert nach vorne.",
    long:
      "Situative Funktion nach Puckgewinn (A3_D2): Der Puckführer bewegt oder passt den Puck kontrolliert nach vorne. Keine feste Positionsrolle — Wechsel innerhalb weniger Sekunden möglich.",
    synonyms: ["Puckträger"],
    tags: ["A3"],
  },
  tiefenlaeufer: {
    label: "Tiefenläufer",
    short: "Läuft in freien Raum und gibt dem Angriff Tiefe.",
    long:
      "Situative Funktion nach Puckgewinn (A3_D2): Läuft in freien Raum, gibt dem Angriff Tiefe oder zieht Gegenspieler auseinander. RinQ-Label, keine DEB-Pflichtrolle.",
    synonyms: ["Tiefengeber"],
    tags: ["A3"],
  },
  sofort_fortsetzen: {
    label: "Sofort fortsetzen",
    short: "Neue Situation unmittelbar nach vorne nutzen.",
    long:
      "Sofort fortsetzen (A3_D3): Das Team nutzt die neue Situation unmittelbar und bewegt oder passt den Puck erkennbar nach vorne. Absicherung wird parallel erfasst und ist keine Alternative zur Hauptrichtung.",
    tags: ["A3"],
  },
  kontrolliert_neu_aufbauen: {
    label: "Kontrolliert neu aufbauen",
    short: "Tempo nehmen, Puck halten, neue Optionen herstellen.",
    long:
      "Kontrolliert neu aufbauen (A3_D3): Das Team nimmt Tempo aus der unmittelbaren Vorwärtsbewegung, hält den Puck und stellt neue Struktur oder Optionen her. Oberbegriff Neuaufbau (A2).",
    synonyms: ["Neuaufbau"],
    tags: ["A3"],
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
  low: {
    label: "Hinter dem Spiel",
    short: "Relativ zur aktuellen Aktion eher auf der rückwärtigen Seite.",
    long:
      "Hinter dem Spiel ist keine gemalte Zone auf dem Eis. Es beschreibt, wo ein Spieler relativ zur Szene steht: eher auf der rückwärtigen Seite der aktuellen Aktion. Warum er dort steht, kommt später. Frühere/englische RinQ-Bezeichnung: Low.",
    synonyms: ["Low", "tief relativ zum Spiel"],
    tags: ["A1"],
  },
  middle: {
    label: "Auf Verbindungshöhe",
    short: "Zwischen Absicherung und vorderer Fortsetzung — kann verbinden.",
    long:
      "Auf Verbindungshöhe heißt: der Spieler steht zwischen rückwärtiger Absicherung und vorderer Fortsetzung und kann Spieler oder Räume verbinden. Nicht automatisch die geometrische Eisflächenmitte. Frühere/englische RinQ-Bezeichnung: Middle.",
    synonyms: ["Middle", "Verbindungshöhe"],
    tags: ["A1"],
  },
  high: {
    label: "Vor dem Spiel",
    short: "Relativ zur aktuellen Aktion eher auf der vorwärtsgerichteten Seite.",
    long:
      "Vor dem Spiel heißt: der Spieler steht eher auf der vorwärtsgerichteten Seite der aktuellen Aktion. Wieder relativ zur Szene, nicht fest an der Blue Line. Frühere/englische RinQ-Bezeichnung: High.",
    synonyms: ["High", "hoch relativ zum Spiel"],
    tags: ["A1"],
  },
  absichern: {
    label: "Absichern",
    short: "Hinter oder neben der Aktion entsteht Sicherheit.",
    long:
      "Absichern (A1-Funktion): Der Center positioniert sich so, dass hinter oder neben der Aktion eine Option bleibt, falls die aktuelle Aktion scheitert. Früheres UI-Label: Sichern. In D4 (zusätzlicher Feldspieler / leeres Tor) als Absicherung hinter dem Puck: Positionierung hinter dem Puck bzw. hinter der Angriffsaktion, um freien Puck, Puckverlust oder Befreiungsversuch aufnehmen zu können — keine Garantie gegen Gegentor.",
    synonyms: ["Sichern", "securing", "Absicherung hinter dem Puck"],
    tags: ["A1", "D4"],
  },
  verbinden: {
    label: "Verbinden",
    short: "Puckführer und nächste Option spielbar verbinden.",
    long:
      "Verbinden (A1-Funktion): Der Center schafft eine spielbare Verbindung zwischen Puckführer und weiterer Option bzw. Raum.",
    synonyms: ["connecting"],
    tags: ["A1"],
  },
  angriff_unterstuetzen: {
    label: "Angriff unterstützen",
    short: "Bewegung öffnet Raum oder eine nächste offensive Option.",
    long:
      "Angriff unterstützen (A1-Funktion): Der Center bewegt sich so, dass eine nächste offensive Aktion möglich wird. Früheres Label: Mit nach vorne.",
    synonyms: ["Mit nach vorne", "advancing"],
    tags: ["A1"],
  },
  anschlussoption: {
    label: "Anschlussoption",
    short: "Sichtbar erreichbare nächste Aktion für den Puckführer.",
    long:
      "Anschlussoption: Eine für den Puckführer sichtbar erreichbare nächste Aktion (Pass, Schuss, Puckführung, Rückpass). In A1 auch: Center macht eine folgende spielbare Verbindung möglich. In D4 (Vorbereitung der Aktion): nur sichtbare Vorbereitung — keine Entscheidungsqualität und keine rückblickend bessere Alternative.",
    synonyms: ["next option", "Outlet"],
    tags: ["A1", "D4"],
  },
  puck_fuehren: {
    label: "Puck führen",
    short: "Spieler behält den Puck und bewegt ihn kontrolliert weiter.",
    long:
      "Puck führen (A2): Der Spieler behält den Puck und bewegt ihn selbst kontrolliert weiter. Englische Nähe: Carry. Kein Werturteil.",
    synonyms: ["Carry", "Controlled Carry"],
    tags: ["A2"],
  },
  tief_spielen: {
    label: "Tief spielen",
    short: "Puck bewusst tief oder in freien Raum — ohne unmittelbaren Empfänger.",
    long:
      "Tief spielen (A2/C2): Der Puck wird ohne kontrolliertes Hineinführen oder unmittelbare Passverbindung tief in die Angriffszone gespielt. Englische Nähe: Dump / Dump-in. Abgrenzung: klar vorgesehener Empfänger im tiefen Raum → Pass; kontrollierter Eintritt mit reduziertem Tempo bleibt unter Kontrolle.",
    synonyms: ["Dump", "Dump-in", "Chip", "Puck tief spielen"],
    tags: ["A2", "C2"],
  },
  puck_tief_spielen: {
    label: "Puck tief spielen",
    short: "Puck ohne kontrolliertes Hineinführen tief in die Angriffszone spielen.",
    long:
      "Puck tief spielen (A2/C2/D3): Der Puck wird ohne kontrolliertes Hineinführen oder unmittelbare Passverbindung tief in die Angriffszone gespielt. Englisch häufig Dump-in. In D3 operational mit vs. ohne vorbereitete Puckjagd abgrenzen — keine Qualitätsrangfolge.",
    synonyms: ["Dump-in", "Dump", "Tief spielen"],
    tags: ["C2", "A2", "D3"],
  },
  eintrittsweg: {
    label: "Eintrittsweg",
    short: "Korridor durch die Neutral Zone zur offensiven blauen Linie.",
    long:
      "Eintrittsweg / Neutraler-Zonen-Weg (C2): Räumlicher Korridor, über den ein Angriff die neutrale Zone durchqueren und die offensive blaue Linie erreichen kann.",
    synonyms: ["Neutraler-Zonen-Weg", "Korridor", "Lane"],
    tags: ["C2"],
  },
  geschlossener_weg: {
    label: "Geschlossener Weg",
    short: "Korridor, der sichtbar schwerer nutzbar wird.",
    long:
      "Geschlossener Weg (C2): Ein Korridor, der durch Positionierung, Abstände oder Stockpositionen sichtbar schwerer nutzbar wird.",
    synonyms: ["Geschlossener Korridor", "Denied lane"],
    tags: ["C2"],
  },
  verbleibender_weg: {
    label: "Verbleibender Weg",
    short: "Route, die in der Szene am ehesten nutzbar bleibt.",
    long:
      "Verbleibender Weg (C2): Die Route, die in der beobachteten Szene am ehesten nutzbar bleibt. Der Begriff behauptet keine bewusste taktische Freigabe.",
    synonyms: ["Am ehesten verfügbarer Weg", "Available route"],
    tags: ["C2"],
  },
  tiefenebene: {
    label: "Tiefenebene",
    short: "Defensivspieler auf ähnlicher Höhe.",
    long:
      "Tiefenebene (C2): Eine Gruppe oder Position von Defensivspielern auf ähnlicher Höhe. Mehrere versetzte Ebenen können den Raum hinter einem ersten Zugriff absichern. Mehr Ebenen sind nicht automatisch besser.",
    synonyms: ["Layer", "Staffelungsebene"],
    tags: ["C2"],
  },
  verbundenheit: {
    label: "Verbundenheit",
    short: "Räumliche Beziehungen und Abstände zur Unterstützung.",
    long:
      "Verbundenheit (C1/C2): Räumliche Beziehungen und Abstände, durch die Spieler einander unterstützen oder Räume übernehmen können.",
    synonyms: ["Connected", "Verbundenheit der Struktur"],
    tags: ["C1", "C2"],
  },
  pucknahe_seite: {
    label: "Pucknahe Seite",
    short: "Seite der Eisfläche, auf der sich der Puck befindet.",
    long: "Pucknahe Seite (C2): Die Seite der Eisfläche, auf der sich der Puck befindet.",
    synonyms: ["Puck side", "Strong side"],
    tags: ["C2"],
  },
  puckferne_seite: {
    label: "Puckferne Seite",
    short: "Gegenüberliegende Seite der Eisfläche (EN: weak side).",
    long:
      "Puckferne Seite (C2/D2): Die gegenüberliegende Seite der Eisfläche. Englisch häufig weak side; situationsabhängig nicht mit „schwach“ im Sinne geringerer Qualität gleichzusetzen.",
    synonyms: ["Weak side", "Weak-Side", "Weak Side"],
    tags: ["C2", "D2"],
  },
  kontrollierter_zoneneintritt: {
    label: "Kontrollierter Zoneneintritt",
    short: "Puck kontrolliert über die offensive blaue Linie.",
    long:
      "Kontrollierter Zoneneintritt (C2): Der Puck wird beim Überqueren der offensiven blauen Linie kontrolliert geführt oder unmittelbar kontrolliert weitergespielt.",
    synonyms: ["Controlled entry"],
    tags: ["C2"],
  },
  kontrollierter_eintritt_reduziertes_tempo: {
    label: "Kontrollierter Eintritt mit reduziertem Tempo",
    short: "Puck bleibt kontrolliert, Tempo oder Anschlussoptionen reduziert.",
    long:
      "Kontrollierter Eintritt mit reduziertem Tempo (C2): Der Puck bleibt beim Eintritt kontrolliert, während Geschwindigkeit oder direkte Anschlussoptionen sichtbar reduziert sind. Abgrenzung zu Puck tief spielen.",
    synonyms: ["Slow entry"],
    tags: ["C2"],
  },
  ueberspielte_erste_ebene: {
    label: "Überspielte erste Ebene",
    short: "Angriff bringt Puck oder Puckführer an der vordersten Ebene vorbei.",
    long:
      "Überspielte erste Ebene (C2): Der Angriff bringt Puck oder Puckführer an der vordersten erkennbaren defensiven Ebene vorbei. C2 liest die Systemanpassung danach — nicht individuelles Versagen (B3).",
    synonyms: ["Breakthrough", "First layer beaten"],
    tags: ["C2"],
  },
  beobachtungsabschnitt: {
    label: "Beobachtungsabschnitt",
    short: "Ausgewählter Zeitraum oder ausgewählte Szenen einer Zusammenfassung.",
    long:
      "Beobachtungsabschnitt (C2): Der ausgewählte Zeitraum oder die ausgewählten Szenen, auf die sich eine Zusammenfassung bezieht.",
    synonyms: ["Stichprobe", "Beobachtungszeitraum"],
    tags: ["C2"],
  },
  neutral_zone_beobachtung: {
    label: "Neutral-Zone-Beobachtung",
    short: "Vorsichtige Zusammenfassung sichtbarer NZ-Prinzipien im Abschnitt.",
    long:
      "Neutral-Zone-Beobachtung (C2): Eine vorsichtige Zusammenfassung wiederkehrender sichtbarer Prinzipien im ausgewählten Abschnitt. Sie beschreibt keine dauerhafte Team- oder Systemidentität.",
    synonyms: ["Heutige Neutral-Zone-Beobachtung"],
    tags: ["C2"],
  },
  direkt_vor_dem_tor: {
    label: "Direkt vor dem Tor",
    short: "Raum unmittelbar vor dem Tor.",
    long:
      "Direkt vor dem Tor (C3): Raum unmittelbar vor dem Tor. Dort können Sichtbehinderung, Abfälschungen, Abpraller oder kurze Ablagen entstehen. Englisch häufig Net Front.",
    synonyms: ["Net Front", "Net-Front"],
    tags: ["C3"],
  },
  zentraler_abschlussraum: {
    label: "Slot",
    short: "Zentraler Raum vor dem Tor für Abschlüsse oder Anschlüsse.",
    long:
      "Slot (C3): Zentraler Raum vor dem Tor, aus dem direkte Abschlüsse oder gefährliche Anschlussaktionen möglich werden können. Im Hockey üblich als Slot (nicht weiter eingedeutscht).",
    synonyms: ["Zentraler Abschlussraum", "Slot-Bereich"],
    tags: ["C3"],
  },
  seitenraum: {
    label: "Seitenraum",
    short: "Seitlicher Raum entlang der Bande in der Angriffszone.",
    long:
      "Seitenraum (C3): Seitlicher Raum entlang der Bande in der Angriffszone. Englisch häufig Halfwall.",
    synonyms: ["Halfwall", "Half-wall", "Half Wall"],
    tags: ["C3"],
  },
  hoher_raum_blaue_linie: {
    label: "Point",
    short: "Bereich nahe der blauen Linie.",
    long:
      "Point (C3): Bereich der Angriffszone nahe der blauen Linie. Kann Seiten verbinden und Tiefe hinzufügen. Im Hockey üblich als Point (nicht als „Hoher Raum“).",
    synonyms: ["High", "High / Point", "Hoher Raum an der blauen Linie"],
    tags: ["C3"],
  },
  hinter_dem_tor: {
    label: "Hinter dem Tor",
    short: "Raum hinter der Torlinie.",
    long:
      "Hinter dem Tor (C3): Raum hinter der Torlinie, aus dem neue Passwinkel oder Richtungswechsel entstehen können. Englisch Behind the Net.",
    synonyms: ["Behind the Net", "Behind Net"],
    tags: ["C3"],
  },
  spielbare_verbindung: {
    label: "Spielbare Verbindung",
    short: "Realistisch erreichbare Pass- oder Anschlussoption.",
    long:
      "Spielbare Verbindung (C3): Eine unter den sichtbaren Bedingungen realistisch erreichbare Pass- oder Anschlussoption zwischen zwei Räumen oder Spielern. Freie Sichtlinie allein reicht nicht immer.",
    synonyms: ["Passing option", "Support connection"],
    tags: ["C3"],
  },
  tiefer_raum: {
    label: "Tiefer Raum",
    short: "Bereich der Angriffszone näher an Torlinie und Tor.",
    long: "Tiefer Raum (C3): Bereich der Angriffszone näher an Torlinie und Tor.",
    synonyms: ["Low", "Low ice"],
    tags: ["C3"],
  },
  zentraler_raum: {
    label: "Mitte",
    short: "Mittlere Ebene zwischen Tief und Point.",
    long: "Mitte (C3): Mittlere Ebene beziehungsweise zentraler Bereich zwischen tiefem Bereich und Point. Nicht identisch mit Slot.",
    synonyms: ["Middle", "Mid ice", "Zentraler Raum"],
    tags: ["C3"],
  },
  hoher_raum: {
    label: "Point",
    short: "Bereich näher an der blauen Linie.",
    long: "Point (C3): Bereich näher an der blauen Linie. Primärbegriff Point statt „Hoher Raum“.",
    synonyms: ["High", "Hoher Raum", "High ice"],
    tags: ["C3"],
  },
  positionswechsel_ohne_puck: {
    label: "Positionswechsel ohne Puck",
    short: "Angreifer wechselt ohne Puck Raum oder Höhe.",
    long:
      "Positionswechsel ohne Puck (C3): Ein Angreifer wechselt ohne Puck seinen Raum oder seine Höhe. Englisch häufig off-puck rotation.",
    synonyms: ["Off-puck rotation", "Rotation ohne Puck"],
    tags: ["C3"],
  },
  mehrfachbesetzung: {
    label: "Mehrfachbesetzung",
    short: "Mehrere Angreifer besetzen denselben Teilraum oder dieselbe Seite.",
    long:
      "Mehrfachbesetzung (C3): Mehrere Angreifer besetzen gleichzeitig denselben Teilraum oder dieselbe Seite. Englisch häufig overload.",
    synonyms: ["Overload", "Überladung"],
    tags: ["C3"],
  },
  bewegung_zum_tor: {
    label: "Bewegung zum Tor",
    short: "Direkte Bewegung in Richtung Tor oder Abschlussraum.",
    long:
      "Bewegung zum Tor (C3): Direkte Bewegung eines Angreifers in Richtung Tor, zentralen Abschlussraum oder Raum unmittelbar vor dem Tor. Englisch häufig drive.",
    synonyms: ["Drive", "Drive to net"],
    tags: ["C3"],
  },
  sichtbare_oeffnung: {
    label: "Sichtbare Öffnung",
    short: "Neue Passlinie, Schussbahn, Raum- oder Zeitoption nach Bewegung.",
    long:
      "Sichtbare Öffnung (C3): Eine nach einer Bewegung erkennbare neue Passlinie, Schussbahn, Raum- oder Zeitoption. Sie ist noch keine Bewertung der anschließenden Entscheidung.",
    synonyms: ["Opening", "Created seam"],
    tags: ["C3"],
  },
  zusaetzlicher_pass: {
    label: "Zusätzlicher Pass",
    short: "Weiterer Pass nach einer bereits entstandenen Öffnung.",
    long:
      "Zusätzlicher Pass (C3): Ein weiterer Pass nach einer bereits entstandenen Öffnung. Englisch häufig extra pass.",
    synonyms: ["Extra Pass", "Extra pass"],
    tags: ["C3"],
  },
  tiefes_zusammenspiel: {
    label: "Tiefes Zusammenspiel",
    short: "Fortsetzung der Sequenz im tiefen Bereich der Angriffszone.",
    long:
      "Tiefes Zusammenspiel (C3): Fortsetzung der Sequenz im tiefen Bereich der Angriffszone. Englisch häufig cycle oder low cycle.",
    synonyms: ["Cycle", "Low Cycle", "Low cycle"],
    tags: ["C3"],
  },
  neuaufbau_hoher_raum: {
    label: "Neuaufbau über den Point",
    short: "Rückspiel an den Point zur Neuordnung.",
    long:
      "Neuaufbau über den Point (C3): Rückspiel in den Point-Bereich nahe der blauen Linie, um Verbindungen und Übersicht neu zu ordnen. Englisch häufig reset oder reset high.",
    synonyms: ["Reset", "Reset High", "Reset high", "Neuaufbau über den hohen Raum"],
    tags: ["C3"],
  },
  puckkontrolle_halten: {
    label: "Puckkontrolle halten",
    short: "Puck schützen oder halten, während eine neue Option gesucht wird.",
    long:
      "Puckkontrolle halten (C3): Den Puck schützen oder in Besitz halten, während eine neue spielbare Option gesucht wird.",
    synonyms: ["Protect the puck", "Hold possession"],
    tags: ["C3"],
  },
  offensivstruktur_beobachtung: {
    label: "Offensivstruktur-Beobachtung",
    short: "Vorsichtige Zusammenfassung sichtbarer OZ-Strukturprinzipien.",
    long:
      "Offensivstruktur-Beobachtung (C3): Vorsichtige Zusammenfassung wiederkehrender sichtbarer Strukturprinzipien des ausgewählten Abschnitts. Sie beschreibt keine dauerhafte Team-, Spielzug- oder Systemidentität.",
    synonyms: ["Heutige Offensivstruktur-Beobachtung"],
    tags: ["C3"],
  },
  lokaler_ueberzahlvorteil: {
    label: "Lokaler Überzahlvorteil",
    short: "Raum mit mehr spielbaren Optionen, als die Unterzahl gleichzeitig kontrolliert.",
    long:
      "Lokaler Überzahlvorteil (D1): Ein in einer konkreten Szene sichtbarer räumlicher Vorteil, bei dem mehr spielbare offensive Optionen vorhanden sind, als die Unterzahl gleichzeitig kontrollieren kann. RinQ-Beobachtungsbegriff — keine Absicht oder Pflichtreaktion.",
    synonyms: ["Überzahlvorteil", "Local advantage"],
    tags: ["D1"],
  },
  zentrale_kurzoption: {
    label: "Zentrale Kurzoption",
    short: "Kurze zentrale Passoption vor oder zwischen Unterzahlspielern.",
    long:
      "Zentrale Kurzoption (D1): Kurze zentrale Passoption zwischen oder vor Unterzahlspielern. Englisch häufig Bumper.",
    synonyms: ["Bumper", "High Slot"],
    tags: ["D1"],
  },
  hohe_verbindung: {
    label: "Hohe Verbindung",
    short: "Funktion nahe der blauen Linie / Point, die Seiten oder Ebenen verbindet.",
    long:
      "Hohe Verbindung (D1): Funktion im hohen Bereich nahe der blauen Linie (Point), die Seiten oder Ebenen miteinander verbinden kann. Englisch häufig High.",
    synonyms: ["High", "Point connection"],
    tags: ["D1"],
  },
  praesenz_direkt_vor_dem_tor: {
    label: "Präsenz direkt vor dem Tor",
    short: "Funktion vor dem Tor für Sichtbehinderung, Abfälschung oder Abpraller.",
    long:
      "Präsenz direkt vor dem Tor (D1): Offensive Funktion unmittelbar vor dem Tor. Englisch Net Front.",
    synonyms: ["Net Front", "Net-Front"],
    tags: ["D1"],
  },
  tiefe_option_torlinie: {
    label: "Tiefe Option an oder hinter der Torlinie",
    short: "Tiefe Verbindung für neue Passwinkel oder Richtungswechsel.",
    long:
      "Tiefe Option an oder hinter der Torlinie (D1): Offensive Funktion nahe oder hinter der Torlinie. Englisch häufig Goal Line oder Below Net.",
    synonyms: ["Goal Line", "Below Net"],
    tags: ["D1"],
  },
  puckferne_option: {
    label: "Puckferne Option",
    short: "Spielbare Option auf der dem Puck gegenüberliegenden Seite.",
    long:
      "Puckferne Option (D1): Spielbare Option auf der dem Puck gegenüberliegenden Seite. Englisch Weak Side — nicht „schwach“ als Qualitätsurteil.",
    synonyms: ["Weak Side", "Weak-Side Threat"],
    tags: ["D1"],
  },
  passlinie_unterzahlstruktur: {
    label: "Passlinie durch die Unterzahlstruktur",
    short: "Passverbindung durch oder zwischen den Ebenen der Unterzahl.",
    long:
      "Passlinie durch die Unterzahlstruktur (D1): Passverbindung durch oder zwischen den Ebenen der Unterzahl. Englisch häufig Seam.",
    synonyms: ["Seam", "Seam pass"],
    tags: ["D1"],
  },
  direktabschluss_nach_pass: {
    label: "Direktabschluss nach Pass",
    short: "Abschluss unmittelbar nach einem Zuspiel.",
    long:
      "Direktabschluss nach Pass (D1): Abschluss unmittelbar nach einem Zuspiel, ohne vorherige längere Puckkontrolle. Englisch häufig One-Timer.",
    synonyms: ["One-Timer", "One timer"],
    tags: ["D1"],
  },
  direkter_zug_zum_tor: {
    label: "Direkter Zug zum Tor",
    short: "Puckführer bewegt sich unmittelbar Richtung Tor.",
    long:
      "Direkter Zug zum Tor (D1): Der Puckführer bewegt sich aus einem Seiten- oder Point-Bereich unmittelbar Richtung Tor. Englisch häufig Downhill Drive.",
    synonyms: ["Downhill Drive", "Drive"],
    tags: ["D1"],
  },
  angriffssignal: {
    label: "Angriffssignal",
    short: "Sichtbare Veränderung unmittelbar vor einer offensiven Aktion.",
    long:
      "Angriffssignal (D1): Eine unmittelbar vor einer offensiven Aktion sichtbare Veränderung, z. B. freie Passlinie oder Schussbahn. Englisch Trigger. Beweist keine innere Wahrnehmung oder taktische Vorgabe.",
    synonyms: ["Trigger", "Attack trigger"],
    tags: ["D1"],
  },
  unterzahlstruktur: {
    label: "Unterzahlstruktur",
    short: "Räumliche Anordnung der vier Unterzahlspieler.",
    long:
      "Unterzahlstruktur (D1): Räumliche Anordnung und Verbindung der vier Unterzahlspieler. Setzt keine bestimmte Formation wie eine Box voraus.",
    synonyms: ["PK structure", "Box (nur Synonym, nicht vorausgesetzt)"],
    tags: ["D1"],
  },
  unmittelbare_folge: {
    label: "Unmittelbare Folge",
    short: "Direkt nach einer Aktion sichtbares Ereignis — ohne Qualitätsnote.",
    long:
      "Unmittelbare Folge (D1): Das direkt nach einer Aktion sichtbare Ereignis. Es ist keine Bewertung der vorherigen Entscheidung.",
    synonyms: ["Immediate outcome"],
    tags: ["D1"],
  },
  powerplay_beobachtung: {
    label: "Powerplay-Beobachtung",
    short: "Vorsichtige Zusammenfassung sichtbarer Powerplay-Prinzipien.",
    long:
      "Powerplay-Beobachtung (D1): Vorsichtige Zusammenfassung wiederkehrender sichtbarer Powerplay-Prinzipien des ausgewählten Abschnitts. Keine dauerhafte Team-, System- oder Setup-Identität.",
    synonyms: ["Heutige Powerplay-Beobachtung"],
    tags: ["D1"],
  },
  unterzahlspiel: {
    label: "Unterzahlspiel",
    short: "Spielsituation mit weniger Feldspielern nach einer Strafe.",
    long:
      "Unterzahlspiel: Spielsituation, in der eine Mannschaft aufgrund einer Strafe mit weniger Feldspielern spielt. Englisch Penalty Killing, häufig PK.",
    synonyms: ["Penalty Killing", "PK", "Unterzahl"],
    tags: ["D2"],
  },
  raumprioritaet: {
    label: "Raumpriorität",
    short: "In einer Szene sichtbar am stärksten geschützter Raum.",
    long:
      "Raumpriorität (D2): Der in einer beobachteten Szene sichtbar am stärksten geschützte Raum. Beweist keine feste taktische Vorgabe und keine bewusste Freigabe.",
    synonyms: ["Geschützter Raum", "Priority space"],
    tags: ["D2"],
  },
  unterzahlorganisation: {
    label: "Unterzahlorganisation",
    short: "Anordnung, Abstände und Beziehungen der Unterzahlspieler.",
    long:
      "Unterzahlorganisation (D2): Räumliche Anordnung, Abstände und Beziehungen der Unterzahlspieler. Setzt keinen bestimmten Systemnamen voraus.",
    synonyms: ["PK structure", "räumliche Grundordnung"],
    tags: ["D2"],
  },
  hohe_ebene: {
    label: "Hohe Ebene",
    short: "Unterzahlspieler oder Positionen weiter vom eigenen Tor.",
    long:
      "Hohe Ebene (D2): Unterzahlspieler oder Positionen weiter vom eigenen Tor entfernt.",
    synonyms: ["High layer", "High"],
    tags: ["D2"],
  },
  tiefe_ebene: {
    label: "Tiefe Ebene",
    short: "Unterzahlspieler oder Positionen näher an Torlinie und Tor.",
    long:
      "Tiefe Ebene (D2): Unterzahlspieler oder Positionen näher an Torlinie und eigenem Tor.",
    synonyms: ["Low layer", "Low"],
    tags: ["D2"],
  },
  puckseite: {
    label: "Puckseite",
    short: "Seite der Eisfläche, auf der sich der Puck befindet.",
    long:
      "Puckseite (D2): Seite der Eisfläche, auf der sich der Puck befindet.",
    synonyms: ["Strong side", "Puck side"],
    tags: ["D2"],
  },
  zugriffssignal: {
    label: "Zugriffssignal",
    short: "Sichtbare Veränderung unmittelbar vor aktivem Zugriff.",
    long:
      "Zugriffssignal (D2): Unmittelbar vor einem aktiven Zugriff sichtbare Veränderung, z. B. unsichere Puckkontrolle oder langsamer Pass. Englisch Trigger. Keine sichere Aussage über innere Wahrnehmung oder taktische Vorgabe.",
    synonyms: ["Trigger", "Pressure trigger"],
    tags: ["D2"],
  },
  schlaegerdruck: {
    label: "Schlägerdruck",
    short: "Schlägerposition oder -bewegung zur Begrenzung von Pass-/Schusslinie.",
    long:
      "Schlägerdruck (D2): Aktive Schlägerposition oder Schlägerbewegung zur Begrenzung einer Pass- oder Schusslinie. Englisch stick pressure.",
    synonyms: ["Stick pressure", "Stick check"],
    tags: ["D2"],
  },
  befreiung: {
    label: "Befreiung",
    short: "Puck aus eigener Zone oder Gefahrenlage herausspielen.",
    long:
      "Befreiung (D2/D3): Der Puck wird aus der eigenen Zone oder unmittelbaren Gefahrenlage herausgespielt. Englisch häufig clear. In D2_D4 als Sequenzende; Detailanalyse → D3.",
    synonyms: ["Clear", "Clearing"],
    tags: ["D2", "D3"],
  },
  kontrollierte_befreiung: {
    label: "Kontrollierte Befreiung",
    short: "Puck aus der Zone mit erkennbarer Kontrolle der nächsten Aktion.",
    long:
      "Kontrollierte Befreiung (D2): Die Unterzahl bringt den Puck aus der eigenen Zone und behält dabei erkennbar Kontrolle über Richtung oder nächste Aktion.",
    synonyms: ["Controlled clear"],
    tags: ["D2"],
  },
  befreiung_unter_druck: {
    label: "Befreiung unter starkem Druck",
    short: "Puck unter Druck entfernt, ohne Kontrolle der nächsten Aktion.",
    long:
      "Befreiung unter starkem Druck (D2): Der Puck wird unter unmittelbarem Druck aus der Gefahrenzone oder eigenen Zone gespielt, ohne dass die nächste Aktion kontrolliert werden kann.",
    synonyms: ["Risky clear", "Pressure clear"],
    tags: ["D2"],
  },
  zweiter_puck: {
    label: "Zweiter Puck",
    short: "Nach Block, Abpraller oder Kampf erneut frei spielbarer Puck.",
    long:
      "Zweiter Puck (D2): Der nach Block, Torhüterabwehr, Abpraller oder Puckkampf erneut frei spielbare Puck.",
    synonyms: ["Second puck", "Rebound puck"],
    tags: ["D2"],
  },
  unterzahlbeobachtung: {
    label: "Unterzahlbeobachtung",
    short: "Vorsichtige Zusammenfassung sichtbarer Unterzahlprinzipien.",
    long:
      "Unterzahlbeobachtung (D2): Vorsichtige Zusammenfassung wiederkehrender sichtbarer Unterzahlprinzipien des ausgewählten Abschnitts. Keine dauerhafte Team-, Formations- oder Systemidentität.",
    synonyms: ["Heutige Unterzahlbeobachtung"],
    tags: ["D2"],
  },
  zoneneintritt: {
    label: "Zoneneintritt",
    short: "Überqueren der offensiven blauen Linie mit Puck oder spielbarer Verbindung.",
    long:
      "Zoneneintritt (D3): Überqueren der offensiven blauen Linie mit Puck oder unmittelbar spielbarer Puckverbindung. Englisch zone entry beziehungsweise entry.",
    synonyms: ["Entry", "Zone entry", "Zone Entry"],
    tags: ["D3"],
  },
  zonenaustritt: {
    label: "Zonenaustritt",
    short: "Verlassen der eigenen Zone mit Puck oder kontrollierbarer Anschlussaktion.",
    long:
      "Zonenaustritt (D3): Verlassen der eigenen Zone mit Puck oder einer kontrollierbaren Anschlussaktion. Englisch zone exit beziehungsweise exit.",
    synonyms: ["Exit", "Zone exit", "Zone Exit"],
    tags: ["D3"],
  },
  abstand_zur_blauen_linie: {
    label: "Abstand zur blauen Linie",
    short: "Räumlicher Abstand der Verteidigung zur blauen Linie bzw. zum Puckführer.",
    long:
      "Abstand zur blauen Linie (D3): Räumlicher Abstand der Verteidigung zum Puckführer beziehungsweise zur blauen Linie. Englisch häufig gap. Keine Qualitätsnote.",
    synonyms: ["Gap", "Defensive Gap"],
    tags: ["D3"],
  },
  puck_gezielt_hinter_verteidigung: {
    label: "Puck gezielt hinter die Verteidigung legen",
    short: "Dosierter tiefer Puck in den Raum hinter den Verteidigern.",
    long:
      "Puck gezielt hinter die Verteidigung legen (D3): Kurzer oder dosierter tiefer Puck in den Raum hinter den Verteidigern, der von einem Mitspieler erreichbar bleiben soll. Englisch häufig chip.",
    synonyms: ["Chip", "Chip behind defense"],
    tags: ["D3"],
  },
  vorbereitete_puckjagd: {
    label: "Vorbereitete Puckjagd",
    short: "Mitspieler schon vor/beim tiefen Spiel in Position für unmittelbaren Druck.",
    long:
      "Vorbereitete Puckjagd (D3): Mitspieler befinden sich bereits vor oder beim tiefen Spiel in Position, um den Puck oder dessen ersten Empfänger unmittelbar unter Druck zu setzen. Spätere vollständige Forecheck-Sequenz ≠ D3_D2.",
    synonyms: ["Dump and chase", "Forecheck support"],
    tags: ["D3"],
  },
  unterstuetzung_zoneneintritt: {
    label: "Unterstützung",
    short: "Positionierung oder Bewegung, die eine zusätzliche Option erzeugt.",
    long:
      "Unterstützung (D3): Sichtbare Positionierung oder Bewegung eines Mitspielers, durch die eine zusätzliche Pass-, Lauf- oder Rückspieloption entsteht. Englisch support.",
    synonyms: ["Support", "Entry support"],
    tags: ["D3"],
  },
  nachrueckender_spieler: {
    label: "Nachrückender Spieler",
    short: "Spieler, der zeitlich versetzt als zusätzliche Angriffswelle folgt.",
    long:
      "Nachrückender Spieler (D3): Spieler, der zeitlich versetzt als zusätzliche Angriffswelle folgt. Englisch trailer.",
    synonyms: ["Trailer"],
    tags: ["D3"],
  },
  kontrollierter_zonenaustritt: {
    label: "Kontrollierter Zonenaustritt",
    short: "Eigene Zone verlassen mit erkennbarer kontrollierter Anschlussaktion.",
    long:
      "Kontrollierter Zonenaustritt (D3): Die Mannschaft verlässt die eigene Zone und behält eine erkennbare kontrollierte Anschlussaktion.",
    synonyms: ["Controlled exit", "Controlled Exit"],
    tags: ["D3"],
  },
  icing: {
    label: "Icing",
    short: "Regelwidriger tiefer Puck über die gegnerische Torlinie.",
    long:
      "Icing (D3): Regelwidriger tiefer Puck über die gegnerische Torlinie gemäß den jeweils gültigen Spielregeln. In RinQ ist Icing eine beobachtbare Folge und keine automatische Qualitätsnote.",
    synonyms: ["Icing play"],
    tags: ["D3"],
  },
  beobachtung_blaue_linien: {
    label: "Beobachtung an den blauen Linien",
    short: "Vorsichtige Zusammenfassung sichtbarer Lösungen an den blauen Linien.",
    long:
      "Beobachtung an den blauen Linien (D3): Vorsichtige Zusammenfassung wiederkehrender sichtbarer Lösungen des ausgewählten Abschnitts. Keine dauerhafte Team- oder Systemidentität.",
    synonyms: ["Heutige Beobachtung an den blauen Linien"],
    tags: ["D3"],
  },
  neuaufbau: {
    label: "Neuaufbau",
    short: "Vorwärtsversuch bewusst zurücknehmen, um neu zu ordnen.",
    long:
      "Neuaufbau (A2): Der unmittelbare Vorwärtsversuch wird bewusst zurückgenommen, damit das Team unter Kontrolle neue Struktur und Optionen herstellt. Englische Nähe: Reset. Regroup ist eine konkrete Form des Neuaufbaus (besonders NZ) — nicht jeder Neuaufbau ist Regroup. Nicht jeder Rückpass ist Neuaufbau.",
    synonyms: ["Reset", "Regroup"],
    tags: ["A2"],
  },
  umschalten: {
    label: "Umschalten",
    short: "Wechsel zwischen offensiven und defensiven Aufgaben.",
    long:
      "Umschalten: Wechsel zwischen offensiven und defensiven Aufgaben, häufig ausgelöst durch Puckgewinn oder Puckverlust. Englisches Synonym: Transition. Nicht jede Strukturveränderung kommt vom Besitzwechsel; ein Besitzwechsel bedeutet nicht automatisch gutes oder schlechtes Umschalten.",
    synonyms: ["Transition", "Umschaltmoment", "Transitionsmoment"],
    tags: ["A3"],
  },
  umschaltmoment: {
    label: "Umschaltmoment",
    short: "Moment, in dem sich die Spielsituation neu ausrichtet.",
    long:
      "Umschaltmoment: Der beobachtbare Moment, in dem sich die Spielsituation verändert und Spieler ihre Aufgaben und Bewegungsrichtungen neu ausrichten. Ein Wechsel des Puckbesitzes ist häufig ein zentraler Auslöser — aber nicht jede Strukturveränderung entsteht dadurch.",
    synonyms: ["Transitionsmoment"],
    tags: ["A3"],
  },
  regroup: {
    label: "Regroup",
    short: "Spezifische Form des Neuaufbaus, oft in der Neutral Zone.",
    long:
      "Regroup heißt: Attack abbrechen oder kontrollieren, Puck sichern und neu sortieren (oft D-to-D / zurück in die Neutral Zone), um einen besseren Entry/Breakout zu starten. In RinQ A2 ist Regroup eine konkrete Form von Neuaufbau — nicht synonym mit jedem Neuaufbau.",
    synonyms: ["Neuaufbau (NZ)", "Reset (NZ)"],
    tags: ["A2", "Transition"],
  },
  beobachtungstendenz: {
    label: "Beobachtungstendenz",
    short: "Vorsichtige Zusammenfassung der ausgewählten Szenen — keine Team-Identität.",
    long:
      "Eine Beobachtungstendenz fasst zusammen, was in den aktuell ausgewählten Szenen wiederholt sichtbar war. Sie beschreibt keine dauerhafte Eigenschaft, Qualität oder Identität eines Teams und keine Coach-Philosophie.",
    synonyms: ["Tendenz", "Stichproben-Tendenz"],
    tags: ["B3", "C1"],
  },
  geschuetzter_raum: {
    label: "Geschützter Raum",
    short: "Bereich, den die Defensive in der Szene erkennbar kontrolliert.",
    long:
      "Geschützter Raum (C1): Ein Bereich, den die Defensive durch Positionierung, Abstand, Körper- oder Stockposition erkennbar kontrolliert. Kann sich mit Raum mit hoher Torgefahr überlagern.",
    tags: ["C1"],
  },
  raum_hohe_torgefahr: {
    label: "Raum mit hoher Torgefahr",
    short: "Bereich mit erhöhter unmittelbarer Gefahr für das verteidigte Tor.",
    long:
      "Raum mit hoher Torgefahr (C1): Aus diesem Bereich kann Abschluss, Pass oder Anschlussaktion erhöhte unmittelbare Gefahr für das verteidigte Tor erzeugen. Früher: „Gefährlicher Raum“.",
    synonyms: ["Gefährlicher Raum"],
    tags: ["C1"],
  },
  weniger_priorisierter_raum: {
    label: "Weniger priorisierter Raum",
    short: "In der Szene weniger stark geschützt — keine Absicht behaupten.",
    long:
      "Weniger priorisierter Raum (C1): In der beobachteten Szene weniger stark geschützt. Behauptet keine feste taktische Absicht oder bewusste Freigabe. Früher: „Bewusst zugelassener Raum“.",
    synonyms: ["Bewusst zugelassener Raum"],
    tags: ["C1"],
  },
  abstaende: {
    label: "Abstände",
    short: "Räumliche Distanzen zwischen Defensivspielern oder Ebenen.",
    long:
      "Abstände (C1_D2): Enge, mittlere oder große Abstände beschreiben nur die sichtbare Distanz — keine Qualitätsnote.",
    tags: ["C1"],
  },
  staffelung: {
    label: "Staffelung",
    short: "Versetzte Anordnung über unterschiedliche Tiefen.",
    long:
      "Staffelung: räumlich versetzte Anordnung mehrerer Spieler, durch die unterschiedliche Räume oder Tiefen gleichzeitig erreichbar bleiben.",
    tags: ["C1", "C2"],
  },
  ausloeser: {
    label: "Auslöser",
    short: "Sichtbare Veränderung vor dem aktiven Zugriff.",
    long:
      "Auslöser (C1_D3): Eine unmittelbar vorausgehende sichtbare Veränderung, nach der ein aktiver Zugriff beginnt. Englisch: Trigger. Beweist keine innere Wahrnehmung oder taktische Vorgabe.",
    synonyms: ["Trigger"],
    tags: ["C1"],
  },
  verantwortlichkeitswechsel: {
    label: "Verantwortlichkeitswechsel",
    short: "Sichtbare Veränderung der Raum- oder Gegnerkontrolle.",
    long:
      "Verantwortlichkeitswechsel (C1_D4): Sichtbare Veränderung, welcher Spieler einen Raum, Passweg oder Gegenspieler kontrolliert.",
    tags: ["C1"],
  },
  verbundenheit_struktur: {
    label: "Verbundenheit der Struktur",
    short: "Abstände erlauben weiterhin gegenseitige Unterstützung.",
    long:
      "Verbundenheit der Struktur: Die Defensivspieler halten Abstände und räumliche Beziehungen, durch die gegenseitige Unterstützung weiterhin möglich bleibt.",
    tags: ["C1"],
  },
  stabilitaetsbeobachtung: {
    label: "Stabilitätsbeobachtung",
    short: "Vorsichtige Zusammenfassung mehrerer Szenen — keine Identität.",
    long:
      "Heutige Stabilitätsbeobachtung (C1_D5): Vorsichtige Zusammenfassung mehrerer beobachteter Szenen. Keine dauerhafte Qualität, Team-Identität oder feste Systemzuordnung. Früher: Defensivprofil.",
    synonyms: ["Defensivprofil", "Heutige Stabilitätsbeobachtung"],
    tags: ["C1"],
  },
  stichprobe: {
    label: "Stichprobe",
    short: "Die in dieser Session beobachteten Szenen oder Sequenzen.",
    long:
      "Die Stichprobe sind die ausgewählten Beobachtungen, auf die sich eine Tendenz-Einschätzung bezieht — nicht das ganze Spiel und nicht die Saison.",
    tags: ["B3"],
  },
  aktiver_druck: {
    label: "Aktiver Druck",
    short: "Sichtbarer defensiver Zugriff, der Zeit/Raum/Optionen einschränkt.",
    long:
      "Aktiver defensiver Zugriff: Ein Spieler versucht sichtbar, Zeit, Raum oder Handlungsoptionen des Puckführers einzuschränken (Distanz schließen, Lenken, Stockdruck, körperlicher Zugriff). Bloße Nähe oder Mitlaufen zählt nicht automatisch. In B3_D5 schätzt du nur die Häufigkeit in der Stichprobe.",
    synonyms: ["Früher aktiver Druck", "erster Zugriff"],
    tags: ["B3"],
  },
  lenken_nach_aussen: {
    label: "Lenken nach außen",
    short: "Gegner wird sichtbar aus dem Zentrum bzw. nach außen geführt.",
    long:
      "Lenken nach außen beschreibt sichtbare Winkel, Positionen oder Staffelung, die den Angriff aus dem zentralen Gefahrraum herausführen.",
    synonyms: ["nach außen lenken", "outside guiding"],
    tags: ["B3"],
  },
  zentrum_schuetzen: {
    label: "Zentrum schützen",
    short: "Zentraler Gefahrraum / Slot bleibt schwerer bespielbar.",
    long:
      "Zentrum schützen heißt: Der zentrale gefährliche Raum bleibt durch Positionierung oder Staffelung schwerer bespielbar. In B1 meint Absichern etwas anderes (sichere Verbindung hinter eigener Aktion).",
    synonyms: ["Slot schützen", "center protection"],
    tags: ["B3"],
  },
  unterstuetzung_erster_zugriff: {
    label: "Unterstützung des ersten Zugriffs",
    short: "Weitere defensive Aufgabe nach dem ersten Druck.",
    long:
      "Nach dem ersten Zugriff folgt eine weitere defensive Aufgabe: zweiter Impuls, Absicherung, Staffelung oder Anschlussverhalten. In B3_D5 bewertest du die Häufigkeit in der Stichprobe.",
    tags: ["B3"],
  },
  defensive_struktur: {
    label: "Defensive Struktur",
    short: "Lesbare Ordnung der Defensive über eine Sequenz.",
    long:
      "Defensive Struktur über die Sequenz: Bleibt die Ordnung nach dem ersten Zugriff lesbar oder wird sie erkennbar angepasst — ohne sofortigen Strukturverlust? Kein Systemname (Track C).",
    synonyms: ["Sequenzstruktur"],
    tags: ["B3"],
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
  backchecking: {
    label: "Backchecking",
    short: "Rückwärtsarbeit nach Puckverlust mit dem Ziel, die Optionen des Gegners zu reduzieren.",
    long:
      "Backchecking beschreibt die Rückwärtsarbeit nach einem Puckverlust. Ein Spieler verfolgt den gegnerischen Angriff von hinten und versucht, Einfluss auf die Situation zu nehmen.\n\nZiel ist nicht nur, zurückzulaufen, sondern:\n• Raum zu reduzieren\n• Passwege zu schließen\n• den Gegner nach außen zu lenken\n• defensive Unterstützung zu ermöglichen\n\nWichtig: Backchecking wird nicht nach Einsatz oder Geschwindigkeit bewertet, sondern danach, ob sich die Optionen des Gegners verändern.",
    synonyms: ["Backchecker", "Backchecking-Aktion", "Rückwärtsarbeit"],
    tags: ["A3", "Transition", "Defensive"],
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
    short: "Sichtbare Begrenzung der möglichen Angriffsrichtung.",
    long:
      "Lenkung (C2): Eine sichtbare Veränderung oder Begrenzung der möglichen Angriffsrichtung. Sie wird über Laufwinkel, geschlossene Wege, Staffelung und die anschließende Route beobachtet — ohne sichere Absicht oder Kausalität zu behaupten. Englisch: steering.",
    synonyms: ["Gegnerlenkung", "Steering", "Deflection"],
    tags: ["Defensive", "Taktik", "C2"],
  },

  strukturgefuehl: {
    label: "Strukturgefühl",
    short: "Subjektiver Gesamteindruck der teaminternen Ordnung.",
    long:
      "Es geht nicht um einzelne Aktionen, sondern um Abstände, Verbindungen und Wiedererkennbarkeit von Rollen über mehrere Sequenzen hinweg.\n\n• geordnet = klare Abstände, stabile Dreiecke, Spieler sind anspielbar\n• mixed = phasenweise Struktur, Ordnung bricht situativ\n• chaotisch = Abstände reißen, Mitte fehlt, keine klaren Optionen",
    synonyms: ["Teamstruktur", "Ordnungsgefühl"],
    tags: ["Taktik", "Wahrnehmung"],
  },

  read: {
    label: "Read",
    short: "Erkennen und Interpretieren einer Spielsituation, um die nächste Aufgabe abzuleiten.",
    long:
      "Ein Read beantwortet nicht die Frage „Was passiert gerade?\", sondern: „Was wird wahrscheinlich als Nächstes passieren – und welche Aufgabe ergibt sich daraus?\"\n\nEin Read ist kein Wissen, sondern eine Einschätzung unter Zeitdruck. Gute Reads entstehen aus Timing, Druckgefühl und dem Lesen von Bewegungsmustern.\n\nBeispiel: Der Center schaut mehrfach über die Schulter und bewegt sich in freien Raum. Möglicher Read: Der Center sucht eine Anspielstation oder bereitet einen Angriff vor.\n\nCenter-Reads werden nach der dominanten Aufgabe unterschieden:\n• Absichern – Verteidigung und Gefahr reduzieren priorisiert\n• Verbinden – Spielunterstützung und Anschlussoptionen priorisiert\n• Angreifen – Angriffsdruck und Offensive priorisiert",
    synonyms: ["Reads", "lesen", "Spielsituation lesen", "Read-Qualität"],
    tags: ["Taktik", "Wahrnehmung", "A1"],
  },

  zusaetzlicher_feldspieler: {
    label: "Zusätzlicher Feldspieler",
    short: "Feldspieler anstelle des Torhüters; eigenes Tor unbesetzt.",
    long:
      "Zusätzlicher Feldspieler (D4 Sidequest): Ein Feldspieler, der anstelle des Torhüters eingesetzt wird. Dadurch kann eine Mannschaft mit einem zusätzlichen Angreifer spielen; das eigene Tor bleibt unbesetzt. Englisch Extra Attacker / Goalie Pulled. Nicht mit Straf-Überzahl gleichsetzen.",
    synonyms: ["Extra Attacker", "Goalie Pulled", "Extra-Angreifer"],
    tags: ["D4"],
  },
  leeres_tor: {
    label: "Leeres Tor",
    short: "Torhüter hat das Eis verlassen; Tor nicht besetzt.",
    long:
      "Leeres Tor (D4): Situation, in der der Torhüter das Eis verlassen hat und das eigene Tor nicht durch einen Torhüter besetzt ist. Englisch Empty Net. Ergebnis ist keine automatische Qualitätsnote.",
    synonyms: ["Empty Net", "Empty-net"],
    tags: ["D4"],
  },
  sechs_gegen_fuenf: {
    label: "6-gegen-5",
    short: "Sechs Feldspieler gegen fünf, typisch nach Torhüterwechsel.",
    long:
      "6-gegen-5 (D4): Numerische Spielsituation mit sechs Feldspielern gegen fünf Feldspieler, typischerweise nach einem Torhüterwechsel zugunsten eines zusätzlichen Feldspielers. Nicht mit regulärem Überzahlspiel nach Strafe und nicht mit 5-gegen-3 gleichsetzen.",
    synonyms: ["6v5", "6-on-5"],
    tags: ["D4"],
  },
  numerische_sondersituation: {
    label: "Numerische Sondersituation",
    short: "Optionale Sidequest für seltene Zahlenverhältnisse.",
    long:
      "Numerische Sondersituation (D4): Optionale, ereignisabhängige Erfassung seltener Zahlenverhältnisse. Legacy-Modul D4 ist deprecated. Beobachtungsraster Struktur / Aktionsvorbereitung / Absicherung ist ein RinQ-Modell — kein DEB-/IIHF-Standard. Teamruhe entfernt.",
    synonyms: ["Numerical Situation", "Sidequest Numerical"],
    tags: ["D4"],
  },

  tendenz: {
    label: "Tendenz",
    short: "Vorläufige Beschreibung wiederkehrenden sichtbaren Verhaltens.",
    long:
      "Eine vorläufige Beschreibung wiederkehrenden sichtbaren Verhaltens in mehreren vergleichbaren Situationen. Eine Tendenz ist keine gesicherte Ursache und keine dauerhafte Eigenschaft eines Teams (E1).",
    synonyms: ["Tendency"],
    tags: ["E1"],
  },
  vergleichsmerkmale: {
    label: "Vergleichsmerkmale",
    short: "Sichtbare Merkmale zum Vergleich mehrerer Situationen.",
    long:
      "Sichtbare Eigenschaften, anhand derer Situationen miteinander verglichen werden, zum Beispiel Zone, Auslöser, Positionierung, Reaktion und Ablauf. Englisches Synonym: Pattern Fingerprint — nur Synonym, nicht UI-Hauptbegriff.",
    synonyms: ["Pattern Fingerprint", "Mustermerkmale"],
    tags: ["E1"],
  },
  gegenfall: {
    label: "Gegenfall",
    short: "Ähnliche Ausgangslage ohne erwartetes Verhalten.",
    long:
      "Eine ausreichend ähnliche Ausgangslage, in der das erwartete Verhalten nicht oder anders auftritt. Kann eine Tendenz einschränken oder schärfen, widerlegt sie aber nicht automatisch.",
    synonyms: ["Counter case", "Counterexample"],
    tags: ["E1"],
  },
  stabile_merkmale: {
    label: "Stabile Merkmale",
    short: "Bisher wiederholt ähnlich sichtbare Merkmale.",
    long:
      "Merkmale, die in den bisher verglichenen Situationen wiederholt ähnlich sichtbar waren. Bei wenigen Beobachtungen vorläufig und nicht als unveränderlich bewiesen.",
    synonyms: ["Bisher stabil beobachtet"],
    tags: ["E1"],
  },
  variable_merkmale: {
    label: "Variable Merkmale",
    short: "Merkmale, die zwischen vergleichbaren Situationen wechseln können.",
    long:
      "Merkmale, die zwischen vergleichbaren Situationen wechseln können, ohne dass das beobachtete Grundverhalten zwingend ein anderes sein muss.",
    synonyms: ["Variabel"],
    tags: ["E1"],
  },
  funktionaler_kern: {
    label: "Funktionaler Kern",
    short: "RinQ-Arbeitsbegriff für bisher wiederkehrende Kernmerkmale.",
    long:
      "RinQ-Arbeitsbegriff für wenige sichtbare Merkmale, die in den bisher verglichenen Situationen trotz unterschiedlicher Ausführung ähnlich bleiben. Vorläufige Arbeitsbeschreibung, keine bewiesene Invariante — kein DEB-/IIHF-Raster.",
    synonyms: ["Functional core"],
    tags: ["E1"],
  },
  kontext: {
    label: "Kontext",
    short: "Sichtbare Rahmenbedingungen einer Beobachtung.",
    long:
      "Sichtbare Rahmenbedingungen einer Beobachtung, beispielsweise Zone, Gegnerdruck, Personal, Spielstand, Puckkontrolle oder numerische Spielsituation.",
    synonyms: ["Context"],
    tags: ["E1"],
  },
  hypothese: {
    label: "Hypothese",
    short: "Vorläufige, noch zu prüfende Erklärung.",
    long:
      "Eine vorläufige, noch zu prüfende Erklärung. Sie darf nicht mit einer aus Beobachtungen bestätigten Ursache gleichgesetzt werden.",
    synonyms: ["Hypothesis"],
    tags: ["E1"],
  },
  beobachtetes_segment: {
    label: "Beobachtetes Segment",
    short: "Konkret betrachteter Spielausschnitt.",
    long:
      "Der konkret betrachtete Spielausschnitt, zum Beispiel ein Drittel, mehrere Wechsel oder eine festgelegte Folge von Situationen. Aussagen aus diesem Ausschnitt gelten nicht automatisch für andere Spiele oder Zeiträume.",
    synonyms: ["Observed segment"],
    tags: ["E1"],
  },
  beobachtungsgrundlage: {
    label: "Beobachtungsgrundlage",
    short: "Dokumentierte Menge und Vergleichbarkeit der Beobachtungen.",
    long:
      "Die dokumentierte Menge und Vergleichbarkeit der herangezogenen Beobachtungen einschließlich Gegenfällen, Kontextunterschieden und nicht beurteilbaren Situationen.",
    synonyms: ["Observation basis"],
    tags: ["E1"],
  },

  spielanpassung: {
    label: "Spielanpassung",
    short: "Sichtbare Verhaltensveränderung — Coachingabsicht oft unbekannt.",
    long:
      "Eine Veränderung im Spielverhalten, die als Reaktion auf eine Spielsituation oder wiederkehrende Interaktion gedacht sein kann. Aus der Beobachtung allein ist häufig nicht sicher erkennbar, ob sie vom Coach angeordnet, von Spielern selbst vorgenommen oder durch andere Kontextfaktoren ausgelöst wurde (E2).",
    synonyms: ["Adjustment", "Anpassung"],
    tags: ["E2"],
  },
  anpassungshypothese: {
    label: "Anpassungshypothese",
    short: "Vorläufige, prüfbare Verbindung Veränderung ↔ vorherige Interaktion.",
    long:
      "Eine vorläufige Annahme, dass eine sichtbare Veränderung mit einer zuvor beobachteten Interaktion zusammenhängen könnte. Sie enthält mindestens eine alternative Erklärung und bleibt überprüfbar.",
    synonyms: ["Adjustment hypothesis"],
    tags: ["E2"],
  },
  vergleichbare_situation: {
    label: "Vergleichbare Situation",
    short: "Situationen mit ausreichend ähnlichen Ausgangsbedingungen.",
    long:
      "Eine Situation, deren für die Analyse wesentliche Ausgangsbedingungen ausreichend ähnlich sind. Dazu können Spielphase, Zone, numerische Situation, Puckbesitz, Gegnerdruck, Rollen und Spielkontext gehören.",
    synonyms: ["Comparable situation"],
    tags: ["E2"],
  },
  ausgangsbeobachtungen: {
    label: "Ausgangsbeobachtungen",
    short: "Vergleichsbasis vor einer möglichen Veränderung.",
    long:
      "Mehrere vergleichbare Beobachtungen vor einer möglichen Veränderung. Sie dienen als vorläufige Vergleichsbasis und sind keine unveränderliche Norm.",
    synonyms: ["Baseline"],
    tags: ["E2"],
  },
  moeglicher_veraenderungszeitpunkt: {
    label: "Möglicher Veränderungszeitpunkt",
    short: "Manuelle Beobachtungshilfe — kein statistischer Change Point.",
    long:
      "Der früheste beobachtete Zeitpunkt, ab dem ein verändertes Verhalten in weiteren vergleichbaren Situationen erneut sichtbar wird. In RinQ ist dies eine manuelle Beobachtungshilfe und kein statistisch berechneter Change Point.",
    synonyms: ["Change Point"],
    tags: ["E2"],
  },
  funktionale_passung: {
    label: "Funktionale Passung",
    short: "Hinweis auf inhaltlichen Zusammenhang — kein Ursachennachweis.",
    long:
      "Ein Hinweis darauf, dass die sichtbare Veränderung einen Raum, Weg, eine Rolle oder Anschlussoption betrifft, die mit der zuvor beobachteten Interaktion zusammenhängt. Funktionale Passung beweist keine Ursache.",
    synonyms: ["Functional fit"],
    tags: ["E2"],
  },
  ergebnisverzerrung: {
    label: "Ergebnisverzerrung",
    short: "Bewertung über das spätere Ergebnis statt über den Prozess.",
    long:
      "Die Tendenz, eine Entscheidung oder Handlung aufgrund ihres späteren Ergebnisses zu beurteilen. Ein gutes Ergebnis beweist keine gute Entscheidung; ein schlechtes Ergebnis beweist keine schlechte Entscheidung.",
    synonyms: ["Outcome Bias"],
    tags: ["E2"],
  },
  problemverlagerung: {
    label: "Problemverlagerung",
    short: "Herausforderung verschiebt sich an eine andere Stelle.",
    long:
      "Eine Veränderung, bei der eine bisherige Herausforderung weniger sichtbar wird, gleichzeitig aber an anderer Stelle eine neue offene Option oder ein neuer Nachteil entstehen kann.",
    synonyms: ["Trade-off"],
    tags: ["E2"],
  },
  beobachtungssignal: {
    label: "Beobachtungssignal",
    short: "Wiederholung und Vergleichbarkeit der sichtbaren Veränderung.",
    long:
      "Die Stärke der dokumentierten sichtbaren Veränderung, bestimmt durch Wiederholung und Vergleichbarkeit. Es ist nicht dasselbe wie die Sicherheit einer Interpretation oder eine statistische Wahrscheinlichkeit.",
    synonyms: ["Observation signal"],
    tags: ["E2"],
  },
  gueltige_ausgangssituation: {
    label: "Gültige Ausgangssituation",
    short: "Erfüllt die vorab festgelegten Einschlusskriterien — unabhängig vom Ergebnis.",
    long:
      "Eine Situation, die die vor der Erfassung festgelegten Einschlusskriterien erfüllt. Jede gültige Ausgangssituation wird unabhängig vom späteren Ergebnis dokumentiert.",
    synonyms: ["Opportunity"],
    tags: ["E3"],
  },
  zielereignis: {
    label: "Zielereignis",
    short: "Das vorab definierte Ereignis, das innerhalb gültiger Ausgangssituationen gezählt wird.",
    long:
      "Das vor der Erfassung definierte Ereignis, dessen Auftreten innerhalb einer gültigen Ausgangssituation gezählt wird.",
    synonyms: ["Target Event"],
    tags: ["E3"],
  },
  auswertbares_ergebnis: {
    label: "Auswertbares Ergebnis",
    short: "Eindeutig als Zielereignis oder anderes Ergebnis klassifizierbar.",
    long:
      "Ein Ergebnis, das anhand der vorher festgelegten Kategorien eindeutig als Zielereignis oder anderes Ergebnis eingeordnet werden kann.",
    synonyms: ["Evaluable outcome"],
    tags: ["E3"],
  },
  unklares_ergebnis: {
    label: "Unklares Ergebnis",
    short: "Gültiger Fall — separat, nicht als Misserfolg.",
    long:
      "Ein gültiger Fall, dessen Ergebnis anhand des verfügbaren Materials nicht sicher klassifiziert werden kann. Er wird separat ausgewiesen und nicht automatisch wie ein nicht eingetretenes Zielereignis behandelt.",
    synonyms: ["Unclear outcome"],
    tags: ["E3"],
  },
  stichprobenrate: {
    label: "Stichprobenrate",
    short: "Zielereignisse / eindeutig auswertbare Fälle der beobachteten Stichprobe.",
    long:
      "Anteil der Zielereignisse an den eindeutig auswertbaren Fällen der konkret beobachteten Stichprobe. Sie ist keine automatische allgemeine Teamrate.",
    synonyms: ["Sample rate", "Opportunity rate"],
    tags: ["E3"],
  },
  vergleichsgruppe: {
    label: "Vergleichsgruppe",
    short: "Teilmenge derselben Messfrage anhand einer festgelegten Dimension.",
    long:
      "Eine anhand einer vorher festgelegten Dimension gebildete Teilmenge derselben Messfrage. Weitere sichtbare Kontextunterschiede werden dokumentiert.",
    synonyms: ["Cohort"],
    tags: ["E3"],
  },
  bedingter_zusammenhang: {
    label: "Bedingter Zusammenhang",
    short: "Gemeinsames Auftreten in der Stichprobe — keine Ursache.",
    long:
      "Ein gemeinsames Auftreten einer Bedingung und eines Ergebnisses innerhalb der beobachteten Stichprobe. Daraus folgt keine Ursache.",
    synonyms: ["Conditional association"],
    tags: ["E3"],
  },
  tragfaehigkeit_beobachtungsgrundlage: {
    label: "Tragfähigkeit der Beobachtungsgrundlage",
    short: "Qualitative Einordnung — kein Evidenzscore.",
    long:
      "Qualitative Einordnung von Definition, Vollständigkeit, Stichprobengröße, Vergleichbarkeit, unklaren Fällen, Gegenfällen und Stabilität. Sie ist kein statistischer Evidenzscore.",
    synonyms: ["Evidence Strength"],
    tags: ["E3"],
  },
  aussagestufe: {
    label: "Aussagestufe",
    short: "Höchstens vertretbare Formulierung zur dokumentierten Grundlage.",
    long:
      "Die stärkste Formulierung, die anhand der dokumentierten Beobachtungsgrundlage noch vertretbar erscheint. Ursache, Teamwahrheit und Zukunftswahrscheinlichkeit sind mit E3 allein nicht erreichbar.",
    synonyms: ["Claim Ladder", "Claim Ceiling", "höchstens vertretbare Aussage"],
    tags: ["E3"],
  },
  sichtbarer_hinweis: {
    label: "Sichtbarer Hinweis",
    short: "Beobachtbare Information für die Erwartung einer nächsten Aktion.",
    long:
      "Eine vor oder während der Situation beobachtbare Information, die für die Erwartung einer nächsten Aktion verwendet wird, beispielsweise Körperausrichtung, Gegnerdruck, Passweg, Abstand oder Unterstützung.",
    synonyms: ["Cue", "Hinweis"],
    tags: ["E4"],
  },
  haupthinweis: {
    label: "Haupthinweis",
    short: "Der Hinweis, den du für diese Erwartung am stärksten nutzt.",
    long:
      "Der sichtbare Hinweis, den der Beobachter für seine aktuelle Erwartung am stärksten heranzieht. Die Bezeichnung beschreibt seine Nutzung in dieser Situation und keine objektive allgemeine Wichtigkeit.",
    synonyms: ["Primary cue"],
    tags: ["E4"],
  },
  alternativszenario: {
    label: "Alternativszenario",
    short: "Zweite realistische nächste Aktion mit beobachtbarem Auslöser.",
    long:
      "Eine zweite realistische nächste Aktion, die durch eine konkrete neue oder veränderte sichtbare Information plausibler werden kann.",
    synonyms: ["Branch", "Alternative"],
    tags: ["E4"],
  },
  ausloeser_aktualisierung: {
    label: "Auslöser einer Aktualisierung",
    short: "Neue sichtbare Information für Beibehalten oder Ändern.",
    long:
      "Eine neue oder veränderte sichtbare Information, aufgrund derer eine bisherige Erwartung überprüft, beibehalten oder geändert wird.",
    synonyms: ["Update Trigger", "Auslöser"],
    tags: ["E4"],
  },
  uebereinstimmung: {
    label: "Übereinstimmung",
    short: "Entsprach die Aktion der gespeicherten Erwartung? — keine Qualitätsnote.",
    long:
      "Angabe, ob die tatsächlich beobachtete Aktion der zuvor gespeicherten Erwartung entsprach. Eine Übereinstimmung ist keine automatische Qualitätsbewertung.",
    synonyms: ["Match"],
    tags: ["E4"],
  },
  sicherheit_erwartung: {
    label: "Sicherheit der ursprünglichen Erwartung",
    short: "Subjektiv vor der Aktion — keine Wahrscheinlichkeit, kein Kompetenzwert.",
    long:
      "Subjektive Einschätzung vor der tatsächlichen Aktion. Sie ist keine objektive Wahrscheinlichkeit und kein Kompetenzwert.",
    synonyms: ["Confidence"],
    tags: ["E4"],
  },
  bisherige_antizipations_beobachtungen: {
    label: "Bisherige Antizipations-Beobachtungen",
    short: "Beschreibende Zusammenfassung — kein Skill-Profil.",
    long:
      "Beschreibende Zusammenfassung der bisher dokumentierten Hinweise, Alternativszenarien und Aktualisierungen. Sie ist kein stabiles persönliches Profil und keine Bewertung des Hockey-IQ.",
    synonyms: ["Anticipation Profile"],
    tags: ["E4"],
  },
};
