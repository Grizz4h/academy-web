import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let client: SupabaseClient | null = null

/** Public Supabase client — never put service-role keys here. */
export function getSupabase(): SupabaseClient | null {
  const url = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim()
  const key = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined)?.trim()
  if (!url || !key) return null
  if (!client) {
    client = createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
      },
    })
  }
  return client
}

export function isSupabaseConfigured(): boolean {
  return Boolean(
    (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim() &&
      (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined)?.trim(),
  )
}

/** Canonical production OAuth redirect (also works for www via same SPA). */
export function oauthRedirectTo(intent?: 'login' | 'link'): string {
  if (typeof window === 'undefined') {
    const base = 'https://rinq-tank.de/auth/callback'
    return intent === 'link' ? `${base}?intent=link` : base
  }
  const url = new URL('/auth/callback', window.location.origin)
  if (intent === 'link') url.searchParams.set('intent', 'link')
  return url.toString()
}

const LINK_LEGACY_TOKEN_KEY = 'academy.linkLegacyToken'
const LINK_INTENT_KEY = 'academy.authLinkIntent'

export function beginGoogleLinkFlow(): void {
  const token = localStorage.getItem('academy.token')
  if (token) localStorage.setItem(LINK_LEGACY_TOKEN_KEY, token)
  localStorage.setItem(LINK_INTENT_KEY, 'google')
}

export function peekGoogleLinkLegacyToken(): string | null {
  return localStorage.getItem(LINK_LEGACY_TOKEN_KEY)
}

export function clearGoogleLinkFlow(): void {
  localStorage.removeItem(LINK_LEGACY_TOKEN_KEY)
  localStorage.removeItem(LINK_INTENT_KEY)
}

export function isGoogleLinkIntent(): boolean {
  if (typeof window === 'undefined') return false
  const params = new URLSearchParams(window.location.search)
  if (params.get('intent') === 'link') return true
  return localStorage.getItem(LINK_INTENT_KEY) === 'google'
}

export async function signInWithGoogle(options?: { intent?: 'login' | 'link' }): Promise<{ error?: string }> {
  const supabase = getSupabase()
  if (!supabase) {
    return { error: 'Google Login ist noch nicht konfiguriert.' }
  }
  const intent = options?.intent || 'login'
  if (intent === 'link') beginGoogleLinkFlow()
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: oauthRedirectTo(intent),
      queryParams: {
        access_type: 'online',
        prompt: 'select_account',
      },
    },
  })
  if (error) {
    if (intent === 'link') clearGoogleLinkFlow()
    return { error: error.message }
  }
  return {}
}

export async function signOutSupabase(): Promise<void> {
  const supabase = getSupabase()
  if (!supabase) return
  try {
    await supabase.auth.signOut()
  } catch {
    // ignore — local state still cleared by caller
  }
}

export async function getSupabaseAccessToken(): Promise<string | null> {
  const supabase = getSupabase()
  if (!supabase) return null
  const { data } = await supabase.auth.getSession()
  return data.session?.access_token ?? null
}
