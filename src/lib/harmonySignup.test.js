import assert from 'node:assert/strict'
import test from 'node:test'
import {
  finishCompanySignup,
  SIGNUP_COMPANY_KEY,
  validateCompanyName,
} from './harmonySignup.js'

function draft(company) {
  const values = new Map([[SIGNUP_COMPANY_KEY, company]])
  return {
    getItem: (key) => values.get(key),
    removeItem: (key) => values.delete(key),
  }
}

test('company step rejects blank and overlong names, allowing international names', () => {
  assert.ok(validateCompanyName('   '))
  assert.ok(validateCompanyName('a'.repeat(161)))
  assert.equal(validateCompanyName('  Café & Co.  '), '')
})

test('Google signup saves the trimmed company before clearing its draft', async () => {
  const storage = draft('  Café & Co.  ')
  let saved
  await finishCompanySignup(
    {
      updateUser: async (payload) => {
        saved = payload
        assert.equal(storage.getItem(SIGNUP_COMPANY_KEY), '  Café & Co.  ')
        return { error: null }
      },
    },
    { user_metadata: {} },
    storage,
  )
  assert.deepEqual(saved, { data: { business_name: 'Café & Co.' } })
  assert.equal(storage.getItem(SIGNUP_COMPANY_KEY), undefined)
})

test('signup leaves an existing company name intact', async () => {
  let calls = 0
  const storage = draft('New Company')
  await finishCompanySignup(
    {
      updateUser: async () => {
        calls++
        return {}
      },
    },
    { user_metadata: { business_name: 'Existing Company' } },
    storage,
  )
  assert.equal(calls, 0)
  assert.equal(storage.getItem(SIGNUP_COMPANY_KEY), undefined)
})

test('failed company save keeps the draft and can be retried', async () => {
  const storage = draft('Harmony Test')
  await assert.rejects(
    finishCompanySignup(
      { updateUser: async () => ({ error: new Error('network') }) },
      { user_metadata: {} },
      storage,
    ),
    /network/,
  )
  assert.equal(storage.getItem(SIGNUP_COMPANY_KEY), 'Harmony Test')
  await finishCompanySignup(
    { updateUser: async () => ({ error: null }) },
    { user_metadata: {} },
    storage,
  )
  assert.equal(storage.getItem(SIGNUP_COMPANY_KEY), undefined)
})

test('missing or invalid drafts do not update an account', async () => {
  for (const company of [undefined, '', ' ', 'a'.repeat(161)]) {
    await finishCompanySignup(
      { updateUser: async () => assert.fail('Unexpected update') },
      { user_metadata: {} },
      draft(company),
    )
  }
})
