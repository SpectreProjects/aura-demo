import { Bell, Menu, Search, Sparkles } from 'lucide-react'
import { NavLink } from 'react-router-dom'

export default function Topbar({ businessName }) {
  return (
    <header className="sticky top-0 z-20 border-b border-white/70 bg-slate-50/80 px-4 py-4 backdrop-blur-xl sm:px-6 lg:px-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-500">{businessName}</p>
          <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
            Reputation command centre
          </h1>
        </div>

        <div className="hidden min-w-80 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-400 shadow-sm md:flex">
          <Search size={17} />
          Search reviews, staff, rewards
        </div>

        <div className="flex items-center gap-2">
          <button className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50">
            <Bell size={18} />
          </button>
          <NavLink
            to="/app/dashboard"
            className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-soft lg:hidden"
          >
            <Sparkles size={18} />
          </NavLink>
          <button className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50 lg:hidden">
            <Menu size={18} />
          </button>
        </div>
      </div>
    </header>
  )
}
