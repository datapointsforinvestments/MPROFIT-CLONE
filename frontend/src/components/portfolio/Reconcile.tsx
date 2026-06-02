import { useRef, useState } from 'react'
import clsx from 'clsx'
import { portfolioApi } from '../../api/client'
import type { ReconcileRow, Folio } from '../../types'

interface ReconcileResult {
  summary: { total_symbols: number; matched: number; demat_excess: number; book_excess: number }
  rows: ReconcileRow[]
}

interface Props {
  folios: Folio[]
}

export default function Reconcile({ folios }: Props) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [result, setResult] = useState<ReconcileResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [folioId, setFolioId] = useState<number | ''>('')
  const [filter, setFilter] = useState<'all' | 'discrepancies'>('all')

  async function handleFile(file: File) {
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const res = await portfolioApi.reconcile(file, folioId || undefined)
      setResult(res.data)
    } catch (e: unknown) {
      setError((e as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Reconciliation failed')
    } finally {
      setLoading(false)
    }
  }

  const filteredRows = result?.rows.filter((r) =>
    filter === 'all' ? true : r.status !== 'OK'
  ) ?? []

  return (
    <div className="space-y-4 max-w-3xl">
      <div>
        <h3 className="text-sm font-semibold text-ink mb-1">Demat Reconciliation</h3>
        <p className="text-xs text-ink3">
          Upload a demat statement CSV/Excel with columns <code className="bg-surface2 px-1 rounded">Symbol</code> and{' '}
          <code className="bg-surface2 px-1 rounded">Qty</code> to compare against book holdings.
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-xs text-ink3 mb-1">Restrict to Folio</label>
          <select
            className="border border-border rounded px-2 py-1.5 text-sm bg-surface"
            value={folioId}
            onChange={(e) => setFolioId(e.target.value ? Number(e.target.value) : '')}
          >
            <option value="">All Folios</option>
            {folios.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
        </div>
        <div>
          <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) handleFile(f)
            e.target.value = ''
          }} />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={loading}
            className="px-4 py-2 bg-accent text-white text-sm rounded hover:bg-accent/90 disabled:opacity-50"
          >
            {loading ? 'Processing…' : 'Upload Demat Statement'}
          </button>
        </div>
      </div>

      {error && <div className="bg-red/10 border border-red/30 text-red rounded-lg p-3 text-sm">{error}</div>}

      {result && (
        <div className="space-y-4">
          {/* Summary */}
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: 'Total Symbols', value: result.summary.total_symbols },
              { label: 'Matched', value: result.summary.matched, color: 'text-green' },
              { label: 'Demat Excess', value: result.summary.demat_excess, color: result.summary.demat_excess > 0 ? 'text-amber-600' : '' },
              { label: 'Book Excess', value: result.summary.book_excess, color: result.summary.book_excess > 0 ? 'text-red' : '' },
            ].map((s) => (
              <div key={s.label} className="bg-surface border border-border rounded-lg p-3 text-center">
                <div className={`text-2xl font-bold font-mono ${s.color ?? 'text-ink'}`}>{s.value}</div>
                <div className="text-xs text-ink3 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Filter toggle */}
          <div className="flex gap-2">
            {(['all', 'discrepancies'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={clsx('px-3 py-1.5 text-xs rounded border transition-colors', filter === f ? 'bg-accent text-white border-accent' : 'border-border text-ink3 hover:bg-surface2')}
              >
                {f === 'all' ? 'All' : 'Discrepancies Only'}
              </button>
            ))}
          </div>

          {/* Table */}
          <div className="bg-surface border border-border rounded-lg overflow-hidden">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-surface2 border-b border-border">
                  {['Symbol', 'Demat Qty', 'Book Qty', 'Difference', 'Status'].map((h) => (
                    <th key={h} className="px-4 py-2.5 text-left text-xs font-medium text-ink3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row) => (
                  <tr key={row.symbol} className={clsx('border-b border-border/50', row.status === 'OK' ? '' : 'bg-red/5')}>
                    <td className="px-4 py-2 font-medium text-sm font-mono">{row.symbol}</td>
                    <td className="px-4 py-2 font-mono text-xs">{row.demat_qty.toLocaleString('en-IN')}</td>
                    <td className="px-4 py-2 font-mono text-xs">{row.book_qty.toLocaleString('en-IN')}</td>
                    <td className={clsx('px-4 py-2 font-mono text-xs font-medium', row.difference === 0 ? 'text-ink3' : row.difference > 0 ? 'text-amber-600' : 'text-red')}>
                      {row.difference > 0 ? '+' : ''}{row.difference.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-2">
                      <span className={clsx('px-2 py-0.5 rounded text-xs font-medium',
                        row.status === 'OK' ? 'bg-green/10 text-green'
                        : row.status === 'DEMAT_EXCESS' ? 'bg-amber-100 text-amber-700'
                        : 'bg-red/10 text-red'
                      )}>
                        {row.status === 'OK' ? 'OK' : row.status === 'DEMAT_EXCESS' ? 'Demat Excess' : 'Book Excess'}
                      </span>
                    </td>
                  </tr>
                ))}
                {filteredRows.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-ink3 text-sm">No discrepancies found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
