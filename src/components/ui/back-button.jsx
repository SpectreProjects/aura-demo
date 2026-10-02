import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import './back-button.css'

// Router adaptation of the supplied BackButton. Navigation stays a real link.
export function BackButton({ to = '/', className = '', label = 'Back' }) {
  return (
    <Link
      to={to}
      className={`harmony-back-button ${className}`}
      aria-label="Back to home"
    >
      <span className="harmony-back-label" aria-hidden="true">
        {label}
      </span>
      <span className="harmony-back-icon" aria-hidden="true">
        <ArrowLeft size={16} strokeWidth={2} />
      </span>
    </Link>
  )
}
