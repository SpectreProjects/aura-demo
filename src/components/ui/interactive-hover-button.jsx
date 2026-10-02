import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import './interactive-hover-button.css'

// JSX/router adaptation of Magic UI's public Interactive Hover Button:
// https://magicui.design/docs/components/interactive-hover-button
// Credit: Dillion Verma / Magic UI and Aayush Bharti (MIT).
export function InteractiveHoverButton({
  children,
  to,
  className = '',
  busy = false,
  leadingIcon,
  ...props
}) {
  const Component = to ? Link : 'button'
  return (
    <Component
      {...(to ? { to } : { type: 'button' })}
      {...props}
      className={`interactive-hover-button ${className}`}
      aria-label={children}
      aria-busy={busy || undefined}
    >
      <span className="interactive-hover-button-rest" aria-hidden="true">
        {leadingIcon}
        <span className="interactive-hover-button-label">{children}</span>
      </span>
      <span className="interactive-hover-button-active" aria-hidden="true">
        <span>{children}</span>
        <ArrowRight size={20} />
      </span>
    </Component>
  )
}
