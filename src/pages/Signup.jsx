import { ArrowRight, Sparkles, UserPlus } from 'lucide-react'
import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import { supabase } from '../lib/supabaseClient'

const initialForm = {
  businessName: '',
  email: '',
  password: '',
}

export default function Signup() {
  const navigate = useNavigate()
  const { session } = useAuth()
  const [form, setForm] = useState(initialForm)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (session) return <Navigate to="/dashboard" replace />

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
    setErrorMessage('')
    setSuccessMessage('')
  }

  async function handleSignup(event) {
    event.preventDefault()
    setErrorMessage('')
    setSuccessMessage('')

    const businessName = form.businessName.trim()
    const email = form.email.trim()

    if (!supabase) {
      setErrorMessage('AURA signup is not available right now. Please try again soon.')
      return
    }

    setIsSubmitting(true)

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password: form.password,
      options: {
        data: {
          business_name: businessName,
        },
      },
    })

    if (authError) {
      console.error('[Supabase Auth] Signup error:', authError)
      setErrorMessage(authError.message || 'We could not create your account. Please try again.')
      setIsSubmitting(false)
      return
    }

    if (authData.session && authData.user) {
      const { error: profileError } = await supabase.from('business_profiles').upsert(
        {
          business_name: businessName,
          user_id: authData.user.id,
        },
        { onConflict: 'user_id' },
      )

      if (profileError) {
        console.error('[Supabase] Business profile creation error:', profileError)
        setErrorMessage('Your account was created, but we could not create the business profile yet.')
        setIsSubmitting(false)
        return
      }

      setIsSubmitting(false)
      navigate('/dashboard')
      return
    }

    setIsSubmitting(false)
    setSuccessMessage('Account created. Please check your email to confirm your account, then log in.')
    setForm(initialForm)
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#020617] px-5 py-10 text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_50%_-10%,rgba(88,80,236,0.24),transparent_28%),radial-gradient(circle_at_90%_72%,rgba(14,165,233,0.5),transparent_34%),linear-gradient(135deg,#030414_0%,#050927_50%,#06185c_100%)]" />
      <section className="relative z-10 w-full max-w-lg">
        <Link to="/" className="mb-8 flex items-center justify-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-violet-500/20 text-white shadow-[0_0_42px_rgba(124,58,237,0.32)] backdrop-blur">
            <Sparkles size={20} />
          </span>
          <span className="text-xl font-black">AURA</span>
        </Link>

        <form
          className="rounded-[2rem] border border-white/10 bg-white/[0.07] p-6 shadow-[0_30px_120px_rgba(0,0,0,0.34)] backdrop-blur-2xl sm:p-8"
          onSubmit={handleSignup}
        >
          <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-slate-950">
            <UserPlus size={22} />
          </div>
          <h1 className="text-3xl font-black tracking-tight text-white">Create your account</h1>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Start a private AURA workspace for your company.
          </p>

          <div className="mt-6 space-y-4">
            <input
              className="aura-field"
              onChange={(event) => updateField('businessName', event.target.value)}
              placeholder="Business or company name"
              required
              value={form.businessName}
            />
            <input
              className="aura-field"
              onChange={(event) => updateField('email', event.target.value)}
              placeholder="Email"
              required
              type="email"
              value={form.email}
            />
            <input
              className="aura-field"
              minLength={6}
              onChange={(event) => updateField('password', event.target.value)}
              placeholder="Password"
              required
              type="password"
              value={form.password}
            />
          </div>

          {errorMessage && (
            <p className="mt-4 rounded-2xl border border-rose-300/20 bg-rose-400/10 px-4 py-3 text-sm font-semibold text-rose-100">
              {errorMessage}
            </p>
          )}

          {successMessage && (
            <p className="mt-4 rounded-2xl border border-emerald-300/20 bg-emerald-400/10 px-4 py-3 text-sm font-semibold text-emerald-100">
              {successMessage}
            </p>
          )}

          <button
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-5 py-4 text-sm font-black text-slate-950 transition hover:-translate-y-0.5 hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? 'Creating account...' : 'Create account'}
            <ArrowRight size={18} />
          </button>

          <p className="mt-5 text-center text-sm text-slate-400">
            Already have an account?{' '}
            <Link className="font-bold text-white transition hover:text-cyan-100" to="/login">
              Log in
            </Link>
          </p>
        </form>
      </section>
    </main>
  )
}
