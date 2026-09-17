import { useEffect, useRef, useState } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import AuthEntryShell from '../components/AuthEntryShell'
import { useAuth } from '../lib/AuthContext'
import { supabase } from '../lib/supabaseClient'
import './Login.css'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const RESEND_COOLDOWN_SECONDS = 60

export default function ForgotPassword() {
  const location = useLocation()
  const { isAuthLoading, session } = useAuth()
  const emailRef = useRef(null)
  const [email, setEmail] = useState(
    typeof location.state?.email === 'string' ? location.state.email.trim() : '',
  )
  const [emailError, setEmailError] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [hasRequested, setHasRequested] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [cooldown, setCooldown] = useState(0)

  useEffect(() => {
    document.title = 'Reset your password — AURA'
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [])

  useEffect(() => {
    if (cooldown <= 0) return undefined

    const timer = window.setInterval(() => {
      setCooldown((current) => Math.max(0, current - 1))
    }, 1000)

    return () => window.clearInterval(timer)
  }, [cooldown])

  if (isAuthLoading) {
    return (
      <main aria-busy="true" className="aura-login ali-auth-loading">
        <span>Checking your account…</span>
      </main>
    )
  }

  if (session) return <Navigate to="/dashboard" replace />

  function validateEmail() {
    const normalisedEmail = email.trim()
    let nextError = ''

    if (!normalisedEmail) nextError = 'Enter your email address.'
    else if (!EMAIL_PATTERN.test(normalisedEmail)) nextError = 'Enter a valid email address.'

    setEmailError(nextError)
    if (nextError) emailRef.current?.focus()
    return !nextError
  }

  async function handleResetRequest(event) {
    event.preventDefault()
    setErrorMessage('')
    if (cooldown > 0 || !validateEmail()) return

    if (!supabase) {
      setErrorMessage('AURA password recovery is not available right now. Please try again soon.')
      return
    }

    setIsSubmitting(true)
    try {
      const redirectTo = new URL('/reset-password', window.location.origin).toString()
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo })
      if (error) throw error

      setHasRequested(true)
      setCooldown(RESEND_COOLDOWN_SECONDS)
    } catch (error) {
      console.error('[Supabase Auth] Password reset request error:', error)
      setErrorMessage('We could not send the reset email right now. Please try again in a moment.')
    } finally {
      setIsSubmitting(false)
    }
  }

  function useDifferentEmail() {
    setHasRequested(false)
    setCooldown(0)
    setErrorMessage('')
    window.requestAnimationFrame(() => emailRef.current?.focus())
  }

  const submitLabel = isSubmitting
    ? 'Sending…'
    : cooldown > 0
      ? `Send again in ${cooldown}s`
      : hasRequested
        ? 'Send reset link again'
        : 'Send reset link'

  return (
    <AuthEntryShell formId="forgot-password-form" skipLabel="Skip to password recovery">
      <form
        className="ali-form ali-form--recovery"
        id="forgot-password-form"
        noValidate
        onSubmit={handleResetRequest}
      >
        <h1 id="forgot-password-title">Forgot your password?</h1>
        <p className="ali-recovery-copy">
          Enter your email address and we’ll send you a secure link to choose a new password.
        </p>

        <div className="ali-field-group">
          <label htmlFor="forgot-password-email">Email address</label>
          <input
            aria-describedby={emailError ? 'forgot-password-email-error' : undefined}
            aria-invalid={Boolean(emailError)}
            autoCapitalize="none"
            autoComplete="email"
            id="forgot-password-email"
            onChange={(event) => {
              setEmail(event.target.value)
              setEmailError('')
              setErrorMessage('')
            }}
            placeholder="you@yourbusiness.co.uk"
            ref={emailRef}
            required
            spellCheck="false"
            type="email"
            value={email}
          />
          <span className="ali-field-message" id="forgot-password-email-error">
            {emailError}
          </span>
        </div>

        <div aria-live="polite" className="ali-alert-slot ali-alert-slot--recovery">
          {errorMessage ? <p role="alert">{errorMessage}</p> : null}
          {!errorMessage && hasRequested ? (
            <p className="ali-status-success" role="status">
              If an AURA account exists for that email, we’ve sent a password reset link. Check
              your inbox and spam folder.
            </p>
          ) : null}
        </div>

        <button className="ali-submit" disabled={isSubmitting || cooldown > 0} type="submit">
          {submitLabel}
        </button>

        {hasRequested ? (
          <button className="ali-text-action" onClick={useDifferentEmail} type="button">
            Use a different email address
          </button>
        ) : null}

        <p className="ali-create-account ali-create-account--recovery">
          Remembered it? <Link to="/login">Back to log in</Link>
        </p>
      </form>
    </AuthEntryShell>
  )
}
