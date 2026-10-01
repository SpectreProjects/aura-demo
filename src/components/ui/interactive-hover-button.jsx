import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import './interactive-hover-button.css'

// JSX/router adaptation of Magic UI's public Interactive Hover Button:
// https://magicui.design/docs/components/interactive-hover-button
// Credit: Dillion Verma / Magic UI and Aayush Bharti (MIT).
export function InteractiveHoverButton({ children, to, className = '' }) {
  return (
    <Link to={to} className={`interactive-hover-button ${className}`} aria-label={children}>
      <span className="interactive-hover-button-rest" aria-hidden="true">
        <span className="interactive-hover-button-dot" />
        <span className="interactive-hover-button-label">{children}</span>
      </span>
      <span className="interactive-hover-button-active" aria-hidden="true">
        <span>{children}</span>
        <ArrowRight size={20} />
      </span>
    </Link>
  )
}
