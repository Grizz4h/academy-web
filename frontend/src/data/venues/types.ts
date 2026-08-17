export type VenueDataQuality = 'verified' | 'plausible' | 'missing' | 'suspicious'

export type VenueSource = {
  type: string
  label?: string
  url?: string
  verifiedAt?: string
}

export type VenueLocation = {
  latitude: number
  longitude: number
}

export type VenueAddress = {
  street?: string
  city?: string
  postalCode?: string
  country?: string
}

export type VenueDefinition = {
  id: string
  name: string
  leagueId?: string
  /** Home teams that default to this venue when a game has no venueId. */
  teamIds?: string[]
  address?: VenueAddress
  location?: VenueLocation
  geofenceRadiusMeters: number
  source?: VenueSource
  dataQuality: VenueDataQuality
  enabled: boolean
}

export type VenueVisit = {
  venueId: string
  firstVerifiedAt: string
  firstGameId: string
  verifiedGameIds: string[]
  homeVisits: number
  awayVisits: number
}

export type SessionLocationVerification = {
  checkedAt: string
  venueId: string
  gameId: string
  insideGeofence: boolean
  distanceMeters?: number
  accuracyMeters?: number
  verificationType: 'browser_geolocation' | 'dev_simulation'
  reason?: 'inside' | 'outside_geofence' | 'insufficient_accuracy' | 'outside_window' | 'venue_unusable' | 'denied' | 'unavailable' | 'error'
  /** Dev simulation must never write real visits / rewards. */
  devSimulated?: boolean
}
