import { Plus, Save, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import RewardCard from '../components/RewardCard'
import { supabase } from '../lib/supabaseClient'

const BUSINESS_ID = '11111111-1111-1111-1111-111111111111'

const initialForm = {
  name: '',
  description: '',
  pointsRequired: '',
  staffRole: '',
}

function normalizeSupabaseReward(row) {
  return {
    id: row.id,
    businessId: row.business_id,
    name: row.name,
    description: row.description,
    pointsRequired: row.points_required,
    createdAt: row.created_at,
    staffRole: 'All staff',
    source: 'supabase',
  }
}

function getErrorMessage(error, fallback) {
  return `${error?.message || fallback}${error?.code ? ` (${error.code})` : ''}`
}

export default function Rewards({ rewards, setRewards }) {
  const fallbackRewards = useMemo(
    () =>
      rewards.map((reward) => ({
        ...reward,
        businessId: reward.businessId || BUSINESS_ID,
        source: reward.source || 'localStorage',
      })),
    [rewards],
  )
  const [rewardRows, setRewardRows] = useState([])
  const [form, setForm] = useState(initialForm)
  const [editForm, setEditForm] = useState(initialForm)
  const [editingId, setEditingId] = useState(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [isDeletingId, setIsDeletingId] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isUsingFallback, setIsUsingFallback] = useState(!supabase)

  useEffect(() => {
    async function fetchRewards() {
      setIsLoading(true)
      setErrorMessage('')

      if (!supabase) {
        console.warn('[Supabase] Rewards client unavailable. Using localStorage fallback.')
        setIsUsingFallback(true)
        setRewardRows(fallbackRewards)
        setIsLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('rewards')
        .select('id, business_id, name, description, points_required, created_at')
        .eq('business_id', BUSINESS_ID)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('[Supabase] Rewards fetch error object:', error)
        console.error('[Supabase] Rewards fetch error JSON:', JSON.stringify(error, null, 2))
        setErrorMessage(getErrorMessage(error, 'Could not load rewards from Supabase.'))
        setRewardRows([])
        setIsLoading(false)
        return
      }

      console.info('[Supabase] Rewards fetched:', data)
      setIsUsingFallback(false)
      setRewardRows(data.map(normalizeSupabaseReward))
      setIsLoading(false)
    }

    fetchRewards()
  }, [fallbackRewards])

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  function updateEditField(field, value) {
    setEditForm((current) => ({ ...current, [field]: value }))
  }

  function showSuccess(message) {
    setSuccessMessage(message)
    window.setTimeout(() => setSuccessMessage(''), 2400)
  }

  async function addReward(event) {
    event.preventDefault()
    if (!form.name.trim() || !form.description.trim() || !form.pointsRequired || isSaving) return

    setIsSaving(true)
    setErrorMessage('')

    const localReward = {
      id: `reward-${Date.now()}`,
      businessId: BUSINESS_ID,
      name: form.name.trim(),
      description: form.description.trim(),
      pointsRequired: Number(form.pointsRequired),
      staffRole: form.staffRole.trim() || 'All staff',
      source: 'localStorage',
    }

    if (isUsingFallback || !supabase) {
      setRewards((current) => [localReward, ...current])
      setRewardRows((current) => [localReward, ...current])
      setForm(initialForm)
      setIsSaving(false)
      showSuccess('Reward added locally.')
      return
    }

    const { data, error } = await supabase
      .from('rewards')
      .insert({
        business_id: BUSINESS_ID,
        name: localReward.name,
        description: localReward.description,
        points_required: localReward.pointsRequired,
      })
      .select('id, business_id, name, description, points_required, created_at')
      .single()

    if (error) {
      console.error('[Supabase] Reward insert error object:', error)
      console.error('[Supabase] Reward insert error JSON:', JSON.stringify(error, null, 2))
      setErrorMessage(getErrorMessage(error, 'Could not add reward.'))
      setIsSaving(false)
      return
    }

    setRewardRows((current) => [normalizeSupabaseReward(data), ...current])
    setForm(initialForm)
    setIsSaving(false)
    showSuccess('Reward added.')
  }

  function startEditing(reward) {
    setEditingId(reward.id)
    setEditForm({
      name: reward.name,
      description: reward.description,
      pointsRequired: reward.pointsRequired,
      staffRole: reward.staffRole || 'All staff',
    })
    setErrorMessage('')
  }

  function cancelEditing() {
    setEditingId(null)
    setEditForm(initialForm)
  }

  async function saveReward(rewardId) {
    if (!editForm.name.trim() || !editForm.description.trim() || !editForm.pointsRequired || isUpdating) {
      return
    }

    setIsUpdating(true)
    setErrorMessage('')

    const updatedReward = {
      name: editForm.name.trim(),
      description: editForm.description.trim(),
      pointsRequired: Number(editForm.pointsRequired),
    }

    if (isUsingFallback || !supabase) {
      setRewards((current) =>
        current.map((reward) => (reward.id === rewardId ? { ...reward, ...updatedReward } : reward)),
      )
      setRewardRows((current) =>
        current.map((reward) => (reward.id === rewardId ? { ...reward, ...updatedReward } : reward)),
      )
      setIsUpdating(false)
      cancelEditing()
      showSuccess('Reward updated locally.')
      return
    }

    const { data, error } = await supabase
      .from('rewards')
      .update({
        name: updatedReward.name,
        description: updatedReward.description,
        points_required: updatedReward.pointsRequired,
      })
      .eq('id', rewardId)
      .select('id, business_id, name, description, points_required, created_at')
      .single()

    if (error) {
      console.error('[Supabase] Reward update error object:', error)
      console.error('[Supabase] Reward update error JSON:', JSON.stringify(error, null, 2))
      setErrorMessage(getErrorMessage(error, 'Could not update reward.'))
      setIsUpdating(false)
      return
    }

    setRewardRows((current) =>
      current.map((reward) => (reward.id === rewardId ? normalizeSupabaseReward(data) : reward)),
    )
    setIsUpdating(false)
    cancelEditing()
    showSuccess('Reward updated.')
  }

  async function deleteReward(reward) {
    const confirmed = window.confirm(`Delete "${reward.name}"?`)
    if (!confirmed || isDeletingId) return

    setIsDeletingId(reward.id)
    setErrorMessage('')

    if (isUsingFallback || !supabase) {
      setRewards((current) => current.filter((item) => item.id !== reward.id))
      setRewardRows((current) => current.filter((item) => item.id !== reward.id))
      setIsDeletingId(null)
      showSuccess('Reward deleted locally.')
      return
    }

    const { error } = await supabase.from('rewards').delete().eq('id', reward.id)

    if (error) {
      console.error('[Supabase] Reward delete error object:', error)
      console.error('[Supabase] Reward delete error JSON:', JSON.stringify(error, null, 2))
      setErrorMessage(getErrorMessage(error, 'Could not delete reward.'))
      setIsDeletingId(null)
      return
    }

    setRewardRows((current) => current.filter((item) => item.id !== reward.id))
    setIsDeletingId(null)
    showSuccess('Reward deleted.')
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[390px_1fr]">
      <section className="aura-card h-fit p-5">
        <h2 className="text-xl font-bold text-slate-950">Create reward</h2>
        <p className="mt-1 text-sm leading-6 text-slate-500">
          {isLoading
            ? 'Loading rewards...'
            : isUsingFallback
              ? 'Rewards save to localStorage for this browser.'
              : 'Rewards save to Supabase for this business.'}
        </p>
        {errorMessage && (
          <p className="mt-3 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
            {errorMessage}
          </p>
        )}
        {successMessage && (
          <p className="mt-3 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
            {successMessage}
          </p>
        )}
        <form className="mt-6 space-y-4" onSubmit={addReward}>
          <input
            className="aura-input"
            placeholder="Reward name"
            value={form.name}
            onChange={(event) => updateField('name', event.target.value)}
          />
          <textarea
            className="aura-input min-h-28 resize-none"
            placeholder="Description"
            value={form.description}
            onChange={(event) => updateField('description', event.target.value)}
          />
          <input
            className="aura-input"
            min="1"
            placeholder="Points required"
            type="number"
            value={form.pointsRequired}
            onChange={(event) => updateField('pointsRequired', event.target.value)}
          />
          <input
            className="aura-input"
            placeholder="Optional staff role"
            value={form.staffRole}
            onChange={(event) => updateField('staffRole', event.target.value)}
          />
          <button className="aura-button w-full disabled:cursor-not-allowed disabled:opacity-60" disabled={isSaving} type="submit">
            <Plus size={18} />
            {isSaving ? 'Adding reward...' : 'Add reward'}
          </button>
        </form>
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-950">Reward catalogue</h2>
            <p className="text-sm text-slate-500">
              {isLoading ? 'Loading rewards...' : `${rewardRows.length} active rewards`}
            </p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {!isLoading &&
            rewardRows.map((reward) =>
              editingId === reward.id ? (
                <article key={reward.id} className="aura-card p-5">
                  <div className="space-y-4">
                    <input
                      className="aura-input"
                      placeholder="Reward name"
                      value={editForm.name}
                      onChange={(event) => updateEditField('name', event.target.value)}
                    />
                    <textarea
                      className="aura-input min-h-28 resize-none"
                      placeholder="Description"
                      value={editForm.description}
                      onChange={(event) => updateEditField('description', event.target.value)}
                    />
                    <input
                      className="aura-input"
                      min="1"
                      placeholder="Points required"
                      type="number"
                      value={editForm.pointsRequired}
                      onChange={(event) => updateEditField('pointsRequired', event.target.value)}
                    />
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button className="aura-button-secondary flex-1" type="button" onClick={cancelEditing}>
                      <X size={16} />
                      Cancel
                    </button>
                    <button
                      className="aura-button flex-1 disabled:cursor-not-allowed disabled:opacity-60"
                      disabled={isUpdating}
                      type="button"
                      onClick={() => saveReward(reward.id)}
                    >
                      <Save size={16} />
                      {isUpdating ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                </article>
              ) : (
                <RewardCard
                  key={reward.id}
                  reward={reward}
                  onDelete={() => deleteReward(reward)}
                  onEdit={() => startEditing(reward)}
                />
              ),
            )}
        </div>
      </section>
    </div>
  )
}
