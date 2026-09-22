/* global Buffer, process */

import crypto from 'node:crypto'
import { createClient } from '@supabase/supabase-js'
import { isFeatureEnabled } from './google-review-workflow.js'
import { requireAuraUser } from './places.js'

const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'
const GOOGLE_ACCOUNTS_URL = 'https://mybusinessaccountmanagement.googleapis.com/v1/accounts'
const GOOGLE_LOCATIONS_URL = 'https://mybusinessbusinessinformation.googleapis.com/v1'
const GOOGLE_REVIEWS_URL = 'https://mybusiness.googleapis.com/v4'
const GOOGLE_OAUTH_SESSION_COOKIE = '__Host-aura_google_oauth'

export function googleHttpError(status, message, code, details) {
  const error = new Error(message)
  error.status = status
  error.code = code
  error.details = details
  return error
}

export function getGoogleConfig() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY
  const config = {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    redirectUri: process.env.GOOGLE_REDIRECT_URI,
    stateSecret: process.env.GOOGLE_OAUTH_STATE_SECRET,
    tokenSecret: process.env.GOOGLE_TOKEN_ENCRYPTION_KEY,
    supabaseUrl,
    supabaseAnonKey,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    features: {
      connection: isFeatureEnabled(process.env.AURA_GOOGLE_CONNECTION_ENABLED, true),
      draftGeneration: isFeatureEnabled(process.env.AURA_GOOGLE_DRAFTS_ENABLED, true),
      manualPublish: isFeatureEnabled(process.env.AURA_GOOGLE_MANUAL_PUBLISH_ENABLED, true),
      syncing: isFeatureEnabled(process.env.AURA_GOOGLE_SYNC_ENABLED, true),
    },
  }

  const missing = Object.entries(config)
    .filter(([key, value]) => key !== 'features' && !value)
    .map(([key]) => key)

  if (missing.length) {
    throw googleHttpError(
      503,
      'Google Business Profile is not fully configured yet.',
      'GOOGLE_NOT_CONFIGURED',
      { missing },
    )
  }
  return config
}

export function assertGoogleFeature(config, feature) {
  if (config.features?.[feature] !== false) return
  throw googleHttpError(
    503,
    'This Google Business Profile feature is temporarily paused. Your stored data has not been removed.',
    `GOOGLE_${String(feature).toUpperCase()}_DISABLED`,
  )
}

export function getGoogleAdminClient(config = getGoogleConfig()) {
  return createClient(config.supabaseUrl, config.serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

export async function requireGoogleUser(request) {
  const user = await requireAuraUser(request)
  const config = getGoogleConfig()
  const admin = getGoogleAdminClient(config)
  const { data: existingProfile, error } = await admin
    .from('business_profiles')
    .select('id,user_id,business_name,created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw googleHttpError(500, 'AURA could not load your business.', 'BUSINESS_LOOKUP_FAILED')
  let businessProfile = existingProfile
  if (!businessProfile) {
    const fallbackName = String(
      user.user_metadata?.business_name || user.user_metadata?.company_name || 'My Business',
    ).trim()
    const { data: created, error: createError } = await admin
      .from('business_profiles')
      .insert({ business_name: fallbackName || 'My Business', user_id: user.id })
      .select('id,user_id,business_name,created_at')
      .single()
    if (createError) {
      throw googleHttpError(500, 'AURA could not create your business workspace.', 'BUSINESS_CREATE_FAILED')
    }
    businessProfile = created
  }

  return { admin, businessProfile, config, user }
}

function stateKey(secret) {
  return crypto.createHash('sha256').update(secret).digest()
}

export function createOAuthState(payload, secret, now = Date.now()) {
  const encoded = Buffer.from(JSON.stringify({
    ...payload,
    expiresAt: now + 10 * 60 * 1000,
    nonce: crypto.randomBytes(18).toString('base64url'),
  })).toString('base64url')
  const signature = crypto.createHmac('sha256', stateKey(secret)).update(encoded).digest('base64url')
  return `${encoded}.${signature}`
}

export function verifyOAuthState(state, secret, now = Date.now()) {
  const [encoded, signature] = String(state || '').split('.')
  if (!encoded || !signature) throw googleHttpError(400, 'Google connection state is invalid.', 'INVALID_OAUTH_STATE')

  const expected = crypto.createHmac('sha256', stateKey(secret)).update(encoded).digest()
  const received = Buffer.from(signature, 'base64url')
  if (received.length !== expected.length || !crypto.timingSafeEqual(received, expected)) {
    throw googleHttpError(400, 'Google connection state is invalid.', 'INVALID_OAUTH_STATE')
  }

  let payload
  try {
    payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'))
  } catch {
    throw googleHttpError(400, 'Google connection state is invalid.', 'INVALID_OAUTH_STATE')
  }
  if (!payload.expiresAt || payload.expiresAt < now) {
    throw googleHttpError(400, 'Google connection has expired. Please try again.', 'EXPIRED_OAUTH_STATE')
  }
  return payload
}

function googleOAuthStateDigest(state) {
  return crypto.createHash('sha256').update(String(state || '')).digest('base64url')
}

export function createGoogleOAuthSession(state, secret, now = Date.now()) {
  const verifier = crypto.randomBytes(32).toString('base64url')
  const value = encryptGoogleToken(JSON.stringify({
    expiresAt: now + 10 * 60 * 1000,
    stateDigest: googleOAuthStateDigest(state),
    verifier,
  }), secret)
  return {
    challenge: crypto.createHash('sha256').update(verifier).digest('base64url'),
    cookie: `${GOOGLE_OAUTH_SESSION_COOKIE}=${value}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600`,
  }
}

export function clearGoogleOAuthSessionCookie() {
  return `${GOOGLE_OAUTH_SESSION_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`
}

function readRequestCookie(request, name) {
  const cookies = String(request?.headers?.cookie || '').split(';')
  for (const cookie of cookies) {
    const separator = cookie.indexOf('=')
    if (separator < 0) continue
    if (cookie.slice(0, separator).trim() === name) return cookie.slice(separator + 1).trim()
  }
  return ''
}

export function requireGoogleOAuthSession(request, state, secret, now = Date.now()) {
  const value = readRequestCookie(request, GOOGLE_OAUTH_SESSION_COOKIE)
  if (!value) {
    throw googleHttpError(400, 'Start the Google connection from this AURA browser.', 'INVALID_OAUTH_BROWSER_SESSION')
  }

  let session
  try {
    session = JSON.parse(decryptGoogleToken(value, secret))
  } catch {
    throw googleHttpError(400, 'Start the Google connection from this AURA browser.', 'INVALID_OAUTH_BROWSER_SESSION')
  }
  const expectedDigest = googleOAuthStateDigest(state)
  const receivedDigest = String(session.stateDigest || '')
  const expected = Buffer.from(expectedDigest)
  const received = Buffer.from(receivedDigest)
  if (
    !session.expiresAt || session.expiresAt < now ||
    !session.verifier || received.length !== expected.length ||
    !crypto.timingSafeEqual(received, expected)
  ) {
    throw googleHttpError(400, 'Start the Google connection from this AURA browser.', 'INVALID_OAUTH_BROWSER_SESSION')
  }
  return session.verifier
}

function tokenKey(secret) {
  return crypto.createHash('sha256').update(secret).digest()
}

export function encryptGoogleToken(value, secret) {
  if (!value) return null
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv('aes-256-gcm', tokenKey(secret), iv)
  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return ['v1', iv.toString('base64url'), tag.toString('base64url'), encrypted.toString('base64url')].join('.')
}

export function decryptGoogleToken(value, secret) {
  if (!value) return null
  const [version, iv, tag, encrypted] = String(value).split('.')
  if (version !== 'v1' || !iv || !tag || !encrypted) {
    throw googleHttpError(500, 'Stored Google credentials could not be read.', 'INVALID_STORED_TOKEN')
  }
  const decipher = crypto.createDecipheriv('aes-256-gcm', tokenKey(secret), Buffer.from(iv, 'base64url'))
  decipher.setAuthTag(Buffer.from(tag, 'base64url'))
  return Buffer.concat([
    decipher.update(Buffer.from(encrypted, 'base64url')),
    decipher.final(),
  ]).toString('utf8')
}

async function readGoogleResponse(response, fallbackMessage) {
  const payload = await response.json().catch(() => ({}))
  if (response.ok) return payload

  const googleMessage = payload?.error?.message || fallbackMessage
  const googleStatus = payload?.error?.status || ''
  const approvalBlocked = response.status === 403 && /quota|not enabled/i.test(googleMessage)
  if (approvalBlocked) {
    throw googleHttpError(
      403,
      'Google has not enabled Business Profile API access for this Cloud project.',
      'GOOGLE_API_APPROVAL_REQUIRED',
      { googleMessage, googleStatus },
    )
  }
  const reconnectRequired = response.status === 401 || /invalid_grant|revoked|expired/i.test(googleMessage)
  if (reconnectRequired) {
    throw googleHttpError(401, 'Reconnect Google Business Profile to continue.', 'GOOGLE_RECONNECT_REQUIRED')
  }
  throw googleHttpError(response.status, googleMessage, 'GOOGLE_API_ERROR', { googleStatus })
}

export async function googleRequest(url, accessToken, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    signal: AbortSignal.timeout(15_000),
  })
  return readGoogleResponse(response, 'Google could not complete that request.')
}

export async function exchangeGoogleCode(code, config, codeVerifier) {
  const response = await fetch(GOOGLE_TOKEN_URL, {
    body: new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      code,
      code_verifier: codeVerifier,
      grant_type: 'authorization_code',
      redirect_uri: config.redirectUri,
    }),
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    method: 'POST',
    signal: AbortSignal.timeout(15_000),
  })
  return readGoogleResponse(response, 'Google could not finish connecting your account.')
}

function formattedAddress(location) {
  const address = location?.storefrontAddress
  if (!address) return ''
  return [
    ...(address.addressLines || []),
    address.locality,
    address.administrativeArea,
    address.postalCode,
    address.regionCode,
  ].filter(Boolean).join(', ')
}

export function publicGoogleLocation(account, location) {
  return {
    accountName: account.name,
    accountTitle: account.accountName || account.name,
    address: formattedAddress(location),
    locationName: location.name,
    locationTitle: location.title || location.storeCode || location.name,
    storeCode: location.storeCode || '',
  }
}

export async function discoverGoogleLocations(accessToken) {
  const accounts = []
  let accountPageToken = ''
  do {
    const accountsUrl = new URL(GOOGLE_ACCOUNTS_URL)
    accountsUrl.searchParams.set('pageSize', '20')
    if (accountPageToken) accountsUrl.searchParams.set('pageToken', accountPageToken)
    const accountPayload = await googleRequest(accountsUrl.toString(), accessToken)
    accounts.push(...(accountPayload.accounts || []))
    accountPageToken = accountPayload.nextPageToken || ''
  } while (accountPageToken && accounts.length < 200)

  if (!accounts.length) {
    throw googleHttpError(404, 'This Google account does not manage a Business Profile.', 'NO_GOOGLE_ACCOUNTS')
  }

  const candidates = []
  for (const account of accounts) {
    let locationPageToken = ''
    do {
      const url = new URL(`${GOOGLE_LOCATIONS_URL}/${account.name}/locations`)
      url.searchParams.set('readMask', 'name,title,storeCode,storefrontAddress,metadata')
      url.searchParams.set('pageSize', '100')
      if (locationPageToken) url.searchParams.set('pageToken', locationPageToken)
      const locationPayload = await googleRequest(url.toString(), accessToken)
      candidates.push(...(locationPayload.locations || []).map((location) => ({ account, location })))
      locationPageToken = locationPayload.nextPageToken || ''
    } while (locationPageToken && candidates.length < 1000)
  }

  return candidates
}

export async function discoverGoogleLocation(accessToken) {
  const [candidate] = await discoverGoogleLocations(accessToken)
  if (!candidate) {
    throw googleHttpError(404, 'No Google Business Profile locations were found for this account.', 'NO_GOOGLE_LOCATIONS')
  }
  return candidate
}

export async function getGoogleConnection(admin, userId, options = {}) {
  const status = options.status || 'active'
  let query = admin
    .from('google_connections')
    .select('*')
    .eq('user_id', userId)
    .eq('status', status)
    .order('connected_at', { ascending: false })
    .limit(1)
  if (options.businessProfileId) query = query.eq('business_profile_id', options.businessProfileId)
  const { data, error } = await query.maybeSingle()

  if (error) throw googleHttpError(500, 'AURA could not read the Google connection.', 'GOOGLE_CONNECTION_LOOKUP_FAILED')
  if (!data && options.required !== false) {
    throw googleHttpError(409, 'Connect Google Business Profile first.', 'GOOGLE_NOT_CONNECTED')
  }
  return data || null
}

export async function markConnectionReconnectRequired(admin, connection, errorCode = 'GOOGLE_RECONNECT_REQUIRED') {
  if (!connection?.id) return
  await admin
    .from('google_connections')
    .update({
      active: false,
      last_error_code: errorCode,
      reconnect_required_at: new Date().toISOString(),
      status: 'reconnect_required',
      updated_at: new Date().toISOString(),
    })
    .eq('id', connection.id)
    .in('status', ['active', 'pending_selection'])
}

export async function claimGoogleConnectionOperation(admin, connectionId, purpose, ttlSeconds = 120) {
  const ownerId = crypto.randomUUID()
  const { data, error } = await admin.rpc('claim_google_connection_operation', {
    p_connection_id: connectionId,
    p_owner_id: ownerId,
    p_purpose: purpose,
    p_ttl_seconds: ttlSeconds,
  })
  if (error) throw error
  return data ? ownerId : null
}

export async function releaseGoogleConnectionOperation(admin, connectionId, ownerId) {
  if (!connectionId || !ownerId) return
  const { error } = await admin.rpc('release_google_connection_operation', {
    p_connection_id: connectionId,
    p_owner_id: ownerId,
  })
  if (error) console.error('[AURA Google lease release]', error.code || error.message)
}

export async function getFreshGoogleAccessToken(admin, connection, config) {
  const expiresAt = connection.token_expires_at ? new Date(connection.token_expires_at).getTime() : 0
  if (expiresAt > Date.now() + 60_000) {
    return decryptGoogleToken(connection.access_token_encrypted, config.tokenSecret)
  }

  const refreshToken = decryptGoogleToken(connection.refresh_token_encrypted, config.tokenSecret)
  if (!refreshToken) {
    await markConnectionReconnectRequired(admin, connection)
    throw googleHttpError(401, 'Reconnect Google Business Profile to renew access.', 'GOOGLE_RECONNECT_REQUIRED')
  }

  try {
    const response = await fetch(GOOGLE_TOKEN_URL, {
      body: new URLSearchParams({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      method: 'POST',
      signal: AbortSignal.timeout(15_000),
    })
    const tokenPayload = await readGoogleResponse(response, 'Google access could not be renewed.')
    const tokenExpiresAt = new Date(Date.now() + Number(tokenPayload.expires_in || 3600) * 1000).toISOString()
    const { data: updatedConnection, error } = await admin
      .from('google_connections')
      .update({
        access_token_encrypted: encryptGoogleToken(tokenPayload.access_token, config.tokenSecret),
        last_error_code: null,
        token_expires_at: tokenExpiresAt,
        updated_at: new Date().toISOString(),
      })
      .eq('id', connection.id)
      .eq('status', connection.status)
      .select('id')
      .maybeSingle()
    if (error) throw googleHttpError(500, 'AURA could not securely save renewed Google access.', 'TOKEN_SAVE_FAILED')
    if (!updatedConnection) {
      throw googleHttpError(409, 'The Google connection changed while access was being renewed.', 'GOOGLE_CONNECTION_CHANGED')
    }
    return tokenPayload.access_token
  } catch (error) {
    if (error.code === 'GOOGLE_RECONNECT_REQUIRED') {
      await markConnectionReconnectRequired(admin, connection, error.code)
    }
    throw error
  }
}

export function googleReviewsUrl(connection) {
  const account = String(connection.google_account_name || '').replace(/^\/+|\/+$/g, '')
  const location = String(connection.google_location_name || '').replace(/^\/+|\/+$/g, '')
  if (!/^accounts\/[^/]+$/.test(account) || !/^locations\/[^/]+$/.test(location)) {
    throw googleHttpError(500, 'The saved Google location is invalid.', 'INVALID_GOOGLE_LOCATION')
  }
  return `${GOOGLE_REVIEWS_URL}/${account}/${location}/reviews`
}

export function googleReviewUrl(reviewName) {
  const cleanName = String(reviewName || '').replace(/^\/+|\/+$/g, '')
  if (!/^accounts\/[^/]+\/locations\/[^/]+\/reviews\/[^/]+$/.test(cleanName)) {
    throw googleHttpError(500, 'The saved Google review is invalid.', 'INVALID_GOOGLE_REVIEW')
  }
  return `${GOOGLE_REVIEWS_URL}/${cleanName}`
}

export function googleRatingToNumber(value) {
  return ({ ONE: 1, TWO: 2, THREE: 3, FOUR: 4, FIVE: 5 })[value] || Number(value) || 0
}

export function publicGoogleConnection(row) {
  if (!row) return null
  return {
    accountTitle: row.google_account_title || '',
    connectedAt: row.connected_at,
    id: row.id,
    lastErrorCode: row.last_error_code || null,
    lastSyncedAt: row.last_synced_at || null,
    locationAddress: row.google_location_address || '',
    locationStoreCode: row.google_location_store_code || '',
    locationTitle: row.google_location_title || '',
    selectedAt: row.selected_at || null,
    selectionExpiresAt: row.selection_expires_at || null,
    status: row.status,
  }
}

export function publicGoogleDraft(row) {
  if (!row) return null
  return {
    createdAt: row.created_at,
    editedText: row.edited_text || '',
    generatedText: row.generated_text || '',
    id: row.id,
    lastErrorCode: row.last_error_code || null,
    lastErrorMessage: row.last_error_message || null,
    notificationStatus: row.notification_status,
    publishedAt: row.published_at || null,
    status: row.status,
    suggestedPublishAt: row.suggested_publish_at,
    updatedAt: row.updated_at,
    version: Number(row.version || 1),
  }
}

export function publicGoogleReview(row) {
  const joinedDraft = Array.isArray(row.google_review_drafts)
    ? row.google_review_drafts[0]
    : row.google_review_drafts
  return {
    aura_reply: row.reply_comment || '',
    aura_reply_updated_at: row.reply_updated_at,
    created_at: row.review_created_at,
    customer_name: row.reviewer_name || 'Google reviewer',
    draft: publicGoogleDraft(joinedDraft),
    draft_eligible: Boolean(row.draft_eligible),
    first_seen_at: row.first_seen_at,
    google_review_name: row.google_review_name,
    id: row.id,
    mentioned_staff: [],
    rating: Number(row.rating || 0),
    source: 'google_business',
    text: row.comment || '',
  }
}
