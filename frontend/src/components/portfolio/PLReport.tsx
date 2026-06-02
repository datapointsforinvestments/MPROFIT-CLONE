import { useEffect, useState } from 'react'
import clsx from 'clsx'
import { portfolioApi } from '../../api/client'
import type { PLReport as PLReportType, PLTransactionRow, Folio } from '../../types'

const fmtCr = (v: number) =>
  v >= 10_000_000 ? `₹${(v / 10_000_000).toFixed(1)}Cr`
  : v >= 100_000 ? `₹${(v / 100_000).toFixed(1)}L`
  : `₹${v.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`

interface Props {
  folios: Folio[]
}

export default function PLReport({ folios }: Props) {
  const [data, setData]       = useState<PLReportType | null>(null)
  const [loading, setLoading] = useState(false)
  const [folioId, setFolioId] = useState<number | ''>('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate]     = useState('')
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  function toggleExpand(key: string) {
    setExpanded((prev) => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

  async function load() {
    setLoading(true)
    try {
      const params: Record<string, string | number> = {}
      if (folioId) params.folio_id = folioId
      if (fromDate) params.from_date = fromDate
      if (toDate) params.to_date = toDate
      const res = await portfolioApi.plReport(params as Parameters<typeof portfolioApi.plReport>[0])
      setData(res.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function exportCsv() {
    if (!data) return
    const rows: PLTransactionRow[] = data.reports.flatMap((r) => r.transactions)
    const headers = ['Symbol', 'Folio', 'Buy Date', 'Sell Date', 'Qty', 'Buy Price', 'Sell Price', 'Cost', 'Proceeds', 'P&L', 'P&L%', 'Days', 'Category']
    const lines = [
      headers.join(','),
      ...rows.map((r) => [
        r.symbol, r.folio_name, r.buy_date, r.sell_date,
        r.quantity, r.buy_price.toFixed(2), r.sell_price.toFixed(2),
        r.buy_amount.toFixed(2), r.sell_amount.toFixed(2),
        r.gain_loss.toFixed(2), r.gain_loss_pct.toFixed(2),
        r.holding_days, r.tax_category,
      ].join(',')),
    ]
    const blob = new Blob([lines.join('\n')], { type: 'text/csv' })
    const url  = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'pl_report.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3 bg-surface border border-border rounded-lg p-3">
        <div>
          <label className="block text-xs text-ink3 mb-1">Folio</label>
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
          <label className="block text-xs text-ink3 mb-1">From Date</label>
          <input type="date" className="border border-border rounded px-2 py-1.5 text-sm bg-surface" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
        </div>
        <div>
          <label className="block text-xs text-ink3 mb-1">To Date</label>
          <input type="date" className="border border-border rounded px-2 py-1.5 text-sm bg-surface" value={toDate} onChange={(e) => setToDate(e.target.value)} />
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="px-4 py-1.5 bg-accent text-white text-sm rounded hover:bg-accent/90 disabled:opacity-50"
        >
          {loading ? 'Loading…' : 'Apply'}
        </button>
        {data && data.reports.length > 0 && (
          <button onClick={exportCsv} className="px-4 py-1.5 border border-border text-sm rounded hover:bg-border">
            Export CSV
          </button>
        )}
      </div>

      {data && (
        <>
          {/* Summary */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Total Realised P&L', value: data.summary.total_realised },
              { label: 'STCG (≤1 year)', value: data.summary.total_stcg },
              { label: 'LTCG (>1 year)', value: data.summary.total_ltcg },
            ].map((s) => (
              <div key={s.label} className="bg-surface border border-border rounded-lg px-4 py-3">
                <div className="text-xs text-ink3 mb-1">{s.label}</div>
                <div className={clsx('font-mono font-semibold text-sm', s.value >= 0 ? 'text-green' : 'text-red')}>
                  {s.value >= 0 ? '+' : ''}{fmtCr(Math.abs(s.value))}
                </div>
              </div>
            ))}
          </div>

          {/* Reports */}
          {data.reports.length === 0 ? (
            <p className="text-ink3 text-sm text-center py-8">No realised transactions in the selected period.</p>
          ) : (
            <div className="space-y-2">
              {data.reports.map((report) => {
                const key = `${report.folio_name}-${report.symbol}`
                const isOpen = expanded.has(key)
                return (
                  <div key={key} className="bg-surface border border-border rounded-lg overflow-hidden">
                    <button
                      className="w-full flex items-center justify-between px-4 py-3 hover:bg-surface2 text-left"
                      onClick={() => toggleExpand(key)}
                    >
                      <div className="flex items-center gap-4">
                        <span className="font-medium text-sm text-accent">{report.symbol}</span>
                        <span className="text-xs text-ink3">{report.folio_name}</span>
                        <span className="text-xs text-ink3">{report.asset_name}</span>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <div className="text-xs text-ink3">STCG</div>
                          <div className={clsx('font-mono text-xs', report.realised_stcg >= 0 ? 'text-green' : 'text-red')}>
                            {report.realised_stcg >= 0 ? '+' : ''}{fmtCr(Math.abs(report.realised_stcg))}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-ink3">LTCG</div>
                          <div className={clsx('font-mono text-xs', report.realised_ltcg >= 0 ? 'text-green' : 'text-red')}>
                            {report.realised_ltcg >= 0 ? '+' : ''}{fmtCr(Math.abs(report.realised_ltcg))}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-ink3">Total</div>
                          <div className={clsx('font-mono text-sm font-semibold', report.total_realised >= 0 ? 'text-green' : 'text-red')}>
                            {report.total_realised >= 0 ? '+' : ''}{fmtCr(Math.abs(report.total_realised))}
                          </div>
                        </div>
                        <span className="text-ink3 text-xs">{isOpen ? '▲' : '▼'}</span>
                      </div>
                    </button>

                    {isOpen && (
                      <div className="overflow-x-auto border-t border-border">
                        <table className="w-full text-xs border-collapse">
                          <thead>
                            <tr className="bg-surface2">
                              {['Buy Date', 'Sell Date', 'Qty', 'Buy ₹', 'Sell ₹', 'Cost', 'Proceeds', 'P&L', 'P&L%', 'Days', 'Category'].map((h) => (
                                <th key={h} className="px-3 py-2 text-left text-ink3 whitespace-nowrap font-medium">{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {report.transactions.map((t, idx) => (
                              <tr key={idx} className="border-t border-border/50">
                                <td className="px-3 py-2 font-mono">{t.buy_date.substring(0, 10)}</td>
                                <td className="px-3 py-2 font-mono">{t.sell_date.substring(0, 10)}</td>
                                <td className="px-3 py-2 font-mono">{t.quantity.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td>
                                <td className="px-3 py-2 font-mono">₹{t.buy_price.toFixed(2)}</td>
                                <td className="px-3 py-2 font-mono">₹{t.sell_price.toFixed(2)}</td>
                                <td className="px-3 py-2 font-mono">{fmtCr(t.buy_amount)}</td>
                                <td className="px-3 py-2 font-mono">{fmtCr(t.sell_amount)}</td>
                                <td className={clsx('px-3 py-2 font-mono font-medium', t.gain_loss >= 0 ? 'text-green' : 'text-red')}>
                                  {t.gain_loss >= 0 ? '+' : ''}{fmtCr(Math.abs(t.gain_loss))}
                                </td>
                                <td className={clsx('px-3 py-2 font-mono', t.gain_loss_pct >= 0 ? 'text-green' : 'text-red')}>
                                  {t.gain_loss_pct >= 0 ? '+' : ''}{t.gain_loss_pct.toFixed(1)}%
                                </td>
                                <td className="px-3 py-2 font-mono text-ink2">{t.holding_days}d</td>
                                <td className="px-3 py-2">
                                  <span className={clsx('px-1.5 py-0.5 rounded text-2xs font-medium', t.tax_category === 'LTCG' ? 'bg-green/15 text-green' : 'bg-amber-100 text-amber-700')}>
                                    {t.tax_category}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}
    </div>
  )
}
