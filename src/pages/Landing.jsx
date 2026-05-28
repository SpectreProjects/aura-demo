import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  Building2,
  LoaderCircle,
  Mail,
  MessageSquareText,
  Sparkles,
  Trophy,
  TrendingUp,
  UsersRound,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

const fadeUp = {
  hidden: { opacity: 0, y: 22 },
  visible: { opacity: 1, y: 0 },
}

const featureHighlights = [
  {
    icon: MessageSquareText,
    title: 'Never miss a review',
    detail: 'Every customer receives a thoughtful response automatically, keeping your business active online 24/7.',
  },
  {
    icon: UsersRound,
    title: 'Customers feel heard',
    detail: 'Replies stay consistent with your brand voice and make every interaction feel acknowledged.',
  },
  {
    icon: Trophy,
    title: 'Recognise great staff',
    detail: 'Reward employees when customers mention exceptional service.',
  },
  {
    icon: TrendingUp,
    title: 'Strengthen reputation',
    detail: 'Build trust, visibility and customer confidence through a more active online presence.',
  },
]

const initialWaitlistForm = {
  email: '',
  business_name: '',
}

function isMissingSourceColumnError(error) {
  const errorText = [error?.code, error?.message, error?.details, error?.hint].filter(Boolean).join(' ').toLowerCase()

  return (
    errorText.includes('source') &&
    (error?.code === 'PGRST204' ||
      error?.code === '42703' ||
      errorText.includes('schema cache') ||
      errorText.includes('column'))
  )
}

async function insertWaitlistSignup(payload) {
  const withSource = {
    ...payload,
    source: 'landing_page',
  }

  const result = await supabase.from('waitlist_signups').insert(withSource)

  if (result.error && isMissingSourceColumnError(result.error)) {
    return supabase.from('waitlist_signups').insert(payload)
  }

  return result
}

export default function Landing() {
  const [waitlistForm, setWaitlistForm] = useState(initialWaitlistForm)
  const [waitlistStatus, setWaitlistStatus] = useState('idle')
  const [waitlistMessage, setWaitlistMessage] = useState('')

  const isSubmittingWaitlist = waitlistStatus === 'loading'

  function handleWaitlistChange(event) {
    const { name, value } = event.target

    setWaitlistForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }))

    if (waitlistMessage) {
      setWaitlistMessage('')
      setWaitlistStatus('idle')
    }
  }

  async function handleWaitlistSubmit(event) {
    event.preventDefault()

    if (isSubmittingWaitlist) return

    const email = waitlistForm.email.trim()
    const businessName = waitlistForm.business_name.trim()

    if (!email) {
      setWaitlistStatus('error')
      setWaitlistMessage('Please enter your email to join the waitlist.')
      return
    }

    if (!supabase) {
      setWaitlistStatus('error')
      setWaitlistMessage('Waitlist signups are not available right now. Please try again soon.')
      return
    }

    setWaitlistStatus('loading')
    setWaitlistMessage('')

    const payload = {
      email,
      business_name: businessName || null,
    }

    try {
      const { error } = await insertWaitlistSignup(payload)

      if (error) throw error

      setWaitlistForm(initialWaitlistForm)
      setWaitlistStatus('success')
      setWaitlistMessage("You're on the AURA waitlist. We'll be in touch soon.")
    } catch (error) {
      console.error('[Waitlist] Signup failed:', error)
      setWaitlistStatus('error')
      setWaitlistMessage("We couldn't add you to the waitlist just now. Please try again in a moment.")
    }
  }

  return (
    <main className="relative flex min-h-screen overflow-hidden bg-[#020617] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_91%_72%,rgba(14,165,233,0.72),transparent_32%),radial-gradient(circle_at_52%_-12%,rgba(88,80,236,0.2),transparent_28%),radial-gradient(circle_at_11%_78%,rgba(67,56,202,0.26),transparent_28%),linear-gradient(135deg,#030414_0%,#050927_46%,#06185c_100%)]" />
      <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(115deg,rgba(255,255,255,0.08),transparent_28%,rgba(255,255,255,0.04)_54%,transparent_76%)] opacity-50" />
      <div className="pointer-events-none fixed inset-x-0 top-16 mx-auto h-72 max-w-5xl rounded-full bg-blue-500/20 blur-3xl" />

      <div className="relative z-10 flex min-h-screen w-full flex-col">
        <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-5 sm:px-8 lg:py-6">
          <Link aria-label="AURA home" to="/" className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-violet-500/20 text-white shadow-[0_0_42px_rgba(124,58,237,0.32)] backdrop-blur">
              <Sparkles size={18} />
            </span>
            <span className="text-lg font-black">AURA</span>
          </Link>

          <Link
            className="rounded-full border border-violet-400/60 bg-white/[0.045] px-7 py-3 text-sm font-black text-slate-100 shadow-[0_12px_40px_rgba(15,23,42,0.22)] backdrop-blur transition hover:-translate-y-0.5 hover:border-violet-300 hover:bg-white/[0.09] hover:text-white"
            to="/login"
          >
            Log in
          </Link>
        </header>

        <section className="mx-auto flex w-full max-w-7xl flex-1 flex-col items-center px-5 pb-5 pt-0 text-center sm:px-8 lg:pb-4">
          <motion.div
            animate="visible"
            className="flex w-full flex-col items-center"
            initial="hidden"
            transition={{ duration: 0.7, ease: 'easeOut' }}
            variants={fadeUp}
          >
            <h1 className="w-full max-w-6xl text-[2.45rem] font-black leading-[1.07] text-white drop-shadow-[0_14px_36px_rgba(0,0,0,0.32)] sm:text-[3.45rem] lg:text-[4.15rem] xl:text-[4.75rem]">
              <span className="block lg:whitespace-nowrap">
                Every review,{' '}
                <span className="bg-gradient-to-r from-blue-400 via-cyan-300 to-violet-500 bg-clip-text text-transparent">
                  replied.
                </span>
              </span>
              <span className="block lg:whitespace-nowrap">
                Every customer,{' '}
                <span className="bg-gradient-to-r from-blue-400 via-cyan-300 to-violet-500 bg-clip-text text-transparent">
                  heard.
                </span>
              </span>
              <span className="block lg:whitespace-nowrap">
                Great employees,{' '}
                <span className="bg-gradient-to-r from-blue-400 via-cyan-300 to-violet-500 bg-clip-text text-transparent">
                  recognised.
                </span>
              </span>
            </h1>

            <p className="mt-5 max-w-5xl text-base leading-7 text-slate-300/85 sm:text-lg sm:leading-8">
              AURA replies to every review in your brand&apos;s tone of voice, keeps your reputation active 24/7, and
              rewards staff when guests recognise exceptional service.
            </p>

            <form
              className="mt-7 w-full max-w-6xl rounded-[1.35rem] border border-white/75 bg-white/95 p-2 shadow-[0_28px_90px_rgba(7,11,43,0.42),0_0_70px_rgba(59,130,246,0.18)] backdrop-blur-2xl"
              onSubmit={handleWaitlistSubmit}
            >
              <div className="grid gap-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(390px,auto)]">
                <label className="group flex min-w-0 items-center gap-3 rounded-2xl bg-slate-50 px-5 py-4 transition focus-within:ring-4 focus-within:ring-blue-500/[0.15]">
                  <Mail className="shrink-0 text-slate-700" size={20} />
                  <span className="min-w-0 flex-1">
                    <span className="sr-only">Email</span>
                    <input
                      className="w-full bg-transparent text-base font-semibold text-slate-950 outline-none placeholder:text-slate-500"
                      disabled={isSubmittingWaitlist}
                      name="email"
                      onChange={handleWaitlistChange}
                      placeholder="Your work email"
                      required
                      type="email"
                      value={waitlistForm.email}
                    />
                  </span>
                </label>

                <label className="group flex min-w-0 items-center gap-3 rounded-2xl bg-slate-50 px-5 py-4 transition focus-within:ring-4 focus-within:ring-blue-500/[0.15]">
                  <Building2 className="shrink-0 text-slate-700" size={20} />
                  <span className="min-w-0 flex-1">
                    <span className="sr-only">Business name</span>
                    <input
                      className="w-full bg-transparent text-base font-semibold text-slate-950 outline-none placeholder:text-slate-500"
                      disabled={isSubmittingWaitlist}
                      name="business_name"
                      onChange={handleWaitlistChange}
                      placeholder="Your company name"
                      type="text"
                      value={waitlistForm.business_name}
                    />
                  </span>
                </label>

                <button
                  className="inline-flex min-h-[60px] items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-sky-500 px-6 py-4 text-sm font-black text-white shadow-[0_18px_48px_rgba(37,99,235,0.45)] transition hover:-translate-y-0.5 hover:from-blue-500 hover:to-sky-400 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0 sm:text-base lg:whitespace-nowrap"
                  disabled={isSubmittingWaitlist}
                  type="submit"
                >
                  {isSubmittingWaitlist ? (
                    <>
                      <LoaderCircle className="animate-spin" size={18} />
                      Joining
                    </>
                  ) : (
                    <>
                      Join the waitlist for a free month
                      <ArrowRight size={18} />
                    </>
                  )}
                </button>
              </div>

              {waitlistMessage && (
                <p
                  className={`mt-2 rounded-2xl border px-4 py-3 text-center text-sm font-bold ${
                    waitlistStatus === 'success'
                      ? 'border-emerald-300/40 bg-emerald-50 text-emerald-800'
                      : 'border-rose-300/60 bg-rose-50 text-rose-800'
                  }`}
                  role={waitlistStatus === 'error' ? 'alert' : 'status'}
                >
                  {waitlistMessage}
                </p>
              )}
            </form>

            <div className="mt-7 grid w-full max-w-6xl gap-3 text-left sm:grid-cols-2 lg:grid-cols-4 lg:divide-x lg:divide-white/10">
              {featureHighlights.map(({ icon: Icon, title, detail }) => (
                <div key={title} className="flex gap-4 rounded-3xl border border-white/[0.08] bg-white/[0.035] p-4 backdrop-blur lg:border-0 lg:bg-transparent lg:px-6 lg:first:pl-0 lg:last:pr-0">
                  <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-violet-300/20 bg-violet-500/[0.15] text-violet-200 shadow-[0_0_34px_rgba(124,58,237,0.18)]">
                    <Icon size={27} />
                  </span>
                  <span>
                    <span className="block text-base font-black text-white">{title}</span>
                    <span className="mt-1 block text-sm leading-6 text-slate-300">{detail}</span>
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        </section>

        <footer className="mx-auto flex w-full max-w-7xl justify-center px-5 pb-5 sm:px-8">
          <Link
            className="rounded-lg px-2 py-1 text-xs font-semibold text-slate-500 transition hover:text-slate-300 focus:outline-none focus:ring-2 focus:ring-violet-300/50"
            to="/dashboard"
          >
            Privacy Policy
          </Link>
        </footer>
      </div>
    </main>
  )
}
