import { useEffect, useState } from 'react'
import clsx from 'clsx'
import { portfolioApi, companiesApi } from '../api/client'
import { useAuthStore } from '../store/authStore'
import type { Folio, FolioSummary, ConsolidatedSummary } from '../types'
import PortfolioGrid from '../components/portfolio/PortfolioGrid'
import BulkUpload from '../components/portfolio/BulkUpload'
import PLReport from '../components/portfolio/PLReport'
import Reconcile from '../components/portfolio/Reconcile'
import TransactionLedger from '../components/portfolio/TransactionLedger'
import DividendLedger from '../components/portfolio/DividendLedger'
import ReturnsReport from '../components/portfolio/ReturnsReport'
import PortfolioAnalytics from '../components/portfolio/PortfolioAnalytics'

type Tab = 'holdings' | 'analytics' | 'returns' | 'pl-report' | 'transactions' | 'dividends' | 'import' | 'reconcile'

const TABS: { id: Tab; label: string }[] = [
  { id: 'holdings',     label: 'Holdings' },
  { id: 'analytics',   label: 'Analytics' },
  { id: 'returns',      label: 'Returns' },
  { id: 'pl-report',   label: 'P&L Report' },
  { id: 'transactions', label: 'Transactions' },
  { id: 'dividends',   label: 'Dividends' },
  { id: 'import',      label: 'Import Data' },
  { id: 'reconcile',   label: 'Reconcile' },
]

export default function Portfolio() {
  const { user } = useAuthStore()
  const isAdmin = user?.role === 'admin'
  const [tab, setTab]             = useState<Tab>('holdings')
  const [folios, setFolios]       = useState<Folio[]>([])
  const [selectedFolio, setSelectedFolio] = useState<number | null>(null)  // null = All
  const [consolidated, setConsolidated]   = useState(false)
  const [showExited, setShowExited]       = useState(false)
  const [summary, setSummary]     = useState<FolioSummary | ConsolidatedSummary | null>(null)
  const [loadingSummary, setLoadingSummary] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [newFolioName, setNewFolioName] = useState('')
  const [creatingFolio, setCreatingFolio] = useState(false)
  const [showNewFolio, setShowNewFolio] = useState(false)
  const [deletingFolio, setDeletingFolio] = useState<number | null>(null)
  const [symbolMap, setSymbolMap] = useState<Record<string, { id: number; name: string }>>({})

  async function loadFolios() {
    try {
      const res = await portfolioApi.folios()
      setFolios(res.data)
    } catch {
      // no folios yet
    }
  }

  async function handleDeleteFolio(id: number, name: string) {
    if (!confirm(`Delete folio "${name}"? This cannot be undone.`)) return
    setDeletingFolio(id)
    try {
      await portfolioApi.deleteFolio(id)
      if (selectedFolio === id) setSelectedFolio(null)
      await loadFolios()
    } catch (e: unknown) {
      alert((e as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Failed to delete folio')
    } finally {
      setDeletingFolio(null)
    }
  }

  async function handleCreateFolio() {
    const name = newFolioName.trim()
    if (!name) return
    setCreatingFolio(true)
    try {
      await portfolioApi.createFolio(name)
      setNewFolioName('')
      setShowNewFolio(false)
      await loadFolios()
    } catch (e: unknown) {
      alert((e as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Failed to create folio')
    } finally {
      setCreatingFolio(false)
    }
  }

  async function loadSummary() {
    setLoadingSummary(true)
    try {
      const params: Parameters<typeof portfolioApi.summary>[0] = {
        consolidated: consolidated || selectedFolio === null,
        include_exited: showExited,
      }
      if (selectedFolio !== null) params.folio_id = selectedFolio
      const res = await portfolioApi.summary(params)
      // API returns either a single summary or array; normalize
      const data = res.data
      if (Array.isArray(data)) {
        // Multiple folios returned — wrap as consolidated-style
        const total_investment     = data.reduce((s: number, f: FolioSummary) => s + f.total_investment, 0)
        const total_dividend       = data.reduce((s: number, f: FolioSummary) => s + (f.total_dividend ?? 0), 0)
        const trailing_12m_dividend = data.reduce((s: number, f: FolioSummary) => s + (f.trailing_12m_dividend ?? 0), 0)
        const current_value        = data.reduce((s: number, f: FolioSummary) => s + f.current_value, 0)
        const total_gain           = current_value - total_investment
        const total_gain_pct       = total_investment ? (total_gain / total_investment * 100) : 0
        const allHoldings = data.flatMap((f: FolioSummary) => f.holdings)
        setSummary({ folio_id: 0, folio_name: 'All', total_investment, total_dividend, trailing_12m_dividend, current_value, total_gain, total_gain_pct, xirr_pct: null, div_xirr_pct: null, cagr_pct: null, holdings: allHoldings, consolidated: true, folios: data } as ConsolidatedSummary)
      } else {
        setSummary(data)
      }
    } catch {
      setSummary(null)
    } finally {
      setLoadingSummary(false)
    }
  }

  async function handleRefreshQuotes() {
    setRefreshing(true)
    try {
      await portfolioApi.refreshQuotes()
      await loadSummary()
    } finally {
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadFolios()
    companiesApi.symbolMap().then((res) => setSymbolMap(res.data)).catch(() => {})
  }, [])
  useEffect(() => {
    if (tab === 'holdings') loadSummary()
  }, [tab, selectedFolio, consolidated, showExited]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border bg-surface">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-lg font-semibold text-ink">Portfolio Tracker</h1>
            <p className="text-xs text-ink3 mt-0.5">Multi-folio holdings, P&L and IRR analysis</p>
          </div>
          {/* Tab bar */}
          <div className="flex gap-1 overflow-x-auto flex-shrink-0">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={clsx('px-4 py-1.5 text-sm rounded transition-colors',
                  tab === t.id ? 'bg-accent text-white' : 'text-ink2 hover:bg-surface2'
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile folio selector */}
      <div className="md:hidden px-3 pt-3 bg-surface border-b border-border">
        <select
          value={selectedFolio ?? ''}
          onChange={(e) => {
            const val = e.target.value === '' ? null : Number(e.target.value)
            setSelectedFolio(val)
            setConsolidated(val === null)
          }}
          className="w-full px-3 py-2 text-sm border border-border rounded bg-white focus:outline-none focus:border-accent mb-3"
        >
          <option value="">All</option>
          {folios.map((f) => (
            <option key={f.id} value={f.id}>{f.name}</option>
          ))}
        </select>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Folio sidebar — desktop only */}
        <div className="hidden md:flex w-40 border-r border-border bg-surface2 flex-shrink-0 py-3 flex-col">
          <div className="px-3 mb-2 flex items-center justify-between">
            <p className="text-xs font-medium text-ink3 uppercase tracking-wide">Folio</p>
            {isAdmin && (
              <button
                onClick={() => setShowNewFolio((p) => !p)}
                className="text-ink3 hover:text-accent text-base leading-none"
                title="Add folio"
              >
                +
              </button>
            )}
          </div>

          {showNewFolio && (
            <div className="px-2 mb-2 space-y-1">
              <input
                autoFocus
                type="text"
                placeholder="Folio name"
                className="w-full border border-border rounded px-2 py-1 text-xs bg-white"
                value={newFolioName}
                onChange={(e) => setNewFolioName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreateFolio()
                  if (e.key === 'Escape') { setShowNewFolio(false); setNewFolioName('') }
                }}
              />
              <button
                onClick={handleCreateFolio}
                disabled={creatingFolio || !newFolioName.trim()}
                className="w-full py-1 bg-accent text-white text-xs rounded disabled:opacity-50"
              >
                {creatingFolio ? 'Adding…' : 'Add'}
              </button>
            </div>
          )}

          {[{ id: null, name: 'All' }, ...folios].map((f) => (
            <div key={f.id ?? 'all'} className="group relative flex items-center">
              <button
                onClick={() => {
                  setSelectedFolio(f.id)
                  setConsolidated(f.id === null)
                }}
                className={clsx(
                  'flex-1 text-left px-3 py-2 text-sm transition-colors',
                  selectedFolio === f.id
                    ? 'bg-accent text-white'
                    : 'text-ink hover:bg-border'
                )}
              >
                {f.name}
              </button>
              {f.id !== null && isAdmin && (
                <button
                  onClick={() => handleDeleteFolio(f.id as number, f.name)}
                  disabled={deletingFolio === f.id}
                  className={clsx(
                    'absolute right-2 opacity-0 group-hover:opacity-100 transition-opacity text-xs px-1',
                    selectedFolio === f.id ? 'text-white/70 hover:text-white' : 'text-ink3 hover:text-red'
                  )}
                  title="Delete folio"
                >
                  {deletingFolio === f.id ? '…' : '✕'}
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Main content */}
        <div className="flex-1 overflow-auto p-3 md:p-6">
          {tab === 'holdings' && (
            <div className="space-y-4">
              {/* Controls */}
              <div className="flex gap-3 flex-wrap items-center">
                <div className="flex gap-1 bg-surface2 rounded p-0.5">
                  {[false, true].map((ex) => (
                    <button
                      key={String(ex)}
                      onClick={() => setShowExited(ex)}
                      className={clsx('px-3 py-1 text-xs rounded transition-colors',
                        showExited === ex ? 'bg-white shadow text-ink font-medium' : 'text-ink3'
                      )}
                    >
                      {ex ? 'Exited' : 'Active'}
                    </button>
                  ))}
                </div>
                {selectedFolio === null && (
                  <label className="flex items-center gap-2 text-xs text-ink2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={consolidated}
                      onChange={(e) => setConsolidated(e.target.checked)}
                      className="rounded"
                    />
                    Consolidated view
                  </label>
                )}
              </div>

              {loadingSummary ? (
                <div className="py-12 text-center text-ink3 text-sm">Loading portfolio…</div>
              ) : (
                <PortfolioGrid
                  summary={summary as FolioSummary}
                  showExited={showExited}
                  consolidated={consolidated || selectedFolio === null}
                  onRefresh={handleRefreshQuotes}
                  refreshing={refreshing}
                  symbolMap={symbolMap}
                />
              )}
            </div>
          )}

          {tab === 'analytics' && (
            <PortfolioAnalytics folios={folios} selectedFolio={selectedFolio} symbolMap={symbolMap} />
          )}

          {tab === 'returns' && (
            <ReturnsReport folios={folios} selectedFolio={selectedFolio} />
          )}

          {tab === 'pl-report' && <PLReport folios={folios} />}

          {tab === 'transactions' && <TransactionLedger folios={folios} canAdd={true} canDelete={isAdmin} />}

          {tab === 'dividends' && <DividendLedger folios={folios} />}

          {tab === 'import' && (
            <BulkUpload onSuccess={() => {
              loadFolios()
            }} />
          )}

          {tab === 'reconcile' && <Reconcile folios={folios} />}
        </div>
      </div>
    </div>
  )
}
