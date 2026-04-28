import { motion } from 'framer-motion'
import { useState } from 'react'
import {
  ArrowRight,
  Award,
  Bot,
  Check,
  ChevronDown,
  Gift,
  MessageSquareReply,
  Sparkles,
  Trophy,
  Users,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import PublicNav from '../components/PublicNav'

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0 },
}

const features = [
  {
    title: 'Automatic review replies',
    copy: 'Turn new customer reviews into clear response drafts managers can trust.',
    icon: MessageSquareReply,
  },
  {
    title: 'Brand voice matching',
    copy: 'Keep replies warm, consistent and suited to the way your business sounds.',
    icon: Bot,
  },
  {
    title: 'Staff recognition',
    copy: 'Find staff names inside reviews and make customer praise visible.',
    icon: Award,
  },
  {
    title: 'Internal rewards',
    copy: 'Convert positive feedback into points, perks and team momentum.',
    icon: Gift,
  },
]

const plans = [
  {
    id: 'aura',
    name: 'AURA',
    tagline: 'Your AI front of house assistant',
    monthly: '£29',
    yearly: '£290',
    description: 'For local businesses that want every review answered clearly.',
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
    features: [
      'Everything in AURA',
      'Detects staff mentions in reviews',
      'Recognition leaderboard',
      'Performance insights',
      'Turns feedback into motivation',
    ],
    highlighted: true,
  },
]

const faqs = [
  [
    'Does AURA use AI?',
    'Yes. AURA is designed as an AI-powered review operations platform, with manager controls for review and approval.',
  ],
  [
    'Can I approve replies before they go live?',
    'Yes. Teams can edit replies, approve them and mark them as posted from the review workspace.',
  ],
  [
    'Does it work for small businesses?',
    'Yes. AURA is built for local teams such as cafés, restaurants, salons, hotels and service businesses.',
  ],
  [
    'Can staff rewards be customised?',
    'Yes. Rewards can be created and managed around the point thresholds that work for your team.',
  ],
]

function Section({ children, className = '', id }) {
  return (
    <motion.section
      id={id}
      variants={fadeUp}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.18 }}
      transition={{ duration: 0.65, ease: 'easeOut' }}
      className={`mx-auto max-w-7xl px-5 sm:px-8 ${className}`}
    >
      {children}
    </motion.section>
  )
}

function ProductPreview() {
  return (
    <div className="relative mx-auto max-w-6xl">
      <div className="absolute -inset-6 rounded-[2rem] bg-violet-500/15 blur-3xl" />
      <div className="relative rounded-[2rem] border border-white/10 bg-white/[0.055] p-3 shadow-[0_34px_120px_rgba(88,28,135,0.24)] backdrop-blur-2xl">
        <div className="rounded-[1.45rem] border border-white/10 bg-[#050816]/95 p-5 sm:p-6">
          <div className="mb-6 flex flex-col justify-between gap-4 border-b border-white/10 pb-5 sm:flex-row sm:items-center">
            <div>
              <p className="text-sm font-semibold text-violet-200">AURA workspace</p>
              <h2 className="mt-1 text-2xl font-bold tracking-tight text-white">Review operations</h2>
            </div>
            <span className="w-fit rounded-full border border-violet-300/20 bg-violet-400/10 px-3 py-2 text-xs font-bold text-violet-100">
              AURA Copilot on
            </span>
          </div>

          <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-4">
              <div className="mb-4 flex items-center justify-between">
                <p className="font-bold text-white">Review inbox</p>
                <span className="text-xs font-bold text-slate-400">Today</span>
              </div>
              {[
                ['Sarah M', '5 stars', 'Caitlin made everything easy.'],
                ['James R', '4 stars', 'Daniel was excellent at breakfast.'],
                ['Fiona L', '1 star', 'The issue was not resolved.'],
              ].map(([name, rating, text]) => (
                <div key={name} className="mb-3 rounded-2xl border border-white/10 bg-black/20 p-4 last:mb-0">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-white">{name}</p>
                    <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-slate-200">
                      {rating}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-slate-400">{text}</p>
                </div>
              ))}
            </div>

            <div className="grid gap-4">
              <div className="rounded-2xl border border-violet-300/20 bg-violet-400/10 p-4">
                <div className="flex items-center gap-3">
                  <Bot size={18} className="text-violet-200" />
                  <p className="font-bold text-white">AURA Copilot</p>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-300">
                  Suggested reply ready in your business tone.
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-4">
                <div className="flex items-center justify-between">
                  <p className="font-bold text-white">Staff mentions</p>
                  <Users size={18} className="text-blue-200" />
                </div>
                <div className="mt-4 space-y-3">
                  {['Caitlin +10', 'Daniel +6', 'Emma +10'].map((item) => (
                    <div key={item} className="flex items-center justify-between rounded-xl bg-white/5 px-3 py-2 text-sm text-slate-300">
                      {item}
                      <Trophy size={14} className="text-violet-200" />
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-4">
                <div className="mb-3 flex items-center justify-between">
                  <p className="font-bold text-white">Rewards progress</p>
                  <span className="text-xs font-bold text-violet-200">34 / 50 pts</span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full w-[68%] rounded-full bg-gradient-to-r from-violet-400 to-blue-400" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Landing() {
  const [billingCycle, setBillingCycle] = useState('monthly')

  return (
    <main className="min-h-screen overflow-hidden bg-[#03050d] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top,rgba(124,58,237,0.15),transparent_34%),linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:auto,72px_72px,72px_72px]" />
      <div className="pointer-events-none fixed left-1/2 top-28 h-[560px] w-[760px] -translate-x-1/2 rounded-full bg-violet-600/18 blur-[130px]" />
      <div className="pointer-events-none fixed right-[-12rem] top-[34rem] h-[460px] w-[460px] rounded-full bg-blue-500/14 blur-[120px]" />

      <div className="relative">
        <PublicNav />

        <section className="relative mx-auto flex min-h-screen max-w-7xl flex-col items-center justify-center px-5 pb-20 pt-16 text-center sm:px-8">
          <motion.div
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, ease: 'easeOut' }}
            className="relative z-10 mx-auto max-w-5xl"
          >
            <motion.div
              animate={{ scale: [1, 1.04, 1], opacity: [0.88, 1, 0.88] }}
              transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
              className="relative mx-auto mb-8 h-32 w-32 sm:h-44 sm:w-44"
            >
              <div className="absolute -inset-12 rounded-full bg-violet-500/20 blur-3xl" />
              <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_35%_30%,rgba(255,255,255,0.42),rgba(168,85,247,0.32)_28%,rgba(37,99,235,0.22)_54%,rgba(6,8,18,0.96)_80%)] shadow-[0_0_100px_rgba(124,58,237,0.36),inset_0_0_50px_rgba(255,255,255,0.08)]" />
              <div className="absolute inset-4 rounded-full border border-white/10" />
            </motion.div>

            <p className="mx-auto mb-5 inline-flex rounded-full border border-white/10 bg-white/8 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-violet-100 backdrop-blur">
              Built for cafés, restaurants, salons, hotels and local service teams.
            </p>
            <h1 className="text-5xl font-bold tracking-tight text-white sm:text-7xl lg:text-8xl">
              Reviews become replies.
              <span className="block bg-gradient-to-r from-violet-200 via-white to-blue-200 bg-clip-text text-transparent">
                Feedback becomes rewards.
              </span>
            </h1>
            <p className="mx-auto mt-7 max-w-3xl text-base leading-8 text-slate-300 sm:text-lg">
              AURA replies to your reviews, highlights staff mentions and turns customer feedback
              into rewards for your team.
            </p>
            <div className="mt-9 flex flex-wrap justify-center gap-3">
              <Link
                to="/signup"
                className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-bold text-slate-950 shadow-[0_18px_70px_rgba(168,85,247,0.24)] transition hover:-translate-y-0.5 hover:bg-slate-200"
              >
                Start free trial
                <ArrowRight size={17} />
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/8 px-5 py-3 text-sm font-bold text-white backdrop-blur transition hover:-translate-y-0.5 hover:bg-white/12"
              >
                View demo
              </Link>
            </div>
          </motion.div>
        </section>

        <Section className="pb-24">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {features.map((feature, index) => (
              <motion.article
                key={feature.title}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.35 }}
                transition={{ duration: 0.55, delay: index * 0.06 }}
                className="rounded-2xl border border-white/10 bg-white/[0.055] p-6 shadow-[0_20px_80px_rgba(0,0,0,0.18)] backdrop-blur transition hover:-translate-y-1 hover:bg-white/[0.075]"
              >
                <div className="mb-8 flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-400/10 text-violet-100">
                  <feature.icon size={21} />
                </div>
                <h2 className="text-xl font-bold text-white">{feature.title}</h2>
                <p className="mt-3 text-sm leading-6 text-slate-400">{feature.copy}</p>
              </motion.article>
            ))}
          </div>
        </Section>

        <Section className="pb-28">
          <div className="mx-auto mb-10 max-w-3xl text-center">
            <p className="text-sm font-bold uppercase tracking-[0.22em] text-violet-200">Product preview</p>
            <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-5xl">
              One calm workspace for review operations.
            </h2>
          </div>
          <ProductPreview />
        </Section>

        <Section className="pb-28">
          <div className="mx-auto mb-10 max-w-3xl text-center">
            <p className="text-sm font-bold uppercase tracking-[0.22em] text-violet-200">Pricing</p>
            <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-5xl">
              Plans that grow with your review volume.
            </h2>
            <div className="mt-8 flex justify-center">
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
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            {plans.map((plan) => {
              const price = billingCycle === 'monthly' ? plan.monthly : plan.yearly
              const cadence = billingCycle === 'monthly' ? '/month' : '/year'

              return (
                <article
                  key={plan.id}
                  className={`rounded-2xl border p-6 backdrop-blur transition hover:-translate-y-1 ${
                    plan.highlighted
                      ? 'border-violet-300/30 bg-violet-500/15 shadow-[0_26px_110px_rgba(124,58,237,0.28)] hover:shadow-[0_32px_130px_rgba(124,58,237,0.34)]'
                      : 'border-white/10 bg-white/[0.055] hover:bg-white/[0.075]'
                  }`}
                >
                  {plan.highlighted && (
                    <p className="mb-5 w-fit rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-950">
                      Most popular
                    </p>
                  )}
                  <h3 className="text-2xl font-bold">{plan.name}</h3>
                  <p className="mt-2 text-sm font-semibold text-violet-100">{plan.tagline}</p>
                  <p className="mt-3 min-h-12 text-sm leading-6 text-slate-400">{plan.description}</p>
                  <p className="mt-8 text-5xl font-bold tracking-tight">
                    {price}
                    <span className="text-base font-semibold text-slate-400">{cadence}</span>
                  </p>
                  {billingCycle === 'yearly' && (
                    <p className="mt-2 text-sm font-bold text-violet-200">Save 2 months</p>
                  )}
                  <div className="mt-8 space-y-3">
                    {plan.features.map((item) => (
                      <p key={item} className="flex items-center gap-3 text-sm font-semibold text-slate-300">
                        <Check size={16} className="text-violet-200" />
                        {item}
                      </p>
                    ))}
                  </div>
                  <Link
                    to="/signup"
                    className={`mt-8 inline-flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-bold transition hover:-translate-y-0.5 ${
                      plan.highlighted
                        ? 'bg-white text-slate-950 hover:bg-slate-200'
                        : 'border border-white/10 bg-white/8 text-white hover:bg-white/12'
                    }`}
                  >
                    Start free trial
                    <ArrowRight size={16} />
                  </Link>
                </article>
              )
            })}
          </div>
        </Section>

        <Section className="pb-28">
          <div className="mx-auto mb-10 max-w-3xl text-center">
            <p className="text-sm font-bold uppercase tracking-[0.22em] text-violet-200">FAQ</p>
            <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-5xl">
              Questions before you start.
            </h2>
          </div>
          <div className="mx-auto max-w-4xl divide-y divide-white/10 rounded-2xl border border-white/10 bg-white/[0.055] backdrop-blur">
            {faqs.map(([question, answer]) => (
              <details key={question} className="group p-5 open:bg-white/[0.035]">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-5 text-left font-bold text-white">
                  {question}
                  <ChevronDown size={18} className="shrink-0 text-slate-400 transition group-open:rotate-180" />
                </summary>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">{answer}</p>
              </details>
            ))}
          </div>
        </Section>

        <Section className="pb-20">
          <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.06] p-8 text-center backdrop-blur sm:p-12">
            <div className="absolute left-1/2 top-0 h-64 w-[34rem] -translate-x-1/2 rounded-full bg-violet-500/18 blur-3xl" />
            <div className="relative">
              <Sparkles className="mx-auto mb-5 text-violet-200" size={26} />
              <h2 className="text-4xl font-bold tracking-tight text-white sm:text-6xl">
                Ready to turn reviews into momentum?
              </h2>
              <div className="mt-9 flex flex-wrap justify-center gap-3">
                <Link
                  to="/signup"
                  className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-bold text-slate-950 transition hover:-translate-y-0.5 hover:bg-slate-200"
                >
                  Start free trial
                  <ArrowRight size={17} />
                </Link>
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/8 px-5 py-3 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-white/12"
                >
                  View demo
                </Link>
              </div>
            </div>
          </div>
        </Section>
      </div>
    </main>
  )
}
