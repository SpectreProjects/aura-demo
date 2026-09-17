import { useEffect, useRef, useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import AuthEntryShell from '../components/AuthEntryShell'
import { useAuth } from '../lib/AuthContext'
import { supabase } from '../lib/supabaseClient'
import './Login.css'

const MINIMUM_PASSWORD_LENGTH = 8

function PasswordToggle({ isVisible, label, onToggle }) {
  return (
    <button
      aria-label={isVisible ? `Hide ${label}` : `Show ${label}`}
      aria-pressed={isVisible}
      className="ali-password-toggle"
      onClick={onToggle}
      type="button"
    >
      {isVisible ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
    </button>
  )
}

export default function ResetPassword() {
  const navigate = useNavigate()
  const {
    isAuthLoading,
    passwordRecoveryErrorCode,
    passwordRecoveryStatus,
    session,
  } = useAuth()
  const passwordRef = useRef(null)
  const confirmPasswordRef = useRef(null)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [errorMessage, setErrorMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  useEffect(() => {
    document.title = 'Choose a new password — AURA'
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [])

  useEffect(() => {
    if (passwordRecoveryStatus !== 'active' || !session) return
    window.requestAnimationFrame(() => passwordRef.current?.focus({ preventScroll: true }))
  }, [passwordRecoveryStatus, session])

  if (isAuthLoading || passwordRecoveryStatus === 'checking') {
    return (
      <main aria-busy="true" className="aura-login ali-auth-loading">
        <span>Checking your reset link…</span>
      </main>
    )
  }

  const hasValidRecoverySession = passwordRecoveryStatus === 'active' && Boolean(session)

  function validateFields() {
    const errors = {}

    if (!password) errors.password = 'Enter a new password.'
    else if (password.length < MINIMUM_PASSWORD_LENGTH) {
      errors.password = `Use at least ${MINIMUM_PASSWORD_LENGTH} characters.`
    }

    if (!confirmPassword) errors.confirmPassword = 'Confirm your new password.'
    else if (password !== confirmPassword) errors.confirmPassword = 'The passwords do not match.'

    setFieldErrors(errors)
    if (errors.password) passwordRef.current?.focus()
    else if (errors.confirmPassword) confirmPasswordRef.current?.focus()
    return Object.keys(errors).length === 0
  }

  async function handlePasswordUpdate(event) {
    event.preventDefault()
    setErrorMessage('')
    if (!validateFields()) return

    if (!supabase || !hasValidRecoverySession) {
      setErrorMessage('This reset link is no longer valid. Request a new one to continue.')
      return
    }

    setIsSubmitting(true)
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password })
      if (updateError) throw updateError

      const { error: signOutError } = await supabase.auth.signOut({ scope: 'global' })
      if (signOutError) {
        console.error('[Supabase Auth] Global sign out after password reset failed:', signOutError)
        const { error: localSignOutError } = await supabase.auth.signOut({ scope: 'local' })
        if (localSignOutError) throw localSignOutError
      }

      navigate('/login', { replace: true, state: { notice: 'password-updated' } })
    } catch (error) {
      console.error('[Supabase Auth] Password update error:', error)
      setErrorMessage(
        error?.message?.toLowerCase().includes('different')
          ? 'Choose a password you have not used before.'
          : 'We could not update your password. Please request a new reset link and try again.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!hasValidRecoverySession) {
    const expired = passwordRecoveryErrorCode === 'otp_expired'

    return (
      <AuthEntryShell formId="reset-password-status" skipLabel="Skip to reset link status">
        <div
          aria-labelledby="reset-password-title"
          className="ali-form ali-form--recovery ali-recovery-state"
          id="reset-password-status"
        >
          <h1 id="reset-password-title">
            {expired ? 'That reset link has expired.' : 'That reset link isn’t valid.'}
          </h1>
          <p className="ali-recovery-copy">
            Password reset links can only be used once and expire for your security. Request a
            fresh link to continue.
          </p>
          <Link className="ali-submit ali-submit-link" to="/forgot-password">
            Request a new link
          </Link>
          <p className="ali-create-account ali-create-account--recovery">
            <Link to="/login">Back to log in</Link>
          </p>
        </div>
      </AuthEntryShell>
    )
  }

  return (
    <AuthEntryShell formId="reset-password-form" skipLabel="Skip to choose a new password">
      <form
        className="ali-form ali-form--recovery"
        id="reset-password-form"
        noValidate
        onSubmit={handlePasswordUpdate}
      >
        <h1 id="reset-password-title">Choose a new password</h1>
        <p className="ali-recovery-copy">
          Make it something memorable and different from passwords you use elsewhere.
        </p>

        <div className="ali-fields">
          <div className="ali-field-group">
            <label htmlFor="reset-password">New password</label>
            <div className="ali-password-control">
              <input
                aria-describedby="reset-password-hint reset-password-error"
                aria-invalid={Boolean(fieldErrors.password)}
                autoComplete="new-password"
                id="reset-password"
                onChange={(event) => {
                  setPassword(event.target.value)
                  setFieldErrors((current) => ({ ...current, password: '' }))
                  setErrorMessage('')
                }}
                ref={passwordRef}
                required
                type={showPassword ? 'text' : 'password'}
                value={password}
              />
              <PasswordToggle
                isVisible={showPassword}
                label="new password"
                onToggle={() => setShowPassword((current) => !current)}
              />
            </div>
            <p className="ali-field-hint" id="reset-password-hint">
              Use at least {MINIMUM_PASSWORD_LENGTH} characters.
            </p>
            <span className="ali-field-message" id="reset-password-error">
              {fieldErrors.password || ''}
            </span>
          </div>

          <div className="ali-field-group">
            <label htmlFor="reset-password-confirmation">Confirm new password</label>
            <div className="ali-password-control">
              <input
                aria-describedby={
                  fieldErrors.confirmPassword ? 'reset-password-confirmation-error' : undefined
                }
                aria-invalid={Boolean(fieldErrors.confirmPassword)}
                autoComplete="new-password"
                id="reset-password-confirmation"
                onChange={(event) => {
                  setConfirmPassword(event.target.value)
                  setFieldErrors((current) => ({ ...current, confirmPassword: '' }))
                  setErrorMessage('')
                }}
                ref={confirmPasswordRef}
                required
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
              />
              <PasswordToggle
                isVisible={showConfirmPassword}
                label="password confirmation"
                onToggle={() => setShowConfirmPassword((current) => !current)}
              />
            </div>
            <span className="ali-field-message" id="reset-password-confirmation-error">
              {fieldErrors.confirmPassword || ''}
            </span>
          </div>
        </div>

        <div aria-live="polite" className="ali-alert-slot ali-alert-slot--recovery">
          {errorMessage ? <p role="alert">{errorMessage}</p> : null}
        </div>

        <button className="ali-submit" disabled={isSubmitting} type="submit">
          {isSubmitting ? 'Updating password…' : 'Update password'}
        </button>
      </form>
    </AuthEntryShell>
  )
}
