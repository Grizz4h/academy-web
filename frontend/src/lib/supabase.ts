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
export function oauthRedirectTo(): string {
  if (typeof window === 'undefined') return 'https://rinq-tank.de/auth/callback'
  return `${window.location.origin}/auth/callback`
}

export async function signInWithGoogle(): Promise<{ error?: string }> {
  const supabase = getSupabase()
  if (!supabase) {
    return { error: 'Google Login ist noch nicht konfiguriert.' }
  }
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: oauthRedirectTo(),
      // Minimal scopes — Supabase/Google defaults (openid profile email).
      // We do not persist email/name in RinQ identity.
      queryParams: {
        access_type: 'online',
        prompt: 'select_account',
      },
    },
  })
  if (error) return { error: error.message }
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
