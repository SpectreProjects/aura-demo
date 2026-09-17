import { Link } from 'react-router-dom'

export default function AuthEntryShell({ children, footer = null, formId, skipLabel }) {
  return (
    <main className="aura-login">
      <a className="ali-skip" href={`#${formId}`}>
        {skipLabel}
      </a>

      <div className="ali-shell">
        <section className="ali-scene" aria-label="AURA welcome">
          <picture aria-hidden="true" className="ali-scene-media">
            <source media="(max-width: 880px)" srcSet="/login/aura-restaurant-900.jpg" />
            <img
              alt=""
              height="2400"
              sizes="(max-width: 880px) 100vw, 50vw"
              src="/login/aura-restaurant-1600.jpg"
              srcSet="/login/aura-restaurant-900.jpg 900w, /login/aura-restaurant-1600.jpg 1600w"
              width="1600"
            />
          </picture>
          <div className="ali-scene-shade" />
          <Link aria-label="AURA home" className="ali-wordmark ali-wordmark-light" to="/">
            AURA
          </Link>
          <div className="ali-scene-copy" aria-hidden="true">
            <p>THOUGHTFUL REPLIES. A MORE PERSONAL PRESENCE.</p>
            <span>
              WELCOME
              <br />
              BACK.
            </span>
          </div>
          <p className="ali-scene-caption">FOR THE PEOPLE BEHIND THE BUSINESS</p>
        </section>

        <section
          className={`ali-auth-panel${footer ? '' : ' ali-auth-panel--single'}`}
          aria-label="AURA account access"
        >
          {children}
          {footer}
        </section>
      </div>
    </main>
  )
}
