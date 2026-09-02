/* global process */

const PLACES_API_URL = 'https://places.googleapis.com/v1'

export function sendJson(response, status, payload) {
  response.setHeader('Cache-Control', 'private, no-store, max-age=0')
  response.setHeader('Content-Type', 'application/json; charset=utf-8')
  response.status(status).json(payload)
}

export function readJsonBody(request) {
  if (!request.body) return {}
  if (typeof request.body === 'object') return request.body

  try {
    return JSON.parse(request.body)
  } catch {
    return {}
  }
}

function httpError(status, message, code) {
  const error = new Error(message)
  error.status = status
  error.code = code
  return error
}

export async function requireAuraUser(request) {
  const authorization = request.headers.authorization || ''
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY

  if (!authorization.startsWith('Bearer ') || !supabaseUrl || !supabaseAnonKey) {
    throw httpError(401, 'Please sign in to connect a business.', 'NOT_AUTHENTICATED')
  }

  let authResponse
  try {
    authResponse = await fetch(`${supabaseUrl.replace(/\/$/, '')}/auth/v1/user`, {
      headers: {
        apikey: supabaseAnonKey,
        authorization,
      },
      signal: AbortSignal.timeout(8_000),
    })
  } catch {
    throw httpError(503, 'AURA could not confirm your session. Please try again.', 'AUTH_UNAVAILABLE')
  }

  if (!authResponse.ok) {
    throw httpError(401, 'Your session has expired. Please sign in again.', 'NOT_AUTHENTICATED')
  }

  return authResponse.json()
}

export async function consumePlacesQuota(request, operation) {
  const authorization = request.headers.authorization || ''
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY

  let quotaResponse
  try {
    quotaResponse = await fetch(
      `${supabaseUrl.replace(/\/$/, '')}/rest/v1/rpc/consume_places_quota`,
      {
        body: JSON.stringify({ p_operation: operation }),
        headers: {
          apikey: supabaseAnonKey,
          authorization,
          'Content-Type': 'application/json',
        },
        method: 'POST',
        signal: AbortSignal.timeout(8_000),
      },
    )
  } catch {
    throw httpError(503, 'AURA could not check Google usage safely. Please try again.', 'QUOTA_UNAVAILABLE')
  }

  if (!quotaResponse.ok) {
    console.error('[AURA Places] Quota check failed:', quotaResponse.status)
    throw httpError(503, 'AURA could not check Google usage safely. Please try again.', 'QUOTA_UNAVAILABLE')
  }

  const allowed = await quotaResponse.json()
  if (!allowed) {
    throw httpError(
      429,
      'AURA has reached today\'s Google preview limit. Please try again tomorrow.',
      'PLACES_DAILY_LIMIT',
    )
  }
}

export async function requestGooglePlaces(path, { body, fieldMask, method = 'GET' } = {}) {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY
  if (!apiKey) {
    throw httpError(
      503,
      'Google Places is being connected to AURA. Please try again shortly.',
      'PLACES_NOT_CONFIGURED',
    )
  }

  let placesResponse
  try {
    placesResponse = await fetch(`${PLACES_API_URL}${path}`, {
      body: body ? JSON.stringify(body) : undefined,
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': fieldMask,
      },
      method,
      signal: AbortSignal.timeout(10_000),
    })
  } catch {
    throw httpError(503, 'Google Places did not respond. Please try again.', 'PLACES_UNAVAILABLE')
  }

  if (!placesResponse.ok) {
    const details = await placesResponse.text()
    console.error('[AURA Places] Google request failed:', placesResponse.status, details.slice(0, 800))
    throw httpError(
      502,
      'Google Places could not complete that request. Please try again.',
      'PLACES_REQUEST_FAILED',
    )
  }

  return placesResponse.json()
}

export function handleApiError(response, error) {
  const status = Number(error?.status) || 500
  sendJson(response, status, {
    code: error?.code || 'INTERNAL_ERROR',
    error: status >= 500 && !error?.code ? 'AURA could not complete that request.' : error.message,
  })
}
