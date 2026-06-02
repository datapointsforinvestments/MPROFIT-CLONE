import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ReferenceLine,
} from 'recharts'
import { portfolioApi } from '../../api/client'
import type { Folio } from '../../types'

// ── Types ─────────────────────────────────────────────────────────────────────

interface HoldingStat {
  symbol: string
  asset_name: string
  sector: string
  current_value: number
  weight_pct: number
  unrealised_pnl_pct: number | null
  cagr_pct: number | null
  xirr_pct: number | null
  pct_change_1y: number | null
  holding_days: number
  market_cap_cr: number | null
  market_cap_band: string
}

interface AnalyticsData {
  summary: {
    total_stocks: number
    total_value: number
    total_invested: number
    avg_holding_days: number
    fy_churn_pct: number | null
    fy_buy_amount: number
    fy_sell_amount: number
  }
  holdings: HoldingStat[]
  sector_chart: { name: string; value: number }[]
  market_cap_chart: { name: string; value: number }[]
  winners: Record<string, HoldingStat[]>
  losers: Record<string, HoldingStat[]>
}

// ── Colours ───────────────────────────────────────────────────────────────────

const PIE_COLORS = [
  '#2563eb','#f97316','#10b981','#8b5cf6','#ef4444',
  '#06b6d4','#f59e0b','#64748b','#ec4899','#84cc16',
]

const MC_COLORS: Record<string, string> = {
  'Large Cap': '#2563eb',
  'Mid Cap':   '#f97316',
  'Small Cap': '#10b981',
  'Unknown':   '#94a3b8',
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmtCr = (v: number) =>
  v >= 10_000_000 ? `₹${(v / 10_000_000).toFixed(1)}Cr`
  : v >= 100_000  ? `₹${(v / 100_000).toFixed(1)}L`
  : `₹${v.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`

const fmtDays = (d: number) => {
  if (d >= 365) return `${(d / 365).toFixed(1)}y`
  if (d >= 30)  return `${Math.round(d / 30)}m`
  return `${d}d`
}

const pctColor = (v: number | null) =>
  v === null ? 'text-ink3'
  : v >= 0   ? 'text-green'
  : 'text-red'

const pctFmt = (v: number | null, suffix = '') =>
  v === null ? '—' : `${v >= 0 ? '+' : ''}${v.toFixed(1)}%${suffix}`

// ── Sub-components ────────────────────────────────────────────────────────────

function KPICard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-surface border border-border rounded-lg px-4 py-3">
      <div className="text-xs text-ink3 font-medium">{label}</div>
      <div className="text-xl font-semibold text-ink mt-0.5">{value}</div>
      {sub && <div className="text-xs text-ink3 mt-0.5">{sub}</div>}
    </div>
  )
}

function WinnersLosersTable({
  winners, losers, label, metric, suffix, symbolMap, onNavigate,
}: {
  winners: HoldingStat[]
  losers: HoldingStat[]
  label: string
  metric: keyof HoldingStat
  suffix: string
  symbolMap: Record<string, { id: number; name: string }>
  onNavigate: (id: number) => void
}) {
  if (!winners.length && !losers.length) {
    return <div className="py-6 text-center text-xs text-ink3">No data for {label}</div>
  }
  const row = (h: HoldingStat, isWinner: boolean) => {
    const val = h[metric] as number | null
    const company = symbolMap[h.symbol]
    return (
      <div key={h.symbol} className="flex items-center gap-2 px-3 py-1.5 border-b border-border/50 last:border-0 hover:bg-surface2/50">
        <div className="flex-1 min-w-0">
          {company ? (
            <button
              onClick={() => onNavigate(company.id)}
              className="text-xs font-medium text-accent hover:underline text-left truncate block w-full"
            >
              {h.symbol}
            </button>
          ) : (
            <div className="text-xs font-medium text-ink truncate">{h.symbol}</div>
          )}
          <div className="text-[10px] text-ink3 truncate">{h.asset_name}</div>
        </div>
        <div className="text-right flex-shrink-0">
          <div className={`text-sm font-semibold ${isWinner ? 'text-green' : 'text-red'}`}>
            {pctFmt(val, suffix)}
          </div>
          <div className="text-[10px] text-ink3">{fmtDays(h.holding_days)}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="bg-surface border border-border rounded-lg overflow-hidden">
        <div className="px-3 py-2 bg-green/10 border-b border-border">
          <span className="text-xs font-semibold text-green">↑ Winners · {label}</span>
        </div>
        {winners.length ? winners.map((h) => row(h, true)) : (
          <div className="py-4 text-center text-xs text-ink3">None</div>
        )}
      </div>
      <div className="bg-surface border border-border rounded-lg overflow-hidden">
        <div className="px-3 py-2 bg-red/10 border-b border-border">
          <span className="text-xs font-semibold text-red">↓ Losers · {label}</span>
        </div>
        {losers.length ? losers.map((h) => row(h, false)) : (
          <div className="py-4 text-center text-xs text-ink3">None</div>
        )}
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

type WLTab = 'inception' | '1y_stock' | '1y_held' | '3y_held' | '5y_held'

interface Props {
  folios: Folio[]
  selectedFolio: number | null
  symbolMap?: Record<string, { id: number; name: string }>
}

export default function PortfolioAnalytics({ folios, selectedFolio, symbolMap = {} }: Props) {
  const navigate = useNavigate()
  const [data, setData]       = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [folio, setFolio]     = useState<number | ''>(selectedFolio ?? '')
  const [wlTab, setWlTab]     = useState<WLTab>('inception')

  async function load(folioId?: number | '') {
    setLoading(true); setError('')
    try {
      const res = await portfolioApi.analytics({
        folio_id: (folioId ?? folio) !== '' ? Number(folioId ?? folio) : undefined,
      })
      setData(res.data)
    } catch (e: unknown) {
      const detail = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setError(detail || 'Failed to load analytics')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setFolio(selectedFolio ?? '')
    load(selectedFolio ?? '')
  }, [selectedFolio]) // eslint-disable-line react-hooks/exhaustive-deps

  // Company weights for pie (top 10 + Others)
  const companyPie = (() => {
    if (!data) return []
    const sorted = [...data.holdings].sort((a, b) => b.weight_pct - a.weight_pct)
    const top10 = sorted.slice(0, 10)
    const others = sorted.slice(10).reduce((s, h) => s + h.weight_pct, 0)
    const items = top10.map((h) => ({ name: h.symbol, value: h.weight_pct }))
    if (others > 0.01) items.push({ name: 'Others', value: round2(others) })
    return items
  })()

  // Holding period distribution
  const holdingBuckets = (() => {
    if (!data) return []
    const b = [
      { name: '<1Y',  min: 0,         max: 365,       count: 0, value: 0 },
      { name: '1–3Y', min: 365,       max: 3 * 365,   count: 0, value: 0 },
      { name: '3–5Y', min: 3 * 365,   max: 5 * 365,   count: 0, value: 0 },
      { name: '5Y+',  min: 5 * 365,   max: Infinity,  count: 0, value: 0 },
    ]
    for (const h of data.holdings) {
      const bkt = b.find((bb) => h.holding_days >= bb.min && h.holding_days < bb.max)
      if (bkt) { bkt.count++; bkt.value += h.current_value }
    }
    return b
  })()

  const WL_TABS: { id: WLTab; label: string }[] = [
    { id: 'inception',  label: 'Since Buy' },
    { id: '1y_stock',   label: '1Y Stock Perf' },
    { id: '1y_held',    label: 'Held 1–3Y' },
    { id: '3y_held',    label: 'Held 3–5Y' },
    { id: '5y_held',    label: 'Held 5Y+' },
  ]

  const WL_MAP: Record<WLTab, { wKey: string; lKey: string; metric: keyof HoldingStat; suffix: string; label: string }> = {
    inception:  { wKey: 'since_inception',   lKey: 'since_inception',   metric: 'xirr_pct',       suffix: ' p.a.', label: 'XIRR since buy'   },
    '1y_stock': { wKey: 'by_1y_stock_perf',  lKey: 'by_1y_stock_perf',  metric: 'pct_change_1y',  suffix: '',      label: '52-week return'   },
    '1y_held':  { wKey: 'held_1y_3y',        lKey: 'held_1y_3y',        metric: 'cagr_pct',       suffix: ' p.a.', label: 'CAGR (held 1–3Y)' },
    '3y_held':  { wKey: 'held_3y_5y',        lKey: 'held_3y_5y',        metric: 'cagr_pct',       suffix: ' p.a.', label: 'CAGR (held 3–5Y)' },
    '5y_held':  { wKey: 'held_5y_plus',      lKey: 'held_5y_plus',      metric: 'cagr_pct',       suffix: ' p.a.', label: 'CAGR (held 5Y+)'  },
  }

  if (loading) return (
    <div className="py-20 text-center text-ink3 text-sm">Loading analytics…</div>
  )

  if (error) return (
    <div className="p-6 text-sm text-red bg-red/5 border border-red/20 rounded mx-6 mt-6">{error}</div>
  )

  if (!data) return (
    <div className="py-20 text-center text-ink3 text-sm">Select a folio to view analytics.</div>
  )

  const { summary, sector_chart, market_cap_chart, winners, losers } = data
  const wlConf = WL_MAP[wlTab]

  return (
    <div className="p-5 space-y-6 max-w-6xl">
      {/* Folio selector */}
      <div className="flex items-center gap-3">
        <select
          value={folio}
          onChange={(e) => {
            const v = e.target.value === '' ? '' : Number(e.target.value)
            setFolio(v)
            load(v)
          }}
          className="px-3 py-1.5 text-sm border border-border rounded bg-surface focus:outline-none focus:border-accent"
        >
          <option value="">All Folios</option>
          {folios.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
        </select>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KPICard label="Holdings" value={String(summary.total_stocks)} sub="active positions" />
        <KPICard label="Portfolio Value" value={fmtCr(summary.total_value)} sub={`Invested: ${fmtCr(summary.total_invested)}`} />
        <KPICard
          label="Avg Holding Period"
          value={fmtDays(summary.avg_holding_days)}
          sub={`${summary.avg_holding_days} days`}
        />
        <KPICard
          label="FY Churn"
          value={summary.fy_churn_pct !== null ? `${summary.fy_churn_pct}%` : '—'}
          sub={`Bought: ${fmtCr(summary.fy_buy_amount)} / Sold: ${fmtCr(summary.fy_sell_amount)}`}
        />
      </div>

      {/* Pie charts row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Company weights */}
        <div className="md:col-span-1 bg-surface border border-border rounded-lg p-4">
          <div className="text-sm font-semibold text-ink mb-3">By Company</div>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={companyPie} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} paddingAngle={1}>
                {companyPie.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(v: number) => `${v.toFixed(1)}%`} />
              <Legend iconSize={8} formatter={(v) => <span style={{ fontSize: 10 }}>{v}</span>} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Sector weights */}
        <div className="md:col-span-1 bg-surface border border-border rounded-lg p-4">
          <div className="text-sm font-semibold text-ink mb-3">By Sector</div>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={sector_chart} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} paddingAngle={1}>
                {sector_chart.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(v: number) => `${v.toFixed(1)}%`} />
              <Legend iconSize={8} formatter={(v) => <span style={{ fontSize: 10 }}>{v}</span>} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Market cap breakdown */}
        <div className="md:col-span-1 bg-surface border border-border rounded-lg p-4">
          <div className="text-sm font-semibold text-ink mb-1">By Market Cap</div>
          <div className="text-[10px] text-ink3 mb-3">Large &gt;₹1L Cr · Mid ₹10K–1L Cr · Small &lt;₹10K Cr</div>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={market_cap_chart} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} paddingAngle={2}>
                {market_cap_chart.map((entry) => <Cell key={entry.name} fill={MC_COLORS[entry.name] ?? '#94a3b8'} />)}
              </Pie>
              <Tooltip formatter={(v: number) => `${v.toFixed(1)}%`} />
              <Legend iconSize={8} formatter={(v) => <span style={{ fontSize: 10 }}>{v}</span>} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Holding period distribution */}
      <div className="bg-surface border border-border rounded-lg p-4">
        <div className="text-sm font-semibold text-ink mb-3">Holding Period Distribution</div>
        <div className="grid grid-cols-4 gap-3 mb-4">
          {holdingBuckets.map((b) => (
            <div key={b.name} className="text-center">
              <div className="text-lg font-semibold text-ink">{b.count}</div>
              <div className="text-xs text-ink3">{b.name}</div>
              <div className="text-[10px] text-ink3">{fmtCr(b.value)}</div>
            </div>
          ))}
        </div>
        <ResponsiveContainer width="100%" height={120}>
          <BarChart data={holdingBuckets} barSize={32} margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={24} />
            <Tooltip formatter={(v: number) => [`${v} stocks`, 'Count']} />
            <Bar dataKey="count" fill="#2563eb" radius={[3, 3, 0, 0]}>
              {holdingBuckets.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Winners & Losers */}
      <div className="bg-surface border border-border rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-ink mr-2">Winners &amp; Losers</span>
          {WL_TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setWlTab(t.id)}
              className={`px-3 py-1 text-xs rounded transition-colors ${
                wlTab === t.id
                  ? 'bg-accent text-white'
                  : 'text-ink2 hover:bg-surface2'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="p-4">
          <WinnersLosersTable
            winners={winners[wlConf.wKey] ?? []}
            losers={losers[wlConf.lKey] ?? []}
            label={wlConf.label}
            metric={wlConf.metric}
            suffix={wlConf.suffix}
            symbolMap={symbolMap}
            onNavigate={(id) => navigate(`/company/${id}`)}
          />
        </div>
      </div>

      {/* Holdings table */}
      <div className="bg-surface border border-border rounded-lg overflow-hidden">
        <div className="px-4 py-2.5 border-b border-border">
          <span className="text-sm font-semibold text-ink">All Holdings</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-surface2 border-b border-border">
                {['Symbol', 'Sector', 'Weight', 'Value', 'Unreal. Return', 'XIRR', '1Y Stock', 'Holding', 'Mkt Cap'].map((h) => (
                  <th key={h} className="px-3 py-2 text-left font-medium text-ink3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {[...data.holdings].sort((a, b) => b.weight_pct - a.weight_pct).map((h) => (
                <tr key={h.symbol} className="hover:bg-surface2/40">
                  <td className="px-3 py-2 font-medium text-ink">
                    {symbolMap[h.symbol] ? (
                      <button
                        onClick={() => navigate(`/company/${symbolMap[h.symbol].id}`)}
                        className="text-accent hover:underline font-medium"
                      >
                        {h.symbol}
                      </button>
                    ) : h.symbol}
                  </td>
                  <td className="px-3 py-2 text-ink3">{h.sector}</td>
                  <td className="px-3 py-2 text-ink">{h.weight_pct.toFixed(1)}%</td>
                  <td className="px-3 py-2 text-ink">{fmtCr(h.current_value)}</td>
                  <td className={`px-3 py-2 font-medium ${pctColor(h.unrealised_pnl_pct)}`}>{pctFmt(h.unrealised_pnl_pct)}</td>
                  <td className={`px-3 py-2 font-medium ${pctColor(h.xirr_pct)}`}>{pctFmt(h.xirr_pct, ' p.a.')}</td>
                  <td className={`px-3 py-2 ${pctColor(h.pct_change_1y)}`}>{pctFmt(h.pct_change_1y)}</td>
                  <td className="px-3 py-2 text-ink3">{fmtDays(h.holding_days)}</td>
                  <td className="px-3 py-2 text-ink3">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                      h.market_cap_band === 'large' ? 'bg-blue-100 text-blue-700' :
                      h.market_cap_band === 'mid'   ? 'bg-orange-100 text-orange-700' :
                      h.market_cap_band === 'small' ? 'bg-green-100 text-green-700' :
                      'bg-surface2 text-ink3'
                    }`}>
                      {h.market_cap_band === 'large' ? 'Large' :
                       h.market_cap_band === 'mid'   ? 'Mid'   :
                       h.market_cap_band === 'small' ? 'Small' : '—'}
                    </span>
                    {h.market_cap_cr && (
                      <span className="ml-1">{fmtCr(h.market_cap_cr * 10_000_000)}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function round2(v: number) { return Math.round(v * 100) / 100 }
