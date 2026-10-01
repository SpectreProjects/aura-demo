import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Menu, X } from 'lucide-react'
import './navbar-1.css'

// Adapted from the visible floating navbar reference, not its locked source:
// https://21st.dev/@preetsuthar17/components/navbar-1
const headerItems = ['How it works', 'Features', 'Pricing']

function HeaderItems() {
  // Labels for the current branding preview. Supply real destinations when
  // these pages are built, rather than shipping dead anchors or invented URLs.
  return (
    <ul className="harmony-navbar-items">
      {headerItems.map(label => <li key={label}><span>{label}</span></li>)}
    </ul>
  )
}

export function Navbar1() {
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)
  const toggleRef = useRef(null)
  const reduceMotion = useReducedMotion()

  useEffect(() => {
    if (!open) return
    const closeOutside = event => {
      if (!rootRef.current.contains(event.target)) setOpen(false)
    }
    const closeOnEscape = event => {
      if (event.key === 'Escape') {
        setOpen(false)
        toggleRef.current.focus()
      }
    }
    const desktop = window.matchMedia('(min-width: 768px)')
    const closeOnDesktop = event => { if (event.matches) setOpen(false) }
    document.addEventListener('pointerdown', closeOutside)
    document.addEventListener('keydown', closeOnEscape)
    desktop.addEventListener('change', closeOnDesktop)
    return () => {
      document.removeEventListener('pointerdown', closeOutside)
      document.removeEventListener('keydown', closeOnEscape)
      desktop.removeEventListener('change', closeOnDesktop)
    }
  }, [open])

  return (
    <header ref={rootRef} className="harmony-navbar">
      <div className="harmony-navbar-bar">
        <Link
          to="/"
          className="harmony-navbar-logo"
          aria-label="Harmony home"
          onClick={() => {
            setOpen(false)
            window.scrollTo({ top: 0, behavior: reduceMotion ? 'instant' : 'smooth' })
          }}
        >
          <img src="/brand/harmony-logo.png" width="68" height="68" alt="" />
        </Link>
        <nav className="harmony-navbar-desktop" aria-label="Main navigation">
          <HeaderItems />
        </nav>
        <div className="harmony-navbar-actions">
          <Link to="/login" className="harmony-navbar-login">Log in</Link>
          <Link to="/signup" className="harmony-navbar-start">Get started</Link>
          <button
            ref={toggleRef}
            type="button"
            className="harmony-navbar-toggle"
            aria-expanded={open}
            aria-controls="harmony-mobile-navigation"
            aria-label={open ? 'Close menu' : 'Open menu'}
            onClick={() => setOpen(value => !value)}
          >
            {open ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
          </button>
        </div>
      </div>
      <AnimatePresence initial={false}>
        {open && (
          <motion.nav
            id="harmony-mobile-navigation"
            className="harmony-navbar-mobile"
            aria-label="Mobile navigation"
            initial={reduceMotion ? false : { opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: -8 }}
            transition={{ duration: reduceMotion ? 0 : 0.18, ease: 'easeOut' }}
          >
            <HeaderItems />
            <Link to="/login" className="harmony-navbar-mobile-login" onClick={() => setOpen(false)}>Log in</Link>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  )
}
