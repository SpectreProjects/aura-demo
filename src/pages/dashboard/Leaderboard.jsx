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
      <LeaderboardExperience people={people} />

      <section className="grid gap-5 rounded-2xl border border-white/[0.07] bg-[#0b0a0e]/90 p-5 lg:grid-cols-[1fr_1.1fr] lg:items-center">
        <div>
          <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-violet-200">
            <Eye size={15} /> Share access
          </p>
          <h3 className="mt-2 text-2xl font-black text-white">Unlisted company leaderboard</h3>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            The link is excluded from search engines. Add an optional company PIN for another layer of access control.
          </p>
          <p className="mt-3 break-all rounded-xl border border-white/[0.07] bg-black/25 px-3 py-2 text-xs font-semibold text-slate-500">
            {leaderboardUrl || 'Preparing your company link...'}
          </p>
        </div>

        <form className="rounded-xl border border-white/[0.07] bg-[#060607] p-4" onSubmit={savePin}>
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="flex items-center gap-2 text-sm font-black text-white">
              <LockKeyhole className="text-violet-200" size={16} /> Optional company PIN
            </p>
            <span className={`rounded-full px-2.5 py-1 text-[10px] font-black ${
              leaderboardPinEnabled ? 'bg-violet-300/10 text-violet-200' : 'bg-white/[0.05] text-slate-500'
            }`}>
              {leaderboardPinEnabled ? 'Enabled' : 'Not enabled'}
            </span>
          </div>
          <div className="flex gap-2">
            <input
              className="aura-field py-2.5"
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
              className="shrink-0 rounded-xl bg-violet-300 px-4 text-xs font-black text-[#100722] disabled:opacity-60"
              disabled={isSavingPin || pin.length < 4}
              type="submit"
            >
              Set PIN
            </button>
          </div>
          {leaderboardPinEnabled && (
            <button
              className="mt-3 inline-flex items-center gap-2 text-xs font-black text-slate-500 transition hover:text-white"
              disabled={isSavingPin}
              onClick={removePin}
              type="button"
            >
              <Unlock size={14} /> Remove PIN
            </button>
          )}
          {pinMessage && <p className="mt-3 text-xs font-bold text-slate-400">{pinMessage}</p>}
        </form>
      </section>
    </div>
  )
}
