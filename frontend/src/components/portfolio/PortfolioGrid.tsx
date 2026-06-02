import { useMemo, useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { portfolioApi } from '../../api/client'
import {
  useReactTable, getCoreRowModel, getSortedRowModel,
  getFilteredRowModel, getPaginationRowModel,
  flexRender, type ColumnDef, type SortingState,
} from '@tanstack/react-table'
import clsx from 'clsx'
import type { HoldingRow, FolioSummary } from '../../types'

const LS_KEY = 'm3_portfolio_col_order'

const fmt = (v: number | null, dec = 2) =>
  v === null || v === undefined ? '—' : v.toLocaleString('en-IN', { minimumFractionDigits: dec, maximumFractionDigits: dec })

const fmtCr = (v: number | null) =>
  v === null ? '—' : v >= 10_000_000 ? `₹${(v / 10_000_000).toFixed(1)}Cr` : `₹${(v / 100_000).toFixed(1)}L`

const PnlCell = ({ v, pct }: { v: number | null; pct: number | null }) => {
  if (v === null) return <span className="text-ink3">—</span>
  return (
    <div>
      <div className={clsx('font-mono text-xs font-medium', v > 0 ? 'text-green' : v < 0 ? 'text-red' : 'text-ink2')}>
        {v > 0 ? '+' : v < 0 ? '-' : ''}{fmtCr(Math.abs(v))}
      </div>
      {pct !== null && (
        <div className={clsx('font-mono text-2xs', v > 0 ? 'text-green' : v < 0 ? 'text-red' : 'text-ink3')}>
          {v > 0 ? '+' : ''}{pct.toFixed(1)}%
        </div>
      )}
    </div>
  )
}

const XirrCell = ({ v }: { v: number | null }) => {
  if (v === null) return <span className="text-ink3 font-mono text-xs">—</span>
  return (
    <span className={clsx('font-mono text-xs font-medium', v > 15 ? 'text-green' : v > 0 ? 'text-ink' : 'text-red')}>
      {v > 0 ? '+' : ''}{v.toFixed(1)}%
    </span>
  )
}

const ALL_ACTIVE_COL_IDS = [
  'symbol', 'folio_name', 'sector', 'net_qty', 'avg_price', 'cmp',
  'total_investment', 'current_value', 'unrealised_pnl',
  'xirr_pct', 'div_xirr_pct', 'cagr_pct', 'total_dividend', 'portfolio_pct', 'day_change_pct', 'since',
]

function loadOrder(): string[] {
  try {
    const saved = localStorage.getItem(LS_KEY)
    if (saved) {
      const parsed: string[] = JSON.parse(saved)
      const merged = parsed.filter((id) => ALL_ACTIVE_COL_IDS.includes(id))
      ALL_ACTIVE_COL_IDS.forEach((id) => { if (!merged.includes(id)) merged.push(id) })
      return merged
    }
  } catch { /* ignore */ }
  return [...ALL_ACTIVE_COL_IDS]
}

interface Props {
  summary: FolioSummary | null
  showExited: boolean
  consolidated: boolean
  onRefresh: () => void
  refreshing: boolean
  symbolMap?: Record<string, { id: number; name: string }>
}

export default function PortfolioGrid({ summary, showExited, consolidated, onRefresh, refreshing, symbolMap = {} }: Props) {
  const navigate = useNavigate()
  const [sorting, setSorting] = useState<SortingState>([{ id: 'current_value', desc: true }])
  const [editingSector, setEditingSector] = useState<{ assetId: number; value: string } | null>(null)
  const [editingSymbol, setEditingSymbol] = useState<number | null>(null)
  const [columnOrder, setColumnOrder] = useState<string[]>(loadOrder)

  const dragCol = useRef<string | null>(null)
  const dragOverCol = useRef<string | null>(null)

  const onDragStart = useCallback((colId: string) => { dragCol.current = colId }, [])
  const onDragOver = useCallback((e: React.DragEvent, colId: string) => {
    e.preventDefault()
    dragOverCol.current = colId
  }, [])
  const onDrop = useCallback(() => {
    const from = dragCol.current
    const to = dragOverCol.current
    if (!from || !to || from === to) return
    setColumnOrder((prev) => {
      const next = [...prev]
      const fi = next.indexOf(from)
      const ti = next.indexOf(to)
      next.splice(fi, 1)
      next.splice(ti, 0, from)
      localStorage.setItem(LS_KEY, JSON.stringify(next))
      return next
    })
    dragCol.current = null
    dragOverCol.current = null
  }, [])

  const data = useMemo(() => {
    if (!summary) return []
    const src = 'holdings' in summary ? summary.holdings : []
    return src.filter((h: HoldingRow) => showExited ? h.is_exited : !h.is_exited)
  }, [summary, showExited])

  const activeColumns = useMemo<ColumnDef<HoldingRow>[]>(() => [
    {
      id: 'symbol',
      header: 'Symbol',
      accessorKey: 'symbol',
      size: 130,
      cell: ({ row }) => {
        const sym = row.original.symbol
        const assetId = row.original.asset_id
        const isEditing = editingSymbol === assetId
        if (isEditing) {
          return (
            <input
              autoFocus
              className="w-full border border-accent rounded px-1 py-0.5 text-xs font-mono bg-surface"
              defaultValue={sym}
              onBlur={async (e) => {
                const newSym = e.target.value.trim().toUpperCase()
                setEditingSymbol(null)
                if (newSym && newSym !== sym) {
                  await portfolioApi.updateAsset(assetId, { symbol: newSym })
                  onRefresh()
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
                if (e.key === 'Escape') { e.preventDefault(); setEditingSymbol(null) }
              }}
            />
          )
        }
        return (
          <div className="group flex items-start gap-1">
            <div>
              <div className="font-medium text-sm text-accent font-mono">{sym}</div>
              <div className="text-2xs text-ink3 truncate max-w-[100px]">{row.original.asset_name}</div>
            </div>
            <button
              className="mt-0.5 opacity-0 group-hover:opacity-100 text-ink3 hover:text-accent transition-opacity"
              title="Edit NSE/BSE symbol"
              onClick={(e) => { e.stopPropagation(); setEditingSymbol(assetId) }}
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
          </div>
        )
      },
    },
    ...(consolidated ? [{
      id: 'folio_name',
      header: 'Folios',
      size: 110,
      cell: ({ row }: { row: { original: HoldingRow } }) => (
        <span className="text-xs text-ink2">{row.original.folio_name}</span>
      ),
    } as ColumnDef<HoldingRow>] : [{
      id: 'folio_name',
      header: 'Folio',
      accessorKey: 'folio_name',
      size: 80,
      cell: ({ getValue }: { getValue: () => unknown }) => <span className="text-xs text-ink2">{getValue() as string}</span>,
    } as ColumnDef<HoldingRow>]),
    {
      id: 'sector', header: 'Sector', accessorKey: 'sector', size: 130,
      cell: ({ row }) => {
        const assetId = row.original.asset_id
        const sector = (row.original.sector as string | null) || ''
        const isEditing = editingSector?.assetId === assetId
        if (isEditing) {
          return (
            <input
              autoFocus
              className="w-full border border-accent rounded px-1 py-0.5 text-xs bg-surface"
              value={editingSector!.value}
              onChange={(e) => setEditingSector({ assetId, value: e.target.value })}
              onBlur={async () => {
                await portfolioApi.updateAsset(assetId, { sector: editingSector!.value })
                onRefresh()
                setEditingSector(null)
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
                if (e.key === 'Escape') setEditingSector(null)
              }}
            />
          )
        }
        return (
          <span
            className="text-xs text-ink3 cursor-pointer hover:text-accent hover:underline"
            title="Click to edit sector"
            onClick={() => setEditingSector({ assetId, value: sector })}
          >
            {sector || <span className="text-ink3/50 italic">Unknown</span>}
          </span>
        )
      },
    },
    { id: 'net_qty', header: 'Qty', accessorKey: 'net_qty', size: 80, cell: ({ getValue }) => <span className="font-mono text-xs">{fmt(getValue() as number, 0)}</span> },
    { id: 'avg_price', header: 'Avg Price', accessorKey: 'avg_price', size: 80, cell: ({ getValue }) => <span className="font-mono text-xs">₹{fmt(getValue() as number)}</span> },
    { id: 'cmp', header: 'CMP', accessorKey: 'cmp', size: 80, cell: ({ getValue }) => <span className="font-mono text-xs">{getValue() !== null ? `₹${fmt(getValue() as number)}` : '—'}</span> },
    {
      id: 'total_investment',
      header: 'Invested',
      accessorKey: 'total_investment',
      size: 100,
      cell: ({ getValue }) => <span className="font-mono text-xs">{fmtCr(getValue() as number)}</span>,
    },
    {
      id: 'current_value',
      header: 'Current',
      accessorKey: 'current_value',
      size: 100,
      cell: ({ getValue }) => <span className="font-mono text-xs">{fmtCr(getValue() as number | null)}</span>,
    },
    {
      id: 'unrealised_pnl',
      header: 'Unrlsd P&L',
      size: 110,
      accessorFn: (row) => row.unrealised_pnl,
      cell: ({ row }) => <PnlCell v={row.original.unrealised_pnl} pct={row.original.unrealised_pnl_pct} />,
    },
    { id: 'xirr_pct', header: 'XIRR%', accessorKey: 'xirr_pct', size: 80, cell: ({ getValue }) => <XirrCell v={getValue() as number | null} /> },
    { id: 'div_xirr_pct', header: 'XIRR+Div%', accessorKey: 'div_xirr_pct', size: 90,
      cell: ({ getValue, row }) => {
        const v = getValue() as number | null
        const base = row.original.xirr_pct
        if (v === null) return <span className="text-ink3 font-mono text-xs">—</span>
        const delta = base !== null ? v - base : null
        return (
          <div>
            <XirrCell v={v} />
            {delta !== null && Math.abs(delta) > 0.05 && (
              <div className={clsx('font-mono text-2xs', delta > 0 ? 'text-green' : 'text-red')}>
                {delta > 0 ? '+' : ''}{delta.toFixed(1)}% vs XIRR
              </div>
            )}
          </div>
        )
      }
    },
    { id: 'cagr_pct', header: 'CAGR%', accessorKey: 'cagr_pct', size: 80, cell: ({ getValue }) => <XirrCell v={getValue() as number | null} /> },
    { id: 'total_dividend', header: 'Dividends', accessorKey: 'total_dividend', size: 90,
      cell: ({ getValue }) => {
        const v = getValue() as number
        if (!v || v === 0) return <span className="text-ink3 text-xs font-mono">—</span>
        return <span className="font-mono text-xs text-ink">{fmtCr(v)}</span>
      }
    },
    {
      id: 'portfolio_pct',
      header: 'Port%',
      accessorKey: 'portfolio_pct',
      size: 65,
      cell: ({ getValue }) => {
        const v = getValue() as number
        return <span className="font-mono text-xs text-ink2">{v?.toFixed(1)}%</span>
      },
    },
    {
      id: 'day_change_pct',
      header: '1D%',
      accessorKey: 'day_change_pct',
      size: 60,
      cell: ({ getValue }) => {
        const v = getValue() as number | null
        if (!v) return <span className="text-ink3 text-xs">—</span>
        return <span className={clsx('font-mono text-xs', v > 0 ? 'text-green' : 'text-red')}>{v > 0 ? '+' : ''}{v.toFixed(2)}%</span>
      },
    },
    {
      id: 'since',
      header: 'Since',
      accessorKey: 'first_purchase_date',
      size: 80,
      cell: ({ getValue }) => {
        const d = getValue() as string | null
        return <span className="text-2xs text-ink3">{d ? d.substring(0, 10) : '—'}</span>
      },
    },
  ], [consolidated, editingSector, editingSymbol, onRefresh, symbolMap, navigate]) // eslint-disable-line react-hooks/exhaustive-deps

  const exitedColumns = useMemo<ColumnDef<HoldingRow>[]>(() => [
    { header: 'Symbol', accessorKey: 'symbol', size: 110, cell: ({ row }) => (
      <div>
        <div className="font-medium text-sm">{row.original.symbol}</div>
        <div className="text-2xs text-ink3">{row.original.asset_name}</div>
      </div>
    )},
    { header: 'Folio', accessorKey: 'folio_name', size: 90, cell: ({ getValue }) => <span className="text-xs text-ink2">{getValue() as string}</span> },
    { header: 'Invested', accessorKey: 'total_investment', size: 100, cell: ({ getValue }) => <span className="font-mono text-xs">{fmtCr(getValue() as number)}</span> },
    {
      header: 'Realised P&L',
      id: 'realised_pnl',
      size: 120,
      accessorFn: (row) => row.realised_pnl,
      cell: ({ row }) => <PnlCell v={row.original.realised_pnl} pct={row.original.realised_pnl_pct} />,
    },
    { header: 'Exited', accessorKey: 'last_exit_date', size: 90, cell: ({ getValue }) => <span className="text-2xs text-ink3">{(getValue() as string | null)?.substring(0, 10) ?? '—'}</span> },
  ], [])

  const table = useReactTable({
    data,
    columns: showExited ? exitedColumns : activeColumns,
    state: { sorting, ...(!showExited && { columnOrder }) },
    onSortingChange: setSorting,
    ...(!showExited && {
      onColumnOrderChange: (updater: string[] | ((old: string[]) => string[])) => {
        const next = typeof updater === 'function' ? updater(columnOrder) : updater
        setColumnOrder(next)
        localStorage.setItem(LS_KEY, JSON.stringify(next))
      },
    }),
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 30 } },
  })

  if (!summary) return <div className="text-ink3 text-sm p-8 text-center">No portfolio data. Upload transactions to get started.</div>

  const totalInvested = summary.total_investment
  const totalCurrent  = summary.current_value
  const totalGain     = summary.total_gain
  const gainPct       = summary.total_gain_pct
  const totalDiv      = (summary as FolioSummary).total_dividend ?? 0
  const trailing12m   = (summary as FolioSummary).trailing_12m_dividend ?? 0
  const divYieldPct   = totalCurrent > 0 ? (trailing12m / totalCurrent * 100) : 0
  const divXirr       = (summary as FolioSummary).div_xirr_pct ?? null

  return (
    <div className="space-y-4">
      {/* Summary Cards — 3×2 grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {[
          { label: 'Total Invested', value: fmtCr(totalInvested) },
          { label: 'Current Value', value: fmtCr(totalCurrent) },
          { label: 'Unrealised P&L', value: `${totalGain >= 0 ? '+' : ''}${fmtCr(totalGain)} (${gainPct >= 0 ? '+' : ''}${gainPct.toFixed(1)}%)`, color: totalGain >= 0 ? 'text-green' : 'text-red' },
          { label: 'Portfolio XIRR', value: summary.xirr_pct !== null ? `${summary.xirr_pct > 0 ? '+' : ''}${summary.xirr_pct.toFixed(1)}%` : '—', color: (summary.xirr_pct ?? 0) >= 0 ? 'text-green' : 'text-red' },
          {
            label: 'XIRR (incl. Dividends)',
            value: divXirr !== null ? `${divXirr > 0 ? '+' : ''}${divXirr.toFixed(1)}%` : (totalDiv > 0 ? '—' : 'Sync dividends tab'),
            sub: divXirr !== null && summary.xirr_pct !== null ? `${divXirr > summary.xirr_pct ? '+' : ''}${(divXirr - summary.xirr_pct).toFixed(1)}% vs price-only` : undefined,
            color: divXirr !== null ? (divXirr >= 0 ? 'text-green' : 'text-red') : 'text-ink3',
          },
          {
            label: 'Dividends Rcvd',
            value: totalDiv > 0 ? fmtCr(totalDiv) : '—',
            sub: totalDiv > 0 ? `${divYieldPct.toFixed(2)}% yield (trailing 12m)` : 'Sync dividends tab',
            color: totalDiv > 0 ? 'text-ink' : 'text-ink3',
          },
        ].map((c) => (
          <div key={c.label} className="bg-surface border border-border rounded-lg px-4 py-3">
            <div className="text-xs text-ink3 mb-1">{c.label}</div>
            <div className={clsx('font-mono font-semibold text-sm', (c as { color?: string }).color ?? 'text-ink')}>{c.value}</div>
            {(c as { sub?: string }).sub && <div className="text-2xs text-ink3 mt-0.5">{(c as { sub?: string }).sub}</div>}
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xs text-ink3">{data.length} {showExited ? 'exited' : 'active'} positions</span>
        <button
          onClick={onRefresh}
          disabled={refreshing}
          className="px-3 py-1.5 text-xs bg-accent text-white rounded hover:bg-accent/90 disabled:opacity-50"
        >
          {refreshing ? 'Refreshing…' : 'Refresh Prices'}
        </button>
      </div>

      {/* Mobile card list — active holdings only */}
      {!showExited && (
        <div className="md:hidden space-y-2">
          {data.length === 0 ? (
            <div className="text-center text-ink3 text-sm py-8">No active positions.</div>
          ) : (
            data.map((row) => {
              const mobileCompany = symbolMap[row.symbol]
              return (
              <div key={row.asset_id} className="bg-surface border border-border rounded-lg px-4 py-3">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div
                    className={`min-w-0 ${mobileCompany ? 'cursor-pointer' : ''}`}
                    onClick={mobileCompany ? () => navigate(`/company/${mobileCompany.id}`) : undefined}
                  >
                    <div className={`font-medium text-sm text-accent ${mobileCompany ? 'hover:underline' : ''}`}>{row.symbol}</div>
                    <div className="text-2xs text-ink3 truncate">{row.asset_name}</div>
                  </div>
                  {row.unrealised_pnl_pct !== null && (
                    <span className={clsx('font-mono text-xs font-semibold flex-shrink-0', (row.unrealised_pnl ?? 0) >= 0 ? 'text-green' : 'text-red')}>
                      {(row.unrealised_pnl ?? 0) >= 0 ? '+' : ''}{row.unrealised_pnl_pct.toFixed(1)}%
                    </span>
                  )}
                </div>
                <div className="flex gap-4 text-xs">
                  <div>
                    <div className="text-ink3 text-2xs mb-0.5">CMP</div>
                    <div className="font-mono font-medium">{row.cmp !== null ? `₹${fmt(row.cmp, 0)}` : '—'}</div>
                  </div>
                  <div>
                    <div className="text-ink3 text-2xs mb-0.5">1D</div>
                    <div className={clsx('font-mono font-medium', row.day_change_pct === null ? 'text-ink3' : row.day_change_pct > 0 ? 'text-green' : row.day_change_pct < 0 ? 'text-red' : 'text-ink2')}>
                      {row.day_change_pct !== null ? `${row.day_change_pct > 0 ? '+' : ''}${row.day_change_pct.toFixed(2)}%` : '—'}
                    </div>
                  </div>
                  <div>
                    <div className="text-ink3 text-2xs mb-0.5">Current</div>
                    <div className="font-mono font-medium">{fmtCr(row.current_value)}</div>
                  </div>
                  <div>
                    <div className="text-ink3 text-2xs mb-0.5">XIRR</div>
                    <div className={clsx('font-mono font-medium', row.xirr_pct === null ? 'text-ink3' : row.xirr_pct > 15 ? 'text-green' : row.xirr_pct > 0 ? 'text-ink' : 'text-red')}>
                      {row.xirr_pct !== null ? `${row.xirr_pct > 0 ? '+' : ''}${row.xirr_pct.toFixed(1)}%` : '—'}
                    </div>
                  </div>
                </div>
              </div>
            )})
          )}
        </div>
      )}

      {/* Desktop Table */}
      <div className={showExited ? '' : 'hidden md:block'}>
        <div className="bg-surface border border-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                {table.getHeaderGroups().map((hg) => (
                  <tr key={hg.id} className="border-b border-border bg-surface2">
                    {hg.headers.map((header) => (
                      <th
                        key={header.id}
                        draggable={!showExited}
                        onDragStart={() => onDragStart(header.column.id)}
                        onDragOver={(e) => onDragOver(e, header.column.id)}
                        onDrop={onDrop}
                        style={{ width: header.getSize() }}
                        className={clsx(
                          'px-3 py-2.5 text-left text-xs font-medium text-ink3 whitespace-nowrap select-none hover:text-ink',
                          showExited ? 'cursor-pointer' : 'cursor-grab active:cursor-grabbing hover:bg-border/40'
                        )}
                        onClick={header.column.getToggleSortingHandler()}
                        title={showExited ? 'Click to sort' : 'Drag to reorder · Click to sort'}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getIsSorted() === 'asc' ? ' ↑' : header.column.getIsSorted() === 'desc' ? ' ↓' : ''}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {table.getRowModel().rows.map((row) => (
                  <tr key={row.id} className="border-b border-border/50 hover:bg-accent-light/20 transition-colors">
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-3 py-2">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
                {table.getRowModel().rows.length === 0 && (
                  <tr>
                    <td colSpan={100} className="px-4 py-10 text-center text-ink3 text-sm">
                      No {showExited ? 'exited' : 'active'} positions found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {table.getPageCount() > 1 && (
            <div className="flex items-center justify-between px-4 py-2.5 border-t border-border bg-surface2 text-xs text-ink3">
              <span>Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}</span>
              <div className="flex gap-2">
                <button onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()} className="px-2 py-1 border border-border rounded disabled:opacity-40">Previous</button>
                <button onClick={() => table.nextPage()} disabled={!table.getCanNextPage()} className="px-2 py-1 border border-border rounded disabled:opacity-40">Next</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
