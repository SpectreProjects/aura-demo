import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  CheckCircle2,
  MapPin,
  RefreshCw,
  Search,
  ShieldCheck,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import GoogleReplySettingsForm from '../components/GoogleReplySettingsForm'
import { callAuraApi } from '../lib/auraApi'
import './GoogleActivation.css'

const demoLocations = [
  {
    accountName: 'accounts/10001',
    accountTitle: 'Clyde Hospitality Group',
    address: '12 Royal Exchange Square, Glasgow, G1 3AB, GB',
    locationName: 'locations/20001',
    locationTitle: 'Caffè Alba — Merchant City',
    storeCode: 'GLA-01',
  },
  {
    accountName: 'accounts/10001',
    accountTitle: 'Clyde Hospitality Group',
    address: '48 Byres Road, Glasgow, G12 8SH, GB',
    locationName: 'locations/20002',
    locationTitle: 'Caffè Alba — West End',
    storeCode: 'GLA-02',
  },
  {
    accountName: 'accounts/10002',
    accountTitle: 'Connor Glynn',
    address: '7 High Street, Paisley, PA1 2AE, GB',
    locationName: 'locations/20003',
    locationTitle: 'The Copper Room',
    storeCode: '',
  },
]

const defaultSettings = {
  avoidedPhrases: [],
  criticalExample: '',
  escalationWording: '',
  notificationEmail: '',
  notificationsEnabled: true,
  positiveExample: '',
  preferredPhrases: [],
  recommendedDelayMinutes: 120,
  setupComplete: false,
  toneChoice: 'warm_friendly',
}

const steps = [
  { key: 'connect', label: 'Connect' },
  { key: 'locations', label: 'Location' },
  { key: 'tone', label: 'Voice' },
  { key: 'import', label: 'Import' },
  { key: 'complete', label: 'Ready' },
]

function stepIndex(step) {
  return Math.max(0, steps.findIndex((item) => item.key === step))
}

function callbackMessage(detail) {
  const messages = {
    approval_required: 'Google Business Profile access is not available for this Cloud project yet.',
    connection_failed: 'Google could not finish the connection. Nothing was changed in AURA.',
    google_error: 'Google returned an error before the connection completed.',
    missing_code: 'Google did not return the secure connection code. Please try again.',
    permission_denied: 'You cancelled or declined Google Business Profile access. AURA has not received permission.',
    temporarily_paused: 'Google connections are temporarily paused. Your saved AURA data is unchanged.',
  }
  return messages[detail] || ''
}

function visualStatus(mode) {
  const activeConnection = {
    accountTitle: 'Clyde Hospitality Group',
    id: 'visual-active',
    lastSyncedAt: mode === 'complete' ? new Date().toISOString() : null,
    locationAddress: demoLocations[0].address,
    locationStoreCode: demoLocations[0].storeCode,
    locationTitle: demoLocations[0].locationTitle,
    selectedAt: new Date().toISOString(),
    status: 'active',
  }
  if (mode === 'locations' || mode === 'no-locations') {
    return {
      connected: false,
      connection: null,
      needsSetup: true,
      pendingConnection: { id: 'visual-pending', status: 'pending_selection' },
      settings: defaultSettings,
    }
  }
  if (['tone', 'import', 'complete'].includes(mode)) {
    return {
      connected: true,
      connection: activeConnection,
      needsSetup: mode !== 'complete',
      pendingConnection: null,
      settings: { ...defaultSettings, setupComplete: ['import', 'complete'].includes(mode) },
    }
  }
  return { connected: false, connection: null, needsSetup: true, pendingConnection: null, settings: defaultSettings }
}

function deriveStep(status) {
  if (status?.pendingConnection) return 'locations'
  if (status?.connected && !status.settings?.setupComplete) return 'tone'
  if (status?.connected && !status.connection?.lastSyncedAt) return 'import'
  if (status?.connected) return 'complete'
  return 'connect'
}

export default function GoogleActivation() {
  const [searchParams] = useSearchParams()
  const visualMode = import.meta.env.DEV ? searchParams.get('visual') : null
  const isVisualDemo = Boolean(visualMode)
  const googleResult = searchParams.get('google')
  const googleDetail = searchParams.get('detail')
  const headingRef = useRef(null)
  const searchRef = useRef(null)
  const [status, setStatus] = useState(null)
  const [step, setStep] = useState('loading')
  const [errorMessage, setErrorMessage] = useState(
    visualMode === 'denied' ? callbackMessage('permission_denied') : callbackMessage(googleDetail),
  )
  const [locations, setLocations] = useState([])
  const [query, setQuery] = useState('')
  const [selectedKey, setSelectedKey] = useState('')
  const [isBusy, setIsBusy] = useState(false)
  const [importCount, setImportCount] = useState(0)

  useEffect(() => {
    document.title = 'Connect Google — AURA'
  }, [])

  async function loadLocations(signal) {
    setIsBusy(true)
    setErrorMessage('')
    try {
      const payload = isVisualDemo
        ? { locations: visualMode === 'no-locations' ? [] : demoLocations }
        : await callAuraApi('/api/google-locations', null, 'GET', signal)
      setLocations(payload.locations || [])
      setSelectedKey(payload.locations?.length === 1
        ? `${payload.locations[0].accountName}|${payload.locations[0].locationName}`
        : '')
      setStep('locations')
    } catch (error) {
      if (error.name === 'AbortError') return
      if (['NO_GOOGLE_ACCOUNTS', 'NO_GOOGLE_LOCATIONS'].includes(error.code)) {
        setLocations([])
        setStep('locations')
      } else {
        setErrorMessage(error.message)
      }
    } finally {
      setIsBusy(false)
    }
  }

  useEffect(() => {
    if (step === 'loading') return
    window.requestAnimationFrame(() => headingRef.current?.focus({ preventScroll: true }))
  }, [step])

  useEffect(() => {
    const controller = new AbortController()
    async function load() {
      if (isVisualDemo) {
        const nextStatus = visualStatus(visualMode)
        setStatus(nextStatus)
        const nextStep = ['denied', 'connect'].includes(visualMode) ? 'connect' : deriveStep(nextStatus)
        setStep(visualMode === 'import' ? 'import' : nextStep)
        if (nextStep === 'locations') {
          setLocations(visualMode === 'no-locations' ? [] : demoLocations)
          setSelectedKey(visualMode === 'no-locations' ? '' : `${demoLocations[0].accountName}|${demoLocations[0].locationName}`)
        }
        return
      }

      try {
        const nextStatus = await callAuraApi('/api/google-status', null, 'GET', controller.signal)
        setStatus(nextStatus)
        const nextStep = deriveStep(nextStatus)
        setStep(nextStep)
        if (nextStep === 'locations' || googleResult === 'select_location') {
          await loadLocations(controller.signal)
        }
      } catch (error) {
        if (error.name === 'AbortError') return
        setErrorMessage(error.message)
        setStep('connect')
      }
    }
    load()
    return () => controller.abort()
    // The OAuth callback query is intentionally captured once on entry.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function startGoogleConnection() {
    setIsBusy(true)
    setErrorMessage('')
    try {
      if (isVisualDemo) {
        setStatus(visualStatus('locations'))
        setLocations(demoLocations)
        setStep('locations')
        setIsBusy(false)
        return
      }
      const { url } = await callAuraApi('/api/google-oauth-start', {})
      window.location.assign(url)
    } catch (error) {
      setErrorMessage(error.message)
      setIsBusy(false)
    }
  }

  async function cancelSelection() {
    setIsBusy(true)
    try {
      if (!isVisualDemo) await callAuraApi('/api/google-disconnect', { mode: 'cancel_pending' })
      setStatus(visualStatus('connect'))
      setLocations([])
      setStep('connect')
    } catch (error) {
      setErrorMessage(error.message)
    } finally {
      setIsBusy(false)
    }
  }

  async function confirmLocation() {
    const selected = locations.find((location) => `${location.accountName}|${location.locationName}` === selectedKey)
    if (!selected) {
      setErrorMessage('Choose the one location AURA should use.')
      return
    }
    setIsBusy(true)
    setErrorMessage('')
    try {
      if (isVisualDemo) {
        const nextStatus = visualStatus('tone')
        setStatus(nextStatus)
        setStep('tone')
        return
      }
      const payload = await callAuraApi('/api/google-location-select', {
        accountName: selected.accountName,
        connectionId: status.pendingConnection.id,
        locationName: selected.locationName,
      })
      setStatus((current) => ({ ...current, connected: true, connection: payload.connection, pendingConnection: null }))
      setStep('tone')
    } catch (error) {
      setErrorMessage(error.message)
    } finally {
      setIsBusy(false)
    }
  }

  async function saveSettingsAndImport(values) {
    if (isVisualDemo) {
      setStatus((current) => ({ ...current, settings: { ...values, setupComplete: true } }))
      setStep('import')
      setIsBusy(true)
      window.setTimeout(() => {
        setImportCount(148)
        setIsBusy(false)
        setStep('complete')
      }, 700)
      return
    }

    const payload = await callAuraApi('/api/google-settings', values, 'PATCH')
    setStatus((current) => ({ ...current, settings: payload.settings }))
    setStep('import')
    setIsBusy(true)
    try {
      const result = await callAuraApi('/api/google-reviews-sync', {})
      setImportCount(result.count || 0)
      setStatus((current) => ({
        ...current,
        connection: { ...current.connection, lastSyncedAt: result.syncedAt },
      }))
      setStep('complete')
    } catch (error) {
      setErrorMessage(error.message)
      throw error
    } finally {
      setIsBusy(false)
    }
  }

  async function retryImport() {
    setIsBusy(true)
    setErrorMessage('')
    try {
      if (isVisualDemo) {
        setImportCount(148)
      } else {
        const result = await callAuraApi('/api/google-reviews-sync', {})
        setImportCount(result.count || 0)
      }
      setStep('complete')
    } catch (error) {
      setErrorMessage(error.message)
    } finally {
      setIsBusy(false)
    }
  }

  const visibleLocations = useMemo(() => {
    const cleanQuery = query.trim().toLowerCase()
    if (!cleanQuery) return locations
    return locations.filter((location) => [
      location.locationTitle,
      location.address,
      location.storeCode,
      location.accountTitle,
    ].some((value) => String(value || '').toLowerCase().includes(cleanQuery)))
  }, [locations, query])

  const currentIndex = stepIndex(step)
  const locationTitle = status?.connection?.locationTitle || 'your selected location'

  return (
    <main className="ga-shell">
      <a className="ga-skip" href="#google-activation-panel">Skip to Google setup</a>
      <header className="ga-header">
        <Link aria-label="AURA home" className="ga-wordmark" to="/">AURA</Link>
        <Link className="ga-finish-later" to="/dashboard">Finish later</Link>
      </header>

      <section aria-labelledby="google-activation-title" className="ga-panel" id="google-activation-panel">
        <div className="ga-progress" role="list" aria-label="Google setup progress">
          {steps.map((item, index) => (
            <div className={`ga-progress-item ${index <= currentIndex ? 'is-current' : ''}`} key={item.key} role="listitem">
              <span>{index < currentIndex ? <Check aria-hidden="true" size={13} /> : index + 1}</span>
              <small>{item.label}</small>
            </div>
          ))}
        </div>

        <div aria-live="polite" className="ga-message-slot">
          {errorMessage ? (
            <div className="ga-alert" role="alert">
              <span>{errorMessage}</span>
              <button aria-label="Dismiss message" onClick={() => setErrorMessage('')} type="button"><X aria-hidden="true" size={16} /></button>
            </div>
          ) : null}
        </div>

        {step === 'loading' ? (
          <div aria-busy="true" className="ga-loading">
            <RefreshCw aria-hidden="true" className="animate-spin" size={22} /> Checking your AURA setup…
          </div>
        ) : null}

        {step === 'connect' ? (
          <div className="ga-step ga-connect-step">
            <p className="ga-kicker">A separate Google permission</p>
            <h1 id="google-activation-title" ref={headingRef} tabIndex={-1}>Connect the profile AURA will look after.</h1>
            <p className="ga-lead">Signing in to AURA created your account. This next Google screen is different: it asks whether AURA may read reviews and publish only the replies you personally approve.</p>

            <div className="ga-permission-grid">
              <article>
                <span>1</span>
                <h2>AURA sign-in</h2>
                <p>Confirms who you are and opens your private workspace.</p>
              </article>
              <article>
                <span>2</span>
                <h2>Business Profile access</h2>
                <p>Lets AURA read managed locations and send a reply only after you confirm it.</p>
              </article>
            </div>

            <div className="ga-assurance">
              <ShieldCheck aria-hidden="true" size={20} />
              <p>Google grants permission at account level. AURA will actively use only the single location you choose next. There is no automatic-publish job.</p>
            </div>

            <button className="ga-primary" disabled={isBusy} onClick={startGoogleConnection} type="button">
              {isBusy ? <RefreshCw aria-hidden="true" className="animate-spin" size={17} /> : <Building2 aria-hidden="true" size={17} />}
              {status?.connection?.status === 'reconnect_required' ? 'Reconnect Google Business Profile' : 'Connect Google Business Profile'}
            </button>
          </div>
        ) : null}

        {step === 'locations' ? (
          <div className="ga-step">
            <p className="ga-kicker">Choose one location</p>
            <h1 id="google-activation-title" ref={headingRef} tabIndex={-1}>Which business should AURA use?</h1>
            <p className="ga-lead">Google has granted access to the managed account. AURA will import and work with only the location you confirm here.</p>

            {locations.length ? (
              <>
                <div className="ga-search">
                  <Search aria-hidden="true" size={17} />
                  <label className="sr-only" htmlFor="google-location-search">Search locations</label>
                  <input
                    id="google-location-search"
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search business, address or store code"
                    ref={searchRef}
                    value={query}
                  />
                  {query ? (
                    <button aria-label="Clear location search" onClick={() => { setQuery(''); searchRef.current?.focus() }} type="button"><X aria-hidden="true" size={16} /></button>
                  ) : null}
                </div>

                <fieldset className="ga-location-list">
                  <legend className="sr-only">Google Business Profile locations</legend>
                  {visibleLocations.map((location) => {
                    const key = `${location.accountName}|${location.locationName}`
                    const selected = selectedKey === key
                    return (
                      <label className={`ga-location-card ${selected ? 'is-selected' : ''}`} key={key}>
                        <input checked={selected} name="google-location" onChange={() => setSelectedKey(key)} type="radio" value={key} />
                        <span className="ga-location-marker"><MapPin aria-hidden="true" size={19} /></span>
                        <span className="ga-location-copy">
                          <strong>{location.locationTitle}</strong>
                          <span>{location.address || 'Address not supplied by Google'}</span>
                          <small>{location.accountTitle}{location.storeCode ? ` · Store code ${location.storeCode}` : ''}</small>
                        </span>
                        {selected ? <CheckCircle2 aria-hidden="true" className="ga-selected-icon" size={20} /> : null}
                      </label>
                    )
                  })}
                </fieldset>

                {!visibleLocations.length ? (
                  <div className="ga-empty-state">
                    <p>No locations match “{query}”.</p>
                    <button onClick={() => { setQuery(''); searchRef.current?.focus() }} type="button">Clear search</button>
                  </div>
                ) : null}

                <div className="ga-actions">
                  <button className="ga-secondary" disabled={isBusy} onClick={cancelSelection} type="button"><ArrowLeft aria-hidden="true" size={16} /> Cancel</button>
                  <button className="ga-primary" disabled={isBusy || !selectedKey} onClick={confirmLocation} type="button">
                    {isBusy ? 'Confirming…' : 'Use this location'} <ArrowRight aria-hidden="true" size={16} />
                  </button>
                </div>
              </>
            ) : (
              <div className="ga-empty-state ga-empty-state-large">
                <Building2 aria-hidden="true" size={28} />
                <h2>No Business Profile locations found</h2>
                <p>This Google account does not currently return a managed location. Try another Google account, or check that the business profile is verified and you are an owner or manager.</p>
                <button className="ga-primary" disabled={isBusy} onClick={startGoogleConnection} type="button">Try another Google account</button>
              </div>
            )}
          </div>
        ) : null}

        {step === 'tone' ? (
          <div className="ga-step ga-form-step">
            <p className="ga-kicker">Voice, timing and alerts</p>
            <h1 id="google-activation-title" ref={headingRef} tabIndex={-1}>Teach AURA what an approved reply sounds like.</h1>
            <p className="ga-lead">AURA generates a draft as soon as a new review is found. Your timing choice is a recommendation, never a publishing lock.</p>
            <GoogleReplySettingsForm
              initialSettings={status?.settings || defaultSettings}
              onSubmit={saveSettingsAndImport}
              submitLabel="Save and import reviews"
            />
          </div>
        ) : null}

        {step === 'import' ? (
          <div className="ga-step ga-centred-step">
            <span className="ga-large-icon"><RefreshCw aria-hidden="true" className={isBusy ? 'animate-spin' : ''} size={28} /></span>
            <p className="ga-kicker">Importing review history</p>
            <h1 id="google-activation-title" ref={headingRef} tabIndex={-1}>Bringing in {locationTitle}.</h1>
            <p className="ga-lead">AURA is importing the complete available history. Old reviews will appear in the workspace, but they will not create drafts or emails.</p>
            {!isBusy && errorMessage ? <button className="ga-primary" onClick={retryImport} type="button"><RefreshCw aria-hidden="true" size={17} /> Retry import</button> : null}
          </div>
        ) : null}

        {step === 'complete' ? (
          <div className="ga-step ga-centred-step">
            <span className="ga-large-icon ga-complete-icon"><CheckCircle2 aria-hidden="true" size={30} /></span>
            <p className="ga-kicker">Draft-only mode is ready</p>
            <h1 id="google-activation-title" ref={headingRef} tabIndex={-1}>AURA is watching {locationTitle}.</h1>
            <p className="ga-lead">{importCount ? `${importCount} reviews were imported. ` : ''}AURA will check every 15 minutes. New reviews can generate drafts and alerts; nothing can reach Google until you review and confirm it.</p>
            <div className="ga-assurance">
              <ShieldCheck aria-hidden="true" size={20} />
              <p>Save draft and Publish to Google are separate actions throughout AURA.</p>
            </div>
            <div className="ga-actions ga-actions-centred">
              <Link className="ga-secondary" to="/dashboard/settings">Review settings</Link>
              <Link className="ga-primary" to="/dashboard/reviews">Open review drafts <ArrowRight aria-hidden="true" size={16} /></Link>
            </div>
          </div>
        ) : null}
      </section>
    </main>
  )
}
