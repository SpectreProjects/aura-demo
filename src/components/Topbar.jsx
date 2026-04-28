import { Bell, LogOut, Menu, Search, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { NavLink } from 'react-router-dom'

export default function Topbar({ authUser, businessName, onLogout }) {
  const [isOpen, setIsOpen] = useState(false)

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
          <div className="relative">
            <button
              className="flex h-11 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 text-left shadow-sm transition hover:bg-slate-50"
              type="button"
              onClick={() => setIsOpen((current) => !current)}
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-950 text-xs font-bold text-white">
                {(authUser?.email || 'A').slice(0, 1).toUpperCase()}
              </span>
              <span className="hidden leading-tight md:block">
                <span className="block text-xs font-bold text-slate-900">{businessName}</span>
                <span className="block max-w-44 truncate text-xs text-slate-500">
                  {authUser?.email || 'No account'}
                </span>
              </span>
            </button>
            {isOpen && (
              <div className="absolute right-0 mt-2 w-72 rounded-2xl border border-slate-200 bg-white p-3 shadow-soft">
                <p className="text-sm font-bold text-slate-950">{businessName}</p>
                <p className="mt-1 truncate text-sm text-slate-500">{authUser?.email}</p>
                <button
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-bold text-white"
                  type="button"
                  onClick={onLogout}
                >
                  <LogOut size={16} />
                  Logout
                </button>
              </div>
            )}
          </div>
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
