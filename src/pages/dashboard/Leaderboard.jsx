import { Eye, LockKeyhole, Unlock } from 'lucide-react'
import { useMemo, useState } from 'react'
import LeaderboardExperience from '../../components/LeaderboardExperience'
import { useDashboard } from './useDashboard'

function nextRewardFor(person, rewards) {
  const activeRewards = rewards
    .filter((reward) => reward.is_active)
    .slice()
    .sort((a, b) => Number(a.points_required) - Number(b.points_required))
  const reward = activeRewards.find(
    (item) => Number(item.points_required) > Number(person.redeemable_points || 0),
  )
  if (!reward) return null

  return {
    progress_percent: Math.min(
      100,
      Math.floor((Number(person.redeemable_points || 0) / Number(reward.points_required)) * 100),
    ),
    title: reward.title,
  }
}

export default function Leaderboard() {
  const {
    account,
    actions,
    leaderboard,
    leaderboardPinEnabled,
    redemptions,
    rewards,
  } = useDashboard()
  const [pin, setPin] = useState('')
  const [pinMessage, setPinMessage] = useState('')
  const [isSavingPin, setIsSavingPin] = useState(false)
  const publicSlug = account.businessProfile?.public_slug
  const leaderboardUrl = publicSlug ? `${window.location.origin}/leaderboard/${publicSlug}` : ''
  const businessName = account.businessProfile?.business_name || 'your team'

  const people = useMemo(
    () =>
      leaderboard.map((person, index) => ({
        ...person,
        earned_rewards: redemptions
          .filter((redemption) => redemption.staff_id === person.id)
          .map((redemption) => ({
            redeemed_at: redemption.redeemed_at,
            title: rewards.find((reward) => reward.id === redemption.reward_id)?.title || 'Reward',
          })),
        mentions: person.total_mentions,
        next_reward: nextRewardFor(person, rewards),
        rank: index + 1,
      })),
    [leaderboard, redemptions, rewards],
  )

  async function savePin(event) {
    event.preventDefault()
    setIsSavingPin(true)
    setPinMessage('')
    try {
      await actions.setLeaderboardPin(pin)
      setPin('')
      setPinMessage('Company PIN enabled.')
    } catch {
      setPinMessage('The PIN could not be updated. Please try again.')
    } finally {
      setIsSavingPin(false)
    }
  }

  async function removePin() {
    setIsSavingPin(true)
    setPinMessage('')
    try {
      await actions.setLeaderboardPin('')
      setPin('')
      setPinMessage('PIN removed. The unlisted link is still active.')
    } catch {
      setPinMessage('The PIN could not be removed. Please try again.')
    } finally {
      setIsSavingPin(false)
    }
  }

  return (
    <div className="space-y-6">
      <LeaderboardExperience businessName={businessName} leaderboardUrl={leaderboardUrl} people={people} />

      <section className="grid w-full gap-5 rounded-[1.75rem] border border-[#17201e]/10 bg-[#edf5f2] p-5 text-[#17201e] shadow-[0_22px_70px_rgba(31,53,47,0.08)] lg:grid-cols-[1fr_1.1fr] lg:items-center">
        <div>
          <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-[#315bd8]">
            <Eye size={15} /> Share access
          </p>
          <h3 className="mt-2 text-2xl font-black tracking-tight text-[#17201e]">Unlisted company leaderboard</h3>
          <p className="mt-2 text-sm font-semibold leading-6 text-[#647773]">
            The link is excluded from search engines. Add an optional company PIN for another layer of access control.
          </p>
          <p className="mt-3 break-all rounded-xl border border-[#17201e]/10 bg-white/55 px-3 py-2 text-xs font-semibold text-[#647773]">
            {leaderboardUrl || 'Preparing your company link...'}
          </p>
        </div>

        <form className="rounded-2xl border border-[#17201e]/10 bg-white/55 p-4" onSubmit={savePin}>
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="flex items-center gap-2 text-sm font-black text-[#17201e]">
              <LockKeyhole className="text-[#3867F4]" size={16} /> Optional company PIN
            </p>
            <span className={`rounded-full px-2.5 py-1 text-[10px] font-black ${
              leaderboardPinEnabled ? 'bg-[#e6ecff] text-[#315bd8]' : 'bg-[#e8f0ed] text-[#6d7e79]'
            }`}>
              {leaderboardPinEnabled ? 'Enabled' : 'Not enabled'}
            </span>
          </div>
          <div className="flex gap-2">
            <input
              className="min-w-0 flex-1 rounded-xl border border-[#17201e]/12 bg-white px-4 py-2.5 text-sm font-semibold text-[#17201e] outline-none transition placeholder:text-[#8a9995] focus:border-[#3867F4] focus:ring-4 focus:ring-[#3867F4]/10"
              inputMode="numeric"
              maxLength={8}
              minLength={4}
              onChange={(event) => setPin(event.target.value.replace(/\D/g, ''))}
              placeholder="4–8 digit PIN"
              required
              type="password"
              value={pin}
            />
            <button
              className="shrink-0 rounded-xl bg-[#3867F4] px-4 text-xs font-black text-white transition hover:bg-[#2f5be0] disabled:opacity-60"
              disabled={isSavingPin || pin.length < 4}
              type="submit"
            >
              Set PIN
            </button>
          </div>
          {leaderboardPinEnabled && (
            <button
              className="mt-3 inline-flex items-center gap-2 text-xs font-black text-[#647773] transition hover:text-[#17201e]"
              disabled={isSavingPin}
              onClick={removePin}
              type="button"
            >
              <Unlock size={14} /> Remove PIN
            </button>
          )}
          {pinMessage && <p className="mt-3 text-xs font-bold text-[#315bd8]">{pinMessage}</p>}
        </form>
      </section>
    </div>
  )
}
