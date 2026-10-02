export const SIGNUP_COMPANY_KEY = 'harmony-signup-company'

export function validateCompanyName(value) {
  const name = value.trim()
  if (!name) return 'Enter your company name.'
  if (name.length > 160) return 'Use 160 characters or fewer.'
  return ''
}

// Finish before onboarding. Never rename an existing account. A failed save
// retains the company draft so the user can retry without starting over.
export async function finishCompanySignup(auth, user, storage) {
  const company = storage.getItem(SIGNUP_COMPANY_KEY)
  if (!company || validateCompanyName(company)) return
  if (!user.user_metadata?.business_name) {
    const { error } = await auth.updateUser({
      data: { business_name: company.trim() },
    })
    if (error) throw error
  }
  storage.removeItem(SIGNUP_COMPANY_KEY)
}
