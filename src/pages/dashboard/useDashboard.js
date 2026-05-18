import { useOutletContext } from 'react-router-dom'

export function useDashboard() {
  return useOutletContext()
}
