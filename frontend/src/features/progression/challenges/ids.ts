export function challengeInstanceKey(challengeId: string, rotationKey: string): string {
  return `${challengeId}::${rotationKey}`
}

export function challengeCompletionEventId(instanceKey: string): string {
  return `challenge_completed:${instanceKey}`
}

export function matchdayRotationKey(gameId: string): string {
  return `matchday:${gameId}`
}

export function campaignRotationKey(campaignId: string): string {
  return `campaign:${campaignId}`
}

export function onceRotationKey(challengeId: string): string {
  return `once:${challengeId}`
}
