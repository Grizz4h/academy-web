import { GLOSSARY } from '../../content/glossary'
import type { HockeyTermDefinition } from './types'

/** Central Track 0 terminology catalog — maps to content/glossary.ts slugs */
export const HOCKEY_TERMS: HockeyTermDefinition[] = [
  { id: 'defensive_zone', term: 'Defensive Zone', shortDefinition: 'Der Bereich vor dem eigenen Tor, den dein Team verteidigt.', category: 'zones', glossarySlug: 'd_zone' },
  { id: 'neutral_zone', term: 'Neutral Zone', shortDefinition: 'Der Bereich zwischen den beiden Blue Lines.', category: 'zones', glossarySlug: 'n_zone' },
  { id: 'offensive_zone', term: 'Offensive Zone', shortDefinition: 'Der Bereich vor dem gegnerischen Tor, in den dein Team angreift.', category: 'zones', glossarySlug: 'o_zone' },
  { id: 'blue_line', term: 'Blue Line', shortDefinition: 'Die blaue Zonengrenze — wichtiger Übergangspunkt im Spiel.', category: 'zones', glossarySlug: 'blue_line' },
  { id: 'center_line', term: 'Center Line', shortDefinition: 'Die rote Mittellinie — teilt das Eis in zwei Hälften.', category: 'zones', glossarySlug: 'red_line' },
  { id: 'goal_line', term: 'Goal Line', shortDefinition: 'Die Torlinie — das Tor steht direkt dahinter.', category: 'zones' },
  { id: 'net_front', term: 'Net Front', shortDefinition: 'Der Bereich direkt vor dem Tor — Screens, Rebounds, gefährliche Abschlüsse.', category: 'zones', glossarySlug: 'net_front' },
  { id: 'slot', term: 'Slot', shortDefinition: 'Der zentrale gefährliche Raum vor dem Tor.', category: 'zones', glossarySlug: 'slot' },
  { id: 'faceoff', term: 'Faceoff', shortDefinition: 'Spielbeginn oder -unterbrechung am Bullypunkt.', category: 'rules' },
  { id: 'goalie', term: 'Goalie', shortDefinition: 'Schützt das Tor — letzte Verteidigungslinie.', category: 'roles', glossarySlug: 'goalie' },
  { id: 'center', term: 'Center', shortDefinition: 'Spielt häufig zentral und verbindet Angriff und Defensive.', category: 'roles', glossarySlug: 'center' },
  { id: 'wing', term: 'Wing', shortDefinition: 'Flügelspieler — bringt Breite und Tiefe über die Seiten.', category: 'roles', glossarySlug: 'winger' },
  { id: 'defense', term: 'Defense', shortDefinition: 'Verteidigt näher am eigenen Tor und unterstützt den Aufbau von hinten.', category: 'roles', glossarySlug: 'defenseman' },
  { id: 'puck_carrier', term: 'Puckführer', shortDefinition: 'Der Spieler, der den Puck kontrolliert.', category: 'roles' },
  { id: 'support', term: 'Support', shortDefinition: 'Mitspieler, der dem Puckführer eine sichere Anspieloption bietet.', category: 'tactics', glossarySlug: 'support' },
  { id: 'offside', term: 'Offside', shortDefinition: 'Angreifer betritt die offensive Zone vor dem Puck.', category: 'rules' },
  { id: 'icing', term: 'Icing', shortDefinition: 'Puck wird aus der eigenen Hälfte unberührt hinter die gegnerische Goal Line gespielt.', category: 'rules' },
  { id: 'penalty', term: 'Strafe', shortDefinition: 'Spieler muss die Eisfläche verlassen — sein Team spielt in Unterzahl.', category: 'rules' },
  { id: 'powerplay', term: 'Powerplay', shortDefinition: 'Überzahl — dein Team hat einen Spieler mehr.', category: 'rules' },
  { id: 'penalty_kill', term: 'Penalty Kill', shortDefinition: 'Unterzahl — dein Team verteidigt mit einem Spieler weniger.', category: 'rules' },
  { id: 'delayed_penalty', term: 'Delayed Penalty', shortDefinition: 'Strafe wird angezeigt, aber erst gepfiffen, wenn die bestrafte Mannschaft den Puck erlangt.', category: 'rules' },
  { id: 'empty_net', term: 'Empty Net', shortDefinition: 'Tor ohne Goalie — meist am Ende eines Spiels für einen Extra-Stürmer.', category: 'rules' },
  { id: 'possession', term: 'Puckbesitz', shortDefinition: 'Welches Team den Puck kontrolliert.', category: 'tactics', glossarySlug: 'possession' },
  { id: 'pressure', term: 'Druck', shortDefinition: 'Aktiver Druck auf den Puckführer oder den Raum.', category: 'tactics' },
  { id: 'puck_side', term: 'Puck Side', shortDefinition: 'Die Seite des Eises, auf der der Puck liegt.', category: 'tactics' },
  { id: 'weak_side', term: 'Weak Side', shortDefinition: 'Die Seite ohne Puck — oft mehr freier Raum.', category: 'tactics' },
  { id: 'gap', term: 'Gap', shortDefinition: 'Abstand zwischen Puckführer und Verteidiger.', category: 'tactics' },
  { id: 'entry', term: 'Entry', shortDefinition: 'Ein Team bringt den Puck in die offensive Zone.', category: 'tactics' },
  { id: 'exit', term: 'Exit', shortDefinition: 'Kontrolliertes Verlassen der eigenen Zone.', category: 'tactics' },
  { id: 'forecheck', term: 'Forecheck', shortDefinition: 'Druck auf den Gegner in dessen oder deiner Zone, um den Puck zurückzugewinnen.', category: 'tactics' },
  { id: 'breakout', term: 'Breakout', shortDefinition: 'Strukturierter Aufbau und Exit aus der eigenen Zone.', category: 'tactics', glossarySlug: 'breakout' },
  { id: 'transition', term: 'Transition', shortDefinition: 'Schneller Wechsel von Defensive zu Offensive (oder umgekehrt).', category: 'tactics' },
  { id: 'reset', term: 'Reset', shortDefinition: 'Puck zurück in eine sicherere Position bringen, um neu zu starten.', category: 'tactics' },
]

const TERM_BY_ID = Object.fromEntries(HOCKEY_TERMS.map((t) => [t.id, t])) as Record<string, HockeyTermDefinition>

export function getHockeyTermById(termId: string): HockeyTermDefinition | undefined {
  return TERM_BY_ID[termId]
}

export function getHockeyTermDefinition(termId: string): { term: string; short: string; long?: string } {
  const entry = getHockeyTermById(termId)
  if (!entry) return { term: termId, short: '' }
  if (entry.glossarySlug && GLOSSARY[entry.glossarySlug]) {
    const g = GLOSSARY[entry.glossarySlug]
    return { term: g.label, short: g.short, long: g.long }
  }
  return {
    term: entry.term,
    short: entry.shortDefinition,
    long: entry.longDefinition,
  }
}
