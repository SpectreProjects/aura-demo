import PublicNav from './PublicNav'

export default function PublicPageShell({ children }) {
  return (
    <main className="min-h-screen overflow-hidden bg-[#030711] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:64px_64px]" />
      <div className="pointer-events-none fixed left-1/2 top-0 h-[520px] w-[720px] -translate-x-1/2 rounded-full bg-cyan-400/14 blur-[120px]" />
      <div className="relative">
        <PublicNav />
        {children}
      </div>
    </main>
  )
}
