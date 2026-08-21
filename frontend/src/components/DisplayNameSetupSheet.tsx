import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { api } from '../api'
import { useUser } from '../context/UserContext'
import { getSupabase } from '../lib/supabase'
import { UiButton, UiSheet, UiSheetActions } from './ui'
import styles from './DisplayNameSetupSheet.module.css'

const NAME_RE = /^[\w\s\-'.]+$/u

function validateClientName(raw: string): string | null {
  const name = raw.trim().replace(/\s+/g, ' ')
  if (name.length < 2) return 'Mindestens 2 Zeichen.'
  if (name.length > 40) return 'Maximal 40 Zeichen.'
  if (name.includes('@') || name.includes('://')) return 'Keine E-Mail oder URL.'
  if (!NAME_RE.test(name)) return 'Nur Buchstaben, Zahlen, Leerzeichen und - \' .'
  return null
}

/**
 * First-login onboarding for new Google/OAuth users.
 * Legacy and already-configured users are never prompted (server: needs_display_name).
 */
export function DisplayNameSetupSheet() {
  const { needsDisplayName, applyDisplayName } = useUser()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [suggestion, setSuggestion] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!needsDisplayName) {
      setOpen(false)
      return
    }
    setOpen(true)
    setError('')
    let cancelled = false
    ;(async () => {
      // Ephemeral Google display name as suggestion only — never as identity, never email.
      let seed = ''
      try {
        const supabase = getSupabase()
        if (supabase) {
          const { data } = await supabase.auth.getUser()
          const meta = data.user?.user_metadata || {}
          const candidate = String(meta.full_name || meta.name || meta.given_name || '').trim()
          if (candidate && !candidate.includes('@') && !validateClientName(candidate)) {
            seed = candidate.slice(0, 40)
          }
        }
      } catch {
        // ignore — empty field is fine
      }
      if (!cancelled) {
        setSuggestion(seed)
        setName(seed)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [needsDisplayName])

  const save = async () => {
    const trimmed = name.trim().replace(/\s+/g, ' ')
    const clientError = validateClientName(trimmed)
    if (clientError) {
      setError(clientError)
      return
    }
    setBusy(true)
    setError('')
    try {
      const saved = await api.updateMyProfile({ displayName: trimmed })
      applyDisplayName(saved.displayName || trimmed)
      await queryClient.invalidateQueries({ queryKey: ['me'] })
      setOpen(false)
      navigate('/', { replace: true })
    } catch (e: any) {
      setError(e?.message || 'Speichern fehlgeschlagen')
    } finally {
      setBusy(false)
    }
  }

  return (
    <UiSheet
      open={open}
      onClose={() => {
        /* Pflicht beim ersten OAuth-Login — nicht wegklicken */
      }}
      title="Wie heißt du?"
      meta="Dein Anzeigename in RinQ Tank. Später jederzeit im Account änderbar."
      label="Anzeigenamen festlegen"
    >
      <label className={styles.label} htmlFor="display-name-setup">
        Profilname
      </label>
      <input
        id="display-name-setup"
        className={styles.input}
        autoComplete="nickname"
        autoFocus
        maxLength={40}
        placeholder={suggestion ? suggestion : 'z. B. Alex'}
        value={name}
        disabled={busy}
        onChange={(e) => {
          setName(e.target.value)
          setError('')
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') void save()
        }}
      />
      {suggestion && name === suggestion ? (
        <p className={styles.hint}>Vorschlag aus Google — du kannst ihn ändern. Wird nicht als Login-ID genutzt.</p>
      ) : null}
      {error ? <p className={styles.error}>{error}</p> : null}
      <UiSheetActions
        primary={
          <UiButton type="button" onClick={() => void save()} disabled={busy || name.trim().length < 2}>
            {busy ? 'Speichern…' : 'Weiter'}
          </UiButton>
        }
      />
    </UiSheet>
  )
}
