import { ArrowRight, LockKeyhole, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import AuthDebugPanel from '../components/AuthDebugPanel'
import { supabase } from '../lib/supabaseClient'

export default function Login({ businessName, onAuthSession, session }) {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [lastAuthError, setLastAuthError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (session) return <Navigate to="/app/dashboard" replace />

  async function handleLogin(event) {
    event.preventDefault()
    setErrorMessage('')

    if (!supabase) {
      const message = 'Supabase is not configured. Add env vars and restart Vite.'
      setErrorMessage(message)
      setLastAuthError(message)
      return
    }

    setIsSubmitting(true)
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      console.error('[Supabase Auth] Login error:', error)
      setErrorMessage(error.message)
      setLastAuthError(error.message)
      setIsSubmitting(false)
      return
    }

    setLastAuthError('')
    if (data.session) onAuthSession?.(data.session)
    setIsSubmitting(false)
    navigate('/app/dashboard')
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,#e0f2fe,#f7f8fb_45%)] px-5 py-10">
      <section className="w-full max-w-md">
        <Link to="/" className="mb-8 flex items-center justify-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-soft">
            <Sparkles size={20} />
          </span>
          <span className="text-xl font-bold tracking-tight text-slate-950">AURA</span>
        </Link>

        <form className="aura-card p-6 sm:p-8" onSubmit={handleLogin}>
          <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
            <LockKeyhole size={22} />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-950">Welcome back</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Sign in to access {businessName || 'your AURA workspace'}.
          </p>

          <div className="mt-6 space-y-4">
            <input
              className="aura-input"
              placeholder="Email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
            <input
              className="aura-input"
              placeholder="Password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </div>

          {errorMessage && (
            <p className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
              {errorMessage}
            </p>
          )}

          <button className="aura-button mt-6 w-full disabled:opacity-60" disabled={isSubmitting} type="submit">
            {isSubmitting ? 'Signing in...' : 'Enter workspace'}
            <ArrowRight size={18} />
          </button>
          <p className="mt-5 text-center text-sm text-slate-500">
            New to AURA? <Link className="font-bold text-slate-950" to="/signup">Start free trial</Link>
          </p>
          <AuthDebugPanel lastAuthError={lastAuthError} session={session} />
        </form>
      </section>
    </main>
  )
}
