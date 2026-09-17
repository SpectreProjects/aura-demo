/* global Buffer, process */

import crypto from 'node:crypto'
import { createClient } from '@supabase/supabase-js'
import { requireAuraUser } from './places.js'

const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'
const GOOGLE_ACCOUNTS_URL = 'https://mybusinessaccountmanagement.googleapis.com/v1/accounts'
const GOOGLE_LOCATIONS_URL = 'https://mybusinessbusinessinformation.googleapis.com/v1'
const GOOGLE_REVIEWS_URL = 'https://mybusiness.googleapis.com/v4'

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
  }

  const missing = Object.entries(config)
    .filter(([, value]) => !value)
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

export function getGoogleAdminClient(config = getGoogleConfig()) {
  return createClient(config.supabaseUrl, config.serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

export async function requireGoogleUser(request) {
  const user = await requireAuraUser(request)
  const config = getGoogleConfig()
  const admin = getGoogleAdminClient(config)
  const { data: businessProfile, error } = await admin
    .from('business_profiles')
    .select('id,user_id,business_name')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw googleHttpError(500, 'AURA could not load your business.', 'BUSINESS_LOOKUP_FAILED')
  if (!businessProfile) {
    throw googleHttpError(409, 'Finish creating your AURA business before connecting Google.', 'BUSINESS_REQUIRED')
  }

  return { admin, businessProfile, config, user }
}

function stateKey(secret) {
  return crypto.createHash('sha256').update(secret).digest()
}

export function createOAuthState(payload, secret) {
  const encoded = Buffer.from(JSON.stringify({
    ...payload,
    expiresAt: Date.now() + 10 * 60 * 1000,
    nonce: crypto.randomBytes(18).toString('base64url'),
  })).toString('base64url')
  const signature = crypto.createHmac('sha256', stateKey(secret)).update(encoded).digest('base64url')
  return `${encoded}.${signature}`
}

export function verifyOAuthState(state, secret) {
  const [encoded, signature] = String(state || '').split('.')
  if (!encoded || !signature) throw googleHttpError(400, 'Google connection state is invalid.', 'INVALID_OAUTH_STATE')

  const expected = crypto.createHmac('sha256', stateKey(secret)).update(encoded).digest()
  const received = Buffer.from(signature, 'base64url')
  if (received.length !== expected.length || !crypto.timingSafeEqual(received, expected)) {
    throw googleHttpError(400, 'Google connection state is invalid.', 'INVALID_OAUTH_STATE')
  }

  const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'))
  if (!payload.expiresAt || payload.expiresAt < Date.now()) {
    throw googleHttpError(400, 'Google connection has expired. Please try again.', 'EXPIRED_OAUTH_STATE')
  }
  return payload
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
  const approvalBlocked = response.status === 403 && /quota|permission|access|not enabled/i.test(googleMessage)
  if (approvalBlocked) {
    throw googleHttpError(
      403,
      'Google has not approved Business Profile API access for this Cloud project yet.',
      'GOOGLE_API_APPROVAL_REQUIRED',
      { googleMessage, googleStatus },
    )
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

export async function exchangeGoogleCode(code, config) {
  const response = await fetch(GOOGLE_TOKEN_URL, {
    body: new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      code,
      grant_type: 'authorization_code',
      redirect_uri: config.redirectUri,
    }),
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    method: 'POST',
    signal: AbortSignal.timeout(15_000),
  })
  return readGoogleResponse(response, 'Google could not finish connecting your account.')
}

export async function discoverGoogleLocation(accessToken) {
  const accountPayload = await googleRequest(GOOGLE_ACCOUNTS_URL, accessToken)
  const accounts = accountPayload.accounts || []
  if (!accounts.length) {
    throw googleHttpError(404, 'This Google account does not manage a Business Profile.', 'NO_GOOGLE_ACCOUNTS')
  }

  for (const account of accounts) {
    const url = new URL(`${GOOGLE_LOCATIONS_URL}/${account.name}/locations`)
    url.searchParams.set('readMask', 'name,title,storeCode,metadata')
    url.searchParams.set('pageSize', '100')
    const locationPayload = await googleRequest(url.toString(), accessToken)
    const locations = locationPayload.locations || []
    if (locations.length) return { account, location: locations[0] }
  }

  throw googleHttpError(404, 'No Google Business Profile locations were found for this account.', 'NO_GOOGLE_LOCATIONS')
}

export async function getGoogleConnection(admin, userId) {
  const { data, error } = await admin
    .from('google_connections')
    .select('*')
    .eq('user_id', userId)
    .eq('active', true)
    .order('connected_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw googleHttpError(500, 'AURA could not read the Google connection.', 'GOOGLE_CONNECTION_LOOKUP_FAILED')
  if (!data) throw googleHttpError(409, 'Connect Google Business Profile first.', 'GOOGLE_NOT_CONNECTED')
  return data
}

export async function getFreshGoogleAccessToken(admin, connection, config) {
  const expiresAt = connection.token_expires_at ? new Date(connection.token_expires_at).getTime() : 0
  if (expiresAt > Date.now() + 60_000) {
    return decryptGoogleToken(connection.access_token_encrypted, config.tokenSecret)
  }

  const refreshToken = decryptGoogleToken(connection.refresh_token_encrypted, config.tokenSecret)
  if (!refreshToken) {
    throw googleHttpError(401, 'Reconnect Google Business Profile to renew access.', 'GOOGLE_RECONNECT_REQUIRED')
  }

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
  const { error } = await admin
    .from('google_connections')
    .update({
      access_token_encrypted: encryptGoogleToken(tokenPayload.access_token, config.tokenSecret),
      token_expires_at: tokenExpiresAt,
      updated_at: new Date().toISOString(),
    })
    .eq('id', connection.id)
  if (error) throw googleHttpError(500, 'AURA could not securely save renewed Google access.', 'TOKEN_SAVE_FAILED')
  return tokenPayload.access_token
}

export function googleReviewsUrl(connection) {
  const account = String(connection.google_account_name || '').replace(/^\/+|\/+$/g, '')
  const location = String(connection.google_location_name || '').replace(/^\/+|\/+$/g, '')
  if (!/^accounts\/[^/]+$/.test(account) || !/^locations\/[^/]+$/.test(location)) {
    throw googleHttpError(500, 'The saved Google location is invalid.', 'INVALID_GOOGLE_LOCATION')
  }
  return `${GOOGLE_REVIEWS_URL}/${account}/${location}/reviews`
}

export function googleRatingToNumber(value) {
  return ({ ONE: 1, TWO: 2, THREE: 3, FOUR: 4, FIVE: 5 })[value] || Number(value) || 0
}

export function publicGoogleReview(row) {
  return {
    aura_reply: row.reply_comment || '',
    aura_reply_updated_at: row.reply_updated_at,
    created_at: row.review_created_at,
    customer_name: row.reviewer_name || 'Google reviewer',
    google_review_name: row.google_review_name,
    id: row.id,
    mentioned_staff: [],
    rating: Number(row.rating || 0),
    source: 'google_business',
    text: row.comment || '',
  }
}
