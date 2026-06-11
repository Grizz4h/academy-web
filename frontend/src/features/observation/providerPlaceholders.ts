import type { ObservationProfile } from '../../api'

export interface ObservationProviderRef {
  provider: string
  externalId: string
  url?: string
}

export interface ObservationProviderClient {
  providerName: string
  fetchPlayerProfile(ref: ObservationProviderRef): Promise<Record<string, any>>
  fetchPlayerStats(ref: ObservationProviderRef): Promise<Record<string, any>>
  refreshPlayer(ref: ObservationProviderRef): Promise<Record<string, any>>
}

export interface ObservationSummaryService {
  generateSummary(profile: ObservationProfile): Promise<{ text: string; status: string }>
}

export class NotImplementedObservationProviderClient implements ObservationProviderClient {
  providerName = 'not_implemented'

  async fetchPlayerProfile(ref: ObservationProviderRef): Promise<Record<string, any>> {
    return Promise.resolve({ status: 'not_implemented', provider: this.providerName, ref })
  }

  async fetchPlayerStats(ref: ObservationProviderRef): Promise<Record<string, any>> {
    return Promise.resolve({ status: 'not_implemented', provider: this.providerName, ref })
  }

  async refreshPlayer(ref: ObservationProviderRef): Promise<Record<string, any>> {
    return Promise.resolve({ status: 'not_implemented', provider: this.providerName, ref })
  }
}

export class NotImplementedObservationSummaryService implements ObservationSummaryService {
  async generateSummary(profile: ObservationProfile): Promise<{ text: string; status: string }> {
    return Promise.resolve({
      text: profile.summary?.text || '',
      status: 'not_implemented'
    })
  }
}
