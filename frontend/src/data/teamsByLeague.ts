/**
 * Zentrale Team-Mapping für alle Leagues
 * Wird zum 2025/26 Update direkt hier editiert
 * TODO mittelfristig: /api/leagues/teams Endpoint nutzen
 */

export const teamsByLeague: Record<string, string[]> = {
  DEL: [
    'Eisbären Berlin',
    'Adler Mannheim',
    'EHC Red Bull München',
    'ERC Ingolstadt',
    'Kölner Haie',
    'Dresdner Eislöwen',
    'Grizzlys Wolfsburg',
    'Schwenninger Wild Wings',
    'Straubing Tigers',
    'Augsburger Panther',
    'Iserlohn Roosters',
    'Nürnberg Ice Tigers',
    'Fischtown Pinguins Bremerhaven',
    'Löwen Frankfurt',
  ],

  DEL2: [
    'Krefeld Pinguine',
    'EC Kassel Huskies',
    'Starbulls Rosenheim',
    'Ravensburg Towerstars',
    'Bietigheim Steelers',
    'Eisbären Regensburg',
    'Lausitzer Füchse',
    'EV Landshut',
    'Düsseldorfer EG',
    'Eispiraten Crimmitschau',
    'EHC Freiburg',
    'Blue Devils Weiden',
    'EC Bad Nauheim',
    'ESV Kaufbeuren',
  ],

  Nationalmannschaften: [
    'Deutschland',
    'Schweden',
    'Finnland',
    'Norwegen',
    'Russland',
    'Tschechien',
    'Slowakei',
    'Ungarn',
    'Kanada',
    'USA',
    'Schweiz',
    'Frankreich',
    'Österreich',
    'Italien',
    'Lettland',
    'Slowenien',
    'Dänemark',
    'Großbritannien',
    'Japan',
    'Südkorea',
  ],

  NHL: [
    // Atlantic Division
    'Boston Bruins',
    'Buffalo Sabres',
    'Detroit Red Wings',
    'Florida Panthers',
    'Montreal Canadiens',
    'Ottawa Senators',
    'Tampa Bay Lightning',
    'Toronto Maple Leafs',
    // Metropolitan Division
    'Carolina Hurricanes',
    'Columbus Blue Jackets',
    'New Jersey Devils',
    'New York Islanders',
    'New York Rangers',
    'Philadelphia Flyers',
    'Pittsburgh Penguins',
    'Washington Capitals',
    // Central Division
    'Arizona Coyotes',
    'Chicago Blackhawks',
    'Colorado Avalanche',
    'Dallas Stars',
    'Minnesota Wild',
    'Nashville Predators',
    'St. Louis Blues',
    'Winnipeg Jets',
    // Pacific Division
    'Anaheim Ducks',
    'Calgary Flames',
    'Edmonton Oilers',
    'Los Angeles Kings',
    'San Jose Sharks',
    'Seattle Kraken',
    'Vancouver Canucks',
    'Vegas Golden Knights',
  ],

  CHL: [
    // Switzerland
    'ZSC Lions Zurich',
    'Lausanne HC',
    'SC Bern',
    'EV Zug',

    // Austria/ICEHL
    'Red Bull Salzburg',
    'KAC Klagenfurt',
    'HC Bolzano',

    // Czechia
    'Kometa Brno',
    'Sparta Prague',
    'Mountfield HK',

    // Finland
    'KalPa Kuopio',
    'Lukko Rauma',
    'Ilves Tampere',

    // Germany
    'Eisbären Berlin',
    'ERC Ingolstadt',
    'Pinguins Bremerhaven',

    // Sweden
    'Luleå Hockey',
    'Brynäs IF',
    'Frölunda Gothenburg',

    // Challenger leagues (champions)
    'Odense Bulldogs',
    'Grenoble',
    'Storhamar Hamar',
    'GKS Tychy',
    'Belfast Giants',
  ],

  U20_DNL: [
    'Jungadler Mannheim',
    'ERC Ingolstadt',
    'Krefelder EV 81',
    'Kölner Junghaie',
    'Eisbären Juniors Berlin',
    'EV Landshut',
    'ESC Dresden',
    'Iserlohner EC',
    'Düsseldorfer EG',
    'SC Bietigheim-Bissingen',
    'ESV Kaufbeuren',
    'EC Bad Tölz',
    'Augsburger EV',
    'Starbulls Rosenheim',
    'Schwenninger ERC',
    'Jung-Eisbären Regensburg',
  ],
};

export const LEAGUES = Object.keys(teamsByLeague);
