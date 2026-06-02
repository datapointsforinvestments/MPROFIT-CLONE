import { useState } from 'react'
import { portfolioApi } from '../../api/client'

interface Props {
  onMenuOpen: () => void
}

export default function TopBar({ onMenuOpen }: Props) {
  const [refreshing, setRefreshing] = useState(false)

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await portfolioApi.refreshQuotes()
      window.location.reload()
    } finally {
      setRefreshing(false)
    }
  }

  return (
    <div className="h-12 bg-surface border-b border-border flex items-center justify-between px-3 md:px-6 flex-shrink-0">
      {/* Hamburger — mobile only */}
      <button
        onClick={onMenuOpen}
        className="md:hidden p-1.5 rounded hover:bg-surface2 text-ink3 hover:text-ink transition-colors"
        aria-label="Open menu"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      <div className="hidden md:block text-sm text-ink3">M3 Family Office — Portfolio Tracker</div>

      <div className="flex items-center gap-2">
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="btn-secondary text-xs py-1.5"
        >
          {refreshing ? 'Refreshing...' : 'Refresh Prices'}
        </button>
      </div>
    </div>
  )
}
