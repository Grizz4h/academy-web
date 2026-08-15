import { MATCHDAY_AEV_STR_20251221, MATCHDAY_AEV_STR_GROUP } from './del_2025_2026_aev_str_2025-12-21'
import type { MatchdayGroupMeta } from './createMatchdaySet'

/** Register one finished set per file. Do not auto-generate the whole season. */
export const MATCHDAY_CHALLENGE_SETS = [...MATCHDAY_AEV_STR_20251221]

export const MATCHDAY_GROUPS: MatchdayGroupMeta[] = [MATCHDAY_AEV_STR_GROUP]

export function getMatchdayGroup(groupId: string | undefined): MatchdayGroupMeta | undefined {
  if (!groupId) return undefined
  return MATCHDAY_GROUPS.find((item) => item.id === groupId)
}
