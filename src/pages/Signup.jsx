import { ArrowRight, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import AuthDebugPanel from '../components/AuthDebugPanel'
import PublicPageShell from '../components/PublicPageShell'
import { supabase } from '../lib/supabaseClient'

const initialForm = {
  businessName: '',
  contactName: '',
  email: '',
  password: '',
  businessType: 'Cafe',
  locationsCount: '1',
  plan: 'Growth',
}

export default function Signup({ onAuthSession, onSignupComplete, session }) {
  const navigate = useNavigate()
  const [form, setForm] = useState(initialForm)
  const [errorMessage, setErrorMessage] = useState('')
  const [lastAuthError, setLastAuthError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (session) return <Navigate to="/app/dashboard" replace />

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  async function handleSignup(event) {
    event.preventDefault()
    setErrorMessage('')

    if (!supabase) {
      const message = 'Supabase is not configured. Add env vars and restart Vite.'
      setErrorMessage(message)
      setLastAuthError(message)
      return
    }

    setIsSubmitting(true)

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          full_name: form.contactName,
          business_name: form.businessName,
          plan: form.plan,
        },
      },
    })

    if (authError) {
      console.error('[Supabase Auth] Signup error:', authError)
      setErrorMessage(authError.message)
      setLastAuthError(authError.message)
      setIsSubmitting(false)
      return
    }

    const userId = authData.user?.id
    const activeSession = authData.session
    if (!userId || !activeSession) {
      const message = 'Please check your email to confirm your account.'
      console.info('[Supabase Auth] Signup created user without active session. Email confirmation is likely enabled.', authData)
      setErrorMessage(message)
      setLastAuthError('')
      setIsSubmitting(false)
      return
    }

    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .insert({
        name: form.businessName,
        business_type: form.businessType,
        locations_count: Number(form.locationsCount) || 1,
      })
      .select('id, name')
      .single()

    if (businessError) {
      console.error('[Supabase] Business creation error:', businessError)
      setErrorMessage(businessError.message)
      setLastAuthError(businessError.message)
      setIsSubmitting(false)
      return
    }

    const { error: profileError } = await supabase.from('profiles').insert({
      id: userId,
      business_id: business.id,
      full_name: form.contactName,
      email: form.email,
      role: 'owner',
    })

    if (profileError) {
      console.error('[Supabase] Profile creation error:', profileError)
      setErrorMessage(profileError.message)
      setLastAuthError(profileError.message)
      setIsSubmitting(false)
      return
    }

    setLastAuthError('')
    onAuthSession?.(activeSession)
    onSignupComplete?.({ businessName: business.name })
    setIsSubmitting(false)
    navigate('/app/dashboard')
  }

  return (
    <PublicPageShell>
      <section className="mx-auto grid max-w-7xl gap-10 px-5 py-12 sm:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <div>
          <p className="mb-5 inline-flex rounded-full border border-white/10 bg-white/8 px-4 py-2 text-sm font-semibold text-cyan-100">
            Start free trial
          </p>
          <h1 className="text-5xl font-bold tracking-tight sm:text-6xl">
            Create your AURA workspace.
          </h1>
          <p className="mt-6 text-lg leading-8 text-slate-300">
            Set up your business account, choose a plan, and connect billing when the Stripe test
            checkout endpoint is ready.
          </p>
        </div>

        <form className="rounded-2xl border border-white/10 bg-white/[0.055] p-6 backdrop-blur" onSubmit={handleSignup}>
          <div className="mb-6 flex items-center gap-3">
            <Sparkles className="text-cyan-200" size={22} />
            <h2 className="text-xl font-bold">Signup details</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <input className="aura-input border-white/10 bg-white/10 text-white placeholder:text-slate-500" placeholder="Business name" value={form.businessName} onChange={(event) => updateField('businessName', event.target.value)} required />
            <input className="aura-input border-white/10 bg-white/10 text-white placeholder:text-slate-500" placeholder="Contact name" value={form.contactName} onChange={(event) => updateField('contactName', event.target.value)} required />
            <input className="aura-input border-white/10 bg-white/10 text-white placeholder:text-slate-500" placeholder="Email" type="email" value={form.email} onChange={(event) => updateField('email', event.target.value)} required />
            <input className="aura-input border-white/10 bg-white/10 text-white placeholder:text-slate-500" placeholder="Password" type="password" value={form.password} onChange={(event) => updateField('password', event.target.value)} required />
            <select className="aura-input border-white/10 bg-white/10 text-white" value={form.businessType} onChange={(event) => updateField('businessType', event.target.value)}>
              <option>Cafe</option>
              <option>Restaurant</option>
              <option>Salon</option>
              <option>Hotel</option>
              <option>Trades business</option>
              <option>Local service</option>
            </select>
            <input className="aura-input border-white/10 bg-white/10 text-white placeholder:text-slate-500" min="1" placeholder="Number of locations" type="number" value={form.locationsCount} onChange={(event) => updateField('locationsCount', event.target.value)} />
            <select className="aura-input border-white/10 bg-white/10 text-white sm:col-span-2" value={form.plan} onChange={(event) => updateField('plan', event.target.value)}>
              <option>Starter</option>
              <option>Growth</option>
              <option>Multi-location</option>
            </select>
          </div>
          {errorMessage && <p className="mt-4 rounded-2xl bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-200">{errorMessage}</p>}
          <button className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-bold text-slate-950 disabled:opacity-60" disabled={isSubmitting} type="submit">
            {isSubmitting ? 'Creating account...' : 'Create account'}
            <ArrowRight size={17} />
          </button>
          <p className="mt-5 text-center text-sm text-slate-400">
            Already have an account? <Link className="font-bold text-white" to="/login">Login</Link>
          </p>
          <div className="[&_div]:border-white/10 [&_div]:bg-white/10 [&_p]:text-slate-300">
            <AuthDebugPanel lastAuthError={lastAuthError} session={session} />
          </div>
        </form>
      </section>
    </PublicPageShell>
  )
}
