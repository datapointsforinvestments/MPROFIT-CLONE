import { useEffect, useState } from 'react'
import clsx from 'clsx'
import { portfolioApi } from '../../api/client'
import type { PortfolioTransaction, Folio } from '../../types'

interface Props {
  folios: Folio[]
  canAdd?: boolean
  canDelete?: boolean
}

const TRANS_TYPES = ['Buy', 'Sell', 'Bonus', 'Split', 'Dividend', 'Transfer_In', 'Transfer_Out']

const typeColor: Record<string, string> = {
  Buy: 'text-green bg-green/10',
  Sell: 'text-red bg-red/10',
  Bonus: 'text-blue-600 bg-blue-50',
  Split: 'text-purple-600 bg-purple-50',
  Dividend: 'text-amber-600 bg-amber-50',
  Transfer_In: 'text-green bg-green/10',
  Transfer_Out: 'text-red bg-red/10',
}

export default function TransactionLedger({ folios, canAdd = true, canDelete = true }: Props) {
  const [txns, setTxns]       = useState<PortfolioTransaction[]>([])
  const [loading, setLoading] = useState(false)
  const [folioId, setFolioId] = useState<number | ''>('')
  const [symbol, setSymbol]   = useState('')
  const [transType, setTransType] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate]     = useState('')
  const [showAdd, setShowAdd]   = useState(false)
  const [deleting, setDeleting] = useState<number | null>(null)

  // Add form
  const [form, setForm] = useState({ folio_id: '', symbol: '', trade_date: '', trans_type: 'Buy', quantity: '', price: '', notes: '' })
  const [saving, setSaving] = useState(false)

  // Edit state
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editForm, setEditForm] = useState({ trade_date: '', trans_type: 'Buy', quantity: '', price: '', notes: '' })
  const [editSaving, setEditSaving] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const params: Record<string, string | number> = {}
      if (folioId)   params.folio_id   = folioId
      if (symbol)    params.symbol     = symbol.toUpperCase()
      if (transType) params.trans_type = transType
      if (fromDate)  params.from_date  = fromDate
      if (toDate)    params.to_date    = toDate
      const res = await portfolioApi.transactions(params as Parameters<typeof portfolioApi.transactions>[0])
      setTxns(res.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleAdd() {
    if (!form.folio_id || !form.symbol || !form.trade_date) return
    setSaving(true)
    try {
      await portfolioApi.addTransaction({
        folio_id:    Number(form.folio_id),
        symbol:      form.symbol.toUpperCase(),
        trade_date:  form.trade_date,
        trans_type:  form.trans_type,
        quantity:    Number(form.quantity),
        price:       Number(form.price),
        total_amount: Number(form.quantity) * Number(form.price),
        notes:       form.notes || undefined,
      })
      setForm({ folio_id: '', symbol: '', trade_date: '', trans_type: 'Buy', quantity: '', price: '', notes: '' })
      setShowAdd(false)
      await load()
    } catch (e: unknown) {
      alert((e as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Failed to add transaction')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Delete this transaction?')) return
    setDeleting(id)
    try {
      await portfolioApi.deleteTransaction(id)
      setTxns((prev) => prev.filter((t) => t.id !== id))
    } finally {
      setDeleting(null)
    }
  }

  function startEdit(t: PortfolioTransaction) {
    setEditingId(t.id)
    setEditForm({
      trade_date: t.trade_date.substring(0, 10),
      trans_type: t.trans_type,
      quantity:   String(t.quantity),
      price:      String(t.price),
      notes:      t.notes || '',
    })
  }

  function cancelEdit() {
    setEditingId(null)
  }

  async function handleEditSave(id: number) {
    setEditSaving(true)
    try {
      await portfolioApi.updateTransaction(id, {
        trade_date: editForm.trade_date,
        trans_type: editForm.trans_type,
        quantity:   Number(editForm.quantity),
        price:      Number(editForm.price),
        notes:      editForm.notes || null,
      })
      setEditingId(null)
      await load()
    } catch (e: unknown) {
      alert((e as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Failed to update transaction')
    } finally {
      setEditSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3 bg-surface border border-border rounded-lg p-3">
        <div>
          <label className="block text-xs text-ink3 mb-1">Folio</label>
          <select className="border border-border rounded px-2 py-1.5 text-sm bg-surface" value={folioId} onChange={(e) => setFolioId(e.target.value ? Number(e.target.value) : '')}>
            <option value="">All Folios</option>
            {folios.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-ink3 mb-1">Symbol</label>
          <input type="text" placeholder="e.g. INFY" className="border border-border rounded px-2 py-1.5 text-sm w-24 bg-surface uppercase" value={symbol} onChange={(e) => setSymbol(e.target.value)} />
        </div>
        <div>
          <label className="block text-xs text-ink3 mb-1">Type</label>
          <select className="border border-border rounded px-2 py-1.5 text-sm bg-surface" value={transType} onChange={(e) => setTransType(e.target.value)}>
            <option value="">All Types</option>
            {TRANS_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-ink3 mb-1">From</label>
          <input type="date" className="border border-border rounded px-2 py-1.5 text-sm bg-surface" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
        </div>
        <div>
          <label className="block text-xs text-ink3 mb-1">To</label>
          <input type="date" className="border border-border rounded px-2 py-1.5 text-sm bg-surface" value={toDate} onChange={(e) => setToDate(e.target.value)} />
        </div>
        <button onClick={load} disabled={loading} className="px-4 py-1.5 bg-accent text-white text-sm rounded hover:bg-accent/90 disabled:opacity-50">
          {loading ? 'Loading…' : 'Apply'}
        </button>
        {canAdd && (
          <button onClick={() => setShowAdd((p) => !p)} className="px-4 py-1.5 border border-border text-sm rounded hover:bg-surface2">
            + Add Transaction
          </button>
        )}
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="bg-surface border border-border rounded-lg p-4 space-y-3">
          <h4 className="text-sm font-medium text-ink">Add Transaction</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs text-ink3 mb-1">Folio*</label>
              <select className="w-full border border-border rounded px-2 py-1.5 text-sm bg-surface" value={form.folio_id} onChange={(e) => setForm((p) => ({ ...p, folio_id: e.target.value }))}>
                <option value="">Select…</option>
                {folios.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-ink3 mb-1">NSE Symbol*</label>
              <input type="text" className="w-full border border-border rounded px-2 py-1.5 text-sm uppercase bg-surface" placeholder="e.g. HDFCLIFE" value={form.symbol} onChange={(e) => setForm((p) => ({ ...p, symbol: e.target.value }))} />
              <p className="text-[10px] text-ink3 mt-0.5">Enter exact NSE/BSE ticker</p>
            </div>
            <div>
              <label className="block text-xs text-ink3 mb-1">Date*</label>
              <input type="date" className="w-full border border-border rounded px-2 py-1.5 text-sm bg-surface" value={form.trade_date} onChange={(e) => setForm((p) => ({ ...p, trade_date: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs text-ink3 mb-1">Type</label>
              <select className="w-full border border-border rounded px-2 py-1.5 text-sm bg-surface" value={form.trans_type} onChange={(e) => setForm((p) => ({ ...p, trans_type: e.target.value }))}>
                {TRANS_TYPES.map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-ink3 mb-1">Qty</label>
              <input type="number" className="w-full border border-border rounded px-2 py-1.5 text-sm bg-surface" value={form.quantity} onChange={(e) => setForm((p) => ({ ...p, quantity: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs text-ink3 mb-1">Price</label>
              <input type="number" className="w-full border border-border rounded px-2 py-1.5 text-sm bg-surface" value={form.price} onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))} />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs text-ink3 mb-1">Notes</label>
              <input type="text" className="w-full border border-border rounded px-2 py-1.5 text-sm bg-surface" value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleAdd} disabled={saving || !form.folio_id || !form.symbol || !form.trade_date} className="px-4 py-1.5 bg-accent text-white text-sm rounded hover:bg-accent/90 disabled:opacity-50">
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button onClick={() => setShowAdd(false)} className="px-4 py-1.5 border border-border text-sm rounded hover:bg-surface2">Cancel</button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="text-xs text-ink3 mb-1">{txns.length} transactions</div>
      <div className="bg-surface border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-surface2 border-b border-border">
                {['Date', 'Folio', 'Symbol', 'Type', 'Qty', 'Price', 'Amount', 'Notes', ''].map((h) => (
                  <th key={h} className="px-3 py-2.5 text-left text-xs font-medium text-ink3 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {txns.map((t) => {
                const isEditing = editingId === t.id
                return (
                  <tr key={t.id} className={clsx('border-b border-border/50', isEditing ? 'bg-accent-light/20' : 'hover:bg-accent-light/20')}>
                    {/* Date */}
                    <td className="px-3 py-2">
                      {isEditing ? (
                        <input type="date" value={editForm.trade_date} onChange={(e) => setEditForm((p) => ({ ...p, trade_date: e.target.value }))}
                          className="border border-border rounded px-1.5 py-0.5 text-xs bg-white w-32" />
                      ) : (
                        <span className="font-mono text-xs">{t.trade_date.substring(0, 10)}</span>
                      )}
                    </td>
                    {/* Folio */}
                    <td className="px-3 py-2 text-xs text-ink2">{t.folio_name}</td>
                    {/* Symbol */}
                    <td className="px-3 py-2 font-medium text-xs font-mono text-accent">{t.symbol}</td>
                    {/* Type */}
                    <td className="px-3 py-2">
                      {isEditing ? (
                        <select value={editForm.trans_type} onChange={(e) => setEditForm((p) => ({ ...p, trans_type: e.target.value }))}
                          className="border border-border rounded px-1.5 py-0.5 text-xs bg-white">
                          {TRANS_TYPES.map((tt) => <option key={tt}>{tt}</option>)}
                        </select>
                      ) : (
                        <span className={clsx('px-1.5 py-0.5 rounded text-2xs font-medium', typeColor[t.trans_type] ?? 'text-ink bg-surface2')}>
                          {t.trans_type}
                        </span>
                      )}
                    </td>
                    {/* Qty */}
                    <td className="px-3 py-2">
                      {isEditing ? (
                        <input type="number" value={editForm.quantity} onChange={(e) => setEditForm((p) => ({ ...p, quantity: e.target.value }))}
                          className="border border-border rounded px-1.5 py-0.5 text-xs bg-white w-20" />
                      ) : (
                        <span className="font-mono text-xs">{t.quantity.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                      )}
                    </td>
                    {/* Price */}
                    <td className="px-3 py-2">
                      {isEditing ? (
                        <input type="number" value={editForm.price} onChange={(e) => setEditForm((p) => ({ ...p, price: e.target.value }))}
                          className="border border-border rounded px-1.5 py-0.5 text-xs bg-white w-24" />
                      ) : (
                        <span className="font-mono text-xs">₹{t.price.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                      )}
                    </td>
                    {/* Amount */}
                    <td className="px-3 py-2 font-mono text-xs">
                      {isEditing
                        ? <span className="text-ink3">₹{(Number(editForm.quantity) * Number(editForm.price)).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                        : `₹${t.total_amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
                      }
                    </td>
                    {/* Notes */}
                    <td className="px-3 py-2">
                      {isEditing ? (
                        <input type="text" value={editForm.notes} onChange={(e) => setEditForm((p) => ({ ...p, notes: e.target.value }))}
                          className="border border-border rounded px-1.5 py-0.5 text-xs bg-white w-28" placeholder="Notes" />
                      ) : (
                        <span className="text-xs text-ink3 max-w-[120px] truncate block">{t.notes || ''}</span>
                      )}
                    </td>
                    {/* Actions */}
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        {isEditing ? (
                          <>
                            <button onClick={() => handleEditSave(t.id)} disabled={editSaving}
                              className="text-xs px-2 py-0.5 bg-accent text-white rounded hover:bg-accent/90 disabled:opacity-50">
                              {editSaving ? '…' : 'Save'}
                            </button>
                            <button onClick={cancelEdit} className="text-xs text-ink3 hover:text-ink">Cancel</button>
                          </>
                        ) : (
                          <>
                            {canDelete && (
                              <button onClick={() => startEdit(t)} className="text-xs text-ink3 hover:text-accent" title="Edit">
                                ✎
                              </button>
                            )}
                            {canDelete && (
                              <button onClick={() => handleDelete(t.id)} disabled={deleting === t.id}
                                className="text-red/60 hover:text-red text-xs disabled:opacity-40" title="Delete">
                                {deleting === t.id ? '…' : '✕'}
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
              {txns.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-10 text-center text-ink3 text-sm">
                    {loading ? 'Loading…' : 'No transactions found.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
