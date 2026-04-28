import { Building2, HeartHandshake, MessageSquareReply, Trophy } from 'lucide-react'
import PublicPageShell from '../components/PublicPageShell'

const audiences = ['Cafes', 'Restaurants', 'Salons', 'Hotels', 'Trades businesses', 'Local services']

export default function About() {
  return (
    <PublicPageShell>
      <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8">
        <div className="max-w-3xl">
          <p className="mb-5 inline-flex rounded-full border border-white/10 bg-white/8 px-4 py-2 text-sm font-semibold text-cyan-100">
            About AURA
          </p>
          <h1 className="text-5xl font-bold tracking-tight sm:text-6xl">
            Review management built for local businesses.
          </h1>
          <p className="mt-6 text-lg leading-8 text-slate-300">
            AURA helps local businesses turn customer reviews into replies, recognition and
            rewards. It is built for teams who want a calm, practical way to respond faster and
            notice the people customers already praise.
          </p>
        </div>

        <div className="mt-14 grid gap-4 md:grid-cols-3">
          {[
            ['Reply clearly', 'Keep review responses consistent and easy to manage.', MessageSquareReply],
            ['Recognise staff', 'Spot names in customer feedback and turn praise into points.', Trophy],
            ['Reward momentum', 'Create simple internal rewards that keep the team engaged.', HeartHandshake],
          ].map(([title, copy, Icon]) => (
            <div key={title} className="rounded-2xl border border-white/10 bg-white/[0.055] p-6 backdrop-blur">
              <Icon className="mb-8 text-cyan-200" size={24} />
              <h2 className="text-xl font-bold">{title}</h2>
              <p className="mt-3 text-sm leading-6 text-slate-400">{copy}</p>
            </div>
          ))}
        </div>

        <div className="mt-14 rounded-2xl border border-white/10 bg-white/[0.055] p-6 backdrop-blur">
          <div className="flex items-center gap-3">
            <Building2 className="text-cyan-200" size={22} />
            <h2 className="text-xl font-bold">Made for neighbourhood operators</h2>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            {audiences.map((item) => (
              <span key={item} className="rounded-full border border-white/10 bg-black/20 px-4 py-2 text-sm font-bold text-slate-300">
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>
    </PublicPageShell>
  )
}
