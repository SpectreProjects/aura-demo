import { Sparkles } from 'lucide-react'
import { Link, NavLink } from 'react-router-dom'

const navItems = [
  { label: 'Home', href: '/' },
  { label: 'About', href: '/about' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'Contact', href: '/contact' },
]

export default function PublicNav() {
  return (
    <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-6 sm:px-8">
      <Link to="/" className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-violet-200 shadow-[0_0_40px_rgba(124,58,237,0.22)]">
          <Sparkles size={20} />
        </span>
        <span className="text-xl font-bold tracking-tight text-white">AURA</span>
      </Link>

      <div className="hidden items-center gap-7 md:flex">
        {navItems.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            className={({ isActive }) =>
              `text-sm font-semibold transition ${
                isActive ? 'text-white' : 'text-slate-400 hover:text-white'
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <Link
          to="/login"
          className="hidden rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/10 sm:inline-flex"
        >
          Login
        </Link>
        <Link
          to="/signup"
          className="rounded-2xl bg-white px-4 py-3 text-sm font-bold text-slate-950 shadow-[0_18px_60px_rgba(124,58,237,0.24)] transition hover:-translate-y-0.5 hover:bg-slate-200"
        >
          Start free trial
        </Link>
      </div>
    </nav>
  )
}
