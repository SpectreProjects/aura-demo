import { useEffect, useRef, useState } from 'react'
import { motion, useInView, useReducedMotion } from 'framer-motion'
import {
  ArrowDown,
  ArrowRight,
  Check,
  Menu,
  Pause,
  Play,
  RotateCcw,
  Star,
  X,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import { supabase } from '../lib/supabaseClient'
import './Landing.css'

const sectionLinks = [
  ['Your business. Your voice.', '#voice'],
  ['See Aura in action', '#in-action'],
  ['Made for local businesses', '#businesses'],
  ['A little less on your plate', '#benefits'],
]

function Photo({
  name,
  alt = '',
  className = '',
  hero = false,
  sizes = '(max-width: 700px) 100vw, 45vw',
}) {
  const wide = name === 'coffee' || name === 'restaurant' || name === 'aura-restaurant'
  const extension = name === 'aura-restaurant' ? 'jpg' : 'webp'
  return (
    <img
      className={className}
      src={`/landing/${name}-1200.${extension}`}
      srcSet={`/landing/${name}-640.${extension} 640w, /landing/${name}-1200.${extension} 1200w${wide ? `, /landing/${name}-1920.${extension} 1920w` : ''}`}
      sizes={sizes}
      alt={alt}
      width={1200}
      height={800}
      loading={hero ? 'eager' : 'lazy'}
      fetchPriority={hero ? 'high' : 'auto'}
      decoding="async"
    />
  )
}

function AccountCta({ authenticated, isLoading, light = false, children = 'Create an account' }) {
  const className = `al-button${light ? ' al-button-light' : ''}`

  if (isLoading) {
    return (
      <span aria-busy="true" className={`${className} al-button-pending`}>
        Checking account…
        <ArrowRight size={17} aria-hidden="true" />
      </span>
    )
  }

  return (
    <Link
      className={className}
      to={authenticated ? '/dashboard' : '/signup'}
    >
      {authenticated ? 'Open dashboard' : children}
      <ArrowRight size={17} aria-hidden="true" />
    </Link>
  )
}

function Reveal({ children, className = '' }) {
  const reducedMotion = useReducedMotion()
  return (
    <motion.div
      className={className}
      initial={false}
      whileInView={{ y: 0 }}
      style={{ y: reducedMotion ? 0 : 25 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  )
}

function Stars() {
  return (
    <span className="al-stars" aria-label="5 out of 5 stars">
      {Array.from({ length: 5 }, (_, i) => (
        <Star key={i} size={13} fill="currentColor" aria-hidden="true" />
      ))}
    </span>
  )
}

function ReviewDemo() {
  const reducedMotion = useReducedMotion()
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, amount: 0.3 })
  const [finished, setFinished] = useState(false)
  const [replay, setReplay] = useState(0)
  const showReply = !inView || reducedMotion || finished

  useEffect(() => {
    if (!inView || reducedMotion) return undefined
    const timer = window.setTimeout(() => setFinished(true), 1800)
    return () => window.clearTimeout(timer)
  }, [inView, reducedMotion, replay])

  return (
    <div className="al-demo" ref={ref}>
      <div className="al-demo-topline">
        <span>AURA / IN ACTION</span>
        <span>ILLUSTRATIVE EXAMPLE</span>
      </div>
      <div className="al-demo-content">
        <article className="al-customer-review">
          <div className="al-review-heading">
            <span className="al-avatar">J</span>
            <div>
              <strong>Jamie</strong>
              <span>A café customer</span>
            </div>
            <Stars />
          </div>
          <p>
            “Lovely coffee and such a warm welcome. Sophie took the time to help
            us choose, even on a busy morning. We’ll definitely be back.”
          </p>
          <span className="al-review-label">A NEW CUSTOMER REVIEW</span>
        </article>
        <div className="al-connection" aria-hidden="true">
          <span />
          <span
            className={showReply ? 'al-process-done' : 'al-process-pending'}
          >
            {showReply ? (
              <Check size={18} />
            ) : (
              <span className="al-process-dot" />
            )}
          </span>
          <span />
        </div>
        <article
          className={`al-aura-reply${showReply ? ' is-ready' : ' is-pending'}`}
        >
          <div className="al-reply-heading">
            <span className="al-small-wordmark">AURA</span>
            <span>
              {showReply ? 'IN YOUR VOICE' : 'FINDING THE RIGHT WORDS'}
            </span>
          </div>
          <div className="al-reply-body">
            <p>
              Thanks so much, Jamie! We’re really glad you enjoyed your coffee.
              We’ll pass your lovely words on to Sophie — they’ll make her day.
              See you again soon!
            </p>
            {!showReply && (
              <div className="al-writing" aria-hidden="true">
                <i />
                <i />
                <i />
              </div>
            )}
          </div>
          <div className="al-reply-footer">
            <Check size={14} aria-hidden="true" /> A personal reply. One less
            thing to do.
          </div>
        </article>
      </div>
      <div className="al-demo-bottom">
        <p>An example of how Aura can reply in a café’s voice.</p>
        {!reducedMotion && (
          <button
            type="button"
            disabled={!finished}
            onClick={() => {
              setFinished(false)
              setReplay((value) => value + 1)
            }}
          >
            <RotateCcw size={14} aria-hidden="true" /> Replay example
          </button>
        )}
      </div>
    </div>
  )
}

export default function Landing() {
  const { isAuthLoading, session } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const [paused, setPaused] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [accountError, setAccountError] = useState('')
  const reducedMotion = useReducedMotion()
  const dialogRef = useRef(null)
  const menuButtonRef = useRef(null)
  const authenticated = Boolean(session)

  useEffect(() => {
    if (!menuOpen) return undefined
    const dialog = dialogRef.current
    const menuButton = menuButtonRef.current
    const previousOverflow = document.body.style.overflow
    dialog.showModal()
    document.body.style.overflow = 'hidden'
    return () => {
      dialog.close()
      document.body.style.overflow = previousOverflow
      menuButton?.focus({ preventScroll: true })
    }
  }, [menuOpen])

  function followSection(event, href) {
    event.preventDefault()
    setMenuOpen(false)
    window.requestAnimationFrame(() => {
      const section = document.querySelector(href)
      section?.scrollIntoView({
        behavior: reducedMotion ? 'instant' : 'smooth',
      })
      section?.focus({ preventScroll: true })
      window.history.replaceState(null, '', href)
    })
  }

  async function handleSignOut() {
    if (!supabase || isSigningOut) return

    setAccountError('')
    setIsSigningOut(true)
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      setMenuOpen(false)
    } catch (error) {
      console.error('[Supabase Auth] Sign out error:', error)
      setAccountError('We could not log you out. Please try again.')
    } finally {
      setIsSigningOut(false)
    }
  }

  return (
    <div className="aura-landing">
      <title>AURA — Thoughtful Google review replies, in your voice</title>
      <meta
        name="description"
        content="AURA helps local businesses reply to Google reviews in their own voice. Thoughtful replies, less admin and recognition for the people behind great service."
      />
      <a className="al-skip" href="#main-content">
        Skip to content
      </a>
      <header className="al-header">
        <button
          ref={menuButtonRef}
          type="button"
          className="al-menu-trigger"
          aria-label="Open navigation"
          aria-expanded={menuOpen}
          aria-controls="aura-navigation"
          onClick={() => setMenuOpen(true)}
        >
          <Menu size={22} strokeWidth={1.3} />
          <span>Menu</span>
        </button>
        <Link to="/" className="al-wordmark" aria-label="AURA home">
          AURA
        </Link>
        {isAuthLoading ? (
          <span aria-busy="true" className="al-login al-account-pending">Checking…</span>
        ) : (
          <Link to={authenticated ? '/dashboard' : '/login'} className="al-login">
            {authenticated ? 'Open dashboard' : 'Log in'}{' '}
            <ArrowRight size={15} aria-hidden="true" />
          </Link>
        )}
      </header>

      {accountError ? (
        <p className="al-account-error" role="alert">
          {accountError}
        </p>
      ) : null}

      <dialog
        className="al-menu"
        ref={dialogRef}
        id="aura-navigation"
        aria-label="Main navigation"
        onKeyDown={(event) => {
          if (event.key !== 'Tab') return
          const controls = event.currentTarget.querySelectorAll(
            'a[href], button:not(:disabled)',
          )
          const first = controls[0]
          const last = controls[controls.length - 1]
          if (event.shiftKey && document.activeElement === first) {
            event.preventDefault()
            last?.focus()
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault()
            first?.focus()
          }
        }}
        onCancel={(event) => {
          event.preventDefault()
          setMenuOpen(false)
        }}
      >
        <div className="al-menu-top">
          <span className="al-wordmark">AURA</span>
          <button
            type="button"
            aria-label="Close navigation"
            onClick={() => setMenuOpen(false)}
          >
            <X size={26} strokeWidth={1.3} />
          </button>
        </div>
        <nav aria-label="Main navigation">
          {sectionLinks.map(([label, href]) => (
            <a
              key={href}
              href={href}
              onClick={(event) => followSection(event, href)}
            >
              {label}
              <ArrowRight aria-hidden="true" />
            </a>
          ))}
        </nav>
        <div className="al-menu-bottom">
          <AccountCta authenticated={authenticated} isLoading={isAuthLoading} />
          {!isAuthLoading && authenticated ? (
            <button disabled={isSigningOut} onClick={handleSignOut} type="button">
              {isSigningOut ? 'Logging out…' : 'Log out'}{' '}
              <ArrowRight size={16} aria-hidden="true" />
            </button>
          ) : !isAuthLoading ? (
            <Link to="/login" onClick={() => setMenuOpen(false)}>
              Already with Aura? Log in{' '}
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          ) : null}
        </div>
      </dialog>

      <main id="main-content">
        <section
          className={`al-hero${paused ? ' is-paused' : ''}`}
          aria-labelledby="hero-heading"
        >
          <div className="al-hero-media" aria-hidden="true">
            <Photo
              name="aura-restaurant"
              hero
              sizes="100vw"
              className="al-hero-photo al-hero-photo-first"
            />
            {!reducedMotion && (
              <Photo
                name="restaurant"
                sizes="100vw"
                className="al-hero-photo al-hero-photo-second"
              />
            )}
          </div>
          <div className="al-hero-shade" />
          <div className="al-hero-copy">
            <p className="al-eyebrow">GOOD SERVICE DOESN’T END AT THE DOOR</p>
            <h1 id="hero-heading">
              Every review answered.
              <br />
              Great service rewarded.
            </h1>
            <p className="al-hero-description">
              Aura replies in your business’s voice — with optional staff rewards
              when customers recognise great service.
            </p>
            <AccountCta authenticated={authenticated} isLoading={isAuthLoading} light />
          </div>
          <div className="al-hero-bottom">
            <a href="#voice" className="al-scroll-link">
              Discover Aura <ArrowDown size={15} aria-hidden="true" />
            </a>
            <span className="al-hero-caption">
              FOR THE PEOPLE BEHIND THE BUSINESS
            </span>
            {!reducedMotion && (
              <button
                type="button"
                className="al-motion-toggle"
                onClick={() => setPaused(!paused)}
                aria-label={
                  paused
                    ? 'Play background animation'
                    : 'Pause background animation'
                }
              >
                {paused ? (
                  <Play size={14} aria-hidden="true" />
                ) : (
                  <Pause size={14} aria-hidden="true" />
                )}
              </button>
            )}
          </div>
        </section>

        <section
          id="voice"
          tabIndex={-1}
          className="al-voice al-section"
          aria-labelledby="voice-heading"
        >
          <div className="al-editorial-grid">
            <Reveal className="al-voice-intro">
              <p className="al-eyebrow">PERSONAL BY NATURE</p>
              <h2 id="voice-heading">
                Your business.
                <br />
                Your voice.
              </h2>
              <p className="al-body-copy">
                The warm welcome. The extra effort. The regular whose order you
                know by heart. It’s the little things that make your business
                yours.
              </p>
              <p className="al-body-copy">
                Aura carries that same care into your Google review replies.
                Natural, thoughtful responses that sound like you — without
                another job on your list.
              </p>
            </Reveal>
            <Reveal className="al-editorial-photo al-photo-coffee">
              <figure>
                <Photo
                  name="coffee"
                  alt="Baristas preparing coffee together at a café counter"
                />
                <figcaption>
                  <span>CARE IN EVERY DETAIL</span>
                  <p>
                    From the first coffee to the last reply. Keep the
                    conversation as personal as the service.
                  </p>
                </figcaption>
              </figure>
            </Reveal>
            <Reveal className="al-editorial-photo al-photo-salon">
              <figure>
                <Photo
                  name="salon"
                  alt="A stylist carefully finishing a customer’s hair"
                />
                <figcaption>
                  <span>A VOICE THAT FEELS FAMILIAR</span>
                  <p>
                    Warm and chatty, calm and considered, or straight to the
                    point. Your business sets the tone.
                  </p>
                </figcaption>
              </figure>
            </Reveal>
            <Reveal className="al-voice-example">
              <div className="al-example-label">
                <span>THE AURA TOUCH</span>
                <span>EXAMPLE REPLY</span>
              </div>
              <Stars />
              <p>
                “So glad you love your new look. It was lovely having you in —
                see you at your next appointment!”
              </p>
              <span className="al-caption">
                A little warmth goes a long way.
              </span>
            </Reveal>
          </div>
        </section>

        <section
          id="in-action"
          tabIndex={-1}
          className="al-action al-section"
          aria-labelledby="action-heading"
        >
          <Reveal className="al-statement">
            <p className="al-eyebrow">MORE TIME FOR WHAT YOU DO BEST</p>
            <h2 id="action-heading">
              You look after
              <br />
              your customers.
              <br />
              <span>
                Aura looks after
                <br />
                your reviews.
              </span>
            </h2>
            <p>
              Every thoughtful reply starts with understanding your business.
            </p>
          </Reveal>
          <ReviewDemo />
          <div className="al-action-cta">
            <AccountCta authenticated={authenticated} isLoading={isAuthLoading} light />
            <span>Your voice, with a little help from Aura.</span>
          </div>
        </section>

        <section
          id="businesses"
          tabIndex={-1}
          className="al-businesses al-section"
          aria-labelledby="businesses-heading"
        >
          <figure className="al-floating al-float-cafe">
            <Photo
              name="coffee"
              alt="Coffee being prepared in a local café"
              sizes="(max-width: 700px) 44vw, 22vw"
            />
            <figcaption>CAFÉS</figcaption>
          </figure>
          <figure className="al-floating al-float-salon">
            <Photo
              name="salon"
              alt="The care and attention of a hair stylist"
              sizes="(max-width: 700px) 44vw, 18vw"
            />
            <figcaption>SALONS</figcaption>
          </figure>
          <Reveal className="al-business-copy">
            <p className="al-eyebrow">BIG CARE. LOCAL BUSINESSES.</p>
            <h2 id="businesses-heading">
              Made for
              <br />
              local businesses.
            </h2>
            <p>
              For the morning rush. The fully booked Friday.
              <br className="al-desktop-break" /> The job you stayed late to
              finish.
            </p>
            <p>
              You put your heart into your work.
              <br />
              Aura helps that care come through online.
            </p>
            <AccountCta authenticated={authenticated} isLoading={isAuthLoading} />
          </Reveal>
          <figure className="al-floating al-float-restaurant">
            <Photo
              name="restaurant"
              alt="A welcoming restaurant ready for service"
              sizes="(max-width: 700px) 44vw, 24vw"
            />
            <figcaption>RESTAURANTS</figcaption>
          </figure>
          <figure className="al-floating al-float-craft">
            <Photo
              name="craft"
              alt="A carpenter at work in a workshop"
              sizes="(max-width: 700px) 44vw, 18vw"
            />
            <figcaption>TRADES & SERVICES</figcaption>
          </figure>
        </section>

        <section
          id="benefits"
          tabIndex={-1}
          className="al-benefits al-section"
          aria-labelledby="benefits-heading"
        >
          <div className="al-section-heading">
            <h2 id="benefits-heading">A little less on your plate.</h2>
            <span className="al-eyebrow">A LITTLE MORE TAKEN CARE OF</span>
          </div>
          <div className="al-benefit-grid">
            <Reveal>
              <article>
                <div className="al-benefit-image">
                  <Photo
                    name="salon"
                    alt="A stylist giving a customer personal attention"
                  />
                </div>
                <p className="al-eyebrow">MAKE PEOPLE FEEL HEARD</p>
                <h3>Thoughtful replies.</h3>
                <p>
                  Keep the conversation going with responses that acknowledge
                  the details and reflect your business’s personality.
                </p>
              </article>
            </Reveal>
            <Reveal>
              <article>
                <div className="al-benefit-image">
                  <Photo
                    name="restaurant"
                    alt="The atmosphere of a busy neighbourhood restaurant"
                  />
                </div>
                <p className="al-eyebrow">GET ON WITH YOUR DAY</p>
                <h3>Less admin. More living.</h3>
                <p>
                  Spend less time finding the right words and more time on the
                  people, work and moments that matter to you.
                </p>
              </article>
            </Reveal>
            <Reveal>
              <article>
                <div className="al-benefit-image">
                  <Photo
                    name="coffee"
                    alt="Two members of a café team preparing drinks"
                  />
                </div>
                <p className="al-eyebrow">NOTICE THE PEOPLE WHO CARE</p>
                <h3>Great staff, recognised.</h3>
                <p>
                  When a customer mentions someone who made their day, help that
                  recognition reach the people behind the service.
                </p>
              </article>
            </Reveal>
          </div>
        </section>

        <section className="al-closing" aria-labelledby="closing-heading">
          <Photo name="restaurant" sizes="100vw" />
          <div className="al-closing-shade" />
          <Reveal className="al-closing-copy">
            <p className="al-eyebrow">A LITTLE HELP GOES A LONG WAY</p>
            <h2 id="closing-heading">
              Your next chapter.
              <br />A little lighter.
            </h2>
            <p>
              Make room for what you do best.
              <br />
              Let Aura help with the replies.
            </p>
            <AccountCta authenticated={authenticated} isLoading={isAuthLoading} light />
          </Reveal>
        </section>
      </main>

      <footer className="al-footer">
        <div className="al-footer-main">
          <Link className="al-footer-wordmark" to="/" aria-label="AURA home">
            AURA
          </Link>
          <nav aria-label="Footer navigation">
            {sectionLinks.map(([label, href]) => (
              <a key={href} href={href}>
                {label}
              </a>
            ))}
          </nav>
          <div className="al-footer-account">
            {isAuthLoading ? (
              <span aria-busy="true" className="al-account-pending">Checking account…</span>
            ) : (
              <Link to={authenticated ? '/dashboard' : '/signup'}>
                {authenticated ? 'Open dashboard' : 'Create an account'}{' '}
                <ArrowRight size={15} aria-hidden="true" />
              </Link>
            )}
            {!isAuthLoading && authenticated ? (
              <button disabled={isSigningOut} onClick={handleSignOut} type="button">
                {isSigningOut ? 'Logging out…' : 'Log out'}
              </button>
            ) : !isAuthLoading ? (
              <Link to="/login">Log in</Link>
            ) : null}
          </div>
        </div>
        <div className="al-footer-bottom">
          <span>© {new Date().getFullYear()} AURA</span>
          <span>Thoughtful replies. A more personal presence.</span>
          <div>
            <Link to="/privacy">Privacy</Link>
            <Link to="/terms">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
