import { useEffect, useState } from 'react'
import clsx from 'clsx'
import { portfolioApi } from '../../api/client'
import type { DividendRecord, DividendTotals, Folio } from '../../types'

interface Props {
  folios: Folio[]
}

const fmt = (v: number, dec = 2) =>
  v.toLocaleString('en-IN', { minimumFractionDigits: dec, maximumFractionDigits: dec })

const fmtCr = (v: number) =>
  v >= 10_000_000 ? `₹${(v / 10_000_000).toFixed(2)}Cr` : v >= 100_000 ? `₹${(v / 100_000).toFixed(2)}L` : `₹${fmt(v, 0)}`

export default function DividendLedger({ folios }: Props) {
  const [divs, setDivs]         = useState<DividendRecord[]>([])
  const [totals, setTotals]     = useState<DividendTotals | null>(null)
  const [loading, setLoading]   = useState(false)
  const [syncing, setSyncing]   = useState(false)
  const [syncResult, setSyncResult] = useState<string | null>(null)
  const [folioId, setFolioId]   = useState<number | ''>('')
  const [symbol, setSymbol]     = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate]     = useState('')

  async function load() {
    setLoading(true)
    try {
      const params: Record<string, string | number> = {}
      if (folioId)   params.folio_id  = folioId
      if (symbol)    params.symbol    = symbol.toUpperCase()
      if (fromDate)  params.from_date = fromDate
      if (toDate)    params.to_date   = toDate
      const [divsRes, totalsRes] = await Promise.all([
        portfolioApi.dividends(params as Parameters<typeof portfolioApi.dividends>[0]),
        portfolioApi.dividendTotals(folioId || undefined),
      ])
      setDivs(divsRes.data)
      setTotals(totalsRes.data)
    } finally {
      setLoading(false)
    }
  }

  async function handleSync() {
    if (!confirm('This will fetch dividend history from Yahoo Finance for all holdings. First run may take 2-3 minutes. Continue?')) return
    setSyncing(true)
    setSyncResult(null)
    try {
      const res = await portfolioApi.syncDividends()
      const { synced, skipped_no_data, deleted_transactions } = res.data
      setSyncResult(`Done — ${synced} dividend records added, ${skipped_no_data} stocks had no data, ${deleted_transactions} old dividend entries removed.`)
      await load()
    } catch (e: unknown) {
      setSyncResult('Sync failed: ' + ((e as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Unknown error'))
    } finally {
      setSyncing(false)
    }
  }

  useEffect(() => { load() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Group by stock for subtotals
  const byStock = divs.reduce<Record<string, { name: string; total: number; count: number }>>((acc, d) => {
    if (!acc[d.symbol]) acc[d.symbol] = { name: d.asset_name, total: 0, count: 0 }
    acc[d.symbol].total += d.total_received
    acc[d.symbol].count++
    return acc
  }, {})

  return (
    <div className="space-y-4">
      {/* Sync + Summary Row */}
      <div className="flex flex-wrap gap-3 items-start">
        {/* Summary cards */}
        {totals && (
          <div className="flex gap-3 flex-wrap flex-1">
            <div className="bg-surface border border-border rounded-lg px-4 py-3 min-w-[140px]">
              <div className="text-xs text-ink3 mb-1">Total Dividends (All Time)</div>
              <div className="font-mono font-semibold text-sm text-ink">{fmtCr(totals.total_all_time)}</div>
            </div>
            <div className="bg-surface border border-border rounded-lg px-4 py-3 min-w-[140px]">
              <div className="text-xs text-ink3 mb-1">Trailing 12 Months</div>
              <div className="font-mono font-semibold text-sm text-green">{fmtCr(totals.trailing_12m)}</div>
            </div>
            {totals.last_sync && (
              <div className="bg-surface border border-border rounded-lg px-4 py-3 min-w-[140px]">
                <div className="text-xs text-ink3 mb-1">Last Synced</div>
                <div className="text-xs text-ink2">{new Date(totals.last_sync).toLocaleDateString('en-IN')}</div>
              </div>
            )}
          </div>
        )}

        {/* Sync button */}
        <div className="flex-shrink-0">
          <button
            onClick={handleSync}
            disabled={syncing}
            className="px-4 py-2 bg-accent text-white text-sm rounded hover:bg-accent/90 disabled:opacity-50 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {syncing ? 'Syncing... (may take 2-3 min)' : 'Sync from Yahoo Finance'}
          </button>
          {syncResult && <p className="text-xs text-ink3 mt-1 max-w-xs">{syncResult}</p>}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs text-ink3 mb-1">Folio</label>
          <select
            className="border border-border rounded px-2 py-1.5 text-sm bg-surface"
            value={folioId}
            onChange={(e) => setFolioId(e.target.value === '' ? '' : Number(e.target.value))}
          >
            <option value="">All Folios</option>
            {folios.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-ink3 mb-1">Symbol</label>
          <input className="border border-border rounded px-2 py-1.5 text-sm bg-surface w-28" placeholder="e.g. HDFCBANK" value={symbol} onChange={(e) => setSymbol(e.target.value)} />
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
      </div>

      {divs.length === 0 && !loading ? (
        <div className="py-16 text-center text-ink3 text-sm">
          {totals?.last_sync ? 'No dividends match your filters.' : 'No dividend data yet. Click "Sync from Yahoo Finance" to fetch historical dividends.'}
        </div>
      ) : (
        <>
          {/* Per-stock subtotals */}
          {Object.keys(byStock).length > 1 && (
            <div className="bg-surface border border-border rounded-lg overflow-hidden">
              <div className="px-4 py-2 border-b border-border bg-surface2">
                <span className="text-xs font-semibold text-ink3 uppercase tracking-wide">Stock-wise Totals</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-surface2">
                    <tr>
                      {['Symbol', 'Company', 'Dividends', 'Total Received'].map(h => (
                        <th key={h} className="px-3 py-2 text-left text-ink3 font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(byStock).sort((a, b) => b[1].total - a[1].total).map(([sym, s]) => (
                      <tr key={sym} className="border-t border-border/50 hover:bg-surface2">
                        <td className="px-3 py-1.5 font-medium text-accent font-mono">{sym}</td>
                        <td className="px-3 py-1.5 text-ink2 truncate max-w-[180px]">{s.name}</td>
                        <td className="px-3 py-1.5 text-ink3">{s.count}</td>
                        <td className="px-3 py-1.5 font-mono font-semibold text-green">{fmtCr(s.total)}</td>
                      </tr>
                    ))}
                    <tr className="border-t border-border bg-surface2 font-semibold">
                      <td colSpan={3} className="px-3 py-1.5 text-ink">Total (filtered)</td>
                      <td className="px-3 py-1.5 font-mono text-green">{fmtCr(divs.reduce((s, d) => s + d.total_received, 0))}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Detail table */}
          <div className="bg-surface border border-border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-surface2">
                  <tr>
                    {['Ex-Date', 'Folio', 'Symbol', 'Company', '₹/Share', 'Qty Held', 'Total Received'].map(h => (
                      <th key={h} className={clsx('px-3 py-2 text-left text-ink3 font-medium', ['₹/Share', 'Qty Held', 'Total Received'].includes(h) && 'text-right')}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {divs.map((d) => (
                    <tr key={d.id} className="border-t border-border/50 hover:bg-surface2">
                      <td className="px-3 py-1.5 text-ink2 font-mono">{d.ex_date}</td>
                      <td className="px-3 py-1.5 text-ink2">{d.folio_name}</td>
                      <td className="px-3 py-1.5 font-medium text-accent font-mono">{d.symbol}</td>
                      <td className="px-3 py-1.5 text-ink2 truncate max-w-[180px]">{d.asset_name}</td>
                      <td className="px-3 py-1.5 font-mono text-right">₹{fmt(d.dividend_per_share, 4)}</td>
                      <td className="px-3 py-1.5 font-mono text-right">{fmt(d.qty_held, 0)}</td>
                      <td className="px-3 py-1.5 font-mono font-semibold text-green text-right">{fmtCr(d.total_received)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-3 py-2 border-t border-border text-xs text-ink3">
              {divs.length} records
            </div>
          </div>
        </>
      )}
    </div>
  )
}
