import { useEffect, useState } from 'react'
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ReferenceLine,
} from 'recharts'
import { portfolioApi } from '../../api/client'
import type { Folio } from '../../types'

interface PeriodData {
  key: string
  label: string
  is_short: boolean
  insufficient_data: boolean
  actual_years: number
  cutoff_date: string
  portfolio_return: number | null
  benchmarks: Record<string, number | null>
}

interface ReturnsData {
  periods: PeriodData[]
  total_current_value: number
  selected_benchmarks: { key: string; label: string }[]
  fy_start: string
}

const BM_COLOR_PALETTE = ['#f97316', '#8b5cf6', '#10b981', '#ef4444', '#06b6d4', '#f59e0b', '#ec4899', '#64748b']

const PORTFOLIO_COLOR = '#2563eb'  // blue

interface BenchmarkDef { id: number; key: string; label: string; yahoo_symbol: string; is_active: boolean }


function fmt(v: number | null, isShort: boolean): string {
  if (v === null || v === undefined) return '—'
  const suffix = isShort ? '%' : '% p.a.'
  return `${v >= 0 ? '+' : ''}${v.toFixed(1)}${suffix}`
}

const CustomTooltip = ({ active, payload, label }: {
  active?: boolean
  payload?: { name: string; value: number; color: string; payload: { is_short: boolean } }[]
  label?: string
}) => {
  if (!active || !payload?.length) return null
  const isShort = payload[0]?.payload?.is_short ?? false
  return (
    <div className="bg-bg border border-border rounded-lg px-3 py-2 shadow-lg text-xs">
      <div className="font-semibold text-ink mb-1.5">{label}</div>
      {payload.map((p) => (
        <div key={p.name} className="flex justify-between gap-4 mb-0.5">
          <span style={{ color: p.color }}>{p.name}</span>
          <span className={`font-medium ${p.value >= 0 ? 'text-green' : 'text-red'}`}>
            {fmt(p.value, isShort)}
          </span>
        </div>
      ))}
      {isShort && <div className="mt-1 text-ink3 text-[10px]">Absolute return</div>}
      {!isShort && <div className="mt-1 text-ink3 text-[10px]">CAGR (annualised)</div>}
    </div>
  )
}

interface Props {
  folios: Folio[]
  selectedFolio: number | null
}

const CACHE_KEY = (folio: number | '') => `returns_cache_${folio}`

export default function ReturnsReport({ folios, selectedFolio }: Props) {
  const [data, setData]             = useState<ReturnsData | null>(null)
  const [loading, setLoading]       = useState(false)
  const [loadedAt, setLoadedAt]     = useState<Date | null>(null)
  const [error, setError]           = useState('')
  const [availBMs, setAvailBMs]     = useState<BenchmarkDef[]>([])
  const [activeBMs, setActiveBMs]   = useState<Set<string>>(new Set())
  const [folio, setFolio]           = useState<number | ''>(selectedFolio ?? '')
  const [showAddBM, setShowAddBM]   = useState(false)
  const [newLabel, setNewLabel]     = useState('')
  const [newSymbol, setNewSymbol]   = useState('')
  const [addingBM, setAddingBM]     = useState(false)
  const [deletingBM, setDeletingBM] = useState<number | null>(null)

  async function loadBenchmarks() {
    try {
      const r = await portfolioApi.benchmarks()
      const bms: BenchmarkDef[] = r.data as BenchmarkDef[]
      setAvailBMs(bms)
      setActiveBMs(prev => prev.size > 0 ? prev : new Set(bms.map(b => b.yahoo_symbol)))
    } catch { /* ignore */ }
  }

  useEffect(() => { loadBenchmarks() }, [])

  // Restore cached data on mount / folio change
  useEffect(() => {
    const cached = sessionStorage.getItem(CACHE_KEY(folio))
    if (cached) {
      try {
        const { data: d, at } = JSON.parse(cached)
        setData(d)
        setLoadedAt(new Date(at))
      } catch { /* ignore */ }
    } else {
      setData(null)
      setLoadedAt(null)
    }
  }, [folio])

  useEffect(() => {
    if (folio !== selectedFolio) setFolio(selectedFolio ?? '')
  }, [selectedFolio]) // eslint-disable-line react-hooks/exhaustive-deps

  function toggleBM(symbol: string) {
    setActiveBMs((prev) => {
      const next = new Set(prev)
      next.has(symbol) ? next.delete(symbol) : next.add(symbol)
      return next
    })
  }

  const bmColorMap: Record<string, string> = {}
  availBMs.forEach((b, i) => { bmColorMap[b.yahoo_symbol] = BM_COLOR_PALETTE[i % BM_COLOR_PALETTE.length] })

  async function load() {
    setLoading(true); setError('')
    try {
      const res = await portfolioApi.returns({
        folio_id: folio !== '' ? folio : undefined,
        benchmarks: [...activeBMs].join(',') || 'all',
      })
      setData(res.data)
      const now = new Date()
      setLoadedAt(now)
      sessionStorage.setItem(CACHE_KEY(folio), JSON.stringify({ data: res.data, at: now.toISOString() }))
    } catch (e: unknown) {
      const detail = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setError(detail || 'Failed to load returns data')
    } finally {
      setLoading(false)
    }
  }

  async function handleAddBM() {
    if (!newLabel.trim() || !newSymbol.trim()) return
    setAddingBM(true)
    try {
      await portfolioApi.addBenchmark(newLabel.trim(), newSymbol.trim().toUpperCase())
      setNewLabel(''); setNewSymbol(''); setShowAddBM(false)
      await loadBenchmarks()
    } finally { setAddingBM(false) }
  }

  async function handleDeleteBM(bm: BenchmarkDef) {
    if (!confirm(`Remove benchmark "${bm.label}"?`)) return
    setDeletingBM(bm.id)
    try {
      await portfolioApi.deleteBenchmark(bm.id)
      await loadBenchmarks()
    } finally { setDeletingBM(null) }
  }

  // Chart data — flatten periods into recharts format
  const chartData = (data?.periods ?? []).map((p) => {
    const row: Record<string, unknown> = {
      label: p.label, is_short: p.is_short,
      insufficient_data: p.insufficient_data, portfolio: p.portfolio_return,
    }
    for (const bm of data?.selected_benchmarks ?? []) {
      row[bm.key] = p.benchmarks[bm.key] ?? null
    }
    return row
  }).filter((r) => r.portfolio !== null || Object.values(r).some((v) => v !== null))

  return (
    <div className="p-5 space-y-5">
      {/* Controls */}
      <div className="flex flex-wrap items-start gap-4">
        <div>
          <div className="text-xs font-medium text-ink3 mb-1.5">Folio</div>
          <select
            value={folio}
            onChange={(e) => setFolio(e.target.value === '' ? '' : Number(e.target.value))}
            className="px-3 py-1.5 text-sm border border-border rounded bg-surface focus:outline-none focus:border-accent"
          >
            <option value="">All Folios</option>
            {folios.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
        </div>

        <div>
          <div className="text-xs font-medium text-ink3 mb-1.5">Benchmarks</div>
          <div className="flex flex-wrap gap-2">
            {availBMs.map((bm) => (
              <div key={bm.yahoo_symbol} className="group relative flex items-center">
                <button
                  onClick={() => toggleBM(bm.yahoo_symbol)}
                  className={`pl-3 pr-6 py-1 text-xs rounded-full border font-medium transition-colors ${
                    activeBMs.has(bm.yahoo_symbol)
                      ? 'text-white border-transparent'
                      : 'bg-surface text-ink3 border-border hover:border-ink3'
                  }`}
                  style={activeBMs.has(bm.yahoo_symbol) ? { backgroundColor: bmColorMap[bm.yahoo_symbol] } : {}}
                >
                  {bm.label}
                </button>
                <button
                  onClick={() => handleDeleteBM(bm)}
                  disabled={deletingBM === bm.id}
                  className="absolute right-1.5 opacity-0 group-hover:opacity-100 text-[10px] leading-none text-white/70 hover:text-white transition-opacity"
                  title="Remove benchmark"
                >
                  ✕
                </button>
              </div>
            ))}
            <button
              onClick={() => setShowAddBM(p => !p)}
              className="px-3 py-1 text-xs rounded-full border border-dashed border-border text-ink3 hover:border-accent hover:text-accent transition-colors"
            >
              + Add
            </button>
          </div>
          {showAddBM && (
            <div className="mt-2 flex gap-2 items-center">
              <input
                placeholder="Label (e.g. Nifty 500)"
                value={newLabel}
                onChange={e => setNewLabel(e.target.value)}
                className="border border-border rounded px-2 py-1 text-xs bg-surface w-36"
              />
              <input
                placeholder="Yahoo symbol (e.g. ^CRSLDX)"
                value={newSymbol}
                onChange={e => setNewSymbol(e.target.value)}
                className="border border-border rounded px-2 py-1 text-xs bg-surface w-44 font-mono"
                onKeyDown={e => e.key === 'Enter' && handleAddBM()}
              />
              <button onClick={handleAddBM} disabled={addingBM || !newLabel || !newSymbol}
                className="px-3 py-1 text-xs bg-accent text-white rounded hover:bg-accent/90 disabled:opacity-50">
                {addingBM ? '…' : 'Add'}
              </button>
              <button onClick={() => setShowAddBM(false)} className="text-xs text-ink3 hover:text-ink">Cancel</button>
            </div>
          )}
        </div>

        <div className="self-end flex items-center gap-2">
          <button
            onClick={load}
            disabled={loading}
            className="px-4 py-1.5 text-sm bg-accent text-white rounded hover:bg-accent/90 disabled:opacity-50 font-medium"
          >
            {loading ? 'Loading…' : data ? 'Refresh' : 'Load Returns'}
          </button>
          {loadedAt && !loading && (
            <span className="text-2xs text-ink3">
              Last loaded {loadedAt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>
      </div>

      {error && <div className="text-sm text-red bg-red/5 border border-red/20 rounded px-3 py-2">{error}</div>}

      {loading && (
        <div className="py-16 text-center text-ink3 text-sm">
          Fetching historical prices & computing returns…
          <div className="text-xs mt-1 text-ink3/70">This may take 10–20 seconds</div>
        </div>
      )}

      {!loading && data && (
        <>
          {/* Chart legend note */}
          <div className="flex items-center gap-3 text-xs text-ink3">
            <span>Short periods (1M, 3M, FY YTD) show absolute return.</span>
            <span>Longer periods (1Y+) show CAGR (annualised).</span>
            {data.fy_start && (
              <span>FY starts {new Date(data.fy_start).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
            )}
          </div>

          {/* Bar chart */}
          <div className="bg-surface border border-border rounded-lg p-4">
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }} barGap={3} barCategoryGap="25%">
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `${v}%`}
                  width={48}
                />
                <ReferenceLine y={0} stroke="#94a3b8" strokeWidth={1} />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  formatter={(value) => <span style={{ fontSize: 11, color: '#475569' }}>{value}</span>}
                />
                <Bar dataKey="portfolio" name="Portfolio" fill={PORTFOLIO_COLOR} radius={[3, 3, 0, 0]} maxBarSize={36} />
                {data.selected_benchmarks.map((bm) => (
                  <Bar key={bm.key} dataKey={bm.key} name={bm.label}
                    fill={bmColorMap[bm.key] ?? '#94a3b8'} radius={[3, 3, 0, 0]} maxBarSize={36} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Summary table */}
          <div className="bg-surface border border-border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-surface2 border-b border-border">
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-ink3">Period</th>
                  <th className="px-4 py-2.5 text-right text-xs font-medium text-ink3">
                    <span style={{ color: PORTFOLIO_COLOR }}>■</span> Portfolio
                  </th>
                  {data.selected_benchmarks.map((bm) => (
                    <th key={bm.key} className="px-4 py-2.5 text-right text-xs font-medium text-ink3">
                      <span style={{ color: bmColorMap[bm.key] ?? '#94a3b8' }}>■</span> {bm.label}
                    </th>
                  ))}
                  <th className="px-4 py-2.5 text-right text-xs font-medium text-ink3">vs Best BM</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {data.periods.map((p) => {
                  const bmVals = data.selected_benchmarks
                    .map((bm) => p.benchmarks[bm.key])
                    .filter((v) => v !== null) as number[]
                  const bestBM = bmVals.length ? Math.max(...bmVals) : null
                  const alpha  = p.portfolio_return !== null && bestBM !== null
                    ? p.portfolio_return - bestBM : null

                  return (
                    <tr key={p.key} className="hover:bg-surface2/50 transition-colors">
                      <td className="px-4 py-2.5">
                        <div className="text-sm font-medium text-ink">{p.label}</div>
                        {p.insufficient_data && (
                          <div className="text-[10px] text-ink3">since inception ({p.actual_years}y)</div>
                        )}
                        {!p.insufficient_data && (
                          <div className="text-[10px] text-ink3">
                            {p.is_short ? 'absolute' : 'CAGR p.a.'}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <span className={`font-semibold text-sm ${
                          p.portfolio_return === null ? 'text-ink3'
                          : p.portfolio_return >= 0 ? 'text-green' : 'text-red'
                        }`}>
                          {p.portfolio_return !== null ? `${p.portfolio_return >= 0 ? '+' : ''}${p.portfolio_return.toFixed(1)}%` : '—'}
                        </span>
                      </td>
                      {data.selected_benchmarks.map((bm) => {
                        const v = p.benchmarks[bm.key]
                        return (
                          <td key={bm.key} className="px-4 py-2.5 text-right text-sm text-ink2">
                            {v !== null && v !== undefined ? `${v >= 0 ? '+' : ''}${v.toFixed(1)}%` : '—'}
                          </td>
                        )
                      })}
                      <td className="px-4 py-2.5 text-right">
                        {alpha !== null ? (
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                            alpha >= 0 ? 'bg-green/10 text-green' : 'bg-red/10 text-red'
                          }`}>
                            {alpha >= 0 ? '+' : ''}{alpha.toFixed(1)}%
                          </span>
                        ) : '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {!loading && !data && !error && (
        <div className="py-16 text-center text-ink3 text-sm">
          Select benchmarks and click <strong>Load Returns</strong> to compute performance.
        </div>
      )}
    </div>
  )
}