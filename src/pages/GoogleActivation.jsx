import {
  ArrowRight,
  Building2,
  Check,
  CheckCircle2,
  Circle,
  MapPin,
  RefreshCw,
  Search,
  ShieldCheck,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import GoogleSetupConversationForm from '../components/GoogleSetupConversationForm'
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

const sections = ['Connect Google', 'Your voice', 'Your routine', 'Ready']

function callbackMessage(detail) {
  const messages = {
    approval_required: 'Google Business Profile access is not available for this Cloud project yet.',
    connection_failed: 'That Google connection expired before it finished.',
    google_error: 'Google returned an error before the connection completed.',
    missing_code: 'That Google connection expired before it finished.',
    permission_denied: 'No problem—AURA wasn’t given access. Nothing changed.',
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
  if (['locations', 'no-locations', 'one-location'].includes(mode)) {
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
  if (mode === 'revoked') {
    return {
      connected: false,
      connection: { ...activeConnection, status: 'reconnect_required' },
      needsSetup: true,
      pendingConnection: null,
      settings: defaultSettings,
    }
  }
  return { connected: false, connection: null, needsSetup: true, pendingConnection: null, settings: defaultSettings }
}

function deriveStep(status) {
  if (status?.pendingConnection) return 'locations'
  if (status?.connection?.status === 'reconnect_required') return 'connect'
  if (status?.connected && !status.settings?.setupComplete) return 'tone'
  if (status?.connected && !status.connection?.lastSyncedAt) return 'import'
  if (status?.connected) return 'complete'
  return 'connect'
}

function progressFor(step, conversationProgress) {
  if (step === 'locations') return { sectionIndex: 0, sectionLabel: 'Connect Google', position: 2, total: 2 }
  if (step === 'tone') return conversationProgress
  if (step === 'import') return { sectionIndex: 3, sectionLabel: 'Ready', position: 2, total: 3 }
  if (step === 'complete') return { sectionIndex: 3, sectionLabel: 'Ready', position: 3, total: 3 }
  return { sectionIndex: 0, sectionLabel: 'Connect Google', position: 1, total: 2 }
}

export default function GoogleActivation() {
  const [searchParams] = useSearchParams()
  const visualMode = import.meta.env.DEV ? searchParams.get('visual') : null
  const isVisualDemo = Boolean(visualMode)
  const googleResult = searchParams.get('google')
  const googleDetail = searchParams.get('detail')
  const headingRef = useRef(null)
  const searchRef = useRef(null)
  const automaticImportRef = useRef(false)
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
  const [conversationProgress, setConversationProgress] = useState({ sectionIndex: 1, sectionLabel: 'Your voice', position: 1, total: 6 })

  useEffect(() => {
    document.title = 'Connect Google — AURA'
  }, [])

  async function loadLocations(signal) {
    setIsBusy(true)
    setErrorMessage('')
    try {
      const payload = isVisualDemo
        ? { locations: visualMode === 'no-locations' ? [] : visualMode === 'one-location' ? demoLocations.slice(0, 1) : demoLocations }
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
    if (['loading', 'tone'].includes(step)) return
    window.requestAnimationFrame(() => headingRef.current?.focus({ preventScroll: true }))
  }, [step])

  useEffect(() => {
    const controller = new AbortController()
    async function load() {
      if (isVisualDemo) {
        const nextStatus = visualStatus(visualMode)
        setStatus(nextStatus)
        const nextStep = ['denied', 'connect', 'revoked'].includes(visualMode) ? 'connect' : deriveStep(nextStatus)
        setStep(visualMode === 'import' ? 'import' : nextStep)
        if (nextStep === 'locations') {
          const visualLocations = visualMode === 'no-locations' ? [] : visualMode === 'one-location' ? demoLocations.slice(0, 1) : demoLocations
          setLocations(visualLocations)
          setSelectedKey(visualLocations.length === 1 ? `${visualLocations[0].accountName}|${visualLocations[0].locationName}` : '')
        }
        return
      }

      try {
        const nextStatus = await callAuraApi('/api/google-status', null, 'GET', controller.signal)
        setStatus(nextStatus)
        const nextStep = deriveStep(nextStatus)
        setStep(nextStep)
        if (nextStep === 'locations' || googleResult === 'select_location') await loadLocations(controller.signal)
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
        setSelectedKey('')
        setStep('locations')
        return
      }
      const { url } = await callAuraApi('/api/google-oauth-start', {})
      window.location.assign(url)
    } catch (error) {
      setErrorMessage(error.message)
    } finally {
      if (isVisualDemo) setIsBusy(false)
    }
  }

  async function useDifferentGoogleAccount() {
    setIsBusy(true)
    setErrorMessage('')
    try {
      if (isVisualDemo) {
        setStatus(visualStatus('connect'))
        setLocations([])
        setStep('connect')
        return
      }
      await callAuraApi('/api/google-disconnect', { mode: 'cancel_pending' })
      const { url } = await callAuraApi('/api/google-oauth-start', {})
      window.location.assign(url)
    } catch (error) {
      setErrorMessage(error.message)
    } finally {
      if (isVisualDemo) setIsBusy(false)
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
        nextStatus.connection = {
          ...nextStatus.connection,
          accountTitle: selected.accountTitle,
          locationAddress: selected.address,
          locationStoreCode: selected.storeCode,
          locationTitle: selected.locationTitle,
        }
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
      await new Promise((resolve) => window.setTimeout(resolve, 700))
      setImportCount(148)
      setIsBusy(false)
      setStep('complete')
      return
    }

    const payload = await callAuraApi('/api/google-settings', values, 'PATCH')
    setStatus((current) => ({ ...current, settings: payload.settings }))
    setStep('import')
    setIsBusy(true)
    try {
      const result = await callAuraApi('/api/google-reviews', {})
      setImportCount(result.count || 0)
      setStatus((current) => ({ ...current, connection: { ...current.connection, lastSyncedAt: result.syncedAt } }))
      setStep('complete')
    } catch (error) {
      setErrorMessage('Your setup is saved, but the review import didn’t finish.')
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
        setStep('complete')
        return
      }
      const result = await callAuraApi('/api/google-reviews', {})
      setImportCount(result.count || 0)
      setStatus((current) => ({ ...current, connection: { ...current.connection, lastSyncedAt: result.syncedAt } }))
      setStep('complete')
    } catch {
      setErrorMessage('Your setup is saved, but the review import didn’t finish.')
    } finally {
      setIsBusy(false)
    }
  }

  useEffect(() => {
    if (step !== 'import' || isVisualDemo || isBusy || errorMessage || automaticImportRef.current) return
    automaticImportRef.current = true
    retryImport()
    // Retry is intentionally started once when resuming an already-saved setup.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step])

  const visibleLocations = useMemo(() => {
    const cleanQuery = query.trim().toLowerCase()
    if (!cleanQuery) return locations
    return locations.filter((location) => [location.locationTitle, location.address, location.storeCode, location.accountTitle]
      .some((value) => String(value || '').toLowerCase().includes(cleanQuery)))
  }, [locations, query])

  const progress = progressFor(step, conversationProgress)
  const locationTitle = status?.connection?.locationTitle || 'your selected location'
  const isReconnect = status?.connection?.status === 'reconnect_required'
  const connectionExpired = ['connection_failed', 'missing_code'].includes(googleDetail)
  const notificationsEnabled = status?.settings?.notificationsEnabled !== false

  return (
    <main className="ga-shell">
      <a className="ga-skip" href="#google-activation-panel">Skip to Google setup</a>
      <header className="ga-header">
        <Link aria-label="AURA home" className="ga-wordmark" to="/">AURA</Link>
        <Link className="ga-finish-later" to="/dashboard">Finish later</Link>
      </header>

      <section aria-labelledby="google-activation-title" className="ga-panel" id="google-activation-panel">
        <div className="ga-progress-header">
          <div className="ga-progress-copy"><strong>{progress.sectionLabel}</strong><span>{progress.position} of {progress.total}</span></div>
          <div aria-label={`Section ${progress.sectionIndex + 1} of ${sections.length}: ${progress.sectionLabel}`} aria-valuemax="4" aria-valuemin="1" aria-valuenow={progress.sectionIndex + 1} className="ga-progress-track" role="progressbar">
            {sections.map((section, index) => <span className={`${index < progress.sectionIndex ? 'is-complete' : ''} ${index === progress.sectionIndex ? 'is-current' : ''}`} key={section} />)}
          </div>
        </div>

        <div aria-live="polite" className="ga-message-slot">
          {errorMessage ? <div className="ga-alert" role="alert"><span>{errorMessage}</span><button aria-label="Dismiss message" onClick={() => setErrorMessage('')} type="button"><X aria-hidden="true" size={16} /></button></div> : null}
        </div>

        {step === 'loading' ? <div aria-busy="true" className="ga-loading"><RefreshCw aria-hidden="true" className="animate-spin" size={22} /> Checking your AURA setup…</div> : null}

        {step === 'connect' ? (
          <div className="ga-step ga-connect-step">
            <p className="ga-kicker">A separate Google permission</p>
            <h1 id="google-activation-title" ref={headingRef} tabIndex={-1}>
              {isReconnect ? `Google needs you to reconnect ${locationTitle}.` : connectionExpired ? 'That Google connection expired before it finished.' : 'Let’s connect the Business Profile you want AURA to look after.'}
              <span aria-hidden="true" className="ga-question-cursor" />
            </h1>
            <p className="ga-lead">{isReconnect ? 'Your reviews and drafts are still safe.' : 'You’ve already signed in to AURA. Google will now ask for separate permission to read your reviews and publish only the replies you personally approve.'}</p>
            <div className="ga-reassurance-grid" aria-label="Google setup assurances">
              <div><Building2 aria-hidden="true" size={18} /><strong>One location only</strong></div>
              <div><ShieldCheck aria-hidden="true" size={18} /><strong>Nothing posts automatically</strong></div>
            </div>
            <div className="ga-actions">
              <Link className="ga-secondary" to="/dashboard">I’ll do this later</Link>
              <button className="ga-primary" disabled={isBusy} onClick={startGoogleConnection} type="button">
                {isBusy ? <RefreshCw aria-hidden="true" className="animate-spin" size={17} /> : null}
                {isReconnect || connectionExpired ? 'Reconnect Google' : googleDetail === 'permission_denied' || visualMode === 'denied' ? 'Try again' : 'Continue to Google'}
                {!isBusy ? <ArrowRight aria-hidden="true" size={16} /> : null}
              </button>
            </div>
          </div>
        ) : null}

        {step === 'locations' ? (
          <div className="ga-step">
            <p className="ga-kicker">Choose one location</p>
            <h1 id="google-activation-title" ref={headingRef} tabIndex={-1}>Which business should AURA look after?<span aria-hidden="true" className="ga-question-cursor" /></h1>
            <p className="ga-lead">Google may show every profile this account manages. AURA will use only the location you choose.</p>
            {locations.length ? (
              <>
                {locations.length > 1 ? (
                  <div className="ga-search"><Search aria-hidden="true" size={17} /><label className="sr-only" htmlFor="google-location-search">Search locations</label><input id="google-location-search" onChange={(event) => setQuery(event.target.value)} placeholder="Search business, address or store code" ref={searchRef} value={query} />{query ? <button aria-label="Clear location search" onClick={() => { setQuery(''); searchRef.current?.focus() }} type="button"><X aria-hidden="true" size={16} /></button> : null}</div>
                ) : null}
                <fieldset className="ga-location-list">
                  <legend className="sr-only">Google Business Profile locations</legend>
                  {visibleLocations.map((location) => {
                    const key = `${location.accountName}|${location.locationName}`
                    const selected = selectedKey === key
                    return (
                      <label className={`ga-location-card ${selected ? 'is-selected' : ''}`} key={key}>
                        <input checked={selected} name="google-location" onChange={() => { setSelectedKey(key); setErrorMessage('') }} type="radio" value={key} />
                        <span className="ga-location-marker"><MapPin aria-hidden="true" size={19} /></span>
                        <span className="ga-location-copy"><strong>{location.locationTitle}</strong><span>{location.address || 'Address not supplied by Google'}</span><small>Google account: {location.accountTitle || location.accountName}</small><small>{location.storeCode ? `Store code: ${location.storeCode}` : 'No store code'}</small></span>
                        {selected ? <CheckCircle2 aria-hidden="true" className="ga-selected-icon" size={20} /> : null}
                      </label>
                    )
                  })}
                </fieldset>
                {!visibleLocations.length ? <div className="ga-empty-state"><p>No locations match “{query}”.</p><button onClick={() => { setQuery(''); searchRef.current?.focus() }} type="button">Clear search</button></div> : null}
                <div className="ga-actions"><button className="ga-secondary" disabled={isBusy} onClick={useDifferentGoogleAccount} type="button">Use a different Google account</button><button className="ga-primary" disabled={isBusy || !selectedKey} onClick={confirmLocation} type="button">{isBusy ? 'Confirming…' : 'Use this location'} {!isBusy ? <ArrowRight aria-hidden="true" size={16} /> : null}</button></div>
              </>
            ) : (
              <div className="ga-empty-state ga-empty-state-large">
                <Building2 aria-hidden="true" size={28} />
                <h2>We couldn’t find a Business Profile managed by this Google account.</h2>
                <div className="ga-actions ga-actions-centred"><a className="ga-secondary" href="https://support.google.com/business/answer/3403100" rel="noreferrer" target="_blank">Check my Google access</a><button className="ga-primary" disabled={isBusy} onClick={useDifferentGoogleAccount} type="button">Try another Google account</button></div>
              </div>
            )}
          </div>
        ) : null}

        {step === 'tone' ? <GoogleSetupConversationForm connectionId={status?.connection?.id} initialSettings={status?.settings || defaultSettings} location={status?.connection} onEditBusiness={startGoogleConnection} onProgressChange={setConversationProgress} onSubmit={saveSettingsAndImport} /> : null}

        {step === 'import' ? (
          <div className="ga-step ga-import-step">
            <p className="ga-kicker">Preparing your workspace</p>
            <h1 id="google-activation-title" ref={headingRef} tabIndex={-1}>We’re bringing in {locationTitle}’s reviews.<span aria-hidden="true" className="ga-question-cursor" /></h1>
            <p className="ga-lead">Past reviews will be visible, but they won’t create drafts or emails.</p>
            <div className="ga-import-list" aria-live="polite">
              <div className="is-complete"><Check aria-hidden="true" size={17} /><span><strong>Google connected</strong><small>{locationTitle}</small></span></div>
              <div className={isBusy ? 'is-active' : errorMessage ? 'has-error' : 'is-complete'}>{isBusy ? <RefreshCw aria-hidden="true" className="animate-spin" size={17} /> : errorMessage ? <X aria-hidden="true" size={17} /> : <Check aria-hidden="true" size={17} />}<span><strong>Importing review history</strong><small>{errorMessage ? 'Import needs another try' : isBusy ? 'This may take a moment' : 'Review history imported'}</small></span></div>
              <div className={!isBusy && !errorMessage ? 'is-complete' : ''}><Circle aria-hidden="true" size={17} /><span><strong>Preparing your workspace</strong><small>Draft-only controls stay in place</small></span></div>
            </div>
            {!isBusy && errorMessage ? <button className="ga-primary" onClick={retryImport} type="button"><RefreshCw aria-hidden="true" size={17} /> Retry import</button> : null}
          </div>
        ) : null}

        {step === 'complete' ? (
          <div className="ga-step ga-centred-step">
            <span className="ga-large-icon ga-complete-icon"><CheckCircle2 aria-hidden="true" size={30} /></span>
            <p className="ga-kicker">Setup complete</p>
            <h1 id="google-activation-title" ref={headingRef} tabIndex={-1}>AURA is ready for {locationTitle}.</h1>
            <p className="ga-lead">{importCount} past reviews are now visible. {notificationsEnabled ? 'New reviews can create drafts and alerts. ' : 'New reviews can create drafts and will wait in your dashboard. '}You choose if and when anything is published.</p>
            <div className="ga-assurance"><ShieldCheck aria-hidden="true" size={20} /><p>AURA will never publish a reply without you.</p></div>
            <div className="ga-actions ga-actions-centred"><Link className="ga-secondary" to="/dashboard/settings">Review settings</Link><Link className="ga-primary" to="/dashboard/reviews">Open my reviews <ArrowRight aria-hidden="true" size={16} /></Link></div>
          </div>
        ) : null}
      </section>
    </main>
  )
}
