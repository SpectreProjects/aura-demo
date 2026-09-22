/* global Buffer, process */

import crypto from 'node:crypto'
import { getGoogleAdminClient, getGoogleConfig, googleHttpError } from '../server/google-business.js'
import { runGoogleReviewWorker } from '../server/google-review-sync.js'
import { handleApiError, sendJson } from '../server/places.js'

export const config = { maxDuration: 60 }

function sameSecret(provided, expected) {
  const left = Buffer.from(String(provided || ''))
  const right = Buffer.from(String(expected || ''))
  return left.length === right.length && left.length > 0 && crypto.timingSafeEqual(left, right)
}

export default async function handler(request, response) {
  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET')
    sendJson(response, 405, { error: 'Method not allowed.' })
    return
  }

  try {
    const cronSecret = String(process.env.CRON_SECRET || '')
    const authorization = String(request.headers.authorization || '')
    if (!cronSecret) throw googleHttpError(503, 'The review worker is not configured.', 'CRON_NOT_CONFIGURED')
    if (!sameSecret(authorization, `Bearer ${cronSecret}`)) {
      throw googleHttpError(401, 'This review worker request is not authorised.', 'CRON_NOT_AUTHORISED')
    }

    const config = getGoogleConfig()
    if (!config.features.syncing) {
      sendJson(response, 200, { skipped: true })
      return
    }
    const admin = getGoogleAdminClient(config)
    const result = await runGoogleReviewWorker({ admin, config })
    sendJson(response, 200, result)
  } catch (error) {
    handleApiError(response, error)
  }
}
