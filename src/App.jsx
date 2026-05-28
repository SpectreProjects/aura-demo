import { Navigate, Route, Routes } from 'react-router-dom'
import DashboardLayout from './pages/dashboard/DashboardLayout'
import Overview from './pages/dashboard/Overview'
import Reviews from './pages/dashboard/Reviews'
import Rewards from './pages/dashboard/Rewards'
import Settings from './pages/dashboard/Settings'
import Staff from './pages/dashboard/Staff'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Signup from './pages/Signup'
import { AuthProvider, useAuth } from './lib/AuthContext'

function AuthLoadingScreen() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#030711] px-5 text-white">
      <div className="rounded-3xl border border-white/10 bg-white/[0.06] px-5 py-4 text-sm font-bold text-slate-200 shadow-[0_24px_90px_rgba(0,0,0,0.26)] backdrop-blur-xl">
        Loading AURA...
      </div>
    </main>
  )
}

function ProtectedRoute({ children }) {
  const { isAuthLoading, session } = useAuth()

  if (isAuthLoading) return <AuthLoadingScreen />
  if (!session) return <Navigate to="/login" replace />

  return children
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Overview />} />
          <Route path="reviews" element={<Reviews />} />
          <Route path="staff" element={<Staff />} />
          <Route path="rewards" element={<Rewards />} />
          <Route path="settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
        <Route path="/app/*" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  )
}
