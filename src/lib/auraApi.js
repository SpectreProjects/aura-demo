import { supabase } from './supabaseClient'

export async function callAuraApi(path, body, method = 'POST', signal) {
  if (!supabase) throw new Error('This AURA feature is available on the connected app.')
  const { data } = await supabase.auth.getSession()
  const accessToken = data.session?.access_token
  if (!accessToken) {
    const error = new Error('Please sign in again to continue.')
    error.code = 'NOT_AUTHENTICATED'
    throw error
  }

  const response = await fetch(path, {
    body: ['GET', 'HEAD'].includes(method) ? undefined : JSON.stringify(body || {}),
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    method,
    signal,
  })
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    const error = new Error(payload.error || 'AURA could not complete that request.')
    error.code = payload.code
    error.fields = payload.fields || null
    error.status = response.status
    throw error
  }
  return payload
}

