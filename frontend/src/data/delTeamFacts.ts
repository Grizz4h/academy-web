/**
 * DEL club facts for observation popovers (session setup).
 * Hard-separated from CHL: overlapping clubs (Berlin, Mannheim, …) have their own
 * DEL entries — never import or alias from chlTeamFacts.
 *
 * Season focus: PENNY DEL 2026/27 (Krefeld up, Dresden out).
 * Reviewed: docs/content/del-team-facts-review.md (Übersichtstabelle).
 */
export type DelTeamFacts = {
  fullName: string
  city: string
  founded?: number
  arena?: string
  arenaCapacity?: number
  /** Short optional line under the facts grid */
  note?: string
}

/** Keyed by delTeamLogos / catalog team id (snake_case). */
export const DEL_TEAM_FACTS: Record<string, DelTeamFacts> = {
  adler_mannheim: {
    fullName: 'Adler Mannheim',
    city: 'Mannheim',
    founded: 1938,
    arena: 'SAP Arena',
    arenaCapacity: 13600,
  },
  augsburger_panther: {
    fullName: 'Augsburger Panther',
    city: 'Augsburg',
    founded: 1878,
    arena: 'Curt-Frenzel-Stadion',
    arenaCapacity: 6218,
  },
  eisbaren_berlin: {
    fullName: 'Eisbären Berlin',
    city: 'Berlin',
    founded: 1954,
    arena: 'Uber Arena',
    arenaCapacity: 14200,
  },
  erc_ingolstadt: {
    fullName: 'ERC Ingolstadt',
    city: 'Ingolstadt',
    founded: 1964,
    arena: 'Saturn Arena',
    arenaCapacity: 4591,
  },
  fischtown_pinguins: {
    fullName: 'Pinguins Bremerhaven',
    city: 'Bremerhaven',
    founded: 1974,
    arena: 'Eisarena Bremerhaven',
    arenaCapacity: 4674,
  },
  grizzlys_wolfsburg: {
    fullName: 'Grizzlys Wolfsburg',
    city: 'Wolfsburg',
    founded: 1964,
    arena: 'EisArena Wolfsburg',
    arenaCapacity: 4503,
  },
  iserlohn_roosters: {
    fullName: 'Iserlohn Roosters',
    city: 'Iserlohn',
    founded: 1959,
    arena: 'Balver Zinn Arena',
    arenaCapacity: 4967,
  },
  kolner_haie: {
    fullName: 'Kölner Haie',
    city: 'Köln',
    founded: 1972,
    arena: 'LANXESS arena',
    arenaCapacity: 18600,
    note: 'Größte Eishockeyhalle Europas',
  },
  krefeld_pinguine: {
    fullName: 'Krefeld Pinguine',
    city: 'Krefeld',
    founded: 1936,
    arena: 'Yayla Arena',
    arenaCapacity: 8029,
  },
  lowen_frankfurt: {
    fullName: 'Löwen Frankfurt',
    city: 'Frankfurt',
    founded: 2010,
    arena: 'Eissporthalle Frankfurt',
    arenaCapacity: 6990,
  },
  nurnberg_ice_tigers: {
    fullName: 'Nürnberg Ice Tigers',
    city: 'Nürnberg',
    founded: 1980,
    arena: 'PSD Bank Nürnberg Arena',
    arenaCapacity: 7672,
  },
  red_bull_munchen: {
    fullName: 'EHC Red Bull München',
    city: 'München',
    founded: 1998,
    arena: 'SAP Garden',
    arenaCapacity: 10796,
  },
  schwenninger_wild_wings: {
    fullName: 'Schwenninger Wild Wings',
    city: 'Villingen-Schwenningen',
    founded: 1904,
    arena: 'Helios Arena',
    arenaCapacity: 5135,
  },
  straubing_tigers: {
    fullName: 'Straubing Tigers',
    city: 'Straubing',
    founded: 1941,
    arena: 'Eisstadion am Pulverturm',
    arenaCapacity: 5635,
  },
}

export function getDelTeamFacts(teamId: string | null | undefined): DelTeamFacts | null {
  if (!teamId) return null
  const key = teamId.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')
  return DEL_TEAM_FACTS[key] || null
}

export function getDelTeamFactsByName(name: string): DelTeamFacts | null {
  const norm = name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')
  if (DEL_TEAM_FACTS[norm]) return DEL_TEAM_FACTS[norm]
  for (const [key, facts] of Object.entries(DEL_TEAM_FACTS)) {
    if (facts.fullName.toLowerCase() === name.toLowerCase()) return facts
    if (key.includes(norm) || norm.includes(key)) return facts
  }
  return null
}
