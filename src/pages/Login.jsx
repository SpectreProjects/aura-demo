import { ArrowRight, LockKeyhole, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function Login({ businessName }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,#e0f2fe,#f7f8fb_45%)] px-5 py-10">
      <section className="w-full max-w-md">
        <Link to="/" className="mb-8 flex items-center justify-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-soft">
            <Sparkles size={20} />
          </span>
          <span className="text-xl font-bold tracking-tight text-slate-950">AURA</span>
        </Link>

        <div className="aura-card p-6 sm:p-8">
          <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
            <LockKeyhole size={22} />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-950">Welcome back</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Demo access for {businessName}. No real authentication is connected.
          </p>

          <div className="mt-6 space-y-4">
            <input className="aura-input" value="manager@hilton-demo.local" readOnly />
            <input className="aura-input" type="password" value="demo-password" readOnly />
          </div>

          <Link to="/app/dashboard" className="aura-button mt-6 w-full">
            Enter workspace
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </main>
  )
}
