import { useEffect, useRef, useState } from 'react'
import { Eye, EyeOff, ArrowLeft } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import GoogleAuthButton from '../GoogleAuthButton'
import { InteractiveHoverButton } from './interactive-hover-button'
import { BackButton } from './back-button'
import { useAuth } from '../../lib/AuthContext'
import { initialAuthCallback, supabase } from '../../lib/supabaseClient'
import {
  finishCompanySignup,
  SIGNUP_COMPANY_KEY,
  validateCompanyName,
} from '../../lib/harmonySignup'
import './auth-switch.css'

// Harmony adaptation of appvibed01's Auth Switch, using the supplied component
// source for the circular sweep and staggered motion timings.
// https://21st.dev/@appvibed01/components/auth-switch
export default function AuthSwitch() {
  const location = useLocation()
  const navigate = useNavigate()
  const isSignup = location.pathname === '/signup'
  const [entryMode] = useState(() => (isSignup ? 'signup' : 'login'))
  const [entering, setEntering] = useState(true)
  const { isAuthLoading, session } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [company, setCompany] = useState(() => {
    try {
      return sessionStorage.getItem(SIGNUP_COMPANY_KEY) || ''
    } catch {
      return ''
    }
  })
  const [signupStep, setSignupStep] = useState('company')
  const [errors, setErrors] = useState({})
  const [message, setMessage] = useState(
    initialAuthCallback.hasError
      ? 'Google sign in was not completed. Please try again.'
      : '',
  )
  const [submitting, setSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [completionError, setCompletionError] = useState('')
  const [retry, setRetry] = useState(0)
  const emailRef = useRef(null)
  const passwordRef = useRef(null)
  const companyRef = useRef(null)
  const headingRef = useRef(null)
  const previousMode = useRef(isSignup)

  useEffect(() => {
    const timer = window.setTimeout(() => setEntering(false), 1800)
    return () => window.clearTimeout(timer)
  }, [])

  useEffect(() => {
    document.title = `${isSignup ? 'Get started' : 'Log in'} | Harmony`
    window.scrollTo({ top: 0, behavior: 'instant' })
    if (previousMode.current !== isSignup)
      headingRef.current?.focus({ preventScroll: true })
    previousMode.current = isSignup
  }, [isSignup])

  const userId = session?.user?.id
  useEffect(() => {
    if (isAuthLoading || !userId) return undefined
    if (!isSignup) {
      navigate('/dashboard', { replace: true })
      return undefined
    }
    let active = true
    async function finish() {
      try {
        await finishCompanySignup(supabase.auth, session.user, sessionStorage)
        if (active) navigate('/setup/google', { replace: true })
      } catch {
        if (active)
          setCompletionError(
            'Your account is connected. We could not save your company name. Please try again.',
          )
      }
    }
    finish()
    return () => {
      active = false
    }
  }, [isAuthLoading, isSignup, userId, session, navigate, retry])

  function switchMode() {
    setEntering(false)
    setErrors({})
    setMessage('')
    setPassword('')
    setShowPassword(false)
    navigate(isSignup ? '/login' : '/signup')
  }

  async function handleLogin(event) {
    event.preventDefault()
    if (submitting) return
    setMessage('')
    const nextErrors = {}
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      nextErrors.email = 'Enter a valid email address.'
    if (!password) nextErrors.password = 'Enter your password.'
    setErrors(nextErrors)
    if (nextErrors.email) return emailRef.current?.focus()
    if (nextErrors.password) return passwordRef.current?.focus()
    if (!supabase)
      return setMessage(
        'Sign in is not available right now. Please try again soon.',
      )
    setSubmitting(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })
      if (error) throw error
      navigate('/dashboard')
    } catch {
      setMessage(
        'We could not sign you in. Check your email and password, then try again.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  function handleCompany(event) {
    event.preventDefault()
    const error = validateCompanyName(company)
    setErrors({ company: error })
    if (error) return companyRef.current?.focus()
    try {
      sessionStorage.setItem(SIGNUP_COMPANY_KEY, company.trim())
      setSignupStep('account')
      setMessage('')
      requestAnimationFrame(() =>
        headingRef.current?.focus({ preventScroll: true }),
      )
    } catch {
      setMessage(
        'Allow browser storage to keep your company name during sign in, then try again.',
      )
    }
  }

  const checking = isAuthLoading || Boolean(session)
  const title = isSignup
    ? signupStep === 'company'
      ? 'Get started'
      : `Hi ${company.trim()},`
    : 'Log in'
  return (
    <main
      className={`harmony-auth${isSignup ? ' is-signup' : ''}`}
      data-entry-mode={entryMode}
      data-entering={entering}
      onFocusCapture={() => setEntering(false)}
    >
      <a className="ha-skip" href="#harmony-auth-form">
        Skip to form
      </a>
      <BackButton className="ha-home-back" />
      <section className="ha-card" aria-label="Harmony account">
        <div className="ha-curve" aria-hidden="true" />
        {['login', 'signup'].map((mode) => {
          const signupPanel = mode === 'signup'
          const active = signupPanel === isSignup
          return (
            <aside
              key={mode}
              className={`ha-welcome ha-welcome-${mode}`}
              aria-hidden={!active}
              inert={!active}
            >
              <div className="ha-welcome-motion">
                <Link to="/" className="ha-wordmark" aria-label="Harmony home">
                  Harmony
                </Link>
                <div className="ha-welcome-copy">
                  <h2>{signupPanel ? 'Welcome back.' : 'New to Harmony?'}</h2>
                  <p>
                    {signupPanel
                      ? 'Your business. Your people. All in Harmony.'
                      : 'A little more Harmony for your business.'}
                  </p>
                  <InteractiveHoverButton
                    className="ha-switch"
                    onClick={switchMode}
                    disabled={submitting || checking}
                  >
                    {signupPanel ? 'Log in' : 'Sign up'}
                  </InteractiveHoverButton>
                </div>
              </div>
            </aside>
          )
        })}
        <div className="ha-form-panel" id="harmony-auth-form">
          {checking ? (
            <div className="ha-checking" aria-busy={!completionError}>
              <h1 ref={headingRef} tabIndex={-1}>
                {isSignup ? 'Getting you started' : 'Welcome back'}
              </h1>
              {completionError ? (
                <>
                  <p role="alert">{completionError}</p>
                  <InteractiveHoverButton
                    className="ha-submit"
                    onClick={() => {
                      setCompletionError('')
                      setRetry((value) => value + 1)
                    }}
                  >
                    Try again
                  </InteractiveHoverButton>
                </>
              ) : (
                <p role="status">
                  {isAuthLoading
                    ? 'Checking your account…'
                    : 'Opening your workspace…'}
                </p>
              )}
            </div>
          ) : (
            <div className="ha-form-content" key={`${isSignup}-${signupStep}`}>
              <h1 ref={headingRef} tabIndex={-1}>
                {title}
              </h1>
              {!isSignup ? (
                <form
                  noValidate
                  onSubmit={handleLogin}
                  aria-label="Log in to Harmony"
                >
                  <div className="ha-field">
                    <label htmlFor="ha-email">Email address</label>
                    <input
                      id="ha-email"
                      type="email"
                      value={email}
                      ref={emailRef}
                      autoComplete="email"
                      autoCapitalize="none"
                      spellCheck="false"
                      required
                      aria-invalid={Boolean(errors.email)}
                      aria-describedby={
                        errors.email ? 'ha-email-error' : undefined
                      }
                      onChange={(event) => {
                        setEmail(event.target.value)
                        setErrors((value) => ({ ...value, email: '' }))
                        setMessage('')
                      }}
                    />
                    <span className="ha-field-error" id="ha-email-error">
                      {errors.email}
                    </span>
                  </div>
                  <div className="ha-field">
                    <label htmlFor="ha-password">Password</label>
                    <div className="ha-password">
                      <input
                        id="ha-password"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        ref={passwordRef}
                        autoComplete="current-password"
                        required
                        aria-invalid={Boolean(errors.password)}
                        aria-describedby={
                          errors.password ? 'ha-password-error' : undefined
                        }
                        onChange={(event) => {
                          setPassword(event.target.value)
                          setErrors((value) => ({ ...value, password: '' }))
                          setMessage('')
                        }}
                      />
                      <button
                        type="button"
                        aria-label={
                          showPassword ? 'Hide password' : 'Show password'
                        }
                        aria-pressed={showPassword}
                        onClick={() => setShowPassword((value) => !value)}
                      >
                        {showPassword ? (
                          <EyeOff size={18} aria-hidden="true" />
                        ) : (
                          <Eye size={18} aria-hidden="true" />
                        )}
                      </button>
                    </div>
                    <span className="ha-field-error" id="ha-password-error">
                      {errors.password}
                    </span>
                  </div>
                  <Link
                    className="ha-forgot ha-text-link"
                    to="/forgot-password"
                    state={{ email }}
                  >
                    Forgot password?
                  </Link>
                  <div className="ha-message" aria-live="polite">
                    {message ? (
                      <p role="alert">{message}</p>
                    ) : location.state?.notice === 'password-updated' ? (
                      <p role="status">
                        Password updated. Log in with your new password.
                      </p>
                    ) : null}
                  </div>
                  <InteractiveHoverButton
                    className="ha-submit"
                    type="submit"
                    busy={submitting}
                    disabled={submitting}
                  >
                    {submitting ? 'Logging in…' : 'Log in'}
                  </InteractiveHoverButton>
                  <div className="ha-divider">
                    <span>or</span>
                  </div>
                  <GoogleAuthButton
                    variant="harmony"
                    className="ha-google"
                    onError={setMessage}
                  />
                  <p className="ha-consent ha-login-consent">
                    By logging in, you agree to Harmony’s{' '}
                    <Link to="/terms">Terms</Link> and acknowledge the{' '}
                    <Link to="/privacy">Privacy Policy</Link>.
                  </p>
                </form>
              ) : signupStep === 'company' ? (
                <form
                  noValidate
                  onSubmit={handleCompany}
                  aria-label="Your company"
                >
                  <p className="ha-intro">First, what’s your company called?</p>
                  <div className="ha-field">
                    <label htmlFor="ha-company">Company name</label>
                    <input
                      id="ha-company"
                      autoComplete="organization"
                      maxLength={160}
                      required
                      value={company}
                      ref={companyRef}
                      aria-invalid={Boolean(errors.company)}
                      aria-describedby={
                        errors.company ? 'ha-company-error' : undefined
                      }
                      onChange={(event) => {
                        setCompany(event.target.value)
                        setErrors({})
                        setMessage('')
                      }}
                    />
                    <span className="ha-field-error" id="ha-company-error">
                      {errors.company}
                    </span>
                  </div>
                  <div className="ha-message" aria-live="polite">
                    {message && <p role="alert">{message}</p>}
                  </div>
                  <InteractiveHoverButton className="ha-submit" type="submit">
                    Next
                  </InteractiveHoverButton>
                </form>
              ) : (
                <div>
                  <p className="ha-intro">
                    Let’s create your account.
                  </p>
                  <GoogleAuthButton
                    variant="harmony"
                    className="ha-google"
                    onError={setMessage}
                    redirectPath="/signup"
                    onBeforeAuth={() =>
                      sessionStorage.setItem(SIGNUP_COMPANY_KEY, company.trim())
                    }
                  />
                  <div className="ha-message" aria-live="polite">
                    {message && <p role="alert">{message}</p>}
                  </div>
                  <p className="ha-consent">
                    By continuing, you agree to Harmony’s{' '}
                    <Link to="/terms">Terms</Link> and acknowledge the{' '}
                    <Link to="/privacy">Privacy Policy</Link>.
                  </p>
                  <button
                    className="ha-back ha-text-link"
                    type="button"
                    onClick={() => {
                      setSignupStep('company')
                      setMessage('')
                      requestAnimationFrame(() => companyRef.current?.focus())
                    }}
                  >
                    <ArrowLeft size={16} aria-hidden="true" />
                    Back
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </main>
  )
}
