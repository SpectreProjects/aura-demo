import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, Check, ExternalLink, MapPin, Search, Star, X } from 'lucide-react'
import { useState } from 'react'

function Rating({ count, rating }) {
  if (!rating) return null

  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400">
      <Star className="fill-[#3867F4] text-[#3867F4]" size={13} />
      {rating.toFixed(1)} · {count.toLocaleString('en-GB')} reviews
    </span>
  )
}

export default function BusinessSetupModal({ isOpen, onClose, onConnect }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [selected, setSelected] = useState(null)
  const [step, setStep] = useState('search')
  const [isSearching, setIsSearching] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState('')

  function closeModal() {
    setError('')
    setSelected(null)
    setStep('search')
    onClose()
  }

  async function searchBusinesses(event) {
    event.preventDefault()
    const cleanQuery = query.trim()
    if (cleanQuery.length < 3) return

    setError('')
    setIsSearching(true)
    try {
      const places = await onConnect.search(cleanQuery)
      setResults(places)
      if (!places.length) setError('No matching businesses found. Try adding the town or postcode.')
    } catch (searchError) {
      setError(searchError.message || 'AURA could not search Google just now.')
    } finally {
      setIsSearching(false)
    }
  }

  async function connectBusiness() {
    if (!selected) return
    setError('')
    setIsConnecting(true)

    try {
      await onConnect.select(selected)
      setStep('success')
    } catch (connectError) {
      setError(connectError.message || 'AURA could not connect that business just now.')
    } finally {
      setIsConnecting(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-[80] flex items-center justify-center bg-[#080b0f]/75 p-4 backdrop-blur-md"
          exit={{ opacity: 0 }}
          initial={{ opacity: 0 }}
        >
          <motion.section
            animate={{ opacity: 1, y: 0 }}
            aria-labelledby="business-setup-title"
            aria-modal="true"
            className="relative max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-[2rem] border border-black/10 bg-[#e8f1ef] text-[#17201e] shadow-[0_30px_120px_rgba(0,0,0,0.48)]"
            exit={{ opacity: 0, y: 18 }}
            initial={{ opacity: 0, y: 24 }}
            role="dialog"
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
          >
            <button
              aria-label="Close business setup"
              className="absolute right-5 top-5 flex h-11 w-11 items-center justify-center rounded-xl border border-black/10 bg-white/45 text-[#53645f] transition hover:bg-white/80 hover:text-[#17201e]"
              onClick={closeModal}
              type="button"
            >
              <X size={19} />
            </button>

            <div className="border-b border-black/[0.08] px-6 py-6 sm:px-9">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-[#3867F4]">Google reviews</p>
              <p className="mt-2 text-sm font-semibold text-slate-400">
                {step === 'success' ? 'Connection complete' : step === 'confirm' ? 'Confirm business' : 'Find your business'}
              </p>
            </div>

            <AnimatePresence mode="wait">
              {step === 'search' && (
                <motion.div
                  animate={{ opacity: 1, x: 0 }}
                  className="px-6 py-8 sm:px-9 sm:py-10"
                  exit={{ opacity: 0, x: -36 }}
                  initial={{ opacity: 0, x: 36 }}
                  key="search"
                >
                  <h2 className="max-w-2xl text-4xl font-medium leading-[1.06] tracking-[-0.045em] sm:text-5xl" id="business-setup-title">
                    Which business should AURA listen to?
                  </h2>
                  <p className="mt-4 max-w-xl text-base leading-7 text-[#5d6f6a]">
                    Search the business name with its town or postcode, then choose the exact Google listing.
                  </p>

                  <form className="mt-8" onSubmit={searchBusinesses}>
                    <div className="flex flex-col gap-3 sm:flex-row">
                      <label className="flex h-14 min-w-0 flex-1 items-center gap-3 rounded-xl border border-black/10 bg-white/60 px-4 focus-within:border-[#3867F4] focus-within:ring-4 focus-within:ring-[#3867F4]/10">
                        <Search className="shrink-0 text-slate-500" size={18} />
                        <input
                          autoFocus
                          className="min-w-0 flex-1 bg-transparent text-base font-semibold text-[#17201e] outline-none placeholder:text-[#788b86]"
                          onChange={(event) => {
                            setQuery(event.target.value)
                            setError('')
                          }}
                          placeholder="e.g. La Vita, Glasgow"
                          value={query}
                        />
                      </label>
                      <button
                        className="inline-flex h-14 items-center justify-center gap-2 rounded-xl bg-[#3867F4] px-6 text-sm font-black text-white transition hover:bg-[#2f5be0] disabled:opacity-50"
                        disabled={isSearching || query.trim().length < 3}
                        type="submit"
                      >
                        {isSearching ? 'Searching…' : 'Search Google'}
                        {!isSearching && <ArrowRight size={17} />}
                      </button>
                    </div>
                  </form>

                  {error && <p className="mt-4 rounded-xl border border-rose-300/15 bg-rose-400/[0.08] px-4 py-3 text-sm font-semibold text-rose-100">{error}</p>}

                  {results.length > 0 && (
                    <div className="mt-7 space-y-2">
                      <p className="pb-2 text-xs font-black uppercase tracking-[0.16em] text-slate-500">Matching businesses</p>
                      {results.map((place) => (
                        <button
                          className="flex w-full items-start gap-4 rounded-xl border border-black/[0.08] bg-white/40 p-4 text-left transition hover:border-[#3867F4]/45 hover:bg-[#3867F4]/[0.07]"
                          key={place.id}
                          onClick={() => {
                            setSelected(place)
                            setError('')
                            setStep('confirm')
                          }}
                          type="button"
                        >
                          <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.07] text-[#3867F4]">
                            <MapPin size={18} />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block font-black text-[#17201e]">{place.name}</span>
                            <span className="mt-1 block text-sm leading-5 text-slate-400">{place.address}</span>
                            <span className="mt-2 block"><Rating count={place.reviewCount} rating={place.rating} /></span>
                          </span>
                          <ArrowRight className="mt-2 shrink-0 text-slate-600" size={18} />
                        </button>
                      ))}
                      <p className="pt-3 text-xs font-semibold text-slate-500">Business information supplied by Google Maps.</p>
                    </div>
                  )}
                </motion.div>
              )}

              {step === 'confirm' && selected && (
                <motion.div
                  animate={{ opacity: 1, x: 0 }}
                  className="px-6 py-8 sm:px-9 sm:py-10"
                  exit={{ opacity: 0, x: -36 }}
                  initial={{ opacity: 0, x: 36 }}
                  key="confirm"
                >
                  <h2 className="text-4xl font-medium leading-[1.06] tracking-[-0.045em] sm:text-5xl" id="business-setup-title">Is this the one?</h2>
                  <div className="mt-8 rounded-2xl border border-[#3867F4]/30 bg-[#3867F4]/[0.08] p-6">
                    <div className="flex items-start gap-4">
                      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#3867F4] text-white">
                        <MapPin size={21} />
                      </span>
                      <div className="min-w-0">
                        <h3 className="text-2xl font-semibold tracking-[-0.03em]">{selected.name}</h3>
                        <p className="mt-2 leading-6 text-slate-400">{selected.address}</p>
                        <div className="mt-3"><Rating count={selected.reviewCount} rating={selected.rating} /></div>
                        {selected.googleMapsUri && (
                          <a className="mt-4 inline-flex items-center gap-2 text-sm font-black text-[#7f9cff] hover:text-white" href={selected.googleMapsUri} rel="noreferrer" target="_blank">
                            View on Google Maps <ExternalLink size={14} />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>

                  {error && <p className="mt-4 rounded-xl border border-rose-300/15 bg-rose-400/[0.08] px-4 py-3 text-sm font-semibold text-rose-100">{error}</p>}

                  <div className="mt-7 grid gap-3 sm:grid-cols-[auto_1fr]">
                    <button className="inline-flex h-14 items-center justify-center gap-2 rounded-xl border border-black/10 px-5 text-sm font-black text-[#52645f] hover:bg-white/55" onClick={() => setStep('search')} type="button">
                      <ArrowLeft size={17} /> Back
                    </button>
                    <button className="inline-flex h-14 items-center justify-center gap-2 rounded-xl bg-[#3867F4] px-6 text-sm font-black text-white transition hover:bg-[#2f5be0] disabled:opacity-50" disabled={isConnecting} onClick={connectBusiness} type="button">
                      {isConnecting ? 'Connecting reviews…' : `Use ${selected.name}`}
                      {!isConnecting && <ArrowRight size={17} />}
                    </button>
                  </div>
                  <p className="mt-5 text-xs leading-5 text-slate-500">AURA saves the Google Place ID, then loads Google&apos;s current relevance-ranked review sample when you open the dashboard.</p>
                </motion.div>
              )}

              {step === 'success' && selected && (
                <motion.div animate={{ opacity: 1, x: 0 }} className="px-6 py-10 text-center sm:px-9 sm:py-12" exit={{ opacity: 0 }} initial={{ opacity: 0, x: 36 }} key="success">
                  <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#3867F4] text-white shadow-[0_0_40px_rgba(56,103,244,0.3)]">
                    <Check size={29} />
                  </span>
                  <h2 className="mt-7 text-4xl font-medium tracking-[-0.045em] sm:text-5xl" id="business-setup-title">AURA is listening.</h2>
                  <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-slate-400">{selected.name} is connected. Its available Google review sample is now ready in Reviews and the team dashboard.</p>
                  <button className="mt-8 inline-flex h-14 min-w-56 items-center justify-center rounded-xl bg-[#3867F4] px-6 text-sm font-black text-white transition hover:bg-[#2f5be0]" onClick={closeModal} type="button">Go to dashboard</button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
