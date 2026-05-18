import { motion } from 'framer-motion'
import { Award, Gift, MessageSquareText, SearchCheck, Trophy, Users } from 'lucide-react'
import { getNextReward } from '../../utils/mvpRecognition'
import { useDashboard } from './useDashboard'

function StatCard({ detail, icon: Icon, label, value }) {
  return (
    <motion.article
      animate={{ opacity: 1, y: 0 }}
      className="rounded-[1.7rem] border border-white/10 bg-white/[0.065] p-5 shadow-[0_22px_90px_rgba(0,0,0,0.18)] backdrop-blur-xl transition hover:-translate-y-1 hover:bg-white/[0.09]"
      initial={{ opacity: 0, y: 14 }}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-slate-300">{label}</p>
          <p className="mt-3 text-4xl font-black tracking-tight text-white">{value}</p>
          <p className="mt-2 text-sm leading-6 text-slate-400">{detail}</p>
        </div>
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-400/10 text-cyan-100">
          <Icon size={22} />
        </span>
      </div>
    </motion.article>
  )
}

function ProgressRow({ person, rewards }) {
  const nextReward = getNextReward(person, rewards)
  const required = Number(nextReward?.points_required || 0)
  const progress = required ? Math.min(100, Math.round((Number(person.points || 0) / required) * 100)) : 0

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.055] p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-black text-white">{person.name}</p>
          <p className="text-sm text-slate-400">{nextReward?.title || 'No active reward'}</p>
        </div>
        <p className="text-sm font-black text-cyan-100">{person.points} pts</p>
      </div>
      <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full bg-gradient-to-r from-cyan-300 to-white" style={{ width: `${progress}%` }} />
      </div>
    </div>
  )
}

export default function Overview() {
  const { leaderboard, overview, rewards } = useDashboard()
  const topStaff = leaderboard.slice(0, 3)

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.065] p-6 shadow-[0_30px_120px_rgba(0,0,0,0.25)] backdrop-blur-2xl sm:p-8">
        <div className="pointer-events-none absolute right-0 top-0 h-72 w-72 rounded-full bg-cyan-400/16 blur-[90px]" />
        <div className="relative flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="mb-4 inline-flex rounded-full border border-cyan-300/20 bg-cyan-400/10 px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-cyan-100">
              Overview
            </p>
            <h2 className="max-w-4xl text-4xl font-black tracking-tight text-white sm:text-5xl">
              Your review recognition command centre.
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300">
              Monitor guest feedback, staff mentions and reward momentum from one calm workspace.
            </p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-[#050816]/70 p-4">
            <p className="text-sm font-bold text-slate-400">New names found</p>
            <p className="mt-2 text-4xl font-black text-white">{overview.nameApprovals}</p>
            <p className="text-sm text-slate-400">Waiting for manager approval</p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          detail="Manual reviews added this calendar month"
          icon={MessageSquareText}
          label="Reviews this month"
          value={overview.reviewsThisMonth}
        />
        <StatCard
          detail="Approved people mentioned in guest reviews"
          icon={SearchCheck}
          label="Total staff mentions"
          value={overview.totalMentions}
        />
        <StatCard
          detail="Names found in reviews but not yet on the team"
          icon={Users}
          label="Pending name approvals"
          value={overview.nameApprovals}
        />
        <StatCard
          detail="Points awarded from published reviews this month"
          icon={Trophy}
          label="Points this month"
          value={overview.pointsThisMonth}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-[1.7rem] border border-white/10 bg-white/[0.065] p-5 shadow-[0_22px_90px_rgba(0,0,0,0.18)] backdrop-blur-xl">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.16em] text-cyan-100">Top performers</p>
              <h3 className="mt-1 text-2xl font-black tracking-tight text-white">Staff leading the month</h3>
            </div>
            <Award className="text-cyan-100" size={24} />
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            {topStaff.map((person, index) => (
              <article className="rounded-3xl border border-white/10 bg-[#050816]/72 p-4" key={person.id}>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-950">
                  #{index + 1}
                </span>
                <h4 className="mt-5 text-xl font-black text-white">{person.name}</h4>
                <p className="mt-1 text-sm text-slate-400">{person.job_title || person.job_category}</p>
                <p className="mt-5 text-3xl font-black text-cyan-100">{person.points}</p>
                <p className="text-sm font-semibold text-slate-400">{person.total_mentions} review mentions</p>
              </article>
            ))}
          </div>
        </div>

        <div className="rounded-[1.7rem] border border-white/10 bg-white/[0.065] p-5 shadow-[0_22px_90px_rgba(0,0,0,0.18)] backdrop-blur-xl">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.16em] text-cyan-100">Rewards</p>
              <h3 className="mt-1 text-2xl font-black tracking-tight text-white">Progress summary</h3>
            </div>
            <Gift className="text-cyan-100" size={24} />
          </div>

          <div className="space-y-3">
            {leaderboard.slice(0, 4).map((person) => (
              <ProgressRow key={person.id} person={person} rewards={rewards} />
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
