import { Navigate, Route, Routes } from 'react-router-dom'
import DashboardLayout from './pages/dashboard/DashboardLayout'
import Overview from './pages/dashboard/Overview'
import Reviews from './pages/dashboard/Reviews'
import Rewards from './pages/dashboard/Rewards'
import Settings from './pages/dashboard/Settings'
import Staff from './pages/dashboard/Staff'
import Landing from './pages/Landing'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/dashboard" element={<DashboardLayout />}>
        <Route index element={<Overview />} />
        <Route path="reviews" element={<Reviews />} />
        <Route path="staff" element={<Staff />} />
        <Route path="rewards" element={<Rewards />} />
        <Route path="settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
      <Route path="/app/*" element={<Navigate to="/dashboard" replace />} />
      <Route path="/login" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
