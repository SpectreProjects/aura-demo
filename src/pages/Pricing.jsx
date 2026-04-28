import { ArrowRight, Check, CreditCard } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import PublicPageShell from '../components/PublicPageShell'

const plans = [
  {
    id: 'aura',
    name: 'AURA',
    tagline: 'Your AI front of house assistant',
    monthly: '£29',
    yearly: '£290',
    description: 'For local businesses that want every review answered clearly.',
    trialText: '30-day free trial. No card required.',
    features: [
      'AI replies to every review',
      'Matches your brand voice',
      'Keeps your Google profile active',
      'Saves hours every week',
    ],
  },
  {
    id: 'aura_spotlight',
    name: 'AURA Spotlight',
    tagline: 'Put your team in the spotlight',
    monthly: '£59',
    yearly: '£590',
    description: 'For teams that want staff recognition and performance momentum.',
    trialText: '30-day free trial. Upgrade anytime.',
    features: [
      'Everything in AURA',
      'Detects staff mentions in reviews',
      'Recognition leaderboard',
      'Performance insights',
      'Turns feedback into motivation',
    ],
    featured: true,
  },
]

export default function Pricing() {
  const [billingCycle, setBillingCycle] = useState('monthly')

  function startCheckout(planName) {
    console.info('[Stripe test checkout placeholder]', {
      billingCycle,
      plan: planName,
      nextStep: 'Create a Netlify Function or backend endpoint that creates a Stripe Checkout Session.',
      publishableKeyConfigured: Boolean(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY),
    })
    window.alert(
      `Stripe test checkout placeholder for ${planName}. See STRIPE_SETUP.md to add a Netlify Function checkout endpoint.`,
    )
  }

  return (
    <PublicPageShell>
      <section className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <p className="mb-5 inline-flex rounded-full border border-white/10 bg-white/8 px-4 py-2 text-sm font-semibold text-violet-100">
            Pricing
          </p>
          <h1 className="text-5xl font-bold tracking-tight sm:text-6xl">
            Pick the review operating system your team needs.
          </h1>
          <p className="mt-6 text-lg leading-8 text-slate-300">
            Start with AI replies, then upgrade to Spotlight when you want recognition and team
            performance insights.
          </p>
        </div>

        <div className="mt-10 flex justify-center">
          <div className="relative flex rounded-2xl border border-white/10 bg-white/[0.055] p-1 backdrop-blur">
            <span
              className={`absolute bottom-1 top-1 w-[calc(50%-0.25rem)] rounded-xl bg-white transition-transform duration-300 ${
                billingCycle === 'yearly' ? 'translate-x-full' : 'translate-x-0'
              }`}
            />
            {['monthly', 'yearly'].map((cycle) => (
              <button
                key={cycle}
                className={`relative z-10 w-28 rounded-xl px-4 py-2 text-sm font-bold capitalize transition ${
                  billingCycle === cycle ? 'text-slate-950' : 'text-slate-300 hover:text-white'
                }`}
                type="button"
                onClick={() => setBillingCycle(cycle)}
              >
                {cycle}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-12 grid gap-5 lg:grid-cols-2">
          {plans.map((plan) => {
            const price = billingCycle === 'monthly' ? plan.monthly : plan.yearly
            const cadence = billingCycle === 'monthly' ? '/month' : '/year'

            return (
              <article
                key={plan.id}
                className={`rounded-2xl border p-6 backdrop-blur transition hover:-translate-y-1 ${
                  plan.featured
                    ? 'border-violet-300/30 bg-violet-500/15 shadow-[0_30px_120px_rgba(124,58,237,0.28)] hover:shadow-[0_36px_140px_rgba(124,58,237,0.34)]'
                    : 'border-white/10 bg-white/[0.055] hover:bg-white/[0.075]'
                }`}
              >
                {plan.featured && (
                  <p className="mb-5 w-fit rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-950">
                    Most popular
                  </p>
                )}
                <h2 className="text-3xl font-bold">{plan.name}</h2>
                <p className="mt-2 text-sm font-semibold text-violet-100">{plan.tagline}</p>
                <p className="mt-4 min-h-12 text-sm leading-6 text-slate-400">{plan.description}</p>
                <p className="mt-8 text-6xl font-bold tracking-tight">
                  {price}
                  <span className="text-base font-semibold text-slate-400">{cadence}</span>
                </p>
                {billingCycle === 'yearly' && (
                  <p className="mt-2 text-sm font-bold text-violet-200">Save 2 months</p>
                )}
                <p className="mt-3 text-sm font-semibold text-slate-300">{plan.trialText}</p>
                <div className="mt-8 space-y-3">
                  {plan.features.map((feature) => (
                    <p key={feature} className="flex items-center gap-3 text-sm font-semibold text-slate-300">
                      <Check size={17} className="text-violet-200" />
                      {feature}
                    </p>
                  ))}
                </div>
                <button
                  className={`mt-8 inline-flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-bold transition hover:-translate-y-0.5 ${
                    plan.featured
                      ? 'bg-white text-slate-950 hover:bg-slate-200'
                      : 'border border-white/10 bg-white/8 text-white hover:bg-white/12'
                  }`}
                  type="button"
                  onClick={() => startCheckout(plan.name)}
                >
                  <CreditCard size={17} />
                  Start free trial
                </button>
                <p className="mt-3 text-center text-xs font-semibold text-slate-500">
                  Cancel anytime
                </p>
              </article>
            )
          })}
        </div>

        <div className="mt-10 text-center">
          <Link to="/signup" className="inline-flex items-center gap-2 text-sm font-bold text-violet-100">
            Start your 30-day free trial
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    </PublicPageShell>
  )
}
