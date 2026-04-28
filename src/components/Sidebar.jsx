import {
  Award,
  BarChart3,
  Gift,
  Home,
  MessageSquareText,
  Settings,
  Sparkles,
} from 'lucide-react'
import { NavLink } from 'react-router-dom'

const navItems = [
  { label: 'Dashboard', href: '/app/dashboard', icon: BarChart3 },
  { label: 'Reviews', href: '/app/reviews', icon: MessageSquareText },
  { label: 'Recognition', href: '/app/recognition', icon: Award },
  { label: 'Rewards', href: '/app/rewards', icon: Gift },
  { label: 'Settings', href: '/app/settings', icon: Settings },
]

export default function Sidebar({ businessName }) {
  return (
    <aside className="hidden min-h-screen w-72 shrink-0 border-r border-slate-200/80 bg-white/80 px-5 py-6 backdrop-blur-xl lg:block">
      <NavLink to="/" className="mb-8 flex items-center gap-3 rounded-2xl px-2">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-soft">
          <Sparkles size={20} />
        </span>
        <span>
          <span className="block text-lg font-bold tracking-tight text-slate-950">AURA</span>
          <span className="block text-xs font-medium text-slate-500">{businessName}</span>
        </span>
      </NavLink>

      <nav className="space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                isActive
                  ? 'bg-slate-950 text-white shadow-soft'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'
              }`
            }
          >
            <item.icon size={18} />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="mt-8 rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-4">
        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-slate-800 shadow-sm">
          <Home size={18} />
        </div>
        <p className="text-sm font-semibold text-slate-950">No-cost demo mode</p>
        <p className="mt-1 text-sm leading-6 text-slate-500">
          Mock data, local storage, and no external services.
        </p>
      </div>
    </aside>
  )
}
