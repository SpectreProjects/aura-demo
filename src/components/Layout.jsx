import { Award, BarChart3, Gift, MessageSquareText, Settings } from 'lucide-react'
import { Outlet, NavLink } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar from './Topbar'

const mobileNav = [
  { label: 'Home', href: '/app/dashboard', icon: BarChart3 },
  { label: 'Reviews', href: '/app/reviews', icon: MessageSquareText },
  { label: 'Team', href: '/app/recognition', icon: Award, spotlightOnly: true },
  { label: 'Rewards', href: '/app/rewards', icon: Gift },
  { label: 'Settings', href: '/app/settings', icon: Settings },
]

export default function Layout({ authUser, businessName, canUseRecognition, onLogout }) {
  const visibleMobileNav = mobileNav.filter((item) => !item.spotlightOnly || canUseRecognition)

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,#e0f2fe_0,#f7f8fb_28%,#f7f8fb_100%)] text-slate-900">
      <div className="flex">
        <Sidebar businessName={businessName} canUseRecognition={canUseRecognition} />
        <div className="min-w-0 flex-1 pb-24 lg:pb-0">
          <Topbar authUser={authUser} businessName={businessName} onLogout={onLogout} />
          <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            <Outlet />
          </main>
        </div>
      </div>

      <nav
        className={`fixed inset-x-3 bottom-3 z-30 grid rounded-3xl border border-slate-200 bg-white/95 p-2 shadow-soft backdrop-blur lg:hidden ${
          visibleMobileNav.length === 5 ? 'grid-cols-5' : 'grid-cols-4'
        }`}
      >
        {visibleMobileNav.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-1 rounded-2xl py-2 text-[11px] font-semibold ${
                isActive ? 'bg-slate-950 text-white' : 'text-slate-500'
              }`
            }
          >
            <item.icon size={17} />
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
