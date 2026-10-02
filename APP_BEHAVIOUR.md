# Harmony app: functional reference for the redesign

Recorded on 2 October 2026 from the current source. Connor wants a fresh Harmony customer experience, retaining knowledge of what each step does. This is implementation evidence, not a frozen screen sequence or proof that every live integration has been tested. Recheck the referenced code and server contracts when implementing a new flow.

## What remains and what is open

Retain required information, validation intent, permissions, consent, saved data and action consequences. The approved Harmony branding is in DESIGN.md.

Redesign the journey, navigation, page order, step grouping, layouts, modals, copy, components and motion. No AURA-era visual decision is a Harmony requirement. Existing defects or missing validation are not behaviours to reproduce. Screen order can change when the necessary data and authorisation dependencies remain satisfied.

## Google connection and onboarding

Sources: `src/pages/GoogleActivation.jsx`, `src/components/GoogleSetupConversationForm.jsx`, `src/components/GoogleReplySettingsForm.jsx`, `src/pages/dashboard/Settings.jsx`, and their `/api/google-*` handlers.

| Current stage | Information or operation | Functional consequence to retain |
|---|---|---|
| Connect Google | Starts Business Profile OAuth, with account selection and provider consent | App sign-in and business-management permission are distinct operations; check the OAuth handler and existing tests |
| Select location | Loads authorised account/location choices; confirms one account/location pair against the pending connection ID | One returned location may be preselected, but still requires confirmation; permission alone must not silently activate a business |
| Tone choice | Selects the reply voice | Saves `toneChoice` with the owner's settings |
| Preferred phrases | Collects at least one usable phrase | Trims and saves preferred phrases |
| Avoided phrases | Collects at least one phrase to avoid | Trims and saves avoided phrases |
| Positive example | Collects an owner-approved positive-review reply | Requires a non-empty example |
| Critical example | Collects an owner-approved critical-review reply | Requires a non-empty example |
| Escalation wording | Collects optional wording | Can be skipped; saved if supplied |
| Recommended delay | Preset or custom time converted to minutes | Must be an integer from 0 to 10,080 minutes; the recommendation does not block early manual publishing |
| Draft notifications | Enabled/disabled and recipient email | A valid email is required when notifications are enabled |
| Review answers and finish | Submits the settings payload | Settings save before importing reviews; an import failure must not be presented as loss of already-saved settings |
| Import and completion | Imports reviews for the confirmed connection | Supports retry after import failure and records the latest sync information |

The conversation form retains answers and its step in local storage when a storage key is supplied, clears that draft after successful submission, and retains answers on save failure. A redesigned flow should preserve useful progress and recovery rather than restart when a user leaves temporarily.

Changing the Google location or disconnecting archives the prior connection/history rather than mixing it with the next business. Inspect the relevant handlers before altering these actions. The existing app prepares review drafts; publishing uses an explicit owner action against saved text/version. Rebranding does not silently change that approval model or enable automatic publishing.

## Staff setup

Sources: `src/pages/dashboard/components/StaffModal.jsx` and `addStaff` in `src/pages/dashboard/DashboardLayout.jsx`.

Current information sequence: full name, job title, department/category. Editing starts from the existing record. A department can be added during setup; blank department names are rejected and a case-insensitive existing name is reused. Creating a department can persist separately before the final staff submission, so cancellation needs deliberate handling in the new journey.

The final submit calls the staff save operation, which inserts or updates a business-associated record and then updates dashboard state. Success is shown after the save resolves. The current create flow can reset for another staff member; editing uses the existing identity. Required field validation must be verified and implemented deliberately, rather than inferred from the old input attributes.

## Manual points adjustment

Sources: `src/pages/dashboard/components/PointsModal.jsx` and `adjustPoints` in `src/pages/dashboard/DashboardLayout.jsx`.

Current sequence: add/remove, magnitude, reason. The form checks a finite magnitude of at least one point and a non-empty trimmed reason. The payload contains `staffId`, a signed `amount` and the reason. The save operation records a manual-adjustment event, associated with the business and acting user when persisted, rather than simply overwriting the displayed balance.

Current events contribute to balance, lifetime and monthly totals. The UI shows success only after the save resolves, preserves an error on failure, and can reset for another adjustment. Do not change the scoring semantics as an incidental layout decision.

## Rewards

Sources: `src/pages/dashboard/components/RewardModal.jsx`, `saveReward` and `redeemReward` in `src/pages/dashboard/DashboardLayout.jsx`.

Current setup information: title, required points, description and active/inactive status. Final submission inserts or updates the reward and then refreshes dashboard state. Editing retains the reward identity; creating can reset for another reward. Check actual validation and server constraints when rebuilding this form; old markup is not proof of a complete validation contract.

Redemption requires sufficient redeemable points. The persisted path calls the existing redemption operation and reloads point events/redemptions. The local preview path deducts the cost from the redeemable balance without deducting it from monthly/lifetime recognition, and records the redemption. These are separate operations from creating or editing a reward.

## Recognition, reviews and access

Sources: `src/pages/dashboard/DashboardLayout.jsx`, dashboard route components, `src/App.jsx` and the relevant API handlers/tests.

Review recognition, name approval, undoing recognition, draft editing/generation, publishing, reward redemption and public leaderboard access remain distinct functional actions. Preserve their record identities, eligibility, history, ownership and permission requirements. Inspect each handler before redesigning its controls.

The existing routes cover overview, reviews, staff, leaderboard, rewards and settings. They are an inventory of capabilities, not the prescribed Harmony navigation. Production dashboard routes require a session; local visual preview is explicitly development-only. Visual demo data and live connections must remain distinguishable.

## Before implementing a redesigned workflow

Trace the current inputs, validation, save trigger, payload, backend operation, success destination, failure recovery and cancellation behaviour. Identify side effects that happen before final submission. Carry these facts into the new flow, and compare the outcome against the original operation. Reuse working logic where appropriate, with a newly designed Harmony presentation.

Do not rename database tables, identifiers, API paths, environment variables or provider projects solely to remove the AURA name from the customer-facing experience. Those technical migrations are separate from the visual reset.
