import { ArrowLeft, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'

const privacySections = [
  {
    title: 'Who we are',
    body: (
      <p>
        AURA is operated by Spectre Projects. For privacy questions or requests, email{' '}
        <a className="font-bold text-white underline underline-offset-4" href="mailto:info@spectreprojects.co.uk">
          info@spectreprojects.co.uk
        </a>
        .
      </p>
    ),
  },
  {
    title: 'Information we collect',
    body: (
      <p>
        We collect account details such as your name, email address and business name; information you choose to add
        about your team; and review, reply and performance information needed to provide AURA. If you sign in with
        Google, Google provides your basic profile and email address. We do not receive your Google password.
      </p>
    ),
  },
  {
    title: 'How we use information',
    body: (
      <p>
        We use this information to create and secure your account, show reviews, track staff mentions and performance,
        prepare or send replies you have authorised, provide support and improve the service. We process this data to
        perform our contract with you, meet legal obligations and pursue our legitimate interests in operating and
        protecting AURA. Where a feature relies on consent, you can withdraw that consent at any time.
      </p>
    ),
  },
  {
    title: 'Sharing and international transfers',
    body: (
      <p>
        We share information only with service providers needed to run AURA, including Google, Supabase and Vercel,
        or where the law requires it. Some providers may process data outside the UK. Where this happens, we rely on
        appropriate contractual or legal safeguards.
      </p>
    ),
  },
  {
    title: 'Retention and security',
    body: (
      <p>
        We keep account information while your account is active and for only as long afterwards as needed for legal,
        security and operational purposes. We use reasonable technical and organisational measures to protect it. AURA
        uses essential storage and cookies for sign-in and session security.
      </p>
    ),
  },
  {
    title: 'Your rights',
    body: (
      <p>
        Depending on the circumstances, you may ask to access, correct, delete, restrict or transfer your personal data,
        or object to its use. You can also withdraw consent and complain to the UK Information Commissioner&apos;s Office.
        Contact us at the email above to exercise your rights.
      </p>
    ),
  },
]

const termsSections = [
  {
    title: 'Using AURA',
    body: (
      <p>
        AURA is a review-management service for businesses. You must provide accurate account information, keep your
        login secure and use the service lawfully. You are responsible for the business, staff and review information
        you add or connect.
      </p>
    ),
  },
  {
    title: 'Google connections and replies',
    body: (
      <p>
        When you connect a Google account, you authorise AURA to use only the permissions you approve. You can revoke
        access through your Google account or AURA settings. You remain responsible for reviewing your settings and for
        any reply published on behalf of your business.
      </p>
    ),
  },
  {
    title: 'Acceptable use',
    body: (
      <p>
        Do not misuse AURA, attempt unauthorised access, submit unlawful or harmful content, interfere with the service
        or use it to impersonate another person or business. We may restrict access where needed to protect users or the
        service.
      </p>
    ),
  },
  {
    title: 'Availability and changes',
    body: (
      <p>
        We aim to keep AURA reliable, but cannot promise uninterrupted availability. Features may change as the product
        develops. Third-party services such as Google may also change or interrupt their own services.
      </p>
    ),
  },
  {
    title: 'Liability and ending access',
    body: (
      <p>
        Nothing in these terms excludes liability that cannot legally be excluded. To the fullest extent permitted by
        law, AURA is not responsible for indirect losses or losses caused by third-party services. You may stop using
        AURA at any time, and we may suspend or end access for a serious breach of these terms.
      </p>
    ),
  },
  {
    title: 'Law and contact',
    body: (
      <p>
        These terms are governed by Scots law and disputes are subject to the courts of Scotland. Questions can be sent
        to{' '}
        <a className="font-bold text-white underline underline-offset-4" href="mailto:info@spectreprojects.co.uk">
          info@spectreprojects.co.uk
        </a>
        .
      </p>
    ),
  },
]

export default function LegalPage({ type }) {
  const isPrivacy = type === 'privacy'
  const title = isPrivacy ? 'Privacy Policy' : 'Terms of Service'
  const sections = isPrivacy ? privacySections : termsSections

  return (
    <main className="min-h-screen bg-[#020617] px-5 py-8 text-white sm:px-8 sm:py-12">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_85%_12%,rgba(14,165,233,0.2),transparent_28%),radial-gradient(circle_at_10%_70%,rgba(124,58,237,0.16),transparent_26%)]" />
      <div className="relative mx-auto max-w-4xl">
        <div className="flex items-center justify-between gap-4">
          <Link className="flex items-center gap-3" to="/">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-violet-500/20">
              <Sparkles size={18} />
            </span>
            <span className="text-lg font-black">AURA</span>
          </Link>
          <Link className="inline-flex items-center gap-2 text-sm font-bold text-slate-300 transition hover:text-white" to="/">
            <ArrowLeft size={16} />
            Back to AURA
          </Link>
        </div>

        <article className="mt-10 rounded-[2rem] border border-white/10 bg-white/[0.055] p-6 shadow-[0_30px_120px_rgba(0,0,0,0.3)] backdrop-blur-xl sm:p-10">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-cyan-300">AURA</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">{title}</h1>
          <p className="mt-3 text-sm font-semibold text-slate-400">Last updated 2 September 2026</p>

          <div className="mt-10 space-y-9 text-base leading-8 text-slate-300">
            {sections.map((section) => (
              <section key={section.title}>
                <h2 className="text-xl font-black text-white">{section.title}</h2>
                <div className="mt-2">{section.body}</div>
              </section>
            ))}
          </div>
        </article>
      </div>
    </main>
  )
}
