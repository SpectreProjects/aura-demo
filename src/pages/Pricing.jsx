import { ArrowRight, Check, CreditCard } from 'lucide-react'
import { Link } from 'react-router-dom'
import PublicPageShell from '../components/PublicPageShell'

const plans = [
  {
    name: 'Starter',
    price: '£29',
    description: 'For one local team getting review replies organised.',
    features: ['Review inbox', 'Reply approvals', 'Basic recognition', 'Reward catalogue'],
  },
  {
    name: 'Growth',
    price: '£59',
    description: 'For busy teams that want recognition and rewards working together.',
    features: ['Everything in Starter', 'Staff leaderboard', 'Reward CRUD', 'Dashboard analytics'],
    featured: true,
  },
  {
    name: 'Multi-location',
    price: '£99',
    description: 'For operators managing multiple branches or service areas.',
    features: ['Everything in Growth', 'Location-ready structure', 'Manager reporting', 'Priority setup'],
  },
]

export default function Pricing() {
  function startCheckout(planName) {
    console.info('[Stripe test checkout placeholder]', {
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
      <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <p className="mb-5 inline-flex rounded-full border border-white/10 bg-white/8 px-4 py-2 text-sm font-semibold text-cyan-100">
            Pricing
          </p>
          <h1 className="text-5xl font-bold tracking-tight sm:text-6xl">
            Simple plans for local teams.
          </h1>
          <p className="mt-6 text-lg leading-8 text-slate-300">
            Start with the essentials, then grow into recognition and rewards as your review volume
            increases.
          </p>
        </div>

        <div className="mt-14 grid gap-4 lg:grid-cols-3">
          {plans.map((plan) => (
            <article
              key={plan.name}
              className={`rounded-2xl border p-6 backdrop-blur ${
                plan.featured
                  ? 'border-cyan-300/30 bg-cyan-300/10 shadow-[0_30px_120px_rgba(8,145,178,0.14)]'
                  : 'border-white/10 bg-white/[0.055]'
              }`}
            >
              <h2 className="text-2xl font-bold">{plan.name}</h2>
              <p className="mt-3 text-sm leading-6 text-slate-400">{plan.description}</p>
              <p className="mt-8 text-5xl font-bold tracking-tight">
                {plan.price}
                <span className="text-base font-semibold text-slate-400">/month</span>
              </p>
              <div className="mt-8 space-y-3">
                {plan.features.map((feature) => (
                  <p key={feature} className="flex items-center gap-3 text-sm font-semibold text-slate-300">
                    <Check size={17} className="text-cyan-200" />
                    {feature}
                  </p>
                ))}
              </div>
              <button
                className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-bold text-slate-950 transition hover:-translate-y-0.5"
                type="button"
                onClick={() => startCheckout(plan.name)}
              >
                <CreditCard size={17} />
                Test checkout
              </button>
            </article>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Link to="/signup" className="inline-flex items-center gap-2 text-sm font-bold text-cyan-100">
            Start with a free trial
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    </PublicPageShell>
  )
}
