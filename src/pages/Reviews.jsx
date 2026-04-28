import { Filter, MessageSquareReply } from 'lucide-react'
import ReviewCard from '../components/ReviewCard'

export default function Reviews({ reviews, businessName, settings }) {
  return (
    <div className="space-y-6">
      <section className="aura-card flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-950">Review inbox</h2>
          <p className="mt-1 text-sm text-slate-500">
            Rule-based replies are generated locally from the star rating.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="aura-button-secondary">
            <Filter size={17} />
            All ratings
          </button>
          <button className="aura-button">
            <MessageSquareReply size={17} />
            {settings.autoReply ? 'Auto-reply on' : 'Auto-reply off'}
          </button>
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-2">
        {reviews.map((review) => (
          <ReviewCard
            key={review.id}
            review={review}
            businessName={businessName}
            tone={settings.replyTone}
          />
        ))}
      </div>
    </div>
  )
}
