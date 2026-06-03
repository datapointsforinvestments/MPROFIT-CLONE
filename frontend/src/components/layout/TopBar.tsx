import { useState } from 'react'
import { portfolioApi } from '../../api/client'
import { useAuthStore } from '../../store/authStore'

export default function TopBar() {
  const [refreshing, setRefreshing] = useState(false)
  const { user, clearAuth } = useAuthStore()

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
    <div className="h-11 bg-accent flex items-center justify-between px-4 flex-shrink-0">
      {/* Branding */}
      <div className="flex items-center gap-3">
        <div className="font-display text-white font-semibold tracking-tight">Minocha Family Office</div>
        <div className="text-white/40 text-xs hidden sm:block">· Portfolio Tracker</div>
      </div>

      {/* Actions + User */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="px-3 py-1 text-xs bg-white/10 hover:bg-white/20 text-white rounded transition-colors disabled:opacity-50"
        >
          {refreshing ? 'Refreshing…' : 'Refresh Prices'}
        </button>

        {user && (
          <div className="flex items-center gap-2 border-l border-white/20 pl-3">
            <div className="text-right hidden sm:block">
              <div className="text-white text-xs font-medium leading-none">{user.full_name || user.username}</div>
              <div className="text-white/50 text-[10px] capitalize leading-none mt-0.5">
                {user.role === 'fm' ? 'Fund Manager' : user.role}
              </div>
            </div>
            <button
              onClick={() => { clearAuth(); window.location.href = '/login' }}
              className="text-white/50 hover:text-white text-xs transition-colors"
              title="Sign out"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
