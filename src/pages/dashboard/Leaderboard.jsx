import { Check, Copy, Eye, LockKeyhole, ShieldCheck, Unlock } from 'lucide-react'
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
  const [copied, setCopied] = useState(false)
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

  async function copyLink() {
    if (!leaderboardUrl) return
    await navigator.clipboard.writeText(leaderboardUrl)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1800)
  }

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
      <section className="flex flex-col justify-between gap-6 rounded-2xl border border-white/[0.07] bg-[#0b0a0e]/90 p-6 shadow-[0_30px_120px_rgba(0,0,0,0.22)] lg:flex-row lg:items-end">
        <div>
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-amber-300/15 bg-amber-300/[0.06] px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-amber-200">
            <ShieldCheck size={14} /> Read-only recognition
          </p>
          <h2 className="max-w-3xl text-4xl font-black tracking-tight text-white">Celebrate progress without exposing manager controls.</h2>
          <p className="mt-3 max-w-2xl text-base leading-7 text-slate-400">
            Staff can see ranks, mentions, achievements and reward progress. Redeemable balances always stay private.
          </p>
        </div>
        <button
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-300 px-5 py-3 text-sm font-black text-[#100722] transition hover:bg-violet-200 disabled:opacity-50"
          disabled={!leaderboardUrl}
          onClick={copyLink}
          type="button"
        >
          {copied ? <Check size={17} /> : <Copy size={17} />}
          {copied ? 'Link copied' : 'Copy public link'}
        </button>
      </section>

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
