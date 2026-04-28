import { Mail, MessageCircle, Phone } from 'lucide-react'
import PublicPageShell from '../components/PublicPageShell'

export default function Contact() {
  return (
    <PublicPageShell>
      <section className="mx-auto grid max-w-7xl gap-10 px-5 py-20 sm:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
        <div>
          <p className="mb-5 inline-flex rounded-full border border-white/10 bg-white/8 px-4 py-2 text-sm font-semibold text-cyan-100">
            Contact
          </p>
          <h1 className="text-5xl font-bold tracking-tight sm:text-6xl">Talk to AURA.</h1>
          <p className="mt-6 text-lg leading-8 text-slate-300">
            Have questions about review replies, staff recognition, rewards, or setup for a local
            business? Send a note and we will get back to you.
          </p>
          <div className="mt-8 space-y-3 text-sm font-semibold text-slate-300">
            <p className="flex items-center gap-3"><Mail size={18} className="text-cyan-200" /> hello@aura-demo.local</p>
            <p className="flex items-center gap-3"><Phone size={18} className="text-cyan-200" /> Demo contact only</p>
          </div>
        </div>

        <form
          className="rounded-2xl border border-white/10 bg-white/[0.055] p-6 backdrop-blur"
          onSubmit={(event) => {
            event.preventDefault()
            console.info('[AURA contact placeholder] Contact form submitted.')
          }}
        >
          <MessageCircle className="mb-6 text-cyan-200" size={24} />
          <div className="space-y-4">
            <input className="aura-input border-white/10 bg-white/10 text-white placeholder:text-slate-500" placeholder="Name" />
            <input className="aura-input border-white/10 bg-white/10 text-white placeholder:text-slate-500" placeholder="Email" type="email" />
            <textarea className="aura-input min-h-36 resize-none border-white/10 bg-white/10 text-white placeholder:text-slate-500" placeholder="Message" />
            <button className="rounded-2xl bg-white px-5 py-3 text-sm font-bold text-slate-950" type="submit">
              Send message
            </button>
          </div>
        </form>
      </section>
    </PublicPageShell>
  )
}
