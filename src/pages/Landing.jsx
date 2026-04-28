import { motion } from 'framer-motion'
import {
  ArrowRight,
  Award,
  Gift,
  MessageSquareReply,
  ShieldCheck,
  Star,
  TrendingUp,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import PublicNav from '../components/PublicNav'

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0 },
}

const slideLeft = {
  hidden: { opacity: 0, x: 46 },
  visible: { opacity: 1, x: 0 },
}

const stats = [
  { label: 'Average rating', value: '4.7', icon: Star },
  { label: 'Replies generated', value: '128', icon: MessageSquareReply },
  { label: 'Staff mentions', value: '34', icon: Award },
  { label: 'Rewards unlocked', value: '12', icon: Gift },
]

const trustedBy = ['Amore', 'Caffè Crostini', 'Malocchio', 'Hilton Glasgow Demo', 'Local Trades']

const howItWorks = [
  {
    title: 'Reviews come in',
    copy: 'AURA gathers customer sentiment into one calm workspace for the team to review.',
    icon: Star,
  },
  {
    title: 'Replies are generated',
    copy: 'Simple rating rules create polished response drafts without paid APIs or extra tools.',
    icon: MessageSquareReply,
  },
  {
    title: 'Staff get recognised',
    copy: 'Positive mentions become visible praise and points toward internal rewards.',
    icon: Award,
  },
]

const staffCards = [
  ['Caitlin', '+10 pts'],
  ['Daniel', '+6 pts'],
  ['Emma', '+10 pts'],
  ['Sophie', '+10 pts'],
  ['John', '+10 pts'],
]

const rewards = ['Free coffee', 'Meal voucher', 'Extra break', 'Team lunch entry']

function Section({ children, className = '' }) {
  return (
    <motion.section
      variants={fadeUp}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.24 }}
      transition={{ duration: 0.65, ease: 'easeOut' }}
      className={`mx-auto max-w-7xl px-5 sm:px-8 ${className}`}
    >
      {children}
    </motion.section>
  )
}

function DashboardPreview() {
  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      transition={{ duration: 0.75, delay: 0.2, ease: 'easeOut' }}
      className="relative mx-auto mt-16 max-w-6xl"
    >
      <div className="absolute -inset-4 rounded-[2rem] bg-cyan-400/10 blur-3xl" />
      <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.06] p-3 shadow-[0_30px_120px_rgba(8,145,178,0.18)] backdrop-blur-2xl">
        <div className="rounded-[1.55rem] border border-white/10 bg-[#070b12]/95 p-4 sm:p-6">
          <div className="mb-6 flex flex-col justify-between gap-4 border-b border-white/10 pb-5 sm:flex-row sm:items-center">
            <div>
              <p className="text-sm font-semibold text-cyan-200">AURA command centre</p>
              <h2 className="mt-1 text-2xl font-bold tracking-tight text-white">Hilton Glasgow Demo</h2>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-slate-300">
              <ShieldCheck size={16} className="text-cyan-300" />
              Local demo data
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="rounded-2xl border border-white/10 bg-white/[0.045] p-4">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-300/10 text-cyan-200">
                  <stat.icon size={18} />
                </div>
                <p className="text-3xl font-bold tracking-tight text-white">{stat.value}</p>
                <p className="mt-1 text-sm text-slate-400">{stat.label}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-[1.35fr_0.9fr]">
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-white">Review momentum</p>
                  <p className="text-sm text-slate-400">Average rating trend</p>
                </div>
                <TrendingUp size={18} className="text-cyan-300" />
              </div>
              <div className="h-56 min-h-56 min-w-0 overflow-hidden rounded-2xl">
                <svg className="h-full w-full" viewBox="0 0 640 240" role="img" aria-label="Review rating trend">
                  <defs>
                    <linearGradient id="auraLandingLine" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="#67e8f9" stopOpacity="0.32" />
                      <stop offset="100%" stopColor="#67e8f9" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  {[40, 88, 136, 184].map((y) => (
                    <line
                      key={y}
                      x1="24"
                      x2="616"
                      y1={y}
                      y2={y}
                      stroke="rgba(255,255,255,0.08)"
                      strokeDasharray="6 8"
                    />
                  ))}
                  <path
                    d="M24 178 C90 150 120 136 180 146 C246 158 278 92 344 98 C420 104 430 66 496 72 C552 78 580 48 616 42"
                    fill="none"
                    stroke="#67e8f9"
                    strokeLinecap="round"
                    strokeWidth="5"
                  />
                  <path
                    d="M24 178 C90 150 120 136 180 146 C246 158 278 92 344 98 C420 104 430 66 496 72 C552 78 580 48 616 42 L616 222 L24 222 Z"
                    fill="url(#auraLandingLine)"
                  />
                  {[
                    [24, 178],
                    [180, 146],
                    [344, 98],
                    [496, 72],
                    [616, 42],
                  ].map(([x, y]) => (
                    <circle key={`${x}-${y}`} cx={x} cy={y} r="5" fill="#cffafe" />
                  ))}
                </svg>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <p className="font-semibold text-white">Recent review</p>
              <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <p className="font-semibold text-white">Sarah M</p>
                  <span className="rounded-full bg-cyan-300/10 px-3 py-1 text-xs font-bold text-cyan-200">
                    5 stars
                  </span>
                </div>
                <p className="text-sm leading-6 text-slate-300">
                  Caitlin on reception was brilliant and made everything feel effortless.
                </p>
              </div>
              <div className="mt-4 rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-4">
                <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-cyan-200">
                  Reply ready
                </p>
                <p className="text-sm leading-6 text-slate-200">
                  Thank you, Sarah. We are delighted the team helped make your stay so smooth.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default function Landing({ businessName }) {
  return (
    <main className="min-h-screen overflow-hidden bg-[#030711] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:64px_64px]" />
      <div className="pointer-events-none fixed left-1/2 top-0 h-[520px] w-[720px] -translate-x-1/2 rounded-full bg-cyan-400/14 blur-[120px]" />
      <div className="relative">
        <PublicNav />
        <section className="mx-auto flex min-h-screen max-w-7xl flex-col px-5 sm:px-8">
          <div className="flex flex-1 flex-col justify-center py-16 text-center">
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              transition={{ duration: 0.7, ease: 'easeOut' }}
              className="mx-auto max-w-5xl"
            >
              <p className="mx-auto mb-6 inline-flex rounded-full border border-white/10 bg-white/8 px-4 py-2 text-sm font-semibold text-cyan-100 backdrop-blur">
                Built for {businessName}
              </p>
              <h1 className="text-5xl font-bold tracking-tight text-white sm:text-6xl lg:text-7xl">
                Every review answered. Every team member recognised.
              </h1>
              <p className="mx-auto mt-6 max-w-3xl text-base leading-8 text-slate-300 sm:text-lg">
                AURA turns customer reviews into instant replies, staff praise, and simple internal
                rewards, all from one calm workspace.
              </p>
              <div className="mt-9 flex flex-wrap justify-center gap-3">
                <Link
                  to="/signup"
                  className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-bold text-slate-950 shadow-[0_18px_60px_rgba(255,255,255,0.14)] transition hover:-translate-y-0.5"
                >
                  Open demo
                  <ArrowRight size={17} />
                </Link>
                <a
                  href="#how-it-works"
                  className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/8 px-5 py-3 text-sm font-bold text-white backdrop-blur transition hover:-translate-y-0.5 hover:bg-white/12"
                >
                  See how it works
                </a>
              </div>
            </motion.div>

            <DashboardPreview />
          </div>
        </section>

        <Section className="pb-24">
          <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-5 backdrop-blur">
            <p className="mb-5 text-center text-sm font-semibold text-slate-400">Trusted by local teams</p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {trustedBy.map((logo) => (
                <div
                  key={logo}
                  className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4 text-center text-sm font-bold text-slate-300"
                >
                  {logo}
                </div>
              ))}
            </div>
          </div>
        </Section>

        <Section id="how-it-works" className="pb-24">
          <div id="how-it-works" className="mb-8 max-w-2xl">
            <p className="text-sm font-bold uppercase tracking-[0.22em] text-cyan-200">How AURA works</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              From review to recognition in seconds.
            </h2>
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            {howItWorks.map((item, index) => (
              <motion.div
                key={item.title}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.35 }}
                transition={{ duration: 0.55, delay: index * 0.08 }}
                className="rounded-2xl border border-white/10 bg-white/[0.055] p-6 backdrop-blur"
              >
                <div className="mb-8 flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-300/10 text-cyan-200">
                  <item.icon size={21} />
                </div>
                <h3 className="text-xl font-bold text-white">{item.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-400">{item.copy}</p>
              </motion.div>
            ))}
          </div>
        </Section>

        <Section className="pb-24">
          <div className="grid gap-8 lg:grid-cols-[0.75fr_1.25fr] lg:items-center">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.22em] text-cyan-200">
                Recognition engine
              </p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                The best guest moments become visible.
              </h2>
              <p className="mt-4 text-sm leading-7 text-slate-400">
                Staff mentions are detected from the review text and translated into simple points
                your team can understand at a glance.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {staffCards.map(([name, points], index) => (
                <motion.div
                  key={name}
                  variants={slideLeft}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: false, amount: 0.35 }}
                  transition={{ duration: 0.55, delay: index * 0.05 }}
                  className="rounded-2xl border border-white/10 bg-white/[0.055] p-5 backdrop-blur"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 font-bold text-white">
                        {name.slice(0, 1)}
                      </span>
                      <span className="font-bold text-white">{name}</span>
                    </div>
                    <span className="rounded-full bg-cyan-300/10 px-3 py-1 text-sm font-bold text-cyan-200">
                      {points}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </Section>

        <Section className="pb-24">
          <div className="mb-8 max-w-2xl">
            <p className="text-sm font-bold uppercase tracking-[0.22em] text-cyan-200">Internal rewards</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Small rewards keep praise moving.
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {rewards.map((reward, index) => (
              <motion.div
                key={reward}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.4 }}
                transition={{ duration: 0.55, delay: index * 0.06 }}
                className="rounded-2xl border border-white/10 bg-white/[0.055] p-5 backdrop-blur"
              >
                <Gift className="mb-8 text-cyan-200" size={22} />
                <h3 className="font-bold text-white">{reward}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Simple local reward logic that can connect to your database later.
                </p>
              </motion.div>
            ))}
          </div>
        </Section>

        <Section className="pb-20">
          <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.06] p-8 text-center backdrop-blur sm:p-12">
            <div className="absolute left-1/2 top-0 h-44 w-96 -translate-x-1/2 rounded-full bg-cyan-300/14 blur-3xl" />
            <div className="relative">
              <h2 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
                Turn every review into momentum.
              </h2>
              <Link
                to="/signup"
                className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-bold text-slate-950 transition hover:-translate-y-0.5"
              >
                View demo
                <ArrowRight size={17} />
              </Link>
            </div>
          </div>
        </Section>
      </div>
    </main>
  )
}
