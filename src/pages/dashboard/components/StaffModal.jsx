import { X } from 'lucide-react'
import { useState } from 'react'

const initialForm = {
  name: '',
  job_title: '',
  job_category: 'Front of House',
}

export default function StaffModal({ categories, initialName = '', initialStaff, onClose, onSave, title }) {
  const [form, setForm] = useState({
    ...initialForm,
    ...(initialStaff || {}),
    name: initialStaff?.name || initialName,
    job_category: initialStaff?.job_category || categories[0] || 'Front of House',
  })

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    await onSave(form)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-8 backdrop-blur-sm">
      <form
        className="w-full max-w-xl rounded-2xl border border-white/10 bg-[#0b0a0e] p-6 text-white shadow-[0_34px_140px_rgba(0,0,0,0.5)]"
        onSubmit={handleSubmit}
      >
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-violet-200">Team setup</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight">{title}</h2>
          </div>
          <button
            className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/8 text-slate-200 transition hover:bg-white/12"
            onClick={onClose}
            type="button"
          >
            <X size={18} />
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <input
            className="aura-field"
            onChange={(event) => updateField('name', event.target.value)}
            placeholder="Name"
            required
            value={form.name}
          />
          <input
            className="aura-field"
            onChange={(event) => updateField('job_title', event.target.value)}
            placeholder="Job title"
            value={form.job_title}
          />
          <select
            className="aura-select"
            onChange={(event) => updateField('job_category', event.target.value)}
            value={form.job_category}
          >
            {categories.map((category) => (
              <option key={category}>{category}</option>
            ))}
          </select>
          <div className="flex items-center rounded-xl border border-white/[0.07] bg-[#060807] px-4 text-sm font-semibold text-slate-400">
            {initialStaff ? 'Performance history is preserved' : 'Active when added'}
          </div>
        </div>

        <button className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-violet-300 px-5 py-4 text-sm font-black text-[#100722] transition hover:-translate-y-0.5 hover:bg-violet-200" type="submit">
          Save staff member
        </button>
      </form>
    </div>
  )
}
