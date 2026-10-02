import assert from 'node:assert/strict'
import test from 'node:test'
import { consumeGoogleSignInDestination, GOOGLE_SIGN_IN_NEXT_KEY } from './googleSignInNavigation.js'

test('signup resumes setup once after the shared sign-in callback', () => {
  const values = new Map([[GOOGLE_SIGN_IN_NEXT_KEY, '/setup/google']])
  const storage = { getItem: (key) => values.get(key), removeItem: (key) => values.delete(key) }
  assert.equal(consumeGoogleSignInDestination(storage), '/setup/google')
  assert.equal(consumeGoogleSignInDestination(storage), null)
})

test('sign-in continuation cannot navigate to an arbitrary destination', () => {
  for (const destination of ['https://example.com', '//example.com', '/dashboard', undefined]) {
    const storage = { getItem: () => destination, removeItem() {} }
    assert.equal(consumeGoogleSignInDestination(storage), null)
  }
})

test('company-first signup returns through signup before opening business setup', () => {
  const values = new Map([[GOOGLE_SIGN_IN_NEXT_KEY, '/signup']])
  const storage = { getItem: (key) => values.get(key), removeItem: (key) => values.delete(key) }
  assert.equal(consumeGoogleSignInDestination(storage), '/signup')
  assert.equal(consumeGoogleSignInDestination(storage), null)
})
