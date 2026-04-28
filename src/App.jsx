import { useEffect, useMemo, useState } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import Layout from './components/Layout'
import { defaultRewards, defaultSettings, mockReviews } from './data/mockData'
import Dashboard from './pages/Dashboard'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Recognition from './pages/Recognition'
import Reviews from './pages/Reviews'
import Rewards from './pages/Rewards'
import Settings from './pages/Settings'
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

  const appContext = {
    businessName: settings.businessName,
    rewards,
    reviews: mockReviews,
    settings,
    staffMentions,
    staffRecognition,
    setRewards,
    setSettings,
  }

  const publicRoutes = ['/', '/login']
  const isPublic = publicRoutes.includes(location.pathname)

  return (
    <Routes>
      <Route path="/" element={<Landing businessName={settings.businessName} />} />
      <Route path="/login" element={<Login businessName={settings.businessName} />} />
      <Route
        path="/app"
        element={isPublic ? <Navigate to="/app/dashboard" replace /> : <Layout {...appContext} />}
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
