import { Award, Sparkles } from 'lucide-react'
import StaffCard from '../components/StaffCard'

export default function Recognition({ staffRecognition, staffMentions }) {
  return (
    <div className="space-y-6">
      <section className="aura-card overflow-hidden p-6">
        <div className="grid gap-6 lg:grid-cols-[1fr_0.8fr] lg:items-center">
          <div>
            <p className="mb-3 inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-amber-700">
              Staff recognition
            </p>
            <h2 className="text-3xl font-bold tracking-tight text-slate-950">Praise becomes points.</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
              AURA detects hardcoded team names in review text and awards points from positive
              mentions only.
            </p>
          </div>
          <div className="rounded-3xl bg-slate-950 p-5 text-white">
            <div className="flex items-center gap-3">
              <Sparkles className="text-sky-200" />
              <p className="text-sm font-semibold text-slate-300">Current leader</p>
            </div>
            <p className="mt-4 text-4xl font-bold">{staffRecognition[0]?.name}</p>
            <p className="mt-2 text-sm text-slate-300">{staffRecognition[0]?.points} points earned</p>
          </div>
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-bold text-slate-950">Leaderboard</h2>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {staffRecognition.map((staff, index) => (
            <StaffCard key={staff.name} staff={staff} rank={index} />
          ))}
        </div>
      </section>

      <section className="aura-card p-5">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-100 text-sky-700">
            <Award size={18} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-950">Latest staff mentions</h2>
            <p className="text-sm text-slate-500">Guest praise matched against the staff list</p>
          </div>
        </div>
        <div className="divide-y divide-slate-100">
          {staffMentions.map((mention) => (
            <div key={mention.id} className="grid gap-3 py-4 md:grid-cols-[160px_1fr_90px] md:items-center">
              <div>
                <p className="font-bold text-slate-950">{mention.staffName}</p>
                <p className="text-sm text-slate-500">{mention.reviewAuthor}</p>
              </div>
              <p className="text-sm leading-6 text-slate-600">{mention.text}</p>
              <p className="rounded-full bg-slate-100 px-3 py-1 text-center text-sm font-bold text-slate-700">
                +{mention.points}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
