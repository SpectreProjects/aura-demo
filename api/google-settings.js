import { getGoogleConnection, googleHttpError, requireGoogleUser } from '../server/google-business.js'
import { publicReplySettings, validateReplySettings } from '../server/google-review-workflow.js'
import { handleApiError, readJsonBody, sendJson } from '../server/places.js'

export default async function handler(request, response) {
  if (!['GET', 'PATCH'].includes(request.method)) {
    response.setHeader('Allow', 'GET, PATCH')
    sendJson(response, 405, { error: 'Method not allowed.' })
    return
  }

  try {
    const { admin, businessProfile, user } = await requireGoogleUser(request)
    if (request.method === 'GET') {
      const { data, error } = await admin
        .from('aura_google_reply_settings')
        .select('*')
        .eq('user_id', user.id)
        .eq('business_profile_id', businessProfile.id)
        .maybeSingle()
      if (error) throw error
      sendJson(response, 200, { settings: publicReplySettings(data, user.email || '') })
      return
    }

    await getGoogleConnection(admin, user.id, { businessProfileId: businessProfile.id })
    const { errors, settings } = validateReplySettings(readJsonBody(request), user.email || '')
    if (Object.keys(errors).length) {
      throw googleHttpError(400, 'Check the highlighted tone and timing details.', 'SETTINGS_INVALID', { fields: errors })
    }

    const { data, error } = await admin
      .from('aura_google_reply_settings')
      .upsert({
        ...settings,
        business_profile_id: businessProfile.id,
        setup_completed_at: new Date().toISOString(),
        user_id: user.id,
      }, { onConflict: 'business_profile_id' })
      .select('*')
      .single()
    if (error) throw error
    sendJson(response, 200, { settings: publicReplySettings(data, user.email || '') })
  } catch (error) {
    if (error?.details?.fields) {
      sendJson(response, error.status || 400, {
        code: error.code,
        error: error.message,
        fields: error.details.fields,
      })
      return
    }
    handleApiError(response, error)
  }
}

