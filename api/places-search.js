import {
  consumePlacesQuota,
  handleApiError,
  readJsonBody,
  requestGooglePlaces,
  requireAuraUser,
  sendJson,
} from '../server/places.js'

const SEARCH_FIELD_MASK = [
  'places.id',
  'places.displayName',
  'places.formattedAddress',
  'places.rating',
  'places.userRatingCount',
  'places.googleMapsUri',
  'places.businessStatus',
].join(',')

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST')
    sendJson(response, 405, { error: 'Method not allowed.' })
    return
  }

  try {
    await requireAuraUser(request)
    const query = String(readJsonBody(request).query || '').trim()

    if (query.length < 3 || query.length > 120) {
      sendJson(response, 400, { error: 'Enter a business name and town or postcode.' })
      return
    }

    await consumePlacesQuota(request, 'search')

    const data = await requestGooglePlaces('/places:searchText', {
      body: {
        languageCode: 'en',
        pageSize: 8,
        regionCode: 'GB',
        textQuery: query,
      },
      fieldMask: SEARCH_FIELD_MASK,
      method: 'POST',
    })

    const places = (data.places || []).map((place) => ({
      address: place.formattedAddress || '',
      businessStatus: place.businessStatus || '',
      googleMapsUri: place.googleMapsUri || '',
      id: place.id,
      name: place.displayName?.text || 'Google business',
      rating: Number(place.rating || 0),
      reviewCount: Number(place.userRatingCount || 0),
    }))

    sendJson(response, 200, { places })
  } catch (error) {
    handleApiError(response, error)
  }
}
