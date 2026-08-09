/**
 * Lightweight assert suite for scene asset naming.
 * Run: npx --yes tsx src/utils/sceneAssetName.test.ts
 */

import {
  formatSceneAssetClock,
  formatSceneAssetPeriod,
  generateSceneAssetName,
  normalizeSceneSlug,
} from './sceneAssetName'
import { resolveTeamShortCode, formatMatchupShortCodes } from '../data/teamShortCodes'

function assertEqual(actual: unknown, expected: unknown, label: string) {
  const left = JSON.stringify(actual)
  const right = JSON.stringify(expected)
  if (left !== right) {
    throw new Error(`${label}\n  expected: ${right}\n  actual:   ${left}`)
  }
}

assertEqual(resolveTeamShortCode('Straubing Tigers'), 'STR', 'DEL STR')
assertEqual(resolveTeamShortCode('Augsburger Panther'), 'AEV', 'DEL AEV club/TV')
assertEqual(resolveTeamShortCode('Eisbären Berlin'), 'EBB', 'DEL EBB TV')
assertEqual(resolveTeamShortCode('Kölner Haie'), 'KEC', 'DEL KEC TV')
assertEqual(resolveTeamShortCode('Iserlohn Roosters'), 'IEC', 'DEL IEC TV')
assertEqual(resolveTeamShortCode('Nürnberg Ice Tigers'), 'NIT', 'DEL NIT TV')
assertEqual(resolveTeamShortCode('Schwenninger Wild Wings'), 'SEC', 'DEL SEC TV')
assertEqual(resolveTeamShortCode('EHC Red Bull München'), 'MUC', 'DEL MUC umlaut')
assertEqual(resolveTeamShortCode('Boston Bruins'), 'BOS', 'NHL BOS')
assertEqual(resolveTeamShortCode('Utah Mammoth'), 'UTA', 'NHL UTA')
assertEqual(resolveTeamShortCode('Tampa Bay Lightning'), 'TBL', 'NHL TBL')
assertEqual(resolveTeamShortCode('Deutschland'), 'GER', 'National GER')
assertEqual(resolveTeamShortCode('Krefeld Pinguine'), 'KEV', 'DEL2 KEV')
assertEqual(resolveTeamShortCode('EV Landshut'), 'EVL', 'DEL2 EVL')
assertEqual(resolveTeamShortCode('ZSC Lions Zurich'), 'ZSC', 'CHL ZSC')
assertEqual(resolveTeamShortCode('Pinguins Bremerhaven'), 'BRE', 'CHL Bremerhaven alias')
assertEqual(resolveTeamShortCode('Jungadler Mannheim'), 'JAM', 'U20 JAM')
assertEqual(resolveTeamShortCode('Augsburger EV'), 'AEV', 'U20 AEV')
assertEqual(formatMatchupShortCodes('Straubing Tigers', 'Augsburger Panther'), 'STR-AEV', 'matchup home-away')
assertEqual(formatMatchupShortCodes('Eisbären Berlin', 'Kölner Haie'), 'EBB-KEC', 'TV matchup')
assertEqual(formatMatchupShortCodes('Boston Bruins', 'Utah Mammoth'), 'BOS-UTA', 'NHL matchup')
assertEqual(formatMatchupShortCodes('Krefeld Pinguine', 'EC Kassel Huskies'), 'KEV-KAS', 'DEL2 matchup')
assertEqual(formatSceneAssetClock('9:15'), 'T09-15', 'pad minutes')
assertEqual(formatSceneAssetClock('09:15'), 'T09-15', 'already padded')
assertEqual(formatSceneAssetClock('9:05'), 'T09-05', 'single digit minute+sec')
assertEqual(formatSceneAssetClock('00:07'), 'T00-07', 'zero minutes')
assertEqual(formatSceneAssetClock('19:59'), 'T19-59', 'end of period-ish')
assertEqual(formatSceneAssetClock(''), null, 'empty clock')
assertEqual(formatSceneAssetClock('bad'), null, 'invalid clock')

assertEqual(formatSceneAssetPeriod('P2'), 'P2', 'P2')
assertEqual(formatSceneAssetPeriod('ot'), 'OT', 'OT existing convention')
assertEqual(formatSceneAssetPeriod('SO'), 'SO', 'SO existing convention')
assertEqual(formatSceneAssetPeriod('PRE'), null, 'unsupported PRE')

assertEqual(normalizeSceneSlug('Center Reads'), 'Center-Reads', 'spaces')
assertEqual(normalizeSceneSlug('A/B:C'), 'A-B-C', 'slash colon')
assertEqual(normalizeSceneSlug('--Foo--'), 'Foo', 'trim dashes')

const happy = generateSceneAssetName({
  sceneCode: 'SC035',
  teamHome: 'Straubing Tigers',
  teamAway: 'Augsburger Panther',
  period: 'P2',
  gameTime: '09:15',
  sourceType: 'drill',
  drillId: 'B1_D1',
  sceneSlug: 'Center-Reads',
})
assertEqual(happy, { ok: true, name: 'SC035_STR-AEV_P2_T09-15_Center-Reads' }, 'canonical example')

const tvCodes = generateSceneAssetName({
  sceneCode: 'SC036',
  teamHome: 'Eisbären Berlin',
  teamAway: 'Kölner Haie',
  period: 'P1',
  gameTime: '12:00',
  sourceType: 'manual',
})
assertEqual(tvCodes, { ok: true, name: 'SC036_EBB-KEC_P1_T12-00_Manual' }, 'TV DEL codes in asset name')

const manual = generateSceneAssetName({
  sceneCode: 'SC041',
  teamHome: 'ERC Ingolstadt',
  teamAway: 'EHC Red Bull München',
  period: 'P3',
  gameTime: '4:28',
  sourceType: 'manual',
})
assertEqual(manual, { ok: true, name: 'SC041_ING-MUC_P3_T04-28_Manual' }, 'manual scene')

const missingSlug = generateSceneAssetName({
  sceneCode: 'SC010',
  teamHome: 'Straubing Tigers',
  teamAway: 'Augsburger Panther',
  period: 'P1',
  gameTime: '01:00',
  sourceType: 'drill',
  drillId: 'B1_D1',
  sceneSlug: null,
})
assertEqual(missingSlug.ok, false, 'missing drill slug fails')
if (!missingSlug.ok) {
  assertEqual(missingSlug.missing.includes('Drill-Slug'), true, 'reports Drill-Slug')
}

const missingTeams = generateSceneAssetName({
  sceneCode: 'SC011',
  teamHome: 'Unknown FC',
  teamAway: 'Augsburger Panther',
  period: 'P1',
  gameTime: '01:00',
  sourceType: 'manual',
})
assertEqual(missingTeams.ok, false, 'unknown team fails')
if (!missingTeams.ok) {
  assertEqual(missingTeams.missing.includes('Paarung'), true, 'reports Paarung')
}

const nhl = generateSceneAssetName({
  sceneCode: 'SC100',
  teamHome: 'Boston Bruins',
  teamAway: 'Toronto Maple Leafs',
  period: 'OT',
  gameTime: '00:07',
  sourceType: 'manual',
})
assertEqual(nhl, { ok: true, name: 'SC100_BOS-TOR_OT_T00-07_Manual' }, 'NHL + OT')

console.log('sceneAssetName tests passed')
