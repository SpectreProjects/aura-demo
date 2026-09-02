import {
  consumePlacesQuota,
  handleApiError,
  readJsonBody,
  requestGooglePlaces,
  requireAuraUser,
  sendJson,
} from '../server/places.js'

const DETAILS_FIELD_MASK = [
  'id',
  'displayName',
  'formattedAddress',
  'rating',
  'userRatingCount',
  'googleMapsUri',
  'reviews',
].join(',')

function normaliseReview(review, placeId, index) {
  const author = review.authorAttribution || {}
  const text = review.text?.text || review.originalText?.text || ''
  const fallbackId = `${placeId}:${review.publishTime || 'review'}:${author.displayName || index}`

  return {
    authorName: author.displayName || 'Google reviewer',
    authorPhotoUri: author.photoUri || '',
    authorProfileUri: author.uri || '',
    googleMapsUri: review.googleMapsUri || '',
    id: review.name || fallbackId,
    originalText: review.originalText?.text || '',
    publishTime: review.publishTime || '',
    rating: Number(review.rating || 0),
    relativePublishTime: review.relativePublishTimeDescription || '',
    text,
  }
}

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST')
    sendJson(response, 405, { error: 'Method not allowed.' })
    return
  }

  try {
    await requireAuraUser(request)
    const placeId = String(readJsonBody(request).placeId || '').trim()

    if (!/^[A-Za-z0-9_-]{10,220}$/.test(placeId)) {
      sendJson(response, 400, { error: 'Choose a valid Google business.' })
      return
    }

    await consumePlacesQuota(request, 'details')

    const place = await requestGooglePlaces(`/places/${encodeURIComponent(placeId)}`, {
      fieldMask: DETAILS_FIELD_MASK,
    })

    sendJson(response, 200, {
      place: {
        address: place.formattedAddress || '',
        googleMapsUri: place.googleMapsUri || '',
        id: place.id || placeId,
        name: place.displayName?.text || 'Your business',
        rating: Number(place.rating || 0),
        reviewCount: Number(place.userRatingCount || 0),
        reviews: (place.reviews || []).map((review, index) => normaliseReview(review, placeId, index)),
      },
    })
  } catch (error) {
    handleApiError(response, error)
  }
}
