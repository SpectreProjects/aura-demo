import { ArrowRight, Eye, EyeOff } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import GoogleAuthButton from '../components/GoogleAuthButton'
import { useAuth } from '../lib/AuthContext'
import { supabase } from '../lib/supabaseClient'
import './Login.css'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function Login() {
  const navigate = useNavigate()
  const { isAuthLoading, session } = useAuth()
  const emailRef = useRef(null)
  const passwordRef = useRef(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})
  const [errorMessage, setErrorMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    document.title = 'Log in — AURA'
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [])

  if (isAuthLoading) {
    return (
      <main aria-busy="true" className="aura-login ali-auth-loading">
        <span>Checking your account…</span>
      </main>
    )
  }

  if (session) return <Navigate to="/dashboard" replace />

  function validateFields() {
    const errors = {}
    const normalisedEmail = email.trim()

    if (!normalisedEmail) errors.email = 'Enter your email address.'
    else if (!EMAIL_PATTERN.test(normalisedEmail)) errors.email = 'Enter a valid email address.'
    if (!password) errors.password = 'Enter your password.'

    setFieldErrors(errors)
    if (errors.email) emailRef.current?.focus()
    else if (errors.password) passwordRef.current?.focus()
    return Object.keys(errors).length === 0
  }

  async function handleLogin(event) {
    event.preventDefault()
    setErrorMessage('')
    if (!validateFields()) return

    if (!supabase) {
      setErrorMessage('AURA sign in is not available right now. Please try again soon.')
      return
    }

    setIsSubmitting(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })
      if (error) throw error
      navigate('/dashboard')
    } catch (error) {
      console.error('[Supabase Auth] Login error:', error)
      setErrorMessage('We could not sign you in. Please check your email and password.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="aura-login">
      <a className="ali-skip" href="#login-form">Skip to log in</a>

      <section className="ali-scene" aria-label="AURA welcome">
        <picture aria-hidden="true" className="ali-scene-media">
          <source media="(max-width: 700px)" srcSet="/landing/coffee-640.webp" />
          <img alt="" height="1280" src="/landing/coffee-1920.webp" width="1920" />
        </picture>
        <div className="ali-scene-shade" />
        <Link aria-label="AURA home" className="ali-wordmark ali-wordmark-light" to="/">
          AURA
        </Link>
        <div className="ali-scene-copy" aria-hidden="true">
          <p>THOUGHTFUL REPLIES. A MORE PERSONAL PRESENCE.</p>
          <span>WELCOME<br />BACK.</span>
        </div>
        <p className="ali-scene-caption">FOR THE PEOPLE BEHIND THE BUSINESS</p>
      </section>

      <section className="ali-auth-panel" aria-labelledby="login-title">
        <Link aria-label="AURA home" className="ali-wordmark ali-wordmark-dark" to="/">
          AURA
        </Link>

        <form className="ali-form" id="login-form" noValidate onSubmit={handleLogin}>
          <div className="ali-meta" aria-hidden="true">
            <span>Your Aura workspace</span>
            <span>Secure sign in</span>
          </div>

          <p className="ali-kicker">Good to see you again</p>
          <h1 id="login-title">Welcome back.</h1>
          <p className="ali-intro">Log in to look after your reviews, your way.</p>

          <div className="ali-google-action">
            <GoogleAuthButton label="Continue with Google" onError={setErrorMessage} />
          </div>

          <div className="ali-divider" aria-hidden="true">
            <span />
            <em>or use your email</em>
            <span />
          </div>

          <div className="ali-fields">
            <div className="ali-field-group">
              <label htmlFor="login-email">Email address</label>
              <input
                aria-describedby={fieldErrors.email ? 'login-email-error' : undefined}
                aria-invalid={Boolean(fieldErrors.email)}
                autoCapitalize="none"
                autoComplete="email"
                id="login-email"
                onChange={(event) => {
                  setEmail(event.target.value)
                  setFieldErrors((current) => ({ ...current, email: '' }))
                  setErrorMessage('')
                }}
                placeholder="you@yourbusiness.co.uk"
                ref={emailRef}
                required
                spellCheck="false"
                type="email"
                value={email}
              />
              <span className="ali-field-message" id="login-email-error">
                {fieldErrors.email || ''}
              </span>
            </div>

            <div className="ali-field-group">
              <label htmlFor="login-password">Password</label>
              <div className="ali-password-field">
                <input
                  aria-describedby={fieldErrors.password ? 'login-password-error' : undefined}
                  aria-invalid={Boolean(fieldErrors.password)}
                  autoComplete="current-password"
                  id="login-password"
                  onChange={(event) => {
                    setPassword(event.target.value)
                    setFieldErrors((current) => ({ ...current, password: '' }))
                    setErrorMessage('')
                  }}
                  placeholder="Your password"
                  ref={passwordRef}
                  required
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                />
                <button
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  aria-pressed={showPassword}
                  onClick={() => setShowPassword((current) => !current)}
                  type="button"
                >
                  {showPassword ? <EyeOff aria-hidden="true" size={19} /> : <Eye aria-hidden="true" size={19} />}
                </button>
              </div>
              <span className="ali-field-message" id="login-password-error">
                {fieldErrors.password || ''}
              </span>
            </div>
          </div>

          <div aria-live="polite" className="ali-alert-slot">
            {errorMessage ? <p role="alert">{errorMessage}</p> : null}
          </div>

          <button className="ali-submit" disabled={isSubmitting} type="submit">
            <span>{isSubmitting ? 'Logging in…' : 'Log in'}</span>
            <ArrowRight aria-hidden="true" size={18} />
          </button>

          <p className="ali-create-account">
            New to Aura? <Link to="/signup">Create an account</Link>
          </p>
        </form>

        <p className="ali-legal">
          By logging in, you agree to Aura’s <Link to="/terms">Terms</Link> and acknowledge the{' '}
          <Link to="/privacy">Privacy Policy</Link>.
        </p>
      </section>
    </main>
  )
}
