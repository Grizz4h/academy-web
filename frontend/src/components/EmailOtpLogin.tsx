import { useState } from 'react'
import { sendEmailOtp, verifyEmailOtp } from '../lib/supabase'
import { useUser } from '../context/UserContext'
import { UiButton, UiActionRow } from './ui'
import styles from '../pages/Dashboard.module.css'

type Step = 'idle' | 'email' | 'otp'

type EmailOtpLoginProps = {
  /** Required before sending OTP (new accounts may be created). */
  ageConfirmed?: boolean
  onNeedAgeConfirm?: () => void
}

/**
 * Passwordless email login via Supabase OTP.
 * RinQ identity is created only after a verified access token hits /api/me.
 */
export function EmailOtpLogin({ ageConfirmed = false, onNeedAgeConfirm }: EmailOtpLoginProps) {
  const { completeSupabaseSession } = useUser()
  const [step, setStep] = useState<Step>('idle')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')

  if (step === 'idle') {
    return (
      <UiButton
        type="button"
        variant="secondary"
        onClick={() => {
          if (!ageConfirmed) {
            onNeedAgeConfirm?.()
            return
          }
          setStep('email')
          setError('')
          setInfo('')
        }}
      >
        Mit E-Mail anmelden
      </UiButton>
    )
  }

  const sendCode = async () => {
    if (!ageConfirmed) {
      onNeedAgeConfirm?.()
      setError('Bitte bestätige, dass du mindestens 18 Jahre alt bist.')
      return
    }
    setBusy(true)
    setError('')
    setInfo('')
    try {
      const result = await sendEmailOtp(email)
      if (result.error) {
        setError(result.error)
        return
      }
      setInfo('Code gesendet — prüfe dein Postfach.')
      setStep('otp')
    } finally {
      setBusy(false)
    }
  }

  const confirmCode = async () => {
    setBusy(true)
    setError('')
    try {
      const result = await verifyEmailOtp(email, otp)
      if (result.error || !result.accessToken) {
        setError(result.error || 'Anmeldung fehlgeschlagen')
        return
      }
      const ok = await completeSupabaseSession(result.accessToken)
      if (!ok.ok) {
        setError(ok.error || 'Anmeldung fehlgeschlagen')
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className={styles.formColumn}>
      {step === 'email' ? (
        <>
          <input
            type="email"
            autoComplete="email"
            inputMode="email"
            placeholder="E-Mail"
            value={email}
            disabled={busy}
            className={styles.input}
            onChange={(e) => {
              setEmail(e.target.value)
              setError('')
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void sendCode()
            }}
          />
          <UiActionRow>
            <UiButton type="button" onClick={() => void sendCode()} disabled={busy || !email.trim()}>
              {busy ? 'Senden…' : 'Code senden'}
            </UiButton>
            <UiButton
              type="button"
              variant="ghost"
              disabled={busy}
              onClick={() => {
                setStep('idle')
                setError('')
                setInfo('')
                setOtp('')
              }}
            >
              Abbrechen
            </UiButton>
          </UiActionRow>
        </>
      ) : (
        <>
          <p className={styles.successMsg} style={{ opacity: 0.85 }}>
            Code an {email.trim()}
          </p>
          <input
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="6-stelliger Code"
            value={otp}
            disabled={busy}
            className={styles.input}
            onChange={(e) => {
              setOtp(e.target.value)
              setError('')
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void confirmCode()
            }}
          />
          <UiActionRow>
            <UiButton type="button" onClick={() => void confirmCode()} disabled={busy || !otp.trim()}>
              {busy ? 'Prüfen…' : 'Code bestätigen'}
            </UiButton>
            <UiButton
              type="button"
              variant="ghost"
              disabled={busy}
              onClick={() => {
                setStep('email')
                setOtp('')
                setError('')
                setInfo('')
              }}
            >
              Andere E-Mail
            </UiButton>
          </UiActionRow>
        </>
      )}
      {info ? <span className={styles.successMsg}>{info}</span> : null}
      {error ? <span className={styles.errorMsg}>{error}</span> : null}
    </div>
  )
}
