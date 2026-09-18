import { useEffect, useState } from 'react'
import { useReducedMotion } from 'framer-motion'
import { Link, Navigate } from 'react-router-dom'
import GoogleAuthButton from '../components/GoogleAuthButton'
import { useAuth } from '../lib/AuthContext'
import './Signup.css'

const heading = 'Let’s set up Aura.'

function TypewriterHeading() {
  const reducedMotion = useReducedMotion()
  const [visibleCharacters, setVisibleCharacters] = useState(0)

  useEffect(() => {
    if (reducedMotion) return undefined

    let timer
    const revealNextCharacter = () => {
      setVisibleCharacters((current) => {
        const next = Math.min(current + 1, heading.length)
        if (next < heading.length) {
          timer = window.setTimeout(revealNextCharacter, 28)
        }
        return next
      })
    }

    timer = window.setTimeout(revealNextCharacter, 180)
    return () => window.clearTimeout(timer)
  }, [reducedMotion])

  const characterCount = reducedMotion ? heading.length : visibleCharacters

  return (
    <h1 id="signup-title" tabIndex={-1}>
      <span className="as-sr-only">{heading}</span>
      <span aria-hidden="true">
        {heading.slice(0, characterCount)}
        <span className="as-type-caret" />
      </span>
    </h1>
  )
}

export default function Signup() {
  const { isAuthLoading, session } = useAuth()
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    document.title = 'Create your account — AURA'
    window.scrollTo({ top: 0, behavior: 'auto' })
    window.requestAnimationFrame(() => {
      document.getElementById('signup-title')?.focus({ preventScroll: true })
    })
  }, [])

  if (isAuthLoading) {
    return (
      <main aria-busy="true" className="aura-signup as-auth-loading">
        <p>Checking your account…</p>
      </main>
    )
  }

  if (session) {
    return <Navigate state={{ notice: 'already-signed-in' }} to="/dashboard" replace />
  }

  return (
    <main className="aura-signup">
      <a className="as-skip" href="#signup-card">
        Skip to sign in
      </a>

      <header className="as-header">
        <Link aria-label="AURA home" className="as-wordmark" to="/">
          AURA
        </Link>
      </header>

      <section aria-labelledby="signup-title" className="as-card" id="signup-card">
        <picture aria-hidden="true" className="as-orb">
          <source
            media="(prefers-reduced-motion: reduce)"
            srcSet="/onboarding/aura-bubble-static.png"
          />
          <img alt="" height="500" src="/onboarding/aura-bubble.gif" width="500" />
        </picture>

        <div className="as-meta" aria-hidden="true">
          <span>Your Aura workspace</span>
          <span>Secure sign in</span>
        </div>

        <div className="as-intro">
          <p className="as-kicker">A quick introduction</p>
          <TypewriterHeading />
          <p className="as-prompt">
            First, sign in with the Google account you’d like to use for Aura.
          </p>
        </div>

        <div className="as-google-action">
          <GoogleAuthButton label="Continue with Google" onError={setErrorMessage} />
        </div>

        <div aria-live="polite" className="as-message-slot">
          {errorMessage ? (
            <p className="as-alert" role="alert">
              {errorMessage}
            </p>
          ) : null}
        </div>

        <p className="as-consent">
          By continuing, you agree to Aura’s <Link to="/terms">Terms</Link> and acknowledge the{' '}
          <Link to="/privacy">Privacy Policy</Link>.
        </p>

        <p className="as-account-link">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </section>

      <p className="as-footer-note">Thoughtful replies. A more personal presence.</p>
    </main>
  )
}
