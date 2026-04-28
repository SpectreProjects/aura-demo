import { useEffect, useMemo, useState } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import Layout from './components/Layout'
import { defaultRewards, defaultSettings, mockReviews } from './data/mockData'
import About from './pages/About'
import Contact from './pages/Contact'
import Dashboard from './pages/Dashboard'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Pricing from './pages/Pricing'
import Recognition from './pages/Recognition'
import Reviews from './pages/Reviews'
import Rewards from './pages/Rewards'
import Settings from './pages/Settings'
import Signup from './pages/Signup'
import { supabase } from './lib/supabaseClient'
import { detectStaffMentions, getStaffRecognition } from './utils/detectStaffMentions'

const storage = {
  get(key, fallback) {
    try {
      const value = localStorage.getItem(key)
      return value ? JSON.parse(value) : fallback
    } catch {
      return fallback
    }
  },
  set(key, value) {
    localStorage.setItem(key, JSON.stringify(value))
  },
}

function AppRoutes() {
  const location = useLocation()
  const [settings, setSettings] = useState(() => storage.get('aura-settings', defaultSettings))
  const [rewards, setRewards] = useState(() => storage.get('aura-rewards', defaultRewards))
  const [session, setSession] = useState(null)
  const [authLoading, setAuthLoading] = useState(Boolean(supabase))
  const [accountBusiness, setAccountBusiness] = useState(null)
  const [profile, setProfile] = useState(null)

  useEffect(() => {
    if (!supabase) {
      return undefined
    }

    let isMounted = true

    supabase.auth.getSession().then(({ data, error }) => {
      if (error) console.error('[Supabase Auth] Session load error:', error)
      if (!isMounted) return
      setSession(data.session)
      setAuthLoading(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
    })

    return () => {
      isMounted = false
      listener.subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    async function loadAccount() {
      if (!supabase || !session?.user?.id) {
        setProfile(null)
        setAccountBusiness(null)
        return
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, role, business_id, businesses(id, name, business_type, locations_count)')
        .eq('id', session.user.id)
        .maybeSingle()

      if (error) {
        console.error('[Supabase] Account profile load error:', error)
        return
      }

      setProfile(data)
      setAccountBusiness(data?.businesses || null)
    }

    loadAccount()
  }, [session?.user?.id])

  useEffect(() => {
    storage.set('aura-settings', settings)
  }, [settings])

  useEffect(() => {
    storage.set('aura-rewards', rewards)
  }, [rewards])

  const staffMentions = useMemo(
    () => detectStaffMentions(mockReviews, settings.staffNames),
    [settings.staffNames],
  )

  const staffRecognition = useMemo(
    () => getStaffRecognition(mockReviews, settings.staffNames),
    [settings.staffNames],
  )

  const businessName = accountBusiness?.name || settings.businessName

  async function handleLogout() {
    if (!supabase) return
    const { error } = await supabase.auth.signOut()
    if (error) console.error('[Supabase Auth] Logout error:', error)
  }

  const appContext = {
    accountBusiness,
    authUser: session?.user || null,
    businessName,
    onLogout: handleLogout,
    profile,
    rewards,
    reviews: mockReviews,
    settings,
    staffMentions,
    staffRecognition,
    setRewards,
    setSettings,
  }

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-sm font-semibold text-slate-500">
        Loading AURA...
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/" element={<Landing businessName={businessName} />} />
      <Route path="/about" element={<About />} />
      <Route path="/pricing" element={<Pricing />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/signup" element={<Signup session={session} onAuthSession={setSession} onSignupComplete={({ businessName: nextName }) => {
        setSettings((current) => ({ ...current, businessName: nextName }))
      }} />} />
      <Route path="/login" element={<Login businessName={businessName} session={session} onAuthSession={setSession} />} />
      <Route
        path="/app"
        element={session ? <Layout {...appContext} /> : <Navigate to="/login" replace state={{ from: location }} />}
      >
        <Route index element={<Navigate to="/app/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard {...appContext} />} />
        <Route path="reviews" element={<Reviews {...appContext} />} />
        <Route path="recognition" element={<Recognition {...appContext} />} />
        <Route path="rewards" element={<Rewards {...appContext} />} />
        <Route path="settings" element={<Settings {...appContext} />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return <AppRoutes />
}
