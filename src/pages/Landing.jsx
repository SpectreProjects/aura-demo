import { motion } from 'framer-motion'
import {
  ArrowRight,
  Award,
  CheckCircle2,
  Gift,
  Hotel,
  MessageSquareText,
  Sparkles,
  Trophy,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import heroAsset from '../assets/hero.png'

const fadeUp = {
  hidden: { opacity: 0, y: 22 },
  visible: { opacity: 1, y: 0 },
}

const signals = [
  'Manual review testing',
  'Staff mention approval',
  'Reward progress tracking',
]

const previewStaff = [
  ['Caitlin', '32 pts', 'Free coffee unlocked'],
  ['Daniel', '24 pts', '6 pts to next reward'],
  ['Emma', '18 pts', '2 mentions this week'],
]

export default function Landing() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#030711] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(34,211,238,0.16),transparent_34%),radial-gradient(circle_at_82%_18%,rgba(124,58,237,0.14),transparent_32%),linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:auto,auto,72px_72px,72px_72px]" />

      <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-5 py-6 sm:px-8">
        <Link to="/" className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-cyan-100 shadow-[0_0_44px_rgba(34,211,238,0.18)] backdrop-blur">
            <Sparkles size={20} />
          </span>
          <span>
            <span className="block text-xl font-black tracking-tight">AURA</span>
            <span className="block text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Recognition OS</span>
          </span>
        </Link>

        <Link
          className="hidden rounded-2xl border border-white/10 bg-white/8 px-4 py-3 text-sm font-bold text-white backdrop-blur transition hover:-translate-y-0.5 hover:bg-white/12 sm:inline-flex"
          to="/dashboard"
        >
          Super Admin Log In
        </Link>
      </header>

      <section className="relative z-10 mx-auto flex min-h-[calc(100vh-92px)] max-w-7xl flex-col px-5 pb-14 pt-10 sm:px-8">
        <motion.div
          animate="visible"
          className="mx-auto max-w-5xl text-center"
          initial="hidden"
          transition={{ duration: 0.7, ease: 'easeOut' }}
          variants={fadeUp}
        >
          <div className="mx-auto mb-7 flex h-24 w-24 items-center justify-center">
            <img className="h-24 w-24 object-contain drop-shadow-[0_26px_70px_rgba(124,58,237,0.34)]" src={heroAsset} alt="" />
          </div>

          <p className="mx-auto mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/8 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-cyan-100 backdrop-blur">
            <Hotel size={15} />
            Built for hospitality teams
          </p>

          <h1 className="text-5xl font-black tracking-tight sm:text-7xl lg:text-8xl">
            AURA turns customer reviews into staff recognition.
          </h1>

          <p className="mx-auto mt-7 max-w-3xl text-base leading-8 text-slate-300 sm:text-lg">
            Track staff mentions, reward great service and turn guest feedback into motivation.
          </p>

          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-6 py-4 text-sm font-black text-slate-950 shadow-[0_24px_80px_rgba(34,211,238,0.18)] transition hover:-translate-y-0.5 hover:bg-slate-200 sm:w-auto"
              to="/dashboard"
            >
              Super Admin Log In
              <ArrowRight size={18} />
            </Link>
            <a
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/8 px-6 py-4 text-sm font-bold text-white backdrop-blur transition hover:-translate-y-0.5 hover:bg-white/12 sm:w-auto"
              href="#product-preview"
            >
              Preview dashboard
            </a>
          </div>

          <div className="mx-auto mt-8 grid max-w-3xl gap-3 sm:grid-cols-3">
            {signals.map((signal) => (
              <div key={signal} className="flex items-center justify-center gap-2 text-sm font-semibold text-slate-300">
                <CheckCircle2 size={17} className="text-cyan-200" />
                {signal}
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          animate="visible"
          className="mt-12"
          id="product-preview"
          initial="hidden"
          transition={{ delay: 0.12, duration: 0.7, ease: 'easeOut' }}
          variants={fadeUp}
        >
          <div className="mx-auto max-w-6xl rounded-[2rem] border border-white/10 bg-white/[0.065] p-3 shadow-[0_38px_140px_rgba(0,0,0,0.36)] backdrop-blur-2xl">
            <div className="rounded-[1.5rem] border border-white/10 bg-[#050816]/95 p-5 sm:p-6">
              <div className="flex flex-col justify-between gap-4 border-b border-white/10 pb-5 md:flex-row md:items-center">
                <div>
                  <p className="text-sm font-bold text-cyan-100">AURA super admin</p>
                  <h2 className="mt-1 text-2xl font-black tracking-tight">Recognition command centre</h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full border border-cyan-300/20 bg-cyan-400/10 px-3 py-2 text-xs font-black text-cyan-100">
                    Supabase ready
                  </span>
                  <span className="rounded-full border border-white/10 bg-white/8 px-3 py-2 text-xs font-black text-slate-200">
                    No auth blocker
                  </span>
                </div>
              </div>

              <div className="mt-5 grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
                <div className="rounded-3xl border border-white/10 bg-white/[0.05] p-5">
                  <div className="mb-5 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-slate-400">Manual review</p>
                      <p className="mt-1 font-black">"Maya and Caitlin made dinner feel special."</p>
                    </div>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-950">5 stars</span>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-cyan-300/20 bg-cyan-400/10 p-4">
                      <MessageSquareText className="mb-4 text-cyan-100" size={21} />
                      <p className="text-sm font-semibold text-slate-300">Known staff detected</p>
                      <p className="mt-2 text-2xl font-black">Caitlin +5</p>
                    </div>
                    <div className="rounded-2xl border border-amber-300/20 bg-amber-300/10 p-4">
                      <Award className="mb-4 text-amber-100" size={21} />
                      <p className="text-sm font-semibold text-slate-300">Needs approval</p>
                      <p className="mt-2 text-2xl font-black">Maya</p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4">
                  {previewStaff.map(([name, points, detail]) => (
                    <div key={name} className="rounded-3xl border border-white/10 bg-white/[0.05] p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-sm font-black text-slate-950">
                            {name.slice(0, 1)}
                          </span>
                          <div>
                            <p className="font-black">{name}</p>
                            <p className="text-sm text-slate-400">{detail}</p>
                          </div>
                        </div>
                        <span className="text-sm font-black text-cyan-100">{points}</span>
                      </div>
                    </div>
                  ))}
                  <div className="rounded-3xl border border-emerald-300/20 bg-emerald-400/10 p-4">
                    <div className="flex items-center gap-3">
                      <Gift className="text-emerald-100" size={21} />
                      <div>
                        <p className="font-black">Reward progress</p>
                        <p className="text-sm text-slate-400">Great service becomes visible momentum.</p>
                      </div>
                      <Trophy className="ml-auto text-emerald-100" size={20} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>
    </main>
  )
}
