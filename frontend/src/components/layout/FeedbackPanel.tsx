import { useState, useEffect } from 'react'
import { feedbackApi } from '../../api/client'
import { useAuthStore } from '../../store/authStore'

interface FeedbackItem {
  id: number
  type: string
  title: string
  description: string | null
  status: string
  created_by: string
  created_at: string
}

const STATUS_LABELS: Record<string, string> = {
  requested: 'Requested',
  in_progress: 'In Process',
  completed: 'Completed',
}

const STATUS_COLORS: Record<string, string> = {
  requested: 'bg-yellow-100 text-yellow-800',
  in_progress: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
}

const TYPE_COLORS: Record<string, string> = {
  bug: 'bg-red/10 text-red',
  feature: 'bg-accent/10 text-accent',
}

interface Props {
  onClose: () => void
}

export default function FeedbackPanel({ onClose }: Props) {
  const { user } = useAuthStore()
  const canManage = user?.role === 'fm' || user?.role === 'admin'

  const [items, setItems] = useState<FeedbackItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ type: 'bug', title: '', description: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    feedbackApi.list()
      .then((res) => setItems(res.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleSubmit = async () => {
    if (!form.title.trim()) { setError('Title is required'); return }
    setSaving(true); setError('')
    try {
      const res = await feedbackApi.create({
        type: form.type,
        title: form.title.trim(),
        description: form.description.trim() || undefined,
      })
      setItems((prev) => [res.data, ...prev])
      setForm({ type: 'bug', title: '', description: '' })
      setShowForm(false)
    } catch { setError('Failed to submit') }
    finally { setSaving(false) }
  }

  const handleStatusChange = async (id: number, status: string) => {
    try {
      const res = await feedbackApi.updateStatus(id, status)
      setItems((prev) => prev.map((it) => it.id === id ? res.data : it))
    } catch { /* silent */ }
  }

  const handleDelete = async (id: number) => {
    try {
      await feedbackApi.delete(id)
      setItems((prev) => prev.filter((it) => it.id !== id))
    } catch { /* silent */ }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-bg border border-border rounded-xl flex flex-col shadow-2xl max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div>
            <div className="text-sm font-semibold text-ink">Bugs & Feature Requests</div>
            <div className="text-xs text-ink3">{items.length} item{items.length !== 1 ? 's' : ''}</div>
          </div>
          <div className="flex items-center gap-2">
            {!showForm && (
              <button
                onClick={() => setShowForm(true)}
                className="flex items-center gap-1 px-2.5 py-1 text-xs bg-accent text-white rounded hover:bg-accent/90 font-medium"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Report
              </button>
            )}
            <button onClick={onClose} className="text-ink3 hover:text-ink p-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Add form */}
        {showForm && (
          <div className="px-4 py-3 border-b border-border bg-surface2 space-y-2.5">
            <div className="flex gap-2">
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="px-2 py-1 text-xs border border-border rounded bg-surface focus:outline-none focus:border-accent"
              >
                <option value="bug">Bug</option>
                <option value="feature">Feature Request</option>
              </select>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Short title…"
                autoFocus
                className="flex-1 px-2 py-1 text-xs border border-border rounded bg-surface focus:outline-none focus:border-accent"
              />
            </div>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="More details (optional)…"
              rows={2}
              className="w-full px-2 py-1 text-xs border border-border rounded bg-surface focus:outline-none focus:border-accent resize-none"
            />
            {error && <p className="text-xs text-red">{error}</p>}
            <div className="flex gap-2">
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="px-3 py-1 text-xs bg-accent text-white rounded hover:bg-accent/90 disabled:opacity-50 font-medium"
              >
                {saving ? 'Submitting…' : 'Submit'}
              </button>
              <button onClick={() => { setShowForm(false); setError('') }} className="px-3 py-1 text-xs border border-border rounded text-ink3 hover:text-ink">
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="py-10 text-center text-xs text-ink3">Loading…</div>
          ) : items.length === 0 ? (
            <div className="py-10 text-center text-xs text-ink3">No items yet. Be the first to report!</div>
          ) : (
            items.map((item) => (
              <div key={item.id} className="px-4 py-3 border-b border-border/60 hover:bg-surface2/40 transition-colors">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${TYPE_COLORS[item.type] ?? 'bg-border text-ink3'}`}>
                      {item.type === 'bug' ? 'Bug' : 'Feature'}
                    </span>
                    <span className="text-xs font-medium text-ink">{item.title}</span>
                  </div>
                  {canManage && (
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="text-[10px] text-ink3/40 hover:text-red flex-shrink-0 transition-colors"
                    >
                      Del
                    </button>
                  )}
                </div>
                {item.description && (
                  <div className="mt-1 text-[11px] text-ink3 leading-relaxed">{item.description}</div>
                )}
                <div className="mt-1.5 flex items-center justify-between gap-2">
                  <div className="text-[10px] text-ink3">
                    {item.created_by} · {new Date(item.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                  </div>
                  {canManage ? (
                    <select
                      value={item.status}
                      onChange={(e) => handleStatusChange(item.id, e.target.value)}
                      className={`text-[10px] px-1.5 py-0.5 rounded font-medium border-0 cursor-pointer focus:outline-none ${STATUS_COLORS[item.status] ?? 'bg-border text-ink3'}`}
                    >
                      <option value="requested">Requested</option>
                      <option value="in_progress">In Process</option>
                      <option value="completed">Completed</option>
                    </select>
                  ) : (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${STATUS_COLORS[item.status] ?? 'bg-border text-ink3'}`}>
                      {STATUS_LABELS[item.status] ?? item.status}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
