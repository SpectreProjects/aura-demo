import { Award, MessageSquareText, Star, TrendingUp } from 'lucide-react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import ReviewCard from '../components/ReviewCard'
import StaffCard from '../components/StaffCard'
import StatCard from '../components/StatCard'

export default function Dashboard({ reviews, staffRecognition, staffMentions, businessName, settings }) {
  const average =
    reviews.reduce((total, review) => total + review.rating, 0) / Math.max(reviews.length, 1)
  const readyReplies = reviews.filter((review) => review.rating >= 3).length
  const chartData = reviews
    .slice()
    .reverse()
    .map((review) => ({
      name: review.author.split(' ')[0],
      rating: review.rating,
      mentions: staffMentions.filter((mention) => mention.reviewId === review.id).length,
    }))

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={Star}
          label="Average rating"
          value={average.toFixed(1)}
          detail={`${reviews.length} mock reviews tracked`}
          accent="bg-amber-100 text-amber-700"
        />
        <StatCard
          icon={MessageSquareText}
          label="Replies ready"
          value={readyReplies}
          detail="Rule-based responses generated"
          accent="bg-sky-100 text-sky-700"
        />
        <StatCard
          icon={Award}
          label="Staff mentions"
          value={staffMentions.length}
          detail="Detected from review text"
          accent="bg-emerald-100 text-emerald-700"
        />
        <StatCard
          icon={TrendingUp}
          label="Recognition points"
          value={staffRecognition.reduce((total, staff) => total + staff.points, 0)}
          detail="Across the current team"
          accent="bg-violet-100 text-violet-700"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
        <section className="aura-card p-5">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-950">Review momentum</h2>
              <p className="text-sm text-slate-500">Ratings and staff mentions by review</p>
            </div>
          </div>
          <div className="h-80 min-h-80 min-w-0">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="rating" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tickLine={false} axisLine={false} />
                <YAxis domain={[0, 5]} tickLine={false} axisLine={false} />
                <Tooltip />
                <Area type="monotone" dataKey="rating" stroke="#0284c7" fill="url(#rating)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="aura-card p-5">
          <h2 className="text-lg font-bold text-slate-950">Recognition split</h2>
          <p className="text-sm text-slate-500">Points by team member</p>
          <div className="mt-6 h-80 min-h-80 min-w-0">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <BarChart data={staffRecognition}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="name" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} />
                <Tooltip />
                <Bar dataKey="points" fill="#0f172a" radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-950">Top performers</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-1">
            {staffRecognition.slice(0, 3).map((staff, index) => (
              <StaffCard key={staff.name} staff={staff} rank={index} />
            ))}
          </div>
        </section>

        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-950">Latest review</h2>
          </div>
          <ReviewCard
            review={reviews[0]}
            businessName={businessName}
            tone={settings.replyTone}
          />
        </section>
      </div>
    </div>
  )
}
